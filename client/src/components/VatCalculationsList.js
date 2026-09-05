import React, { useCallback, useMemo, useState } from 'react'
import '../css/componentCss/VatCalculations.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT UTILITY FUNCTIONS
import {
  NOT_AVAILABLE,
  rowClass,
  toLongDateTime,
  toPercent,
  toRands
} from '../util/formatCalculations';
import {
  enteredAmountOf,
  toVatMode,
  toVatModeLabel,
  toVatRate
} from '../util/vatFunctions';
/* The saved VAT calculations panel. The requests themselves live on
Budget.js, which owns the list state, and arrive here as
`fetchVatCalculations` and `deleteVatCalculation` - the same arrangement as
ConversionsList.js. */
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
  /* Which record the display panel is showing, held as an id rather than as the
  record itself. The list is refetched after a delete, so a stored object could
  outlive the record it was copied from and leave the panel showing a
  calculation the database no longer holds. */
  const [selectedId, setSelectedId] = useState(null)
  // The row whose DELETE is in flight, so only that button reports itself busy
  const [deletingId, setDeletingId] = useState(null)

  /* Resolved out of the list on every render, so the panel follows the state
  Budget.js owns: when a refetch drops the selected calculation the panel closes
  itself rather than displaying a stale copy. */
  const selectedCalculation = useMemo(
    () => vatCalculations.find(calculation => calculation._id === selectedId) || null,
    [vatCalculations, selectedId]
  )

  /* Only the newest 100 records are returned by /vat/history, which reports the
  full count separately. Compared here so a truncated view says so rather than
  looking like the user's whole history. */
  const isTruncated = vatCalculationsTotal > vatCalculations.length

  //================EVENT LISTENERS========================
  // Opens the display panel on one calculation
  const handleSelect = useCallback((calculationId) => {
    setSelectedId(calculationId)
  },[])

  // Closes the display panel without touching the list itself
  const handleClose = useCallback(() => {
    setSelectedId(null)
  },[])

  /* Refetches the list. The error is cleared first, so a failure that has since
  been fixed does not leave its message sitting above a list that just loaded. */
  const handleRefresh = useCallback(() => {
    setVatCalculationsError('')
    fetchVatCalculations()
  },[fetchVatCalculations, setVatCalculationsError])

  /* Removes the calculation the panel is showing. Budget.js refetches the list
  on a successful delete, which drops the record and so closes the panel through
  `selectedCalculation`; on a failure it sets the error instead and the panel
  stays open with the message shown. */
  const handleDelete = useCallback(async () => {
    if (!selectedCalculation) return;// Nothing on screen to delete
    setDeletingId(selectedCalculation._id)
    try {
      await deleteVatCalculation(selectedCalculation._id)
    } finally {
      setDeletingId(null)
    }
  },[deleteVatCalculation, selectedCalculation])

  //=================JSX RENDERING================
  /* The endpoint takes the user from the token, so there is nothing to list
  without a session and the request would only answer 401 */
  if (!loggedIn) {
    return (
      <div id='vat-calculations-list'>
        <p className='infoText'>Please log in to see your saved VAT calculations.</p>
      </div>
    )
  }

  const username = currentUser?.username || NOT_AVAILABLE
  const isDeleting = Boolean(deletingId)

  return (
    <div id='vat-calculations-list'>
      <div id='vat-list-block'>
        <table id='vat-calculations-table'>
          <thead>
            <tr>
              <th colSpan={7}>
                {username} : VAT CALCULATIONS
              </th>
            </tr>
            <tr>
              <th scope='col'>MODE</th>
              <th scope='col'>RATE</th>
              <th scope='col'>isZeroRated</th>
              <th scope='col'>NET AMOUNT</th>
              <th scope='col'>VAT AMOUNT</th>
              <th scope='col'>GROSS AMOUNT</th>
              <th scope='col'>VIEW</th>
            </tr>
          </thead>
          <tbody>
            {/* Conditional rendering to tell an empty history apart from a list
            that has not loaded: an empty table with no message reads as a
            failure rather than as a user who has saved nothing yet */}
            {vatCalculations.length === 0 ? (
              <tr>
                <td colSpan={7} className='vat-list-empty'>
                  NO SAVED VAT CALCULATIONS YET
                </td>
              </tr>
            ) : (
              vatCalculations.map((calculation, index) => (
                <tr
                  key={calculation._id}
                  className={`${rowClass(index)}${
                    calculation._id === selectedId ? ' selectedRow' : ''
                  }`}
                >
                  <td>{toVatModeLabel(calculation.mode)}</td>
                  <td>{toVatRate(calculation)}</td>
                  <td>{calculation.isZeroRated ? 'YES' : 'NO'}</td>
                  <td>{toRands(calculation.netAmount)}</td>
                  <td>{toRands(calculation.vatAmount)}</td>
                  <td>{toRands(calculation.grossAmount)}</td>
                  <td>
                    {/* A button per row rather than a click handler on the row
                    itself, so the panel can be opened from the keyboard without
                    rebuilding what a button already does */}
                    <Button
                      variant='light'
                      className='viewCalculationBtn'
                      type='button'
                      onClick={() => handleSelect(calculation._id)}
                      // ARIA ATTRIBUTES:
                      aria-label={`View the ${toVatModeLabel(calculation.mode)} calculation of ${toRands(calculation.grossAmount)}`}
                      aria-pressed={calculation._id === selectedId}
                    >
                      VIEW
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Says the list is only part of the history, so a missing older
        calculation is not read as a lost one */}
        {isTruncated && (
          <p className='infoText' id='vat-list-truncated'>
            SHOWING THE NEWEST {vatCalculations.length} OF {vatCalculationsTotal} CALCULATIONS
          </p>
        )}
        {/* ========ERROR MESSAGE==================== */}
        {vatCalculationError && (
          <p className='vat-list-error' role='alert' aria-live='assertive'>
            {vatCalculationError}
          </p>
        )}
        <div id='vat-list-actions'>
          <Button
            variant='light'
            id='refreshVatListBtn'
            type='button'
            onClick={handleRefresh}
            // ARIA ATTRIBUTES:
            aria-label='Reload your saved VAT calculations'
          >
            REFRESH
          </Button>
        </div>
      </div>
      {/* DISPLAY PANAL: panal to display the data for one saved calculation.
      Only rendered once a row has been chosen, so the panel is never on screen
      with nothing in it. */}
      {selectedCalculation && (
      <div id='vatListPanal' aria-live='polite'>
        <div>
          <Stack direction="horizontal" gap={3}>
      <div className="p-2">{toVatMode(selectedCalculation.mode)}</div>
      <div className="p-2 ms-auto">
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button
        variant='warning'
        id='closePanalBtn'
        type='button'
        onClick={handleClose}
        // ARIA ATTRIBUTES:
        aria-label='Close the calculation details panel'
        >
          CLOSE
        </Button>
      </div>
    </Stack>
        </div>
        <div>
          {/* DATA PANAL.
          Every figure comes off the stored record rather than being reworked
          here, so a calculation saved at an older rate still reports what it
          was actually worked out at. */}
          <dl id='vat-panal-data'>
            <div className='vat-panal-row'>
              <dt>SAVED</dt>
              <dd>{toLongDateTime(selectedCalculation.createdAt)}</dd>
            </div>
            <div className='vat-panal-row'>
              <dt>CALCULATION</dt>
              <dd>{toVatMode(selectedCalculation.mode)}</dd>
            </div>
            <div className='vat-panal-row'>
              <dt>RATE APPLIED</dt>
              <dd>{toVatRate(selectedCalculation)}</dd>
            </div>
            <div className='vat-panal-row'>
              <dt>ZERO-RATED</dt>
              <dd>{selectedCalculation.isZeroRated ? 'YES' : 'NO'}</dd>
            </div>
            <div className='vat-panal-row'>
              {/* The figure the user typed. Which of the two amounts below it
              was is decided by the mode, so it is called out rather than left
              for the reader to work out. */}
              <dt>AMOUNT ENTERED</dt>
              <dd>{toRands(enteredAmountOf(selectedCalculation))}</dd>
            </div>
            <div className='vat-panal-row'>
              <dt>AMOUNT EXCL. VAT</dt>
              <dd>{toRands(selectedCalculation.netAmount)}</dd>
            </div>
            <div className='vat-panal-row'>
              <dt>VAT</dt>
              <dd>{toRands(selectedCalculation.vatAmount)}</dd>
            </div>
            <div className='vat-panal-row vat-panal-row--total'>
              <dt>AMOUNT INCL. VAT</dt>
              <dd>{toRands(selectedCalculation.grossAmount)}</dd>
            </div>
            <div className='vat-panal-row'>
              {/* The VAT as a percentage of the net amount: what the stored
              figures actually work out to, which reconciles against the rate
              above and is what makes a saved record checkable */}
              <dt>EFFECTIVE RATE</dt>
              <dd>{toPercent(selectedCalculation.effectiveRate)}</dd>
            </div>
          </dl>
        </div>
        <div>
          <Stack direction="horizontal" gap={3}>
      <div className="p-2">{toRands(selectedCalculation.grossAmount)} INCL. VAT</div>
      <div className="p-2 ms-auto">{toVatRate(selectedCalculation)}</div>
      <div className="vr" />
      <div className="p-2">
      {/* BUTTON TO DELETE ITEM FROM LIST */}
        <Button
        variant='danger'
        id='deleteItemBtn'
        type='button'
        onClick={handleDelete}
        disabled={isDeleting}
        // ARIA ATTRIBUTES:
        aria-label='Delete this VAT calculation from your history'
        aria-disabled={isDeleting}
        >
          {isDeleting ? 'DELETING...' : 'DELETE'}
        </Button>
      </div>
    </Stack>
        </div>
      </div>
      )}
    </div>
  )
}
