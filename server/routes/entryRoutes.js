//
/*Entry endpoints, mounted at /entry by app.js

- GET /fetchEntries - Fetch all entries for loggedIn user
- GET /fetchEntry/:id - Fetch one entry
- POST /addEntry - add a new entry
- PATCH /editEntry/:id - edit/update an entry
- DELETE /delete/:id - delete an entry

all routes require JWT Auth
*/

/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Entry = require('../models/entrySchema')
const Trip = require('../models/tripSchema')
const User = require('../models/userSchema')
const { checkJwtToken } = require('./middleware');
const router = express.Router()

/* The maxlength values entrySchema stores, listed here so an oversized
submission is reported as a 400 with one clear message rather than reaching
Mongoose as a ValidationError */
const TITLE_MAX = 150;
const BODY_MAX = 2000;

/*=====================================
ENTRY INPUT PARSING AND VALIDATION
=======================================*/
/* Reads an entry's fields off a request body and normalises them into the shape
entrySchema expects. Every rule the schema enforces is checked first, so a bad
submission is reported as a 400 with one clear message instead of a Mongoose
ValidationError.

The owner is deliberately not read here: userId and username come from the token
and the database, never from the body. The trip is identified by its id alone,
so a submitted trip title cannot disagree with the trip it is filed against: the
handler reads the title off the trip document instead.

`partial` is the difference between the two routes. A create has to carry the
whole entry, so a field that is missing is reported as missing. An edit only
carries what the form was asked to change, so a field the body does not hold at
all is left as it is stored, while one that is present is checked the same way it
would be on a create — a blank title is a blank title in both, and is refused
rather than written over a stored one.

Returns `{ message }` describing the first problem found, or the normalised entry
fields when the input is usable — on an edit, only the ones the body supplied. */
const parseEntryInput = (submission = {}, { partial = false } = {}) => {
    const { tripId, title, body, date } = submission;
    const input = {};

    // ---- THE TRIP ------------------------------------------------------
    if (!partial || tripId !== undefined) {
        const entryTripId = String(tripId ?? '').trim();

        // Conditional rendering to check a trip was selected
        if (!entryTripId) {
            return { message: 'Please select the trip this entry belongs to' };
        }
        /* Checked before the trip is looked up, so a malformed id is reported as a
        400 rather than reaching Mongoose as a CastError and being reported as a 500 */
        if (!mongoose.Types.ObjectId.isValid(entryTripId)) {
            return { message: 'The selected trip is not valid' };
        }

        input.tripId = entryTripId;
    }

    // ---- THE TITLE -----------------------------------------------------
    if (!partial || title !== undefined) {
        const entryTitle = String(title ?? '').trim();
        // Conditional rendering to check the title was supplied, and is short enough to store
        if (!entryTitle) {
            return { message: 'Entry title is required' };
        }
        if (entryTitle.length > TITLE_MAX) {
            return { message: `Entry title cannot exceed ${TITLE_MAX} characters` };
        }

        input.title = entryTitle;
    }

    // ---- THE DETAILS ---------------------------------------------------
    if (!partial || body !== undefined) {
        /* Not trimmed into storage, the schema keeps the body as it was written, but
        a body of nothing but whitespace still counts as empty */
        const entryBody = String(body ?? '');
        // Conditional rendering to check the entry details were supplied, and are short enough to store
        if (!entryBody.trim()) {
            return { message: 'Entry details are required' };
        }
        if (entryBody.length > BODY_MAX) {
            return { message: `Entry details cannot exceed ${BODY_MAX} characters` };
        }

        input.body = entryBody;
    }

    // ---- THE DATE ------------------------------------------------------
    if (!partial || date !== undefined) {
        /* Converted before it is stored, so a value the browser never validated,
        such as one sent straight to the API, is caught here rather than reaching
        Mongoose as a CastError and being reported as a 500 */
        const entryDate = new Date(date);
        if (!date || Number.isNaN(entryDate.getTime())) {
            return { message: 'A valid entry date is required' };
        }

        input.date = entryDate;
    }

    return input;
}

/*=====================================
VALIDATION ERROR SHAPING
=======================================*/
/* Mongoose collects every failed field rule into one ValidationError.
parseEntryInput checks the same rules first, so this is only reached by a value
only the schema can judge. Flattened into a field keyed object so the form can
show each message against the input that caused it.

The keys are the schema's own paths — 'title', 'body', 'date' — and both entry
forms name each input by that path, so nothing has to be translated on the way
through. */
const validationErrors = (error) => Object.fromEntries(
    Object.entries(error.errors).map(([field, err]) => [field, err.message])
);

// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
READ EVERY ENTRY THE LOGGED IN USER HAS WRITTEN
=======================================*/
/* entry/fetchEntries - Lists every journal entry belonging to the logged in
user, newest first */
router.get('/fetchEntries', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;// Extract the userId from the decoded JWT token payload

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: entryRoutes.js, GET /fetchEntries] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        /* Sorted newest first, the order the entries of one trip are already
        read back in by GET /trip/fetchTrip/:id, so the journal reads the same
        way whichever route filled it */
        const entries = await Entry.find({ userId }).sort({ date: -1 }).exec();

        console.log(`[SUCCESS: entryRoutes.js, GET /fetchEntries] Found ${entries.length} entries for user ${userId}`);// Log a success message in the console for debugging purposes
        return res.status(200).json({ success: true, count: entries.length, entries });// Respond with a 200 (OK) status code and the list of entries
    } catch (error) {
        console.error('[ERROR: entryRoutes.js, GET /fetchEntries]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})
// entry/fetchEntry/:id - Fetch one entry
/*──────────────────────────── POST ROUTES ─────────────────────────────────────
   POST: CREATE — Used to send information to the server
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
CREATE AN ENTRY
=======================================*/
/* entry/addEntry - Creates one journal entry for the logged in user.
The owner is taken from the JWT and the username is read from the database.*/
router.post('/addEntry', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: entryRoutes.js, POST /addEntry] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const input = parseEntryInput(req.body);// Extract and normalise the entry fields from the request body

        // Conditional rendering to check the submitted entry is usable
        if (input.message) {
            console.warn('[WARN: entryRoutes.js, POST /addEntry]', input.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: input.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        /* The username is stored on the entry as well as the id, so read from the
        Doubles as a check that the user on the token still exists */
        const user = await User.findById(userId).select('username').exec();

        // Conditional rendering to check the user on the token still exists
        if (!user) {
            console.warn('[WARN: entryRoutes.js, POST /addEntry] No user found for id', userId);// Log a warning message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });// Respond with a 401 (Unauthorised) status code
        }

        /* Matched on the id and the owner together, so a trip belonging to
        another account is not found at all rather than found and then refused */
        const trip = await Trip.findOne({ _id: input.tripId, userId: user._id })
            .select('title')
            .exec();

        // Conditional rendering to check the trip exists and belongs to this user
        if (!trip) {
            console.warn('[WARN: entryRoutes.js, POST /addEntry] No trip found for id', input.tripId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'The selected trip could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        const newEntry = await Entry.create({
            tripId: trip._id,
            // Read off the trip document, so it always matches the trip it is filed against
            trip: trip.title,
            userId: user._id,
            username: user.username,
            title: input.title,
            body: input.body,
            date: input.date,
        })

        console.log('[SUCCESS: entryRoutes.js, POST /addEntry] Entry created:', newEntry._id);// Log a success message in the console for debugging purposes
        return res.status(201).json({ success: true, message: 'Entry added successfully.', entry: newEntry });// Respond with a 201 (Created) status code and the new entry object
    } catch (error) {
        // Raised by a rule only the schema can judge, reported against its field
        if (error.name === 'ValidationError') {
            const errors = validationErrors(error);
            console.error('[ERROR: entryRoutes.js, POST /addEntry] Validation failed:', errors);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'Entry could not be added, please check the highlighted fields', errors });// Respond with a 400 (Bad Request) status code
        }

        console.error('[ERROR: entryRoutes.js, POST /addEntry]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})
/*──────────────────────────── PATCH ROUTES ───────────────────────────────────
   PATCH: UPDATE — Used to partially update information in the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
EDIT AN ENTRY
=======================================*/
/* entry/editEntry/:id - Edits one of the logged in user's journal entries.
The entry is matched on its id and the owner together*/
router.patch('/editEntry/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: entryRoutes.js, PATCH /editEntry/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const entryId = String(req.params.id ?? '').trim();

        if (!mongoose.Types.ObjectId.isValid(entryId)) {
            console.warn('[WARN: entryRoutes.js, PATCH /editEntry/:id] Invalid entry id', entryId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That entry id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        const input = parseEntryInput(req.body, { partial: true });// Extract and normalise only the fields the body carries

        // Conditional rendering to check the submitted changes are usable
        if (input.message) {
            console.warn('[WARN: entryRoutes.js, PATCH /editEntry/:id]', input.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: input.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        // Conditional rendering to check the body carried something to change
        if (!Object.keys(input).length) {
            console.warn('[WARN: entryRoutes.js, PATCH /editEntry/:id] Nothing to update on entry', entryId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'There is nothing to update' });// Respond with a 400 (Bad Request) status code
        }

        //  Matched on the entry and the owner together
        const entry = await Entry.findOne({ _id: entryId, userId }).exec();

        // Conditional rendering to check an entry with that id exists on this account
        if (!entry) {
            console.warn('[WARN: entryRoutes.js, PATCH /editEntry/:id] No entry found for id', entryId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That entry could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        const changes = {};

        if (input.title !== undefined) changes.title = input.title;
        if (input.body !== undefined) changes.body = input.body;
        if (input.date !== undefined) changes.date = input.date;

        /* Only a trip that is not the one the entry is already filed against is a move*/
        const movingTrip = input.tripId !== undefined
            && String(input.tripId) !== String(entry.tripId);
        let newTrip = null;

        if (movingTrip) {
            /* Matched on the id and the owner together*/
            newTrip = await Trip.findOne({ _id: input.tripId, userId }).select('title').exec();

            // Conditional rendering to check the trip exists and belongs to this user
            if (!newTrip) {
                console.warn('[WARN: entryRoutes.js, PATCH /editEntry/:id] No trip found for id', input.tripId, 'and user', userId);// Log a warning message in the console for debugging purposes
                return res.status(404).json({ success: false, message: 'The selected trip could not be found on your account' });// Respond with a 404 (Not Found) status code
            }

            changes.tripId = newTrip._id;
            // Read off the trip document, so it always matches the trip it is filed against
            changes.trip = newTrip.title;
        }

        
        if (!Object.keys(changes).length) {
            console.warn('[WARN: entryRoutes.js, PATCH /editEntry/:id] Nothing changed on entry', entryId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'There is nothing to update' });// Respond with a 400 (Bad Request) status code
        }

        const updatedEntry = await Entry.findOneAndUpdate(
            { _id: entry._id, userId },
            { $set: changes },
            { new: true, runValidators: true, context: 'query' }
        ).exec();

        /* Conditional rendering to check the entry was still there to update, in
        case it was deleted between the read above and this write */
        if (!updatedEntry) {
            console.warn('[WARN: entryRoutes.js, PATCH /editEntry/:id] Entry', entryId, 'was gone before it could be updated');// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That entry could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        /* An entry that moved trip has to be counted against the trip it moved
        to and taken off the one it left */
        if (movingTrip) {
            await Promise.all([
                Trip.findOneAndUpdate({ _id: entry.tripId, userId }, { $inc: { entryCount: -1 } }).exec(),
                Trip.findOneAndUpdate({ _id: newTrip._id, userId }, { $inc: { entryCount: 1 } }).exec(),
            ]);
            console.log('[INFO: entryRoutes.js, PATCH /editEntry/:id] Entry', entryId, 'moved from trip', String(entry.tripId), 'to', String(newTrip._id));// Log an info message in the console for debugging purposes
        }

        console.log('[SUCCESS: entryRoutes.js, PATCH /editEntry/:id] Entry updated:', updatedEntry._id);// Log a success message in the console for debugging purposes
        return res.status(200).json({
            success: true,
            message: 'Entry updated successfully.',
            /* Returned whole, so the page can show the edited entry without
            refetching to see it */
            entry: updatedEntry,
        });// Respond with a 200 (OK) status code and the updated entry
    } catch (error) {
        // Raised by a rule only the schema can judge, reported against its field
        if (error.name === 'ValidationError') {
            const errors = validationErrors(error);
            console.error('[ERROR: entryRoutes.js, PATCH /editEntry/:id] Validation failed:', errors);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'Entry could not be updated, please check the highlighted fields', errors });// Respond with a 400 (Bad Request) status code
        }

        console.error('[ERROR: entryRoutes.js, PATCH /editEntry/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})
/*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE AN ENTRY
=======================================*/
/* entry/delete/:id - Removes one of the logged in user's journal entries.*/
router.delete('/delete/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: entryRoutes.js, DELETE /delete/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const entryId = String(req.params.id ?? '').trim();

        if (!mongoose.Types.ObjectId.isValid(entryId)) {
            console.warn('[WARN: entryRoutes.js, DELETE /delete/:id] Invalid entry id', entryId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That entry id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        const entry = await Entry.findOneAndDelete({ _id: entryId, userId }).exec();

        /* Conditional rendering to check an entry with that id existed*/
        if (!entry) {
            console.warn('[WARN: entryRoutes.js, DELETE /delete/:id] No entry found for id', entryId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That entry could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        console.log('[SUCCESS: entryRoutes.js, DELETE /delete/:id] Deleted entry', entryId, 'from trip', String(entry.tripId));// Log a success message in the console for debugging purposes
        return res.status(200).json({// Respond with a 200 (OK) status code and what was removed
            success: true,
            message: `${entry.title || 'Entry'} deleted successfully.`,
            entryId,
            tripId: entry.tripId,
        });
    } catch (error) {
        console.error('[ERROR: entryRoutes.js, DELETE /delete/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})
module.exports = router
