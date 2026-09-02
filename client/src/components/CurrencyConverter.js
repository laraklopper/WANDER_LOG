import React from 'react'
import '../css/componentCss/CurrencyConverter.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
//IMPORT REACT-ROUTER-DOM COMPENTS
import { Asterisk } from 'lucide-react';

export default function CurrencyConverter() {
  return (
    <form id='currency-converter-form'>
        <div  id='formHeadingBlock'>
            <h3 id='formHeading'>Currency Converter</h3>
        </div>
        <div id='currency-converter-details'>
            <Stack  gap={3} id='converterStack1'>
      <div className="p-2">
        <label className='converter-label'>AMOUNT:</label>
        <div className='input-div'>
            <input
                type='number'
                required
                className='input'
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2">
        <label className='converter-label'>CONVERT FROM:</label>
        <div className='input-div'>
            <select>
            {/* MAP ALL AVAILABLE CURRENCIES WITH SELECT AS THE PLACEHOLDER */}
                <option>SELECT</option>
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2">
        <label className='converter-label'>CONVERT TO:</label>
        <div className='input-div'>
            <select>
            {/* MAP ALL AVAILABLE CURRENCIES WITH SELECT AS THE PLACEHOLDER */}
                <option>SELECT</option>
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
    </Stack>
    <Stack  gap={3} id='converter-stack2'>
    <div className="p-2" id='requiredInfo'>
                        <p className='infoText' aria-live='polite' aria-hidden='true'>
                            <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /> Indicates required information</small>
                        </p>
                    </div>
      <div className="p-2">
      <Button variant='light' type='submit' id='convertCurrencyBtn'>CONVERT</Button></div>
      <div className="p-2">
        <Button variant='danger' id='clearFormBtn'>CLEAR</Button>
      </div>
      {/* CONVERTER RESULT */}
      <div className="p-2" id='converterResultBlock' aria-live='polite'>Third item</div>
    </Stack>
            
        </div>
    </form>
  )
}
