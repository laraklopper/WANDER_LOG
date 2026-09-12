//Registration.js Route '/reg'
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useState } from 'react';
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// IMPORT CUSTOM COMPONENTS
import MainHeader from '../components/MainHeader'
import RegistrationForm from '../components/RegistrationForm';
// IMPORT REACT-ROUTER COMPONENTS/HOOKS
import { useNavigate } from 'react-router-dom';

// Empty form shape, used for the initial state and by the clear button
const EMPTY_FORM = {
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
  /* Holds the File the user picked, or null. Posted as multipart form data by
  addUser, which is how the image reaches multer on the server */
  profilePicture: null,
  password: '',
  confirmPassword: ''
};

//============MAIN REGISTRATION COMPONENT=============
export default function Register(//Export default Registration function component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
  setError
  }
  ) {
    // =========STATE VARIABLES=============
  const [newUserData, setNewUserData] = useState(EMPTY_FORM)
  // Blocks a second submit while the first request is in flight
  const [submitting, setSubmitting] = useState(false)
  /* Field keyed messages returned by the server when Mongoose validation fails,
  for example { 'address.province': 'X is not a valid South African province' }.
  Passed to the form so each message can be shown against its own input */
  const [fieldErrors, setFieldErrors] = useState({})

  //======================NAVIGATION HOOK========================
  const navigate = useNavigate();// Hook to navigate between different Pages

  //======================CALLBACKS/REQUEST FUNCTIONS========================
  //Function to register a new user
  //send registration request to 'http://localhost:3001/auth/register'
  const addUser = useCallback(async () => {
    if (submitting) return;

    try {
      setSubmitting(true)
      setError?.(null)
      setFieldErrors({})

      /* Sent as multipart form data rather than JSON, because JSON can only
      carry text and the profile picture is a binary file. FormData is the
      browser's own multipart builder, and is what multer reads on the server */
      const formData = new FormData()

      // Every value is sent as text: a multipart field has no other type
      formData.append('username', newUserData.username)
      formData.append('email', newUserData.email)
      formData.append('dateOfBirth', newUserData.dateOfBirth)
      formData.append('password', newUserData.password)
      // Sent so the schema can re-check the match on the server
      formData.append('confirmPassword', newUserData.confirmPassword)
      /* Arrives as the string 'true' or 'false', which the route turns back
      into a boolean, since both strings are truthy on their own */
      formData.append('admin', String(newUserData.admin))

      /* multipart has no concept of a nested object, so these two are sent as
      JSON text and parsed back into objects by the register route */
      formData.append('fullName', JSON.stringify(newUserData.fullName))
      formData.append('address', JSON.stringify(newUserData.address))

      /* Optional, so the field is only appended when a file was chosen.
      Appending null would send the string 'null' as the picture */
      if (newUserData.profilePicture instanceof File) {
        formData.append('profilePicture', newUserData.profilePicture)
      }

      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        mode: 'cors',
        /* No Content-Type header: the browser has to set it itself, because it
        must include the boundary string that separates the parts of the body.
        Setting it by hand omits the boundary and multer cannot read the body */
        body: formData,
      })

       const data = await response.json().catch(() => ({}))

       if (response.ok) {
        setError?.(null)
        setFieldErrors({})
        /* The account is created and the API already returned a token, but the
        user is sent to the login page to sign in with the details they chose,
        which confirms the credentials work. The form is cleared first so the
        password is not left sitting in React state */
        setNewUserData(EMPTY_FORM)
        alert('Registration successful. Please log in with your new details.')
        navigate('/')//Navigate back to Login Page after successful registration
       } else {
          /* Falls back through the shapes the API can return: a plain message,
          an error string, then the status text */
          const message =
            data?.message ||
            data?.error ||
            response?.statusText ||
            'Registration failed.';
          // Present on a 400 from Mongoose validation, absent on a 409 or a 500
          if (data.errors) setFieldErrors(data.errors);
          setError?.(message);
          console.error(`[ERROR: Register.js] Registration failed with status ${response.status}: ${message}`);
       }
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError?.('Could not reach the server. Please check your connection and try again.');
      console.error(`[ERROR: Register.js] Registration request failed: ${error.message}`);
    } finally {
      setSubmitting(false)
    }
  },[submitting, setError, navigate, newUserData])

  //===================JSX RENDERING========================
  return (
    <div id='pageContainer' role='main' aria-labelledby='pageTitle'>
     {/* ---------Screen Reader Page Heading-------------- */}
      <p className='visually-hidden' id='pageTitle'>REGISTRATION PAGE</p>
      {/* Render the MainHeader.js component with 'REGISTER' mainHeading */}
      <MainHeader mainHeading={'REGISTER'}/>
      <section id='regis-section1'>
      <div id='regis-form-panal'>
<Row id='register-row'>
        <Col md={12}>
        
           
             <RegistrationForm
              newUserData={newUserData}
              setNewUserData={setNewUserData}
              addUser={addUser}
              submitting={submitting}
              fieldErrors={fieldErrors}
              emptyForm={EMPTY_FORM}
             />
           
          
        </Col>
      </Row>
       <Row id='regisAdminMsgRow'>
        <Col id='adminMsgCol1'/>
        <Col xs={6} id='adminMsgCol'>
          <h6 className='regisAdminMsg'>REGISTRATION GRANTS ADMIN USERS ACCESS TO YOUR INFORMATION</h6>
        </Col>
        <Col id='adminMsgCol2'/>
      </Row>
      </div>
      </section>
      {/* ======FOOTER============= */}
   
    </div>
  )
}
