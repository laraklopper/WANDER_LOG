import React, { useState, useCallback } from 'react'
import '../css/componentCss/EditUserForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk, Eye, EyeOff   } from 'lucide-react';

export default function EditPasswordForm({currentUser, setError}) {
    //===========STATE VARIABLES===========
    const [showPswdMsg, setShowPswdMsg] = useState(false);
    const [showCurrentPswd, setShowCurrentPswd] = useState(false);
    const [showNewPswd, setShowNewPswd] = useState(false);
    const [showConfirmNewPswd, setShowConfirmNewPswd] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(false)//Loading

     const isStrongPassword =useCallback((pwd)=> {
        return /^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/ //Regex pattern to check for at least 8 characters and one special character
            .test(
                String(pwd || '')// Ensure pwd is a string before testing
            );
    },[])
    const editPassword = useCallback(async (e) => {
        e.preventDefault();
        // Blocks a second request while the first is still running
        if (loading) return;

        setError?.(null)

        /* Both checks run before the request so a password the server would
        reject never leaves the browser. They also return before setLoading, so
        the submit button is not left disabled on a validation failure */
        // Validate that the new password and confirm new password match
        if (newPassword !== confirmNewPassword) {
          const msg = 'New password and confirm new password do not match.';
          setError?.(msg);
          alert(msg);
          return;
        }

        if (!isStrongPassword(newPassword)) {
          const msg = //Message for weak password
            'New password must be at least 8 characters long and include at least one special character.';
          setError?.(msg);// Set the error state to display the error in the UI
          alert(msg);// Alert user of error
          return;// Exit the function early
        }

        const token = localStorage.getItem('token')
        /* The API shapes a user with toPublicJSON, which names the key userId,
        so currentUser.id is always undefined */
        const userId = currentUser?.userId;

        // Without either of these the request can only come back as a 401 or a 404
        if (!token || !userId) {
          const msg = 'Your session has expired. Please log in again to change your password.';
          setError?.(msg);
          alert(msg);
          return;
        }

        try {
          setLoading(true)

          const response = await fetch(`http://localhost:3001/users/${userId}/editPassword`, {
            method: 'PATCH',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              currentPassword,
              newPassword,
            }),
          });

          const data = await response.json().catch(() => ({}));// Safely parse the JSON response (avoid crash if server returns non-JSON)

          if (!response.ok) {
            const errorMessage = data.message || 'Failed to change password.';//Default error message
                setError?.(errorMessage);// Set the error state to display the error in the UI
                alert(errorMessage);// Alert user of error
                return;// Exit the function early
          }

          alert('Password updated successfully!');
          // Clear the form fields after successful update
          setCurrentPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
        } catch (error) {
          // Only a network level failure reaches here, a 4xx or 5xx is handled above
          const msg = 'Could not reach the server. Please check your connection and try again.';
          console.error('[ERROR: EditPasswordForm.js] Password update request failed:', error.message);
          setError?.(msg)
          alert(msg);
        } finally {
          // Runs on every path out of the request, so the form is never stuck saving
          setLoading(false)
        }
      }, [loading, currentUser, setError, isStrongPassword, currentPassword, newPassword, confirmNewPassword]);

      //=======================JSX RENDERING========================
  return (
    /* No method attribute, a form element only accepts GET or POST and the
    PATCH is sent by editPassword rather than by the browser */
    <form id='edit-password-form' onSubmit={editPassword} aria-label='Edit Password Form'>
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
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onFocus={() => setShowPswdMsg(true)}
                onBlur={() => setShowPswdMsg(false)}
                // ARIA attributes
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
              aria-expanded={showCurrentPswd}
            >
              {showCurrentPswd ? (
                <>Hide current password <EyeOff fontWeight={700} aria-hidden='true' focusable='false'/></>
              ) : (
                <>Show current password <Eye fontWeight={700} aria-hidden='true' focusable='false'/></>
              )}
            </Button>
          </div>
          {/* Error message */}
          {/* <div className="p-2">Third item</div> */}
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setShowPswdMsg(true)}
                onBlur={() => setShowPswdMsg(false)}
                // ARIA attributes
              />
              <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
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
              aria-expanded={showNewPswd}
            >
              {showNewPswd ? (
                <>Hide new password <EyeOff fontWeight={700} aria-hidden='true' focusable='false'/></>
              ) : (
                <>Show new password <Eye fontWeight={700} aria-hidden='true' focusable='false'/></>
              )}
            </Button>
          </div>
          {/* Error message */}
          {/* <div className="p-2">Third item</div> */}
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
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                onFocus={() => setShowPswdMsg(true)}
                onBlur={() => setShowPswdMsg(false)}
                // ARIA attributes
                aria-label="Confirm new password"
              />
              <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
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
              aria-expanded={showConfirmNewPswd}
            >
              {showConfirmNewPswd ? (
                <>
                  'HIDE CONFIRM PASSWORD'
                  <EyeOff 
                    fontWeight={700} 
                    aria-hidden='true' 
                    focusable='false'
                    />
                </>
              ) : (
                <>
                  SHOW CONFIRM PASSWORD
                  <Eye 
                  fontWeight={700} 
                  aria-hidden='true' 
                  focusable='false'/>
                </>
              )}
            </Button>
          </div>
          {/* Error message */}
          {/* <div className="p-2">Third item</div> */}
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
          {/* Submit Button */}
          <div className="p-2" id='editPswdSubmitBtn-div'>
            <Button 
              variant='light' 
              id='editPswdSubmitBtn' 
              type='submit' 
              disabled={loading}
              // ARIA ATTRIBUTES
              role='button'
              aria-disabled={loading}
              aria-label={loading ? 'Saving…' : 'EDIT PASSWORD'}
              aria-controls='edit-password-form'
              aria-describedby='edit-password-form'
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
              setCurrentPassword('');
              setNewPassword('');
              setConfirmNewPassword('');
            }}
            // ARIA ATTRIBUTES
            aria-label='Clear Form'
            aria-controls='edit-password-form'
            aria-describedby='edit-password-form'
            >
            Clear Form
          </Button>
          </div>
        </Stack>
      </div>
    </form>
  )
}
