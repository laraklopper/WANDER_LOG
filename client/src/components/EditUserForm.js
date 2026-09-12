import React, { useEffect, useMemo, useState } from 'react'
import '../css/componentCss/EditUserForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Bug } from 'lucide-react';
import { provinces } from '../data/locations';
import { profilePictureUrl } from '../util/imageUrl';

/* Mirrors the email pattern used by the server (userSchema.js) so the client
rejects the same addresses the API would reject */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* The profile picture rules below mirror the multer configuration the server
uses (routes/uploadMiddleware.js), so a file the API would refuse is caught
before it is uploaded rather than after 2MB has gone over the network */
const MAX_PICTURE_BYTES = 2 * 1024 * 1024;// 2MB, the multer fileSize limit
const ALLOWED_PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
/* Passed to the input's accept attribute so the file picker only offers these,
which is a convenience and not a check: accept can be bypassed by dragging a
file in, so the type is still verified below and again on the server */
const PICTURE_ACCEPT = ALLOWED_PICTURE_TYPES.join(',');

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
  such as a username or email already being taken, or a field left blank */
  fieldErrors = {},
}) {
  const [emailMsg, setEmailMsg] = useState(false)
  const [formError, setFormError] = useState(null)// Form level error shown above the submit button
  const [pictureError, setPictureError] = useState(null)// Error shown under the profile picture input
  /* A file input cannot be given a value from React: the browser only lets the
  user set it, so resetting the form leaves the chosen file name on screen.
  Changing this key remounts the input, which is what actually empties it */
  const [fileInputKey, setFileInputKey] = useState(0)
  const [picturePreview, setPicturePreview] = useState(null)// Object URL for the new file
  /* Only the fields that can raise an error of their own are tracked. The rest
  are checked by the server, which returns its messages in fieldErrors */
  const [touched, setTouched] = useState({
    username: false,      // Tracks if username field was touched
    email: false,         // Tracks if email field was touched
    line2: false,         // Tracks if address.line2 was touched
    province: false,      // Tracks if address.province was touched
  })

  // Marks a single field as touched so its error message may be announced
  const markTouched = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Marks every field as touched, used when the form is submitted
  const markAllTouched = () =>
    setTouched({
      username: true,
      email: true,
      line2: true,
      province: true,
    });

  /* The saved account, flattened to one level. Used by the reset button, and to
  work out whether anything was actually changed, which an edit form has to know
  and a registration form does not.

  The picture is left out of both maps: it is now a chosen file rather than
  text, and every value here is compared with trim(). It is tracked on its own
  by pictureChanged below */
  const savedValues = useMemo(() => ({
    username: currentUser?.username || '',
    firstName: currentUser?.fullName?.firstName || '',
    lastName: currentUser?.fullName?.lastName || '',
    email: currentUser?.email || '',
    line1: currentUser?.address?.line1 || '',
    line2: currentUser?.address?.line2 || '',
    city: currentUser?.address?.city || '',
    province: currentUser?.address?.province || '',
  }), [currentUser]);

  // The same eight values as they currently stand in the form
  const currentValues = useMemo(() => ({
    username: editUserData?.username || '',
    firstName: editUserData?.fullName?.firstName || '',
    lastName: editUserData?.fullName?.lastName || '',
    email: editUserData?.email || '',
    line1: editUserData?.address?.line1 || '',
    line2: editUserData?.address?.line2 || '',
    city: editUserData?.address?.city || '',
    province: editUserData?.address?.province || '',
  }), [editUserData]);

  //========== EMPTY FIELD CHECKS ====================
  /* Not errors in themselves, they only stop a format rule being applied to a
  field that has nothing in it yet */
  const usernameEmpty = useMemo(
    () => !currentValues.username.trim(), [currentValues.username]
  );
  const emailEmpty = useMemo(
    () => !currentValues.email.trim(), [currentValues.email]
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
  //========== PROFILE PICTURE ====================
  /* The form state holds whatever the picker last produced, so it is narrowed
  to a File before being previewed or read for its size */
  const profilePictureFile = useMemo(
    () => (editUserData?.profilePicture instanceof File ? editUserData.profilePicture : null),
    [editUserData?.profilePicture]
  );
  // Set by the REMOVE CURRENT PICTURE checkbox
  const removePicture = Boolean(editUserData?.removeProfilePicture);

  /* The picture the account is saved with, which stays on screen until a new
  file is chosen or removal is ticked. Read through the helper because an
  uploaded picture is stored as a path relative to the API */
  const savedPicture = profilePictureUrl(currentUser?.profilePicture);

  /* Shows the chosen file without uploading it first. createObjectURL hands
  back a URL pointing at the file already on the user's machine, and holds it in
  memory until it is revoked, which the cleanup below does whenever the choice
  changes or the form unmounts */
  useEffect(() => {
    if (!profilePictureFile) {
      setPicturePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(profilePictureFile);
    setPicturePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profilePictureFile]);

  /* Checks one file against the same rules as the server, and returns the
  message to show, or null when the file is acceptable */
  const validatePicture = (file) => {
    if (!file) return null;// The field is optional, so no file is valid
    if (!ALLOWED_PICTURE_TYPES.includes(file.type)) {
      return 'Profile picture must be a JPG, PNG, WEBP or GIF image';
    }
    if (file.size > MAX_PICTURE_BYTES) {
      return 'Profile picture must be 2MB or smaller';
    }
    return null;
  };

  /* Either asking for a different picture or asking for the saved one to go
  counts as an edit, and both are kept out of savedValues/currentValues */
  const pictureChanged = Boolean(profilePictureFile) || removePicture;
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
  success the user cannot see is worse than saying there was nothing to save.
  The picture is asked about separately, because it is not one of the text
  values the comparison below walks through */
  const noChanges = useMemo(
    () => !pictureChanged && Object.keys(savedValues).every(
      (key) => savedValues[key].trim() === currentValues[key].trim()
    ),
    [pictureChanged, savedValues, currentValues]
  );

  const showUsernameLengthError = touched.username && usernameTooShort;
  const showEmailFormatError = touched.email && emailInvalid;
  const showLine2LengthError = touched.line2 && line2TooShort;
  const showProvinceInvalidError = touched.province && provinceInvalid;

  /* Checks the format rules the browser cannot enforce on its own. A field left
  blank is not stopped here, it is reported by the server and shown in the
  fieldErrors block below */
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
    /* Re-checked on submit as well as on change, because a file refused on
    change is not stored and must not be silently ignored here */
    if (pictureError) {
      setFormError(pictureError)
      console.warn(`[WARN: EditUserForm.js]: ${pictureError}`)
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
    const { name, value, type, checked, files } = event.target;

    setFormError(null);// Any edit clears the form level error

    /* A file input reports its selection through files, not value, which only
    ever holds a fake path such as C:\fakepath\photo.jpg. multiple is not set,
    so there is at most one file to take */
    if (type === 'file') {
      const file = files?.[0] || null;
      const message = validatePicture(file);
      setPictureError(message);
      setEditUserData((prev) => ({
        ...prev,
        /* A rejected file is not kept, so it can never be submitted, but the
        input is left as the user set it so the name stays visible next to the
        error explaining why it was refused */
        profilePicture: message ? null : file,
        /* Choosing a picture and asking for the saved one to be removed are
        opposite requests, so picking a file clears the tick */
        removeProfilePicture: false,
      }));
      return;
    }

    /* The remove tick. Choosing a file and then ticking this discards the
    choice, the mirror of the branch above */
    if (name === 'removeProfilePicture') {
      setPictureError(null);
      setEditUserData((prev) => ({
        ...prev,
        removeProfilePicture: checked,
        profilePicture: checked ? null : prev.profilePicture,
      }));
      if (checked) setFileInputKey((key) => key + 1);// Empties the file input
      return;
    }

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

  // Restores the saved account, discarding whatever the user has typed
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
      /* Back to "no new picture chosen and none removed", which leaves the
      account using whatever it is already saved with */
      profilePicture: null,
      removeProfilePicture: false,
      address: {
        line1: savedValues.line1,
        line2: savedValues.line2,
        city: savedValues.city,
        province: savedValues.province,
      },
    });
    setTouched({
      username: false,
      email: false,
      line2: false,
      province: false,
    });
    setFormError(null);
    setPictureError(null);
    // Remounts the file input, the only way to clear a chosen file from React
    setFileInputKey((key) => key + 1);
  };

  // ========= IDs USED BY aria-describedby =========
  const usernameLengthErrorId = 'editUserUsernameLengthError';// ID used for short username error
  const emailFormatErrorId = 'editUserEmailFormatError';// ID used for invalid email error
  const emailHelpId = 'editUserEmailHelp';// ID used for the email privacy note
  const profilePictureHelpId = 'editUserProfilePictureHelp';// ID used for the profile picture hint
  const profilePictureErrorId = 'editUserProfilePictureError';// ID used for a rejected file error
  const line2HelpId = 'editUserAddressLine2Help';// ID used for the optional line 2 hint
  const line2LengthErrorId = 'editUserAddressLine2LengthError';// ID used for short line 2 error
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
                  minLength={3}
                  maxLength={50}
                  autoComplete='username'
                  name='username'
                  value={editUserData.username}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('username')}
                  // ARIA ATTRIBUTES:
                  aria-invalid={showUsernameLengthError || hasServerError('username') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    showUsernameLengthError && usernameLengthErrorId,
                    hasServerError('username') && serverErrorId
                  )}
                />
              </div>
              <div>
                {/* USERNAME ERROR MESSAGE */}
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
                  minLength={2}
                  maxLength={50}
                  autoComplete='given-name'
                  name='fullName.firstName'
                  value={editUserData.fullName?.firstName || ''}
                  onChange={handleInputChange}
                  // ARIA ATTRIBUTES:
                  aria-invalid={hasServerError('fullName.firstName') ? 'true' : 'false'}
                  aria-describedby={describedBy(hasServerError('fullName.firstName') && serverErrorId)}
                />
              </div>
              <div className='input-div'>
                <label htmlFor='editLastName' className='edit-profile-label' hidden>LAST NAME:</label>
                <input
                  type='text'
                  className='input'
                  id='editLastName'
                  placeholder='LAST NAME'
                  minLength={2}
                  maxLength={50}
                  autoComplete='family-name'
                  name='fullName.lastName'
                  value={editUserData.fullName?.lastName || ''}
                  onChange={handleInputChange}
                  // ARIA ATTRIBUTES:
                  aria-invalid={hasServerError('fullName.lastName') ? 'true' : 'false'}
                  aria-describedby={describedBy(hasServerError('fullName.lastName') && serverErrorId)}
                />
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
                  aria-invalid={showEmailFormatError || hasServerError('email') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    showEmailFormatError && emailFormatErrorId,
                    emailMsg && emailHelpId,
                    hasServerError('email') && serverErrorId
                  )}
                />
              </div>
            </div>
            {/* EMAIL ERROR MESSAGE */}
            <div className="p-2 ms-auto">
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
                {/* Uploaded as a file rather than linked by URL, so the picture
                is stored by the API instead of being loaded from another site.
                key remounts the input when the form is reset or removal is
                ticked, because React cannot empty a file input by setting its
                value */}
                <input
                  key={fileInputKey}
                  className='input'
                  type='file'
                  id='editProfilePic'
                  accept={PICTURE_ACCEPT}
                  name='profilePicture'
                  onChange={handleInputChange}
                  // The tick means the saved picture is going, so no file is wanted
                  disabled={removePicture}
                  // ARIA ATTRIBUTES:
                  aria-invalid={pictureError || hasServerError('profilePicture') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    profilePictureHelpId,
                    pictureError && profilePictureErrorId,
                    hasServerError('profilePicture') && serverErrorId
                  )}
                />
              </div>
              {/* REMOVE CURRENT PICTURE: only offered when there is one to
              remove. Leaving the file input empty cannot mean "remove it",
              because that is also what it means to change nothing */}
              {Boolean(currentUser?.profilePicture) && (
                <div className='input-div' id='edituser-remove-pic-block'>
                  <label className='edit-profile-label' htmlFor='editRemoveProfilePic'>
                    REMOVE CURRENT PICTURE:
                  </label>
                  <input
                    type='checkbox'
                    id='editRemoveProfilePic'
                    name='removeProfilePicture'
                    checked={removePicture}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>
            <div className="p-2 ">
              <p className='infoText' id={profilePictureHelpId}>
                CHOOSE A JPG, PNG, WEBP OR GIF UP TO 2MB, OR LEAVE AS IT IS TO KEEP YOUR CURRENT PICTURE
              </p>
              {/* The picture as it stands: the newly chosen file once one has
              been picked, otherwise the one saved on the account, and nothing
              at all while removal is ticked */}
              {!removePicture && (picturePreview || savedPicture) && (
                <img
                  id='editProfilePicPreview'
                  src={picturePreview || savedPicture}
                  alt={picturePreview ? 'Preview of the picture you selected' : 'Your current profile picture'}
                  width={72}
                  height={72}
                />
              )}
            </div>
            {/* PROFILE PICTURE ERROR */}
            <div className="p-2 ms-auto">
              {/* The browser cannot report a file that is too large or of the
              wrong type, so the message is shown on screen */}
              {pictureError && (
                <p id={profilePictureErrorId} className='formErrorMessage' role='alert'>
                  <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                  {pictureError}
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
                  minLength={2}
                  maxLength={100}
                  name='address.line1'
                  value={editUserData.address?.line1 || ''}
                  onChange={handleInputChange}
                  // ARIA ATTRIBUTES:
                  aria-invalid={hasServerError('address.line1') ? 'true' : 'false'}
                  aria-describedby={describedBy(hasServerError('address.line1') && serverErrorId)}
                />
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
                  aria-invalid={showLine2LengthError ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    line2HelpId,
                    showLine2LengthError && line2LengthErrorId
                  )}
                />
                <small id={line2HelpId} className='visually-hidden'>Optional</small>
              </div>
              {/* ADDRESS LINE 2 ERROR MESSAGE */}
              <div>
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
                  minLength={2}
                  maxLength={50}
                  autoComplete='address-level2'
                  name='address.city'
                  value={editUserData.address?.city || ''}
                  onChange={handleInputChange}
                  // ARIA ATTRIBUTES:
                  aria-invalid={hasServerError('address.city') ? 'true' : 'false'}
                  aria-describedby={describedBy(hasServerError('address.city') && serverErrorId)}
                />
              </div>
              <div className='input-div'>
                <label className='edit-profile-label' htmlFor='editProvince'>PROVINCE:</label>
                <select
                  className='input'
                  id='editProvince'
                  autoComplete='address-level1'
                  name='address.province'
                  value={editUserData.address?.province || ''}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('province')}
                  // ARIA ATTRIBUTES:
                  aria-invalid={showProvinceInvalidError || hasServerError('address.province') ? 'true' : 'false'}
                  aria-describedby={describedBy(
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
              </div>
              {/* PROVINCE ERROR MESSAGE */}
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
      These are rules the browser is no longer checking, such as a field left
      blank, or cannot check at all, such as a username already being taken */}
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
          <div className="p-2"></div>
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
