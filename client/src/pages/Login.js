import React from 'react'
import '../css/pagesCss/PageSetup.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MainHeader from '../components/MainHeader'
export default function Login() {
  return (
    <div id='pageContainer'>
      <MainHeader mainHeading={'LOGIN'}/>
      <section>
         <Row>
        <Col>1 of 3</Col>
        <Col xs={6}>2 of 3 (wider)</Col>
        <Col>3 of 3</Col>
      </Row>
      </section>
    </div>
  )
}
