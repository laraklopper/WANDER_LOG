// userRoutes.js
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config();
const express = require('express');
const User = require('../models/userSchema');
const { checkJwtToken } = require('./middleware');
const router = express.Router()

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

module.exports = router
