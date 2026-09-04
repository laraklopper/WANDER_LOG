import React, { useState } from 'react'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/AddEntryForm.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import { Asterisk } from 'lucide-react';

const BLANK_ENTRY = {
    trip: '',
  username: '',
  title: '',
  body: '',
  date: ''
}
export default function AddEntryForm(
    {//PROPS PASSED FROM PARENT COMPONENT(Journal.js)
        currentUser, 
        newEntryData = BLANK_ENTRY, 
        setNewEntryData, 
        addEntry,
        emptyEntry = BLANK_ENTRY
    }) {
        const [touched, setTouched] = useState({    
            trip: false,
            username: false,
            title: false,
            body: false,
            date:false
        })


        const handleAddEntry = (event) => {
            event.preventDefault()
            addEntry()
        }
        const handleInput = (event) => {
            const {name, value} = event.target;
            setNewEntryData((prev) => ({
                ...prev,
                [name]: value
            }))
        }

        const clearForm = () => {
            const confirmClear = window.confirm(
                "Are you sure you want to clear the form?"
            )
            if (!confirmClear) return;
            // Reset to the same empty shape the page initialised the form with
            setNewEntryData(emptyEntry)

        }

        // =============JSX RENDERING============
  return (
    <form id='addEntryForm' method='POST' aria-labelledby='formTitle' onSubmit={handleAddEntry}>
        <p className='visually-hidden' id='formTitle'>ADD ENTRY FORM</p>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>ADD ENTRY</h3>
        </div>
        {/* =========FORM INPUT======= */}
        <div id='add-entry-input'>
        {/* GROUP 1 */}
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
                        {/* MAP ALL LOGGED IN USER TRIPS FROM THE DATABASE */}
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
            required
            name='date'
            value={newEntryData.date}
            onChange={handleInput}
            // ARIA ATTRIBUTES:
            aria-required
        />
      </div>
    </Stack>
            </div>
            {/* GROUP 2 */}
            <div id='addEntry-group2'>
                 <Stack gap={3} id='addEntry-stack2'>
                    <div className="p-2" id='entry-block1'>
                        <label className='addEntry-label'>TITLE:</label>
                        <div className='input-div'>
                            <input
                                className='input'
                                required
                                    placeholder='TITLE'
                                    name='title'
                                    value={newEntryData.title}
                                    onChange={handleInput}
                                    // ARIA ATTRIBUTES:

                                />
                                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        </div>
                    </div>
                    <div className="p-2" id='entry-block2'>
                        <label className='addEntry-label' htmlFor='entryTextInput'>DETAILS:</label>
                        <div className='input-div'>
                            <textarea
                                id='entryTextInput'
                                placeholder='Enter your entry'
                                required
                                name='body'
                                value={newEntryData.body}
                                onChange={handleInput}
                                // ARIA ATTRIBUTES:
                                aria-label='Entry Details'
                                aria-required='true'
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
