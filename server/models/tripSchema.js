// tripSchema.js
const mongoose = require('mongoose');

//Define tripSchema
const tripSchema = new mongoose.Schema({
    // Field for user reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
    },
    username: {
        type: String,
        required : [true, 'Username is required']
    },
    // Field for trip title
    title: {
        type: String,
        required: [true, 'Trip title is required'],
        trim: true,
        maxlength: [100, 'Trip title cannot exceed 100 characters'],
    },
    //Field for trip purpose
    purpose: {
        type: String,
        trim: true,
        enum: ['Holiday', 'Business'],
        required: [true, 'Travel purpose is required']
    },
    //==============NESTED DESTINATION OBJECT
    destination: {
        // Field for destination type
        destinationType: {
            type: String,
            enum: ['Domestic', 'International'],
            required: [true, 'Destination type is required']
        },
        // Field for destination
        tripLocation: {
            type: String,
            trim: true,
            maxlength: 50,
            required: [true, 'Destination is required']
        },
        // Add Country if destination is international
        country: {
            type: String,
            trim: true
        }
    },
    // =================NESTED DATE OBJECT=============
    date: {
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
            validate: {
                validator: function (val) {
                    return val >= this.date.startDate;
                },
                message: 'End date must be after start date',
            },
        },
    },
    // Field for trip status
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed'],
        default: 'upcoming',
        required: [true, 'trip status is required'],
    },
    // Auto-incremented by entrySchema post-save/delete hooks
    entryCount: {
        type: Number,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// ── Indexes ──────────────────────────────────────────────────────────────────
tripSchema.index({ userId: 1, 'date.startDate': -1 });
tripSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Trip', tripSchema);