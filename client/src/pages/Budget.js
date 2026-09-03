import React, { useCallback, useState, useEffect } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Budget.css'
import '../css/componentCss/CalculatorsDisplay.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
import CurrencyConverter from '../components/CurrencyConverter';
import ConversionsList from '../components/ConversionsList';
import Calculator from '../components/Calculator';
import VatCalculator from '../components/VatCalculator';
import { EMPTY_CONVERT_FORM, FALLBACK_CURRENCIES } from '../util/currencyFunc';

export default function Budget({currentUser, logout, setError, error}) {
  // ==========STATE VARIABLES===============
  const [currencyOptions, setCurrencyOptions] = useState(FALLBACK_CURRENCIES)
  const [form, setForm] = useState(EMPTY_CONVERT_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [conversions, setConversions] = useState([])
  const [conversionsTotal, setConversionsTotal] = useState(0)
  // Toggle Buttons State
  const [showCalculator, setShowCaculator] = useState(false)
  const [showVatCalc, setShowVatCalc] = useState(false)
  const [showConverter, setShowConverter] = useState(false)
  
  useEffect(() => {
      let ignore = false;
  
      const loadCurrencies = async () => {
        const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
        try {
          const response = await fetch(`http://localhost:3001/api/currencies`, {
              method: 'GET',//HTTP request method
              mode: 'cors',//Enable Cross-Origin Resource Sharing
              headers: { 
                'Authorization': `Bearer ${token}` // Attach the token in the Authorization header
              }
            }) 
            
            const data = await response.json();//Parse the response as json
  
            //Conditional rendering to check the request succeeded
            if (!response.ok) {
              console.error('[ERROR: CurrencyConverter.js, loadCurrencies]', data.message || 'Could not load currencies.');//Log an error message in the console for debugging purposes
              return;
            }
  
            if (!ignore && data.currencies?.length) setCurrencyOptions(data.currencies);
        } catch (error) {
          console.error('[ERROR: CurrencyConverter.js, loadCurrencies]', error.message);
        }
      }
      loadCurrencies();
      return () => { ignore = true }
    },[])

    const convert = useCallback(async () => {
      setError('')
      setResult(null)
      if (!form.amount || !form.from || !form.to) {
        setError('Please fill in all fields.');
          return;
      }
      setLoading(true)
      const token = localStorage.getItem('token')
      try {
        const response = await fetch(`http://localhost:3001/api/convert?amount=${encodeURIComponent(form.amount)}&from=${encodeURIComponent(form.from)}&to=${encodeURIComponent(form.to)}`,{
          method: 'GET',
          mode:'cors',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()

         if (!response.ok) {
           console.error(data.message || 'Conversion failed.');//Log an error message in the console for debugging purposes
            setError(data.message || 'Conversion failed.');// Set the error state to display the error in the UI
            return;
        }

        setResult(data);
      } catch (error) {
        console.error('Failed to convert. Please try again.');
          setError('Failed to convert. Please try again.');//Set the Error state to display a message in the UI
      }finally{
        setLoading(false)
      }
    },[setError, setLoading, form.to, form.from, form.amount])

       const fetchConversions = useCallback(async () => {
      try {
       const token = localStorage.getItem('token')
       const response =  await fetch(`http://localhost:3001/api/history`,{
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
       } )
       const data = await response.json().catch(() =>({}))

       //Conditional rendering to check the request succeeded
       if (!response.ok) {
        const message = data.message || 'Could not load your saved conversions.';
        console.error('[ERROR: CurrencyConverter.js, fetchConversions]', message);//Log an error message in the console for debugging purposes
        setError(message);// Set the error state to display the error in the UI
        return;// Exit the function early, keeping whatever list is already on screen
       }

       const fetchedConversions = Array.isArray(data.conversions) ? data.conversions : [];
       setConversions(fetchedConversions)
       setConversionsTotal(typeof data.total === 'number' ? data.total : fetchedConversions.length)
       setError('');//Clear any previous error messages
       console.log(`[SUCCESS: CurrencyConverter.js, fetchConversions] Fetched ${fetchedConversions.length} of ${data.total ?? fetchedConversions.length} conversions`);
      } catch (error) {
        console.error(`Error fetching conversion data`, error.message);
        setError(`Error fetching conversion data, ${error.message}`)
      }
    },[setError])
     const saveConversions = useCallback(async (conversion) => {
      const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
      const response = await fetch(`http://localhost:3001/api/save`,{
        method: 'POST',//HTTP request method
        mode: 'cors',//Enable Cross-Origin Resource Sharing
        headers: {
          'Content-Type': 'application/json',// Specify that we're sending JSON data in the request body
          'Authorization': `Bearer ${token}`,// Attach the token in the Authorization header
        },
        body: JSON.stringify({// Send the conversion's inputs in the request body as JSON
          amount: conversion.amount,
          from: conversion.from,
          to: conversion.to,
        })
      })

      const data = await response.json();//Parse the response as json

      //Conditional rendering to check the request succeeded
      if (!response.ok) {
        const message = data.message || 'Could not save the conversion. Please try again.';
        console.error('[ERROR: CurrencyConverter.js, saveConversion]', message);//Log an error message in the console for debugging purposes
        throw new Error(message);
      }

      /* Refresh the calculations list so a save is visible straight away. The
      list fetches on mount, so this only matters while it is already open — but
      without it the panel would sit there missing the conversion just saved. */
      fetchConversions();

      return data;
        },[fetchConversions])

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
        <Button variant='light' onClick={toggleCalculator} id='toggleCalcBtn'>
          {showCalculator ? 'Hide Calculator': 'Show Calculator'}
        </Button>
      </div>
      <div id='toggle-vatcalculator-block'>
        <Button variant='light' id='toggleVatCalcBtn' onClick={toggleVatCalculator}>SHOW VAT CALCULATOR</Button>
      </div>
      <div id='toggle-converter-block'>
        <Button 
        variant='light'
        type='button'
        onClick={toggleConverter} 
        id='toggleConverterBtn'>
          {showConverter ? 'Close Converter': 'Show Currency Converter'}
        </Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggle-col2'/>
      </Row>
      <div id='calculator-display-panal'>
      {showCalculator && (
        <div id='basic-calculator-panal'>
          <Row id='basic-calculator-row'>
        <Col id='basic-calculator-col1'/>
        <Col xs={5} id='basic-calculator-col'>
          <div id='basic-calculator-block'>
            <Calculator/>
          </div>
        </Col>
        <Col id='basic-calculator-col2'/>
      </Row>
        </div>
      )}
      {showVatCalc && (
        <div id='vat-calculator-panal'>
          <Row id='vat-calculator-row'>
            <Col id='vat-calculator-col1'/>
            <Col xs={6}  id='vat-calculator-col'>
              <div id='vat-calculator-block'>
                <VatCalculator/>
              </div>
            </Col>
            <Col id='vat-calculator-col2'/>
          </Row>
        </div>
      )}
      {showConverter && (
        <div id='currency-converter-panal'>
        <Row id='currency-converter-row'>
        <Col id='currency-convert-col1'/>
        <Col xs={6} id='currency-convert-col'>
          <div id='converter-display-block'>
           <CurrencyConverter
            convert={convert}
            saveConversions={saveConversions}
            EMPTY_CONVERT_FORM={EMPTY_CONVERT_FORM}
            currencyOptions={currencyOptions}
            form={form}
            setForm={setForm}
            result={result}
            error={error}
            setError={setError}
            loading={loading}
            setLoading={setLoading}
            setResult={setResult}
          /> 
          </div>
          
        </Col>
        <Col id='currency-convert-col2'/>
      </Row>
        </div>
      )}
      </div>
          </div>
        </section>
        <section id='budget-section2'>
          <Row>
            <Col>
              <div>
                <ConversionsList
                  conversionsTotal={conversionsTotal}
                  currencyOptions={currencyOptions}
                  fetchConversions={fetchConversions}
                  conversions={conversions}
                />
              </div>
            </Col>
          </Row>
        </section>
      <Footer logout={logout}/>
    </div>
  )
}
