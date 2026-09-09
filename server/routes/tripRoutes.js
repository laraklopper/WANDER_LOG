/*/ tripRoutes.js: Trip endpoints, mounted at /trip by app.js*/
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Trip = require('../models/tripSchema');
const User = require('../models/userSchema');
/* Read for hasBudget on the two read routes below — a budget is filed against
the trip it was set for, so whether one exists is answered by the budget
collection rather than by the flag stored on the trip — and written by the delete
below, which clears the budget of the trip it removes */
const Budget = require('../models/budgetSchema');
/* An entry is filed against a trip by id, so the entries of one trip are read
back with it by /fetchTrip/:id and cleared with it by the delete below, rather
than left pointing at a trip that is no longer stored */
const Entry = require('../models/entrySchema');
const { checkJwtToken } = require('./middleware');
const router = express.Router()

/* The enum values tripSchema stores, listed here so a submission can be checked
and normalised before Mongoose ever sees it. Kept in the schema's own spelling,
which is what matchEnum below returns */
const PURPOSES = ['Holiday', 'Business'];
const DESTINATION_TYPES = ['Domestic', 'International'];
const STATUSES = ['upcoming', 'ongoing', 'completed'];

/*=====================================
TRIP INPUT PARSING AND VALIDATION
=======================================*/
/* Matches a submitted value against one of the schema's enums without caring
about the casing it arrived in: the form shows its options in upper case, while
the schema stores 'Holiday' and 'upcoming'. Returns the stored spelling, or
undefined when the value is not one of the allowed ones */
const matchEnum = (value, allowed) =>
    allowed.find(
        (option) => option.toLowerCase() === String(value ?? '')
    .trim()
    .toLowerCase()
    );

/* Reads one value off a submission by the schema path the form names its input
by, so a destination arrives as 'destination.tripLocation' and a date as
'date.startDate'.

Both shapes are read, the nested one first, so a body built as
{ date: { startDate: '2025-01-01' } } and one built as
{ 'date.startDate': '2025-01-01' } are understood the same way. */
const readPath = (body, group, key) => {
    const nested = body?.[group]?.[key];
    return nested === undefined ? body?.[`${group}.${key}`] : nested;
}

/* The two rules that read more than one of a trip's fields at once, so neither
can be judged from a single submitted value on its own:

- a country belongs on an international trip, and is required for one, while a
  domestic trip stores none at all
- a trip cannot end before it starts

Both are checked against the whole trip, which on a create is the submission and
on an edit is the merge of the submitted changes over what is already stored: an
edit that moves only the start date still has to be compared against the stored
end date, and one that only switches the type to international has to find a
country either in the body or already on the trip.

Returns `{ message }` describing the problem, or null when the trip is usable. */
const checkTripRules = ({ destinationType, country, startDate, endDate }) => {
    if (destinationType === 'International' && !String(country ?? '').trim()) {
        return { message: 'Country is required for an international trip' };
    }
    /* The schema checks this too, through the validator on date.endDate. It is
    repeated here so the message names the problem before a document is written */
    if (endDate < startDate) {
        return { message: 'End date must be after start date' };
    }
    return null;
}

