//exportRoutes

/*export endpoints: mounted at /exports by app.js
GET
exports/trips - export trips to csv or xlsx file
exports/entries - export journal entries to csv or xlsx file
exports/expenses - export expenses to csv or xlsx file
exports/budgets - export list of budgets

Every route answers with a file rather than with JSON, and every one of them:

- is filtered on the userId taken from the JWT, so an export can only ever hold
  the caller's own records. Nothing is read from the query beyond the format
- takes the format as ?format=csv or ?format=xlsx, the two the export form
  offers. A request naming anything else is refused rather than guessed at
- returns the whole of that record type on the account. The list filters are not
  applied: an export is a copy of the data, not a copy of the screen, and the
  filter forms do not yet submit anything for a route to filter on
- names the file after the account and the date it was taken, so two exports a
  month apart do not overwrite each other in the downloads folder

The file itself is built by util/exportFile.js, which is handed the columns and
rows of native values each route below shapes. */
const express = require('express');
const rateLimit = require('express-rate-limit');
const Trip = require('../models/tripSchema');
const Entry = require('../models/entrySchema');
/* An expense is a subdocument of its trip's budget rather than a model of its
own, so both the expense export and the budget export read this one collection */
const Budget = require('../models/budgetSchema');
const User = require('../models/userSchema');
const { checkJwtToken } = require('./middleware');
const {
    CONTENT_TYPES,
    matchFormat,
    exportFilename,
    contentDisposition,
    plainText,
    enumLabel,
    buildCsv,
    buildXlsx,
} = require('../util/exportFile');
const router = express.Router()

/* An export reads every record of one type on the account and builds a file out
of them, which costs more than the reads the pages themselves make. The limit is
loose enough that nobody choosing both formats for all four lists would meet it,
and stops one client asking for full exports in a loop. Returns 429 (RFC 6585)
once the quota is used up */
const exportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,// 15 minute window
    max: 60,// 60 exports per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many exports, please try again in 15 minutes' },
});

/* Shown in place of the trip title on a record whose trip has since been
deleted. Matches what expenseRoutes.js reports in the same case, so a row reads
the same in the file as it does on the page */
const TRIP_UNAVAILABLE = 'TRIP NO LONGER AVAILABLE';

/*=====================================
COLUMNS
=======================================*/
/* What each export holds, in the order the columns are written. The header is
the label the file shows, the key is the field the row below supplies, and the
type is how util/exportFile.js reads the value: a 'date' cell is written as a
real date and a 'money' cell as a real number, so both can be sorted and
totalled in a spreadsheet rather than read back as text.

The columns follow the lists each form sits under, with the fields the table has
no room for added: a trip's dates and a budget's totals are on the page in the
details panel rather than in the row, and belong in an export either way. */
const TRIP_COLUMNS = [
    { header: 'TITLE', key: 'title', type: 'text', width: 30 },
    { header: 'PURPOSE', key: 'purpose', type: 'text', width: 12 },
    { header: 'DESTINATION TYPE', key: 'destinationType', type: 'text', width: 18 },
    { header: 'LOCATION', key: 'tripLocation', type: 'text', width: 24 },
    { header: 'COUNTRY', key: 'country', type: 'text', width: 20 },
    { header: 'START DATE', key: 'startDate', type: 'date', width: 14 },
    { header: 'END DATE', key: 'endDate', type: 'date', width: 14 },
    { header: 'STATUS', key: 'status', type: 'text', width: 12 },
    { header: 'JOURNAL ENTRIES', key: 'entryCount', type: 'number', width: 16 },
    { header: 'HAS BUDGET', key: 'hasBudget', type: 'boolean', width: 12 },
    { header: 'LOGGED ON', key: 'createdAt', type: 'datetime', width: 18 },
];

const ENTRY_COLUMNS = [
    { header: 'TITLE', key: 'title', type: 'text', width: 30 },
    { header: 'TRIP', key: 'trip', type: 'text', width: 30 },
    { header: 'DATE', key: 'date', type: 'date', width: 14 },
    /* The body of the entry, widest column in the sheet because it is the one
    thing in the file nothing else stands in for */
    { header: 'ENTRY', key: 'body', type: 'text', width: 80 },
    { header: 'WRITTEN ON', key: 'createdAt', type: 'datetime', width: 18 },
    { header: 'LAST EDITED', key: 'updatedAt', type: 'datetime', width: 18 },
];

