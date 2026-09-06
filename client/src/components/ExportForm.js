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
    <form>
    <p className='visually-hidden' id='formTitle'>
            {/* EXPORT TITLE: e.g Export  */}
            {/* {`EXPORT ${exportConfig.label}`} */}
        </p>
       <Stack direction="horizontal" gap={3}>
      <div className="p-2">
        <label className='exportLabel'>CHOOSE EXPORT FORM</label>
        <select>
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
        <Button>
            EXPORT
        </Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button>
            CLEAR FORM
        </Button>
      </div>
    </Stack>
 
    </form>
  )
}
