import React, { useMemo, useState } from 'react'
import '../css/componentCss/RegistrationForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk, Eye, EyeOff } from 'lucide-react';
import { provinces } from '../data/locations';



export default function RegistrationForm({
  newUserData,
  setNewUserData,
  addUser
}) {
  const [showPswd, setShowPswd] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(false)
    const [touched, setTouched] = useState({
        username: false,     // Tracks if username field was touched
        firstName: false,    // Tracks if first name field was touched
        lastName: false,     // Tracks if last name field was touched
        email: false,        // Tracks if email field was touched
        dateOfBirth: false,  // Tracks if date of birth field was touched
        line1: false,     // Tracks if addressLine1 was touched
        city: false,// Tracks if address.city was touched
        province: false,// Tracks if address.province was touched
        password: false,     // Tracks if password field was touched
    })

   //========== EMPTY FIELD VALIDATION ====================
    // Checks if username is empty
    const usernameEmpty = useMemo(
        () => !String(newUserData.username || '').trim(), [newUserData.username]
    )
    // Checks if email is empty
    const emailEmpty = useMemo(
        () => !String(newUserData.email || '').trim(),[newUserData.email]
    );
    // Checks if first name is empty
    const firstNameEmpty = useMemo(
        () => !String(newUserData.fullName?.firstName || '').trim(),[newUserData.fullName?.firstName]
    );
    // Checks if last name is empty
    const lastNameEmpty = useMemo(
        () => !String(newUserData.fullName?.lastName || '').trim(), [newUserData.fullName?.lastName]
    );
     // Checks if date of birth is empty
    const dateOfBirthEmpty = useMemo(
        () => !String(newUserData.dateOfBirth || '').trim(),[newUserData.dateOfBirth]
    );
    const line1Empty = useMemo(
       () => !String(newUserData.address?.line1 || '').trim(), [newUserData.address?.line1]
    )
    const cityEmpty = useMemo(
       () => !String(newUserData.address?.city || '').trim(), [newUserData.address?.city]
    )

    const provinceEmpty = useMemo(
      () => !String(newUserData.address?.province || '').trim(), [newUserData.address?.province]
    )
   
    const passwordEmpty = useMemo(
      () => !String(newUserData.password || '').trim(),[newUserData.password]
    )

       //========== AGE VALIDATION ====================
       const minAge = newUserData.admin === true ? 21 : 18;
    // Checks whether the selected date of birth makes the user too young
    const dateOfBirthTooYoung = useMemo(() => {
        if (!newUserData.dateOfBirth) return false;// If no date of birth was selected, do not check age yet
        const dob = new Date(newUserData.dateOfBirth);// Convert the selected date of birth into a Date object
        const now = new Date();// Get the current date
        let age = now.getFullYear() - dob.getFullYear();// Calculate age based on year difference
        const m = now.getMonth() - dob.getMonth();// Calculate month difference
        // If the user's birthday has not happened yet this year,
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
            age--;// subtract 1 from the calculated age
        }
        return age < minAge;// Return true if the user is younger than the required minimum age
    }, [newUserData.dateOfBirth, minAge]);
    const showUsernameError = touched.username && usernameEmpty;
    const showFirstNameError = touched.firstName && firstNameEmpty;
    const showLastNameError = touched.lastName && lastNameEmpty;
    const showEmailError = touched.email && emailEmpty;
    const showDateOfBirthError = touched.dateOfBirth && dateOfBirthEmpty;
     const showDateOfBirthAgeError =
        touched.dateOfBirth && !dateOfBirthEmpty && dateOfBirthTooYoung;
    const showLine1Error = touched.line1 && line1Empty;
    const showCityError = touched.city && cityEmpty;
    const showProvinceError = touched.province && provinceEmpty
    const showPasswordError = touched.password && passwordEmpty;
    

    
 
  const handleRegistration = (e) => {
    e.preventDefault()
    console.log('[INFO: RegistrationForm.js]: Registering new user');
    addUser?.()
  }
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


  const handleClear = () => {
    const confirmClear = window.confirm(// Ask the user to confirm before clearing all input fields
            "Are you sure you want to clear the form?"
        );
        if (!confirmClear) return;
        setNewUserData({
            username: '',
            fullName: { firstName: '', lastName: '' },
            email: '',
            dateOfBirth: '',
            address: { 
              line1: '', 
              line2: '', 
              city : '', 
              province: '' },
            admin: false,
            profilePicture: '',
            password: '',
        });
        setTouched({
            username: false,
            firstName: false,
            lastName: false,
            email: false,
            dateOfBirth: false,
            line1: false,
            city: false,
            province: false,
            password: false,
        });
  }

   // ========= IDs USED BY aria-labelledby / aria-describedby =========
    const usernameErrorId = 'registrationUsernameError';// ID used for username error message
    const emailErrorId = 'registrationEmailError';// ID used for email error message
    const passwordHelpId = 'registrationPasswordHelp';// ID used for password help text
    const passwordErrorId = 'registrationPasswordError';// ID used for password error message
    const firstNameErrorId = 'registrationFirstNameError';// ID used for first name error message
    const lastNameErrorId = 'registrationLastNameError';// ID used for last name error message
    const dateOfBirthErrorId = 'registrationDateOfBirthError';// ID used for date of birth required error
    const dateOfBirthAgeHintId = 'registrationDateOfBirthAgeHint';// ID used for date of birth age hint
    const dateOfBirthAgeErrorId = 'registrationDateOfBirthAgeError';// ID used for date of birth age error
    const showLine1ErrorId = 'registrationAddressLine1Error';

    return (
    <form id='registration-form' method='POST' onSubmit={handleRegistration} aria-labelledby='formTitle'>
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
            {showUsernameError && (
              <p id={usernameErrorId}>Username is required</p>
            )}
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
             {/* ERROR MESSAGES */}
                  {showFirstNameError && (
                      <p id={firstNameErrorId} className="visually-hidden" role="alert">First name is required.</p>
                  )}
                  {showLastNameError && (
                      <p id={lastNameErrorId} className="visually-hidden" role="alert">Last name is required.</p>
                  )}
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
  {/* ERROR MESSAGE */}
                                {showEmailError && (
                                    <p id={emailErrorId} className="visually-hidden" role="alert">
                                        Email is required.
                                    </p>
                                )}
                            
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
      <div className="p-2">
          <small id={dateOfBirthAgeHintId} className='infoText'>
                                    Must be at least {minAge} years old
                                </small>
                                {/* ERROR MESSAGES */}
                                {showDateOfBirthError && (
                                    <p id={dateOfBirthErrorId} className="visually-hidden" role="alert">
                                        Date of birth is required.
                                    </p>
                                )}
                                {showDateOfBirthAgeError && (
                                    <p id={dateOfBirthAgeErrorId} className="visually-hidden" role="alert">
                                        You must be at least {minAge} years old to register{newUserData.admin === true ? ' as an admin' : ''}.
                                    </p>
                                )}
      </div>
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
            {showLine1Error && (
              <p id={showLine1ErrorId} className='visually-hidden'></p>
            )}
            {/* Address City error */}
            {/* address province error */}
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
                        // ARIA ATTRIBUTES:
                                aria-label='Registration Password'
                                aria-required='true'
                                aria-invalid={passwordEmpty ? 'true' : 'false'}
                                aria-describedby={showPasswordError ? passwordErrorId : passwordHelpId}
                    />
                    <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                  </div>

                  </div>
                  {/* ERROR MESSAGE */}
                   {showPasswordError && (
                                <p id={passwordErrorId} className="visually-hidden" role="alert">Password is required.</p>
                            )}
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
