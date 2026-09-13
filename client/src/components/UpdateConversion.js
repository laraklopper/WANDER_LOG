// UpdateConversion
/* Form with readonly converter input for all fields  to check if the 
exchange rate is still the same or the target(convert to) currency must be changed. Sends a 
 PUT request to the `/api/updateConversion` endpoint*/
import React from 'react'
import '../css/componentCss/CurrencyConverter.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk } from 'lucide-react';

export default function UpdateConversion() {
  return (
    <form id='currency-converter-form' method='PUT' aria-describedby='formDescrip'>
        <div id='formHeaderBlock'>
            <Stack gap={3} id='formHeadingStack' >
      <div className="p-2 visually-hidden" >
        <p id='formDescrip'>Form to check if exchange Rate is the same and update the conversion</p>
      </div>
      <div className="p-2" id='formHeadingBlock'>
        <h3 id='formHeading'>UPDATE CONVERSION</h3>
      </div>
      <div className="p-2" id='editConvertMsgBlock'>
        <p className='editConverterMsg'>Update the conversion</p>
      </div>
    </Stack>           
        </div>
        <div id='currency-converter-details'>
            <Stack gap={3} id='converterStack1'>
      <div className="p-2" id='convert-amount-block'>
        <label className='converter-label'>AMOUNT:</label>
        <div className='input-div'>
            <input
                className='input'
                readOnly
                // placeholder=''//currentAmount
                // name=''
                // value={}
            />
             <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2" id='convert-baseCurrency-block'>
        <label className='converter-label'>CONVERT FROM:</label>
        <div className='input-div'>
            <input
                className='input'
                readOnly
                // placeholder=''//Current base currency
                // name=''
                // value={}
                // ARIA ATTRIBUTES:
            />
              <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2" id='convert-TargetCurrency-block'>
        <label className='converter-label'>CONVERT TO:</label>
        <div className='input-div'>
<input
            className='input'
            readOnly
            // placeholder=''//current Target currency
            // name=''
            // value={}
            // ARIA ATTRIBUTES
        />
                     <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>

        </div>
        
      </div>
    </Stack>


        </div>
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
        // ARIA ATTRIBUTES
        >
            CONVERT
        </Button>
      </div>
      {/* RESULT  BLOCK*/}
      <div className="p-2" id='converterResultBlock' aria-live='polite'>
        {/* save updated conversion button */}
      </div>
      {/* ERROR MESSAGE */}
    </Stack>
    </form>
  )
}


