require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema')
const router = express.Router()

const secretKey = process.env.JWT_SECRET_KEY || 'secretKey';

router.login('/login', async (req, res) => {
    try {
        const {username, password} = req.body || {};

        if (!username || !password) {
            return res.status(400).json({ message: 'username and password are required'})
        }

        const user = await User.findOne({username, password})
        console.log('[DATA : authRoutes.js]', user);

        if (!user) {
            return res.status(404).json({message: 'User not found'});//Return a 404(Not Found) error message if no user is found
        }

        if (password === user.password) {
            const jwtToken = jwt.sign(
                {userId: user._id},
                    secretKey,
                    {
                        expiresIn: '12h',
                        algorithm: 'HS256'
                    }
            )
            res.json({'token': jwtToken})
        } else {
            console.error('Incorrect user credentials');
        }
        
    } catch (error) {
        console.error('Login Failed: Username or password are incorrect');//Log an error message in the console for debugging purposes
        res.status(401).json({ message: 'User not authenticated' })
    }
    
})

//Route to send a POST request the register endpoint
router.post('/register', async (req, res) => {
    try {
        const {username, fullName, email, dateOfBirth, address, password, admin = false} = req.body;

        //Conditional rendering to check that all the required fields exist
        if (!username || !email || !dateOfBirth || !password) {
            console.error('Username, email, date of birth, and password are required');//Log a message in the console for debugging purposes
            return res.status(400).json(
                { message: 'Username, email, date of birth, and password are required' });
        }
      
        
        const existingUser = await User.findOne({ username, email });
        // Conditional rendering to check if a user with the same username or email already exists
        if (existingUser) {
            console.error('[ERROR: userRoutes.js "/register"]: Username or Email already exists');
            return res.status(409).json( { message: 'Username or Email already exists' });
        };

        // Create a new user instance with the provided details
        const newUser = new User({ username, email, dateOfBirth, admin, password});
        const savedUser = await newUser.save()

            // Generate JWT token for the newly registered user
        const token = jwt.sign(
            { _id: savedUser._id },// Payload containing the user's ID
            secretKey, // Secret key for token signing                    
            {
                expiresIn: '12h',// Token expiration time set to 12 hours
                algorithm: 'HS256'// Specify the signing algorithm 
            }
        );
        
        res.status(201).json({ token, user: savedUser });
        console.log(savedUser);

    } catch (error) {
         console.error('Failed to add User');
        return res.status(500).json({ error: 'Internal Server Error' })
    }
})
module.exports = router