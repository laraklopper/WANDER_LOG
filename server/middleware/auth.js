// auth.js
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

/* Read once at module load. ensureJwtSecret() has already run in app.js by this
point, so the key is guaranteed to be present in the environment */
const secretKey = process.env.JWT_SECRET_KEY;

/* Pulls the token out of an "Authorization: Bearer <token>" header.
Returns null when the header is missing or does not use the Bearer scheme */
const extractBearerToken = (req) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (!/^Bearer$/i.test(scheme) || !token) return null;
    return token.trim();
};

/**
 * Verifies the JWT on the request and loads the matching user.
 * On success req.user holds the user document (without the password) and
 * req.userId holds the id from the token payload.
 */
const authenticate = async (req, res, next) => {
    try {
        const token = extractBearerToken(req);

        // Conditional rendering to check a token was actually sent
        if (!token) {
            return res.status(401).json({ message: 'Authentication token is required' });
        }

        // Throws if the signature is invalid or the token has expired
        const payload = jwt.verify(token, secretKey, { algorithms: ['HS256'] });

        /* The token is valid, but the account may have been deleted since it was
        issued, so the user is loaded to confirm they still exist */
        const user = await User.findById(payload.userId);

        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        /* jsonwebtoken raises TokenExpiredError separately so the client can tell
        an expired session apart from a tampered token and prompt a fresh login */
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session has expired, please log in again' });
        }
        console.error('[ERROR: auth.js] Token verification failed:', error.message);
        return res.status(401).json({ message: 'User not authenticated' });
    }
};

/**
 * Restricts a route to admin users. Must be mounted after authenticate,
 * which is what puts req.user in place.
 */
const requireAdmin = (req, res, next) => {
    if (!req.user?.admin) {
        console.warn('[WARN: auth.js] Non admin user attempted to access an admin route');
        return res.status(403).json({ message: 'Admin privileges are required for this action' });
    }
    next();
};

module.exports = { authenticate, requireAdmin };