const EXPENSE_COLUMNS = [
    { header: 'TITLE', key: 'title', type: 'text', width: 30 },
    { header: 'TRIP', key: 'trip', type: 'text', width: 30 },
    { header: 'DATE', key: 'date', type: 'date', width: 14 },
    { header: 'CATEGORY', key: 'category', type: 'text', width: 16 },
    { header: 'AMOUNT', key: 'amount', type: 'money', width: 14 },
    { header: 'CURRENCY', key: 'currency', type: 'text', width: 10 },
    /* The figure the budget counts the expense by, so this column totals to the
    trip's spend whatever each expense was paid in */
    { header: 'AMOUNT IN BASE CURRENCY', key: 'baseAmount', type: 'money', width: 24 },
    { header: 'BASE CURRENCY', key: 'baseCurrency', type: 'text', width: 14 },
    { header: 'PAYMENT METHOD', key: 'paymentMethod', type: 'text', width: 18 },
    { header: 'PAID', key: 'isPaid', type: 'boolean', width: 8 },
    { header: 'NOTES', key: 'notes', type: 'text', width: 40 },
];

const BUDGET_COLUMNS = [
    { header: 'TRIP', key: 'trip', type: 'text', width: 30 },
    { header: 'TRIP STATUS', key: 'tripStatus', type: 'text', width: 14 },
    { header: 'BASE CURRENCY', key: 'baseCurrency', type: 'text', width: 14 },
    { header: 'TOTAL BUDGET', key: 'totalBudget', type: 'money', width: 16 },
    { header: 'DAILY BUDGET', key: 'dailyBudget', type: 'money', width: 16 },
    { header: 'EXPENSES', key: 'expenseCount', type: 'number', width: 12 },
    { header: 'TOTAL SPENT', key: 'totalSpent', type: 'money', width: 16 },
    { header: 'REMAINING', key: 'remaining', type: 'money', width: 16 },
    { header: 'PERCENT USED', key: 'percentUsed', type: 'decimal', width: 14 },
    { header: 'SET ON', key: 'createdAt', type: 'datetime', width: 18 },
];

/*=====================================
THE ACCOUNT BEHIND THE TOKEN
=======================================*/
/* The username the file is named after. Read off the account rather than the
token, which signToken deliberately fills with the id and the role alone, and
doubles as a check that the user on the token still exists: a deleted account
leaves a token that still verifies, and there is no data left to export under it.

Returns `{ status, message }` describing the problem, or `{ username }` when the
caller is a user records can be read for. */
const readExportUser = async (userId) => {
    // Conditional rendering to check the token carried an id
    if (!userId) {
        return { status: 401, message: 'Unauthorized' };
    }

    const user = await User.findById(userId).select('username').exec();

    // Conditional rendering to check the user on the token still exists
    if (!user) {
        return { status: 401, message: 'Invalid token. Please login again.' };
    }

    return { username: user.username };
};

/*=====================================
THE REQUESTED FORMAT
=======================================*/
/* The format the file is built in, matched against the two the export form
offers. Returns `{ message }` naming the problem, or `{ format }`.

A request with no format at all is refused rather than defaulted to CSV: the
select opens on its SELECT placeholder, so an empty one means the user submitted
without choosing and should be told so, not handed a file in a format they did
not pick. */
const readExportFormat = (query) => {
    const format = matchFormat(query?.format);

    if (!format) {
        return { message: 'Choose an export format of CSV (.csv) or Excel (.xlsx)' };
    }

    return { format };
};

