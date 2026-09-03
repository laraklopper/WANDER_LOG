import React from 'react'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/AddEntryForm.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import { Asterisk } from 'lucide-react';

export default function AddEntryForm({currentUser}) {
  return (
    <form id='addEntryForm' method='POST' aria-labelledby='formTitle'>
        <p className='visually-hidden' id='formTitle'>ADD ENTRY FORM</p>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>ADD ENTRY</h3>
        </div>
        <div id='add-entry-input'>
            <div id='addEntry-group1'>
            <Stack gap={3} id='addEntry-stack1'>
                <div className="p-2" id='addEntry-div1'>
                    <div className='input-div'>
                        <label className='addEntry-label'>USERNAME:</label>
                        <input
                            className='input'
                            readOnly
                            value={`${currentUser?.username || 'USERNAME'}`}
                        />
                        <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                    </div>
                </div>
                <div className="p-2">
                    <div className='input-div'>
                        <label className='addEntry-label'>TRIP:</label>
                        <select 
                        className='input'
                        >
                            <option>SELECT</option>
                        </select>
                        <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                    </div>
                </div>
      <div className="p-2">
        <label className='addEntry-label' htmlFor='currentDate'>DATE:</label>
        <input
        type='date'
        id='currentDate'
            className='input'
        />
      </div>
      
    </Stack>
                

            </div>
            <div id='addEntry-group2'>
                 <Stack gap={3} id='addEntry-stack2'>
                    <div className="p-2" id='entry-block1'>
                        <label className='addEntry-label'>TITLE:</label>
                        <div className='input-div'>
                            <input
                                className='input'
                                required

                                    placeholder='TITLE'
                                />
                                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        </div>
                    </div>
                    <div className="p-2" id='entry-block2'>
                        <label className='addEntry-label'>DETAILS:</label>
                        <div className='input-div'>
                            <textarea
                                id='entryTextInput'
                                // placeholder=''
                                required
                                // name=''
                                // value={}
                                // onChange={}
                            />
                            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        </div>
                       
                    </div>
                    
                </Stack>

            </div>
            {/* GROUP 3: PHOTO INPUT (add later) */}
            {/* <div id='addEntry-group3'></div> */}
        </div>
       {/* GROUP 4: REQUIRED INFO MESSAGE + BUTTONS */}
        <div id='addEntry-group4'>
        <Stack direction="horizontal" gap={3} id='addEntry-stack3'>
         {/* REQUIRED INFO MESSAGE*/}
        <div className="p-2" id='requiredInfo'>
            <p className='infoMsg'>
            <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
            </p>
        </div>
      <div className="p-2 ms-auto">
        <Button variant='light' id='addEntryBtn' type='submit'>
            ADD ENTRY
        </Button>
      </div>
      <div className="p-2">
        <Button variant='danger' id='clearFormBtn'>CLEAR</Button>
      </div>
    </Stack>

        </div>
    </form>
  )
}
