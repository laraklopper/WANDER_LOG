// userRoutes.js
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const User = require('../models/userSchema');
const { checkJwtToken, checkPassword } = require('./middleware');
const router = express.Router()

/* A password change has to be told the current password, which makes it a
guessing target in the same way the login endpoint is. The quota is per IP and
matches the one on /auth/login, so a stolen token cannot be used to work out the
password behind it */
const editPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,// 15 minute window
    max: 10,// 10 attempts per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many password change attempts, please try again in 15 minutes' },
});

/* Route to GET the currently logged in user.
This is the endpoint the React app calls after login, and on every reload, to
turn the stored token back into a user object. authenticate has already loaded
the account, so no second lookup is needed */
router.get('/me', checkJwtToken, async (req, res) => {
    try {
        return res.status(200).json(req.user.toPublicJSON());
    } catch (error) {
        console.error('[ERROR: userRoutes.js "/me"]:', error.message);//Log an error message in the console for debugging purposes
        return res.status(500).json({ message: 'Internal server Error' });
    }
});

/* Route to GET all users*/
router.get('/findUsers', checkJwtToken, async (req, res) => {
    try {
        const { username } = req.query;// Extract the username from the query parameters
        // If a username is provided, use it to filter users, otherwise return all users
        const query = username ? { username } : {};
        const users = await User.find(query); // Fetch users based on the query object

        /* The password is already excluded by select: false on the schema, and the
        toJSON transform strips it again, so the documents are safe to return */
        return res.status(200).json(users.map((user) => user.toPublicJSON()));// Send the list of users as the response
    }
    catch (error) {
        console.error('[ERROR: userRoutes.js "/findUsers"]:', error.message);//Log an error message in the console for debugging purpose
        return res.status(500).json(// Send 500(Internal server error) status code and error message in JSON response
            { message: 'Internal server Error' }
        );
    }
})

/*──────────────────────────── PATCH ROUTES ─────────────────────────────
    PATCH: Used to change part of an existing resource
 ─────────────────────────────────────────────────────────────────────────*/
/* Route to PATCH the password of one account.
checkPassword runs before the handler and already reads newPassword, so a weak
password is rejected as a 400 before the database is touched */
router.patch('/:id/editPassword', checkJwtToken, editPasswordLimiter, checkPassword, async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body || {};

        /* checkJwtToken assigns the decoded token, not a loaded account, so the
        id comes from the payload that signToken put there */
        const requesterId = req.user?.userId;

        // Conditional rendering to check that the current password was sent
        if (!currentPassword) {
            return res.status(400).json({ message: 'Current password is required' });
        }

        /* Checked before the lookup, otherwise a malformed id reaches Mongoose as
        a CastError and is reported as a 500 instead of a 400 */
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        /* An account may only change its own password. Without this any logged in
        user could aim the route at another id, and the token would still pass.
        Admins are not exempt: they have no need to change a password through this
        endpoint, and allowing it would turn the admin flag into a way to take over
        an account */
        if (String(requesterId) !== String(id)) {
            console.warn(`[WARN: userRoutes.js "/:id/editPassword"] ${requesterId} tried to change the password of ${id}`);
            return res.status(403).json({ message: 'You may only change your own password' });
        }

        // select('+password') is needed because the field is select: false
        const user = await User.findById(id).select('+password');

        //Conditional rendering to check that the account still exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        /* The current password is confirmed even though the token is already
        valid, so that a token taken from a shared machine is not enough on its own
        to lock the owner out of their account */
        if (!(await user.comparePassword(currentPassword))) {
            console.warn(`[WARN: userRoutes.js "/:id/editPassword"] Incorrect current password for ${user.username}`);
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Nothing to do, and saying so is clearer than reporting a success that changed nothing
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from the current password' });
        }

        /* Both fields are set because confirmPassword is required by the schema and
        its validator compares it against password. The pre('save') hook then clears
        confirmPassword and replaces password with a bcrypt hash */
        user.password = newPassword;
        user.confirmPassword = newPassword;

        await user.save();

        console.info(`[SUCCESS: userRoutes.js "/:id/editPassword"] ${user.username} changed their password`);
        return res.status(200).json({
            message: 'Password updated successfully',
            user: user.toPublicJSON(),
        });
    } catch (error) {
        /* The length rules on the password field are checked against the plain text
        value, so a value checkPassword let through can still fail here */
        if (error.name === 'ValidationError') {
            const errors = Object.fromEntries(
                Object.entries(error.errors).map(([field, err]) => [field, err.message])
            );
            console.error('[ERROR: userRoutes.js "/:id/editPassword"] Validation failed:', errors);
            return res.status(400).json({ message: 'Password update failed', errors });
        }

        console.error('[ERROR: userRoutes.js "/:id/editPassword"]:', error.message);//Log an error message in the console for debugging purposes
        return res.status(500).json({ message: 'Internal server Error' });
    }
});

module.exports = router
