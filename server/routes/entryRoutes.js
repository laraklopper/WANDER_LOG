// 
/*Entry endpoints, mounted at /entry by app.js

- GET /fetchEntries - Fetch all entries for loggedIn user
- GET /fetchEntry/:id - Fetch one entry
- POST /addEntry - add a new entry
- PATCH /editEntry/:id - edit/update an entry
- DELETE /delete/:id - delete an entry
*/

const express = require('express');
const Entry = require('../models/entrySchema')
const router = express.Router()

/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
// entry/fetchEntries - Fetch all entries for loggedIn user
// entry/fetchEntry/:id - Fetch one entry
/*──────────────────────────── POST ROUTES ─────────────────────────────────────
   POST: CREATE — Used to send information to the server
────────────────────────────────────────────────────────────────────────────────*/
// entry/addEntry - add a new entry
/*──────────────────────────── PATCH ROUTES ───────────────────────────────────
   PATCH: UPDATE — Used to partially update information in the database
────────────────────────────────────────────────────────────────────────────────*/
// entry/editEntry/:id - update a user entry
/*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
// entry/delete/:id - Delete a user entry
module.exports = router