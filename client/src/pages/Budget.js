import React, { useCallback, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Budget.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
export default function Budget({currentUser, logout}) {
  const [toggleCalc, setToggleCalc] = useState(false)
  const [showConverter, setShowConverter] = useState(false)
  const [showVatCalc, setShowVatCalc] = useState(false)

  const toggleCalculator = useCallback(() => {

  },[])
  const toggleVatCalculator = useCallback(() => {

  },[])
  const toggleConverter = useCallback(() => {

  },[])


  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'BUDGET'}/>
        <section id='budget-section1'>
          <div id='section-1-panal'>
            <Row id='toggle-btns-row'>
        <Col id='toggle-col1'/>
        <Col xs={5} id='toggle-col'>
          <Stack gap={1} id='toggle-btns-stack'>
      <div id='toggle-calculator-block'>
        <Button>
          SHOW CALCULATOR
        </Button>
      </div>
      <div id='toggle-intcalculator-block'>
        <Button variant='light'>SHOW VAT CALCULATOR</Button>

      </div>
      <div id='toggle-converter-block'>
        <Button>SHOW CURRENCY CONVERTER</Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggle-col2'/>
      </Row>

          </div>
        </section>
      <Footer logout={logout}/>
    </div>
  )
}
