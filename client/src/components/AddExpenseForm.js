import React, { useState } from 'react'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/AddExpenseForm.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk } from 'lucide-react';

export default function AddExpenseForm({currentUser}) {
  const [dateMessage, setDateMessage] = useState(false)
  return (
    <form id='add-expense-form' method='POST' aria-labelledby='formHeading'>
      <div id='formHeadingBlock'>
        <h3 id='formHeading'>ADD EXPENSE</h3>
      </div>
      {/* FORM INPUT */}
      <div id='addExp-input-details'>
      {/* GROUP 1: USERNAME + TRIP + TITLE */}
        <div id='addExp-group1'>
        {/* STACK 1 */}
            <Stack gap={3} id='addExpenseStack1'>
            {/* USERNAME (READ ONLY)*/}
      <div className="p-2" id='addExp-Block1'>
          <div className='addExp-input-div'>
            <label className='addExp-label'>USERNAME:</label>
            <div className='input-div'>
              <input
                className='input'
                readOnly
                value={`${currentUser?.username || 'USERNAME'}`}
              />
              <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
            </div>
          </div>
          {/* TRIP */}
          <div className='addExp-input-div'>
            <label className='addExp-label'>TRIP:</label>
            <div className='input-div'>
              <select
                className='input'
                required
                // name=''
                // value={}
                // onChange={}
              >
              {/* MAP ALL TRIPS IN THE DATABASE WITH SELECT AS THE PLACEHOLDER */}
                <option>SELECT</option>
              </select>
              <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
            </div>

          </div>
      </div>
      {/* TITLE */}
      <div className="p-2" id='addExp-Title-block'>
        <label className='addExp-label'>TITLE:</label>
        <div>
          <input
            className='input'
            type='text'
            required
            placeholder='TITLE'
            // autoComplete=''
            // name=''
            // value={}
            // ARIA ATTRIBUTES
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
    </Stack>
        </div>
        {/* GROUP 2: AMOUNT + CURRENCY + CATEGORY + PAYMENT METHOD */}
        <div id='addExp-group2'>
        {/* STACK 2 */}
          <Stack gap={3} id='addExpenseStack2'>
      <div className="p-2" id='addExp-Finance-block1'>
      {/* AMOUNT */}
      <div className='addExp-input-div'>
<label className='addExp-label'>AMOUNT:</label>
<div className='input-div'>
    <input
      className='input'
      type='number'
      placeholder='0.00'
      step='0.01'
      min='0.01'
      // name=''
      // value={}
      // onChange={}
      // ARIA ATTRIBUTES
    />
<small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
</div>
      </div>
      {/* PAYMENT METHOD */}
        <div className='addExp-input-div'>
          <label className='addExp-label'>PAYMENT METHOD:</label>
          <div className='input-div'>
            <select
              className='input'
              required
              // name=''
              // value={}
              // onChange={}
            >
            {/* USE SELECT AS THE PLACEHOLDER */}
              <option>SELECT</option>
              <option>CREDIT CARD</option>
              <option>DEBIT CARD</option>
              <option>CRYPTO</option>
              <option>OTHER</option>
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
          </div>
        </div>
      </div>
      <div className="p-2" id='addExp-Finance-block2'>
      {/* CURRENCY */}
        <div className='addExp-input-div'>
          <label className='addExp-label'>CURRENCY:</label>
          <div className='input-div'>
            <select
            className='input'
            required
            // name=''
            // value={}
            // onChange={}
            >
            {/* MAP ALL CURRENCIES AVAILABLE IN THE CURRENCIES ARRAY
            WITH SELECT AS THE PLACEHOLDER */}
              <option>SELECT</option>
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
          </div>
        </div>
        {/* EXPENSE CATEGORY */}
         <div className='addExp-input-div'>
            <label className='addExp-label'>EXPENSE CATEGORY:</label>
<div className='input-div'>
            <select
            className='input'
            required
            // name=''
            // value={}
            // onChange={}
            >
            {/* MAP ALL CATEGORIES IN THE THE EXPENSE_CATEGORIES ARRAY
            WITH SELECT AS THE PLACEHOLDER */}
              <option>SELECT</option>
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
          </div>
         
        </div>
      </div>
    </Stack>
        </div>
        {/* GROUP 3: OPTIONAL NOTES + ISPAID CHECKBOX + DATE */}
        <div id='addExp-group3'>
           <Stack gap={3} id='addExpenseStack3'>
      <div className="p-2" id='addExp-Notes-Block'>
      <div className='addExp-input-div'>
      <label className='addExp-label'>NOTES:</label>
        <div className='input-div'>
          <textarea
            className='addExp-textInput'
            placeholder='OPTIONAL NOTES'
            // name=''
            // value={}
            // onChange={}
          />
        </div>
        
      </div>
      </div>
      <div className="p-2" >
{/* IS PAID */}
        <div className='addExp-input-div'>
          <label className='addExp-label'>IS PAID:</label>
          <div className='input-div'>
            <input
              type='checkbox'
            />
          </div>
        </div>
      </div>
      
    </Stack>
    <Stack direction="horizontal" gap={3} id='addExp-dateStack'>
      {/* DATE: CANNOT BE IN THE FUTURE */}
      <div className="p-2" id='addExp-date-block'>
        <label className='addExp-label'>DATE:</label>
        <div className='input-div'>
          <input
            className='input'
            type='date'
            required
            // autoComplete=''
            // name=''
            // value={}
            // onChange={}
            onFocus={() => setDateMessage(true)}
            onBlur={() => setDateMessage(false)}
            // ARIA ATTRIBUTES:
          />
          <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
        </div>
        
      </div>
      <div className="p-2 ms-auto"></div>
      {dateMessage && (
          <div className='p-2' id='dateMsg'>
            <p className='infoText'>DATE CANNOT BE IN THE FUTURE</p>
          </div>
        )}
    </Stack>

        </div>
      </div>
      {/* END OF INPUT */}
      {/* GROUP 4: REQUIRED INFO MESSAGE + SUBMIT BTN + CLEAR BTN */}
      <div id='addExp-group4'>
      {/* STACK 4 */}
          <Stack direction="horizontal" gap={3} id='addExpenseStack4'>
             <div className="p-2" id='requiredInfo'>
                <p className='infoMsg'>
                    <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
                </p>
              </div>
            <div className="p-2 ms-auto">
              <Button
                id='addExpBtn'
                type='submit'
                variant='light'
                // ARIA ATTRIBUTES:
              >
                ADD EXPENSE BUTTON
              </Button>
            </div>
            <div className="p-2">
              <Button
                variant='danger'
                id='clearFormBtn'
                type='button'
                // onClick={}
                // ARIA ATTRIBUTES:
                >
                  CLEAR
                </Button>
            </div>
          </Stack>

     

      </div>
    </form>
  )
}
