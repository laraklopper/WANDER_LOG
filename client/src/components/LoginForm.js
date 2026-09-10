// LoginForm.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useMemo, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/LoginForm.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import { Eye, EyeOff, Bug} from 'lucide-react';

//LoginForm function component
export default function LoginForm(//Export default LoginForm.js component
    {//PROPS PASSED FROM PARENT COMPONENT (Login.js)
        userData,
        setUserData,
        submitLogin,
        submitting = false// True while the login request is in flight, set by the Login page
    }
) {
    //=========STATE VARIABLES=========
    const [showPswd, setShowpswd] = useState(false);// State to toggle password visibility
    const [showPswdMsg, setShowPswdMsg] = useState(false)// State to control display of password help message
    const [userNameMsg, setUserNameMsg] = useState(false)// State to control display of username help message
     const [touched, setTouched] = useState({// State to track if fields have been touched for validation purposes
        username: false,
        password: false
    })


    //==================FORM VALIDATION LOGIC========================
    // Checks if username is empty
    const usernameEmpty = useMemo( // Memorises the validation result until userData.username changes
        () => !String (userData.username || '').trim(),// Returns true if username is empty, missing, or only contains spaces
        [userData.username] // Recalculate only when the username value changes
    )

    // Checks if password is empty
    const passwordEmpty = useMemo(// Memorises the validation result until userData.password changes
        () => !String (userData.password || '').trim(),// Returns true if password is empty, missing, or only contains spaces
        [userData.password]// Recalculate only when the password value changes
    )

    // Only show validation errors AFTER field was touched
    const showUsernameError = touched.username && usernameEmpty;// Show username error only after field was touched
    const showPasswordError = touched.password && passwordEmpty;// Show password error only after field was touched

    //===============EVENT HANDLERS/LISTENERS=============================
    // Function to submit Login
    const handleLogin = (e) => {
        e.preventDefault();//Prevent default form submission

        // Conditional Rendering to check if the necessary fields are entered
        if (usernameEmpty || passwordEmpty) {
            setTouched({ username: true, password: true })//Mark the fields touched to show the error messages
            console.warn('[WARN: LoginForm.js]: Username and password are required');// Log a warning message in the console for debugging purposes
            return
        }

        submitLogin();// Call the submitLogin function passed as a prop from the parent component (Login.js)
    }

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

    /* Joins the IDs that are currently rendered into a single aria-describedby.
    The separator must be a space: several IDs run together as one string would
    not match any element, so the screen reader would announce nothing */
    const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;
    //=====================JSX RENDERING===================================
  return (
    <form id='login-form' 
    method='POST'
    onSubmit={handleLogin}
    aria-labelledby={formTitleId} >
    {/* --------Screen reader Heading---------- */}
    <p className='visually-hidden' id={formTitleId}>LOGIN FORM</p>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>SIGN IN</h3>
        </div>
        {/* =======LOGIN INPUT======= */}
        <div id='login-form-input'>
        {/* USERNAME: value={userData.username || ''} */}
        {/* STACK 1: UsernameStack */}
           <Stack gap={3} id='login-stack1' role='group'>
      <div className="p-2" id='login-block1'>
        <label className='login-label' htmlFor='loginUsername'>USERNAME</label>
        <input
            className='input'
            id='loginUsername'
            placeholder='USERNAME'
            required
            autoComplete='username'
            disabled={submitting}
            // Get the input field's name attribute and its current typed value
            name='username'
            value={userData.username || ''}
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
            aria-invalid={showUsernameError ? 'true': 'false'}
            aria-describedby={describedBy(
                userNameMsg && usernameHelpId,
                showUsernameError && usernameErrorId
            )}
            inputMode="text"
        />
      </div>
      {/* LOGIN ERROR MESSAGE */}
      {showUsernameError && (
        <div className="p-2" id={usernameErrorId} aria-live='assertive'>
            <p className='loginErrorMessage'>
                <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false'/>Username is required
            </p>
        </div>
      )}  
      {/* USERNAME HELP MESSAGE */}
    {userNameMsg &&(
    <div className="p-2" id={usernameHelpId} aria-live='polite'>
         <p className='loginHelpMessage'>Enter your username</p>
    </div>
    )}
    </Stack>
    {/* STACK 2 */}
     <Stack gap={3} id='login-stack2'>
     {/* PASSWORD: value={userData.password || ''} */}
      <div className="p-2" id='login-pswd-block1'>
        <label className='login-label' htmlFor='loginPassword'>PASSWORD:</label>
        <input
            className='input'
            id='loginPassword'
            required
            type={showPswd ? 'text': 'password'}
            /* current-password, not password: it tells the browser and password
            managers to offer the saved password. */
            autoComplete='current-password'//
            placeholder='PASSWORD'
            name='password'
            value={userData.password || ''}
            disabled={submitting}
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
            aria-invalid={showPasswordError ? 'true' : 'false'}
            aria-describedby={describedBy(
                showPswdMsg && passwordHelpId,
                showPasswordError && passwordErrorId
            )}
            inputMode="text"
        />
      </div>
      <div className="p-2" id='login-pswd-block2'>
      {/* SHOW PASSWORD BUTTON */}
        <Button
        variant='warning'
        type='button'
        id='showPswdBtn'
        onClick={() => setShowpswd(!showPswd)}
        // ARIA ATTRIBUTES:
        aria-label={showPswd ? 'Hide Password': 'Show Password'}
        aria-pressed={showPswd}
        /* aria-controls points at the password input, which now carries the
        matching id. aria-expanded is not used: the button toggles the
        visibility of a value, it does not expand a region */
        aria-controls='loginPassword'
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
                type='submit'//Button type
                disabled={submitting}// Disabled while the request runs, so it cannot be submitted twice
                // ARIA ATTRIBUTES:
                aria-label={submitting ? 'LOGGING IN...' : 'LOGIN'}
                aria-busy={submitting}
                aria-disabled={submitting}// Disabled while the request runs
                >
                    {submitting ? 'LOGGING IN...' : 'LOGIN'}
                </Button>
        </div>
    </form>
  )
}
