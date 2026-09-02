import React from 'react'
import '../css/componentCss/CurrencyConverter.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
//IMPORT REACT-ROUTER-DOM COMPENTS
import { Asterisk } from 'lucide-react';

export default function CurrencyConverter(
  {
    convert,
    EMPTY_CONVERT_FORM,
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

  return (
    <form id='currency-converter-form' method='GET' aria-labelledby='formHeading'>
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
                // name=''
                // value={}
                // onChange={}
                // ARIA ATTRIBUTES:
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2" id='convert-baseCurrency-block'>
        <label className='converter-label'>CONVERT FROM:</label>
        <div className='input-div'>
            <select
            className='input'
            // name=''
            // value={}
            // onChange={}
            >
            {/* MAP ALL AVAILABLE CURRENCIES WITH SELECT AS THE PLACEHOLDER */}
                <option>SELECT</option>
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2" id='convert-TargetCurrency-block'>
        <label className='converter-label'>CONVERT TO:</label>
        <div className='input-div'>
            <select
            className='input'
            // name=''
            // value={}
            >
            {/* MAP ALL AVAILABLE CURRENCIES WITH SELECT AS THE PLACEHOLDER */}
                <option>SELECT</option>
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
      <div className="p-2" id='converter-btn-block'>
      <Button variant='light' type='submit' id='convertCurrencyBtn'>CONVERT</Button></div>
      <div className="p-2">
        <Button variant='danger' id='clearFormBtn'>CLEAR</Button>
      </div>
      {/* CONVERTER RESULT */}
      <div className="p-2" id='converterResultBlock' aria-live='polite'></div>
    </Stack>
            
        
    </form>
  )
}
