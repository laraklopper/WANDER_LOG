// vatRoutes.js
/* VAT endpoints, mounted at /vat by app.js.

  POST   /calculate   - work out the VAT on one amount (saves nothing)
  POST   /save        - save a calculation to the logged in user's history
  GET    /history     - the logged in user's saved calculations
  DELETE /history/:id - remove one of the logged in user's saved calculations
  */

// VAT calculator used to determine VAT on expenses while travelling