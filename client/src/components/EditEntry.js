import React from 'react'
import '../css/componentCss/EditEntry.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';


export default function EditEntry() {
  return (
    <form id='editEntryForm' method='PATCH'>
        <div id='formHeadingBlock'>
        <span className='formHeadingSpan'>
            <h3 id='formHeading'>EDIT ENTRY:</h3>
            <h3 className='formItem'>ENTRY TITLE</h3>
        </span>
        </div>
        <div id='editEntryInfoBlock'>
            <p className='editInfoMsg'>
            <i><small>Only fill in what you want to change. Anything left blank stays as it is.</small></i>
            </p>
        </div>
        {/* ==FORM INPUT========= */}
        <div id='editEntryInput'>
        {/* GROUP 1 */}
            <div id='editEntryGroup1'>
            <Stack gap={3} id='editEntryStack1'>
                <div className="p-2 visually-hidden" id='editEntryUsername'>
                    <label className='editEntryLabel'>USERNAME:</label>
                    <input
                        readOnly
                        // value={}//current user username
                    />
                </div>
                {/* EDIT TRIP */}
                <div className="p-2" id='editEntryTripBlock'>
                    <label className='editEntryLabel'>EDIT TRIP:</label>
                    <select
                        className='input'
                        // id=''
                        // name=''
                        // value={}
                        // onChange={}
                        // ARIA ATTRIBUTES:
                        
                    >
                        <option>SELECT</option>
                    </select>
                </div>
                <div className="p-2" id='editEntryBodyBlock'>
                    <label className='editEntryLabel'>EDIT ENTRY BODY:</label>
                    <textarea
                        // id=''
                        className='editEntryTextInput'
                        placeholder='Update your entry'//Current entry
                        rows={3}
                        // name=''
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
        {/* STACK */}
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
            >
                CLEAR
            </Button>
      </div>
    </Stack>
        </div>
    </form>
  )
}
