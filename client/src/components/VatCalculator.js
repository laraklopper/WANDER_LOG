import React, { useCallback, useState } from 'react'
import '../css/componentCss/Calculator.css'
import '../css/componentCss/VatCalculator.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { SARS_VAT_RATE, ZERO_RATED_CATEGORIES  } from '../util/vatFunctions';
import { formatCurrency } from '../util/currencyFunc';



export default function VatCalculator() {
    const [amount, setAmount] = useState('')
    const [mode, setMode] = useState('exclusive')// 'exclusive' (add VAT) | 'inclusive' (remove VAT)
  const [isZeroRated, setIsZeroRated] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

 
 
  // Function to calculate VAT
  const calculateVat = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch ('http://localhost:3001/')
    } catch (error) {
      
    }
  },[])
  // Function to save vat calculation
  const saveVatCalculation = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/vat/save', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(
          amount,

        )
      }
    )
    } catch (error) {
      
    }
  })
  
   const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const handleZeroRatedToggle = (e) => {
    const checked = e.target.checked;
    setIsZeroRated(checked);
  };
  
  return (
    <form
    id='vat-calculator-form'
    // method=''
    // onSubmit={}
    aria-labelledby='calculator-heading'
    >
        <div id='vat-calc-head-block'>
            <h3 id='calculator-heading'>VAT CALCULATOR</h3>
            <i><p className="form-text">
        South African standard rate: {SARS_VAT_RATE * 100}% (SARS)
      </p></i>
        </div>
        <div id='vat-calculator-input'>
            <div id='vat-form-group1'>
                  <Stack gap={3} id='vat-calculator-stack1'>
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
                // name=''
                value={amount}
                onChange={handleAmountChange}
            />
        </div>
      </div>
      <div id='vat-calculator-block2'>
         <label className="vat-calculator-label">Calculation type</label>
         <div id='vat-calc-btn-div'>
            <Button 
                variant='light'
                type='button'
                id='selectModeBtn1'
                 className={`vat-calculator__toggle-btn ${
              mode === 'exclusive' ? 'vat-calculator__toggle-btn--active' : ''
            }`}
                onClick={() => handleModeChange('exclusive')}
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
            onClick={() => handleModeChange('inclusive')}>
                 Remove VAT (incl. → excl.)
            </Button>

         </div>
      </div>
      <div className="p-2" id='vat-calculator-block3'>
        <input
            id='vat-zero-rated'
            type='checkbox'
            className='vat-calculator-checkbox'
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
      {error && <p className="vat-calculator__error">{error}</p>}
      {result && (
        <div>
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
        </div>

      )}
            </div>

        </div>
      
    </form>
  )
}
