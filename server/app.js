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
const multer = require('multer');
// Folder multer writes uploaded profile pictures into
const { UPLOAD_ROOT } = require('./routes/uploadMiddleware');
// Import routers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vatRoutes = require('./routes/vatRoutes');
const tripRoutes = require('./routes/tripRoutes');
const entryRoutes = require('./routes/entryRoutes')
const expenseRoutes = require('./routes/expenseRoutes.js')
const budgetRoutes = require('./routes/budgetRoutes.js')
const apiRoutes = require('./routes/apiRoutes.js')
const exportRoutes = require('./routes/exportRoutes.js')
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
    /* The export routes answer with a file and name it in Content-Disposition.
    A cross origin response only lets the page read the handful of headers CORS
    exposes by default, so without this the export form could not read the name
    the server chose and would have to make one up for the download */
    exposedHeaders: ['Content-Disposition'],
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

/* Serves the uploaded profile pictures. Multer only writes the file to disk,
nothing about that makes it reachable over HTTP, so the folder is mounted here
under the same /uploads path the register route stores on the user document.

Mounted before the routers so a picture is served without touching the API,
and read only: express.static answers GET and HEAD and nothing else, so the
folder cannot be written to or listed through this mount */
app.use('/uploads', express.static(UPLOAD_ROOT, {
    index: false,// No directory listing when a folder itself is requested
    /* Pictures are given a generated, unique name and are never overwritten,
    so a cached copy can never be stale */
    maxAge: '7d',
}));

// =========ROUTES===========
// Prefix all route modules with their base path.
app.use('/auth', authRoutes);// Authentication related routes-Login and registration
app.use('/users', userRoutes);// user related routes - Current user and user lookups
app.use('/vat', vatRoutes);// VAT related routes- The VAT calculator, and the logged in user's saved calculations
app.use('/trip', tripRoutes);// Trip related routes -The logged in user's trips
app.use('/entry', entryRoutes );//Entry related routes
app.use('/expense', expenseRoutes )//Expense related routes
app.use('/budget', budgetRoutes)///Budget related routes
app.use('/exports' , exportRoutes)//Data export related routes
app.use('/api', apiRoutes)// Currency related routes - the currency list, conversion, and the logged in user's saved conversions

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

    /* Safety net for an upload failure on a route that did not add its own
    handler after the multer middleware. A bad file is the client's mistake, so
    it is a 400 rather than the 500 the fallback below would return */
    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            message: error.code === 'LIMIT_FILE_SIZE'
                ? 'The uploaded file is too large'
                : 'The uploaded file could not be accepted',
        });
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
