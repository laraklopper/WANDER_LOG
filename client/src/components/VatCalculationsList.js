import React from 'react'
import '../css/componentCss/VatCalculations.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
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
                <th colSpan={6}>
                  {username} : VAT CALCULATIONS
                </th>
              </tr>
              <tr>
                <th>MODE</th>
                <th>RATE</th>
                <th>isZeroRated</th>
                <th>NET AMOUNT</th>
                <th>VAT AMOUNT</th>
                <th>GROSS AMOUNT</th>
              </tr>
            </thead>
          </thead>
          <tbody>
            
          </tbody>
        </table>
      </div>
      {/* DISPLAY PANAL: panal to display the data for */}
      <div id='vatListPanal'>
        <Stack direction="horizontal" gap={3}>
      <div className="p-2">First item</div>
      <div className="p-2 ms-auto"> 
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button 
        variant='warning'
        id='closePanalBtn'
        type='button'
        // onClick={}
        // ARIA ATTRIBUTES:
        >
          CLOSE
        </Button>
      </div>
    </Stack>

      </div>
    </div>
  )
}
