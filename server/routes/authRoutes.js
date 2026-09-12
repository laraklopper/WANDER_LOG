// authRoutes.js
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
// IMPORT REQUIRED MODULES AND PACKAGES
const express = require('express');//Express framework for building web applications
const jwt = require('jsonwebtoken');// Import the JSON Web Token (JWT) library
// Import schemas
const User = require('../models/userSchema');
// Import Middleware
const { checkPassword, checkAge, registerLimiter, loginLimiter} = require('./middleware');
const router = express.Router()// Create a new router object using Express

// Extract environmental variables (with safe fallbacks for local dev)
const secretKey = process.env.JWT_SECRET_KEY || 'secretKey';// JWT secret key
const tokenExpiry = process.env.TOKEN_EXPIRY ||'12h';// JWT expiry Time
const jwtAlgorithm = process.env.JWT_ALGORITHM || 'HS256';// JWT algorithm

//=====CHECK IF ALL THE ENVIRONMENTAL VARIABLES A PRESENT=========
// Conditional rendering to check if the environmental variables are missing
if (!secretKey) {
    console.warn("[WARNING: authRoutes.js]: JWT_SECRET_KEY not set. Using fallback key.");// Log a warning message in the console for debugging purposes
}
else if(!tokenExpiry){
    console.warn('[WARNING: authRoutes.js] Missing exiration time, using fallback time')// Log a warning message in the console for debugging purposes
}
else if(!jwtAlgorithm){
    console.warn('[WARNING: authRoutes.js] Missing jwt algorithm, using fallback algorithm.'); // Log a warning message in the console for debugging purposes
}
// UTILITY FUNCTIONS
// Function to sign the JWT token for the given user
const signToken = (user) =>
    jwt.sign(
        { userId: user._id, admin: user.admin },
        secretKey,//SecretKey
        {
            expiresIn: tokenExpiry,//Token expiry time
            algorithm: jwtAlgorithm,//JWT Algorithm
        }
    );

//=============ROUTES================
/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
// Send a POST request to the /auth/login route(login endpoint)
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body || {};//Extract the usersername and password from the request body

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
/* checkAge runs before the handler so an underage registration is refused
without a database lookup. The schema enforces the same limits in its
pre('validate') hook, which covers any write that does not come through here */
router.post('/register', registerLimiter , checkPassword, checkAge, async (req, res) => {
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

        /* Every field the form sends is passed through. */
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

        /* Duplicate key error from the unique indexes on username and email */
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'Account';
            console.error(`[ERROR: authRoutes.js "/register"] Duplicate ${field}`);
            return res.status(409).json({ message: `That ${field} is already registered` });
        }

        console.error('[ERROR: authRoutes.js "/register"] Failed to add User:', error.message);
        return res.status(500).json({ message: 'Internal Server Error' })// Return a 500 (Internal Server Error) status code with a json message
    }
})

//Export the authRouter
module.exports = router
