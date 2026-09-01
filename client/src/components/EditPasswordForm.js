import React, { useState } from 'react'
import '../css/componentCss/EditUserForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk, Bug, Eye, EyeOff   } from 'lucide-react';
export default function EditPasswordForm() {
    //===========STATE VARIABLES===========
    const [showPswdMsg, setShowPswdMsg] = useState(false);
    const [showCurrentPswd, setShowCurrentPswd] = useState(false);
    const [showNewPswd, setShowNewPswd] = useState(false);
    const [showConfirmNewPswd, setShowConfirmNewPswd] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
  return (
    <form id='edit-password-form' aria-label='Edit Password Form'>
        <div id='formHeadingBlock'>
        <h3 id='formHeading'>Edit Password</h3>
        </div>
        <div id='edit-password-form-input'>
        <Stack gap={3} id='editPassword-Stack1'>
        {/* Current Password */}
      <div id="currentPassword-div" >
        <label htmlFor="currentPassword" className="editPswd-label">Current Password:</label>
        <div className="input-div">
            <input
                type="password"
                id="currentPassword"
                required
                className="input"
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
        variant='warning' id='showCurrentPswdBtn' type='button' onClick={() => setShowCurrentPswd(!showCurrentPswd)}>
            {showCurrentPswd ? (
              <>
              Hide current password <EyeOff fontWeight={700} aria-hidden='true' focusable='false'/></>
              ):(
                <>
                Show current password
              <Eye fontWeight={700} aria-hidden='true' focusable='false'/>
            </>)}
        </Button>
      </div>
      {/* Error message */}
      {/* <div className="p-2">Third item</div> */}
    </Stack>
 <Stack gap={3} id='editPassword-Stack2'>
 {/* New Password */}
      <div id="newPassword-div">
        <label htmlFor="newPassword" className="editPswd-label">New Password</label>
        <div className="input-div">
            <input
                type="password"
                id="newPassword"
                required
                className="input"
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
              <>
              Hide new password <EyeOff fontWeight={700} aria-hidden='true' focusable='false'/></>
              ):(
                <>
                Show new password
              <Eye fontWeight={700} aria-hidden='true' focusable='false'/>
            </>)}
            
        </Button>
      </div>
      {/* Error message */}
      {/* <div className="p-2">Third item</div> */}
    </Stack>
    <Stack gap={3} id='editPassword-Stack3'>
        {/* Confirm New Password */}
      <div id="confirmNewPassword-div">
        <label htmlFor="confirmNewPassword" className="editPswd-label">Confirm New Password</label>
        <div className="input-div">
            <input
                type="password"
                id="confirmNewPassword"
                required
                className="input"
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
<EyeOff fontWeight={700} aria-hidden='true' focusable='false'/>
              </>
            ):(
              
             <>
SHOW CONFIRM PASSWORD
<Eye fontWeight={700} aria-hidden='true' focusable='false'/>
             </>
            )
             }
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
      <div className="p-2">
        <Button 
        variant='light' id='editPasswordBtn' type='submit'>EDIT PASSWORD</Button>
      </div>
      {/* Clear form Button */}
      <div className="p-2">
        <Button variant='danger' id='clearFormBtn'>Clear Form</Button>
      </div>
    </Stack>
        </div>
    </form>
  )
}
