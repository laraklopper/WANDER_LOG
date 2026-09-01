import React, { useMemo, useState } from 'react'
import '../css/componentCss/EditUserForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk, Bug } from 'lucide-react';
import { provinces } from '../data/locations';

/* Mirrors the email pattern used by the server (userSchema.js) so the client
rejects the same addresses the API would reject */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* province is stored on the address as a plain string, and the schema enum is
built from the same list, so the two can only disagree if the user edits the
select by hand */
const provinceNames = provinces.map(({ name }) => name);

export default function EditUserForm({
  currentUser,
  editUser,
  editUserData,
  setEditUserData,
  // True while the update request is in flight, set by the Profile page
  submitting = false,
  /* Field keyed messages from the server, for rules the browser cannot check,
  such as a username or email already being taken */
  fieldErrors = {},
}) {
  const [emailMsg, setEmailMsg] = useState(false)
  const [formError, setFormError] = useState(null)// Form level error shown above the submit button
  const [touched, setTouched] = useState({
    username: false,      // Tracks if username field was touched
    firstName: false,     // Tracks if first name field was touched
    lastName: false,      // Tracks if last name field was touched
    email: false,         // Tracks if email field was touched
    profilePicture: false,// Tracks if profile picture field was touched
    line1: false,         // Tracks if address.line1 was touched
    line2: false,         // Tracks if address.line2 was touched
    city: false,          // Tracks if address.city was touched
    province: false,      // Tracks if address.province was touched
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
      profilePicture: true,
      line1: true,
      line2: true,
      city: true,
      province: true,
    });

  /* The saved account, flattened to the same keys the touched map uses.
  Used by the reset button, and to work out whether anything was actually
  changed, which an edit form has to know and a registration form does not */
  const savedValues = useMemo(() => ({
    username: currentUser?.username || '',
    firstName: currentUser?.fullName?.firstName || '',
    lastName: currentUser?.fullName?.lastName || '',
    email: currentUser?.email || '',
    profilePicture: currentUser?.profilePicture || '',
    line1: currentUser?.address?.line1 || '',
    line2: currentUser?.address?.line2 || '',
    city: currentUser?.address?.city || '',
    province: currentUser?.address?.province || '',
  }), [currentUser]);

  // The same nine values as they currently stand in the form
  const currentValues = useMemo(() => ({
    username: editUserData?.username || '',
    firstName: editUserData?.fullName?.firstName || '',
    lastName: editUserData?.fullName?.lastName || '',
    email: editUserData?.email || '',
    profilePicture: editUserData?.profilePicture || '',
    line1: editUserData?.address?.line1 || '',
    line2: editUserData?.address?.line2 || '',
    city: editUserData?.address?.city || '',
    province: editUserData?.address?.province || '',
  }), [editUserData]);

  //========== EMPTY FIELD VALIDATION ====================
  /* line2 and profilePicture are left out, both are optional on the schema and
  clearing them is a valid edit */
  const usernameEmpty = useMemo(
    () => !currentValues.username.trim(), [currentValues.username]
  );
  const firstNameEmpty = useMemo(
    () => !currentValues.firstName.trim(), [currentValues.firstName]
  );
  const lastNameEmpty = useMemo(
    () => !currentValues.lastName.trim(), [currentValues.lastName]
  );
  const emailEmpty = useMemo(
    () => !currentValues.email.trim(), [currentValues.email]
  );
  const line1Empty = useMemo(
    () => !currentValues.line1.trim(), [currentValues.line1]
  );
  const cityEmpty = useMemo(
    () => !currentValues.city.trim(), [currentValues.city]
  );
  const provinceEmpty = useMemo(
    () => !currentValues.province.trim(), [currentValues.province]
  );

  //========== FORMAT VALIDATION ====================
  // Schema requires 3 to 50 characters
  const usernameTooShort = useMemo(
    () => !usernameEmpty && currentValues.username.trim().length < 3,
    [usernameEmpty, currentValues.username]
  );
  /* type='email' only asks for "something@something", the server also
  requires a dot in the domain, so the stricter rule is checked here too */
  const emailInvalid = useMemo(
    () => !emailEmpty && !emailRegex.test(currentValues.email.trim()),
    [emailEmpty, currentValues.email]
  );
  /* type='url' accepts any scheme, including mailto: and javascript:, so the
  value is parsed here and limited to the two schemes a browser can render in
  an <img> */
  const profilePictureInvalid = useMemo(() => {
    const value = currentValues.profilePicture.trim();
    if (!value) return false;// Optional, so a blank field is not an error
    try {
      const { protocol } = new URL(value);
      return protocol !== 'http:' && protocol !== 'https:';
    } catch {
      return true;// Not a URL at all
    }
  }, [currentValues.profilePicture]);
  /* The optional fields still carry a minimum length on the schema, so a single
  character in line 2 is rejected by the server even though leaving it blank is fine */
  const line2TooShort = useMemo(
    () => currentValues.line2.trim().length === 1, [currentValues.line2]
  );
  /* Only reachable if the select is edited by hand, but the schema enum would
  reject it as a 400, so it is caught before the request is sent */
  const provinceInvalid = useMemo(
    () => !provinceEmpty && !provinceNames.includes(currentValues.province.trim()),
    [provinceEmpty, currentValues.province]
  );

  //========== UNCHANGED FORM ====================
  /* A PATCH that changes nothing is a wasted round trip, and reporting a
  success the user cannot see is worse than saying there was nothing to save */
  const noChanges = useMemo(
    () => Object.keys(savedValues).every(
      (key) => savedValues[key].trim() === currentValues[key].trim()
    ),
    [savedValues, currentValues]
  );

  const showUsernameError = touched.username && usernameEmpty;
  const showUsernameLengthError = touched.username && usernameTooShort;
  const showFirstNameError = touched.firstName && firstNameEmpty;
  const showLastNameError = touched.lastName && lastNameEmpty;
  const showEmailError = touched.email && emailEmpty;
  const showEmailFormatError = touched.email && emailInvalid;
  const showProfilePictureError = touched.profilePicture && profilePictureInvalid;
  const showLine1Error = touched.line1 && line1Empty;
  const showLine2LengthError = touched.line2 && line2TooShort;
  const showCityError = touched.city && cityEmpty;
  const showProvinceError = touched.province && provinceEmpty;
  const showProvinceInvalidError = touched.province && provinceInvalid;

  /* Only the rules the browser cannot enforce on its own are checked here.
  Empty, minLength and type constraints are still handled by the native
  validation on each input, which blocks submit before this runs */
  const handleSubmit = (e) => {
    e.preventDefault()
    // Ignored while a request is already running, so the form cannot double post
    if (submitting) return
    markAllTouched()

    if (emailInvalid) {
      setFormError('Please enter a valid email address, for example name@example.com.')
      document.getElementById('editUserEmail')?.focus()
      return
    }
    if (profilePictureInvalid) {
      setFormError('Profile picture must be a full URL starting with http:// or https://.')
      document.getElementById('editProfilePic')?.focus()
      return
    }
    if (provinceInvalid) {
      setFormError(`${currentValues.province} is not a valid South African province.`)
      document.getElementById('editProvince')?.focus()
      return
    }
    if (noChanges) {
      setFormError('No changes to save. Edit a field before submitting.')
      console.warn('[WARN: EditUserForm.js]: Submit blocked, nothing was changed')
      document.getElementById('editUsername')?.focus()
      return
    }

    setFormError(null)
    console.log('[INFO: EditUserForm.js]: Saving profile changes');
    editUser?.()
  }

  /* Nested paths are written as 'fullName.firstName' and 'address.city' on the
  name attribute, so one handler can update either level of editUserData */
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormError(null);// Any edit clears the form level error

    if (name.startsWith('fullName.')) {
      const [, field] = name.split('.');
      setEditUserData((prev) => ({
        ...prev,
        fullName: { ...prev.fullName, [field]: value }
      }));
      return;
    }
    if (name.startsWith('address.')) {
      const [, field] = name.split('.');
      setEditUserData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
      return;
    }
    setEditUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* Resets to the saved account rather than to a blank form. Every field except
  line 2 and the picture is required, so emptying them would only leave a form
  that cannot be submitted */
  const handleReset = () => {
    const confirmReset = window.confirm(
      'Discard your changes and restore your saved details?'
    );
    if (!confirmReset) return;

    setEditUserData({
      username: savedValues.username,
      fullName: {
        firstName: savedValues.firstName,
        lastName: savedValues.lastName,
      },
      email: savedValues.email,
      profilePicture: savedValues.profilePicture,
      address: {
        line1: savedValues.line1,
        line2: savedValues.line2,
        city: savedValues.city,
        province: savedValues.province,
      },
    });
    setTouched({
      username: false,
      firstName: false,
      lastName: false,
      email: false,
      profilePicture: false,
      line1: false,
      line2: false,
      city: false,
      province: false,
    });
    setFormError(null);
  };

  // ========= IDs USED BY aria-describedby =========
  const usernameErrorId = 'editUserUsernameError';// ID used for username required error
  const usernameLengthErrorId = 'editUserUsernameLengthError';// ID used for short username error
  const firstNameErrorId = 'editUserFirstNameError';// ID used for first name error message
  const lastNameErrorId = 'editUserLastNameError';// ID used for last name error message
  const emailErrorId = 'editUserEmailError';// ID used for email required error
  const emailFormatErrorId = 'editUserEmailFormatError';// ID used for invalid email error
  const emailHelpId = 'editUserEmailHelp';// ID used for the email privacy note
  const profilePictureHelpId = 'editUserProfilePictureHelp';// ID used for the profile picture hint
  const profilePictureErrorId = 'editUserProfilePictureError';// ID used for invalid picture URL error
  const line1ErrorId = 'editUserAddressLine1Error';// ID used for street address error
  const line2HelpId = 'editUserAddressLine2Help';// ID used for the optional line 2 hint
  const line2LengthErrorId = 'editUserAddressLine2LengthError';// ID used for short line 2 error
  const cityErrorId = 'editUserAddressCityError';// ID used for city error message
  const provinceErrorId = 'editUserAddressProvinceError';// ID used for province required error
  const provinceInvalidErrorId = 'editUserAddressProvinceInvalidError';// ID used for unknown province error
  const formErrorId = 'editUserFormError';// ID used for the form level error message
  const serverErrorId = 'editUserServerErrors';// ID used for the block listing the server's field errors

  // Joins the IDs that are currently rendered into a single aria-describedby value
  const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

  /* The server returns its errors keyed by schema path, so a nested field
  arrives as 'address.province' or 'fullName.firstName'. Listed as entries for
  rendering, and looked up by path to mark the matching input invalid */
  const serverErrors = Object.entries(fieldErrors || {});
  const hasServerError = (path) => Boolean(fieldErrors?.[path]);

  //==============JSX RENDERING==================
  return (
    /* No method attribute, a form element only accepts GET or POST and the
    PATCH is sent by editUser rather than by the browser */
    <form id='edit-profile-form' onSubmit={handleSubmit} aria-labelledby='formHeading'>
      <div id='formHeadingBlock'>
        <h3 id='formHeading'>EDIT USER</h3>
      </div>
      <div id='edit-user-input'>
        <div id='edit-profile-group1'>
          <Stack gap={3} id='edit-user-stack1'>
            {/* USERNAME INPUT */}
            <div className="p-2" id='edit-username-block'>
              <label className='edit-profile-label' htmlFor='editUsername'>USERNAME:</label>
              <div className='input-div'>
                <input
                  type='text'
                  className='input'
                  id='editUsername'
                  placeholder='USERNAME'
                  required
                  minLength={3}
                  maxLength={50}
                  autoComplete='username'
                  name='username'
                  value={editUserData.username}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('username')}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showUsernameError || showUsernameLengthError || hasServerError('username') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    showUsernameError && usernameErrorId,
                    showUsernameLengthError && usernameLengthErrorId,
                    hasServerError('username') && serverErrorId
                  )}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
              <div>
                {/* USERNAME ERROR MESSAGES */}
                {showUsernameError && (
                  <p id={usernameErrorId} className='visually-hidden' role='alert'>Username is required.</p>
                )}
                {showUsernameLengthError && (
                  <p id={usernameLengthErrorId} className='formErrorMessage' role='alert'>
                    <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                    Username must be at least 3 characters
                  </p>
                )}
              </div>
            </div>
            {/* FULL NAME INPUT: firstName + lastName */}
            <div id='edit-user-fullname-block' className='p-2'>
              <label className='edit-profile-label' htmlFor='editFirstName'>FULL NAME</label>
              <div className='input-div'>
                <label htmlFor='editFirstName' className='edit-profile-label' hidden>EDIT FIRST NAME:</label>
                <input
                  type='text'
                  className='input'
                  id='editFirstName'
                  placeholder='FIRST NAME'
                  required
                  minLength={2}
                  maxLength={50}
                  autoComplete='given-name'
                  name='fullName.firstName'
                  value={editUserData.fullName?.firstName || ''}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('firstName')}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showFirstNameError ? 'true' : 'false'}
                  aria-describedby={describedBy(showFirstNameError && firstNameErrorId)}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
              <div className='input-div'>
                <label htmlFor='editLastName' className='edit-profile-label' hidden>LAST NAME:</label>
                <input
                  type='text'
                  className='input'
                  id='editLastName'
                  placeholder='LAST NAME'
                  required
                  minLength={2}
                  maxLength={50}
                  autoComplete='family-name'
                  name='fullName.lastName'
                  value={editUserData.fullName?.lastName || ''}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('lastName')}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showLastNameError ? 'true' : 'false'}
                  aria-describedby={describedBy(showLastNameError && lastNameErrorId)}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
              <div>
                {/* FULL NAME ERROR MESSAGES */}
                {showFirstNameError && (
                  <p id={firstNameErrorId} className='visually-hidden' role='alert'>First name is required.</p>
                )}
                {showLastNameError && (
                  <p id={lastNameErrorId} className='visually-hidden' role='alert'>Last name is required.</p>
                )}
              </div>
            </div>
          </Stack>
          {/* STACK 2 */}
          <Stack direction="horizontal" gap={3} id='edit-user-stack2'>
            {/* EMAIL INPUT */}
            <div className="p-2" id='edit-email-block'>
              <div className='input-div'>
                <label className='edit-profile-label' htmlFor='editUserEmail'>EMAIL</label>
                <input
                  type='email'
                  className='input'
                  id='editUserEmail'
                  placeholder='EMAIL'
                  required
                  maxLength={254}
                  autoComplete='email'
                  name='email'
                  value={editUserData.email}
                  onChange={handleInputChange}
                  onFocus={() => setEmailMsg(true)}
                  onBlur={() => {
                    setEmailMsg(false)
                    markTouched('email')
                  }}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showEmailError || showEmailFormatError || hasServerError('email') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    showEmailError && emailErrorId,
                    showEmailFormatError && emailFormatErrorId,
                    emailMsg && emailHelpId,
                    hasServerError('email') && serverErrorId
                  )}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
            </div>
            {/* EMAIL ERROR MESSAGES */}
            <div className="p-2 ms-auto">
              {showEmailError && (
                <p id={emailErrorId} className='visually-hidden' role='alert'>Email is required.</p>
              )}
              {showEmailFormatError && (
                <p id={emailFormatErrorId} className='formErrorMessage' role='alert'>
                  <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                  Enter a valid email address
                </p>
              )}
            </div>
            {emailMsg && (
              <div className="p-2" id={emailHelpId} aria-live='polite'>
                <p className='infoText'>WE WILL NEVER SHARE YOUR EMAIL</p>
              </div>
            )}

          </Stack>
          {/* STACK 3: */}
          <Stack direction="horizontal" gap={3} id='edit-user-stack3'>
            {/* PROFILE PICTURE */}
            <div className="p-2" id='edituser-profile-pic-block'>
              <label className='edit-profile-label' htmlFor='editProfilePic'>PROFILE PICTURE:</label>
              <div className='input-div'>
                <input
                  className='input'
                  type='url'
                  id='editProfilePic'
                  placeholder='PROFILE PICTURE URL'
                  maxLength={2048}
                  name='profilePicture'
                  value={editUserData.profilePicture || ''}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('profilePicture')}
                  // ARIA ATTRIBUTES:
                  aria-required='false'
                  aria-invalid={showProfilePictureError || hasServerError('profilePicture') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    profilePictureHelpId,
                    showProfilePictureError && profilePictureErrorId,
                    hasServerError('profilePicture') && serverErrorId
                  )}
                />
              </div>
            </div>
            <div className="p-2 ">
              <p className='infoText' id={profilePictureHelpId}>ENTER FULL URL, OR LEAVE BLANK TO REMOVE</p>
            </div>
            {/* PROFILE PICTURE ERROR */}
            <div className="p-2 ms-auto">
              {showProfilePictureError && (
                <p id={profilePictureErrorId} className='formErrorMessage' role='alert'>
                  <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                  Enter a full URL starting with http:// or https://
                </p>
              )}
            </div>
          </Stack>
        </div>
        {/* GROUP 2: ADDRESS */}
        <div id='edit-profile-group2'>
          <Stack gap={3} id='edit-user-stack4'>
            <div className="p-2" id='edit-address-block1'>
              {/* Address Line 1:  */}
              <div className='input-div'>
                <label className='edit-profile-label' htmlFor='editAddressLine1'>STREET ADDRESS:</label>
                <textarea
                  className='edit-profile-textinput'
                  id='editAddressLine1'
                  rows={3}
                  placeholder='STREET ADDRESS'
                  required
                  minLength={2}
                  maxLength={100}
                  name='address.line1'
                  value={editUserData.address?.line1 || ''}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('line1')}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showLine1Error ? 'true' : 'false'}
                  aria-describedby={describedBy(showLine1Error && line1ErrorId)}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
              <div className='input-div'>
                <label className='edit-profile-label visually-hidden' htmlFor='editAddressLine2'>ADDITIONAL ADDRESS DETAILS</label>
                <textarea
                  className='edit-profile-textinput'
                  id='editAddressLine2'
                  rows={3}
                  placeholder='ADDITIONAL ADDRESS DETAILS'
                  maxLength={100}
                  name='address.line2'
                  value={editUserData.address?.line2 || ''}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('line2')}
                  // ARIA ATTRIBUTES:
                  aria-required='false'
                  aria-invalid={showLine2LengthError ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    line2HelpId,
                    showLine2LengthError && line2LengthErrorId
                  )}
                />
                <small id={line2HelpId} className='visually-hidden'>Optional</small>
              </div>
              {/* ADDRESS LINE ERROR MESSAGES */}
              <div>
                {showLine1Error && (
                  <p id={line1ErrorId} className='visually-hidden' role='alert'>Street address is required.</p>
                )}
                {showLine2LengthError && (
                  <p id={line2LengthErrorId} className='formErrorMessage' role='alert'>
                    <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                    Additional details must be at least 2 characters, or left blank
                  </p>
                )}
              </div>
            </div>
            <div className="p-2" id='edit-address-block2'>
              <div className='input-div'>
                <label className='edit-profile-label' htmlFor='editCity'>CITY/TOWN:</label>
                <input
                  type='text'
                  className='input'
                  id='editCity'
                  placeholder='CITY/TOWN'
                  required
                  minLength={2}
                  maxLength={50}
                  autoComplete='address-level2'
                  name='address.city'
                  value={editUserData.address?.city || ''}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('city')}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showCityError ? 'true' : 'false'}
                  aria-describedby={describedBy(showCityError && cityErrorId)}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
              <div className='input-div'>
                <label className='edit-profile-label' htmlFor='editProvince'>PROVINCE:</label>
                <select
                  className='input'
                  id='editProvince'
                  required
                  autoComplete='address-level1'
                  name='address.province'
                  value={editUserData.address?.province || ''}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('province')}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={showProvinceError || showProvinceInvalidError || hasServerError('address.province') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    showProvinceError && provinceErrorId,
                    showProvinceInvalidError && provinceInvalidErrorId,
                    hasServerError('address.province') && serverErrorId
                  )}
                >
                  <option value=''>SELECT</option>
                  {/* MAP ALL PROVINCES, the saved province is preselected by value */}
                  {provinces.map(({ code, name }) => (
                    <option key={code} value={name}>{name}</option>
                  ))}
                </select>
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
              {/* CITY AND PROVINCE ERROR MESSAGES */}
              {showCityError && (
                <p id={cityErrorId} className='visually-hidden' role='alert'>City or town is required.</p>
              )}
              {showProvinceError && (
                <p id={provinceErrorId} className='visually-hidden' role='alert'>Province is required.</p>
              )}
              {showProvinceInvalidError && (
                <p id={provinceInvalidErrorId} className='formErrorMessage' role='alert'>
                  <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                  Select a valid South African province
                </p>
              )}
            </div>
          </Stack>
        </div>
      </div>
      {/* FORM LEVEL ERROR, raised by handleSubmit when submit is blocked */}
      {formError && (
        <div id={formErrorId} className='formErrorBlock' role='alert' aria-live='assertive'>
          <p className='formErrorMessage'>
            <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
            {formError}
          </p>
        </div>
      )}
      {/* SERVER SIDE FIELD ERRORS, returned when the API rejects the update.
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
      <div id='edit-profile-group3'>
        <Stack direction="horizontal" gap={3} id='edit-user-stack5'>
          {/* REQUIRED INFO MESSAGE */}
          <div className="p-2" id='requiredInfo'>
            <p className='infoMsg'>
              <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
            </p>
          </div>
          <div className="p-2 ms-auto">
            <Button
              type='submit'
              id='editUserBtn'
              variant='light'
              // Disabled while the request runs, so the form cannot be submitted twice
              disabled={submitting}
              // ARIA ATTRIBUTES:
              aria-label={submitting ? 'Saving your changes, please wait' : 'Save profile changes'}
              aria-disabled={submitting}
              aria-busy={submitting}
              aria-describedby={describedBy(
                formError && formErrorId,
                serverErrors.length > 0 && serverErrorId
              )}
            >{submitting ? 'SAVING...' : 'EDIT USER'}</Button>
          </div>
          <div className="p-2" id='clearFormBlock'>
            {/* Restores the saved account, see handleReset */}
            <Button
              variant='danger'
              id='clearFormBtn'
              type='button'
              disabled={submitting}
              onClick={handleReset}
              // ARIA ATTRIBUTES:
              aria-label='Discard changes and restore saved details'
              aria-disabled={submitting}
            >RESET FORM</Button>
          </div>
        </Stack>
      </div>
    </form>
  )
}