/*=====================================
SENDING THE FILE
=======================================*/
/* Builds the file and answers with it as a download.

The two formats are built by different functions but sent the same way, so the
headers are written once here: the media type of the format, the filename the
browser saves it as, and a no-store, because the response is one account's
records and must not be kept by a cache between here and the browser.

Content-Length is set from the buffer rather than left to Express, so the browser
can show the progress of a large export instead of an unbounded download. */
const sendExport = async ({ res, route, resource, sheetName, columns, rows, username, format }) => {
    const file = format === 'xlsx'
        ? await buildXlsx(columns, rows, sheetName)
        : buildCsv(columns, rows);

    const filename = exportFilename(resource, username, format);

    res.setHeader('Content-Type', CONTENT_TYPES[format]);
    res.setHeader('Content-Disposition', contentDisposition(filename));
    res.setHeader('Content-Length', file.length);
    res.setHeader('Cache-Control', 'no-store');

    console.log(`[SUCCESS: exportRoutes.js, GET ${route}] Sent ${filename} with ${rows.length} row(s)`);// Log a success message in the console for debugging purposes
    return res.status(200).send(file);// Respond with a 200 (OK) status code and the file
};

// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
EXPORT THE LOGGED IN USER'S TRIPS
=======================================*/
/* exports/trips - Every trip on the account as a CSV or an Excel file, newest
departure first, which is the order TripsList.js shows them in.

hasBudget is answered from the caller's own budgets rather than read off the trip,
the same way GET /trip/fetchTrips answers it: a budget is filed against the trip
it was set for rather than flagged on it, so the flag stored on the trip can be
out of step with whether one exists. */
router.get('/trips', checkJwtToken, exportLimiter, async (req, res) => {
    try {
        const requested = readExportFormat(req.query);

        // Conditional rendering to check a format the export offers was asked for
        if (requested.message) {
            console.warn('[WARN: exportRoutes.js, GET /trips]', requested.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: requested.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        const caller = await readExportUser(req.user?.userId);

        // Conditional rendering to check the caller is a user records can be read for
        if (caller.message) {
            console.warn('[WARN: exportRoutes.js, GET /trips]', caller.message);// Log a warning message in the console for debugging purposes
            return res.status(caller.status).json({ success: false, message: caller.message });// Respond with the status readExportUser chose
        }

        /* Both filtered on the owner, and requested together because neither
        needs the other's answer: the budgets are only read for their tripId */
        const [trips, budgets] = await Promise.all([
            Trip.find({ userId: req.user.userId }).sort({ 'date.startDate': -1 }).exec(),
            Budget.find({ userId: req.user.userId }).select('tripId').exec(),
        ]);

        /* Held as strings, because the ids are ObjectIds and two of those are
        never equal to each other by identity even when they are the same id */
        const budgetedTripIds = new Set(
            budgets.filter((budget) => budget.tripId).map((budget) => String(budget.tripId))
        );

        const rows = trips.map((trip) => ({
            title: trip.title,
            purpose: trip.purpose,
            destinationType: trip.destination?.destinationType,
            tripLocation: trip.destination?.tripLocation,
            /* Only stored on an international trip, so a domestic one leaves the
            cell empty rather than reporting a country it is not in */
            country: trip.destination?.country,
            startDate: trip.date?.startDate,
            endDate: trip.date?.endDate,
            status: trip.status,
            /* Read as a number rather than through || , which would write a trip
            with no entries yet as an empty cell instead of as a nought */
            entryCount: Number.isFinite(trip.entryCount) ? trip.entryCount : 0,
            hasBudget: budgetedTripIds.has(String(trip._id)),
            createdAt: trip.createdAt,
        }));

        // Conditional rendering to check there is something to export
        if (!rows.length) {
            console.warn('[WARN: exportRoutes.js, GET /trips] No trips to export for user', req.user.userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'There are no trips on your account to export' });// Respond with a 404 (Not Found) status code
        }

        return await sendExport({
            res,
            route: '/trips',
            resource: 'trips',
            sheetName: 'Trips',
            columns: TRIP_COLUMNS,
            rows,
            username: caller.username,
            format: requested.format,
        });
    } catch (error) {
        console.error('[ERROR: exportRoutes.js, GET /trips]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})

/*=====================================
EXPORT THE LOGGED IN USER'S JOURNAL ENTRIES
=======================================*/
/* exports/entries - Every journal entry on the account as a CSV or an Excel
file, newest first, which is the order EntriesList.js shows them in.

The body is stored as the rich text HTML the editor produced, so it is reduced to
plain text before it is written: exported raw, the cell would hold markup instead
of what the user wrote. The trip is read off the entry, which stores its title as
well as its id, so an entry whose trip has since been deleted still says which
trip it was written about. */
router.get('/entries', checkJwtToken, exportLimiter, async (req, res) => {
    try {
        const requested = readExportFormat(req.query);

        // Conditional rendering to check a format the export offers was asked for
        if (requested.message) {
            console.warn('[WARN: exportRoutes.js, GET /entries]', requested.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: requested.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        const caller = await readExportUser(req.user?.userId);

        // Conditional rendering to check the caller is a user records can be read for
        if (caller.message) {
            console.warn('[WARN: exportRoutes.js, GET /entries]', caller.message);// Log a warning message in the console for debugging purposes
            return res.status(caller.status).json({ success: false, message: caller.message });// Respond with the status readExportUser chose
        }

        const entries = await Entry.find({ userId: req.user.userId }).sort({ date: -1 }).exec();

        const rows = entries.map((entry) => ({
            title: entry.title,
            trip: entry.trip || TRIP_UNAVAILABLE,
            date: entry.date,
            // Reduced from the editor's HTML to the text that was written
            body: plainText(entry.body),
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
        }));

        // Conditional rendering to check there is something to export
        if (!rows.length) {
            console.warn('[WARN: exportRoutes.js, GET /entries] No entries to export for user', req.user.userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'There are no journal entries on your account to export' });// Respond with a 404 (Not Found) status code
        }

        return await sendExport({
            res,
            route: '/entries',
            resource: 'entries',
            sheetName: 'Journal Entries',
            columns: ENTRY_COLUMNS,
            rows,
            username: caller.username,
            format: requested.format,
        });
    } catch (error) {
        console.error('[ERROR: exportRoutes.js, GET /entries]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})

/*=====================================
EXPORT THE LOGGED IN USER'S EXPENSES
=======================================*/
/* exports/expenses - Every expense on the account as a CSV or an Excel file,
newest spend first, which is the order ExpensesList.js shows them in.

An expense is embedded in the budget of its trip rather than stored on its own,
so there is no expense collection to query: the caller's budgets are read and the
expenses they hold are flattened into one list, the same way GET
/expense/fetchExpenses builds the page's own list. Sorted after they are gathered
rather than by the database, because they arrive grouped by the budget they came
out of.

Each expense is written with both figures: the amount as it was paid, and the
amount in the currency its budget is totalled in, so the second column adds up to
the trip's spend whatever the first was paid in. */
router.get('/expenses', checkJwtToken, exportLimiter, async (req, res) => {
    try {
        const requested = readExportFormat(req.query);

        // Conditional rendering to check a format the export offers was asked for
        if (requested.message) {
            console.warn('[WARN: exportRoutes.js, GET /expenses]', requested.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: requested.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        const caller = await readExportUser(req.user?.userId);

        // Conditional rendering to check the caller is a user records can be read for
        if (caller.message) {
            console.warn('[WARN: exportRoutes.js, GET /expenses]', caller.message);// Log a warning message in the console for debugging purposes
            return res.status(caller.status).json({ success: false, message: caller.message });// Respond with the status readExportUser chose
        }

        /* Only the fields an expense is reported with are read, not the budget's
        own figures, which the budget export covers instead */
        const budgets = await Budget.find({ userId: req.user.userId })
            .select('tripId baseCurrency expenses')
            // The trip's title is stored on the trip, so it is read off that document
            .populate('tripId', 'title')
            .exec();

        const rows = budgets
            .flatMap((budget) => budget.expenses.map((expense) => ({
                title: expense.title,
                trip: budget.tripId?.title || TRIP_UNAVAILABLE,
                date: expense.date,
                // Written the way the list shows it: 'food' is stored, 'FOOD' is displayed
                category: enumLabel(expense.category),
                amount: expense.amount,
                currency: expense.currency,
                /* convertedAmount is stored as null in the two cases
                budgetSchema documents — the expense was already in the base
                currency, or no rate could be read — so the amount itself stands
                in for it. The same figure the budget's totalSpent virtual
                counts, which is what makes this column total to the trip's spend */
                baseAmount: expense.convertedAmount ?? expense.amount,
                baseCurrency: budget.baseCurrency,
                paymentMethod: enumLabel(expense.paymentMethod),
                isPaid: expense.isPaid,
                notes: expense.notes,
            })))
            // Newest spend first, so the most recent expense is nearest the top
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Conditional rendering to check there is something to export
        if (!rows.length) {
            console.warn('[WARN: exportRoutes.js, GET /expenses] No expenses to export for user', req.user.userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'There are no expenses on your account to export' });// Respond with a 404 (Not Found) status code
        }

        return await sendExport({
            res,
            route: '/expenses',
            resource: 'expenses',
            sheetName: 'Expenses',
            columns: EXPENSE_COLUMNS,
            rows,
            username: caller.username,
            format: requested.format,
        });
    } catch (error) {
        console.error('[ERROR: exportRoutes.js, GET /expenses]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})

/*=====================================
EXPORT THE LOGGED IN USER'S TRIP BUDGETS
=======================================*/
/* exports/budgets - Every trip budget on the account as a CSV or an Excel file,
newest first, which is the order BudgetList.js shows them in.

The whole document is loaded rather than a selection of its fields, because the
spend figures are virtuals computed off the embedded expenses: selecting away
`expenses` would leave every total reading as nought.

The trip's title and status are read off the trip, the same way the budget list
reads them: a budget row carries neither, and a budget whose trip has since been
deleted has no status to report. */
router.get('/budgets', checkJwtToken, exportLimiter, async (req, res) => {
    try {
        const requested = readExportFormat(req.query);

        // Conditional rendering to check a format the export offers was asked for
        if (requested.message) {
            console.warn('[WARN: exportRoutes.js, GET /budgets]', requested.message);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: requested.message });// Respond with a 400 (Bad Request) status code and the reason
        }

        const caller = await readExportUser(req.user?.userId);

        // Conditional rendering to check the caller is a user records can be read for
        if (caller.message) {
            console.warn('[WARN: exportRoutes.js, GET /budgets]', caller.message);// Log a warning message in the console for debugging purposes
            return res.status(caller.status).json({ success: false, message: caller.message });// Respond with the status readExportUser chose
        }

        const budgets = await Budget.find({ userId: req.user.userId })
            // Both are stored on the trip rather than on the budget
            .populate('tripId', 'title status')
            .sort({ createdAt: -1 })
            .exec();

        const rows = budgets.map((budget) => ({
            trip: budget.tripId?.title || TRIP_UNAVAILABLE,
            tripStatus: budget.tripId?.status,
            baseCurrency: budget.baseCurrency,
            totalBudget: budget.totalBudget,
            /* Set by the user or worked out from the trip's dates by the pre
            save hook on budgetSchema, and left null when neither could supply it */
            dailyBudget: budget.dailyBudget,
            expenseCount: budget.expenses?.length ?? 0,
            totalSpent: budget.totalSpent,
            remaining: budget.remaining,
            /* Worked out here rather than read off the percentUsed virtual,
            which divides by the total and would write Infinity into the cell for
            a budget set at nought */
            percentUsed: budget.totalBudget > 0
                ? (budget.totalSpent / budget.totalBudget) * 100
                : null,
            createdAt: budget.createdAt,
        }));

        // Conditional rendering to check there is something to export
        if (!rows.length) {
            console.warn('[WARN: exportRoutes.js, GET /budgets] No budgets to export for user', req.user.userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'There are no trip budgets on your account to export' });// Respond with a 404 (Not Found) status code
        }

        return await sendExport({
            res,
            route: '/budgets',
            resource: 'budgets',
            sheetName: 'Trip Budgets',
            columns: BUDGET_COLUMNS,
            rows,
            username: caller.username,
            format: requested.format,
        });
    } catch (error) {
        console.error('[ERROR: exportRoutes.js, GET /budgets]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Respond with a 500 (Internal Server Error) status code
    }
})

module.exports = router
