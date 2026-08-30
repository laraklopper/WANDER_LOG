import React, { useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MainHeader from '../components/MainHeader'
import '../css/componentCss/FormSetup.css'
import RegistrationForm from '../components/RegistrationForm';
export default function Register() {
  const [newUserData, setNewUserData] = useState({
        username: '',
    fullName: {
      firstName: '',
      lastName: '',
    },
    email : '',
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
  })

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
             /> 
            </div>
            
          </div>
          
        </Col>
  
      </Row>
      </section>
   
    </div>
  )
}
