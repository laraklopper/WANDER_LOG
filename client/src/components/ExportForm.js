//ExportForm.js
/*Display a component used for all export functions/requests
/export/trips
/export/entries
/export/expenses
/export/budget

toggle form display under the lists where the data can be 
exported (trips, entries, expenses, budget) 
*/ 

import React from 'react'
import '../css/componentCss/ExportForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button'

export default function ExportForm() {
  return (
    <form id='exportForm'>
    <p className='visually-hidden' id='formTitle'>
            {/* EXPORT TITLE: e.g Export Trips */}
            {/* {`EXPORT ${}`} */}
        </p>
       <Stack direction="horizontal" gap={3}>
      <div className="p-2" id='exportFormSelectBlock'>
        <label className='exportLabel'>CHOOSE EXPORT FORM</label>
        <select
        className='input'
        >
            {/* SET SELECT AS PLACEHOLDER */}
            <option value=''>SELECT</option>
            <option value='csv'>CSV (.csv)</option>
            <option value='xlsx'>EXCEL (.xlsx)</option>
        </select>
      </div>
      <div className="p-2 ms-auto"></div>
       {/* ==========ERROR/CONFIRMATION MESSAGE================
      A failure is an assertive alert, because the user pressed a button and
      needs to know it did not work assertive status; a successful
      completed download is a polite status. */}
      <div className="p-2">
     
      </div>
    </Stack>
    <Stack direction="horizontal" gap={3}>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        <Button
        variant='light'
        id='exportDataBtn'
        type='submit'
        // ARIA ATTRIBUTES:
        >
            EXPORT
        </Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button
        variant='danger'
        id='clearFormBtn'
        type='button'
        // onClick={}
        // ARIA ATTRIBUTES:
        >
            CLEAR FORM
        </Button>
      </div>
    </Stack>
 
    </form>
  )
}
