// app.js
/* Load environment variables from a .env 
file using the dotenv package*/
require('dotenv').config()
const ensureSecretKey = require('./config/ensureJwtSecret');
ensureSecretKey();
// Import connection function
const connectDB = require('./config/connect')
const express = require('express');
const mongoose = require('mongoose');
// Extract enviromental variables
const port = process.env.PORT || 3001;

const app = express()

if (!port) {
    console.error('[ERROR app.js]: PORT enviromental variable is missing');
    process.exit(1);
}


// ======SETUP GLOBAL MIDDLEWARE============

// =========ROUTES===========

//-------MONGOOSE CONFIG
/*/ Disable strict populate to prevent errors when 
populating paths that are conditionally defined*/
mongoose.set('strictPopulate', false)
//=============START THE SERVER=============
connectDB().then(() => {
    app.listen(port, () => {
        console.info(`[INFO:app.js] server is running on ${port}`)
    })
}).catch((error) => {
    console.error('[ERROR: app.js]: Database connection failed');
    process.exit();
})
