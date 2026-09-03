// apiRoutes.js
/* Currency endpoints, mounted at /api by app.js.

  GET    /currencies                  - every currency the converter can offer
  GET    /convert?from=&to=&amount=   - convert an amount between two currencies
  POST   /save                        - save a conversion to the logged in user's history
  GET    /history                     - the logged in user's saved conversions, newest first
  DELETE /history/:id                 - remove one of the logged in user's saved conversions
*/
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
const express = require('express');
const router = express.Router()
const User = require('../models/userSchema')
const Conversion = require('../models/currConverterSchema')
const {getSupportedCurrencies, getConversionRate} = require('../util/currencyService')
const {checkJwtToken} = require('./middleware')
/* Most saved conversions a single /history response will return. A user's
history grows without limit, so the newest records are returned and the total
is reported alongside them rather than the response growing unbounded. */
const HISTORY_LIMIT = 100;

/*=====================================
CONVERSION INPUT PARSING AND VALIDATION
=======================================*/
/* Reads a conversion's fields off a request — /convert takes them as query
params, /save as a JSON body — and normalises them: codes trimmed and
uppercased, amount coerced to a number. Shared by both routes so a conversion
is parsed and validated in exactly one place and the two cannot drift.

Returns `{ message }` describing the first problem found, or the normalised
`{ fromCurrency, toCurrency, parsedAmount }` when the input is usable. Checking
the codes means reading the supported list, so this is async. */
const parseConversionInput = async ({ from, to, amount } = {}) => {
    // Conditional rendering to check all three fields were supplied
    if (!from || !to || amount === undefined || amount === null || amount === '') {
        return { message: 'from, to, and amount are required' };
    }

    const fromCurrency = String(from).trim().toUpperCase();// Normalize currency codes to uppercase
    const toCurrency = String(to).trim().toUpperCase();

    const parsedAmount = parseFloat(amount);// Convert the amount to a floating-point number
    // Conditional rendering to validate that the amount is a positive number
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return { message: 'amount must be a positive number' };
    }

    /* Validate both codes against the list Frankfurter reports it supports
    rather than a fixed array. GET /currencies serves the same list, so the
    message points there instead of naming 165 codes. */
    const { codes } = await getSupportedCurrencies();
    if (!codes.has(fromCurrency) || !codes.has(toCurrency)) {
        return { message: 'from and to must be supported currency codes — see GET /api/currencies' };
    }

    return { fromCurrency, toCurrency, parsedAmount };
}
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/* Serves the currencies the converter can work with, as { code, name, symbol }.
The browser builds its dropdowns and its currency table from this rather than
from a duplicated array of its own. `live` is false when the list came from the
offline fallback, so the client can tell a real list from a stand-in. */
router.get('/currencies', checkJwtToken, async (req, res) => {
    try {
        const { currencies, live } = await getSupportedCurrencies();

        console.log('[SUCCESS: apiRoutes.js, /currencies] Served', currencies.length, 'currencies');
        return res.status(200).json({
            success: true,
            live,
            total: currencies.length,
            currencies
        });
    } catch (error) {
        console.error('[ERROR: apiRoutes.js, /currencies]', error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})
/* Converts an amount between two currencies and returns the quote. Nothing is
written to the database here: a conversion is only kept once the user asks for
it through POST /save. */
router.get('/convert', checkJwtToken ,async (req,res) => {
    try {
        const input = await parseConversionInput(req.query);
        // Conditional rendering to check the submitted figures are usable
        if (input.message) {
            return res.status(400).json({ success: false, message: input.message });// Send a 400 (Bad Request) status code with a message
        }

        const { fromCurrency, toCurrency, parsedAmount } = input;

        // Conditional rendering
        if (fromCurrency === toCurrency) {// Short-circuit: no conversion needed when source and target currencies are the same
            return res.status(200).json({
                success: true,
                result: parsedAmount,
                rate: 1, from: fromCurrency, to: toCurrency, amount: parsedAmount });// Return the original amount with a rate of 1
        }

        /* One request per conversion, so the rate the user is shown is a rate
        that was quoted for their pair rather than a cached figure. */
        const quote = await getConversionRate(fromCurrency, toCurrency);

        if (!quote) {// Conditional rendering to check a usable rate came back
            console.error('[ERROR: apiRoutes.js, /convert] Missing exchange rate for', fromCurrency, toCurrency);
            return res.status(502).json({ success: false, message: 'Exchange rate unavailable for the requested currencies' });
        }

        const convertedAmount = parsedAmount * quote.rate;

        console.log('[SUCCESS: apiRoutes.js, /convert] Converted', parsedAmount, fromCurrency, 'to', toCurrency);
        return res.status(200).json({
            success: true,
            result: convertedAmount,
            rate: quote.rate,
            date: quote.date,// The day Frankfurter published the rate used
            from: fromCurrency,
            to: toCurrency,
            amount: parsedAmount
        });
    } catch (error) {
        console.error('[ERROR: apiRoutes.js, /convert]', error.message);
        return res.status(502).json({ success: false, message: 'Failed to retrieve exchange rates' });
    }
})
/* Returns the logged in user's saved conversions, newest first. The user is
taken from the JWT rather than a query param, so this can only ever return the
requester's own records.

`total` is reported separately from the returned array: only the newest
HISTORY_LIMIT records are sent, so the client can tell when it is looking at a
truncated view rather than the user's whole history.

Nothing is fetched from Frankfurter here. Each record already holds the rate its
save fetched, so a history response reports what was actually stored rather than
repricing old conversions at today's rate. The `convertedAmount` virtual rides
along on each record, because the schema sets `toJSON: { virtuals: true }`. */
router.get('/history', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        /* Counted and fetched together: the count is what tells the client the
        list was truncated, so it has to reflect the same filter. */
        const [total, conversions] = await Promise.all([
            CurrencyConvert.countDocuments({ user: userId }).exec(),
            CurrencyConvert.find({ user: userId })
                .sort({ createdAt: -1 })// Newest conversion first
                .limit(HISTORY_LIMIT)
                .exec(),
        ]);

        console.log('[SUCCESS: apiRoutes.js, GET /history] Returned', conversions.length, 'of', total, 'conversion(s) for user', userId);
        return res.status(200).json({
            success: true,
            total,
            limit: HISTORY_LIMIT,
            conversions,
        });
    } catch (error) {
        console.error('[ERROR: apiRoutes.js, GET /history]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/* Saves a conversion to the logged in user's history. The user is taken from
the JWT, never from the request body, so a user can only ever write a record
against themselves, and the fullName is read from the database rather than
trusted from the request.

The rate is FETCHED HERE rather than read from the body, so a saved record
always holds a rate the provider actually quoted. Frankfurter publishes one rate
per pair per day, so this is the same rate /convert showed the user; the stored
record is returned either way, so the client can show exactly what was kept. */
router.post('/save', checkJwtToken, async (req, res) => {
    try {
        const input = await parseConversionInput(req.body);
        // Conditional rendering to check the submitted figures are usable
        if (input.message) {
            return res.status(400).json({ success: false, message: input.message });// Send a 400 (Bad Request) status code with a message
        }

        const { fromCurrency, toCurrency, parsedAmount } = input;

        const user = await User.findById(req.user.userId)
            .select('fullName')
            .exec();
        
            // Conditional rendering to check the user on the token still exists
        if (!user) {
            console.warn('[WARN: apiRoutes.js, /save] No user found for id', req.user.userId);
            return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
        }

        /* A conversion between a currency and itself is stored at a rate of 1,
        matching the short-circuit in /convert, rather than asking Frankfurter to
        price a pair it would reject. */
        let rate = 1;
        if (fromCurrency !== toCurrency) {
            const quote = await getConversionRate(fromCurrency, toCurrency);

            if (!quote) {// Conditional rendering to check a usable rate came back
                console.error('[ERROR: apiRoutes.js, /save] Missing exchange rate for', fromCurrency, toCurrency);
                return res.status(502).json({ success: false, message: 'Exchange rate unavailable for the requested currencies' });
            }
            rate = quote.rate;
        }

        const saved = await CurrencyConvert.create({
            user: user._id,
            fullName: user.fullName,
            currency: { baseCurrency: fromCurrency, targetCurrency: toCurrency },
            amount: parsedAmount,
            rate,
        });

        console.log('[SUCCESS: apiRoutes.js, /save] Saved conversion', saved._id, 'for user', user._id);
        return res.status(201).json({
            success: true,
            message: 'Conversion saved to your history',
            saved,// Carries the `convertedAmount` virtual, so the client can show what was stored
        });
    } catch (error) {
        // A schema validation failure is the user's input, not a server fault
        if (error.name === 'ValidationError') {
            console.error('[ERROR: apiRoutes.js, /save] Validation failed:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('[ERROR: apiRoutes.js, /save]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE A SAVED CONVERSION
=======================================*/
/* Removes one of the logged in user's saved conversions.

The id and the user are matched in a SINGLE query rather than fetching the
record and then checking who owns it. A conversion belonging to another user
therefore behaves exactly like one that does not exist, so an id cannot be
guessed at to find out whether it is someone else's. */
router.delete('/history/:id', checkJwtToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        /* Conditional rendering to check the id is a valid ObjectId: querying
        on a malformed id raises a CastError, which would return a 500 */
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error('[ERROR: apiRoutes.js, DELETE /history/:id] Invalid conversion id:', id);
            return res.status(400).json({ success: false, message: 'Invalid conversion id' });// Send a 400 (Bad Request) status code with a message
        }

        const removed = await CurrencyConvert.findOneAndDelete({ _id: id, user: userId }).exec();

        /* Conditional rendering to check a record was actually removed. Covers
        both a conversion that does not exist and one owned by another user. */
        if (!removed) {
            console.warn('[WARN: apiRoutes.js, DELETE /history/:id] No conversion', id, 'for user', userId);
            return res.status(404).json({ success: false, message: 'Conversion not found' });// Send a 404 (Not Found) status code with a message
        }

        console.log('[SUCCESS: apiRoutes.js, DELETE /history/:id] Deleted conversion', id, 'for user', userId);
        return res.status(200).json({
            success: true,
            message: 'Conversion removed from your history',
            conversionId: id,// Returned so the client can drop the conversion from the list on screen
        });
    } catch (error) {
        console.error('[ERROR: apiRoutes.js, DELETE /history/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

//==========EXPORT THE ROUTER===================
module.exports= router// Export the router to be used in other parts of the application
