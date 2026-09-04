// expenseRoutes.js
/*expense endpoints, mounted at /expense by app.js
- GET fetchExpenses - fetch all expenses
- GET /fetchExpense/:id - fetch a single expense by Id
- POST /addExpense - add an expens
- PATCH /updateExpense/:id - Edit an expense
- DELETE /delete/:id - delete an expense
*/
const express = require('express');
const Expense = require('../models/budgetSchema')
const router = express.Router()

// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/*──────────────────────────── POST ROUTES ─────────────────────────────────────
   POST: CREATE — Used to send information to the server
────────────────────────────────────────────────────────────────────────────────*/
/*──────────────────────────── PATCH ROUTES ───────────────────────────────────
   PATCH: UPDATE — Used to partially update information in the database
────────────────────────────────────────────────────────────────────────────────*/
/*──────────────────────────── DELETE ROUTES ────────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/

// ======EXPORT THE ROUTER==========
module.exports = router;