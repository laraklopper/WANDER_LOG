const mongoose = require('mongoose');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    fullName: {
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
    },
    email: {
        type: String,
    },
    dateOfBirth: {
        type: Date,
    },
    address: {
        addressLine1: {
            type: String,
        },
        addressLine2: {
            type: String,
        },
        city: {
            type: String,
        },
        province: {
            type: String,
        },
    },
    password: {
        type: String,
    },
    admin: {
        type: Boolean,
    },
    avatar: {
        type: String,
    }
},{
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});