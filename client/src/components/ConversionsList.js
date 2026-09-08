// ConversionsList.js
import React, { useCallback, useMemo, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/ConversionsList.css'
import '../css/componentCss/DetailsPanal.css'
// IMPORT BOOTSTRAP COMPONENTS
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
// IMPORT UTILITY FUNCTIONS
import {
  NOT_AVAILABLE,
  rowClass,
  toDecimal,
  toLongDateTime,
  toMoney
} from '../util/formatCalculations';
import {
  convertedAmountOf,
  countriesForCode,
  currencyLabelOf,
  toRate
} from '../util/currencyFunc';

/* The saved conversions panel. The requests themselves live on Budget.js, which
owns the list state, and arrive here as `fetchConversions` and
`deleteConversion` - the same arrangement as VatCalculationsList.js.

Nothing on this list is repriced. Each record holds the rate its save fetched,
so a conversion saved last month reports the rate it was actually worked out at
rather than today's. */
export default function ConversionsList(
  {
    currentUser,
    loggedIn,
    conversions = [],
    loadingConversions = false,
    conversionsTotal = 0,
    currencyOptions = [],
    error,
    setError,
    fetchConversions,
    deleteConversion
  }
) {
  /* Which record the display panel is showing, held as an id rather than as the
  record itself. The list is refetched after a delete, so a stored object could
  outlive the record it was copied from and leave the panel showing a conversion
  the database no longer holds. */
  const [selectedId, setSelectedId] = useState(null)
  // The row whose DELETE is in flight, so only that button reports itself busy
  const [deletingId, setDeletingId] = useState(null)

  /* Resolved out of the list on every render, so the panel follows the state
  Budget.js owns: when a refetch drops the selected conversion the panel closes
  itself rather than displaying a stale copy. */
  const selectedConversion = useMemo(
    () => conversions.find(conversion => conversion._id === selectedId) || null,
    [conversions, selectedId]
  )

  /* Only the newest 100 records are returned by /api/history, which reports the
  full count separately. Compared here so a truncated view says so rather than
  looking like the user's whole history. */
  const isTruncated = conversionsTotal > conversions.length

  //================EVENT LISTENERS========================
  // Opens the display panel on one conversion
  const handleSelect = useCallback((conversionId) => {
    setSelectedId(conversionId)
  },[])

  // Closes the display panel without touching the list itself
  const handleClose = useCallback(() => {
    setSelectedId(null)
  },[])

  /* Refetches the list. The error is cleared first, so a failure that has since
  been fixed does not leave its message sitting above a list that just loaded.
  Ignored while a request is already running, so a second press cannot start a
  fetch that would race the first and answer out of order. */
  const handleRefresh = useCallback(() => {
    if (loadingConversions) return;
    setError('')
    fetchConversions()
  },[fetchConversions, setError, loadingConversions])

  /* Removes the conversion the panel is showing.

  `deleteConversion` reports whether the record actually went: on success
  Budget.js has already refetched, so the record is gone from the list and the
  panel closes itself through `selectedConversion`. On a failure it set the
  error instead, and the panel is deliberately left open on the conversion the
  user was trying to delete, so the message is read against the record it
  concerns and the button can simply be pressed again. */
  const handleDelete = useCallback(async () => {
    if (!selectedConversion) return;// Nothing on screen to delete
    if (deletingId) return;// A delete is already running
    setDeletingId(selectedConversion._id)
    try {
      const removed = await deleteConversion(selectedConversion._id)
      /* Cleared explicitly on success rather than relying on the record leaving
      the list, so the panel closes even if a refetch failed and left the
      deleted conversion on screen */
      if (removed) setSelectedId(null)
    } finally {
      setDeletingId(null)
    }
  },[deleteConversion, selectedConversion, deletingId])

  //=================JSX RENDERING================
  /* The endpoint takes the user from the token, so there is nothing to list
  without a session and the request would only answer 401 */
  if (!loggedIn) {
    return (
      <div id='conversions-list'>
        <p className='infoText'>Please log in to see your saved conversions.</p>
      </div>
    )
  }

  const username = currentUser?.username || NOT_AVAILABLE
  const isDeleting = Boolean(deletingId)

  return (
    <div id='conversions-list'>
      <div id='conversions-list-block'>
        {/* aria-busy reports a refresh of a list that already has rows: those
        rows are deliberately left on screen rather than replaced by the loading
        row, so nothing else on the table says a request is running */}
        <table id='conversions-table' aria-busy={loadingConversions}>
          <thead>
            <tr>
              <th colSpan={6}>
                {username} : CURRENCY CONVERSIONS
              </th>
            </tr>
            <tr>
              <th scope='col'>AMOUNT</th>
              <th scope='col'>BASE CURRENCY</th>
              <th scope='col'>TARGET CURRENCY</th>
              <th scope='col'>RATE</th>
              {/* TARGET CURRENCY AMOUNT */}
              <th scope='col'>AMOUNT</th>
              <th scope='col'>VIEW</th>
            </tr>
          </thead>
          <tbody>
            {/* Conditional rendering to tell an empty history apart from a list
            that has not loaded: both are an empty array, and an empty table
            with no message reads as a failure rather than as a user who has
            saved nothing yet. The request in flight is reported first, so
            'NOTHING SAVED' is only ever shown once the answer is actually in. */}
            {loadingConversions && conversions.length === 0 ? (
              <tr>
                <td colSpan={6} className='conversions-list-loading'>
                  LOADING YOUR SAVED CONVERSIONS...
                </td>
              </tr>
            ) : conversions.length === 0 ? (
              <tr>
                <td colSpan={6} className='conversions-list-empty'>
                  NO SAVED CONVERSIONS YET
                </td>
              </tr>
            ) : (
              conversions.map((conversion, index) => {
                /* The two codes are read off the nested `currency` object the
                schema stores them in, and are what every cell in the row is
                labelled and formatted by */
                const baseCurrency = conversion.currency?.baseCurrency
                const targetCurrency = conversion.currency?.targetCurrency
                return (
                  <tr
                    key={conversion._id}
                    className={`${rowClass(index)}${
                      conversion._id === selectedId ? ' selectedRow' : ''
                    }`}
                  >
                    {/* Each amount is named by its own currency, because the
                    two sit side by side and a bare figure would not say which
                    of the pair it is in */}
                    <td>{toMoney(conversion.amount, baseCurrency)}</td>
                    <td>{currencyLabelOf(baseCurrency, currencyOptions)}</td>
                    <td>{currencyLabelOf(targetCurrency, currencyOptions)}</td>
                    {/* The rate alone here: the pair pricing it is already in
                    the two columns beside it, and it is written out in full in
                    the panel. 6 decimals rather than 2, so a weak pair does not
                    read as 0,00. */}
                    <td>{toDecimal(conversion.rate, 6)}</td>
                    <td>{toMoney(convertedAmountOf(conversion), targetCurrency)}</td>
                    <td>
                      {/* A button per row rather than a click handler on the row
                      itself, so the panel can be opened from the keyboard
                      without rebuilding what a button already does */}
                      <Button
                        variant='light'
                        className='viewConversionBtn'
                        type='button'
                        onClick={() => handleSelect(conversion._id)}
                        // ARIA ATTRIBUTES:
                        aria-label={`View the conversion of ${toMoney(conversion.amount, baseCurrency)} to ${targetCurrency || NOT_AVAILABLE}`}
                        aria-pressed={conversion._id === selectedId}
                      >
                        VIEW
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {/* Says the list is only part of the history, so a missing older
        conversion is not read as a lost one */}
        {isTruncated && (
          <p className='infoText' id='conversions-list-truncated'>
            SHOWING THE NEWEST {conversions.length} OF {conversionsTotal} CONVERSIONS
          </p>
        )}
        {/* ========ERROR MESSAGE==================== */}
        {error && (
          <p className='conversions-list-error' role='alert' aria-live='assertive'>
            {error}
          </p>
        )}
        <div id='conversions-list-actions'>
          <Button
            variant='light'
            id='refreshConversionsListBtn'
            type='button'
            onClick={handleRefresh}
            disabled={loadingConversions}
            // ARIA ATTRIBUTES:
            aria-label='Reload your saved conversions'
            aria-disabled={loadingConversions}
          >
            {loadingConversions ? 'LOADING...' : 'REFRESH'}
          </Button>
        </div>
      </div>
      {/* DISPLAY PANAL: panal to display the data for one saved conversion.
      Only rendered once a row has been chosen, so the panel is never on screen
      with nothing in it. */}
      {selectedConversion && (
      <div id='conversion-details-panal' aria-live='polite'>
        <div id='conversionHeader'>
          <Stack direction="horizontal" gap={3} id='detailsHeadStack'>
      <div className="p-2">
        {selectedConversion.currency?.baseCurrency || NOT_AVAILABLE} TO {selectedConversion.currency?.targetCurrency || NOT_AVAILABLE}
      </div>
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
        aria-label='Close the conversion details panel'
        >
          CLOSE
        </Button>
      </div>
    </Stack>
        </div>
        <div>
          {/* DATA PANAL.
          Every figure comes off the stored record rather than being requoted
          here, so a conversion saved at an older rate still reports what it was
          actually worked out at. */}
          <dl id='conversion-panal-data'>
            <div className='conversion-panal-row'>
              <dt>SAVED</dt>
              <dd>{toLongDateTime(selectedConversion.createdAt)}</dd>
            </div>
            <div className='conversion-panal-row'>
              <dt>AMOUNT CONVERTED</dt>
              <dd>{toMoney(selectedConversion.amount, selectedConversion.currency?.baseCurrency)}</dd>
            </div>
            <div className='conversion-panal-row'>
              <dt>CONVERTED FROM</dt>
              <dd>{currencyLabelOf(selectedConversion.currency?.baseCurrency, currencyOptions)}</dd>
            </div>
            <div className='conversion-panal-row'>
              {/* Not something the currencies API reports, so it comes from the
              local country data and is a dash for any code that does not cover */}
              <dt>USED IN</dt>
              <dd>{countriesForCode(selectedConversion.currency?.baseCurrency)}</dd>
            </div>
            <div className='conversion-panal-row'>
              <dt>CONVERTED TO</dt>
              <dd>{currencyLabelOf(selectedConversion.currency?.targetCurrency, currencyOptions)}</dd>
            </div>
            <div className='conversion-panal-row'>
              <dt>USED IN</dt>
              <dd>{countriesForCode(selectedConversion.currency?.targetCurrency)}</dd>
            </div>
            <div className='conversion-panal-row'>
              {/* Written out with the pair it prices, so the figure below it can
              be checked against the amount above rather than taken on trust */}
              <dt>RATE APPLIED</dt>
              <dd>
                {toRate(
                  selectedConversion.rate,
                  selectedConversion.currency?.baseCurrency,
                  selectedConversion.currency?.targetCurrency
                )}
              </dd>
            </div>
            <div className='conversion-panal-row conversion-panal-row--total'>
              <dt>CONVERTED AMOUNT</dt>
              <dd>
                {toMoney(
                  convertedAmountOf(selectedConversion),
                  selectedConversion.currency?.targetCurrency
                )}
              </dd>
            </div>
          </dl>
        </div>
        <div>
          <Stack direction="horizontal" gap={3} id='detailsFooterStack'>
      <div className="p-2">
        {toMoney(convertedAmountOf(selectedConversion), selectedConversion.currency?.targetCurrency)}
      </div>
      <div className="p-2 ms-auto">{toDecimal(selectedConversion.rate, 6)}</div>
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
        aria-label='Delete this conversion from your history'
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
