import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Budget.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
export default function Budget({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'BUDGET'}/>
        <section id='budget-section1'>
          <div>
            <Row>
        <Col/>
        <Col xs={5}>
          <Stack gap={3}>
      <div className="p-2">
        <Button>
          SHOW CALCULATOR
        </Button>
      </div>
      <div className="p-2">
        <Button>SHOW CURRENCY CONVERTER</Button>
      </div>
      <div className="p-2">Third item</div>
    </Stack>
        </Col>
        <Col/>
      </Row>
          </div>
        </section>
      <Footer logout={logout}/>
    </div>
  )
}
