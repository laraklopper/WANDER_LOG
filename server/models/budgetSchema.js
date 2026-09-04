// budgetSchema.js
const mongoose = require('mongoose');
const { apiCurrencies } = require('../serverData/currencies');
/* The category and payment method enums, shared with expenseRoutes.js so a
submission is checked against the same values the schema stores */
const { EXPENSE_CATEGORIES, PAYMENT_METHODS } = require('../serverData/expenseData');

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

/* Money is stored as a Number, and every amount is entered through an input
with step='0.01', so a figure is rounded to the two decimals money is written in
rather than kept as the floating point result of a conversion. A value that is
not a number is passed through untouched, so Mongoose still reports it as a
CastError instead of storing NaN */
const toMoney = (value) => {
    if (value === null || value === undefined || value === '') return value;
    const amount = Number(value);
    return Number.isNaN(amount) ? value : Math.round(amount * 100) / 100;
};

/* The last moment of today, used by the date validator below. An expense records
money that has already been spent, so a date after this is a mistake. Compared
against the end of the day rather than the current time, so an expense entered
this afternoon for today is not read as being in the future */
const endOfToday = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
};

//Define expenseSchema
const expenseSchema = new mongoose.Schema({
    //Field for username
     username: {
        type: String,
        required : [true, 'Username is required']
    },
    // Field for expense title
    title: {
        type: String,
        required: [true, 'Expense title is required'],
        trim: true,
        maxlength: [100, 'Expense title cannot exceed 100 characters'],
    },
    // Field for expense amount
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative'],
        // Rounded to currency precision, matching the form's step='0.01'
        set: toMoney,
    },
    // Field for expense currency
    currency: {
        type: String,
        required: true,
        uppercase: true,
        default: 'ZAR',
        enum: apiCurrencies,
        match: [CURRENCY_CODE_PATTERN, 'Expense currency must be a 3-letter currency code'],
        maxlength: 3, // ISO 4217 currency code e.g. "ZAR", "EUR", "GPD"
    },
    // Field for converted amount
    convertedAmount: {
        /* Amount converted into the parent budget's baseCurrency. Not a form
        field: the add expense route applies the rate, and leaves this null when
        the expense is already in the base currency or no rate could be read */
        type: Number,
        default: null,
        min: [0, 'Converted amount cannot be negative'],
        set: toMoney,
    },
    // Field for expense category
    category: {
        type: String,
        // The same ten keys as categoryLimits below, from one shared list
        enum: {
            values: EXPENSE_CATEGORIES,
            message: `Expense category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`,
        },
        required: [true, 'Expense category is required'],
    },
    // Field for expense date
    date: {
        type: Date,
        required: [true, 'Expense date is required'],
        default: Date.now,
        /* The form blocks a future date with a max attribute and checks it
        again before submitting. Repeated here so a date sent straight to the
        API cannot record money as spent before it has been */
        validate: {
            validator: (value) => value <= endOfToday(),
            message: 'An expense date cannot be in the future',
        },
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [300, 'Notes cannot exceed 300 characters'],
        default: '',
        required: false,
    },
    paymentMethod: {
        type: String,
        enum: {
            values: PAYMENT_METHODS,
            message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`,
        },
        default: 'cash',
    },
    isPaid: {
        /* false records a committed but unsettled cost, such as an unpaid
        deposit, so it is still counted against the budget */
        type: Boolean,
        default: true,
    },
});

//Def
const budgetSchema = new mongoose.Schema(
    {
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip',
            required: true,
            unique: true, // One budget document per trip
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        baseCurrency: {
            type: String,
            required: [true, 'base currency code is reqiured'],
            uppercase: true,
            default: 'ZAR',
            maxlength: 3,
        },
        totalBudget: {
            type: Number,
            required: [true, 'Total budget is required'],
            min: [0, 'Budget cannot be negative'],
            set: toMoney,
        },
        dailyBudget: {
            type: Number,
            min: 0,
            default: null, // Optional — auto-calculated if not set
            set: toMoney,
        },
        expenses: {
            type: [expenseSchema],
            default: [],
        },
        /* Category-level spending limits, one per expense category. Built from
        the same list the expense category enum is built from, so a limit
        always exists for every category an expense can be filed under. null
        means the category has no cap */
        categoryLimits: EXPENSE_CATEGORIES.reduce((limits, category) => {
            limits[category] = {
                type: Number,
                default: null,
                min: [0, 'A category limit cannot be negative'],
                set: toMoney,
            };
            return limits;
        }, {}),
        alerts: {
            notifyAt80Percent: { type: Boolean, default: true },
            notifyOnExceed: { type: Boolean, default: true },
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ── Virtuals ────────────────────────────────────────────────────────────────

// Total amount spent across all expenses
budgetSchema.virtual('totalSpent').get(function () {
    return this.expenses.reduce((sum, e) => sum + (e.convertedAmount ?? e.amount), 0);
});

// Remaining budget
budgetSchema.virtual('remaining').get(function () {
    return this.totalBudget - this.totalSpent;
});

// Percentage of budget used
budgetSchema.virtual('percentUsed').get(function () {
    return ((this.totalSpent / this.totalBudget) * 100).toFixed(2);
});

// Spending broken down by category
budgetSchema.virtual('spendingByCategory').get(function () {
    return this.expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + (e.convertedAmount ?? e.amount);
        return acc;
    }, {});
});

// ── Indexes ─────────────────────────────────────────────────────────────────

budgetSchema.index({ tripId: 1 });
budgetSchema.index({ userId: 1, createdAt: -1 });

// ── Middleware ───────────────────────────────────────────────────────────────

// Auto-calculate dailyBudget from trip dates if not manually set
budgetSchema.pre('save', async function () {
    if (!this.dailyBudget && this.tripId) {
        const trip = await mongoose.model('Trip').findById(this.tripId);
        if (trip?.date?.startDate && trip?.date?.endDate) {
            const days = Math.max(
                1,
                Math.ceil((trip.date.endDate - trip.date.startDate) / (1000 * 60 * 60 * 24))
            );
            this.dailyBudget = parseFloat((this.totalBudget / days).toFixed(2));
        }
    }
});

module.exports = mongoose.model('Budget', budgetSchema);