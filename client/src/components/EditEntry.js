import React from 'react'
import '../css/componentCss/EditEntry.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';


export default function EditEntry() {
  return (
    <form id='editEntryForm' method='PATCH' aria-describedby='editEntryName'>
        <div id='formHeadingBlock'>
        {/* FORM HEADING: EDIT ENTRY + entry.title */}
        <span className='formHeadingSpan' id='editEntryName'>
            <h3 id='formHeading'>EDIT ENTRY:</h3>
            <h3 className='formItem'>ENTRY TITLE</h3>
        </span>
        </div>
        {/* Form Input Message */}
        <div id='editEntryInfoBlock'>
            <p className='editInfoMsg'>
            <i><small>Only fill in what you want to change. Anything left blank stays as it is.</small></i>
            </p>
        </div>
        {/* ==FORM INPUT========= */}
        <div id='editEntryInput'>
        {/* GROUP 1 : username(hidden: readonly) + Trip + Title + Body*/}
            <div id='editEntryGroup1'>
            {/* STACK 1 */}
            <Stack gap={3} id='editEntryStack1'>
            {/* USERNAME: value={}*/}
                <div className="p-2 visually-hidden" id='editEntryUsername'>
                    <label className='editEntryLabel'>USERNAME:</label>
                    <input
                        readOnly
                        // value={}//current user username
                    />
                </div>
                {/* EDIT TRIP: value={} */}
                <div className="p-2" id='editEntryTripBlock'>
                    <label className='editEntryLabel' htmlFor=''>EDIT TRIP:</label>
                    <select
                        className='input'
                        // id=''
                        // name=''
                        // value={}
                        // onChange={}
                        // ARIA ATTRIBUTES:
                        
                    >
                    {/* MAP ALL TRIPS WITH THE CURRENT TRIP AS PLACEHOLDER */}
                        <option>SELECT</option>
                    </select>
                </div>
                <div className="p-2" id='editEntryBodyBlock'>
                {/* EDIT ENTRY: value={} */}
                    <label className='editEntryLabel' htmlFor=''>EDIT ENTRY BODY:</label>
                    <textarea
                        // id=''
                        className='editEntryTextInput'
                        placeholder='Update your entry'
                        // name=''//Current entry
                        rows={3}
                        // value={}
                        // ARIA ATTRIBUTES:
                    />
                </div>
    </Stack>
            </div>
            {/* GROUP 2: PHOTOS : ADD LATER */}
            {/* <div id='editEntryGroup2'></div> */}
        </div>
        {/* ==END OF INPUT=========== */}
        {/* GROUP3: SUBMIT FORM BUTTON + CLEAR FORM BUTTON */}
        <div id='editEntryGroup3'>
        {/* STACK: SUBMIT FORM BUTTON CLEAR FORM BUTTON */}
            <Stack direction="horizontal" gap={3} id='editEntryBtnStack'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        <Button
            variant='warning'
            type='submit'
            id='editEntryBtn'
            // ARIA ATTRIBUTES:
        >
            EDIT ENTRY
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
