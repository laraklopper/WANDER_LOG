import React, { useCallback, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MainHeader from '../components/MainHeader'
import LoginForm from '../components/LoginForm';
import { ENDPOINTS, errorMessage, parseJson } from '../api/config';
export default function Login(
  {
    userData,
    setUserData,
    loggedIn,
    setLoggedIn,
    setError,
    setCurrentUser,
  }
) {
  /* Blocks a second request while the first is still running, so a double click
  on the login button cannot spend two of the server's rate limited attempts */
  const [submitting, setSubmitting] = useState(false)

  const submitLogin = useCallback(async () => {
    if (submitting) return;

    try {
      setSubmitting(true)
      setError(null);

      const response = await fetch(ENDPOINTS.login, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          password: userData.password
        })
      })

      const data = await parseJson(response)

      if (response.ok) {
        localStorage.setItem('username', userData.username)
        localStorage.setItem('loggedIn', 'true')
        localStorage.setItem('token', data.token)
        /* The server returns the whole account under `user`, already stripped of
        the password, so it is stored as it arrives. currentUser.admin is what
        ProtectedAdminRoute checks */
        setCurrentUser(data.user)
        setLoggedIn(true)
        setError(null)
        // The password is cleared so it is not left in React state after login
        setUserData((prev) => ({ ...prev, password: '' }))
      } else {
        /* The API answers a wrong username and a wrong password with the same
        401 message on purpose, so it is shown to the user as sent */
        setError(errorMessage(response, data, 'Login failed. Please try again.'));
        console.error(`[ERROR: Login.js] Login failed with status ${response.status}`);
      }
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError('Could not reach the server. Please check your connection and try again.');
      console.error('[ERROR: Login.js] Login request failed:', error.message);
      setLoggedIn(false)
    } finally {
      setSubmitting(false)
    }
  },[submitting, setError, userData, setUserData, setLoggedIn, setCurrentUser])
  return (
    <div id='pageContainer' aria-labelledby='pageTitle'>
          {/* ---------Screen Reader Page Heading-------------- */}
      <p className='visually-hidden' id='pageTitle'>LOGIN PAGE</p>

      <MainHeader mainHeading={'LOGIN'}/>
      <section id='loginSection'>
  <Row id='login-row'>
        <Col id='login-col1'/>
        <Col xs={6} id='login-col'>
          <div id='login-form-panal'>
            <LoginForm
              userData={userData}
              setUserData={setUserData}
              submitLogin={submitLogin}
              submitting={submitting}
            />
          </div>
        </Col>
        <Col id='login-col2'/>
      </Row>
      </section>
    </div>
  )
}
