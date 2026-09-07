require('dotenv').config()
const express = require('express');
const router = express.Router()

// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
router.get('/fetchBudget/:id',)
router.get('/fetchBudgets')

/*──────────────────────────── POST ROUTES ─────────────────────────────────────
   POST: CREATE — Used to send information to the server
────────────────────────────────────────────────────────────────────────────────*/
//Route to Add a new trip budget. A single trip may only ever have one
router.post('/addBudget', async (req, res) => {
    try {
        
    } catch (error) {
        
    }
})

/*──────────────────────────── PATCH ROUTES ───────────────────────────────────
   PATCH: UPDATE — Used to partially update information in the database
────────────────────────────────────────────────────────────────────────────────*/
// Route to eit a single trip budget
router.patch('/editBudget/:id', async (req, res) => {
    try {
        
    } catch (error) {
        
    }
})


/*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
router.delete('/deleteBudget/:id')
module.exports = router;

