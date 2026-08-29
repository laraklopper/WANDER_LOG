import React from 'react'
import '../css/pagesCss/PageSetup.css'
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
    setError
  }
) {
  return (
    <div id='pageContainer'>
      <MainHeader mainHeading={'LOGIN'}/>
      <section id='loginSection'>
        <div id='login-form-panal'>
  <Row id='login-row'>
        <Col/>
        <Col xs={6}>
          <div>
            <LoginForm
              userData={userData}
              setUserData={setUserData}
            />
          </div>
        </Col>
        <Col/>
      </Row>
        </div>
       
      </section>
    </div>
  )
}
