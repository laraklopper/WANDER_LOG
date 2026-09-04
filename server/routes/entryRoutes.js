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

Returns `{ message }` describing the first problem found, or the normalised entry
fields when the input is usable. */
const parseEntryInput = ({ tripId, title, body, date } = {}) => {
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

    const entryTitle = String(title ?? '').trim();
    // Conditional rendering to check the title was supplied, and is short enough to store
    if (!entryTitle) {
        return { message: 'Entry title is required' };
    }
    if (entryTitle.length > TITLE_MAX) {
        return { message: `Entry title cannot exceed ${TITLE_MAX} characters` };
    }

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

    /* Converted before it is stored, so a value the browser never validated,
    such as one sent straight to the API, is caught here rather than reaching
    Mongoose as a CastError and being reported as a 500 */
    const entryDate = new Date(date);
    if (!date || Number.isNaN(entryDate.getTime())) {
        return { message: 'A valid entry date is required' };
    }

    return {
        tripId: entryTripId,
        title: entryTitle,
        body: entryBody,
        date: entryDate,
    };
}

// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
// entry/fetchEntries - Fetch all entries for loggedIn user
// entry/fetchEntry/:id - Fetch one entry
/*──────────────────────────── POST ROUTES ─────────────────────────────────────
   POST: CREATE — Used to send information to the server
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
CREATE AN ENTRY
=======================================*/
/* entry/addEntry - Creates one journal entry for the logged in user.

The owner is taken from the JWT and the username is read from the database, so a
body carrying another account's userId or username cannot file an entry against
someone else. The form shows the username as a read only field for that reason:
it is there to confirm who the entry is being logged for, not to be submitted.

The trip is loaded and checked against the same token, so an entry cannot be
added to a trip belonging to another account, and its stored title is read off
that document rather than trusted from the body.

Everything else goes through parseEntryInput, so the whole submission is checked
and normalised in one place before the document is built. */
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
        account rather than trusted from the body. Doubles as a check that the
        user on the token still exists */
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
        /* Mongoose collects every failed field rule into one ValidationError.
        parseEntryInput checks the same rules first, so this is reached by a value
        only the schema can judge. Returned as a 400 with a field keyed object so
        the form can show each message against the input that caused it */
        if (error.name === 'ValidationError') {
            const errors = Object.fromEntries(
                Object.entries(error.errors).map(([field, err]) => [field, err.message])
            );
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
// entry/editEntry/:id - update a user entry
/*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
// entry/delete/:id - Delete a user entry
module.exports = router
