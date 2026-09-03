import React, { useState } from 'react'
import '../css/componentCss/CurrencyConverter.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
//IMPORT REACT-ROUTER-DOM COMPENTS
import { Asterisk } from 'lucide-react';
import { currencyOptionLabel, toConvertedAmount, toQuotedRate } from '../util/currencyFunc';

export default function CurrencyConverter(
  {
    convert,
    EMPTY_CONVERT_FORM,
    saveConversions,
    currencyOptions = [],
    loading,
    setLoading, 
    error,
    setError,
    result,
    setResult,
    form,
    setForm
  }
) {
  const [saveStatus, setSaveStatus] = useState(null)
  const [saveError, setSaveError] = useState('')

   /* Bootstrap variant for the save button, so its colour reports the
        outcome of the save rather than staying neutral once it is disabled. */
        const saveButtonVariant =
            saveStatus === 'saved' ? 'success' : saveStatus === 'error' ? 'danger' : 'light';

             //===========EVENT LISTENERS===============
    /* Clears the save button back to its unsaved state. Called whenever the
    result on screen is replaced, so a 'Saved' label can never be left over from
    a previous conversion. */
    const resetSaveStatus = () => {
        setSaveStatus(null);
        setSaveError('');
    };
  const handleChange = (event) => {
    const {name, value} = event.target
    setForm(prev => ({...prev, [name]: value}))
    setResult(null)
    setError('')
    resetSaveStatus()
  }
  const clearForm = () => {
    setForm(EMPTY_CONVERT_FORM)
    setResult(null)

    setError('')
    resetSaveStatus()
  }
  const handleConvert = (event) => {
    event.preventDefault()
    resetSaveStatus()
    convert()
  }

   /* Function to save the displayed conversion to the user's history. The
    result is passed straight through, so the record is built from the figures
    on screen rather than from the inputs, which may have moved on. */
    const handleSave = async () => {
        if (!result || !saveConversions) return;// Nothing to save, or the page did not supply a handler
        setSaveStatus('saving');
        setSaveError('');
        try {
            await saveConversions({ amount: result.amount, from: result.from, to: result.to });
            setSaveStatus('saved');
        } catch (err) {
            setSaveStatus('error');
            setSaveError(err?.message || 'Could not save the conversion. Please try again.');
        }
    };

    //=================JSX RENDERING================
  return (
    <form id='currency-converter-form' method='GET' onSubmit={handleConvert} aria-busy={loading} aria-labelledby='formHeading'>
        <div  id='formHeadingBlock'>
            <h3 id='formHeading'>Currency Converter</h3>
        </div>
        <div id='currency-converter-details'>
            <Stack  gap={3} id='converterStack1'>
            <div className='p-2 visually-hidden' id='converter-username-block'>
            {/* CURRENT USER USERNAME
            required to save conversion calculations
             */}
              <label className='converter-label' htmlFor='converterUsername'>USERNAME:</label>
              <div className='input-div'>
                <input
                  className='input'
                  id='converterUsername'
                  placeholder='USERNAME'//currentUser.username
                  readOnly
                  // name=''
                  // value={}
                  // ARIA ATTRIBUTES
                  aria-required='true'
                  aria-readonly='true'
                  aria-label='Current User Username'
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
            </div>
      <div className="p-2" id='convert-amount-block'>
      {/* CONVERTER AMOUNT */}
        <label className='converter-label' htmlFor='converterAmount'>AMOUNT:</label>
        <div className='input-div'>
            <input
                type='number'
                id='converterAmount'
                placeholder='0.00'
                required
                className='input'
                step='0.01'
                min='0.01'
                name='amount'
                value={form.amount}
                onChange={handleChange}
                // ARIA ATTRIBUTES:
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      {/* BASE CURRENCY: CONVERT FROM */}
      <div className="p-2" id='convert-baseCurrency-block'>
        <label className='converter-label'>CONVERT FROM:</label>
        <div className='input-div'>
            <select
            className='input'
            id='convertFrom'
            required
            name='from'
            value={form.from}
            onChange={handleChange}
            >
                  <option value=''>SELECT</option>
                    {/* MAP ALL AVAILABLE CURRENCIES WITH SELECT AS THE PLACEHOLDER */}
                    {currencyOptions.map(({ code, name }) => (
                        <option key={code} value={code}>{currencyOptionLabel(code, name)}</option>
                    ))}
               
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      {/* TARGET CURRENCY: CONVERT TP */}
      <div className="p-2" id='convert-TargetCurrency-block'>
        <label className='converter-label'>CONVERT TO:</label>
        <div className='input-div'>
            <select
            className='input'
            id='targetCurrencySelect'
            required
            name='to'
            value={form.to}
            onChange={handleChange}
            >
             <option value=''>SELECT</option>
              {/* MAP ALL AVAILABLE CURRENCIES WITH SELECT AS THE PLACEHOLDER */}
                  {currencyOptions.map(({ code, name }) => (
                      <option key={code} value={code}>{currencyOptionLabel(code, name)}</option>
                  ))}
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
    </Stack>
    </div>
    <Stack  gap={3} id='converter-stack2'>
    <div className="p-2" id='requiredInfo'>
        <p className='infoText' aria-live='polite' aria-hidden='true'>
            <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /> Indicates required information</small>
        </p>
    </div>
      <div id='converter-btn-block1'>
      <Button 
      variant='light' 
      type='submit' 
      id='convertCurrencyBtn'
      disabled={loading}
      // ARIA ATTRIBUTES:
      role='button'
      aria-label={loading ? 'CONVERTING...': 'CONVERT'}
      aria-disabled={loading}
      >
        {loading ? 'CONVERTING...': 'CONVERT'}
      </Button></div>
      <div id='converter-btn-block2'>
        <Button 
        variant='danger' 
        id='clearFormBtn'
        type='button'
        onClick={clearForm}
        disabled={loading}
        aria-label='Clear currency converter form'
        aria-disabled={loading}
        >CLEAR</Button>
      </div>
      {/* CONVERTER RESULT */}
      <div className="p-2" id='converterResultBlock' aria-live='polite'>
        {result && (
          <>
            <p className='infoText'>
                {result.amount} {result.from} = {toConvertedAmount(result.result)} {result.to}
            </p>
            {result.date && (
              <p className='infoText'>
                    1 {result.from} = {toQuotedRate(result.rate)} {result.to} (rate of {result.date})
                </p>
            )}
             {/* BUTTON TO SAVE CURRENCY CONVERTER CALCULATION.
            Only rendered once a conversion is on screen, and disabled while the
            request is running or after it has succeeded, so the same conversion
            cannot be written to the history twice. */}
            {saveConversions && (
              <>
                <Button
                  id='saveConversionBtn'
                  onClick={handleSave}
                  type='button'
                  variant={saveButtonVariant}
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                // ARIA ATTRIBUTES:
                aria-label='Save this conversion to your history'
                aria-disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                  >
              {saveStatus === 'saving'
                    ? 'SAVING...'
                    : saveStatus === 'saved'
                    ? 'SAVED TO HISTORY'
                    : 'SAVE CALCULATION'}
                  </Button>
                   {/* Only shown when the save itself failed; the conversion is unaffected */}
                {saveStatus === 'error' && (
                    <p className='infoText' style={{ color: '#C22419' }} role='alert'>{saveError}</p>
                )}
              </>
            )}
          </>
        )}
      </div>
       {/* ========ERROR MESSAGE==================== */}
        {error && (
            <p className='infoText' style={{ color: '#C22419' }} role='alert' aria-live='assertive'>{error}</p>
        )}
    </Stack>
            
        
    </form>
  )
}
