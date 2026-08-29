import React from 'react'
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
    setError
  }
) {
  return (
    <div id='pageContainer'>
      <MainHeader mainHeading={'LOGIN'}/>
      <section id='loginSection'>
     
  <Row id='login-row'>
        <Col id='login-col1'/>
        <Col xs={6} id='login-col'>
          <div id='login-form-panal'>
            <LoginForm
              userData={userData}
              setUserData={setUserData}
            />
          </div>
        </Col>
        <Col id='login-col2'/>
      </Row>
       
       
      </section>
    </div>
  )
}
