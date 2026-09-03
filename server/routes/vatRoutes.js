// vatRoutes.js
/* VAT endpoints, mounted at /vat by app.js.

  POST   /calculate   - work out the VAT on one amount (saves nothing)
  POST   /save        - save a calculation to the logged in user's history
  GET    /history     - the logged in user's saved calculations
  DELETE /history/:id - remove one of the logged in user's saved calculations
  */

// VAT calculator used to determine VAT on expenses while travelling
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router()
const User = require('../models/userSchema')
const Vat = require('../models/vatSchema')
const { calculateVat, VAT_MODES } = require('../util/vatCalculations')
const { checkJwtToken } = require('./middleware')
/* Most saved calculations a single /history response will return. A user's
history grows without limit, so the newest records are returned and the total
is reported alongside them rather than the response growing unbounded. */
const HISTORY_LIMIT = 100;

/*=====================================
VAT INPUT PARSING AND VALIDATION
=======================================*/
/* Reads a calculation's fields off a request body and normalises them: the
amount coerced to a number, the mode trimmed and lowercased, the zero-rated flag
to a boolean. Shared by /calculate and /save so an amount is parsed and
validated in exactly one place and the two cannot drift.

Returns `{ message }` describing the first problem found, or the normalised
`{ parsedAmount, vatMode, zeroRated }` when the input is usable. */
const parseVatInput = ({ amount, mode = 'exclusive', isZeroRated = false } = {}) => {
    // Conditional rendering to check the one required field was supplied
    if (amount === undefined || amount === null || amount === '') {
        return { message: 'amount is required' };
    }

    const parsedAmount = parseFloat(amount);// Convert the amount to a floating-point number
    /* Conditional rendering to validate the amount is a number that money can
    be written as. A nil amount is allowed - it calculates to nil VAT, which is
    a true answer - but a negative one is not, and the schema rejects it too. */
    if (isNaN(parsedAmount) || parsedAmount < 0) {
        return { message: 'amount must be a positive number' };
    }

    const vatMode = String(mode).trim().toLowerCase();// Normalise the mode to the casing the enum stores
    /* Validated against the same VAT_MODES the maths and the schema enum use,
    so an unrecognised mode is reported here rather than silently falling back
    to 'exclusive' inside calculateVat and saving a record the user did not ask
    for. */
    if (!VAT_MODES.includes(vatMode)) {
        return { message: `mode must be one of: ${VAT_MODES.join(', ')}` };
    }

    return { parsedAmount, vatMode, zeroRated: Boolean(isZeroRated) };
}

