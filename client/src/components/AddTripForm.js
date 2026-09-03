import React from 'react'
import '../css/componentCss/AddTripForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk, MapPin, Calendars  } from 'lucide-react';
export default function AddTripForm({currentUser}) {
  return (
    <form id='addTripForm' aria-labelledby='formHeading'>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>ADD TRIP</h3>
        </div>
        {/* INPUT */}
        <div id='addtrip-input-details'>
        {/* GROUP 1: USERNAME + TITLE + PURPOSE */}
            <div id='addTrip-group1'>
                <Stack gap={3} id='addTrip-stack1'>
                    <div className="p-2" id='add-trip-block1'>
                        <label className='add-trip-label' htmlFor='new-trip-username'>USERNAME:</label>
                        <div className='input-div'>
                            <input
                                className='input'
                                id='new-trip-username'
                                readOnly
                                value={`${currentUser?.username || 'USERNAME'}`}
                                // ARIA ATTRIBUTES:
                                aria-required='true'
                                aria-readonly='true'
                            />
                            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        </div>
                    </div>
                    <div className="p-2" id='add-trip-block2'>
                    <div className='trip-input-group'>
                        <div className='trip-input-div'>
                            <label className='add-trip-label'>TITLE:</label>
                            <input
                                className='input'
                                placeholder='TITLE'
                                required
                                // name=''
                                // value={}
                                // onChange={}
                            />
                            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        </div>
                        <div className='trip-input-div'>
                            <label className='add-trip-label'>PURPOSE:</label>
                            <select 
                            className='input'
                            >
                                <option 
                                // value={}
                                >SELECT</option>
                                <option>HOLIDAY</option>
                                <option>BUSINESS</option>
                            </select>
                            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        </div>
                        </div>
                    </div>
                 </Stack>
            </div>
            {/* GROUP 2: DESTINATION */}
            <div id='addTrip-group2'>
            <div className='addTripGroupHead'>
                <span id='addTrip-group2Head-span'>
<h4 className='formSectionHeading'>DESTINATION</h4>
<MapPin style={{margin: '0px', padding: '0px'}} fontWeight={700} size={24}/>
                </span>     
            </div>
            {/* STACK 2 */}
                 <Stack direction="horizontal" gap={3} id='addTrip-stack2'>
      <div className="p-2" id='destination-type-block'>
        <label className='add-trip-label'>TYPE:</label>
        <div className='trip-input-div'>
            <select
            className='input'
            >
                <option>SELECT</option>
                <option>DOMESTIC</option>
                <option>INTERNATIONAL</option>
            </select>
                            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>

        </div>
      </div>
      <div className="p-2"></div>
      <div className="p-2"></div>
    </Stack>
    {/* STACK 3 */}
 <Stack direction="horizontal" gap={3} id='addTrip-stack3'>
      <div className="p-2" id='addTrip-location-block'>
        <label className='add-trip-label' htmlFor='newTripLocation'>LOCATION:</label>
        <div className='trip-input-div'>
            <input
                type='text'
                className='input'
                placeholder='LOCATION'
                id='newTripLocation'
                required
                // name=''
                // value={}
                // onChange={}
                // ARIA ATTRIBUTES
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2">
      {/* ONLY DISPLAY IF DESTINATION TYPE IS INTERNATIONAL */}
        <div id='tripCountryInput-div'>
            <label className='add-trip-label'>COUNTRY:</label>
            <div className='trip-input-div'>
                <input
                    className='input'
                    placeholder='COUNTRY'
                    // name=''
                    // value={}

                />
            </div>
        </div>
      </div>
    </Stack>
            </div>
            {/* GROUP 3: DATE */}
            <div id='addTrip-group3'>
                <div className='addTripGroupHead'>
                    <span id='addTrip-group3Head-span'>
                        <h4 className='formSectionHeading'>DATE</h4>
                        <Calendars style={{margin: '0px', padding: '0px'}} fontWeight={700} size={24}/>
                    </span>

                </div>
                {/* STACK 4 */}
                <Stack gap={3} id='addTrip-stack4'>
      <div className="p-2" id='addTrip-status-block'>
        <label className='add-trip-label'>STATUS:</label>
        <div className='input-div'>
            <select
            className='input'
            >
                <option>SELECT:</option>
                <option>UPCOMING</option>
                <option>ONGOING</option>
                <option>COMPLETED</option>
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2">
        <div className='trip-input-group'>
            <div className='trip-input-div'>
                <label className='add-trip-label'>START DATE:</label>
                 <input
                    type='date'
                    className='input'
                    required
                    // id=''
                    // ARIA ATTRIBUTES:
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
            <div className='trip-input-div'>
                <label className='add-trip-label'>END DATE:</label>
                <input
                    type='date'
                    className='input'
                    required
                    // id=''
                    // name=''
                    // value={}
                    // onChange={}
                    // ARIA ATTRIBUTES:
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
        </div>
      </div>
    </Stack>
            </div>
        </div>
        {/* GROUP 4: REQUIRED INFO MESSAGE + BUTTONS */}
        <div id='addTrip-group4'>
        <Stack direction="horizontal" gap={3} id='addTrip-stack5'>
         {/* REQUIRED INFO MESSAGE*/}
        <div className="p-2" id='requiredInfo'>
            <p className='infoMsg'>
            <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
            </p>
        </div>
      <div className="p-2 ms-auto">
        <Button variant='light' id='addTripBtn' type='submit'>
            ADD TRIP
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
