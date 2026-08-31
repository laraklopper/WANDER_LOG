// currConverterSchema.js
const mongoose = require('mongoose');

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
            match: [CURRENCY_CODE_PATTERN, 'Base currency must be a 3-letter currency code'],
        },
        // Field for target currency
        targetCurrency:{
            type: String,
            required: [true, 'target currency is required'],
            trim: true,
            uppercase: true,
            match: [CURRENCY_CODE_PATTERN, 'Target currency must be a 3-letter currency code'],
        },
    },
    amount: {
        type: Number,
        required: [true, 'amount is required'],
        min: [0, 'Amount cannot be negative'],
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('currency', converterSchema)