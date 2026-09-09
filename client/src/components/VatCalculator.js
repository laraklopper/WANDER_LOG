import React, { useCallback, useState } from 'react'
import '../css/componentCss/Calculator.css'
import '../css/componentCss/VatCalculator.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import {
  SARS_VAT_RATE,
  DEFAULT_VAT_RATE_PERCENT,
  MAX_VAT_RATE_PERCENT,
  ZERO_RATED_CATEGORIES,
  toVatModeLabel,
} from '../util/vatFunctions';
import { formatCurrency } from '../util/currencyFunc';



export default function VatCalculator() {
  // =========STATE VARIABLES=============
    const [amount, setAmount] = useState('')
    const [mode, setMode] = useState('exclusive')// 'exclusive' (add VAT) | 'inclusive' (remove VAT)
  const [ratePercent, setRatePercent] = useState(String(DEFAULT_VAT_RATE_PERCENT));
  const [isZeroRated, setIsZeroRated] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState('');

  /* Which of the two number fields the message on screen is about, so only the
  field actually at fault is marked invalid and reddened rather than both. */
  const rateHasError = error.startsWith('VAT rate');

  /* Bootstrap variant for the save button, so its colour reports the outcome of
  the save rather than staying neutral once it is disabled. */
  const saveButtonVariant =
    saveStatus === 'saved' ? 'success' : saveStatus === 'error' ? 'danger' : 'light';
  // Disabled while the request is running and after it has succeeded, so the
  // same calculation cannot be written to the history twice
  const saveDisabled = saveStatus === 'saving' || saveStatus === 'saved';

  /* Clears the save button back to its unsaved state. Called whenever the
  result on screen is replaced, so a 'Saved' label can never be left over from a
  previous calculation. */
  const resetSaveStatus = () => {
    setSaveStatus(null);
    setSaveError('');
  };

  // Function to calculate VAT
  /* The arithmetic is done by the server rather than repeated here, so the
  figures on screen are worked out by the same vatCalculations.js that a saved
  record is built from and the two can never disagree. */
  const calculateVat = useCallback(async () => {
    setError('')
    setResult(null)

    // Conditional rendering to check an amount was typed before asking the server
    if (amount === '') {
      setError('Please enter an amount.');
      return;
    }

    /* Checked here as well as on the server: the number input allows a typed
    minus sign, and a negative amount is not an amount of money */
    if (isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      setError('Amount must be a positive number.');
      return;
    }

    /* Checked here as well as on the server. A zero-rated item is levied at nil
    whatever the field says, so the rate is only validated when it will actually
    be used - an empty field is allowed either way and falls back to the
    standard rate. */
    if (!isZeroRated && ratePercent !== '') {
      const parsedRate = parseFloat(ratePercent);
      if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > MAX_VAT_RATE_PERCENT) {
        setError(`VAT rate must be a number between 0 and ${MAX_VAT_RATE_PERCENT}.`);
        return;
      }
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch ('http://localhost:3001/vat/calculate', {
        method: 'POST',//HTTP request method
        mode: 'cors',//Enable Cross-Origin Resource Sharing
        headers: {
          'Content-Type': 'application/json',// Specify that we're sending JSON data in the request body
          'Authorization': `Bearer ${token}`// Attach the token in the Authorization header
        },
        body: JSON.stringify({// Send the calculation's inputs in the request body as JSON
          amount,
          mode,
          isZeroRated,
          ratePercent,// Sent as typed; empty falls back to the SARS standard rate server-side
        })
      })

      const data = await response.json().catch(() => ({}))//Parse the response as json

      //Conditional rendering to check the request succeeded
      if (!response.ok) {
        const message = data.message || 'Calculation failed.';
        console.error('[ERROR: VatCalculator.js, calculateVat]', message);//Log an error message in the console for debugging purposes
        setError(message);// Set the error state to display the error in the UI
        return;
      }

      setResult(data.calculation);
      console.log('[SUCCESS: VatCalculator.js, calculateVat] Calculated', mode, 'VAT on', amount, 'at', data.calculation?.ratePercent + '%');
    } catch (error) {
      console.error('[ERROR: VatCalculator.js, calculateVat]', error.message);//Log an error message in the console for debugging purposes
      setError('Failed to calculate the VAT. Please try again.');//Set the error state to display a message in the UI
    } finally {
      setLoading(false)
    }
  },[amount, mode, isZeroRated, ratePercent])

  // Function to save vat calculation
  /* Only the inputs are sent, and they are taken from the RESULT rather than
  from the form, so the rate saved is the one the figures on screen were worked
  out at even if the field has since been retyped. The server recalculates from
  them, so the figures cannot be edited on the way to the database, and the
  record it returns is what was actually stored. Throws on failure so the button
  that called it can report the outcome. */
  const saveVatCalculation = useCallback(async (calculation) => {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/vat/save', {
        method: 'POST',//HTTP request method
        mode: 'cors',//Enable Cross-Origin Resource Sharing
        headers: {
          'Content-Type': 'application/json',// Specify that we're sending JSON data in the request body
          'Authorization': `Bearer ${token}`// Attach the token in the Authorization header
        },
        body: JSON.stringify({// Send the calculation's inputs in the request body as JSON
          amount: calculation.enteredAmount,
          mode: calculation.mode,
          isZeroRated: calculation.isZeroRated,
          ratePercent: calculation.ratePercent,
        })
      })

      const data = await response.json().catch(() => ({}))//Parse the response as json

      //Conditional rendering to check the request succeeded
      if (!response.ok) {
        const message = data.message || 'Could not save the calculation. Please try again.';
        console.error('[ERROR: VatCalculator.js, saveVatCalculation]', message);//Log an error message in the console for debugging purposes
        throw new Error(message);
      }

      console.log('[SUCCESS: VatCalculator.js, saveVatCalculation] Saved VAT calculation');
      return data;
  },[])

  //===========EVENT LISTENERS===============
   const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    /* The result on screen was worked out from the old inputs, so it is cleared
    rather than left to be read against figures that have moved on */
    setResult(null);
    setError('');
    resetSaveStatus();
  };

  /* The rate is taken as typed rather than coerced here, so the field can be
  cleared and retyped. It is validated when the calculation is asked for, and an
  empty field falls back to the SARS standard rate. */
  const handleRateChange = (e) => {
    setRatePercent(e.target.value);
    setResult(null);
    setError('');
    resetSaveStatus();
  };

  // Puts the rate field back to the SARS standard rate the form loads with
  const resetRate = () => {
    setRatePercent(String(DEFAULT_VAT_RATE_PERCENT));
    setResult(null);
    setError('');
    resetSaveStatus();
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setResult(null);
    setError('');
    resetSaveStatus();
  };

  const handleZeroRatedToggle = (e) => {
    const checked = e.target.checked;
    setIsZeroRated(checked);
    setResult(null);
    setError('');
    resetSaveStatus();
  };

  // Submitting the form calculates; the page is not reloaded to do it
  const handleCalculate = (event) => {
    event.preventDefault();
    resetSaveStatus();
    calculateVat();
  };

  // Returns the form to the state it loads in
  const clearForm = () => {
    setAmount('');
    setMode('exclusive');
    setRatePercent(String(DEFAULT_VAT_RATE_PERCENT));// Back to the SARS standard rate, not to an empty field
    setIsZeroRated(false);
    setResult(null);
    setError('');
    resetSaveStatus();
  };

  /* Function to save the displayed calculation to the user's history. The
  result is passed straight through, so the record is built from the figures on
  screen rather than from the inputs, which may have moved on. */
  const handleSave = async () => {
    if (!result) return;// Nothing on screen to save
    setSaveStatus('saving');
    setSaveError('');
    try {
      await saveVatCalculation(result);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err?.message || 'Could not save the calculation. Please try again.');
    }
  };

  //=================JSX RENDERING================
  return (
    <form
    id='vat-calculator-form'
    method='POST'
    onSubmit={handleCalculate}
    aria-busy={loading}
    aria-labelledby='calculator-heading'
    >
        <div id='vat-calc-head-block'>
            <h3 id='calculator-heading'>VAT CALCULATOR</h3>
          
        </div>
        <div id='vat-calculator-input'>
            <div id='vat-form-group1'>
                  <Stack gap={3} id='vat-calculator-stack1'>
                  <div className='p-2' id='vat-percentage-block'>
                      <i><p className="form-text">
        South African standard rate: {SARS_VAT_RATE * 100}% (SARS)
      </p></i>
      {/* The rate the calculation runs at. Loads at the SARS standard rate,
      which is what most users want, but is editable rather than fixed: a
      traveller buys in more than one country and VAT is not 15% everywhere.
      Disabled while zero-rated is ticked, because a zero-rated supply is
      levied at nil whatever is typed here. */}
      <div id='vatPercentageDiv'>
        <label className="vat-calculator-label" htmlFor='vat-rate'>PERCENTAGE:</label>
        <input
          id='vat-rate'
          type='number'
          className='input'
          min='0'
          max={MAX_VAT_RATE_PERCENT}
          step='0.01'
          name='ratePercent'
          placeholder={String(DEFAULT_VAT_RATE_PERCENT)}//Falls back to 15% when left empty
          value={ratePercent}
          onChange={handleRateChange}
          disabled={isZeroRated}
          // ARIA ATTRIBUTES:
          aria-invalid={rateHasError}
          aria-describedby='vat-rate-hint'
          aria-disabled={isZeroRated}
        />
        {/* Only offered once the rate has been moved off the standard one, so
        it is a way back rather than a button that does nothing */}
        {!isZeroRated && ratePercent !== String(DEFAULT_VAT_RATE_PERCENT) && (
          <Button
            variant='link'
            type='button'
            size='sm'
            id='resetVatRateBtn'
            onClick={resetRate}
            // ARIA ATTRIBUTES:
            aria-label={`Reset the VAT rate to ${DEFAULT_VAT_RATE_PERCENT}%`}
          >
            Use {DEFAULT_VAT_RATE_PERCENT}%
          </Button>
        )}
      </div>
      {/* Says which rate the amount will actually be worked out at, which the
      field alone does not when it is empty or overridden by zero-rating */}
      <p className='vat-calculator-hint' id='vat-rate-hint'>
        {isZeroRated
          ? 'Zero-rated: VAT is worked out at 0%, whatever rate is entered.'
          : ratePercent === ''
          ? `Left empty, VAT is worked out at the standard ${DEFAULT_VAT_RATE_PERCENT}%.`
          : `VAT is worked out at ${ratePercent}%. Any rate from 0 to ${MAX_VAT_RATE_PERCENT}% can be entered.`}
      </p>
                  </div>
      <div className="p-2" id='vat-calculator-block1'>
          <label className="vat-calculator-label" htmlFor="vat-amount">
          Amount (ZAR)
        </label>
        <div>
            <input
                id='vat-amount'
                type='number'
                className='input'
                min="0"
                step="0.01"
                placeholder='0.00'
                required
                name='amount'
                value={amount}
                onChange={handleAmountChange}
                // ARIA ATTRIBUTES:
                aria-required='true'
                aria-invalid={Boolean(error) && !rateHasError}
                aria-describedby='vat-mode-hint'
            />
        </div>
      </div>
      <div id='vat-calculator-block2'>
         <label className="vat-calculator-label">Calculation type</label>
         {/* The two directions the calculation can run in. A pair of buttons
         rather than a select, so both options are readable at once; the pressed
         one is announced through aria-pressed and marked by the active class. */}
         <div id='vat-calc-btn-div' role='group' aria-label='Calculation type'>
            <Button
                variant='light'
                type='button'
                id='selectModeBtn1'
                 className={`vat-calculator__toggle-btn ${
              mode === 'exclusive' ? 'vat-calculator__toggle-btn--active' : ''
            }`}
                onClick={() => handleModeChange('exclusive')}
                // ARIA ATTRIBUTES:
                aria-pressed={mode === 'exclusive'}
                >
                    Add VAT (excl. → incl.)
                </Button>
                <Button
                variant='light'
                type='button'
                id='selectModeBtn2'
                 className={`vat-calculator__toggle-btn ${
              mode === 'inclusive' ? 'vat-calculator__toggle-btn--active' : ''
            }`}
            onClick={() => handleModeChange('inclusive')}
            // ARIA ATTRIBUTES:
            aria-pressed={mode === 'inclusive'}>
                 Remove VAT (incl. → excl.)
            </Button>

         </div>
         {/* Says what the amount above will be read as, which is the one thing
         the two buttons do not make obvious until a result appears */}
         <p className='vat-calculator-hint' id='vat-mode-hint'>
          {mode === 'exclusive'
            ? 'The amount entered is the price BEFORE VAT.'
            : 'The amount entered is the price AFTER VAT.'}
         </p>
      </div>
      <div className="p-2" id='vat-calculator-block3'>
        <input
            id='vat-zero-rated'
            type='checkbox'
            className='vat-calculator-checkbox'
            name='isZeroRated'
            checked={isZeroRated}
            onChange={handleZeroRatedToggle}
        />
         <label htmlFor="vat-zero-rated" className="vat-calculator-label">
          This item is zero-rated (0%)
        </label>
      </div>
    </Stack>

            </div>
            <div>
                {isZeroRated && (
        <p className="vat-calculator-hint">
          Common zero-rated items: {ZERO_RATED_CATEGORIES.slice(0, 6).join(', ')}, and more.
        </p>
      )}
      {/* ========BUTTONS==================== */}
      <Stack gap={3} id='vat-calculator-stack2'>
        <div className='p-2' id='vat-calc-btn-block1'>
          <Button
            variant='light'
            type='submit'
            id='calculateVatBtn'
            disabled={loading}
            // ARIA ATTRIBUTES:
            aria-label={loading ? 'CALCULATING...' : 'CALCULATE VAT'}
            aria-disabled={loading}
          >
            {loading ? 'CALCULATING...' : 'CALCULATE VAT'}
          </Button>
        </div>
        <div className='p-2' id='vat-calc-btn-block2'>
          <Button
            variant='danger'
            type='button'
            id='clearVatFormBtn'
            onClick={clearForm}
            disabled={loading}
            // ARIA ATTRIBUTES:
            aria-label='Clear VAT calculator form'
            aria-disabled={loading}
          >
            CLEAR
          </Button>
        </div>
      </Stack>
      {/* ========ERROR MESSAGE==================== */}
      {error && <p className="vat-calculator__error" role='alert' aria-live='assertive'>{error}</p>}
      {/* ========CALCULATION RESULT==================== */}
      <div id='vat-calculator-results' aria-live='polite'>
      {result && (
        <div>
            {/* Which direction the figures below were worked out in, so the
            result still reads correctly once the buttons scroll out of view */}
            <p className='vat-calculator-hint'>
              {toVatModeLabel(result.mode)} at {result.ratePercent}%
              {result.isZeroRated ? ' (ZERO-RATED)' : ''}
            </p>
             <div className="vat-calculator__result-row">
            <span>Amount excl. VAT</span>
            <span>{formatCurrency(result.netAmount)}</span>
          </div>
          <div className="vat-calculator__result-row">
            <span>VAT ({result.ratePercent}%)</span>
            <span>{formatCurrency(result.vatAmount)}</span>
          </div>
          <div className="vat-calculator__result-row vat-calculator__result-row--total">
            <span>Amount incl. VAT</span>
            <span>{formatCurrency(result.grossAmount)}</span>
          </div>
          {/* BUTTON TO SAVE THE VAT CALCULATION.
          Only rendered once a result is on screen, and disabled while the
          request is running or after it has succeeded, so the same calculation
          cannot be written to the history twice. */}
          <div className='p-2' id='vat-calc-btn-block3'>
            <Button
              id='saveVatCalculationBtn'
              type='button'
              variant={saveButtonVariant}
              onClick={handleSave}
              disabled={saveDisabled}
              // ARIA ATTRIBUTES:
              aria-label='Save this VAT calculation to your history'
              aria-disabled={saveDisabled}
            >
              {saveStatus === 'saving'
                ? 'SAVING...'
                : saveStatus === 'saved'
                ? 'SAVED TO HISTORY'
                : 'SAVE CALCULATION'}
            </Button>
          </div>
          {/* Only shown when the save itself failed; the calculation is unaffected */}
          {saveStatus === 'error' && (
            <p className='vat-calculator__error' role='alert'>{saveError}</p>
          )}
        </div>

      )}
      </div>
            </div>

        </div>

    </form>
  )
}
