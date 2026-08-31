import React, { useCallback, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MainHeader from '../components/MainHeader'
import RegistrationForm from '../components/RegistrationForm';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS, errorMessage, parseJson } from '../api/config';

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
  profilePicture: '',
  password: '',
  confirmPassword: ''
};

export default function Register({setError}) {
  const [newUserData, setNewUserData] = useState(EMPTY_FORM)
  // Blocks a second submit while the first request is in flight
  const [submitting, setSubmitting] = useState(false)
  /* Field keyed messages returned by the server when Mongoose validation fails,
  for example { 'address.province': 'X is not a valid South African province' }.
  Passed to the form so each message can be shown against its own input */
  const [fieldErrors, setFieldErrors] = useState({})

  const navigate = useNavigate()
  const addUser = useCallback(async () => {
    if (submitting) return;

    try {
      setSubmitting(true)
      setError?.(null)
      setFieldErrors({})

      const response = await fetch(ENDPOINTS.register, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username :newUserData.username,
          fullName: newUserData.fullName,
          email: newUserData.email,
          dateOfBirth: newUserData.dateOfBirth,
          address: newUserData.address,
          admin : newUserData.admin,
          /* Optional field. Sent as null when blank, because the schema types it
          as a String defaulting to null and '' would be stored as an empty URL */
          profilePicture: newUserData.profilePicture || null,
          password: newUserData.password,
          // Sent so the schema can re-check the match on the server
          confirmPassword: newUserData.confirmPassword

        })
      })

       const data = await parseJson(response);

       if (response.ok) {
        setError?.(null)
        setFieldErrors({})
        /* The account is created and the API already returned a token, but the
        user is sent to the login page to sign in with the details they chose,
        which confirms the credentials work. The form is cleared first so the
        password is not left sitting in React state */
        setNewUserData(EMPTY_FORM)
        alert('Registration successful. Please log in with your new details.')
        navigate('/')
       } else {
          const message = errorMessage(response, data, 'Registration failed.');
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
  return (
    <div id='pageContainer'>
      <MainHeader mainHeading={'REGISTER'}/>
      <section id='regis-section1'>
   <Row id='register-row'>
        <Col md={12}>
          <div id='regis-form-panal'>
            <div>
             <RegistrationForm
              newUserData={newUserData}
              setNewUserData={setNewUserData}
              addUser={addUser}
              submitting={submitting}
              fieldErrors={fieldErrors}
              emptyForm={EMPTY_FORM}
             />
            </div>
            
          </div>
          
        </Col>
  
      </Row>
      </section>
   
    </div>
  )
}
