// EditPasswordForm.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useState, useCallback, useMemo } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/EditUserForms.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import { Asterisk, Eye, EyeOff, Bug, Check } from 'lucide-react';

// Regex pattern to check for at least 8 characters and one special character.
const strongPasswordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;

// IDs used to tie each message to the input it belongs to, via aria-describedby
const formErrorId = 'editPasswordFormError';
const formStatusId = 'editPasswordFormStatus';
const strengthErrorId = 'newPasswordStrengthError';
const matchErrorId = 'confirmPasswordMatchError';
const reuseErrorId = 'newPasswordReuseError';

//EditPasswordForm function component
export default function EditPasswordForm(//Export default EditPasswordForm.js function component
  {//PROPS PASSED FROM PARENT COMPONENT(Profile.js)
    currentUser, 
    setError
  }) {
    //===========STATE VARIABLES===========
    // State to display password messages
    const [showPswdMsg, setShowPswdMsg] = useState(false);
    // State to toggle password display
    const [showCurrentPswd, setShowCurrentPswd] = useState(false);//State to display the current password
    const [showNewPswd, setShowNewPswd] = useState(false);//State to display new password
    const [showConfirmNewPswd, setShowConfirmNewPswd] = useState(false);//State upsrt to show the converted password
    // ----FORM INPUT VARIABLES-----------------
    const [currentPassword, setCurrentPassword] = useState('');// Stores the user's current password entered into the form
    const [newPassword, setNewPassword] = useState('');// Stores the new password that the user wants to change to
    const [confirmNewPassword, setConfirmNewPassword] = useState('');// Stores the confirmed password input
    const [loading, setLoading] = useState(false)// Used to disable buttons and display a loading message while saving.
    const [formError, setFormError] = useState(null);
    const [statusMessage, setStatusMessage] = useState(null);

    //Function to ensure the password has all necessary requirements
     const isStrongPassword = useCallback((pwd)=> {
        return strongPasswordRegex
            .test(
                String(pwd || '')// Ensure pwd is a string before testing
            );
    },[])

    /* Live checks on what has been typed so far. */
    const showStrengthError = useMemo(
      () => newPassword.length > 0 && !isStrongPassword(newPassword),
      [newPassword, isStrongPassword]
    );
    const showMatchError = useMemo(
      () => confirmNewPassword.length > 0 && newPassword !== confirmNewPassword,
      [newPassword, confirmNewPassword]
    );
    /* The server rejects a new password equal to the current one with a 400, so
    the same rule is applied here rather than spending a request to be told */
    const showReuseError = useMemo(
      () => newPassword.length > 0 && currentPassword.length > 0 && newPassword === currentPassword,
      [newPassword, currentPassword]
    );

    // Joins the IDs that are currently rendered into a single aria-describedby value
    const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

    //Function to reset editPassword form
    const resetForm = useCallback(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowCurrentPswd(false);
      setShowNewPswd(false);
      setShowConfirmNewPswd(false);
    }, []);

    // Reports one failure in all three places: inline, on the page, and in the console
    const failWith = useCallback((message) => {
      setFormError(message);
      setStatusMessage(null);
      setError?.(message);
    }, [setError]);

    //Function to edit user password
    const editPassword = useCallback(async (e) => {
        e.preventDefault();
        // Blocks a second request while the first is still running
        if (loading) return;

        setError?.(null)
        setFormError(null)
        setStatusMessage(null)

        // Condittional rendering to check that the new password 
        // and confirm new password match
        if (newPassword !== confirmNewPassword) {
          failWith('New password and confirm new password do not match.');
          return;// Exit the function early
        }

        // Conditional rendering to check password strength
        if (!isStrongPassword(newPassword)) {
          failWith(//Message for weak password
            'New password must be at least 8 characters long and include at least one special character.'
          );
          return;// Exit the function early
        }

        // Matches the rule the server applies, which returns a 400 for a reused password
        if (currentPassword === newPassword) {
          failWith('New password must be different from your current password.');
          return;// Exit the function early
        }

        const token = localStorage.getItem('token')
        /* The API shapes a user with toPublicJSON, which names the key userId,
        so currentUser.id is always undefined */
        const userId = currentUser?.userId;

        // Without either of these the request can only come back as a 401 or a 404
        if (!token || !userId) {
          failWith('Your session has expired. Please log in again to change your password.');
          return;
        }

        try {
          setLoading(true)

          const response = await fetch(`http://localhost:3001/users/${userId}/editPassword`, {
            method: 'PATCH',//HTTP request method
            mode: 'cors',// Enable Cross-origin resource sharing
            headers: {
              'Content-Type': 'application/json',// Specify the Content-Type in the request payload
              'Authorization': `Bearer ${token}`,// Attach JWT token for authorization
            },
            body: JSON.stringify({// Convert the password data to a JSON string
              currentPassword,
              newPassword,
            }),
          });

          
          const data = await response.json().catch(() => ({}));// Safely parse the JSON response (avoid crash if server returns non-JSON)

          /* Conditional rendering to check if the response
               is not successful (status code is not in the range 200-299)*/
          if (!response.ok) {
            const errorMessage =
              data?.message ||
              (data?.errors && Object.values(data.errors).join(' ')) ||
              data?.error ||
              response?.statusText ||
              'Failed to change password.';//Default error message
            failWith(errorMessage);
            console.error(`[ERROR: EditPasswordForm.js] Password update failed with status ${response.status}: ${errorMessage}`);
            return;// Exit the function early
          }

          // Clear the form fields after successful update
          resetForm();
          setStatusMessage('Password updated successfully.');
          alert('Password updated successfully!');// Notify the user of success
        } catch (error) {
          // Only a network level failure reaches here, a 4xx or 5xx is handled above
          console.error('[ERROR: EditPasswordForm.js] Password update request failed:', error.message);
          failWith('Could not reach the server. Please check your connection and try again.');
        } finally {
          // Runs on every path out of the request, so the form is never stuck saving
          setLoading(false)
        }
      }, [loading, currentUser, setError, isStrongPassword, failWith, resetForm, currentPassword, newPassword, confirmNewPassword]);

      //=======================JSX RENDERING========================
  return (
    <form id='edit-password-form' onSubmit={editPassword} aria-labelledby='Edit Password Form'>
      <div id='formHeadingBlock'>
        <h3 id='formHeading'>Edit Password</h3>
      </div>
      <div id='edit-password-form-input'>
        <Stack gap={3} id='editPassword-Stack1'>
          {/* Current Password */}
          <div id="currentPassword-div">
            <label htmlFor="currentPassword" className="editPswd-label">Current Password:</label>
            <div className="input-div">
              <input
                type={showCurrentPswd ? 'text' : 'password'}
                id="currentPassword"
                required
                placeholder="Enter current password"
                className="password-input"
                name='currentPassword'
                /* Lets a password manager fill the field it already holds, and
                keeps it from offering the saved password for the new ones below */
                autoComplete='current-password'
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onFocus={() => setShowPswdMsg(true)}
                onBlur={() => setShowPswdMsg(false)}
                // ARIA attributes
                aria-invalid={formError ? 'true' : 'false'}
                aria-describedby={describedBy(formError && formErrorId)}
              />
              <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
          </div>
          {/* Show current password */}
          <div className="p-2" id='showCurrentPswdBtn-div'>
            <Button
              variant='warning'
              id='showCurrentPswdBtn'
              type='button'
              onClick={() => setShowCurrentPswd(!showCurrentPswd)}
              // ARIA ATTRIBUTES:
              aria-pressed={showCurrentPswd}
              aria-label={showCurrentPswd ? 'Hide Current Password' : 'Show Current Password'}
              aria-controls='currentPassword'
            >
              {showCurrentPswd ? (
                <>Hide current password <EyeOff fontWeight={700} aria-hidden='true' focusable='false'/></>
              ) : (
                <>Show current password <Eye fontWeight={700} aria-hidden='true' focusable='false'/></>
              )}
            </Button>
          </div>
        </Stack>
        <Stack gap={3} id='editPassword-Stack2'>
          {/* New Password */}
          <div id="newPassword-div">
            <label htmlFor="newPassword" className="editPswd-label">New Password:</label>
            <div className="input-div">
              <input
                type={showNewPswd ? 'text' : 'password'}
                id="newPassword"
                placeholder="Enter new password"
                required
                className="password-input"
                name='newPassword'
                /* The schema stores the plain text value against these limits
                before it is hashed, so the same bounds are applied here */
                minLength={8}
                maxLength={1024}
                autoComplete='new-password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setShowPswdMsg(true)}
                onBlur={() => setShowPswdMsg(false)}
                // ARIA attributes
                aria-invalid={showStrengthError || showReuseError ? 'true' : 'false'}
                aria-describedby={describedBy(
                  showStrengthError && strengthErrorId,
                  showReuseError && reuseErrorId
                )}
              />
              <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
            {/* New password error messages */}
            {showStrengthError && (
              <p id={strengthErrorId} className='formErrorMessage' role='alert'>
                <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                At least 8 characters and one special character
              </p>
            )}
            {showReuseError && (
              <p id={reuseErrorId} className='formErrorMessage' role='alert'>
                <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                New password must differ from your current password
              </p>
            )}
          </div>
          {/* Show new password */}
          <div id="showNewPswdBtn-div">
            <Button
              variant='warning'
              id='showNewPswdBtn'
              type='button'
              onClick={() => setShowNewPswd(!showNewPswd)}
              // ARIA ATTRIBUTES:
              aria-pressed={showNewPswd}
              aria-label={showNewPswd ? 'Hide New Password' : 'Show New Password'}
              aria-controls='newPassword'
            >
              {showNewPswd ? (
                <>Hide new password <EyeOff fontWeight={700} aria-hidden='true' focusable='false'/></>
              ) : (
                <>Show new password <Eye fontWeight={700} aria-hidden='true' focusable='false'/></>
              )}
            </Button>
          </div>
        </Stack>
        <Stack gap={3} id='editPassword-Stack3'>
          {/* Confirm New Password */}
          <div id="confirmNewPassword-div">
            <label htmlFor="confirmNewPassword" className="editPswd-label">Confirm New Password:</label>
            <div className="input-div">
              <input
                type={showConfirmNewPswd ? 'text' : 'password'}
                id="confirmNewPassword"
                placeholder="Confirm new password"
                required
                className="password-input"
                name='confirmNewPassword'
                minLength={8}
                maxLength={1024}
                autoComplete='new-password'
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                onFocus={() => setShowPswdMsg(true)}
                onBlur={() => setShowPswdMsg(false)}
                // ARIA attributes
                aria-invalid={showMatchError ? 'true' : 'false'}
                aria-describedby={describedBy(showMatchError && matchErrorId)}
              />
              <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
            {/* Confirm new password error message */}
            {showMatchError && (
              <p id={matchErrorId} className='formErrorMessage' role='alert'>
                <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                Passwords do not match
              </p>
            )}
          </div>
          {/* Show confirm new password Button */}
          <div id="showConfirmPswdBtn-div">
            <Button
              variant='warning'
              id='showConfirmPswdBtn'
              type='button'
              onClick={() => setShowConfirmNewPswd(!showConfirmNewPswd)}
              // ARIA ATTRIBUTES:
              aria-pressed={showConfirmNewPswd}
              aria-label={showConfirmNewPswd ? 'Hide Confirm New Password' : 'Show Confirm New Password'}
              aria-controls='confirmNewPassword'
            >
              {showConfirmNewPswd ? (
                <>
                  Hide confirm password
                  <EyeOff
                    fontWeight={700}
                    aria-hidden='true'
                    focusable='false'
                    />
                </>
              ) : (
                <>
                  Show confirm password
                  <Eye
                  fontWeight={700}
                  aria-hidden='true'
                  focusable='false'/>
                </>
              )}
            </Button>
          </div>
        </Stack>
      </div>
      <div id='editPassword-Btns-Block'>
        <Stack gap={3} id='editPassword-Stack4'>
          {/* Message */}
          {showPswdMsg && (
            <div className="p-2">
              <p>WE WILL NEVER SHARE YOUR PASSWORD</p>
            </div>
          )}
          {/* Form level result of the request */}
          {formError && (
            <div className='formErrorBlock' role='alert' aria-live='assertive'>
              <p id={formErrorId} className='formErrorMessage'>
                <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                {formError}
              </p>
            </div>
          )}
          {statusMessage && (
            <div className='formErrorBlock' aria-live='polite'>
              <p id={formStatusId} className='infoMsg'>
                <Check size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                {statusMessage}
              </p>
            </div>
          )}
          {/* Submit Button */}
          <div className="p-2" id='editPswdSubmitBtn-div'>
            <Button
              variant='light'
              id='editPswdSubmitBtn'
              type='submit'
              disabled={loading}
              // ARIA ATTRIBUTES
              aria-disabled={loading}
              aria-label={loading ? 'Saving…' : 'EDIT PASSWORD'}
              aria-describedby={describedBy(formError && formErrorId, statusMessage && formStatusId)}
              >
              {loading ? 'Saving…' : 'EDIT PASSWORD'}
              </Button>
          </div>
          {/* Clear form Button */}
          <div className="p-2" id='clearFormBtn-div'>
            <Button
            variant='danger'
            id='clearFormBtn'
            type='button'
            onClick={() => {
              resetForm();
              setFormError(null);
              setStatusMessage(null);
              setError?.(null);
            }}
            // ARIA ATTRIBUTES
            aria-label='Clear Form'
            aria-controls='edit-password-form'
            >
            Clear Form
          </Button>
          </div>
        </Stack>
      </div>
    </form>
  )
}
