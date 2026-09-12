// middleware.js
/* Load environment variables from a .env 
file using the dotenv package*/
require('dotenv').config();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/userSchema')
// Extract enviromental variables
const secretKey = process.env.JWT_SECRET_KEY || 'secretKey';

// Industry standard, balances security and performance
const SALT_ROUNDS = 10; // Number of hashing rounds 

/*====================
JWT VERIFICATION MIDDLEWARE
===============*/
const checkJwtToken = (req, res, next) => {
     console.log('[DEBUG: middleware.js] [checkJwtToken] Middleware triggered');
     try {
        let authHeader = req.headers.authorization || '';

       /*Conditional rendering to check if the header exists 
        and follows "Bearer <token>" format*/
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn('[WARN: middleware.js ,checkJwtToken] Authorization header missing or malformed');// Log a warning message in the console for debugging purposes
            return res.status(401).json(// Respond with a 401 (Unauthorised) status code and an error message
                { 
                    success: false,
                    message: 'Access denied. No token provided.' 
                });
        }

        const token = authHeader.split(' ')[1];// Extract the actual token part after "Bearer "

        //Conditional rendering to check if the token is present
        if (!token) {// Extra safety check: ensure token string is not empty
            console.warn('[WARN: middleware.js, checkJwtToken] Token is empty after split');// Log a warning message in the console for debugging purposes
            return res.status(401).json({// Respond with a 401 (Unauthorised) status code and an error message
                success: false,//Success status
                message: 'Access denied. No token provided.'//JSON message
            });
        }

        const decoded = jwt.verify(token, secretKey)// Verify and decode the JWT using the secret key
        req.user = decoded;// Attach decoded user information to the request object
        // This allows routes to access req.user.userId, req.user.isAdmin, etc.

        console.log('[SUCCESS: middleware.js, checkJwtToken ]: Token provided');//Log a message in the console for debugging purposes
        next()// Call the next middleware or route handler
     } catch (error) {
        console.error('[ERROR: middleware.js] No token attatched to the request', error.message);//Log an error message in the console for debugging purposes
       
        // Provide specific error messages based on JWT error type
        if (error.name === 'TokenExpiredError') {
            console.error('[ERROR: middleware.js, checkJwtToken]: Token expired');
            return res.status(401).json({ // Respond with a 401 (Unauthorized) status code with an error message 
                success: false, //Success status
                message: 'Token has expired. Please login again.'//JSON message
            });
        } else if (error.name === 'JsonWebTokenError') {
            console.error('[ERROR: middleware.js, checkJwtToken]: Invalid token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ // Respond with a 401 (Unauthorized) status code with an error message 
                success: false, //Success Status
                message: 'Invalid token. Please login again.'//JSON message
            });
        }
        return res.status(401).json({// Respond with a 401 (Unauthorized) status code with an error message 
            success: false, //Success status
            message: 'Invalid or expired token.'//JSON message
        });
     }
};

/*===========================
RATE-LIMIT MIDDLEWARE
==============*/
/**Middleware General API rate limiterapplied to sensitive endpoints to limit 
  to 100 requests per 15 minutes per IP*/
const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Define the time window for rate limiting (15 minutes)
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',// Default message returned when the rate limit is exceeded
    standardHeaders: true,// Include standard RateLimit headers in the response
    legacyHeaders: false,// Disable the legacy X-RateLimit-* headers
    // Custom function that runs when the rate limit is exceeded
    handler: (req, res) => {
        console.warn(`[WARN: middleware.js, generalRateLimiter] Rate limit exceeded for IP: ${req.ip}`);// Log a warning message in the console for debugging purposes
        res.status(429).json({//Respond with a 429 (To many requests) status code and an error message
            success: false,// Indicate the request was unsuccessful
            message: 'Too many requests, please slow down',// User-friendly error message
            /*Calculate approximately how many minutes remain until
            the client can make requests again*/
            retryAfter: Math.ceil(
                (req.rateLimit.resetTime - Date.now()) / 1000 / 60
            ) + ' minutes'// minutes until reset
        });
    },
});
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
/* An export reads every record of one type on the account and builds a file out
of them, which costs more than the reads the pages themselves make. The limit is
loose enough that nobody choosing both formats for all four lists would meet it,
and stops one client asking for full exports in a loop. Returns 429 (RFC 6585)
once the quota is used up */
const exportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,// 15 minute window
    max: 60,// 60 exports per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many exports, please try again in 15 minutes' },
});

