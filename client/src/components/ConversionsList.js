import React from 'react'
import '../css/componentCss/ConversionsList.css'
import '../css/componentCss/DetailsPanal.css'
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
export default function ConversionsList({conversionsTotal, loggedIn,currentUser, currencyOptions, fetchConversions, setError}) {
  const username = currentUser?.username || 'NOT_AVAILABLE'
  return (
    <div>
      <div>
        <table>
          <thead>
            <tr>
              <th colSpan={5}>
                {username} : CURRENCY CONVERSIONS
              </th>
            </tr>
            <tr>
              <th>AMOUNT</th>
              <th>BASE CURRENCY</th>
              <th>TARGET CURRENCY</th>
              <th>RATE</th>
              {/* TARGET CURRENCY AMOUNT */}
              <th>AMOUNT</th>
            </tr>
          </thead>
        </table>
      </div>
      <div id='conversion-details-panal'>
        <div id='conversionHeader'>
          <Stack direction="horizontal" gap={3}>
      <div className="p-2">First item</div>
      <div className="p-2 ms-auto">Second item</div>
      <div className="p-2">
        <Button variant='warning'>
          CLOSE
        </Button>
      </div>
    </Stack>
        </div>
      </div>
    </div>
  )
}
