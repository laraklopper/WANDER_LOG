import React from 'react'
import '../css/componentCss/RegistrationForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import { Asterisk } from 'lucide-react';
export default function RegistrationForm() {
  return (
    <form id='registration-form'>
        <p className='visually-hidden' id='formTitle'>REGISTRATION FORM</p>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>SIGN UP</h3>
        </div>
        <div id='regis-input-div'>
            <div id='regis-group1'>
            {/* STACK1 */}
             <Stack direction="horizontal" gap={3} id='regis-stack1'>
      <div className="p-2">
            <div className='input-div'>
            <label className='regis-label'>
                USERNAME:
            </label>
            <input
                className='input'
                id='regisUsernameInput'
                placeholder='USERNAME'
                required
                type='text'
                // name=''
                // value={}
                // onChange={}
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div id='regis-fullname-label-block'>
        <label className='regis-label'>FULL NAME:</label> 
      </div>
      <div className="p-2" id='regis-fullName-input-block'> 
      <div className='input-div'>
                <label htmlFor='regisFirstName' hidden>FIRST NAME:</label>
                <input
                    className='input'
                    id='regisFirstName'
                    placeholder='FIRST NAME'
                />
<small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
            <div className='input-div'>
                <label htmlFor='regisLastName' hidden>LAST NAME</label>
                <input 
                    className='input'
                    id='regisLastName'
                    placeholder='LAST NAME'


                    />
                    <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
            </div>
    </Stack>
  <Stack direction="horizontal" gap={3} id='regis-stack2'>
      <div className="p-2" id='regis-email-block'>
        <label className='regis-label'>EMAIL:</label>
            <div className='input-div'>
                <input
                    className='input'
                        id='regisEmail'
                        autoComplete='email'
                        placeholder='EMAIL'
                    />
 <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
      </div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2"></div>
    </Stack>
      <Stack direction="horizontal" gap={3} id='regis-stack3'>
      <div className="p-2" id='regis-dateOfBirth-block'>
        <label className='regis-label'>DATE OF BIRTH</label>
        <div className='input-div'>
 <input
            className='input'
            type='date'
            required
            autoComplete='date of birth'
            // name=''
            // value={}
            // onChange={}
        />
          <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
       
      </div>
      <div className="p-2  ms-auto"></div>
      <div className="p-2"></div>
    </Stack>
            </div>
            <div id='regis-group2'>
            <Stack gap={3}>
      <div className="p-2">
        <h5 className='formSectionHeading'>ADDRESS</h5>
      </div>
      <div className="p-2" id='regis-address-block1'>
      <div id='text-input-div'>
<label className='regis-label'>STREET ADDRESS:</label>
        <div className='input-div'>
            
            <textarea
                rows={3}
            />
             <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
         <div className='input-div'>
            
            <textarea
                rows={3}
                placeholder='ADDITIONAL ADDRESS DETAILS'
            />
             <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      
      </div>
      <div className="p-2" id='regis-address-block2'>
        <div className='address-input-div'>
            <div className='input-div'>
             <label className='regis-label'>CITY/TOWN:</label>
             <input
                className='input'
             />
             <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                
            </div>
            <div className='input-div'>
            <label>PROVINCE:</label>
            <select 
            className='input'
            >
                <option>SELECT</option>
            </select>

            </div>
        </div>

      </div>
    </Stack>

            </div>

        </div>
    </form>
  )
}
