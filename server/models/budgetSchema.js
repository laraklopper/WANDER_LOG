// budgetSchema.js
const mongoose = require('mongoose');

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
        maxlength: 100,
    },
    // Field for expense amount
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative'],
    },
    // Field for expense currency
    currency: {
        type: String,
        required: true,
        uppercase: true,
        default: 'ZAR',
        maxlength: 3, // ISO 4217 currency code e.g. "ZAR", "EUR", "GPD"
    },
    // Field for converted amount
    convertedAmount: {
        type: Number,   // Amount converted to trip's base currency
        default: null,
    },
    // Field for expense category
    category: {
        type: String,
        enum: [
            'accommodation',
            'transport',
            'food',
            'activities',
            'shopping',
            'health',
            'visas',
            'insurance',
            'communication',
            'other',
        ],
        required: true,
    },
    // Field for expense date
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    notes: {
        type: String,
        maxlength: 300,
        default: '',
        required: false,
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'debit_card', 'crypto', 'other'],
        default: 'cash',
    },
    isPaid: {
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
        },
        dailyBudget: {
            type: Number,
            min: 0,
            default: null, // Optional — auto-calculated if not set
        },
        expenses: {
            type: [expenseSchema],
            default: [],
        },
        // Category-level spending limits
        categoryLimits: {
            accommodation: { type: Number, default: null },
            transport: { type: Number, default: null },
            food: { type: Number, default: null },
            activities: { type: Number, default: null },
            shopping: { type: Number, default: null },
            health: { type: Number, default: null },
            visas: { type: Number, default: null },
            insurance: { type: Number, default: null },
            communication: { type: Number, default: null },
            other: { type: Number, default: null },
        },
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