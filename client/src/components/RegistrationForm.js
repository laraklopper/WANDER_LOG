import React, { useState } from 'react'
import '../css/componentCss/RegistrationForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk, Eye, EyeOff } from 'lucide-react';
import { provinces } from '../data/locations';

export default function RegistrationForm({
  newUserData,
  setNewUserData
}) {
  const [showPswd, setShowPswd] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(false)

      const handleInputChange = (event) => {
      const { name, value, type, checked } = event.target;
      const val = type === 'checkbox' ? checked : value;

      if (name.startsWith('fullName.')) {
        const [, field] = name.split('.');
        setNewUserData((prev) => ({
          ...prev,
          contactNumber: { ...prev.contactNumber, [field]: val }
        }));
        return;
      }
      if (name.startsWith('address.')) {
        const [, field] = name.split('.');
        setNewUserData((prev) => ({
          ...prev,
          address: { ...prev.address, [field]: val }
        }));
        return;
      }
      setNewUserData((prev) => ({
        ...prev,
        [name]: val,
      }));
    };

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
                onChange={handleInputChange}
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
                    value={newUserData.fullName.firstName}
                    onChange={handleInputChange}
                    
                />
<small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
            <div className='input-div'>
                <label htmlFor='regisLastName' hidden>LAST NAME</label>
                <input 
                    className='input'
                    id='regisLastName'
                    placeholder='LAST NAME'
                    name='fullName.lastName'
                    value={newUserData.fullName.lastName}
                    onChange={handleInputChange}
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
                className='address-text-input'
                required
                placeholder='STREET ADDRESS'
                name='address.line1'
                value={newUserData.address.line1}
                onChange={handleInputChange}
            />
             <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
         <div className='input-div'>
            <textarea
                rows={3}
                className='address-text-input'
                placeholder='ADDITIONAL ADDRESS DETAILS'
                name='address.line2'
                value={newUserData.address.line2}
                onChange={handleInputChange}
                aria-required='false'
            />
        </div>
      </div>
      </div>
      <div className="p-2" id='regis-address-block2'>
        <div className='address-input-div'>
            <div className='input-div'>
             <label className='regis-label'>CITY/TOWN:</label>
             <input
                className='input'
                required
                placeholder='CITY/TOWN'
                name='address.city'
                value={newUserData.address.city}
             />
             <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                
            </div>
            <div className='input-div'>
            <label className='regis-label'>PROVINCE:</label>
            <select 
            className='input'
            required
            name='address.province'
            value={newUserData.address?.province || ''}
            onChange={handleInputChange}
            >
                <option value=''>SELECT</option>
                {/* MAP ALL PROVINCES WITH SELECT AS THE PLACEHOLDER */}
                {provinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
            </select>
<small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                
            </div>
        </div>

      </div>
    </Stack>
            </div>
            {/* GROUP 3: Admin, Profile Picture, password */}
            <div id='regis-group3'>
            {/* STACK 5 */}
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
              {/* STACK 6 */}
              <Stack direction="horizontal" gap={3} id='regis-stack6'>
                <div className="p-2">
                {/* optional */}
                  <label className='regis-label'>PROFILE PICTURE:</label>
                  <input
                    className='input'
                    // name=''
                    // value={}
                    // onChange={}
                  />
                </div>
                <div className="p-2 ms-auto"></div>
                <div className="p-2"></div>
              </Stack>
              {/* STACK 7 */}
              <Stack direction="horizontal" gap={3} id='regis-stack7'>
              {/* PASSWORD */}
                <div className="p-2">
                  <div className='input-group'>
                  <label className='regis-label' htmlFor='regisPasswordInput'>PASSWORD:</label>
                  <div className='input-div'>
                    <input
                      className='input'
                      id='regisPasswordInput'
                      type={showPswd ? 'text': 'password'}
                      required
                      placeholder='PASSWORD'
                      name='password'
                      value={newUserData.password}
                      onChange={handleInputChange}
                      onFocus={() => setPasswordMsg(true)}
                      onBlur={() => setPasswordMsg(false)}
                    />
                    <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                  </div>
                  
                  </div>
                  {/* ERROR MESSAGE */}
                 {/* <div></div> */}
                </div>
                {/* ----PASSWORD MESSAGE---------- */}
                    {passwordMsg && (
                        <div className=" ms-auto">            
                        <p>WE WILL NEVER SHARE YOUR PASSWORD</p>
                      </div>
                    )}
              
                <div className="p-2 ms-auto" >
                    <Button
                      variant='warning'
                      id='showPasswordBtn'
                      type='button'
                      onClick={() => setShowPswd ((s) => !s)}
                      aria-label={showPswd ? 'Hide Password': 'Show Password'}
                      aria-pressed={showPswd}
                      aria-expanded={showPswd}
                  >
                    {showPswd ? (
                      <>
                      Hide Password
                        <EyeOff fontWeight={700} aria-hidden='true' focusable='false'/>
                      </>
                    ) : (
                      <>
                      Show Password
                        <Eye fontWeight={700} aria-hidden='true' focusable='false'/>
                      </>
                    ) }
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
        <Button
        variant='danger'
        id='clearFormBtn'
        >CLEAR FORM</Button>
      </div>
    </Stack>
        </div>
    </form>
  )
}