/* Reads a trip's fields off a request body and normalises them into the shape
tripSchema expects, with the two nested objects built here rather than in the
handler. Every rule the schema enforces is checked first, so a bad submission is
reported as a 400 with one clear message instead of a Mongoose ValidationError.

The owner is deliberately not read here: userId and username come from the token
and the database, never from the body.

`partial` is the difference between the two routes. A create has to carry the
whole trip, so a field that is missing is reported as missing. An edit only
carries what the form was asked to change, so a field the body does not hold at
all is left as it is stored, while one that is present is checked the same way it
would be on a create — a blank title is a blank title in both, and is refused
rather than written over a stored one.

Returns `{ message }` describing the first problem found, or the normalised trip
fields when the input is usable — on an edit, only the ones the body supplied. */
const parseTripInput = (body = {}, { partial = false } = {}) => {
    const { title, purpose, status } = body;
    const input = {};

    // ---- THE TITLE -----------------------------------------------------
    if (!partial || title !== undefined) {
        const tripTitle = String(title ?? '').trim();
        // Conditional rendering to check the title was supplied, and is short enough to store
        if (!tripTitle) {
            return { message: 'Trip title is required' };
        }
        if (tripTitle.length > 100) {
            return { message: 'Trip title cannot exceed 100 characters' };
        }

        input.title = tripTitle;
    }

    // ---- THE PURPOSE ---------------------------------------------------
    if (!partial || purpose !== undefined) {
        const tripPurpose = matchEnum(purpose, PURPOSES);
        // Conditional rendering to check the purpose is one the schema's enum allows
        if (!tripPurpose) {
            return { message: `Travel purpose must be one of: ${PURPOSES.join(', ')}` };
        }

        input.purpose = tripPurpose;
    }

    // ---- THE DESTINATION -----------------------------------------------
    const submittedType = readPath(body, 'destination', 'destinationType');
    const submittedLocation = readPath(body, 'destination', 'tripLocation');
    const submittedCountry = readPath(body, 'destination', 'country');
    const destination = {};

    if (!partial || submittedType !== undefined) {
        const destinationType = matchEnum(submittedType, DESTINATION_TYPES);
        // Conditional rendering to check the destination type is one the schema's enum allows
        if (!destinationType) {
            return { message: `Destination type must be one of: ${DESTINATION_TYPES.join(', ')}` };
        }

        destination.destinationType = destinationType;
    }

    if (!partial || submittedLocation !== undefined) {
        const tripLocation = String(submittedLocation ?? '').trim();
        // Conditional rendering to check the location was supplied, and is short enough to store
        if (!tripLocation) {
            return { message: 'Destination is required' };
        }
        if (tripLocation.length > 50) {
            return { message: 'Destination cannot exceed 50 characters' };
        }

        destination.tripLocation = tripLocation;
    }

    /* Read whenever it was carried, and only measured against the destination
    type by checkTripRules: on an edit that type may be the one already stored
    rather than one this body supplied. Capped at the length the form allows,
    which the schema does not do for this field */
    if (!partial || submittedCountry !== undefined) {
        const country = String(submittedCountry ?? '').trim();

        if (country.length > 50) {
            return { message: 'Country cannot exceed 50 characters' };
        }

        destination.country = country;
    }

    if (Object.keys(destination).length) input.destination = destination;

    // ---- THE DATES -----------------------------------------------------
    /* Both are converted before they are stored or compared, so a value the
    browser never validated, such as one sent straight to the API, is caught here
    rather than reaching Mongoose as a CastError and being reported as a 500 */
    const submittedDates = {
        startDate: readPath(body, 'date', 'startDate'),
        endDate: readPath(body, 'date', 'endDate'),
    };
    const date = {};

    for (const field of ['startDate', 'endDate']) {
        const submitted = submittedDates[field];

        // Conditional rendering to skip a date an edit did not carry
        if (partial && submitted === undefined) continue;

        const parsed = new Date(submitted);

        // Conditional rendering to check the date was supplied, and can be read
        if (!submitted || Number.isNaN(parsed.getTime())) {
            return { message: `A valid ${field === 'startDate' ? 'start' : 'end'} date is required` };
        }

        date[field] = parsed;
    }

    if (Object.keys(date).length) input.date = date;

    // ---- THE STATUS ----------------------------------------------------
    if (!partial || status !== undefined) {
        /* Defaulted rather than rejected on a create, matching the schema's own
        default, so a submission that leaves the status unset still creates an
        upcoming trip. An edit only reaches here when the body carried a status,
        and a blank one is not a status the schema stores, so it is reported
        instead of quietly turning the trip back into an upcoming one */
        const tripStatus = !partial && (status === undefined || status === null || status === '')
            ? 'upcoming'
            : matchEnum(status, STATUSES);

        // Conditional rendering to check a supplied status is one the schema's enum allows
        if (!tripStatus) {
            return { message: `Trip status must be one of: ${STATUSES.join(', ')}` };
        }

        input.status = tripStatus;
    }

    /* Only checked here on a create, where the whole trip arrived at once. An
    edit is checked against the merge of these changes and the trip as it is
    stored, which the route does for itself once it has loaded the document */
    if (!partial) {
        const problem = checkTripRules({
            destinationType: destination.destinationType,
            country: destination.country,
            startDate: date.startDate,
            endDate: date.endDate,
        });

        if (problem) return problem;

        /* The country only belongs on an international trip, so it is left
        undefined on a domestic one rather than stored next to a location that is
        already inside the user's own country */
        if (destination.destinationType !== 'International') destination.country = undefined;
    }

    return input;
}

