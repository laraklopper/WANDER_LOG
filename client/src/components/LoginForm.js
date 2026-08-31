import React, { useMemo, useState } from 'react'
import '../css/componentCss/LoginForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Eye, EyeOff, Bug} from 'lucide-react';
export default function LoginForm(
    {
        userData,
        setUserData
    }
) {
    const [showPswd, setShowpswd] = useState(false)
    const [showPswdMsg, setShowPswdMsg] = useState(false)
    const [userNameMsg, setUserNameMsg] = useState(false)
     const [touched, setTouched] = useState({// State to track if fields have been touched for validation purposes
        username: false,
        password: false
    })


    const usernameEmpty = useMemo(
        () => !String (userData.username || '').trim(),
        [userData.username]
    )
    const passwordEmpty = useMemo(
        () => !String (userData.password || '').trim(), 
        [userData.password]
    )

    // Only show validation errors AFTER field was touched
    const showUsernameError = touched.username && usernameEmpty;// Show username error only after field was touched
    const showPasswordError = touched.password && passwordEmpty;// Show password error only after field was touched

    //============================================

    //Function to handle Input change in the Login Form
    const handleLoginInput =(event) =>{
        const { name, value} = event.target;// Get the input field's name attribute and its current typed value.
        // Update the userData object stored in the parent component.
        setUserData((prev) => ({
            ...prev, // Keep the existing values in userData, such as the other input field.
            // Update only the field that the user is currently typing into.
            // [name] uses the input's name attribute as the object key.
            [name] : value,
        }))
    }

    // ========= IDs USED BY aria-labelledby / aria-describedby =========
    // Keeps ARIA references stable and readable
    const formTitleId = 'loginFormTitle';
    const usernameHelpId = 'loginUsernameHelp';
    const passwordHelpId = 'loginPasswordHelp';
    // error IDs (for aria-describedby)
    const usernameErrorId = 'loginUsernameError';
    const passwordErrorId = 'loginPasswordError';
    //========================================================
  return (
    <form id='login-form' 
    method='POST'
    // onSubmit={}
    aria-labelledby={formTitleId} >
    <p className='visually-hidden' id={formTitleId}>LOGIN FORM</p>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>SIGN IN</h3>
        </div>
        {/* =======LOGIN INPUT======= */}
        <div id='login-form-input'>
        {/* USERNAME */}
           <Stack gap={3} id='login-stack1'>
      <div className="p-2" id='login-block1'>
        <label className='login-label' htmlFor='loginUsername'>USERNAME</label>
        <input
            className='input'
            id='loginUsername'
            placeholder='USERNAME'
            required
            autoComplete='username'
            
            name='username'
            value={userData.username}
            // EVENT HANDlERS:
            onChange={handleLoginInput}
            onFocus={() => setUserNameMsg(true)}
            onBlur={() => {
                setUserNameMsg(false)
                setTouched((prev) => ({...prev, username: true}))
            }}
            // ARIA ATTRIBUTES:
            aria-label='username'
            aria-required='true'
            aria-invalid={usernameEmpty ? 'true': 'false'}
            aria-describedby={[
                userNameMsg ? usernameHelpId :null,
                usernameEmpty ? usernameErrorId: null,
            ]
                .filter(Boolean)
                .join('')
            }
            inputMode="text"
        />
      </div>
      {/* Error Message */}
      {showUsernameError && (
        <div className="p-2" id={usernameErrorId} aria-live='assertive'>
            <p className='loginErrorMessage'>
                <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false'/>Username is required
            </p>
        </div>
      )}  
    {userNameMsg &&(
    <div className="p-2" id={usernameHelpId} aria-live='polite'>
         <p className='loginHelpMessage'>Enter your username</p>
    </div>
    )}
    </Stack>
    {/* PASSWORD */}
     <Stack gap={3} id='login-stack2'>
      <div className="p-2" id='login-pswd-block1'>
        <label className='login-label'>PASSWORD:</label>
        <input
            className='input'
            required
            type={showPswd ? 'text': 'password'}
            autoComplete='password'
            placeholder='PASSWORD'
            name='password'
            value={userData.password}
            // EVENT HANDLERS
            onChange={handleLoginInput}
            onFocus={() => setShowPswdMsg(true)}
            onBlur={() => {
                setShowPswdMsg(false)
                setTouched((prev) => ({...prev, password: true}))
            }}
            // ARIA ATTRIBUTES:
            aria-label='password'
            aria-required='true'
            aria-invalid={passwordEmpty ? 'true' : 'false'}
            aria-describedby={[
            showPswdMsg ? passwordHelpId : null,
            passwordEmpty ? passwordErrorId : null,
            ]
            .filter(Boolean)
            .join('')}
            inputMode="text"
        />
      </div>
      <div className="p-2" id='login-pswd-block2'>
        <Button 
        variant='warning' 
        type='button'
        id='showPswdBtn'
        onClick={() => setShowpswd(!showPswd)}
        // ARIA ATTRIBUTES:
        aria-label={showPswd ? 'Hide Password': 'Show Password'}
        aria-pressed={showPswd}
        aria-expanded={showPswd}
        aria-controls='loginPassword'
        aria-describedby={passwordHelpId}
        >
            {showPswd ? <>
                Hide Password
                <EyeOff size={20} fontWeight={700} aria-hidden='true' focusable='false'/>
                </> : <>
                Show Password
                <Eye size={20} fontWeight={700} aria-hidden='true' focusable='false'/>
                </>}
        </Button>
      </div>
      {/* ----------ERROR MESSAGE------------ */}
      {showPasswordError && (
        <div id={passwordErrorId} aria-live='assertive'>
            <p className='loginErrorMessage'>
                <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false'/>Password is required
            </p>
        </div>
        )}
       {/* password help message */}
        {showPswdMsg && (
            <div className="p-2" id={passwordHelpId} aria-live='polite'>
                <p className='loginHelpMessage'>We will never share your password</p>
            </div>
        )}
    </Stack>  
        </div>
        <div id='login-btn-block'>
            <Button
                variant='light'
                id='loginBtn'
                type='submit'
                >
                    LOGIN
                </Button>
        </div>
    </form>
  )
}
