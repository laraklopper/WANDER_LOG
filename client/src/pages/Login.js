import React, { useCallback } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MainHeader from '../components/MainHeader'
import LoginForm from '../components/LoginForm';
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

  const submitLogin = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch('http://localhost:3001/auth/login', {
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

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        localStorage.setItem('username', userData.username)
        localStorage.setItem('loggedIn', true)
        localStorage.setItem('token', data.token)
        setLoggedIn(true)
        setCurrentUser({userId: data.userId, fullName: data.fullName, isAdmin: data.isAdmin})
        setError(null)
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('An error occurred during login. Please try again.');
      console.error('Login Error', error);
      setLoggedIn(false)
    }
  },[setError, userData, setLoggedIn, setCurrentUser])
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
            />
          </div>
        </Col>
        <Col id='login-col2'/>
      </Row>
      </section>
    </div>
  )
}
