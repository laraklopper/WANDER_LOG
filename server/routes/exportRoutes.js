//exportRoutes

/*export endpoints: mounted at /export by app.js
GET
export/trips - export trips to csv or xlsx file
export/entries - export journal entries to csv or xlsx file
export/expenses - export expenses to csv or xlsx file
export/budgets - export list of budgets
*/
const express = require('express');
const router = express.Router()


module.exports = router