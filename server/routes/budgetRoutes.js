// budgetRoutes.js
/* Budget endpoints, mounted at /budget by app.js
- GET /fetchBudget/:id - fetch a single trip budget
- GET /fetchBudgets - list the logged in user's budgets
- POST /addBudget - set a budget for a trip. A trip may only ever have one
- PATCH /editBudget/:id - edit a trip budget
- DELETE /deleteBudget/:id - delete a budget, and the expenses embedded in it

all routes require JWT Auth*/

/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const Budget = require('../models/budgetSchema');
const Trip = require('../models/tripSchema');
const { apiCurrencies } = require('../serverData/currencies');
const { EXPENSE_CATEGORIES } = require('../serverData/expenseData');
const { checkJwtToken } = require('./middleware');
const router = express.Router()

/* Codes the currency enum on an expense accepts, as a Set for lookup. Checked
here as well, because baseCurrency on the budget only caps its length at 3: an
unpriceable code would otherwise be stored and every expense filed against it
would fail to convert */
const CURRENCY_CODES = new Set(apiCurrencies);

/*=====================================
BUDGET INPUT PARSING AND VALIDATION
=======================================*/
/* Reads one money field off a submission and normalises it into the number the
schema stores. eturns `{ message }` describing the problem, or `{ value }` with the figure. */
const parseMoney = (value, label, { required = false } = {}) => {
    /* Only a number or a string can be read as an amount. Anything else
    coerces to a figure without being one — Number(true) is 1, Number([]) is 0
    and Number(['5']) is 5 — and would otherwise be stored as that figure */
    if (value !== undefined && value !== null && typeof value !== 'number' && typeof value !== 'string') {
        return { message: `${label} must be a number` };
    }

    /* Trimmed before the blank check, so a field that holds only spaces is
    read as empty rather than as Number('  '), which is 0 */
    const amount = typeof value === 'string' ? value.trim() : value;

    // Conditional rendering to check whether the field was filled in at all
    if (amount === undefined || amount === null || amount === '') {
        return required ? { message: `${label} is required` } : { value: null };
    }

    const parsed = Number(amount);

    /* isFinite rather than isNaN, so a figure too large to hold is refused as
    well: Number('1e999') is Infinity, which passes a NaN check and a min 0
    check and would be stored as Infinity */
    if (!Number.isFinite(parsed)) {
        return { message: `${label} must be a number` };
    }
    if (parsed < 0) {
        return { message: `${label} cannot be negative` };
    }

    return { value: parsed };
}

/* Reads one value off a submission by the schema path the form names its input
by. The budget form names them with those paths, so a category limit arrives as
'categoryLimits.food' and an alert as 'alerts.notifyOnExceed'. */
const readPath = (body, group, key) => {
    const nested = body?.[group]?.[key];
    return nested === undefined ? body?.[`${group}.${key}`] : nested;
}

