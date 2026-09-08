// currConverterSchema.js
const mongoose = require('mongoose');
const { apiCurrencies } = require('../serverData/currencies');

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

const converterSchema = new mongoose.Schema({
    /* The user the saved conversion belongs to. Stored as a reference rather
    than relying on the username, so a history lookup cannot return another
    user's conversions when two users share a name. Named `user` to match
    vatSchema, its sibling history model, because apiRoutes.js and vatRoutes.js
    filter their /history routes on the same field name. */
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',// The name userSchema.js registers the model under; a ref is case sensitive
        required: [true, 'user is required'],
        index: true,
    },
    /* Read off the account when the conversion is saved, never trusted from the
    request body. Stored alongside the reference so a history row can name its
    owner without populating the user document */
    username: {
        type: String,
        required: [true, 'Username is required'],
    },
    amount: {
        type: Number,
        required: [true, 'amount is required'],
        min: [0, 'Amount cannot be negative'],
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

/* Virtual field returning the converted amount (amount * rate). Derived rather
than stored, because the amount and the rate are both kept and a third stored
figure could disagree with them. */
converterSchema.virtual('convertedAmount').get(function () {
    return this.amount * this.rate;
});

module.exports = mongoose.model('currency', converterSchema)