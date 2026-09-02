// apiRoutes.js
/* Currency endpoints, mounted at /api by app.js.

  GET    /currencies                  - every currency the converter can offer
  GET    /convert?from=&to=&amount=   - convert an amount between two currencies
  POST   /save                        - save a conversion to the logged in user's history
  GET    /history                     - the logged in user's saved conversions, newest first
  DELETE /history/:id                 - remove one of the logged in user's saved conversions
*/
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
const express = require('express');
const router = express.Router()
const User = require('../models/userSchema')
const Conversion = require('../models/currConverterSchema')
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/* Serves the currencies the converter can work with, as { code, name, symbol }.
The browser builds its dropdowns and its currency table from this rather than
from a duplicated array of its own. `live` is false when the list came from the
offline fallback, so the client can tell a real list from a stand-in. */

/* Converts an amount between two currencies and returns the quote. Nothing is
written to the database here: a conversion is only kept once the user asks for
it through POST /save. */
/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
 //SAVE A CURRENCY CONVERSION
 /*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
//DELETE A SAVED CONVERSION