/* Reads a budget's fields off a request body and normalises them into the shape
the document expects. Returns `{ message }` describing the first problem found, 
or the normalised fields when the input is usable — only the ones the body actually supplied. */
const parseBudgetInput = (body = {}, { partial = false } = {}) => {
    const { tripId, baseCurrency, totalBudget, dailyBudget } = body;
    const input = {};

    // ---- THE TRIP ------------------------------------------------------
    /* Only read on a create. A budget cannot be moved to another trip, so an
    edit that carries one is refused by the route itself rather than here */
    if (!partial) {
        const budgetTripId = String(tripId ?? '').trim();

        // Conditional rendering to check a trip was selected
        if (!budgetTripId) {
            return { message: 'Please select the trip this budget is for' };
        }
        /* Checked before the trip is looked up, so a malformed id is reported as
        a 400 rather than reaching Mongoose as a CastError and being reported as
        a 500 */
        if (!mongoose.Types.ObjectId.isValid(budgetTripId)) {
            return { message: 'The selected trip is not valid' };
        }

        input.tripId = budgetTripId;
    }

    // ---- THE BASE CURRENCY ---------------------------------------------
    /* Uppercased before it is checked, the way the schema stores it, so a code
    submitted in lower case is accepted rather than refused for its casing */
    if (!partial || baseCurrency !== undefined) {
        const budgetBaseCurrency = String(baseCurrency ?? '').trim().toUpperCase();

        // Conditional rendering to check a base currency was selected
        if (!budgetBaseCurrency) {
            return { message: 'A base currency is required' };
        }
        /* The schema only caps this at 3 characters, so the code is matched
        against the supported list here instead */
        if (!CURRENCY_CODES.has(budgetBaseCurrency)) {
            return { message: 'The base currency must be a supported 3-letter currency code' };
        }

        input.baseCurrency = budgetBaseCurrency;
    }

    // ---- THE TWO AMOUNTS -----------------------------------------------
    if (!partial || totalBudget !== undefined) {
        const total = parseMoney(totalBudget, 'Total budget', { required: true });

        if (total.message) return total;

        input.totalBudget = total.value;
    }

    /* Optional in both modes. Left blank, the schema's pre('save') hook divides
    the total by the length of the trip, which is what the form says under the
    input, so a cleared value is stored as null to let that happen again */
    if (dailyBudget !== undefined) {
        const daily = parseMoney(dailyBudget, 'Daily budget');

        if (daily.message) return daily;

        input.dailyBudget = daily.value;
    }

    // ---- THE CATEGORY LIMITS -------------------------------------------
    /* One optional cap per expense category, read from the same ten keys the
    schema builds the sub-document from. A limit left blank is stored as null,
    which is what the form means by a category having no cap of its own */
    const categoryLimits = {};

    for (const category of EXPENSE_CATEGORIES) {
        const limit = readPath(body, 'categoryLimits', category);

        // Conditional rendering to skip a category the submission did not carry
        if (limit === undefined) continue;

        const parsed = parseMoney(limit, `The ${category} limit`);

        if (parsed.message) return parsed;

        categoryLimits[category] = parsed.value;
    }

    if (Object.keys(categoryLimits).length) input.categoryLimits = categoryLimits;

    // ---- THE ALERTS ----------------------------------------------------
    /* Both default to true on the schema. Read as booleans rather than left to
    the checkbox, so an unticked box that arrives as the string 'false' turns the
    alert off instead of being read as a truthy string */
    const alerts = {};

    for (const alert of ['notifyAt80Percent', 'notifyOnExceed']) {
        const value = readPath(body, 'alerts', alert);

        // Conditional rendering to skip an alert the submission did not carry
        if (value === undefined) continue;

        alerts[alert] = !(value === false || value === 'false');
    }

    if (Object.keys(alerts).length) input.alerts = alerts;

    return input;
}

/*=====================================
VALIDATION ERROR SHAPING
=======================================*/
/* Mongoose collects every failed field rule into one ValidationError.
parseBudgetInput checks the same rules first, so this is only reached by a value
only the schema can judge. Flattened into a field keyed object so the form can
show each message against the input that caused it.

The keys are the schema's own paths — 'totalBudget', 'categoryLimits.food' — and
the form names each input by that path, so nothing has to be translated. */
const validationErrors = (error) => Object.fromEntries(
    /* Defaulted to an empty object, so a ValidationError raised without a
    collected field — which reading .errors of would throw on, inside the catch
    that is already handling a failure — is still reported as a 400 */
    Object.entries(error.errors ?? {}).map(([field, err]) => [field, err.message])
);

// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/* Listing the caller's budgets is served by /expense/fetchBudgets for now, and
is left as a comment rather than as a handler-less router.get: Express 5 throws
'argument handler is required' when a route is registered without one, so a
placeholder would stop the whole router loading and take every route below it
with it */
// budget/fetchBudgets - list the logged in user's budgets

