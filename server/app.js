// app.js
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
const ensureSecretKey = require('./config/ensureJwtSecret');
/* Runs before anything that signs or verifies a token, so the route modules can
read JWT_SECRET_KEY from the environment at import time */
ensureSecretKey();
// Import connection function
const { connectDB } = require('./config/connect')
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
// Import routers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vatRoutes = require('./routes/vatRoutes');
const tripRoutes = require('./routes/tripRoutes');
const entryRoutes = require('./routes/entryRoutes')
// Extract enviromental variables
const port = process.env.PORT || 3001;
/* Origin the React dev server runs on. Set CLIENT_URL in .env to point the
allow list at a deployed frontend instead */
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

const app = express()

if (!port) {
    console.error('[ERROR app.js]: PORT enviromental variable is missing');
    process.exit(1);
}


// ======SETUP GLOBAL MIDDLEWARE============
/* Sets a baseline of security response headers, including a Content Security
Policy. crossOriginResourcePolicy is relaxed so the React app on another origin
can still load resources served from here */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

/* The frontend and the API run on different ports, which makes every request a
cross origin one. Only the client origin is allowed, and only the methods and
headers the app actually sends */
app.use(cors({
    origin: clientUrl,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* Parses incoming JSON bodies into req.body. Without this the login and
registration handlers would read an undefined body and reject every request.
The size limit keeps an oversized payload from being buffered into memory */
app.use(express.json({ limit: '1mb' }));
// Parses form encoded bodies, for clients that post a plain HTML form
app.use(express.urlencoded({ extended: true }));

/* Needed for express-rate-limit to read the real client IP rather than the
proxy's when the app is deployed behind one */
app.set('trust proxy', 1);

// =========ROUTES===========
// Prefix all route modules with their base path.
app.use('/auth', authRoutes);// Authentication related routes-Login and registration
app.use('/users', userRoutes);// user related routes - Current user and user lookups
app.use('/vat', vatRoutes);// VAT related routes- The VAT calculator, and the logged in user's saved calculations
app.use('/trip', tripRoutes);// Trip related routes -The logged in user's trips
app.use('/entry', entryRoutes );//Entry related routes

// Lightweight endpoint for checking the API is up
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', database: mongoose.connection.readyState === 1 });
});

/* Fallback for any path that matched no route above, so an unknown URL returns
JSON like every other response instead of Express's default HTML page */
app.use((req, res) => {
    console.warn(`[WARN: app.js] Unknown route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

/* Central error handler. Catches anything a route passed to next(error), plus
errors thrown by the middleware above, such as a malformed JSON body */
app.use((error, req, res, next) => {
    console.error('[ERROR: app.js] Unhandled error:', error.message);

    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Request body is not valid JSON' });
    }

    res.status(error.status || 500).json({ message: 'Internal Server Error' });
});

//-------MONGOOSE CONFIG----------------
/*/ Disable strict populate to prevent errors when
populating paths that are conditionally defined*/
mongoose.set('strictPopulate', false)
//=============START THE SERVER=============
connectDB().then(() => {
    app.listen(port, () => {
        console.info(`[INFO:app.js] server is running on ${port}`)
    })
}).catch((error) => {
    console.error('[ERROR: app.js]: Database connection failed', error.message);
    process.exit(1);
})
