import React from 'react'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

export default function Footer({logout}) {
  return (
    <footer>
    <Row>
        <Col md={12}></Col>
    </Row>
    <Row>
        <Col xs={12} md={8}>
          xs=12 md=8
        </Col>
        <Col xs={6} md={4}>
          <Button variant='warning' onClick={logout}>LOGOUT</Button>
        </Col>
      </Row>
         <Row>
        <Col>1 of 3</Col>
        <Col xs={6}>2 of 3 (wider)</Col>
        <Col>3 of 3</Col>
      </Row>
    </footer>
  )
}