/*=====================================
FETCH A SINGLE BUDGET
=======================================*/
/* budget/fetchBudget/:id - Fetches one budget by its own id.

The budget is matched on that id and the owner together, so another account's
budget is not found at all rather than found and then refused — which is also why
a missing one is reported as a 404 either way, and never says whether it exists on
someone else's account. Written alongside the edit route because that route cannot be reached without it.
*/
router.get('/fetchBudget/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: budgetRoutes.js, GET /fetchBudget/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const budgetId = String(req.params.id ?? '').trim();

        /* Checked before the budget is looked up, so a malformed id is reported
        as a 400 rather than reaching Mongoose as a CastError and being reported
        as a 500 */
        if (!mongoose.Types.ObjectId.isValid(budgetId)) {
            console.warn('[WARN: budgetRoutes.js, GET /fetchBudget/:id] Invalid budget id', budgetId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That budget id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        /* Matched on the budget and the owner together, so another account's
        budget is not found at all rather than found and then refused */
        const budget = await Budget.findOne({ _id: budgetId, userId })
            // The trip's title is stored on the trip, so it is read off that document
            .populate('tripId', 'title')
            .exec();

        // Conditional rendering to check a budget with that id exists on this account
        if (!budget) {
            console.warn('[WARN: budgetRoutes.js, GET /fetchBudget/:id] No budget found for id', budgetId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That budget could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        console.log('[SUCCESS: budgetRoutes.js, GET /fetchBudget/:id] Found budget', budgetId);// Log a success message in the console for debugging purposes
        return res.status(200).json({
            success: true,
            /* Flattened so the form reads tripId as the id it submits rather
            than as the populated trip it was returned as, with the title kept
            alongside for the disabled select to label it with */
            budget: {
                ...budget.toObject({ virtuals: true }),
                tripId: budget.tripId?._id ?? null,
                tripTitle: budget.tripId?.title ?? 'Trip no longer available',
            },
        });// Respond with a 200 (OK) status code and the budget
    } catch (error) {
        console.error('[ERROR: budgetRoutes.js, GET /fetchBudget/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})

/*──────────────────────────── POST ROUTES ─────────────────────────────────────
   POST: CREATE — Used to send information to the server
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
ADD A BUDGET
=======================================*/
/* budget/addBudget - Sets the budget for one of the logged in user's trips. A
single trip may only ever have one. */
router.post('/addBudget', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: budgetRoutes.js, POST /addBudget] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const input = parseBudgetInput(req.body);// Extract and normalise the budget fields from the request body

        // Conditional rendering to check the submitted budget is usable
        if (input.message) {
            console.warn('[WARN: budgetRoutes.js, POST /addBudget]', input.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: input.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        /* Matched on the trip and the owner together, so another account's trip
        is not found at all. Doubles as a check that the trip still exists, which
        the pre('save') hook needs to work out the daily budget */
        const trip = await Trip.findOne({ _id: input.tripId, userId }).select('_id').exec();

        // Conditional rendering to check the selected trip is one of the caller's own
        if (!trip) {
            console.warn('[WARN: budgetRoutes.js, POST /addBudget] No trip found for id', input.tripId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That trip could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        /* One budget per trip, so an existing one is an edit rather than a
        second create. Reported keyed on tripId so the form can show it against
        the select the trip was chosen in */
        const existing = await Budget.findOne({ tripId: trip._id }).select('_id').exec();

        // Conditional rendering to check the trip does not already have a budget
        if (existing) {
            console.warn('[WARN: budgetRoutes.js, POST /addBudget] Trip', input.tripId, 'already has budget', existing._id);// Log a warning message in the console for debugging purposes
            return res.status(409).json({// Respond with a 409 (Conflict) status code
                success: false,
                message: 'That trip already has a budget. Edit the existing one instead.',
                errors: { tripId: 'This trip already has a budget' },
            });
        }

        const budget = new Budget({
            tripId: trip._id,
            // Read off the token, so the budget always belongs to the caller
            userId,
            ...input,
        });

        /* Saving is what validates the document, so a rule only the schema can
        judge is raised from here as a ValidationError and handled below rather
        than being written. It is also what runs the pre('save') hook that fills
        in a blank daily budget */
        await budget.save();

        console.log('[SUCCESS: budgetRoutes.js, POST /addBudget] Budget added:', budget._id, 'for trip', trip._id);// Log a success message in the console for debugging purposes
        return res.status(201).json({
            success: true,
            message: 'Budget created successfully.',
            /* Returned whole, with the virtuals the schema is set to include, so
            the page can report the daily budget the hook worked out without
            refetching to see it */
            budget,
        });// Respond with a 201 (Created) status code and the new budget
    } catch (error) {
        // Raised by a rule only the schema can judge, reported against its field
        if (error.name === 'ValidationError') {
            const errors = validationErrors(error);
            console.error('[ERROR: budgetRoutes.js, POST /addBudget] Validation failed:', errors);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'Budget could not be created, please check the highlighted fields', errors });// Respond with a 400 (Bad Request) status code
        }

        console.error('[ERROR: budgetRoutes.js, POST /addBudget]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})

/*──────────────────────────── PATCH ROUTES ───────────────────────────────────
   PATCH: UPDATE — Used to partially update information in the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
EDIT A BUDGET
=======================================*/
/* budget/editBudget/:id - Edits one of the logged in user's trip budgets.

The budget is matched on its id and the owner together, so another account's
budget is not found at all rather than found and then refused — which is also why
a missing one is reported as a 404 either way, and never says whether it exists
on someone else's account.

A PATCH, so only the fields the body carries are written and the rest are left as
they are stored. Two of them cannot be written at all:

- tripId, because a trip may only have one budget and moving this one would
  either collide with the target trip's own or leave the original with none. The
  form disables the select in edit mode for that reason, so a body carrying a
  different trip did not come from it.
- baseCurrency, once the budget holds expenses. Every expense is converted into
  that currency as it is added, and totalSpent sums those stored figures, so
  changing it afterwards would leave the totals adding up amounts in a currency
  they are no longer expressed in. It is free to change on a budget with nothing
  spent against it yet. */
router.patch('/editBudget/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: budgetRoutes.js, PATCH /editBudget/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const budgetId = String(req.params.id ?? '').trim();

        /* Checked before the budget is looked up, so a malformed id is reported
        as a 400 rather than reaching Mongoose as a CastError and being reported
        as a 500 */
        if (!mongoose.Types.ObjectId.isValid(budgetId)) {
            console.warn('[WARN: budgetRoutes.js, PATCH /editBudget/:id] Invalid budget id', budgetId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That budget id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        const input = parseBudgetInput(req.body, { partial: true });// Extract and normalise only the fields the body carries

        // Conditional rendering to check the submitted changes are usable
        if (input.message) {
            console.warn('[WARN: budgetRoutes.js, PATCH /editBudget/:id]', input.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: input.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        // Conditional rendering to check the body carried something to change
        if (!Object.keys(input).length) {
            console.warn('[WARN: budgetRoutes.js, PATCH /editBudget/:id] Nothing to update on budget', budgetId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'There is nothing to update' });// Respond with a 400 (Bad Request) status code
        }

        /* Matched on the budget and the owner together, so another account's
        budget is not found at all rather than found and then refused */
        const budget = await Budget.findOne({ _id: budgetId, userId }).exec();

        // Conditional rendering to check a budget with that id exists on this account
        if (!budget) {
            console.warn('[WARN: budgetRoutes.js, PATCH /editBudget/:id] No budget found for id', budgetId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That budget could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        /* A budget belongs to the trip it was set for. The same trip is not a
        change and is ignored, so a form that submits the disabled select's value
        anyway is not refused for it */
        const submittedTripId = String(req.body?.tripId ?? '').trim();

        if (submittedTripId && submittedTripId !== String(budget.tripId)) {
            console.warn('[WARN: budgetRoutes.js, PATCH /editBudget/:id] Attempt to move budget', budgetId, 'to trip', submittedTripId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({// Respond with a 400 (Bad Request) status code
                success: false,
                message: 'A budget cannot be moved to another trip. Set a budget on that trip instead.',
                errors: { tripId: 'A budget cannot be moved to another trip' },
            });
        }

        /* The stored convertedAmount of every expense is expressed in the
        current base currency, and totalSpent sums those figures, so the currency
        can only be changed while there is nothing to re-express */
        if (
            input.baseCurrency &&
            input.baseCurrency !== budget.baseCurrency &&
            budget.expenses.length
        ) {
            console.warn('[WARN: budgetRoutes.js, PATCH /editBudget/:id] Attempt to change the base currency of budget', budgetId, 'with', budget.expenses.length, 'expenses');// Log a warning message in the console for debugging purposes
            return res.status(409).json({// Respond with a 409 (Conflict) status code
                success: false,
                message: `The base currency cannot be changed once expenses have been logged against the budget, because each one was converted into ${budget.baseCurrency} as it was added.`,
                errors: { baseCurrency: `This budget already has expenses converted into ${budget.baseCurrency}` },
            });
        }

        // ---- APPLY THE CHANGES ---------------------------------------------
        /* Assigned by path rather than by replacing the nested objects, so an
        edit that carries one category limit leaves the other nine as they are
        stored instead of clearing them */
        if (input.baseCurrency !== undefined) budget.baseCurrency = input.baseCurrency;
        if (input.totalBudget !== undefined) budget.totalBudget = input.totalBudget;
        if (input.dailyBudget !== undefined) budget.dailyBudget = input.dailyBudget;

        for (const [category, limit] of Object.entries(input.categoryLimits ?? {})) {
            budget.set(`categoryLimits.${category}`, limit);
        }
        for (const [alert, on] of Object.entries(input.alerts ?? {})) {
            budget.set(`alerts.${alert}`, on);
        }

        /* Saving is what validates the document, so a rule only the schema can
        judge is raised from here as a ValidationError and handled below rather
        than being written. It is also what runs the pre('save') hook, which
        works the daily budget out again when this edit cleared it.

        validateModifiedOnly, because an expense is a sub-document of the budget
        rather than a model of its own: a plain save() validates every path the
        document was loaded with, so all of the stored expenses would be checked
        again by an edit that only touched the budget's own fields. One that no
        longer passes — a currency since dropped from the supported list, a title
        longer than the limit it was stored before — would fail the whole edit
        with a 400 keyed on expenses.0.currency, which is not a field the budget
        form has an input for and so could never be corrected from it */
        await budget.save({ validateModifiedOnly: true });

        console.log('[SUCCESS: budgetRoutes.js, PATCH /editBudget/:id] Budget updated:', budget._id);// Log a success message in the console for debugging purposes
        return res.status(200).json({
            success: true,
            message: 'Budget updated successfully.',
            /* Returned whole, with the virtuals the schema is set to include, so
            the page can report the moved totals without refetching to see them */
            budget,
        });// Respond with a 200 (OK) status code and the updated budget
    } catch (error) {
        // Raised by a rule only the schema can judge, reported against its field
        if (error.name === 'ValidationError') {
            const errors = validationErrors(error);
            console.error('[ERROR: budgetRoutes.js, PATCH /editBudget/:id] Validation failed:', errors);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'Budget could not be updated, please check the highlighted fields', errors });// Respond with a 400 (Bad Request) status code
        }

        console.error('[ERROR: budgetRoutes.js, PATCH /editBudget/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})


/*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE A BUDGET`
=======================================*/
/* budget/deleteBudget/:id - Removes one of the logged in user's trip budgets,
and the expenses embedded in it.

The budget is matched on its id and the owner in a SINGLE query rather than being
fetched and then checked over, so another account's budget behaves exactly like
one that does not exist: an id cannot be guessed at to find out whether it is
someone else's, and a missing one is reported as a 404 either way.

**The expenses go with it.** An expense is not a model of its own — it is a
sub-document of the budget of its trip (see section 6.1 of Documents/SCHEMAS.md)
— so removing the parent document removes every expense filed against that trip
in the same write, with nothing left orphaned behind it. That is not a side
effect to be worked around but the only shape a delete can take here, so the
count that went with it is returned for the client to say so.

The trip itself is left alone. A budget belongs to a trip, not the other way
round, so the trip stays and can simply be given a new budget: POST /addBudget
answers 409 only while one exists, and this is what clears that. Its stored
hasBudget flag is not written either, the same as on the create — no route writes
to it, and GET /trip/fetchTrips answers hasBudget off the caller's budgets rather
than reading it, so the flag corrects itself the moment this delete lands. */
router.delete('/deleteBudget/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: budgetRoutes.js, DELETE /deleteBudget/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const budgetId = String(req.params.id ?? '').trim();

        /* Checked before the budget is looked up, so a malformed id is reported
        as a 400 */
        if (!mongoose.Types.ObjectId.isValid(budgetId)) {
            console.warn('[WARN: budgetRoutes.js, DELETE /deleteBudget/:id] Invalid budget id', budgetId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That budget id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        /* Matched on the budget and the owner together, so another account's
        budget is not found at all rather than found and then deleted. */
        const budget = await Budget.findOneAndDelete({ _id: budgetId, userId }).exec();

        /* Conditional rendering to check a budget was actually removed. Covers
        both a budget that does not exist and one on another account */
        if (!budget) {
            console.warn('[WARN: budgetRoutes.js, DELETE /deleteBudget/:id] No budget found for id', budgetId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That budget could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        // The expenses that were embedded in it, and so were removed with it
        const removedExpenses = budget.expenses?.length ?? 0;

        console.log('[SUCCESS: budgetRoutes.js, DELETE /deleteBudget/:id] Deleted budget', budgetId, 'for trip', String(budget.tripId), 'with', removedExpenses, 'expense(s)');// Log a success message in the console for debugging purposes
        return res.status(200).json({
            success: true,
            /* Names the expenses that went with it rather than reporting the
            budget alone, because the page's expense list is filled from the
            budgets and would otherwise appear to lose rows unexplained */
            message: removedExpenses
                ? `Budget deleted successfully, along with the ${removedExpenses} expense${removedExpenses === 1 ? '' : 's'} logged against it.`
                : 'Budget deleted successfully.',
            /* Returned so the client can drop the row and reopen the trip to a
            new budget without waiting on a refetch to learn which one went */
            budgetId,
            tripId: budget.tripId ?? null,
            removedExpenses,
        });// Respond with a 200 (OK) status code and what was removed
    } catch (error) {
        console.error('[ERROR: budgetRoutes.js, DELETE /deleteBudget/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})

// ======EXPORT THE ROUTER==========
module.exports = router;
