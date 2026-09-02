import React, { useCallback, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Budget.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
import CurrencyConverter from '../components/CurrencyConverter';
export default function Budget({currentUser, logout}) {
  // ==========STATE VARIABLES===============
  // Toggle Buttons State
  const [showCalculator, setShowCaculator] = useState(false)
  const [showVatCalc, setShowVatCalc] = useState(false)
  const [showConverter, setShowConverter] = useState(false)
  
  //================EVENT LISTENERS========================
  //  Function to toggle general/number calculator
  const toggleCalculator = useCallback(() => {
    setShowCaculator(prev => !prev)
    setShowVatCalc(false)
    setShowConverter(false)
  },[])
  //  Function to toggle Vat calculator
  const toggleVatCalculator = useCallback(() => {
    setShowVatCalc(prev => !prev)
    setShowCaculator(false)
    setShowConverter(false)
  },[])
  //  Function to toggle currency converter
  const toggleConverter = useCallback(() => {
    setShowConverter(prev => !prev)
    setShowCaculator(false)
    setShowVatCalc(false)

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
        <Button onClick={toggleCalculator}>
          SHOW CALCULATOR
        </Button>
      </div>
      <div id='toggle-intcalculator-block'>
        <Button variant='light' onClick={toggleVatCalculator}>SHOW VAT CALCULATOR</Button>
      </div>
      <div id='toggle-converter-block'>
        <Button onClick={toggleConverter}>SHOW CURRENCY CONVERTER</Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggle-col2'/>
      </Row>
      {showCalculator && (
        <div id='basic-calculator-panal'>
          <Row id='basic-calculator-row'>
        <Col/>
        <Col xs={5}></Col>
        <Col />
      </Row>
        </div>
      )}
      {showVatCalc && (
        <div id='vat-calculator-panal'>
          <Row id='vat-calculator-row'>
            <Col id='vat-calculator-col1'/>
            <Col xs={12} md={8} id='vat-calculator-col'></Col>
            <Col id='vat-calculator-col2'/>
          </Row>
        </div>
      )}
      {showConverter && (
        <div id='currency-converter-panal'>
        <Row id='currency-converter-row'>
        <Col id='currency-convert-col1'/>
        <Col xs={6} id='currency-convert-col'>
          <CurrencyConverter/>
        </Col>
        <Col id='currency-convert-col2'/>
      </Row>

        </div>
      )}
          </div>
        </section>
      <Footer logout={logout}/>
    </div>
  )
}
