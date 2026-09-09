// EditTripForm.js 
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/EditTrip.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import {  MapPin, Calendars  } from 'lucide-react';

// EditTripForm function component
export default function EditTripForm() {//Export the default EditTripForm.js Component
    // =========STATE VARIABLES=============
    const [dateMsg, setDateMsg] = useState(false)

    //==========JSX RENDERING============
  return (
    <form id='editTripForm' method='PATCH' aria-labelledby='formHeading'>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>EDIT TRIP</h3>
        </div>
        <div id='editTripInput'>
        {/* GROUP 1 */}
            <div id='editTripGroup1'>
            {/* STACK1 */}
                <Stack gap={3} id='editTripStack1'>
                    <div className="p-2" id='editTitleBlock'>
                        <label className='editTrip-label'>EDIT TITLE:</label>
                        <div className='input-div'>
                            <input
                                type='text'
                                className='input'
                                placeholder='TITLE'//currentTitle
                                // name=''
                                // value={}
                                // onChange={}
                            />
                        </div>
                    </div>
                    <div className="p-2" id='editPurposeBlock'>
                        <label className='editTrip-label' htmlFor=''>PURPOSE</label>
                        <div className='input-div'>
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
                    <div className="p-2" id='editPurposeBlock'>
                    {/* EDIT STATUS */}
                        <label className='editTrip-label' htmlFor=''>EDIT STATUS:</label>
                        <div className='input-div'>
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
                </Stack>
            </div>
            {/* GROUP 2: DESTINATION */}
            <div id='editTripGroup2' aria-labelledby='editTrigroup2Head-span'>
                <div className='editTripGroupHead'>
                <span id='editTrigroup2Head-span'>
                    <h4 className='formSectionHeading'>EDIT DESTINATION</h4>
                    <MapPin style={{margin: '0px', padding: '0px'}} fontWeight={700} size={24} aria-hidden='true' focusable='false'/>
                </span>
            </div>
            {/* STACK 2 : destination : Type, location, country*/}
                <Stack gap={3} id='editTripStack2'>
                    <div className="p-2" id='editTripTypeBlock'>
                        <label className='editTrip-label' htmlFor=''>EDIT DESTINATION TYPE:</label>
                        <select
                        className='input'
                        // id=''
                        // name=''
                        // value={}
                        >
                            <option>SELECT</option>
                        </select>
                    </div>
                    <div className="p-2" id='editLocationBlock'>
                        <div className='input-div'>
                         <label className='editTrip-label' htmlFor=''>EDIT LOCATION:</label>
                            <input
                                className='input'
                                id=''
                                type='text'
                                placeholder='LOCATION' //currentLocation
                                // name=''
                                // value={}
                                // onChange={}
                                // ARIA ATTRIBUTES
                            />
                        </div>
                        {/* ONLY DISPLAY IF TYPE IS INTERNATIONAL */}
                          <div className='input-div'>
                         <label className='editTrip-label' htmlFor=''>COUNTRY:</label>
                            <input
                                className='input'
                                // id=''
                                placeholder='COUNTRY'//Current country 
                                // name=''
                                // value={}
                                // onChange={}
                            />
                        </div>
                    </div>
                </Stack>
            </div>
            {/* GROUP 3: START DATE + END DATE */}
              <div id='editTripGroup3'>
              <div className='editTripGroupHead'>
              <span id='editTripGroup3Head-span'>
                    <h4 className='formSectionHeading'>DATE</h4>
                <Calendars style={{margin: '0px', padding: '0px'}} fontWeight={700} size={24} aria-hidden='true' focusable='false'/>
              </span>
              </div>
              {/* STACK 3 */}
                 <Stack direction="horizontal" gap={3} id='editTripStack3'>
      <div className="p-2" id='editTripDateBlock'>
        <div className='date-input'>
        {/* START DATE */}
            <div className='input-div'>
                <label className='editTrip-label' htmlFor=''>EDIT START DATE:</label>
                <input
                className='input'
                // id=''
                // placeholder=''
                // name=''
                // value={}
                type='date'
                onFocus={() => setDateMsg(true)}
                onBlur={() => setDateMsg(false)}
                // onChange={}
                />
            </div>
            {/* END DATE */}
            <div className='input-div'>
                <label className='editTrip-label' htmlFor=''>EDIT END DATE:</label>
                <input
                    className='input'
                    // id=''
                    // placeholder=''
                    // name=''
                    // value={}
                    type='date'
                    onFocus={() => setDateMsg(true)}
                    onBlur={() => setDateMsg(false)}
                    // onChange={}
                    //ARIA ATTRIBUTES: 
                />
            </div>
        </div>
      </div>
      <div className="p-2"/>
      <div className="p-2  ms-auto">
        {/* DATE MESSAGE */}
        {dateMsg && (
            <span aria-live='polite'>
                <p className='dateinfoText'>End date must be on or after the start date</p>
            </span>
        )}
      </div>
    </Stack>
        </div>
        {/* PHOTO INPUT (ADD LATER) */}
        {/* <div id='editTripGroup4'></div> */}
        </div>
        {/* END OF FORM INPUT */}
        {/* GROUP 4 */}
        <div id='editTripGroup5'>
        {/* STACK 4 */}
            <Stack direction="horizontal" gap={3} id='editTripBtnStack'>
                <div className="p-2"></div>
                <div className="p-2 ms-auto">
                {/* Submit Form Button */}
                    <Button 
                        variant='warning'
                        id='editTripBtn'
                        type='submit'
                        // ARIA ATTRIBUTES:
                        
                        >EDIT TRIP</Button>
                </div>
                <div className="p-2">
                {/* Clear Form Button */}
                    <Button 
                        variant='danger' 
                        id='clearFormBtn'
                        type='button'
                        // onClick={}
                        // ARIA ATTRIBUTES
                        >
                        CLEAR
                    </Button>
                </div>
            </Stack>
        </div>
    </form>
  )
}
