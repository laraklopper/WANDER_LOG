// tripRoutes.js
/* Trip endpoints, mounted at /trip by app.js

- GET /fetchTrips - List current loggedIn users trips 
- GET /fetchTrip/:id - Get one trip (?with entries)
- POST /addTrip - create a new trip 
- PATCH /editTrip/:id - update a trip
- DELETE /deleteTrip/:id - Delete a single trip by id

all routes require JWT Auth
*/

/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config();
const express = require('express');
const Trip = require('../models/tripSchema');
const { checkJwtToken } = require('./middleware');
const router = express.Router()


// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/

/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
 router.post('/addTrip', checkJwtToken, async (req, res) => {
   try {
      const userId = req.user?.userId;

      // Conditional rendering to check if userId is present
        if (!userId) {
            console.error('[ERROR: tripRoutes.js, POST /] userId missing from token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Unauthorized' });// Respond with a 401 (Unauthorised) status code
        }

        const { title, purpose, destination, date, status, username } = req.body;// Extract trip fields from the request body
      const newTrip = await Trip.save({


      })
      console.log('[SUCCESS: tripRoutes.js, POST /] Trip created:', newTrip._id);// Log a success message in the console for debugging purposes
        return res.status(201).json({ success: true, message: 'Trip created successfully.', trip: newTrip });// Respond with a 201 (Created) status code and the new trip object
   } catch (error) {
      
   }
 })
/*──────────────────────────── PATCH ROUTES ───────────────────────────────────
   PATCH: UPDATE — Used to partially update information in the database
────────────────────────────────────────────────────────────────────────────────*/
/*──────────────────────────── DELETE ROUTES ───────────────────────────────────
    DELETE: Used to remove an item from the database
 ────────────────────────────────────────────────────────────────────────────────*/

module.exports = router