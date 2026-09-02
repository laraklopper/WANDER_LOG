import React from 'react'
import '../css/componentCss/Calculator.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';

const SARS_VAT_RATE = 0.15;

export default function VatCalculator() {
  return (
    <form
    id='vat-calculator'
    >
        <div id='vat-calc-head-block'>
            <h3 id='calculator-heading'>VAT CALCULATOR</h3>
            <p className="form-text">
        South African standard rate: {SARS_VAT_RATE * 100}% (SARS)
      </p>
        </div>
        <div id='vat-calculator-input'>
            <div id='vat-form-group1'>
                  <Stack gap={3}>
      <div className="p-2">
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
                // value={}
                // onChange={}
            />
        </div>
      </div>
      <div className="p-2">
         <label className="vat-calculator-label">Calculation type</label>
         <div id='vat-calc-btn-div'>
            <Button 
                variant='light'
                type='button'
                id='selectModeBtn1'
                // className=''
                // onClick={}
                >
                    Add VAT (excl. → incl.)
                </Button>

         </div>
      </div>
      <div className="p-2">Third item</div>
    </Stack>

            </div>

        </div>
    </form>
  )
}
