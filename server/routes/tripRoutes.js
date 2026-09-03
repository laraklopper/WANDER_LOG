// tripRoutes.js
/* Trip endpoints, mounted at /trip by app.js

- GET /fetchTrips - List current loggedIn users trips
- GET /fetchTrip/:id - Get one trip (?with entries)
- POST /addTrip - create a new trip
- PATCH /editTrip/:id - update a trip
- DELETE /deleteTrip/:id - Delete a single trip by id

all routes require JWT Auth
*/

/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config();
const express = require('express');
const Trip = require('../models/tripSchema');
const User = require('../models/userSchema');
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
    allowed.find((option) => option.toLowerCase() === String(value ?? '').trim().toLowerCase());

/* Reads a trip's fields off a request body and normalises them into the shape
tripSchema expects, with the two nested objects built here rather than in the
handler. Every rule the schema enforces is checked first, so a bad submission is
reported as a 400 with one clear message instead of a Mongoose ValidationError.

The owner is deliberately not read here: userId and username come from the token
and the database, never from the body.

Returns `{ message }` describing the first problem found, or the normalised trip
fields when the input is usable. */
const parseTripInput = ({ title, purpose, destination = {}, date = {}, status } = {}) => {
    const tripTitle = String(title ?? '').trim();
    // Conditional rendering to check the title was supplied, and is short enough to store
    if (!tripTitle) {
        return { message: 'Trip title is required' };
    }
    if (tripTitle.length > 100) {
        return { message: 'Trip title cannot exceed 100 characters' };
    }

    const tripPurpose = matchEnum(purpose, PURPOSES);
    // Conditional rendering to check the purpose is one the schema's enum allows
    if (!tripPurpose) {
        return { message: `Travel purpose must be one of: ${PURPOSES.join(', ')}` };
    }

    const destinationType = matchEnum(destination.destinationType, DESTINATION_TYPES);
    // Conditional rendering to check the destination type is one the schema's enum allows
    if (!destinationType) {
        return { message: `Destination type must be one of: ${DESTINATION_TYPES.join(', ')}` };
    }

    const tripLocation = String(destination.tripLocation ?? '').trim();
    // Conditional rendering to check the location was supplied, and is short enough to store
    if (!tripLocation) {
        return { message: 'Destination is required' };
    }
    if (tripLocation.length > 50) {
        return { message: 'Destination cannot exceed 50 characters' };
    }

    /* The country only belongs on an international trip. It is required for
    one, and left off a domestic one rather than stored next to a location that
    is already inside the user's own country */
    const country = String(destination.country ?? '').trim();
    if (destinationType === 'International' && !country) {
        return { message: 'Country is required for an international trip' };
    }

    /* Both dates are converted before they are compared, so a value the browser
    never validated, such as one sent straight to the API, is caught here rather
    than reaching Mongoose as a CastError and being reported as a 500 */
    const startDate = new Date(date.startDate);
    const endDate = new Date(date.endDate);

    if (!date.startDate || Number.isNaN(startDate.getTime())) {
        return { message: 'A valid start date is required' };
    }
    if (!date.endDate || Number.isNaN(endDate.getTime())) {
        return { message: 'A valid end date is required' };
    }
    /* The schema checks this too, through the validator on date.endDate. It is
    repeated here so the message names the problem before a document is built */
    if (endDate < startDate) {
        return { message: 'End date must be after start date' };
    }

    /* Defaulted rather than rejected, matching the schema's own default, so a
    submission that leaves the status unset still creates an upcoming trip */
    const tripStatus = status === undefined || status === null || status === ''
        ? 'upcoming'
        : matchEnum(status, STATUSES);

    // Conditional rendering to check a supplied status is one the schema's enum allows
    if (!tripStatus) {
        return { message: `Trip status must be one of: ${STATUSES.join(', ')}` };
    }

    return {
        title: tripTitle,
        purpose: tripPurpose,
        destination: {
            destinationType,
            tripLocation,
            // Left undefined on a domestic trip, so the field is not stored at all
            country: destinationType === 'International' ? country : undefined,
        },
        date: { startDate, endDate },
        status: tripStatus,
    };
}

// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/

/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
/*=====================================
CREATE A TRIP
=======================================*/
/* Creates one trip for the logged in user.

The owner is taken from the JWT and the username is read from the database, so a
body carrying another account's userId or username cannot file a trip against
someone else. The form shows the username as a read only field for that reason:
it is there to confirm who the trip is being logged for, not to be submitted.

Everything else goes through parseTripInput, so the whole submission is checked
and normalised in one place before the document is built. */
 router.post('/addTrip', checkJwtToken, async (req, res) => {
   try {
      const userId = req.user?.userId;

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
      /* Mongoose collects every failed field rule into one ValidationError.
      parseTripInput checks the same rules first, so this is reached by a value
      only the schema can judge. Returned as a 400 with a field keyed object so
      the form can show each message against the input that caused it */
      if (error.name === 'ValidationError') {
        const errors = Object.fromEntries(
            Object.entries(error.errors).map(([field, err]) => [field, err.message])
        );
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
/*──────────────────────────── DELETE ROUTES ───────────────────────────────────
    DELETE: Used to remove an item from the database
 ────────────────────────────────────────────────────────────────────────────────*/

module.exports = router
