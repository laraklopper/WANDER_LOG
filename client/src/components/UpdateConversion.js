// UpdateConversion
/* Form with readonly converter input for all fields  to check if the 
exchange rate is still the same or the target(convert to) currency must be changed. Sends a 
 PUT request to the `/api/updateConversion` endpoint*/
import React from 'react'
import '../css/componentCss/CurrencyConverter.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';


export default function UpdateConversion() {
  return (
    <form id='currency-converter-form'>
        <div id='formHeadingBlock' aria-describedby='formDescrip' >
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
        <div className='formTextBlock'>

        </div>

    </form>
  )
}


