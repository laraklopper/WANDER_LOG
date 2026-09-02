// currConverterSchema.js
const mongoose = require('mongoose');
const { apiCurrencies } = require('../serverData/currencies');

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

const converterSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'user is required'],
        index: true,
    },
     // ==============NESTED CURRENCY OBJECT=================
    currency: {
        // Field for base currency
        baseCurrency: {
            type: String,
            required: [true, 'base currency is required'],
            trim: true,
            uppercase: true,
            enum: apiCurrencies,
            match: [CURRENCY_CODE_PATTERN, 'Base currency must be a 3-letter currency code'],
        },
        // Field for target currency
        targetCurrency:{
            type: String,
            required: [true, 'target currency is required'],
            trim: true,
            uppercase: true,
            enum: apiCurrencies,
            match: [CURRENCY_CODE_PATTERN, 'Target currency must be a 3-letter currency code'],
        },
    },
    amount: {
        type: Number,
        required: [true, 'amount is required'],
        min: [0, 'Amount cannot be negative'],
    },
    // Exchange rate used for the conversion (target per base)
    rate:{
        type: Number,
        required: [true, 'rate is required'],
        min: [0, 'Rate cannot be negative'],
    }
}, {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Virtual field returning the converted amount (amount * rate)
currencyConvertSchema.virtual('convertedAmount').get(function () {
    return this.amount * this.rate;
});

module.exports = mongoose.model('currency', converterSchema)