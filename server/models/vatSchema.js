const mongoose = require('mongoose');

const { VAT_MODES } = require('../util/vatCalculations')


const vatSchema = new mongoose.Schema({
    /* The user the saved calculation belongs to. Stored as a reference rather
    than relying on fullName, so a history lookup cannot return another user's
    calculations when two users share a name. */
     user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'user is required'],
        index: true,
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
    },
     //==============HOW THE CALCULATION WAS ASKED FOR=================
    /* Which direction the calculation ran in. 'exclusive' means the amount
    entered was the price before VAT and VAT was added on top; 'inclusive' means
    it was the price after VAT and the VAT in it was stripped back out. The three
    amounts below are the same either way - this is what says which of them the
    user typed. */
    mode: {
        type: String,
        enum: {
            values: VAT_MODES,
            message: `mode must be one of: ${VAT_MODES.join(', ')}`,
        },
        required: [true, 'mode is required'],
    },
      /* Whether the item was flagged as zero-rated (0%) rather than levied at the
    standard rate. A zero-rated supply is still a taxable supply, which is why it
    is recorded as a rate of nil rather than as no calculation at all. */
    isZeroRated: {
        type: Boolean,
        default: false,
    },
     /* The rate the VAT was worked out at, as a percentage: the SARS standard
    rate, or 0 for a zero-rated item. Stored rather than derived, so a record
    saved at 14% or 15% still reproduces itself after the rate changes. */
    ratePercent: {
        type: Number,
        required: [true, 'rate percent is required'],
        min: [0, 'Rate percent cannot be negative'],
        max: [100, 'Rate percent cannot exceed 100'],
    },
    /*===========CALCULATED RESULT=================
    Worked out by utils/vatCalculator.js and stored so the record reproduces
    exactly what the user saw. */
    // The amount excluding VAT
    netAmount: {
        type: Number,
        required: [true, 'net amount is required'],
        min: [0, 'Net amount cannot be negative'],
    },
    // The VAT portion itself, nil on a zero-rated item
    vatAmount: {
        type: Number,
        required: [true, 'VAT amount is required'],
        min: [0, 'VAT amount cannot be negative'],
    },
    // The amount including VAT
    grossAmount: {
        type: Number,
        required: [true, 'gross amount is required'],
        min: [0, 'Gross amount cannot be negative'],
    },
},{
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

/* Virtual field returning the amount the user actually typed: the net amount on
an exclusive calculation and the gross on an inclusive one. Derived rather than
stored, because `mode` already says which of the two it was and storing it again
would be a fourth amount that could disagree with the other three. */
vatCalcSchema.virtual('enteredAmount').get(function () {
    return this.mode === 'inclusive' ? this.grossAmount : this.netAmount;
});

/* Virtual field returning the VAT as a percentage of the net amount. This is
the rate the calculation actually worked out to, which reconciles against
`ratePercent` and is what makes a stored record checkable. Nil net amount
returns 0 rather than dividing by zero. */
vatCalcSchema.virtual('effectiveRate').get(function () {
    return this.netAmount > 0 ? (this.vatAmount / this.netAmount) * 100 : 0;
});

module.exports = mongoose.model('vat', vatSchema)