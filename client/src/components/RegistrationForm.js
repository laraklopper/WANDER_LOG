import React, { useState } from 'react'
import '../css/componentCss/RegistrationForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk } from 'lucide-react';
export default function RegistrationForm({
  newUserData,
  setNewUserData
}) {
  const [passwordMsg, setPasswordMsg] = useState(false)
  return (
    <form id='registration-form' method='POST'>
        <p className='visually-hidden' id='formTitle'>REGISTRATION FORM</p>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>SIGN UP</h3>
        </div>
        {/* =============INPUT================== */}
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
                name='username'
                value={newUserData.usename}
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
                    name='fullName.firstName'
                    
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
            <Stack gap={3} id='regis-stack4'>
      <div className="p-2">
        <h5 className='formSectionHeading'>ADDRESS</h5>
      </div>
      <div className="p-2" id='regis-address-block1'>
      <div className='text-input-div'>
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
            <label className='regis-label'>PROVINCE:</label>
            <select 
            className='input'
            >
                <option>SELECT</option>
            </select>
<small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                
            </div>
        </div>

      </div>
    </Stack>

            </div>
            {/* GROUP 3 */}
            <div id='regis-group3'>
               <Stack direction="horizontal" gap={3} id='regis-stack5'>
                <div className="p-2">
                  <div>
                    <label className='regis-label'>REGISTER AS ADMIN:</label>
                    <input
                      type='checkbox'
                    />
                  </div>
                </div>
                <div className="p-2 ms-auto"></div>
                <div className="p-2"></div>
              </Stack>
              <Stack direction="horizontal" gap={3} id='regis-stack6'>
                <div className="p-2">
                  <label className='regis-label'>PROFILE PICTURE:</label>
                </div>
                <div className="p-2 ms-auto"></div>
                <div className="p-2"></div>
              </Stack>
              <Stack direction="horizontal" gap={3} id='regis-stack7'>
                <div className="p-2">
                  
                  <div className='input-group'>
                  <label className='regis-label'>PASSWORD:</label>
                  <div className='input-div'>
                    <input
                      className='input'
                      type='password'
                      placeholder='PASSWORD'
                      // name=''
                      // value={}
                      // onChange={}
                      onFocus={() => setPasswordMsg(true)}
                      onBlur={() => setPasswordMsg(false)}
                    />
                  </div>
                    
                    {passwordMsg && (
                      <span>
                        <p>WE WILL NEVER SHARE YOUR PASSWORD</p>
                      </span>
                    )}
                  </div>
                  {/* ERROR MESSAGE */}
                 {/* <div></div> */}
                </div>
                <div className="p-2 ms-auto">
                  {/* SHOW PASSWORD MESSAGE */}
                </div>
                <div className="p-2">
                    <Button
                  variant='warning'
                  >
                    SHOW PASSWORD
                  </Button>
                </div>
              </Stack>
            </div>
            {/* =======END OF INPUT============ */}
        </div>
        <div id='regis-group4'>
          <Stack direction="horizontal" gap={3} id='regis-stack8'>
       {/* REQUIRED INFO */}
                <div className="p-2" id='requiredInfo'>
                    <p className='infoMsg' aria-live='polite' aria-hidden='true'>
                        <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
                    </p>
                </div>
      <div className="p-2 ms-auto">
        <Button variant='light' id='regis-Btn'>REGISTER</Button>
      </div>
      <div className="p-2">
        <Button>CLEAR FORM</Button>
      </div>
    </Stack>
        </div>
    </form>
  )
}
