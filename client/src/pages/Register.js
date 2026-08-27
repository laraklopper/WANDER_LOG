import React from 'react'
import '../css/pagesCss/PageSetup.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MainHeader from '../components/MainHeader'
import '../css/componentCss/FormSetup.css'
import RegistrationForm from '../components/RegistrationForm';
export default function Register() {
  return (
    <div id='pageContainer'>
      <MainHeader mainHeading={'REGISTER'}/>
      <section id='regis-section1'>
   <Row id='register-row'>
      <Col/>
        <Col xs={12} md={8}>
          <div id='regis-form-panal'>
            <RegistrationForm/>
          </div>
          
        </Col>
        <Col/>
      </Row>
      </section>
   
    </div>
  )
}
