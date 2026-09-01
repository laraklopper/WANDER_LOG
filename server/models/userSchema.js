// userSchema.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { provinces } = require('../serverData/locations');

//Regular expressions
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* provinces is a list of { code, name } objects, but the address stores the
province as a plain string, so the enum needs the names on their own */
const provinceNames = provinces.map(({ name }) => name);

// Cost factor used when hashing passwords with bcrypt
const SALT_ROUNDS = 12;

/* Minimum age in years, keyed by role. Admin users carry elevated privileges,
so they must be older. The registration form applies the same two limits */
const MIN_AGE = { user: 18, admin: 21 };

/* Returns the age in whole years on the given date.
Used by the dateOfBirth validator, which cannot rely on a year subtraction
alone because the birthday may not have occurred yet this year */
const ageInYears = (dateOfBirth) => {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};

// Define user Schema
const userSchema = new mongoose.Schema({
    // Field for username(required for login)
    username: {
        type: String,
        required: [true, `username is required`],
        trim: true,
        unique: true,// Two accounts may never share a username, it identifies the user at login
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
        unique: true,// One account per email address
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
        /* Only the "must be in the past" rule lives here. The age limit depends on
        the admin flag, so it is enforced in the pre('validate') hook below, which
        can read the whole document and build a matching error message */
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
            /* An optional field the user left alone arrives from the form as an
            empty string, which minlength would reject. Normalised to undefined
            so the length rules only apply once something has been entered */
            set: (v) => (v === '' || v === null ? undefined : v),
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
            required: [true, 'Province is required'],
            trim: true,
            enum: {
                values: provinceNames,
                message: '{VALUE} is not a valid South African province',
            },
            minlength: [2, 'Province or region name must be at least 2 characters long'],
            maxlength: [50, 'Province name cannot exceed 50 characters']
        },
    },
    // Field for Password (required for login)
    /* Stored as a bcrypt hash. The length rules below are checked against the
    plain text value, because validation runs before the pre('save') hook hashes it */
    password: {
        type: String,
        required: [true, 'user password is required'],
        trim: true,
        minlength: [8, 'Password must be at least 8 characters long'], 
        maxlength: [1024, 'Password cannot exceed 1024 characters'],
        select: false,// prevent password from being returned in queries by default
    },
    /* Field used to confirm the password on registration.
    This is never stored: the pre('save') hook below clears it once
    validation has passed, so it only exists for the length of the request */
    confirmPassword: {
        type: String,
        required: [true, 'Please confirm your password'],
        select: false,// prevent confirmPassword from being returned in queries
        validate: {
            // `this` is the document being validated, so the two fields can be compared
            validator: function (v) {
                return v === this.password;
            },
            message: 'Passwords do not match',
        },
    },
    // Field for user role, either admin or regular user admin users must be at least 21 years old, regular users must be at least 18 years old
    // Role-based access control: true = admin privileges, false/undefined = regular user
    admin: {
        type: Boolean,
        default: false,
    },
    // Field for profile picture
    // Stores the Cloudinary URL after upload
    profilePicture: {
        type: String,
        // Blank input is stored as null rather than as an empty string
        set: (v) => (v === '' ? null : v),
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
    /* select: false keeps the password out of query results, but a document that
    was just created still holds it in memory. The transform is the second line of
    defence: it strips both password fields whenever a user is serialised into a
    response, so a route cannot leak them by returning the document directly */
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {// ret is the object that will be returned to the client
            delete ret.password;// remove the password field from the returned object
            delete ret.confirmPassword;// remove the confirmPassword field from the returned object
            return ret;// return the modified object
        },
    },
    toObject: {virtuals: true}
});

//===========MIDDLEWARE======================
/* Both hooks below are written without a `next` callback: Mongoose 9 only
supports the promise form for document middleware, and passes no next argument.
A hook signals completion by returning, and signals failure by throwing */

/* Runs before validation, so the error joins any other field errors in the
same ValidationError instead of being reported on its own.
The minimum age depends on the admin flag, which a single field validator
cannot see, so the check is done here where the whole document is available */
userSchema.pre('validate', function () {
    if (this.dateOfBirth) {
        const minAge = this.admin ? MIN_AGE.admin : MIN_AGE.user;
        if (ageInYears(this.dateOfBirth) < minAge) {
            this.invalidate(
                'dateOfBirth',
                `You must be at least ${minAge} years old to register${this.admin ? ' as an admin' : ''}`,
                this.dateOfBirth
            );
        }
    }
});

/* Runs after validation and before the document is written.
By this point confirmPassword has already been compared to password,
so it is dropped to keep it out of the database, and the plain text password
is replaced with a bcrypt hash */
userSchema.pre('save', async function () {
    this.confirmPassword = undefined;

    /* Guarded so that saving a user for any other reason, such as pushing a new
    journal entry, does not hash the stored hash a second time */
    if (!this.isModified('password')) return;

    // A rejection here propagates out of save(), which the route reports as a 500
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

//===========METHODS======================
/* Compares a plain text password from a login request against the stored hash.
The document must have been loaded with .select('+password'), otherwise there is
nothing to compare against */
userSchema.methods.comparePassword = function (candidatePassword) {
    if (!this.password) return Promise.resolve(false);
    return bcrypt.compare(candidatePassword, this.password);
};

/* The single shape a user takes in an API response.
Defined here rather than in each route so that login, registration and the
current user endpoint all hand the React app the same object, and so that a new
field only has to be added in one place */
userSchema.methods.toPublicJSON = function () {
    return {
        userId: this._id,
        username: this.username,
        fullName: this.fullName,
        fullNameString: this.fullNameString,
        email: this.email,
        dateOfBirth: this.dateOfBirth,
        address: this.address,
        userAddress: this.userAddress,
        admin: this.admin,
        profilePicture: this.profilePicture,
        entries: this.entries,
        createdAt: this.createdAt,
    };
};

//===========VIRTUALS======================
// Virtual field to return full name as a single string
userSchema.virtual('fullNameString').get(function () {
    /* Guarded because a user loaded with a field projection, such as the login
    lookup, may not have the nested fullName object at all */
    const { firstName = '', lastName = '' } = this.fullName || {};
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