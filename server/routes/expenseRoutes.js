// expenseRoutes.js
/*expense endpoints, mounted at /expense by app.js
- GET /fetchBudgets - list the logged in user's budgets, for the form's trip select
- GET fetchExpenses - fetch all expenses
- GET /fetchExpense/:id - fetch a single expense by Id
- POST /addExpense - add an expens
- PATCH /updateExpense/:id - Edit an expense, moving it to another trip's budget
  when the trip it is filed against is changed
- DELETE /delete/:id - delete an expense

all routes require JWT Auth

An expense is not a model of its own: it is embedded in the budget of the trip it
belongs to, one budget per trip (see section 6.1 of Documents/SCHEMAS.md). So an
expense is always written through its parent, and a trip with no budget has
nowhere to put one — which is why the form's trip select is filled from
/fetchBudgets rather than from the trip list.
*/

/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Budget = require('../models/budgetSchema')
const User = require('../models/userSchema')
/* Not queried here, but required so the Trip model is registered on mongoose
whatever order the route modules load in. /fetchBudgets populates the trip's
title from it, and saving a budget runs a pre('save') hook that reads the trip's
dates, both of which throw a MissingSchemaError if nothing has loaded it */
require('../models/tripSchema')
const { apiCurrencies } = require('../serverData/currencies');
/* The same two enums budgetSchema stores an expense with, so a submission is
checked against the values the schema will actually accept */
const { EXPENSE_CATEGORIES, PAYMENT_METHODS } = require('../serverData/expenseData');
const { getConversionRate } = require('../util/currencyService');
const { checkJwtToken } = require('./middleware');
const router = express.Router()

/* The maxlength values the expense subdocument stores, listed here so an
oversized submission is reported as a 400 with one clear message rather than
reaching Mongoose as a ValidationError */
const TITLE_MAX = 100;
const NOTES_MAX = 300;
/* Codes the currency enum accepts, as a Set for lookup. The offline snapshot is
used rather than the live provider list, because the enum on the schema is what
ultimately accepts or refuses the code */
const CURRENCY_CODES = new Set(apiCurrencies);

/*=====================================
EXPENSE INPUT PARSING AND VALIDATION
=======================================*/
/* Matches a submitted value against one of the schema's enums without caring
about the casing or the separator it arrived in: the form shows 'CREDIT CARD'
while the schema stores 'credit_card'. Returns the stored spelling, or undefined
when the value is not one of the allowed ones */
const matchEnum = (value, allowed) => {
    const normalised = String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    return allowed.find((option) => option === normalised);
}

/* The last moment of today, the latest date an expense may carry. An expense
records money that has already been spent, so a later date is a mistake. The end
of the day rather than the current time, so an expense entered this afternoon for
today is not read as being in the future */
const endOfToday = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
}

