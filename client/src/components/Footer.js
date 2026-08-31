import React from 'react'
import '../css/componentCss/Footer.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

export default function Footer({logout}) {
  return (
    <footer id='footer'>
    <Row id='footer-row1'>
        <Col md={12} id='footer-col1'></Col>
    </Row>
    <Row id='footer-row2'>
        <Col xs={12} md={8} id='logout-col1'></Col>
        <Col xs={6} md={4} id='logout-col2'>
          <Button 
            variant='warning' 
            onClick={logout} 
            id='logoutBtn' 
            type='button'
            >
            LOGOUT
          </Button>
        </Col>
      </Row>
         <Row id='footer-row3'>
        <Col/>
        <Col xs={6}></Col>
        <Col/>
      </Row>
    </footer>
  )
}
