import React, { useState } from 'react'
import '../css/componentCss/RegistrationForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk, Eye, EyeOff } from 'lucide-react';
import { provinces } from '../data/locations';

// Empty form shape, shared with the page that owns the state
export const emptyNewUserData = {
  username: '',
  fullName: {
    firstName: '',
    lastName: '',
  },
  email: '',
  dateOfBirth: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    province: '',
  },
  admin: false,
  profilePicture: '',
  password: '',
};

export default function RegistrationForm({
  newUserData,
  setNewUserData,
  onSubmit
}) {
  const [showPswd, setShowPswd] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(false)

  // Date of birth can never be in the future
  const today = new Date().toISOString().split('T')[0]

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    const val = type === 'checkbox' ? checked : value;

    if (name.startsWith('fullName.')) {
      const [, field] = name.split('.');
      setNewUserData((prev) => ({
        ...prev,
        fullName: { ...prev.fullName, [field]: val }
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

  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit) onSubmit(newUserData);
  };

  const handleClear = () => {
    setNewUserData(emptyNewUserData);
  };

  return (
    <form id='registration-form' onSubmit={handleSubmit} noValidate={false}>
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
            <label className='regis-label' htmlFor='regisUsernameInput'>
                USERNAME:
            </label>
            <input
                className='input'
                id='regisUsernameInput'
                placeholder='USERNAME'
                required
                minLength={3}
                maxLength={50}
                type='text'
                autoComplete='username'
                name='username'
                value={newUserData.username}
                onChange={handleInputChange}
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div id='regis-fullname-label-block'>
        <label className='regis-label' htmlFor='regisFirstName'>FULL NAME:</label>
      </div>
      <div className="p-2" id='regis-fullName-input-block'>
      <div className='input-div'>
                <label htmlFor='regisFirstName' hidden>FIRST NAME:</label>
                <input
                    className='input'
                    id='regisFirstName'
                    placeholder='FIRST NAME'
                    type='text'
                    required
                    minLength={2}
                    maxLength={50}
                    autoComplete='given-name'
                    name='fullName.firstName'
                    value={newUserData.fullName?.firstName || ''}
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
                    type='text'
                    required
                    minLength={2}
                    maxLength={50}
                    autoComplete='family-name'
                    name='fullName.lastName'
                    value={newUserData.fullName?.lastName || ''}
                    onChange={handleInputChange}
                    />
                    <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
            </div>
    </Stack>
  <Stack direction="horizontal" gap={3} id='regis-stack2'>
      <div className="p-2" id='regis-email-block'>
        <label className='regis-label' htmlFor='regisEmail'>EMAIL:</label>
            <div className='input-div'>
                <input
                    className='input'
                        id='regisEmail'
                        type='email'
                        required
                        autoComplete='email'
                        placeholder='EMAIL'
                        name='email'
                        value={newUserData.email}
                        onChange={handleInputChange}
                    />
 <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
      </div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2"></div>
    </Stack>
      <Stack direction="horizontal" gap={3} id='regis-stack3'>
      <div className="p-2" id='regis-dateOfBirth-block'>
        <label className='regis-label' htmlFor='regisDateOfBirth'>DATE OF BIRTH</label>
        <div className='input-div'>
 <input
            className='input'
            id='regisDateOfBirth'
            type='date'
            required
            max={today}
            autoComplete='bday'
            name='dateOfBirth'
            value={newUserData.dateOfBirth}
            onChange={handleInputChange}
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
<label className='regis-label' htmlFor='regisAddressLine1'>STREET ADDRESS:</label>
        <div className='input-div'>

            <textarea
                rows={3}
                className='address-text-input'
                id='regisAddressLine1'
                required
                minLength={2}
                maxLength={100}
                placeholder='STREET ADDRESS'
                name='address.line1'
                value={newUserData.address?.line1 || ''}
                onChange={handleInputChange}
            />
             <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
         <div className='input-div'>
            <label htmlFor='regisAddressLine2' hidden>ADDITIONAL ADDRESS DETAILS</label>
            <textarea
                rows={3}
                className='address-text-input'
                id='regisAddressLine2'
                maxLength={100}
                placeholder='ADDITIONAL ADDRESS DETAILS'
                name='address.line2'
                value={newUserData.address?.line2 || ''}
                onChange={handleInputChange}
                aria-required='false'
            />
        </div>
      </div>
      </div>
      <div className="p-2" id='regis-address-block2'>
        <div className='address-input-div'>
            <div className='input-div'>
             <label className='regis-label' htmlFor='regisCity'>CITY/TOWN:</label>
             <input
                className='input'
                id='regisCity'
                type='text'
                required
                minLength={2}
                maxLength={50}
                autoComplete='address-level2'
                placeholder='CITY/TOWN'
                name='address.city'
                value={newUserData.address?.city || ''}
                onChange={handleInputChange}
             />
             <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>

            </div>
            <div className='input-div'>
            <label className='regis-label' htmlFor='regisProvince'>PROVINCE:</label>
            <select
            className='input'
            id='regisProvince'
            required
            autoComplete='address-level1'
            name='address.province'
            value={newUserData.address?.province || ''}
            onChange={handleInputChange}
            >
                <option value=''>SELECT</option>
                {/* MAP ALL PROVINCES WITH SELECT AS THE PLACEHOLDER */}
                {provinces.map(({ code, name }) => (
                  <option key={code} value={name}>{name}</option>
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
                    <label className='regis-label' htmlFor='regisAdmin'>REGISTER AS ADMIN:</label>
                    <input
                      id='regisAdmin'
                      type='checkbox'
                      name='admin'
                      checked={newUserData.admin}
                      onChange={handleInputChange}
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
                  <label className='regis-label' htmlFor='regisProfilePicture'>PROFILE PICTURE:</label>
                  <input
                    className='input'
                    id='regisProfilePicture'
                    type='url'
                    placeholder='PROFILE PICTURE URL'
                    name='profilePicture'
                    value={newUserData.profilePicture}
                    onChange={handleInputChange}
                    aria-required='false'
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
                      minLength={8}
                      maxLength={1024}
                      autoComplete='new-password'
                      placeholder='PASSWORD'
                      name='password'
                      value={newUserData.password}
                      onChange={handleInputChange}
                      onFocus={() => setPasswordMsg(true)}
                      onBlur={() => setPasswordMsg(false)}
                      aria-describedby='passwordMsg'
                    />
                    <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                  </div>

                  </div>
                  {/* ERROR MESSAGE */}
                 {/* <div></div> */}
                </div>
                {/* ----PASSWORD MESSAGE---------- */}
                    {passwordMsg && (
                        <div className=" ms-auto" id='passwordMsg'>
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
                    <p className='infoMsg'>
                        <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
                    </p>
                </div>
      <div className="p-2 ms-auto">
        <Button variant='light' id='regis-Btn' type='submit'>REGISTER</Button>
      </div>
      <div className="p-2">
        <Button
        variant='danger'
        id='clearFormBtn'
        type='button'
        onClick={handleClear}
        >CLEAR FORM</Button>
      </div>
    </Stack>
        </div>
    </form>
  )
}
