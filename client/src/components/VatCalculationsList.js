import React from 'react'

/* The saved VAT calculations panel. The requests themselves live on
Budget.js, which owns the list state, and arrive here as
`fetchVatCalculations` and `deleteVatCalculation` - the same arrangement as
ConversionsList.js. The table itself is not built yet. */
export default function VatCalculationsList(
    {
        loggedIn,
        vatCalculations = [],
        vatCalculationsTotal = 0,
        setVatCalculationsError,
        vatCalculationError,
        fetchVatCalculations,
        deleteVatCalculation
    }
) {
  return (
    <div>VatCalculationsList</div>
  )
}