/*──────────────────────────── POST ROUTES ─────────────────────────────────────
   POST: CREATE — Used to send information to the server
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
CALCULATE THE VAT ON ONE AMOUNT
=======================================*/
/* Works out the net, VAT and gross amounts for one figure and returns them.
Nothing is written to the database here: a calculation is only kept once the
user asks for it through POST /save.

A POST rather than a GET because the browser sends the three inputs as a JSON
body, matching /save, so the same shape serves both and the client does not have
to build a query string for one and a body for the other. */
router.post('/calculate', checkJwtToken, async (req, res) => {
    try {
        const input = parseVatInput(req.body);
        // Conditional rendering to check the submitted figures are usable
        if (input.message) {
            return res.status(400).json({ success: false, message: input.message });// Send a 400 (Bad Request) status code with a message
        }

        const { parsedAmount, vatMode, zeroRated } = input;

        const calculation = calculateVat({
            amount: parsedAmount,
            mode: vatMode,
            isZeroRated: zeroRated,
        });

        console.log('[SUCCESS: vatRoutes.js, /calculate] Calculated', vatMode, 'VAT on', parsedAmount);
        return res.status(200).json({
            success: true,
            calculation,
        });
    } catch (error) {
        console.error('[ERROR: vatRoutes.js, /calculate]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*=====================================
SAVE A CALCULATION
=======================================*/
/* Saves a VAT calculation to the logged in user's history. The user is taken
from the JWT, never from the request body, so a user can only ever write a
record against themselves, and the username is read from the database rather
than trusted from the request.

The three amounts are RECOMPUTED here from the inputs rather than read off the
body, so a stored record always holds figures the server worked out. The saved
document is returned either way, so the client can show exactly what was kept. */
router.post('/save', checkJwtToken, async (req, res) => {
    try {
        const input = parseVatInput(req.body);
        // Conditional rendering to check the submitted figures are usable
        if (input.message) {
            return res.status(400).json({ success: false, message: input.message });// Send a 400 (Bad Request) status code with a message
        }

        const { parsedAmount, vatMode, zeroRated } = input;

        const user = await User.findById(req.user.userId)
            .select('username')
            .exec();

        // Conditional rendering to check the user on the token still exists
        if (!user) {
            console.warn('[WARN: vatRoutes.js, /save] No user found for id', req.user.userId);
            return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
        }

        const calculation = calculateVat({
            amount: parsedAmount,
            mode: vatMode,
            isZeroRated: zeroRated,
        });

        /* enteredAmount is not stored: the schema exposes it as a virtual off
        `mode` and the two amounts, so it is left out of the create rather than
        saved as a fourth figure that could disagree with the other three. */
        const saved = await Vat.create({
            user: user._id,
            username: user.username,
            mode: calculation.mode,
            isZeroRated: calculation.isZeroRated,
            ratePercent: calculation.ratePercent,
            netAmount: calculation.netAmount,
            vatAmount: calculation.vatAmount,
            grossAmount: calculation.grossAmount,
        });

        console.log('[SUCCESS: vatRoutes.js, /save] Saved VAT calculation', saved._id, 'for user', user._id);
        return res.status(201).json({
            success: true,
            message: 'VAT calculation saved to your history',
            saved,// Carries the `enteredAmount` and `effectiveRate` virtuals, so the client can show what was stored
        });
    } catch (error) {
        // A schema validation failure is the user's input, not a server fault
        if (error.name === 'ValidationError') {
            console.error('[ERROR: vatRoutes.js, /save] Validation failed:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('[ERROR: vatRoutes.js, /save]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
THE USER'S SAVED CALCULATIONS
=======================================*/
/* Returns the logged in user's saved VAT calculations, newest first. The user
is taken from the JWT rather than a query param, so this can only ever return
the requester's own records.

`total` is reported separately from the returned array: only the newest
HISTORY_LIMIT records are sent, so the client can tell when it is looking at a
truncated view rather than the user's whole history.

Nothing is recalculated here. Each record already holds the rate it was worked
out at, so a history response reports what was actually stored rather than
repricing old calculations at today's rate. The `enteredAmount` and
`effectiveRate` virtuals ride along on each record, because the schema sets
`toJSON: { virtuals: true }`. */
router.get('/history', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        /* Counted and fetched together: the count is what tells the client the
        list was truncated, so it has to reflect the same filter. */
        const [total, calculations] = await Promise.all([
            Vat.countDocuments({ user: userId }).exec(),
            Vat.find({ user: userId })
                .sort({ createdAt: -1 })// Newest calculation first
                .limit(HISTORY_LIMIT)
                .exec(),
        ]);

        console.log('[SUCCESS: vatRoutes.js, GET /history] Returned', calculations.length, 'of', total, 'calculation(s) for user', userId);
        return res.status(200).json({
            success: true,
            total,
            limit: HISTORY_LIMIT,
            calculations,
        });
    } catch (error) {
        console.error('[ERROR: vatRoutes.js, GET /history]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE A SAVED CALCULATION
=======================================*/
/* Removes one of the logged in user's saved VAT calculations.

The id and the user are matched in a SINGLE query rather than fetching the
record and then checking who owns it. A calculation belonging to another user
therefore behaves exactly like one that does not exist, so an id cannot be
guessed at to find out whether it is someone else's. */
router.delete('/history/:id', checkJwtToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        /* Conditional rendering to check the id is a valid ObjectId: querying
        on a malformed id raises a CastError, which would return a 500 */
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error('[ERROR: vatRoutes.js, DELETE /history/:id] Invalid calculation id:', id);
            return res.status(400).json({ success: false, message: 'Invalid calculation id' });// Send a 400 (Bad Request) status code with a message
        }

        const removed = await Vat.findOneAndDelete({ _id: id, user: userId }).exec();

        /* Conditional rendering to check a record was actually removed. Covers
        both a calculation that does not exist and one owned by another user. */
        if (!removed) {
            console.warn('[WARN: vatRoutes.js, DELETE /history/:id] No calculation', id, 'for user', userId);
            return res.status(404).json({ success: false, message: 'VAT calculation not found' });// Send a 404 (Not Found) status code with a message
        }

        console.log('[SUCCESS: vatRoutes.js, DELETE /history/:id] Deleted calculation', id, 'for user', userId);
        return res.status(200).json({
            success: true,
            message: 'VAT calculation removed from your history',
            calculationId: id,// Returned so the client can drop the calculation from the list on screen
        });
    } catch (error) {
        console.error('[ERROR: vatRoutes.js, DELETE /history/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

//==========EXPORT THE ROUTER===================
module.exports = router// Export the router to be used in other parts of the application