/*=====================================
VALIDATION ERROR SHAPING
=======================================*/
/* Mongoose collects every failed field rule into one ValidationError.
parseTripInput checks the same rules first, so this is only reached by a value
only the schema can judge. Flattened into a field keyed object so the form can
show each message against the input that caused it.

The keys are the schema's own paths — 'title', 'destination.tripLocation',
'date.endDate' — and both trip forms name each input by that path, so nothing has
to be translated on the way through. */
const validationErrors = (error) => Object.fromEntries(
    Object.entries(error.errors).map(([field, err]) => [field, err.message])
);

// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
// trip/fetchTrips - Route to list every trip belonging to the logged in user.
router.get('/fetchTrips', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;// Extract the userId from the decoded JWT token payload

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: tripRoutes.js, GET /fetchTrips] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        /* Both filtered on the owner, and requested together because neither
        needs the other's answer: the budgets are only read for their tripId */
        const [trips, budgets] = await Promise.all([
            Trip.find({ userId })
            .sort({ 'date.startDate': -1 }).exec(),
            Budget.find({ userId }).select('tripId').exec(),
        ]);

        /* Held as strings, because the ids are ObjectIds and two of those are
        never equal to each other by identity even when they are the same id */
        const budgetedTripIds = new Set(
            budgets.filter((budget) => budget.tripId).map((budget) => String(budget.tripId))
        );

        /* Converted with toObject so hasBudget can be replaced, which a Mongoose
        document would otherwise reject as a write to a loaded field. Virtuals
        are kept, since the schema is set to return them */
        const userTrips = trips.map((trip) => ({
            ...trip.toObject({ virtuals: true }),
            hasBudget: budgetedTripIds.has(String(trip._id)),
        }));

        console.log(`[SUCCESS: tripRoutes.js, GET /fetchTrips] Found ${userTrips.length} trips for user ${userId}`);// Log a success message in the console for debugging purposes
        return res.status(200).json({ success: true, count: userTrips.length, trips: userTrips });// Respond with a 200 (OK) status code and the list of trips
    } catch (error) {
        console.error('[ERROR: tripRoutes.js, GET /fetchTrips]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})
/*=====================================
READ ONE OF THE LOGGED IN USER'S TRIPS
=======================================*/
/* trip/fetchTrip/:id - Reads one trip back whole, with the journal entries filed
against it. */
router.get('/fetchTrip/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;// Extract the userId from the decoded JWT token payload

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: tripRoutes.js, GET /fetchTrip/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const tripId = String(req.params.id ?? '').trim();

        /* Checked before the trip is looked up, so a malformed id is reported as
        a 400 rather than reaching Mongoose as a CastError and being reported as a 500 */
        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            console.warn('[WARN: tripRoutes.js, GET /fetchTrip/:id] Invalid trip id', tripId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That trip id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        /* Matched on the trip and the owner together, so another account's trip
        is not found at all rather than found and then refused. Read before the
        entries and the budget, so neither is looked up for a trip this account
        cannot see */
        const trip = await Trip.findOne({ _id: tripId, userId }).exec();

        // Conditional rendering to check a trip with that id exists on this account
        if (!trip) {
            console.warn('[WARN: tripRoutes.js, GET /fetchTrip/:id] No trip found for id', tripId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That trip could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        /* Both filtered on the owner as well as the trip, and requested together
        because neither needs the other's answer. The budget is only asked about,
        not read: nothing here reports on it beyond whether one exists */
        const [entries, budget] = await Promise.all([
            Entry.find({ tripId: trip._id, userId }).sort({ date: -1 }).exec(),
            Budget.exists({ tripId: trip._id, userId }),
        ]);

        console.log(`[SUCCESS: tripRoutes.js, GET /fetchTrip/:id] Found trip ${tripId} with ${entries.length} entry(s) for user ${userId}`);// Log a success message in the console for debugging purposes
        return res.status(200).json({
            success: true,
            /* Converted with toObject so hasBudget can be replaced, which a
            Mongoose document would otherwise reject as a write to a loaded
            field. Virtuals are kept, since the schema is set to return them */
            trip: {
                ...trip.toObject({ virtuals: true }),
                hasBudget: Boolean(budget),
            },
            entries,
            count: entries.length,
        });// Respond with a 200 (OK) status code, the trip and its entries
    } catch (error) {
        console.error('[ERROR: tripRoutes.js, GET /fetchTrip/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})
/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
// Route to create a newTrip
/*/trip/addTrip - Creates one trip for the logged in user.*/
 router.post('/addTrip', checkJwtToken, async (req, res) => {
   try {
      const userId = req.user?.userId;// Extract the userId from the decoded JWT token payload

      // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: tripRoutes.js, POST /] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const input = parseTripInput(req.body);// Extract and normalise the trip fields from the request body

        // Conditional rendering to check the submitted trip is usable
        if (input.message) {
            console.warn('[WARN: tripRoutes.js, POST /addTrip]', input.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: input.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        /* The username is stored on the trip as well as the id, so read from the
        account rather than trusted from the body. Doubles as a check that the
        user on the token still exists */
        const user = await User.findById(userId).select('username').exec();

        // Conditional rendering to check the user on the token still exists
        if (!user) {
            console.warn('[WARN: tripRoutes.js, POST /addTrip] No user found for id', userId);// Log a warning message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });// Respond with a 401 (Unauthorised) status code
        }

      const newTrip = await Trip.create({
        userId: user._id,
        username: user.username,
        title: input.title,
        purpose: input.purpose,
        destination: input.destination,
        date: input.date,
        status: input.status,
        /* entryCount is left off: it defaults to 0 and is maintained by the
        post save and post delete hooks on entrySchema */
      })
      console.log('[SUCCESS: tripRoutes.js, POST /] Trip created:', newTrip._id);// Log a success message in the console for debugging purposes
        return res.status(201).json({ success: true, message: 'Trip created successfully.', trip: newTrip });// Respond with a 201 (Created) status code and the new trip object
   } catch (error) {
      // Raised by a rule only the schema can judge, reported against its field
      if (error.name === 'ValidationError') {
        const errors = validationErrors(error);
        console.error('[ERROR: tripRoutes.js, POST /addTrip] Validation failed:', errors);// Log an error message in the console for debugging purposes
        return res.status(400).json({ success: false, message: 'Trip could not be created, please check the highlighted fields', errors });// Respond with a 400 (Bad Request) status code
      }

      console.error('[ERROR: tripRoutes.js, POST /addTrip]', error.message);// Log an error message in the console for debugging purposes
      return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
   }
 })
/*──────────────────────────── PATCH ROUTES ───────────────────────────────────
   PATCH: UPDATE — Used to partially update information in the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
EDIT A TRIP
=======================================*/
/* trip/editTrip/:id - Edits one of the logged in user's trips.
Four things cannot be written through here:
- the owner, userId and username, which come from the token and the account for
  the same reason they do on a create
- hasBudget, which is not read off the trip at all: /fetchTrips answers it from
  the caller's own budgets, because a budget is filed against the trip it was set
  for rather than flagged on it
- entryCount, which is maintained by the post save and post delete hooks on
  entrySchema, so a body carrying its own count would be overwritten by the next
  entry anyway
The country is the one field an edit can remove: switching a trip to domestic
unsets it, rather than leaving the name of a country stored against a trip that
is no longer said to be in one. */
router.patch('/editTrip/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: tripRoutes.js, PATCH /editTrip/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const tripId = String(req.params.id ?? '').trim();

        /* Checked before the trip is looked up, so a malformed id is reported as
        a 400 rather than reaching Mongoose as a CastError and being reported as
        a 500 */
        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            console.warn('[WARN: tripRoutes.js, PATCH /editTrip/:id] Invalid trip id', tripId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That trip id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        const input = parseTripInput(req.body, { partial: true });// Extract and normalise only the fields the body carries

        // Conditional rendering to check the submitted changes are usable
        if (input.message) {
            console.warn('[WARN: tripRoutes.js, PATCH /editTrip/:id]', input.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: input.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        // Conditional rendering to check the body carried something to change
        if (!Object.keys(input).length) {
            console.warn('[WARN: tripRoutes.js, PATCH /editTrip/:id] Nothing to update on trip', tripId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'There is nothing to update' });// Respond with a 400 (Bad Request) status code
        }

        /* Matched on the trip and the owner together, so another account's trip
        is not found at all rather than found and then refused */
        const trip = await Trip.findOne({ _id: tripId, userId }).exec();

        // Conditional rendering to check a trip with that id exists on this account
        if (!trip) {
            console.warn('[WARN: tripRoutes.js, PATCH /editTrip/:id] No trip found for id', tripId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That trip could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        /* The two rules that read more than one field are checked against the
        trip as this edit will leave it, not against the body on its own: an edit
        that moves only the end date is still compared to the stored start date,
        and one that only switches the type to international still has to find a
        country, whether this body carried one or the trip already holds it */
        const destinationType = input.destination?.destinationType ?? trip.destination?.destinationType;
        const startDate = input.date?.startDate ?? trip.date?.startDate;
        const endDate = input.date?.endDate ?? trip.date?.endDate;

        /* A trip switched to domestic loses its country with the switch, so the
        merged trip is judged without one rather than against a value that is
        about to be unset */
        const country = destinationType === 'International'
            ? input.destination?.country ?? trip.destination?.country
            : undefined;

        const problem = checkTripRules({ destinationType, country, startDate, endDate });

        // Conditional rendering to check the trip this edit would leave behind is usable
        if (problem) {
            console.warn('[WARN: tripRoutes.js, PATCH /editTrip/:id]', problem.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: problem.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        // ---- APPLY THE CHANGES ---------------------------------------------
        if (input.title !== undefined) trip.title = input.title;
        if (input.purpose !== undefined) trip.purpose = input.purpose;
        if (input.status !== undefined) trip.status = input.status;

        /* Assigned by path rather than by replacing the nested objects, so an
        edit that carries one date leaves the other as it is stored instead of
        clearing it */
        if (input.destination?.destinationType !== undefined) {
            trip.set('destination.destinationType', input.destination.destinationType);
        }
        if (input.destination?.tripLocation !== undefined) {
            trip.set('destination.tripLocation', input.destination.tripLocation);
        }
        /* Written for an international trip, and unset entirely for a domestic
        one: set to undefined, the path is removed from the document on save
        rather than stored as an empty string */
        if (destinationType === 'International') {
            if (input.destination?.country !== undefined) {
                trip.set('destination.country', input.destination.country);
            }
        } else {
            trip.set('destination.country', undefined);
        }

        if (input.date?.startDate !== undefined) trip.set('date.startDate', input.date.startDate);
        if (input.date?.endDate !== undefined) trip.set('date.endDate', input.date.endDate);

        /* Saving is what validates the document, so a rule only the schema can
        judge is raised from here as a ValidationError and handled below rather
        than being written */
        await trip.save();

        console.log('[SUCCESS: tripRoutes.js, PATCH /editTrip/:id] Trip updated:', trip._id);// Log a success message in the console for debugging purposes
        return res.status(200).json({
            success: true,
            message: 'Trip updated successfully.',
            /* Returned whole, with the virtuals the schema is set to include, so
            the page can show the edited trip without refetching to see it */
            trip,
        });// Respond with a 200 (OK) status code and the updated trip
    } catch (error) {
        // Raised by a rule only the schema can judge, reported against its field
        if (error.name === 'ValidationError') {
            const errors = validationErrors(error);
            console.error('[ERROR: tripRoutes.js, PATCH /editTrip/:id] Validation failed:', errors);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'Trip could not be updated, please check the highlighted fields', errors });// Respond with a 400 (Bad Request) status code
        }

        console.error('[ERROR: tripRoutes.js, PATCH /editTrip/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})

/*──────────────────────────── DELETE ROUTES ───────────────────────────────────
    DELETE: Used to remove an item from the database
 ────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE A TRIP
=======================================*/
/* trip/deleteTrip/:id - Removes one of the logged in user's trips, and
everything filed against it.

The trip is matched on its id and the owner together, so another account's trip
is not found at all rather than found and then refused — which is also why a
missing one is reported as a 404 either way, and never says whether it exists on
someone else's account.

Nothing else clears up after a trip: the schemas do not cascade a delete, so a
trip removed on its own would leave its journal entries pointing at a trip that
is no longer stored and its budget holding the expenses of a trip that no longer
exists. Both are cleared here:

- the entries filed against the trip, which are their own documents
- the trip's budget, and with it the expenses embedded in it — an expense is a
  sub-document of its trip's budget rather than a model of its own, so removing
  the parent removes every expense on that trip in the same write

The dependents go first and the trip itself last, so a failure part way through
leaves the trip in place to be deleted again rather than leaving records behind
with no trip to reach them through. Each count is reported back, because the
journal and the expenses page are built from those records and would otherwise
appear to lose rows unexplained. */
router.delete('/deleteTrip/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: tripRoutes.js, DELETE /deleteTrip/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const tripId = String(req.params.id ?? '').trim();

        /* Checked before the trip is looked up, so a malformed id is reported as
        a 400 rather than reaching Mongoose as a CastError and being reported as
        a 500 */
        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            console.warn('[WARN: tripRoutes.js, DELETE /deleteTrip/:id] Invalid trip id', tripId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That trip id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        /* Matched on the trip and the owner together, so another account's trip
        is not found at all rather than found and then deleted. Read before
        anything is removed, so the dependents of a trip that is not on this
        account are never touched */
        const trip = await Trip.findOne({ _id: tripId, userId }).select('title').exec();

        /* Conditional rendering to check a trip with that id exists on this
        account. Covers both a trip that does not exist and one on another account */
        if (!trip) {
            console.warn('[WARN: tripRoutes.js, DELETE /deleteTrip/:id] No trip found for id', tripId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That trip could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        /* Both filtered on the owner as well as the trip, and requested together
        because neither needs the other's answer. The budget is removed through
        findOneAndDelete so the document comes back with it: the expenses that
        went with it are embedded in it, and after this write there is nothing
        left to count them from */
        const [removedEntries, removedBudget] = await Promise.all([
            Entry.deleteMany({ tripId: trip._id, userId }).exec(),
            Budget.findOneAndDelete({ tripId: trip._id, userId }).exec(),
        ]);

        const entryCount = removedEntries?.deletedCount ?? 0;
        const expenseCount = removedBudget?.expenses?.length ?? 0;

        /* What went with the trip, listed for the message below. Each is left out
        when there was none of it, so a trip that was logged and never written
        about is reported as the trip alone */
        const alsoRemoved = [
            entryCount ? `${entryCount} journal ${entryCount === 1 ? 'entry' : 'entries'}` : null,
            removedBudget ? 'its budget' : null,
            expenseCount ? `${expenseCount} expense${expenseCount === 1 ? '' : 's'}` : null,
        ].filter(Boolean);

        /* Deleted last, so the trip is only gone once everything that pointed at
        it is. The entryCount stored on it is left alone rather than kept in step:
        deleteMany does not fire the post delete hook entrySchema decrements it
        from, and the trip it is stored on is removed on the next line */
        await Trip.findOneAndDelete({ _id: trip._id, userId }).exec();

        console.log('[SUCCESS: tripRoutes.js, DELETE /deleteTrip/:id] Deleted trip', tripId, 'with', entryCount, 'entry(s),', removedBudget ? 1 : 0, 'budget(s) and', expenseCount, 'expense(s)');// Log a success message in the console for debugging purposes
        return res.status(200).json({
            success: true,
            /* Names what went with the trip rather than reporting the trip
            alone, because the journal's entry list and the expenses page are
            built from those records */
            message: alsoRemoved.length
                ? `Trip deleted successfully, along with ${alsoRemoved.join(', ')}.`
                : 'Trip deleted successfully.',
            /* Returned so the client can drop the row and close any panel or
            form open on this trip without waiting on a refetch to learn which
            one went */
            tripId,
            removedEntries: entryCount,
            removedBudget: Boolean(removedBudget),
            removedExpenses: expenseCount,
        });// Respond with a 200 (OK) status code and what was removed
    } catch (error) {
        console.error('[ERROR: tripRoutes.js, DELETE /deleteTrip/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})
module.exports = router
