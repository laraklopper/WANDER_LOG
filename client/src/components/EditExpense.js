import React from 'react'
import '../css/componentCss/EditExpense.css'
import '../css/componentCss/FormSetup.css'
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
export default function EditExpense() {
  return (
    <form id='editExpenseForm'>
      <div id='formHeadingBlock'>
      <span className='formHeadingSpan' id='editExpenseName'>
      <h3 id='formHeading'>EDIT EXPENSE:</h3>
      <h3 id='formItem'>{/* expense.title */}</h3>
      </span>
      </div>
      <div id='editExpenseInfoDiv'>
            <p className='editInfoMsg'>
            <i><small>Only fill in what you want to change. Anything left blank stays as it is.</small></i>
            </p>
        </div>
        {/* =========EDIT EXPENSE INPUT======== */}
        <div id='editExpenseInput'>
        {/* GROUP 1 */}
          <div id='editExpGroup1'>
          {/* STACK 1 */}
             <Stack gap={3} id='editExpStack1'>
      <div className="p-2" id='editExpTripBlock'>
        <label className='editExpLabel'>EDIT TRIP:</label>
        <select
        className='input'
        // id=''
        // name=''
        // value={}
        >
        {/* MAP ALL TRIPS WITH A BUDGET and USE THE CURRENT TRIP
        AS THE PLACEHOLDER*/}
          <option>SELECT</option>
        </select>
      </div>
      <div className="p-2">
        <label className='editExpLabel'>TITLE:</label>
        <input
          className='input'
          // id=''
          placeholder='TITLE'//currentTitle
          // name=''
          // value={}
          // onChange={}
        />
      </div>
    </Stack>
          </div>
          {/* GROUP 2 */}
          <div id='editExpGroup2'>
                <Stack gap={3} id='editExpStack2'>
      <div className="p-2">
        <div>
          <div className='input-div'>
            <label className='editExpLabel'>AMOUNT:</label>
            <input
              className='input'
              type='number'
              step='0.01'
              inputMode='decimal'
              // name=''
              // value={}
              // onChange={}
            />
          </div>
          <div className='input-div'>
            <label className='editExpLabel'>PAYMENT METHOD:</label>
            <select
              className='input'
              // id=''
              // name=''
              // value={}
              // onChange={}
              >
                <option>SELECT</option>
              </select>
          </div>
        </div>
      </div>
      <div className="p-2">
      <div className='editExp-group'>
 <div className='input-div'>
          <label className='editExpLabel'>CURRENCY:</label>
          <select 
            className='input'
            // id=''
            // name=''
            // value={}
            // onChange={}
            // ARIA ATTRIBUTES
            >
            <option>SELECT</option>
          </select>
        </div>
        <div className='input-div'>
          <label className='editExpLabel'>CATEGORY:</label>
          <select
          className='input'
          >
          {/* MAP ALL AVAILABLE CATEGORIES WITH THE CURRENT CATEGORY AS THE PLACEHOLDER */}
            <option></option>
          </select>
        </div>
      </div>
       
      </div>
    </Stack>
          </div>
          {/* GROUP 3 */}
          <div id='editExpGroup3'>
            <Stack direction="horizontal" gap={3} id='editExpStack3'>
      <div className="p-2" id='editExpTextInputBlock'>
        <label className='editExpLabel'>NOTES:</label>
        <textarea
          className='editExpTextInput'
          rows={3}
          // placeholder=''
          // name=''
          // value={}
        />
      </div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2">
        {/* show optional input message */}
      </div>
    </Stack>
        <Stack direction="horizontal" gap={3} id='editExpStack4'>
      <div className="p-2">
        <label className='editExpLabel'>IS PAID:</label>
        <input
        type='checkbox'
        />
      </div>
      <div className="p-2" id='editExpDateBlock'>
        <label className='editExpLabel'>EDIT DATE:</label>
        <input
          type='date'
          className='input'
          // id=''
          // placeholder=''//current expense date
          // name=''
          // value={}
          // onChange={}
        />
      </div>
      <div className="p-2"></div>
    </Stack>

          </div>
        </div>
        {/* =======END OF INPUT========== */}
        <div id='editExpGroup4'>
          <Stack direction="horizontal" gap={3} id='editExpBtnStack'>
      <div className="p-2"/>
      <div className="p-2 ms-auto">
        <Button
        variant='warning'
        id='editExpBtn'
        type='submit'
        
        >
          EDIT EXPENSE
        </Button>
      </div>
      <div className="p-2">
        <Button
        variant='danger'
        id='clearFormBtn'
        >
          CLEAR
        </Button>
      </div>
    </Stack>
        </div>
    </form>
  )
}