/*Rate limiter middleware to limit password updates*/
const passwordUpdateRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password updates per hour
    message: 'Too many password update attempts, please try again later',//Counts all password update attempts
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`[WARN: middleware.js, passwordUpdateRateLimiter] Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({//Respond with a 429 (To many requests) status code and an error message
            success: false,// Indicate that the request was unsuccessful
            message: 'Too many password update attempts, please try again in an hour',// User-friendly error message
            retryAfter: Math.ceil(// Calculate how many minutes remain before another login attempt is allowed
                (req.rateLimit.resetTime - Date.now()) / 1000 / 60
            ) + ' minutes'// minutes until reset
        });
    },
});


/*====================
ADMIN ONLY MIDDLEWARE
===============*/
/* Confirms the account behind a verified token holds admin rights.
Placed after checkJwtToken, which is what puts the decoded payload on req.user,
so this only ever runs once the token itself has been verified.

The stored account is loaded rather than the admin claim on the token being
taken at face value: a token is signed once at login and carries the flag as it
stood then, so an account that has since had its rights removed would keep
presenting a token that still claims them until it expires */
const checkAdmin = async (req, res, next) => {
    console.log('[DEBUG: middleware.js] [checkAdmin] Middleware triggered');// Log message in the console for debugging purposes
    try {
        /* checkJwtToken assigns the decoded token, not a loaded account, so the
        id comes from the payload that signToken put there */
        const userId = req.user?.userId;

        // Conditional rendering to check the token carried an id
        if (!userId) {
            console.error('[ERROR: middleware.js, checkAdmin] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({// Respond with a 401 (Unauthorised) status code and an error message
                success: false,//Success status
                message: 'Access denied. Please login again.'//JSON message
            });
        }

        // Only the two fields this check and its logging need are loaded
        const user = await User.findById(userId).select('username admin').exec();

        /* Conditional rendering to check the user on the token still exists: a
        deleted account leaves a token that still verifies, and a 401 tells the
        client to end the session rather than reporting it as a refusal */
        if (!user) {
            console.warn('[WARN: middleware.js, checkAdmin] No user found for id', userId);// Log a warning message in the console for debugging purposes
            return res.status(401).json({// Respond with a 401 (Unauthorised) status code and an error message
                success: false,//Success status
                message: 'Invalid token. Please login again.'//JSON message
            });
        }

        //Conditional rendering to check the account holds admin rights
        if (!user.admin) {
            console.warn(`[WARN: middleware.js, checkAdmin] ${user.username} is not an admin`);// Log a warning message in the console for debugging purposes
            return res.status(403).json({// Respond with a 403 (Forbidden) status code and an error message
                success: false,//Success status
                message: 'Access denied. This action is for admin users only.'//JSON message
            });
        }

        /* Kept on the request so a handler does not have to load the same
        account a second time, for example to check which admin is acting */
        req.adminUser = user;

        console.log(`[SUCCESS: middleware.js, checkAdmin] ${user.username} confirmed as an admin`);//Log a message in the console for debugging purposes
        return next();// Call the next middleware or route handler
    } catch (error) {
        console.error('[ERROR: middleware.js, checkAdmin]:', error.message);//Log an error message in the console for debugging purposes
        return res.status(500).json({// Respond with a 500 (Internal Server Error) status code
            success: false,//Success status
            message: 'Internal server Error'//JSON message
        });
    }
};

/*==============
===============*/
/*Middleware to ensure that the password has a minimum of
eight characters and at least one special character*/
const checkPassword = (req, res, next) => {
    console.log('[DEBUG: middleware.js checkPassword] Middleware triggered');// Log message in the console for debugging purposes

    // Support both registration (password) and password change (newPassword)
    const pwd = req.body?.password ?? req.body?.newPassword;

    //Conditional rendering to check if password input is provided
    if (typeof pwd !== 'string') {
        console.error('[ERROR: middleware.js, checkPassword]: Password is required');// Log a error message in the console for debugging purposes
        return res.status(400).json({//Return a 400 (Bad Request) status code with a error message
             message: 'Password is required.' //Error Message
            });
    }
    // Regular expression used to validate password strength
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;

    //Conditional rendering to test the password against the regular expression
    if (!passwordRegex.test(pwd)) {
        console.error('[ERROR: middleware.js, checkPassword] Weak password');//Log an error message in the console for debugging purposes
        return res.status(400).json(// Respond with a 400 (Bad Request) status and an error message
            { message: 'Password must be at least 8 characters long and contain one special character.' }//Error message
        );
    }
    return next();// Call the next middleware or route handler
}

/*Middleware to hash password before registration or password changes
 * Expects req.body.password to be present*/
const hashPassword = async (req, res, next) => {
    try {
        const {password, newPassword} = req.body || {};// Extract the password and newPassword from the request body
        //Conditional rendering for password hashing
        // Hash password for registration/login
        if (password && !newPassword) {
             const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)// Generate a secure hash of the password using bcrypt
            req.body.password = hashedPassword; // Replace the plain-text password with the hashed password
            console.log('[INFO: middleware.js, hashPassword] Password hashed for registration/login'); // Log a message in the console for debugging purposes
        }
        // Conditional rendering to check if this is a password update request
        // Hash new password for password changes
        if (newPassword) {
            const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);// Generate a secure hash of the new password
            req.body.newPassword = hashedNewPassword;// Replace the plain-text new password with its hash
            console.log('[INFO: hashPassword] New password hashed for update');// Log a message in the console for debugging purposes
        }

        next();// Call the next middleware or route handler
    } catch (error) {
        console.error('[ERROR: middleware.js, hashPassword] Error hashing password:', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ // Return a 500 (Internal Server Error) status code with a message
            message: 'Error processing password' //Message
        });
    }
}
//
/*Middleware function to check that user age
All users must be 18 or older; admin users must be 21 or older*/
module.exports = {
    checkJwtToken,
    checkAdmin,
    checkPassword,
    hashPassword,
    exportLimiter,
    loginLimiter,
    registerLimiter
}