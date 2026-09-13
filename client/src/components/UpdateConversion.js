// UpdateConversion
/* Form with readonly converter input for all fields  to check if the
exchange rate is still the same or the target(convert to) currency must be changed. Sends a
 PUT request to the `/api/updateConversion` endpoint*/
import React, { useEffect, useState } from 'react'
import '../css/componentCss/CurrencyConverter.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import { NOT_AVAILABLE, toMoney } from '../util/formatCalculations';
import {
  currencyLabelOf,
  currencyOptionLabel,
  toConvertedAmount,
  toQuotedRate,
  toRate
} from '../util/currencyFunc';

/* The form the conversions list opens on one saved conversion. The requests
themselves live on Budget.js, which owns the list state, and arrive here as
`quoteConversion` and `updateConversion` — the same arrangement
ConversionsList.js keeps for its fetch and its delete.

Two steps, because the point of the form is to compare rather than to overwrite:
CONVERT quotes the conversion at today's rate through GET /api/convert, which
saves nothing, and only once that is on screen beside the rate the record holds
is the update offered. Nothing is written until the user asks for it.

The amount and the base currency are readonly: they are what identifies the
saved conversion, and a different amount or a different starting currency is a
new conversion rather than an update to this one. The target currency is the one
field that can move, because a rate that has gone against the user is answered by
converting into something else. */
export default function UpdateConversion(
  {//PROPS PASSED FROM PARENT COMPONENT (Budget.js)
    conversion,//The conversion being updated(the id the details panel was open on)
    currencyOptions = [],//Offered until GET /api/currencies answers, and kept if it never does.
    quoteConversion,// Quotes an amount and a pair at today's rate. Reads only — GET /api/convert writes nothing to the history
    updateConversion//Sends the conversion to PUT /api/updateConversion/:id and reloads the list.
  }
) {
  // =========STATE VARIABLES=============
  /* The chosen target currency, blank while the conversion is left on the one it
  is stored with. Blank rather than opened on the stored code, so the select says
  what would change rather than repeating what is already saved — the same way
  every field on the edit expense form opens */
  const [targetCurrency, setTargetCurrency] = useState('')
  // Today's quote for the conversion, as GET /api/convert returned it
  const [quote, setQuote] = useState(null)
  const [checking, setChecking] = useState(false)// Whether the quote request is in flight
  const [formError, setFormError] = useState('')// Form level error, shown under the buttons
  const [saveStatus, setSaveStatus] = useState(null)// null | 'saving' | 'saved' | 'error'
  const [saveError, setSaveError] = useState('')

  //========== WHAT THE CONVERSION CURRENTLY HOLDS ====================
  const conversionId = conversion?._id || ''
  const storedAmount = conversion?.amount
  const storedBase = conversion?.currency?.baseCurrency || ''
  const storedTarget = conversion?.currency?.targetCurrency || ''
  const storedRate = conversion?.rate

  /* The currency the conversion would end up in: the stored one until the select
  names another. This is the pair the quote is fetched for and the code the
  update is sent with */
  const selectedTarget = targetCurrency || storedTarget
  // Whether the conversion is being moved onto a different currency
  const targetChanged = Boolean(selectedTarget) && selectedTarget !== storedTarget

  /* Whether today's quote differs from the rate the record holds. Only asked of
  a quote for the stored pair: a quote for a currency the user has just chosen
  prices something else, so there is no rate of its own to have moved */
  const rateMoved = Boolean(quote) && !targetChanged
    && Number(quote.rate) !== Number(storedRate)

  /* Whether there is anything to write. A quote that came back identical on the
  currency it was already stored against is reported rather than saved, because
  the update would replace the record with exactly what it holds */
  const hasUpdate = Boolean(quote) && (targetChanged || rateMoved)

  /* Bootstrap variant for the save button, so its colour reports the outcome of
  the update rather than staying neutral once it is disabled. The same treatment
  the converter's own save button is given */
  const saveButtonVariant =
    saveStatus === 'saved' ? 'success' : saveStatus === 'error' ? 'danger' : 'light';

  /* Cleared whenever the form moves to another conversion, so a quote fetched
  for one saved conversion is never left on screen above another, and a target
  chosen for it is not carried over. Keyed on the id rather than the record,
  which is replaced by every refetch of the list */
  useEffect(() => {
    setTargetCurrency('')
    setQuote(null)
    setFormError('')
    setSaveStatus(null)
    setSaveError('')
  },[conversionId])

  //===========EVENT LISTENERS===============
  /* Chooses the currency to convert into. The quote goes with it: it was fetched
  for the pair that was selected at the time, and leaving it up would price this
  conversion at another currency's rate */
  const handleTargetChange = (event) => {
    setTargetCurrency(event.target.value)
    setQuote(null)
    setFormError('')
    setSaveStatus(null)
    setSaveError('')
  }

  /* Quotes the conversion at today's rate. Nothing is saved here — the figure
  that comes back is only compared against the one the record holds, and is
  written by handleSave below once the user asks for it */
  const handleCheck = async (event) => {
    event.preventDefault()
    if (checking) return;// A quote is already running

    // Conditional rendering to check the form is open on a conversion
    if (!conversionId || !storedBase || !selectedTarget) {
      setFormError('No conversion is open for updating.')
      console.warn('[WARN: UpdateConversion.js] No conversion open, cannot check the rate');
      return;
    }

    setChecking(true)
    setFormError('')
    setQuote(null)
    setSaveStatus(null)
    setSaveError('')
    try {
      const data = await quoteConversion({
        amount: storedAmount,
        from: storedBase,
        to: selectedTarget,
      })
      setQuote(data)
    } catch (error) {
      setFormError(error?.message || 'Could not check the exchange rate. Please try again.')
    } finally {
      /* Cleared in a finally, so a failed or rejected request leaves the button
      usable rather than stuck on 'CHECKING...' */
      setChecking(false)
    }
  }

  /* Writes the conversion back through PUT /api/updateConversion/:id. The whole
  conversion is sent, because the route is a replacement, but the rate is not:
  the API fetches that itself, so the stored record always holds a rate the
  provider actually quoted rather than one this form carried over */
  const handleSave = async () => {
    if (!hasUpdate || !updateConversion) return;// Nothing to write, or no handler was supplied
    if (saveStatus === 'saving') return;// An update is already running

    setSaveStatus('saving')
    setSaveError('')
    try {
      await updateConversion(conversionId, {
        amount: storedAmount,
        from: storedBase,
        to: selectedTarget,
      })
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
      setSaveError(error?.message || 'Could not update the conversion. Please try again.')
    }
  }

  //=================JSX RENDERING================
  /* The form is opened from a conversion's details panel, so there is nothing to
  update without one and every field would be blank */
  if (!conversionId) {
    return (
      <div id='updateConversionEmpty'>
        <p className='infoText'>Open a saved conversion and press EDIT CONVERSION to update it.</p>
      </div>
    )
  }

  const isSaving = saveStatus === 'saving'

  return (
    <form id='currency-converter-form' method='GET' onSubmit={handleCheck} aria-busy={checking} aria-describedby='formDescrip'>
        <div id='formHeaderBlock'>
            <Stack gap={3} id='formHeadingStack' >
      <div className="p-2 visually-hidden" >
        <p id='formDescrip'>Form to check if exchange Rate is the same and update the conversion</p>
      </div>
      <div className="p-2" id='formHeadingBlock'>
        <h3 id='formHeading'>UPDATE CONVERSION</h3>
      </div>
      <div className="p-2" id='editConvertMsgBlock'>
        <p className='editConverterMsg'>Compare and update currency conversion</p>
      </div>
    </Stack>
        </div>
        {/* ========INPUT=================== */}
        <div id='currency-converter-details'>
        {/* STACK 1 */}
            <Stack gap={3} id='converterStack1'>
      <div className="p-2" id='convert-amount-block'>
      {/* THE AMOUNT AS SAVED. value={toMoney(storedAmount, storedBase)}
      Readonly: the amount is what identifies this conversion, and converting a different one is a new conversion  */}
        <label className='converter-label' htmlFor='updateConvertAmount'>AMOUNT:</label>
        <div className='input-div'>
            <input
                className='input'
                id='updateConvertAmount'
                readOnly
                name='amount'
                value={toMoney(storedAmount, storedBase)}
                // ARIA ATTRIBUTES:
                aria-required='true'
                aria-readonly='true'
                aria-label='The amount this conversion was saved for'
            />
             <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      {/* BASE CURRENCY: CONVERT FROM. Readonly value={currencyLabelOf(storedBase, currencyOptions)}*/}
      <div className="p-2" id='convert-baseCurrency-block'>
        <label className='converter-label' htmlFor='updateConvertFrom'>CONVERT FROM:</label>
        <div className='input-div'>
            <input
                className='input'
                id='updateConvertFrom'
                readOnly
                name='from'
                value={currencyLabelOf(storedBase, currencyOptions)}
                // ARIA ATTRIBUTES:
                aria-required='true'
                aria-readonly='true'
                aria-label='The currency this conversion is made from'
            />
              <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      {/* TARGET CURRENCY: CONVERT TO: value={targetCurrency}*/}
      <div className="p-2" id='convert-TargetCurrency-block'>
        <label className='converter-label' htmlFor='updateConvertTo'>CONVERT TO:</label>
        <div className='input-div'>
        <select
            className='input'
            id='updateConvertTo'
            name='to'
            value={targetCurrency}
            onChange={handleTargetChange}
            disabled={checking || isSaving}
            // ARIA ATTRIBUTES
            aria-required='true'
            aria-label='The currency to convert into'
            aria-disabled={checking || isSaving}
        >
            {/* Keeps the conversion on the currency it is saved with, which is
            what the form opens on */}
            <option value=''>KEEP {storedTarget || NOT_AVAILABLE}</option>
            {/* MAP EVERY OTHER AVAILABLE CURRENCY. The stored one is left out,
            because the option above already keeps it */}
            {currencyOptions
              .filter(({ code }) => code !== storedTarget)
              .map(({ code, name }) => (
                <option key={code} value={code}>{currencyOptionLabel(code, name)}</option>
            ))}
        </select>
        <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
        {/* Says which currency the conversion would be left in, so a chosen
        code is read against the one that is saved rather than on its own */}
        <p className='infoText' aria-live='polite'>
            <small>SAVED AS {currencyLabelOf(storedTarget, currencyOptions)}</small>
        </p>
      </div>
    </Stack>
        </div>
        {/* END OF INPUT */}
        {/* STACK 2 */}
<Stack gap={3} id='converter-stack2'>
<div className="p-2" id='requiredInfo'>
        <p className='infoText' aria-live='polite' aria-hidden='true'>
            <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /> Indicates required information</small>
        </p>
    </div>
      <div className="p-2" id='converter-btn-block1'>
        <Button
        variant='light'
        id='convertCurrencyBtn'
        type='submit'
        disabled={checking || isSaving}
        // ARIA ATTRIBUTES
        aria-label={checking ? 'CHECKING THE RATE...' : 'Convert at today’s rate'}
        aria-disabled={checking || isSaving}
        >
            {checking ? 'CHECKING...' : 'CONVERT'}
        </Button>
      </div>
      {/* RESULT  BLOCK.
      Today's quote beside the rate the record holds, so the two can be compared
      before anything is written. Only rendered once a quote is on screen, so the
      block is never up with nothing in it */}
      <div className="p-2" id='converterResultBlock' aria-live='polite'>
        {quote && (
          <>
            <p className='infoText'>
                {quote.amount} {quote.from} = {toConvertedAmount(quote.result)} {quote.to}
            </p>
            {/* Absent on a conversion between a currency and itself, which the
            API answers at a rate of 1 without pricing anything */}
            {quote.date && (
              <p className='infoText'>
                    TODAY: 1 {quote.from} = {toQuotedRate(quote.rate)} {quote.to} (rate of {quote.date})
                </p>
            )}
            {/* What the record holds, written out with the pair it prices, so
            the figure above can be checked against it rather than taken on trust */}
            <p className='infoText'>
                SAVED: {toRate(storedRate, storedBase, storedTarget)}
            </p>
            {/* Says what the update would actually do: move the conversion onto
            another currency, write a rate that has shifted, or nothing at all */}
            <p className='infoText'>
              {targetChanged
                ? `This conversion would be saved as ${storedBase} to ${selectedTarget} at today’s rate.`
                : rateMoved
                ? 'The exchange rate has changed. Save the conversion to store today’s rate.'
                : 'The exchange rate has not changed, so there is nothing to update.'}
            </p>
            {/* BUTTON TO SAVE THE UPDATED CONVERSION.
            Only rendered once there is something to write, and disabled while
            the request is running or after it has succeeded, so the same update
            cannot be sent twice */}
            {hasUpdate && updateConversion && (
              <>
                <Button
                  id='saveConversionBtn'
                  onClick={handleSave}
                  type='button'
                  variant={saveButtonVariant}
                  disabled={isSaving || saveStatus === 'saved'}
                  // ARIA ATTRIBUTES:
                  aria-label='Save this conversion at today’s rate'
                  aria-disabled={isSaving || saveStatus === 'saved'}
                >
                  {isSaving
                    ? 'SAVING...'
                    : saveStatus === 'saved'
                    ? 'CONVERSION UPDATED'
                    : 'SAVE UPDATED CONVERSION'}
                </Button>
                {/* Only shown when the update itself failed; the saved
                conversion is unaffected and the button can be pressed again */}
                {saveStatus === 'error' && (
                  <p className='infoText' style={{ color: '#C22419' }} role='alert'>{saveError}</p>
                )}
              </>
            )}
          </>
        )}
      </div>
      {/* ERROR MESSAGE */}
      {formError && (
        <p className='infoText' style={{ color: '#C22419' }} role='alert' aria-live='assertive'>{formError}</p>
      )}
    </Stack>
    </form>
  )
}


