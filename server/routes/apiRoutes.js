// apiRoutes.js: Currency endpoints, mounted at /api by app.js.

/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
// IMPORT REQUIRED MODULES AND PACKAGES
const express = require('express');
/* Required for ObjectId.isValid on DELETE /history/:id: querying on a malformed*/
const mongoose = require('mongoose');
const router = express.Router()
// IMPORT SCHEMAS/MODELS
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
/* Serves the currencies the converter can work with, as { code, name, symbol }. */
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
            Conversion.countDocuments({ user: userId }).exec(),
            Conversion.find({ user: userId })
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
against themselves, and the username is read from the database rather than
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
            .select('username')
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

        /* convertedAmount is not stored: the schema exposes it as a virtual off
        the amount and the rate, so it is left out of the create rather than
        saved as a third figure that could disagree with the other two. */
        const saved = await Conversion.create({
            user: user._id,
            username: user.username,
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

/*──────────────────────────── PUT ROUTES ──────────────────────────────────────
   PUT: UPDATE — Full replacement update of a resource on the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
UPDATE A SAVED CONVERSION
=======================================*/
/* api/updateConversion/:id - Reprices one of the logged in user's saved
conversions at the rate quoted today, and moves it onto a different target
currency when the body names one.

A PUT rather than a PATCH: a conversion is four figures, and three of them are
the input the fourth was worked out from, so the whole thing is replaced rather
than patched field by field — a body that changed the target currency on its own
would leave the record holding a rate for a pair it was never quoted for. The
body goes through the same parseConversionInput as POST /save, so a conversion
cannot be updated into something a new one could not be saved as.

The rate is FETCHED HERE rather than read from the body, exactly as it is on a
save, so an updated record still holds a rate the provider actually quoted. What
the record held before is returned alongside it as `previous`, because reporting
whether the rate has moved is the whole point of this route and the old figures
are gone from the database once it answers.

The user and the username are left as they are stored: the owner is never taken
from the body, and matching on the id and the user together means another
account's conversion is not found at all rather than found and then refused. */
router.put('/updateConversion/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;// The token payload signed in authRoutes.js uses `userId`

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: apiRoutes.js, PUT /updateConversion/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const conversionId = String(req.params.id ?? '').trim();

        /* Checked before the conversion is looked up, so a malformed id is
        reported as a 400 rather than reaching Mongoose as a CastError and being
        reported as a 500 */
        if (!mongoose.Types.ObjectId.isValid(conversionId)) {
            console.warn('[WARN: apiRoutes.js, PUT /updateConversion/:id] Invalid conversion id:', conversionId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'Invalid conversion id' });// Send a 400 (Bad Request) status code with a message
        }

        /* The whole conversion is expected in the body, not only what moved:
        this is a replacement, so it is parsed exactly as a save is */
        const input = await parseConversionInput(req.body);

        // Conditional rendering to check the submitted figures are usable
        if (input.message) {
            console.warn('[WARN: apiRoutes.js, PUT /updateConversion/:id]', input.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: input.message });// Send a 400 (Bad Request) status code with a message
        }

        const { fromCurrency, toCurrency, parsedAmount } = input;

        /* Matched on the conversion and the owner together, so another account's
        record is not found at all. Read whole rather than through a projection,
        because it is saved again below and Mongoose does not validate the paths
        a projection left out */
        const conversion = await Conversion.findOne({ _id: conversionId, user: userId }).exec();

        /* Conditional rendering to check a conversion with that id exists on this
        account. Covers both a conversion that does not exist and one owned by
        another user, the same as DELETE /history/:id */
        if (!conversion) {
            console.warn('[WARN: apiRoutes.js, PUT /updateConversion/:id] No conversion', conversionId, 'for user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'Conversion not found' });// Send a 404 (Not Found) status code with a message
        }

        /* Read off the record before anything is written over it, because the
        response reports what the conversion used to hold and the document itself
        no longer carries it once it has been set */
        const previous = {
            amount: conversion.amount,
            baseCurrency: conversion.currency?.baseCurrency,
            targetCurrency: conversion.currency?.targetCurrency,
            rate: conversion.rate,
        };

        /* A conversion between a currency and itself is stored at a rate of 1,
        matching the short-circuit in /convert and the same rule /save keeps,
        rather than asking Frankfurter to price a pair it would reject */
        let rate = 1;
        if (fromCurrency !== toCurrency) {
            const quote = await getConversionRate(fromCurrency, toCurrency);

            if (!quote) {// Conditional rendering to check a usable rate came back
                console.error('[ERROR: apiRoutes.js, PUT /updateConversion/:id] Missing exchange rate for', fromCurrency, toCurrency);// Log an error message in the console for debugging purposes
                /* Answered before anything is written, so a provider that cannot
                price the pair leaves the saved conversion exactly as it was */
                return res.status(502).json({ success: false, message: 'Exchange rate unavailable for the requested currencies' });
            }
            rate = quote.rate;
        }

        /* Set on the document and saved rather than written in place, so the
        schema's own validation runs on the replaced fields. convertedAmount is
        not written here either: the schema exposes it as a virtual off the
        amount and the rate, so there is no third figure to disagree with them */
        conversion.set({
            amount: parsedAmount,
            currency: { baseCurrency: fromCurrency, targetCurrency: toCurrency },
            rate,
        });

        await conversion.save();

        console.log('[SUCCESS: apiRoutes.js, PUT /updateConversion/:id] Updated conversion', conversionId, 'for user', userId, 'at rate', rate);
        return res.status(200).json({
            success: true,
            message: 'Conversion updated in your history',
            updated: conversion,// Carries the `convertedAmount` virtual, so the client can show what was stored
            previous,// What the record held before this call, which is gone from the database now
            /* Compared here rather than left to the client, which would have to
            know that a changed target currency prices a different pair and so is
            not the same rate moving */
            rateChanged: previous.rate !== rate || previous.targetCurrency !== toCurrency,
        });// Respond with a 200 (OK) status code and the updated conversion
    } catch (error) {
        // A schema validation failure is the user's input, not a server fault
        if (error.name === 'ValidationError') {
            console.error('[ERROR: apiRoutes.js, PUT /updateConversion/:id] Validation failed:', error.message);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: error.message });// Send a 400 (Bad Request) status code with a message
        }
        console.error('[ERROR: apiRoutes.js, PUT /updateConversion/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE A SAVED CONVERSION
=======================================*/
/* Removes one of the logged in user's saved conversions.*/
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

        const removed = await Conversion.findOneAndDelete({ _id: id, user: userId }).exec();

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
