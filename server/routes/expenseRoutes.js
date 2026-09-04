// expenseRoutes.js
/*expense endpoints, mounted at /expense by app.js
- GET /fetchBudgets - list the logged in user's budgets, for the form's trip select
- GET fetchExpenses - fetch all expenses
- GET /fetchExpense/:id - fetch a single expense by Id
- POST /addExpense - add an expens
- PATCH /updateExpense/:id - Edit an expense
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

Returns `{ message }` describing the first problem found, or the normalised
expense fields when the input is usable. */
const parseExpenseInput = ({
    tripId,
    title,
    amount,
    currency,
    category,
    date,
    notes,
    paymentMethod,
    isPaid,
} = {}) => {
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

    const expenseTitle = String(title ?? '').trim();
    // Conditional rendering to check the title was supplied, and is short enough to store
    if (!expenseTitle) {
        return { message: 'Expense title is required' };
    }
    if (expenseTitle.length > TITLE_MAX) {
        return { message: `Expense title cannot exceed ${TITLE_MAX} characters` };
    }

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

    const expenseCategory = matchEnum(category, EXPENSE_CATEGORIES);
    // Conditional rendering to check the category is one the schema's enum allows
    if (!expenseCategory) {
        return { message: `Expense category must be one of: ${EXPENSE_CATEGORIES.join(', ')}` };
    }

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

    /* Optional, and stored as an empty string rather than left unset when it is
    not filled in, matching the schema's own default */
    const expenseNotes = String(notes ?? '').trim();
    if (expenseNotes.length > NOTES_MAX) {
        return { message: `Notes cannot exceed ${NOTES_MAX} characters` };
    }

    /* Defaulted rather than rejected, matching the schema's own default, so a
    submission that leaves the payment method unset still records a cash expense */
    const expensePaymentMethod = paymentMethod === undefined || paymentMethod === null || paymentMethod === ''
        ? 'cash'
        : matchEnum(paymentMethod, PAYMENT_METHODS);

    // Conditional rendering to check a supplied payment method is one the schema's enum allows
    if (!expensePaymentMethod) {
        return { message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` };
    }

    return {
        tripId: expenseTripId,
        title: expenseTitle,
        amount: expenseAmount,
        currency: expenseCurrency,
        category: expenseCategory,
        date: expenseDate,
        notes: expenseNotes,
        paymentMethod: expensePaymentMethod,
        /* An unticked checkbox is not sent by fetch as false unless the form
        puts it there, so anything but an explicit false is read as paid, which
        is the schema's default */
        isPaid: isPaid === false || isPaid === 'false' ? false : true,
    };
}

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
// expense/fetchExpenses - fetch all expenses
// expense/fetchExpense/:id - fetch a single expense by id
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
        /* Mongoose collects every failed field rule into one ValidationError.
        parseExpenseInput checks the same rules first, so this is reached by a
        value only the schema can judge. Returned as a 400 with a field keyed
        object so the form can show each message against the input that caused
        it. An embedded expense is keyed by its position, for example
        'expenses.3.amount', so the index is stripped back to the field name the
        form knows the input by */
        if (error.name === 'ValidationError') {
            const errors = Object.fromEntries(
                Object.entries(error.errors).map(([field, err]) => [
                    field.replace(/^expenses\.\d+\./, ''),
                    err.message,
                ])
            );
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
// expense/updateExpense/:id - edit an expense
/*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
// expense/delete/:id - delete an expense

// ======EXPORT THE ROUTER==========
module.exports = router;
