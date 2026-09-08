import React from 'react'

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
    </div>
  )
}
