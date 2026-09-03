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


// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
/*──────────────────────────── PATCH ROUTES ───────────────────────────────────
   PATCH: UPDATE — Used to partially update information in the database
────────────────────────────────────────────────────────────────────────────────*/
/*──────────────────────────── DELETE ROUTES ───────────────────────────────────
    DELETE: Used to remove an item from the database
 ────────────────────────────────────────────────────────────────────────────────*/
