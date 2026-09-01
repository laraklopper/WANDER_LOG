import React, { useMemo, useState } from 'react'
import '../css/componentCss/RegistrationForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk, Bug, Eye, EyeOff, MapPinHouse, FileUser   } from 'lucide-react';
import { provinces } from '../data/locations';

// Mirrors the email pattern used by the server (userSchema.js) so the client
// rejects the same addresses the API would reject.
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* The empty form used by the clear button when the page does not supply one.
Kept in sync with EMPTY_FORM in pages/Register.js, which is passed in as a prop */
const BLANK_FORM = {
  username: '',
  fullName: { firstName: '', lastName: '' },
  email: '',
  dateOfBirth: '',
  address: { line1: '', line2: '', city: '', province: '' },
  admin: false,
  profilePicture: '',
  password: '',
  confirmPassword: '',
};

export default function RegistrationForm({
  newUserData,
  setNewUserData,
  addUser,
  // True while the registration request is in flight, set by the Register page
  submitting = false,
  /* Field keyed messages from the server, for rules the browser cannot check,
  such as a username already being taken or a province not being recognised */
  fieldErrors = {},
  emptyForm = BLANK_FORM
}) {
  const [showPswd, setShowPswd] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(false)
  const [formError, setFormError] = useState(null)// Form level error shown above the submit button
  const [touched, setTouched] = useState({
    username: false,       // Tracks if username field was touched
    firstName: false,      // Tracks if first name field was touched
    lastName: false,       // Tracks if last name field was touched
    email: false,          // Tracks if email field was touched
    dateOfBirth: false,    // Tracks if date of birth field was touched
    line1: false,          // Tracks if addressLine1 was touched
    city: false,           // Tracks if address.city was touched
    province: false,       // Tracks if address.province was touched
    password: false,       // Tracks if password field was touched
    confirmPassword: false,// Tracks if confirm password field was touched
  })

  // Marks a single field as touched so its error message may be announced
  const markTouched = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Marks every field as touched, used when the form is submitted
  const markAllTouched = () =>
    setTouched({
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      dateOfBirth: true,
      line1: true,
      city: true,
      province: true,
      password: true,
      confirmPassword: true,
    });

  //========== EMPTY FIELD VALIDATION ====================
  // Checks if username is empty
  const usernameEmpty = useMemo(
    () => !String(newUserData.username || '').trim(), [newUserData.username]
  )
  // Checks if email is empty
  const emailEmpty = useMemo(
    () => !String(newUserData.email || '').trim(), [newUserData.email]
  );
  // Checks if first name is empty
  const firstNameEmpty = useMemo(
    () => !String(newUserData.fullName?.firstName || '').trim(), [newUserData.fullName?.firstName]
  );
  // Checks if last name is empty
  const lastNameEmpty = useMemo(
    () => !String(newUserData.fullName?.lastName || '').trim(), [newUserData.fullName?.lastName]
  );
  // Checks if date of birth is empty
  const dateOfBirthEmpty = useMemo(
    () => !String(newUserData.dateOfBirth || '').trim(), [newUserData.dateOfBirth]
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
    () => !String(newUserData.password || '').trim(), [newUserData.password]
  )
  // Checks if the confirm password field is empty
  const confirmPasswordEmpty = useMemo(
    () => !String(newUserData.confirmPassword || '').trim(), [newUserData.confirmPassword]
  )

  //========== FORMAT VALIDATION ====================
  /* type='email' only asks for "something@something", the server also
  requires a dot in the domain, so the stricter rule is checked here too */
  const emailInvalid = useMemo(
    () => !emailEmpty && !emailRegex.test(String(newUserData.email).trim()),
    [emailEmpty, newUserData.email]
  );
  // Server requires at least 8 characters
  const passwordTooShort = useMemo(
    () => !passwordEmpty && String(newUserData.password).trim().length < 8,
    [passwordEmpty, newUserData.password]
  );
  /* The browser cannot compare two fields, so the match is checked here.
  Compared untrimmed, because the password is sent exactly as typed */
  const passwordMismatch = useMemo(
    () =>
      !passwordEmpty &&
      !confirmPasswordEmpty &&
      String(newUserData.password) !== String(newUserData.confirmPassword),
    [passwordEmpty, confirmPasswordEmpty, newUserData.password, newUserData.confirmPassword]
  );

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
  const showEmailFormatError = touched.email && emailInvalid;
  const showDateOfBirthError = touched.dateOfBirth && dateOfBirthEmpty;
  const showDateOfBirthAgeError =
    touched.dateOfBirth && !dateOfBirthEmpty && dateOfBirthTooYoung;
  const showLine1Error = touched.line1 && line1Empty;
  const showCityError = touched.city && cityEmpty;
  const showProvinceError = touched.province && provinceEmpty
  const showPasswordError = touched.password && passwordEmpty;
  const showPasswordLengthError = touched.password && passwordTooShort;
  const showConfirmPasswordError = touched.confirmPassword && confirmPasswordEmpty;
  const showPasswordMismatchError = touched.confirmPassword && passwordMismatch;

  /* Only the rules the browser cannot enforce on its own are checked here.
  Empty, minLength and type constraints are still handled by the native
  validation on each input, which blocks submit before this runs. */
  const handleRegistration = (e) => {
    e.preventDefault()
    // Ignored while a request is already running, so the form cannot double post
    if (submitting) return
    markAllTouched()

    if (dateOfBirthTooYoung) {
      const message = `You must be at least ${minAge} years old to register${newUserData.admin === true ? ' as an admin' : ''}.`;
      setFormError(message)
      console.warn(`[WARN: RegistrationForm.js]: ${message}`)
      document.getElementById('regisDateOfBirth')?.focus()
      return
    }
    if (emailInvalid) {
      setFormError('Please enter a valid email address, for example name@example.com.')
      document.getElementById('regisEmail')?.focus()
      return
    }
    if (passwordMismatch) {
      setFormError('Passwords do not match.')
      console.warn('[WARN: RegistrationForm.js]: Passwords do not match')
      document.getElementById('regisConfirmPasswordInput')?.focus()
      return
    }

    setFormError(null)
    console.log('[INFO: RegistrationForm.js]: Registering new user');
    addUser?.()
  }
  // Date of birth can never be in the future
  const today = new Date().toISOString().split('T')[0]

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    const val = type === 'checkbox' ? checked : value;

    setFormError(null);// Any edit clears the form level error

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
    // Reset to the same empty shape the page initialised the form with
    setNewUserData(emptyForm);
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
      confirmPassword: false,
    });
    setFormError(null);
    setShowPswd(false);
  }

  // ========= IDs USED BY aria-labelledby / aria-describedby =========
  const usernameErrorId = 'registrationUsernameError';// ID used for username error message
  const emailErrorId = 'registrationEmailError';// ID used for email error message
  const emailFormatErrorId = 'registrationEmailFormatError';// ID used for invalid email error message
  const passwordHelpId = 'registrationPasswordHelp';// ID used for password help text
  const passwordErrorId = 'registrationPasswordError';// ID used for password error message
  const passwordLengthErrorId = 'registrationPasswordLengthError';// ID used for short password error message
  const confirmPasswordErrorId = 'registrationConfirmPasswordError';// ID used for confirm password required error
  const passwordMismatchErrorId = 'registrationPasswordMismatchError';// ID used for the passwords do not match error
  const firstNameErrorId = 'registrationFirstNameError';// ID used for first name error message
  const lastNameErrorId = 'registrationLastNameError';// ID used for last name error message
  const dateOfBirthErrorId = 'registrationDateOfBirthError';// ID used for date of birth required error
  const dateOfBirthAgeHintId = 'registrationDateOfBirthAgeHint';// ID used for date of birth age hint
  const dateOfBirthAgeErrorId = 'registrationDateOfBirthAgeError';// ID used for date of birth age error
  const line1ErrorId = 'registrationAddressLine1Error';// ID used for street address error message
  const line2HelpId = 'registrationAddressLine2Help';// ID used for the optional street address hint
  const cityErrorId = 'registrationAddressCityError';// ID used for city error message
  const provinceErrorId = 'registrationAddressProvinceError';// ID used for province error message
  const profilePictureHelpId = 'registrationProfilePictureHelp';// ID used for the optional profile picture hint
  const formErrorId = 'registrationFormError';// ID used for the form level error message

  const serverErrorId = 'registrationServerErrors';// ID used for the block listing the server's field errors

  // Joins the IDs that are currently rendered into a single aria-describedby value
  const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

  /* The server returns its errors keyed by schema path, so a nested field
  arrives as 'address.province' or 'fullName.firstName'. Listed as entries for
  rendering, and looked up by path to mark the matching input invalid */
  const serverErrors = Object.entries(fieldErrors || {});
  const hasServerError = (path) => Boolean(fieldErrors?.[path]);

  //==============JSX RENDERING==================
  return (
    <form id='registration-form' method='POST' onSubmit={handleRegistration} aria-labelledby='formTitle'>
      <p className='visually-hidden' id='formTitle'>REGISTRATION FORM</p>
      <div id='formHeadingBlock'>
        <h3 id='formHeading'>SIGN UP</h3>
      </div>
      {/* =============INPUT================== */}
      <div id='regis-input-div'>
        {/* GROUP 1: USERNAME + FULL NAME + EMAIL + DATE OF BIRTH */}
        <div id='regis-group1' aria-labelledby='regis-personal-info-heading'>
          <span id='regis-personal-info-heading-span' className='formSectionHeadingSpan visually-hidden'>
            <h5 className='formSectionHeading' id='regis-personal-info-heading'>PERSONAL INFORMATION <FileUser fontSize={20}  aria-hidden='true' focusable='false' /></h5>
          </span>
          {/* STACK1 */}
          <Stack direction="horizontal" gap={3} id='regis-stack1'>
            <div className="p-2">
              {/* USERNAME INPUT: value={newUserData.username} */}
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
                  onBlur={() => markTouched('username')}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showUsernameError || hasServerError('username') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    showUsernameError && usernameErrorId,
                    hasServerError('username') && serverErrorId
                  )}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
              {/* USERNAME ERROR MESSAGE */}
              {showUsernameError && (
                <p id={usernameErrorId} className='visually-hidden' role='alert'>Username is required.</p>
              )}
            </div>
            {/* FULL NAME INPUT: firstName + lastName */}
            <div id='regis-fullname-label-block'>
              <label className='regis-label' htmlFor='regisFirstName'>FULL NAME:</label>
            </div>
            <div className="p-2" id='regis-fullName-input-block'>
              {/* FIRST NAME: value={newUserData.fullName?.firstName || ''} */}
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
                  onBlur={() => markTouched('firstName')}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showFirstNameError ? 'true' : 'false'}
                  aria-describedby={describedBy(showFirstNameError && firstNameErrorId)}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
              {/* LAST NAME: value={newUserData.fullName?.lastName || ''} */}
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
                  onBlur={() => markTouched('lastName')}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showLastNameError ? 'true' : 'false'}
                  aria-describedby={describedBy(showLastNameError && lastNameErrorId)}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
              {/* FIRST NAME ERROR MESSAGES */}
              {showFirstNameError && (
                <p id={firstNameErrorId} className="visually-hidden" role="alert">First name is required.</p>
              )}
              {/* LAST NAME ERROR MESSAGES */}
              {showLastNameError && (
                <p id={lastNameErrorId} className="visually-hidden" role="alert">Last name is required.</p>
              )}
            </div>
          </Stack>
          <Stack direction="horizontal" gap={3} id='regis-stack2'>
            {/* EMAIL INPUT: value={newUserData.email} */}
            <div className="p-2" id='regis-email-block'>
              <label className='regis-label' htmlFor='regisEmail'>EMAIL:</label>
              <div className='input-div'>
                <input
                  className='input'
                  id='regisEmail'
                  type='email'
                  required
                  maxLength={254}
                  autoComplete='email'
                  placeholder='EMAIL'
                  name='email'
                  value={newUserData.email}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('email')}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showEmailError || showEmailFormatError || hasServerError('email') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    showEmailError && emailErrorId,
                    showEmailFormatError && emailFormatErrorId,
                    hasServerError('email') && serverErrorId
                  )}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
            </div>
            <div className="p-2 ms-auto"></div>
            <div className="p-2">
              {/* EMAIL ERROR MESSAGES*/}
              {showEmailError && (
                <p id={emailErrorId} className="visually-hidden" role="alert">
                  Email is required.
                </p>
              )}
              {showEmailFormatError && (
                <p id={emailFormatErrorId} className='formErrorMessage' role='alert'>
                  <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                  Enter a valid email address
                </p>
              )}
            </div>
          </Stack>
          {/* STACK 3: DATE OF BIRTH */}
          <Stack direction="horizontal" gap={3} id='regis-stack3'>
            {/* DATE OF BIRTH INPUT: value={newUserData.dateOfBirth} */}
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
                  onBlur={() => markTouched('dateOfBirth')}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showDateOfBirthError || showDateOfBirthAgeError || hasServerError('dateOfBirth') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    dateOfBirthAgeHintId,
                    showDateOfBirthError && dateOfBirthErrorId,
                    showDateOfBirthAgeError && dateOfBirthAgeErrorId,
                    hasServerError('dateOfBirth') && serverErrorId
                  )}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>

            </div>
            <div className="p-2  ms-auto"></div>
            <div className="p-2">
              {/* DATE OF BIRTH AGE HINT */}
              <small id={dateOfBirthAgeHintId} className='infoText'>
                Must be at least {minAge} years old
              </small>
              {/* DATE OF BIRTH ERROR MESSAGES */}
              {showDateOfBirthError && (
                <p id={dateOfBirthErrorId} className="visually-hidden" role="alert">
                  Date of birth is required.
                </p>
              )}
              {/* The browser cannot check age, so this error is shown on screen too */}
              {showDateOfBirthAgeError && (
                <p id={dateOfBirthAgeErrorId} className='formErrorMessage' role="alert">
                  <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                  You must be at least {minAge} years old to register{newUserData.admin === true ? ' as an admin' : ''}.
                </p>
              )}
            </div>
          </Stack>
        </div>
        {/* GROUP 2: ADDRESS */}
        <div id='regis-group2'>
          {/* STACK 4: ADDRESS */}
          <Stack gap={3} id='regis-stack4'>
            <div className="p-2" id='regis-address-heading-block'>
              <span id='regis-address-heading-span'>
                <h5 className='formSectionHeading' id='regis-address-heading'>ADDRESS</h5><MapPinHouse fontSize={20}  aria-hidden='true' focusable='false' />
              </span>
            </div>
            {/* ADDRESS: LINE 1 + OPTIONAL additional details */}
            <div className="p-2" id='regis-address-block1'>
              <div className='text-input-div'>
                {/* STREET ADDRESS INPUT: value={newUserData.address?.line1 || ''} */}
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
                    onBlur={() => markTouched('line1')}
                    // ARIA ATTRIBUTES:
                    aria-required='true'
                    aria-invalid={showLine1Error ? 'true' : 'false'}
                    aria-describedby={describedBy(showLine1Error && line1ErrorId)}
                  />
                  <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                </div>
                {/* ADDITIONAL ADDRESS DETAILS: value={newUserData.address?.line2 || ''} */}
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
                    aria-describedby={line2HelpId}
                  />
                  <small id={line2HelpId} className='visually-hidden'>Optional</small>
                </div>
              </div>
            </div>
            {/* ADDRESS: CITY/TOWN + PROVINCE */}
            <div className="p-2" id='regis-address-block2'>
              <div className='address-input-div'>
                {/* CITY/TOWN INPUT: value={newUserData.address?.city || ''} */}
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
                    onBlur={() => markTouched('city')}
                    // ARIA ATTRIBUTES:
                    aria-required='true'
                    aria-invalid={showCityError ? 'true' : 'false'}
                    aria-describedby={describedBy(showCityError && cityErrorId)}
                  />
                  <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                </div>
                {/* PROVINCE INPUT: value={newUserData.address?.province || ''} */}
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
                    onBlur={() => markTouched('province')}
                    // ARIA ATTRIBUTES:
                    aria-required='true'
                    aria-invalid={showProvinceError || hasServerError('address.province') ? 'true' : 'false'}
                    aria-describedby={describedBy(
                      showProvinceError && provinceErrorId,
                      hasServerError('address.province') && serverErrorId
                    )}
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
              {/* Address line 1 error */}
              {showLine1Error && (
                <p id={line1ErrorId} className='visually-hidden' role='alert'>Street address is required.</p>
              )}
              {/* Address City error */}
              {showCityError && (
                <p id={cityErrorId} className='visually-hidden' role='alert'>City or town is required.</p>
              )}
              {/* Address province error */}
              {showProvinceError && (
                <p id={provinceErrorId} className='visually-hidden' role='alert'>Province is required.</p>
              )}
            </div>
          </Stack>
        </div>
        {/* GROUP 3: OPTIONAL ADMIN, OPTIONAL PROFILE PICTURE, PASSWORD */}
        <div id='regis-group3' aria-describedby='regis-optionalinput-password'>
          {/* ----Screen Reader text---- */}
          {/* STACK 5 */}
          {/* ---------Screen reader text---------- */}
          <div id='regis-optional-heading-block' className='p-2 visually-hidden'>
            <h5 className='formSectionHeading' id='regis-optionalinput-password'>OPTIONAL DETAILS AND PASSWORD</h5>
          </div>
          {/* STACK 5: ADMIN CHECKBOX */}
          <Stack direction="horizontal" gap={3} id='regis-stack5'>
            <div className="p-2" id='regis-admin-block'>
              {/* ADMIN CHECKBOX: checked={newUserData.admin} */}
              <div className='input-div' id='regis-admin-input-group'>
                <label className='regis-label' htmlFor='regisAdmin'>REGISTER AS ADMIN:</label>
                <input
                  id='regisAdmin'
                  type='checkbox'
                  name='admin'
                  checked={newUserData.admin}
                  onChange={handleInputChange}
                  aria-required='false'
                />
              </div>
            </div>
            <div className="p-2 ms-auto"></div>
            <div className="p-2">
              {/* ADMIN REQUIREMENT TEXT */}
              <p id='regis-admin-text' className='form-text'>
                ADMIN USERS MUST BE AT LEAST 21 YEARS OLD
              </p>
            </div>
          </Stack>
          {/* STACK 6 */}
          <Stack direction="horizontal" gap={3} id='regis-stack6'>
            <div className="p-2" id='regis-profilepic-block'>
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
                aria-describedby={profilePictureHelpId}
              />
              <small id={profilePictureHelpId}>Optional, must be a full URL</small>
            </div>
            <div className="p-2 ms-auto"></div>
            <div className="p-2"></div>
          </Stack>
          {/* STACK 7 */}
          <Stack direction="horizontal" gap={3} id='regis-stack7'>
            {/* PASSWORD */}
            <div className="p-2" id='regis-password-block'>
              <div id='regis-pswd-input-group'>
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
                    onBlur={() => {
                      setPasswordMsg(false)
                      markTouched('password')
                    }}
                    // ARIA ATTRIBUTES:
                    aria-label='Registration Password'
                    aria-required='true'
                    aria-invalid={showPasswordError || showPasswordLengthError ? 'true' : 'false'}
                    aria-describedby={describedBy(
                      showPasswordError && passwordErrorId,
                      showPasswordLengthError && passwordLengthErrorId,
                      passwordMsg && passwordHelpId
                    )}
                  />
                  <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                </div>
                {/* CONFIRM PASSWORD */}
                <label className='regis-label' htmlFor='regisConfirmPasswordInput'>CONFIRM PASSWORD:</label>
                <div className='input-div'>
                  <input
                    className='input'
                    id='regisConfirmPasswordInput'
                    type={showPswd ? 'text': 'password'}
                    required
                    minLength={8}
                    maxLength={1024}
                    autoComplete='new-password'
                    placeholder='CONFIRM PASSWORD'
                    name='confirmPassword'
                    value={newUserData.confirmPassword || ''}
                    onChange={handleInputChange}
                    onBlur={() => markTouched('confirmPassword')}
                    // ARIA ATTRIBUTES:
                    aria-label='Confirm Registration Password'
                    aria-required='true'
                    aria-invalid={showConfirmPasswordError || showPasswordMismatchError ? 'true' : 'false'}
                    aria-describedby={describedBy(
                      showConfirmPasswordError && confirmPasswordErrorId,
                      showPasswordMismatchError && passwordMismatchErrorId
                    )}
                  />
                  <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                </div>

              </div>
              {/* PASSWORD ERROR MESSAGES */}
              {showPasswordError && (
                <p id={passwordErrorId} className="visually-hidden" role="alert">Password is required.</p>
              )}
              {/* PASSWORD LENGTH ERROR */}
              {showPasswordLengthError && (
                <p id={passwordLengthErrorId} className="visually-hidden" role="alert">Password must be at least 8 characters long.</p>
              )}
              {/* CONFIRM PASSWORD ERROR */}
              {showConfirmPasswordError && (
                <p id={confirmPasswordErrorId} className="visually-hidden" role="alert">Please confirm your password.</p>
              )}
              {/* The browser cannot compare two fields, so this error is shown on screen too */}
              {showPasswordMismatchError && (
                <p id={passwordMismatchErrorId} className='formErrorMessage' role="alert">
                  <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                  Passwords do not match
                </p>
              )}
            </div>
            {/* ----PASSWORD MESSAGE---------- */}
            {passwordMsg && (
              <div className=" ms-auto" id={passwordHelpId} aria-live='polite'>
                <p className='formHelpMessage'>WE WILL NEVER SHARE YOUR PASSWORD</p>
              </div>
            )}
            {/* SHOW/HIDE PASSWORD BUTTON BLOCK */}
            <div className="p-2 ms-auto" id='regis-showPasswordBtn-block'>
              {/* SHOW/HIDE PASSWORD BUTTON */}
              <Button
                variant='warning'
                id='showPasswordBtn'
                type='button'
                onClick={() => setShowPswd ((s) => !s)}
                // ARIA ATTRIBUTES:
                aria-label={showPswd ? 'Hide both password fields': 'Show both password fields'}
                aria-pressed={showPswd}
                aria-controls='regisPasswordInput regisConfirmPasswordInput'
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
      {/* FORM LEVEL ERROR, raised by handleRegistration when submit is blocked */}
      {formError && (
        <div id={formErrorId} className='formErrorBlock' role='alert' aria-live='assertive'>
          <p className='formErrorMessage'>
            <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
            {formError}
          </p>
        </div>
      )}
      {/* SERVER SIDE FIELD ERRORS, returned when the API rejects the submission.
      These are rules the browser cannot check on its own, such as a username
      already being taken, so they can only be reported after a round trip */}
      {serverErrors.length > 0 && (
        <div id={serverErrorId} className='formErrorBlock' role='alert' aria-live='assertive'>
          {serverErrors.map(([field, message]) => (
            <p key={field} className='formErrorMessage'>
              <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
              {message}
            </p>
          ))}
        </div>
      )}
      {/* GROUP 4: REQUIRED FIELDS MESSAGES AND SUBMISSION BUTTONS */}
      <div id='regis-group4'>
        <Stack direction="horizontal" gap={3} id='regis-stack8'>
          {/* REQUIRED INFO MESSAGE*/}
          <div className="p-2" id='requiredInfo'>
            <p className='infoMsg'>
              <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
            </p>
          </div>
          <div className="p-2 ms-auto">
            <Button
              variant='light'
              id='regis-Btn'
              type='submit'
              // Disabled while the request runs, so the form cannot be submitted twice
              disabled={submitting}
              // ARIA ATTRIBUTES:
              aria-label={submitting ? 'Registering, please wait' : 'Register new user'}
              aria-disabled={submitting}
              aria-busy={submitting}
              aria-describedby={describedBy(
                formError && formErrorId,
                serverErrors.length > 0 && serverErrorId
              )}
            >{submitting ? 'REGISTERING...' : 'REGISTER'}</Button>
          </div>
          <div className="p-2">
            {/* CLEAR FORM BUTTON */}
            <Button
              variant='danger'
              id='clearFormBtn'
              type='button'
              disabled={submitting}
              onClick={handleClear}
              // ARIA ATTRIBUTES:
              aria-label='Clear registration form'
              aria-disabled={submitting}
            >CLEAR FORM</Button>
          </div>
        </Stack>
      </div>
    </form>
  )
}
