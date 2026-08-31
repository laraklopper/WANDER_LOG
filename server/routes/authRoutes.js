// authRoutes.js
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/userSchema');
const { checkPassword } = require('./middleware');
const router = express.Router()

/* Read once at module load. ensureJwtSecret() has already run in app.js by this
point, so the key is guaranteed to be present in the environment */
const secretKey = process.env.JWT_SECRET_KEY;

// How long a session lasts before the user has to log in again
const TOKEN_EXPIRY = '12h';

/* Limits repeated attempts from one IP so the login endpoint cannot be used to
guess passwords. Returns 429 (RFC 6585) once the quota is used up */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,// 15 minute window
    max: 10,// 10 attempts per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts, please try again in 15 minutes' },
});

/* Registration is limited more loosely: it is not a guessing target, but the
limit stops one client creating accounts in bulk */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,// 1 hour window
    max: 20,// 20 registrations per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many registration attempts, please try again later' },
});

/**
 * Signs a JWT for the given user.
 * The payload deliberately carries only the id and the role: everything else is
 * read from the database on each request, so a stale token cannot grant access
 * based on details that have since changed.
 */
const signToken = (user) =>
    jwt.sign(
        { userId: user._id, admin: user.admin },
        secretKey,
        {
            expiresIn: TOKEN_EXPIRY,
            algorithm: 'HS256',
        }
    );

//Route to send a POST request to the login endpoint
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body || {};

        // Conditional rendering to check that both credentials were sent
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        /* Looked up by username only. The password is compared in code against the
        stored hash, so it can never be part of the query.
        select('+password') is needed because the field is select: false */
        const user = await User.findOne({ username: String(username).trim() }).select('+password');

        /* Both an unknown username and a wrong password return the same 401.
        A "user not found" response would let anyone test which usernames exist */
        if (!user || !(await user.comparePassword(password))) {
            console.warn(`[WARN: authRoutes.js "/login"] Failed login attempt for username: ${username}`);
            return res.status(401).json({ message: 'Incorrect username or password' });
        }

        const token = signToken(user);
        console.info(`[SUCCESS: authRoutes.js "/login"] ${user.username} logged in`);

        return res.status(200).json({ token, user: user.toPublicJSON() });
    } catch (error) {
        console.error('[ERROR: authRoutes.js "/login"]:', error.message);//Log an error message in the console for debugging purposes
        return res.status(500).json({ message: 'Internal Server Error' });
    }
})

//Route to send a POST request to the register endpoint
router.post('/register', registerLimiter , checkPassword, async (req, res) => {
    try {
        const {
            username,
            fullName,
            email,
            dateOfBirth,
            address,
            password,
            confirmPassword,
            profilePicture,
            admin = false,
        } = req.body || {};

        //Conditional rendering to check that all the required fields exist
        if (!username || !email || !dateOfBirth || !password) {
            console.error('[ERROR: authRoutes.js "/register"]: Username, email, date of birth, and password are required');//Log a message in the console for debugging purposes
            return res.status(400).json(
                { message: 'Username, email, date of birth, and password are required' });
        }

        /* Compared here as well as in the schema so a mismatch is reported as a
        plain 400 rather than a field validation error */
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        /* $or, not an implicit AND: an account clashes if EITHER the username or
        the email is already taken, not only when both match the same record */
        const existingUser = await User.findOne({
            $or: [
                { username: String(username).trim() },
                { email: String(email).trim().toLowerCase() },
            ],
        });
        // Conditional rendering to check if a user with the same username or email already exists
        if (existingUser) {
            /* Named precisely so the form can tell the user which field to change.
            This endpoint is public, so it does reveal that a username or email is
            taken, which is unavoidable on a registration form */
            const takenField = existingUser.username === String(username).trim() ? 'Username' : 'Email';
            console.error(`[ERROR: authRoutes.js "/register"]: ${takenField} already exists`);
            return res.status(409).json({ message: `${takenField} is already registered` });
        };

        /* Every field the form sends is passed through. fullName and address are
        required by the schema, so leaving them out would fail validation.
        The password is hashed by the pre('save') hook on the schema, and
        confirmPassword is dropped by the same hook once it has been compared */
        const newUser = new User({
            username,
            fullName,
            email,
            dateOfBirth,
            address,
            admin,
            password,
            confirmPassword,
            profilePicture: profilePicture || null,// Kept null rather than an empty string when the optional field is blank
        });

        const savedUser = await newUser.save()

        // Generate JWT token for the newly registered user so they are logged straight in
        const token = signToken(savedUser);

        console.info(`[SUCCESS: authRoutes.js "/register"] Registered new user: ${savedUser.username}`);
        return res.status(201).json({ token, user: savedUser.toPublicJSON() });
    } catch (error) {
        /* Mongoose collects every failed field rule into one ValidationError.
        They are returned as a 400 with a field keyed object so the registration
        form can show each message next to the input that caused it */
        if (error.name === 'ValidationError') {
            const errors = Object.fromEntries(
                Object.entries(error.errors).map(([field, err]) => [field, err.message])
            );
            console.error('[ERROR: authRoutes.js "/register"] Validation failed:', errors);
            return res.status(400).json({
                message: 'Registration failed, please check the highlighted fields',
                errors,
            });
        }

        /* Duplicate key error from the unique indexes on username and email.
        Reachable when two requests register the same details at the same time,
        after the findOne check above has already passed for both */
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'Account';
            console.error(`[ERROR: authRoutes.js "/register"] Duplicate ${field}`);
            return res.status(409).json({ message: `That ${field} is already registered` });
        }

        console.error('[ERROR: authRoutes.js "/register"] Failed to add User:', error.message);
        return res.status(500).json({ message: 'Internal Server Error' })
    }
})

module.exports = router