/* Reads an expense's fields off a request body and normalises them into the
shape the expense subdocument expects. Every rule the schema enforces is checked
first, so a bad submission is reported as a 400 with one clear message instead of
a Mongoose ValidationError.

Neither the owner nor the converted amount is read here. username comes from the
account, and convertedAmount is worked out from an exchange rate rather than
typed. The trip is identified by its id alone, which is what the budget is then
found by.

`partial` is the difference between the two routes. A create has to carry the
whole expense, so a field that is missing is reported as missing. An edit only
carries what the form was asked to change, so a field the body does not hold at
all is left as it is stored, while one that is present is checked the same way it
would be on a create — a blank title is a blank title in both, and is refused
rather than written over a stored one.

Returns `{ message }` describing the first problem found, or the normalised
expense fields when the input is usable — on an edit, only the ones the body
supplied. */
const parseExpenseInput = (submission = {}, { partial = false } = {}) => {
    const {
        tripId,
        title,
        amount,
        currency,
        category,
        date,
        notes,
        paymentMethod,
        isPaid,
    } = submission;
    const input = {};

    // ---- THE TRIP ------------------------------------------------------
    if (!partial || tripId !== undefined) {
        const expenseTripId = String(tripId ?? '').trim();

        // Conditional rendering to check a trip was selected
        if (!expenseTripId) {
            return { message: 'Please select the trip this expense belongs to' };
        }
        /* Checked before the budget is looked up, so a malformed id is reported as a
        400 rather than reaching Mongoose as a CastError and being reported as a 500 */
        if (!mongoose.Types.ObjectId.isValid(expenseTripId)) {
            return { message: 'The selected trip is not valid' };
        }

        input.tripId = expenseTripId;
    }

    // ---- THE TITLE -----------------------------------------------------
    if (!partial || title !== undefined) {
        const expenseTitle = String(title ?? '').trim();
        // Conditional rendering to check the title was supplied, and is short enough to store
        if (!expenseTitle) {
            return { message: 'Expense title is required' };
        }
        if (expenseTitle.length > TITLE_MAX) {
            return { message: `Expense title cannot exceed ${TITLE_MAX} characters` };
        }

        input.title = expenseTitle;
    }

    // ---- THE AMOUNT ----------------------------------------------------
    if (!partial || amount !== undefined) {
        /* Coerced before it is stored, so a value the browser never validated, such
        as one sent straight to the API, is caught here rather than reaching Mongoose
        as a CastError. Zero is refused as well as a negative: the form's input
        starts at 0.01, and an expense of nothing is not an expense */
        if (amount === undefined || amount === null || amount === '') {
            return { message: 'Amount is required' };
        }
        const expenseAmount = Number(amount);
        if (Number.isNaN(expenseAmount)) {
            return { message: 'Amount must be a number' };
        }
        if (expenseAmount <= 0) {
            return { message: 'Amount must be greater than 0' };
        }

        input.amount = expenseAmount;
    }

    // ---- THE CURRENCY --------------------------------------------------
    if (!partial || currency !== undefined) {
        /* Uppercased before it is checked, the way the schema stores it, so a code
        submitted in lower case is accepted rather than refused for its casing */
        const expenseCurrency = String(currency ?? '').trim().toUpperCase();
        // Conditional rendering to check the currency is one the schema's enum allows
        if (!expenseCurrency) {
            return { message: 'Expense currency is required' };
        }
        if (!CURRENCY_CODES.has(expenseCurrency)) {
            return { message: 'Expense currency must be a supported 3-letter currency code' };
        }

        input.currency = expenseCurrency;
    }

    // ---- THE CATEGORY --------------------------------------------------
    if (!partial || category !== undefined) {
        const expenseCategory = matchEnum(category, EXPENSE_CATEGORIES);
        // Conditional rendering to check the category is one the schema's enum allows
        if (!expenseCategory) {
            return { message: `Expense category must be one of: ${EXPENSE_CATEGORIES.join(', ')}` };
        }

        input.category = expenseCategory;
    }

    // ---- THE DATE ------------------------------------------------------
    if (!partial || date !== undefined) {
        /* Converted before it is stored, for the same reason the amount is coerced.
        An expense records money already spent, so a date after today is refused
        here as well as by the validator on the subdocument */
        const expenseDate = new Date(date);
        if (!date || Number.isNaN(expenseDate.getTime())) {
            return { message: 'A valid expense date is required' };
        }
        if (expenseDate > endOfToday()) {
            return { message: 'An expense date cannot be in the future' };
        }

        input.date = expenseDate;
    }

    // ---- THE NOTES -----------------------------------------------------
    if (!partial || notes !== undefined) {
        /* Optional, and stored as an empty string rather than left unset when it is
        not filled in, matching the schema's own default. On an edit that makes an
        empty string the way the notes are cleared, since it is only read here when
        the body actually carries the field */
        const expenseNotes = String(notes ?? '').trim();
        if (expenseNotes.length > NOTES_MAX) {
            return { message: `Notes cannot exceed ${NOTES_MAX} characters` };
        }

        input.notes = expenseNotes;
    }

    // ---- THE PAYMENT METHOD --------------------------------------------
    if (!partial || paymentMethod !== undefined) {
        /* Defaulted rather than rejected on a create, matching the schema's own
        default, so a submission that leaves the payment method unset still
        records a cash expense. An edit has nothing to default to: a method the
        body carries is one the user chose, so a blank one is refused rather than
        quietly turning a card payment into cash */
        const expensePaymentMethod = !partial
            && (paymentMethod === undefined || paymentMethod === null || paymentMethod === '')
            ? 'cash'
            : matchEnum(paymentMethod, PAYMENT_METHODS);

        // Conditional rendering to check a supplied payment method is one the schema's enum allows
        if (!expensePaymentMethod) {
            return { message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` };
        }

        input.paymentMethod = expensePaymentMethod;
    }

    // ---- IS PAID -------------------------------------------------------
    if (!partial || isPaid !== undefined) {
        /* An unticked checkbox is not sent by fetch as false unless the form
        puts it there, so anything but an explicit false is read as paid, which
        is the schema's default */
        input.isPaid = isPaid === false || isPaid === 'false' ? false : true;
    }

    return input;
}

/*=====================================
VALIDATION ERROR SHAPING
=======================================*/
/* Mongoose collects every failed field rule into one ValidationError.
parseExpenseInput checks the same rules first, so this is only reached by a value
only the schema can judge. Flattened into a field keyed object so the form can
show each message against the input that caused it.

An embedded expense is keyed by its position in the parent, for example
'expenses.3.amount', so the index is stripped back to the field name both expense
forms know the input by. */
const validationErrors = (error) => Object.fromEntries(
    Object.entries(error.errors).map(([field, err]) => [
        field.replace(/^expenses\.\d+\./, ''),
        err.message,
    ])
);

/*=====================================
EXPENSE OUTPUT SHAPING
=======================================*/
/* One embedded expense flattened into the shape a page reads it in, with the
context it is only meaningful alongside.

An expense is stored inside the budget of its trip, so on its own it says what
was spent but not what it was spent against: the trip it belongs to, and the
currency its convertedAmount is expressed in. Both are read off the parent here,
so a page does not have to walk the budget to display one expense, and the id of
the parent goes with it, which is what an edit or a delete is addressed to.

The trip is expected to have been populated by the caller with its title, and
comes back null when the trip has since been deleted. Such an expense is still
listed, unlike in /fetchBudgets where a trip that is gone is dropped: that list
fills a select and must not offer a trip an expense cannot be filed to, while
this one is a record of money already spent. */
const shapeExpense = (budget, expense) => ({
    ...expense.toObject(),
    budgetId: budget._id,
    // The currency convertedAmount is in, so an amount can be labelled with it
    baseCurrency: budget.baseCurrency,
    tripId: budget.tripId?._id ?? null,
    tripTitle: budget.tripId?.title ?? 'Trip no longer available',
})

/*=====================================
CONVERTED AMOUNT
=======================================*/
/* The expense amount in the parent budget's baseCurrency, so every expense on a
budget can be totalled against it whatever it was paid in.

null in the two cases the schema documents: the expense is already in the base
currency, so there is nothing to convert, or no rate could be read. A rate is
fetched live for every conversion, so an unreachable provider must not cost the
user the expense itself — it is stored unconverted and can be filled in later. */
const resolveConvertedAmount = async (amount, currency, baseCurrency) => {
    // Conditional rendering to skip the request when both are the same currency
    if (currency === baseCurrency) {
        return null;
    }

    try {
        const conversion = await getConversionRate(currency, baseCurrency);

        // Conditional rendering to check the provider priced the pair
        if (!conversion) {
            console.warn(`[WARN: expenseRoutes.js, resolveConvertedAmount] No rate for ${currency} to ${baseCurrency}, storing the expense unconverted`);// Log a warning message in the console for debugging purposes
            return null;
        }

        // Rounded to the two decimals money is written in
        return Math.round(amount * conversion.rate * 100) / 100;
    } catch (error) {
        /* Only an unreachable or broken provider reaches here, a pair it will
        not price is reported as a missing rate above */
        console.error('[ERROR: expenseRoutes.js, resolveConvertedAmount]', error.message);// Log an error message in the console for debugging purposes
        return null;
    }
}

// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
LIST THE LOGGED IN USER'S BUDGETS
=======================================*/
/* expense/fetchBudgets - Lists every budget belonging to the logged in user,
with the title of the trip it was set for.

Filtered on the userId taken from the JWT, so the list can only ever hold the
caller's own budgets. Used to fill the add expense form's trip select: an expense
is embedded in a budget, so only a trip that already has one can be spent
against, and the select would otherwise offer trips the expense could not be
filed to. The base currency is returned with each, so the form can say which
currency the amount will be converted into.

Only the fields the select needs are returned, not the embedded expenses, which
would make the response grow with every expense ever added. */
router.get('/fetchBudgets', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: expenseRoutes.js, GET /fetchBudgets] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const budgets = await Budget.find({ userId })
            .select('tripId baseCurrency totalBudget')
            // The trip's title is stored on the trip, so it is read off that document
            .populate('tripId', 'title')
            .sort({ createdAt: -1 })
            .exec();

        /* Flattened into the shape the select uses, rather than handing the
        form a populated tripId it would have to unwrap. A budget whose trip has
        since been deleted is left out: there is no trip left to file against */
        const tripBudgets = budgets
            .filter((budget) => budget.tripId)
            .map((budget) => ({
                budgetId: budget._id,
                tripId: budget.tripId._id,
                tripTitle: budget.tripId.title,
                baseCurrency: budget.baseCurrency,
                totalBudget: budget.totalBudget,
            }));

        console.log(`[SUCCESS: expenseRoutes.js, GET /fetchBudgets] Found ${tripBudgets.length} budgets for user ${userId}`);// Log a success message in the console for debugging purposes
        return res.status(200).json({ success: true, count: tripBudgets.length, budgets: tripBudgets });// Respond with a 200 (OK) status code and the list of budgets
    } catch (error) {
        console.error('[ERROR: expenseRoutes.js, GET /fetchBudgets]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})
/*=====================================
LIST THE LOGGED IN USER'S EXPENSES
=======================================*/
/* expense/fetchExpenses - Lists every expense belonging to the logged in user,
across all of their trips.

An expense is embedded in the budget of its trip rather than stored on its own,
so there is no expense collection to query: the caller's budgets are read and
the expenses they hold are flattened into one list. Filtered on the userId taken
from the JWT, so the list can only ever hold the caller's own expenses.

Sorted after they are gathered rather than by the database, because they arrive
grouped by the budget they came out of and the page shows them as one list,
newest spend first. */
router.get('/fetchExpenses', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: expenseRoutes.js, GET /fetchExpenses] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        /* Only the fields an expense is displayed with are read, not the
        budget's own figures, which the list does not report on */
        const budgets = await Budget.find({ userId })
            .select('tripId baseCurrency expenses')
            // The trip's title is stored on the trip, so it is read off that document
            .populate('tripId', 'title')
            .exec();

        const expenses = budgets
            .flatMap((budget) => budget.expenses.map((expense) => shapeExpense(budget, expense)))
            // Newest spend first, so the most recent expense is nearest the top
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log(`[SUCCESS: expenseRoutes.js, GET /fetchExpenses] Found ${expenses.length} expenses for user ${userId}`);// Log a success message in the console for debugging purposes
        return res.status(200).json({ success: true, count: expenses.length, expenses });// Respond with a 200 (OK) status code and the list of expenses
    } catch (error) {
        console.error('[ERROR: expenseRoutes.js, GET /fetchExpenses]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})

/*=====================================
FETCH A SINGLE EXPENSE
=======================================*/
/* expense/fetchExpense/:id - Fetches one expense by its own id.

The id is the one Mongo gave the embedded subdocument, not a document of its
own, so the parent is found by the expense it holds and the expense is then read
off it. The budget is matched on that id and the owner together, so another
account's expense is not found at all rather than found and then refused —
which is also why a missing one is reported as a 404 either way, and never says
whether it exists on someone else's account.

Used to fill the edit form with what is currently stored, so the trip and the
base currency travel with it the same way they do in the list. */
router.get('/fetchExpense/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: expenseRoutes.js, GET /fetchExpense/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const expenseId = String(req.params.id ?? '').trim();

        /* Checked before the budget is looked up, so a malformed id is reported
        as a 400 rather than reaching Mongoose as a CastError and being reported
        as a 500 */
        if (!mongoose.Types.ObjectId.isValid(expenseId)) {
            console.warn('[WARN: expenseRoutes.js, GET /fetchExpense/:id] Invalid expense id', expenseId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That expense id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        /* Matched on the expense and the owner together, so a budget belonging
        to another account is not found at all */
        const budget = await Budget.findOne({ userId, 'expenses._id': expenseId })
            .select('tripId baseCurrency expenses')
            // The trip's title is stored on the trip, so it is read off that document
            .populate('tripId', 'title')
            .exec();

        // Conditional rendering to check an expense with that id exists on this account
        if (!budget) {
            console.warn('[WARN: expenseRoutes.js, GET /fetchExpense/:id] No expense found for id', expenseId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That expense could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        // The subdocument itself, read off the parent the query matched it in
        const expense = budget.expenses.id(expenseId);

        /* The query already matched the budget on this expense, so it is only
        missing if it was removed between the two, which is still nothing to
        return */
        if (!expense) {
            console.warn('[WARN: expenseRoutes.js, GET /fetchExpense/:id] Expense', expenseId, 'not present on budget', budget._id);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That expense could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        console.log('[SUCCESS: expenseRoutes.js, GET /fetchExpense/:id] Found expense', expenseId, 'on budget', budget._id);// Log a success message in the console for debugging purposes
        return res.status(200).json({ success: true, expense: shapeExpense(budget, expense) });// Respond with a 200 (OK) status code and the expense
    } catch (error) {
        console.error('[ERROR: expenseRoutes.js, GET /fetchExpense/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})
/*──────────────────────────── POST ROUTES ─────────────────────────────────────
   POST: CREATE — Used to send information to the server
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
ADD AN EXPENSE
=======================================*/
/* expense/addExpense - Adds one expense to the budget of the selected trip.

An expense is embedded in its budget rather than stored on its own, so it is
pushed onto the parent and the parent is saved: that is what runs the
subdocument's own validation, and what keeps the budget's totals virtuals in
agreement with what it holds.

The owner is taken from the JWT and the username is read from the database, so a
body carrying another account's username cannot file an expense against someone
else. The form shows the username as a read only field for that reason: it is
there to confirm who the expense is being logged for, not to be submitted.

The budget is matched on the trip and the owner together, so an expense cannot be
added to another account's budget, and a trip with no budget is reported as such
rather than silently creating one — a budget needs a total, which this form does
not ask for.

Everything else goes through parseExpenseInput, so the whole submission is
checked and normalised in one place before the subdocument is built. */
router.post('/addExpense', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: expenseRoutes.js, POST /addExpense] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const input = parseExpenseInput(req.body);// Extract and normalise the expense fields from the request body

        // Conditional rendering to check the submitted expense is usable
        if (input.message) {
            console.warn('[WARN: expenseRoutes.js, POST /addExpense]', input.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: input.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        /* The username is stored on the expense, so read from the account rather
        than trusted from the body. Doubles as a check that the user on the token
        still exists */
        const user = await User.findById(userId).select('username').exec();

        // Conditional rendering to check the user on the token still exists
        if (!user) {
            console.warn('[WARN: expenseRoutes.js, POST /addExpense] No user found for id', userId);// Log a warning message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });// Respond with a 401 (Unauthorised) status code
        }

        /* Matched on the trip and the owner together, so another account's
        budget is not found at all rather than found and then refused */
        const budget = await Budget.findOne({ tripId: input.tripId, userId: user._id }).exec();

        // Conditional rendering to check the selected trip has a budget to spend against
        if (!budget) {
            console.warn('[WARN: expenseRoutes.js, POST /addExpense] No budget found for trip', input.tripId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'The selected trip has no budget yet. Set a budget for it before adding an expense.' });// Respond with a 404 (Not Found) status code
        }

        /* Worked out from a live rate rather than taken from the body, so the
        figure the budget is totalled on cannot be edited on its way in */
        const convertedAmount = await resolveConvertedAmount(
            input.amount,
            input.currency,
            budget.baseCurrency
        );

        budget.expenses.push({
            // Read off the account, so it always matches the owner of the budget
            username: user.username,
            title: input.title,
            amount: input.amount,
            currency: input.currency,
            convertedAmount,
            category: input.category,
            date: input.date,
            notes: input.notes,
            paymentMethod: input.paymentMethod,
            isPaid: input.isPaid,
        })

        /* Saving the parent is what validates the subdocument, so a rule only
        the schema can judge is raised from here as a ValidationError and handled
        below rather than being written */
        await budget.save();

        // The expense as it was stored, with the _id Mongo gave the subdocument
        const newExpense = budget.expenses[budget.expenses.length - 1];

        console.log('[SUCCESS: expenseRoutes.js, POST /addExpense] Expense added:', newExpense._id, 'to budget', budget._id);// Log a success message in the console for debugging purposes
        return res.status(201).json({
            success: true,
            message: 'Expense added successfully.',
            expense: newExpense,
            /* The budget's own figures move with every expense, so they are
            returned with it and the page does not have to refetch to report
            what is left */
            budget: {
                _id: budget._id,
                tripId: budget.tripId,
                baseCurrency: budget.baseCurrency,
                totalBudget: budget.totalBudget,
                totalSpent: budget.totalSpent,
                remaining: budget.remaining,
                percentUsed: budget.percentUsed,
            },
        });// Respond with a 201 (Created) status code and the new expense
    } catch (error) {
        /* Raised by a rule only the schema can judge, reported against its own
        field so the form can show each message under the input that caused it */
        if (error.name === 'ValidationError') {
            const errors = validationErrors(error);
            console.error('[ERROR: expenseRoutes.js, POST /addExpense] Validation failed:', errors);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'Expense could not be added, please check the highlighted fields', errors });// Respond with a 400 (Bad Request) status code
        }

        console.error('[ERROR: expenseRoutes.js, POST /addExpense]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})
/*──────────────────────────── PATCH ROUTES ───────────────────────────────────
   PATCH: UPDATE — Used to partially update information in the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
EDIT AN EXPENSE
=======================================*/
/* expense/updateExpense/:id - Edits one of the logged in user's expenses.

The id is the one Mongo gave the embedded subdocument, so the parent budget is
found by the expense it holds, matched on the owner at the same time: another
account's expense is not found at all rather than found and then refused — which
is also why a missing one is reported as a 404 either way, and never says whether
it exists on someone else's account.

Three things cannot be written through here:
- the owner, username, which is read off the account for the same reason it is on
  a create
- convertedAmount, which is worked out from an exchange rate rather than typed,
  and is recalculated below whenever the figure it was derived from moves
- the expense's own id, which is kept even when the expense changes trip

Only the fields the form filled in arrive, so everything goes through
parseExpenseInput in partial mode: a field the body does not carry is left as it
is stored, and one that is present is checked the same way a create checks it.

Changing the trip is a move rather than a field being written. An expense is
embedded in the budget of its trip rather than stored on its own, so it is taken
off one parent and pushed onto the other, and a trip with no budget has nowhere
to put it. */
router.patch('/updateExpense/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: expenseRoutes.js, PATCH /updateExpense/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const expenseId = String(req.params.id ?? '').trim();

        /* Checked before the budget is looked up, so a malformed id is reported
        as a 400 rather than reaching Mongoose as a CastError and being reported
        as a 500 */
        if (!mongoose.Types.ObjectId.isValid(expenseId)) {
            console.warn('[WARN: expenseRoutes.js, PATCH /updateExpense/:id] Invalid expense id', expenseId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That expense id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        const input = parseExpenseInput(req.body, { partial: true });// Extract and normalise only the fields the body carries

        // Conditional rendering to check the submitted changes are usable
        if (input.message) {
            console.warn('[WARN: expenseRoutes.js, PATCH /updateExpense/:id]', input.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: input.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        // Conditional rendering to check the body carried something to change
        if (!Object.keys(input).length) {
            console.warn('[WARN: expenseRoutes.js, PATCH /updateExpense/:id] Nothing to update on expense', expenseId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'There is nothing to update' });// Respond with a 400 (Bad Request) status code
        }

        /* Matched on the expense and the owner together, so a budget belonging
        to another account is not found at all. Read whole rather than through a
        projection, because it is saved again below and Mongoose does not
        validate the paths a projection left out */
        const budget = await Budget.findOne({ userId, 'expenses._id': expenseId }).exec();

        // Conditional rendering to check an expense with that id exists on this account
        if (!budget) {
            console.warn('[WARN: expenseRoutes.js, PATCH /updateExpense/:id] No expense found for id', expenseId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That expense could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        // The subdocument itself, read off the parent the query matched it in
        const expense = budget.expenses.id(expenseId);

        /* The query already matched the budget on this expense, so it is only
        missing if it was removed between the two, which is still nothing to
        update */
        if (!expense) {
            console.warn('[WARN: expenseRoutes.js, PATCH /updateExpense/:id] Expense', expenseId, 'not present on budget', budget._id);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That expense could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        /* Only the fields that actually differ from what is stored, because the
        body can carry a field and still hold no change in it: a form left on the
        value it was opened with sends that value straight back */
        const changes = {};

        if (input.title !== undefined && input.title !== expense.title) changes.title = input.title;
        if (input.amount !== undefined && input.amount !== expense.amount) changes.amount = input.amount;
        if (input.currency !== undefined && input.currency !== expense.currency) changes.currency = input.currency;
        if (input.category !== undefined && input.category !== expense.category) changes.category = input.category;
        if (input.notes !== undefined && input.notes !== (expense.notes || '')) changes.notes = input.notes;
        if (input.paymentMethod !== undefined && input.paymentMethod !== expense.paymentMethod) changes.paymentMethod = input.paymentMethod;
        if (input.isPaid !== undefined && input.isPaid !== expense.isPaid) changes.isPaid = input.isPaid;
        /* Compared as timestamps rather than as Dates, which are only ever equal
        to themselves, so resubmitting the date the expense already carries is
        not read as a change */
        if (input.date !== undefined && input.date.getTime() !== new Date(expense.date).getTime()) {
            changes.date = input.date;
        }

        /* Only a trip that is not the one the expense is already filed against
        is a move: a form left on 'keep this trip' sends the stored id back, and
        rewriting the expense onto the budget it is already embedded in is not a
        change */
        const movingTrip = input.tripId !== undefined
            && String(input.tripId) !== String(budget.tripId);
        let newBudget = null;

        if (movingTrip) {
            /* Matched on the trip and the owner together, so an expense cannot
            be moved onto another account's budget: that budget is not found at
            all rather than found and then refused. A trip with no budget is
            reported as such rather than silently getting one, exactly as it is
            on a create */
            newBudget = await Budget.findOne({ tripId: input.tripId, userId }).exec();

            // Conditional rendering to check the selected trip has a budget to move the expense to
            if (!newBudget) {
                console.warn('[WARN: expenseRoutes.js, PATCH /updateExpense/:id] No budget found for trip', input.tripId, 'and user', userId);// Log a warning message in the console for debugging purposes
                return res.status(404).json({ success: false, message: 'The selected trip has no budget yet. Set a budget for it before moving this expense to it.' });// Respond with a 404 (Not Found) status code
            }
        }

        /* Reported rather than written, because a body full of the values the
        expense already holds arrives here with nothing left to set */
        if (!movingTrip && !Object.keys(changes).length) {
            console.warn('[WARN: expenseRoutes.js, PATCH /updateExpense/:id] Nothing changed on expense', expenseId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'There is nothing to update' });// Respond with a 400 (Bad Request) status code
        }

        // The budget the expense ends up on, whose baseCurrency it is totalled in
        const targetBudget = newBudget ?? budget;

        /* Reworked out from a live rate rather than taken from the body, the
        same as it is on a create. Only when the figure it was derived from has
        moved: the amount, the currency it was paid in, or — on a move — the
        currency it is being converted into */
        const reconvert = changes.amount !== undefined
            || changes.currency !== undefined
            || targetBudget.baseCurrency !== budget.baseCurrency;

        const convertedAmount = reconvert
            ? await resolveConvertedAmount(
                changes.amount ?? expense.amount,
                changes.currency ?? expense.currency,
                targetBudget.baseCurrency
            )
            : expense.convertedAmount;

        if (movingTrip) {
            /* Moved by hand, because an expense is embedded in its budget rather
            than pointing at one: it is pushed onto the new parent with its own
            _id kept, so anything open on that id — a details panel, this very
            form — is still open on the same expense afterwards. The username is
            carried over with it, the owner of both budgets is the same account.

            The destination is saved before the expense is taken off the budget
            it came from, so a failure between the two leaves the expense listed
            twice rather than not at all: a duplicate is visible and can be
            removed, a lost expense is neither */
            newBudget.expenses.push({
                ...expense.toObject(),
                ...changes,
                convertedAmount,
            })

            await newBudget.save();

            budget.expenses.pull(expenseId)
            await budget.save();

            console.log('[INFO: expenseRoutes.js, PATCH /updateExpense/:id] Expense', expenseId, 'moved from budget', String(budget._id), 'to', String(newBudget._id));// Log an info message in the console for debugging purposes
        } else {
            /* Set on the subdocument and saved through the parent, which is what
            runs the subdocument's own validation and keeps the budget's totals
            virtuals in agreement with what it holds */
            expense.set({ ...changes, convertedAmount })
            await budget.save();
        }

        // The expense as it was stored, read back off the budget it now sits on
        const updatedExpense = targetBudget.expenses.id(expenseId);
        /* The trip's title is stored on the trip, so it is read off that
        document for the response the same way the two GET routes read it */
        await targetBudget.populate('tripId', 'title');

        console.log('[SUCCESS: expenseRoutes.js, PATCH /updateExpense/:id] Expense updated:', expenseId, 'on budget', String(targetBudget._id));// Log a success message in the console for debugging purposes
        return res.status(200).json({
            success: true,
            message: 'Expense updated successfully.',
            /* Returned whole and in the shape the list reads an expense in, so
            the page can show the edited expense without refetching to see it */
            expense: shapeExpense(targetBudget, updatedExpense),
            /* The budget's own figures move with every expense, so they are
            returned with it and the page does not have to refetch to report what
            is left */
            budget: {
                _id: targetBudget._id,
                tripId: targetBudget.tripId?._id ?? targetBudget.tripId,
                baseCurrency: targetBudget.baseCurrency,
                totalBudget: targetBudget.totalBudget,
                totalSpent: targetBudget.totalSpent,
                remaining: targetBudget.remaining,
                percentUsed: targetBudget.percentUsed,
            },
        });// Respond with a 200 (OK) status code and the updated expense
    } catch (error) {
        /* Raised by a rule only the schema can judge, reported against its own
        field so the form can show each message under the input that caused it */
        if (error.name === 'ValidationError') {
            const errors = validationErrors(error);
            console.error('[ERROR: expenseRoutes.js, PATCH /updateExpense/:id] Validation failed:', errors);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'Expense could not be updated, please check the highlighted fields', errors });// Respond with a 400 (Bad Request) status code
        }

        console.error('[ERROR: expenseRoutes.js, PATCH /updateExpense/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})
/*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE AN EXPENSE
=======================================*/
/* expense/delete/:id - Removes one of the logged in user's expenses.

The id is the one Mongo gave the embedded subdocument, so the parent budget is
found by the expense it holds, matched on the owner at the same time: another
account's expense is not found at all rather than found and then deleted — which
is also why a missing one is reported as a 404 either way, and never says whether
it exists on someone else's account.

An expense is embedded in the budget of its trip rather than stored on its own,
so it is pulled off that parent and the parent is saved. Nothing else is filed
against an expense, so unlike a budget there is nothing to clear up after it: the
only figures that know about it are the budget's own totals, which are virtuals
worked out from the expenses it holds and so are correct the moment it is gone.

The reverse of this is DELETE /budget/deleteBudget/:id, which takes every expense
embedded in a budget with it. This route removes one expense and leaves the
budget it was spent against standing. */
router.delete('/delete/:id', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: expenseRoutes.js, DELETE /delete/:id] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const expenseId = String(req.params.id ?? '').trim();

        /* Checked before the budget is looked up, so a malformed id is reported
        as a 400 rather than reaching Mongoose as a CastError and being reported
        as a 500 */
        if (!mongoose.Types.ObjectId.isValid(expenseId)) {
            console.warn('[WARN: expenseRoutes.js, DELETE /delete/:id] Invalid expense id', expenseId);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That expense id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        /* Matched on the expense and the owner together, so a budget belonging
        to another account is not found at all. Read whole rather than through a
        projection, because it is saved again below and Mongoose does not
        validate the paths a projection left out */
        const budget = await Budget.findOne({ userId, 'expenses._id': expenseId }).exec();

        /* Conditional rendering to check an expense with that id exists on this
        account. Covers both an expense that does not exist and one on another
        account */
        if (!budget) {
            console.warn('[WARN: expenseRoutes.js, DELETE /delete/:id] No expense found for id', expenseId, 'and user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That expense could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        // The subdocument itself, read off the parent the query matched it in
        const expense = budget.expenses.id(expenseId);

        /* The query already matched the budget on this expense, so it is only
        missing if it was removed between the two, which is still nothing left to
        delete */
        if (!expense) {
            console.warn('[WARN: expenseRoutes.js, DELETE /delete/:id] Expense', expenseId, 'not present on budget', budget._id);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That expense could not be found on your account' });// Respond with a 404 (Not Found) status code
        }

        /* Read before the expense is pulled, so the response can name what went:
        after the write there is no subdocument left to read it off */
        const expenseTitle = expense.title;

        budget.expenses.pull(expenseId)
        /* Saving the parent is what removes the subdocument, and what leaves the
        budget's totals virtuals reporting only the expenses it still holds */
        await budget.save();

        console.log('[SUCCESS: expenseRoutes.js, DELETE /delete/:id] Deleted expense', expenseId, 'from budget', String(budget._id));// Log a success message in the console for debugging purposes
        return res.status(200).json({
            success: true,
            /* Names the expense that went, because the list it was deleted from
            shows several and the panel it was deleted through is closing */
            message: `${expenseTitle || 'Expense'} deleted successfully.`,
            /* All three returned so the client can drop the row and close any
            panel or form open on this expense without waiting on a refetch to
            learn which one went */
            expenseId,
            budgetId: budget._id,
            tripId: budget.tripId ?? null,
            /* The budget's own figures move with every expense, so they are
            returned with it and the page does not have to refetch to report what
            is left */
            budget: {
                _id: budget._id,
                baseCurrency: budget.baseCurrency,
                totalBudget: budget.totalBudget,
                totalSpent: budget.totalSpent,
                remaining: budget.remaining,
                percentUsed: budget.percentUsed,
            },
        });// Respond with a 200 (OK) status code and what was removed
    } catch (error) {
        console.error('[ERROR: expenseRoutes.js, DELETE /delete/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})

// ======EXPORT THE ROUTER==========
module.exports = router;
