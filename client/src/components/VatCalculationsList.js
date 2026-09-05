import React from 'react'
import '../css/componentCss/VatCalculations.css'
/* The saved VAT calculations panel. The requests themselves live on
Budget.js, which owns the list state, and arrive here as
`fetchVatCalculations` and `deleteVatCalculation` - the same arrangement as
ConversionsList.js. The table itself is not built yet. */
export default function VatCalculationsList(
    {
      currentUser,
        loggedIn,
        vatCalculations = [],
        vatCalculationsTotal = 0,
        setVatCalculationsError,
        vatCalculationError,
        fetchVatCalculations,
        deleteVatCalculation
    }
) {
  const username = currentUser.username
  return (
    <div>
      <div>
        <table>
          <thead>
            <thead>
              <tr>
                <th colSpan={5}>
                  {username} VAT CALCULATIONS
                </th>
              </tr>
              <tr>
                <th>MODE</th>
                <th>RATE</th>
                <th>NET AMOUNT</th>
                <th>VAT AMOUNT</th>
                <th>GROSS AMOUNT</th>
              </tr>
            </thead>
          </thead>
        </table>
      </div>
    </div>
  )
}
