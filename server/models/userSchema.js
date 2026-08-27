// userSchema.js
const mongoose = require('mongoose');
const { provinces } = require('../serverData/locations');

//Regular expressions
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Define user Schema
const userSchema = new mongoose.Schema({
    // Field for username(required for login)
    username: {
        type: String,
        required: [true, `username is required`],
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [50, 'Username cannot exceed 50 characters'], 
    },
    // =============NESTED FULL NAME OBJECT=====================
    fullName: {
        // Field for firstName
        firstName: {
            type: String,
            required: [true,'first Name is required'],
            trim: true,
            minlength: [2, 'First name must be at least 2 characters long'],
            maxlength: [50, 'First name cannot exceed 50 characters'],
        },
        // Field for lastName
        lastName: {
            type: String,
            required: [true, 'Last Name is required'],
            trim: 'true',
            minlength: [2, 'Last name must be at least 2 characters long'],
            maxlength: [50, 'Last name cannot exceed 50 characters'],
        },
    },
    // Field for user email(allow email address for any country)
    email: {
        type: String,
        trim: true,
        required: [true, 'User email address is required'],
        lowercase: true,
        validate: {
            validator: (v) => emailRegex.test(v), // Validate using regular expression
            message: (props) => `${props.value} is not a valid email address` // Custom error message for invalid emails
        },   
    },
    // Field for user date of birth
    /* Users must be at least 18 years old and 
    admin users must be atleast 21 years old*/
    dateOfBirth: {
        type: Date,
        trim: true,
        required: [true, 'Date of Birth is required'],
        validate: {
            validator: (v) => v < new Date(),
            message: 'Date of Birth must be a valid past date',
        }
    },
    // ===========NESTED USER ADDRESS==============
    address: {
        // Field for street address
        line1: {
            type: String,
            trim: true,
            required: [true, 'Street address is required'],
            minlength: [2, 'Address line 1 must be at least 2 characters long'],
            maxlength: [100, 'Address line 1 cannot exceed 100 characters'],
        },
        // Complex/building/floor/etc. (optional)
        line2: {
            type: String,
            trim: true,
            minlength: [2, 'Line 2 must be at least 2 characters long'],
            maxlength: [100, 'Line 2 cannot exceed 100 characters'],
        },
        // Field for city or town
        city: {
            type: String,
            required: [true, 'City or town name is required'],
            trim: true,
            minlength: [2, 'City or town name must be at least 2 characters long'],
            maxlength: [50, 'City or town name cannot exceed 50 characters']
        },
        // Field for province
        province: {
            type: String,
            required: true,
            trim: true,
            enum: provinces,
            minlength: [2, 'Province or region name must be at least 2 characters long'],
            maxlength: [50, 'Province name cannot exceed 50 characters']
        },
    },
    // Field for Password (required for login)
    // Password hashing is done in registration request middleware (not used during dev)
    password: {
        type: String,
        required: [true, 'user password is required'],
        trim: true,
        minlength: [8, 'Password must be at least 8 characters long'], 
        maxlength: [1024, 'Password cannot exceed 1024 characters'],
        select: false,// prevent password from being returned in queries by default 
    },
    // Role-based access control: true = admin privileges, false/undefined = regular user
    admin: {
        type: Boolean,
        default: false,
    },
    // Field for profile picture
    // Stores the Cloudinary URL after upload
    profilePicture: {
        type: String,
        default: null,
    },
    // Field for number of journal entries
    // Not required on registration
    entries: [{//Journal entries
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Entry',
    }]
},{
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

//===========VIRTUALS======================
// Virtual field to return full name as a single string
userSchema.virtual('fullNameString').get(function () {
    const { firstName, lastName } = this.fullName;
    return `${firstName} ${lastName}`.trim(); 
});

// Virtual field returning the address formatted as a single readable string
userSchema.virtual('userAddress').get(function () {
    return [
        this.address?.line1,
        this.address?.line2,
        this.address?.city,
        this.address?.province,
    ]
        .filter(Boolean)
        .join(', ');
});

//export the userSchema
module.exports = mongoose.model('User', userSchema)