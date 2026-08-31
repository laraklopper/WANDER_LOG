// middleware.js
/* Load environment variables from a .env 
file using the dotenv package*/
require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema')
// Extract enviromental variables
const secretKey = process.env.JWT_SECRET_KEY || 'secretKey';

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
//
module.exports = {
    checkJwtToken,
    checkPassword
}