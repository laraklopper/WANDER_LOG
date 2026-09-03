// Journal.js Route '/journal'
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Journal.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
// IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'

// ============MAIN JOURNAL COMPONENT============
export default function Journal(//Export default Journal.js component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, logout}) {
      const [showAddTripForm, setShowAddTripForm] = useState(false)
      const [showAddEntryForm, setShowAddEntryForm] = useState(false)
      const [addExpenseForm, setAddExpenseForm] = useState(false)
      
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'JOURNAL'}/>
      <section id='journalSection1'>
        <div id='journal-section1-panal'>
          <Row>
        <Col>1 of 3</Col>
        <Col xs={5}>
           <Stack gap={3} id='toggleJournalFormsStack'>
      <div className="p-2">
        <Button>ADD TRIP</Button>
      </div>
      <div className="p-2">Second item</div>
      <div className="p-2">Third item</div>
    </Stack>
        </Col>
        <Col>3 of 3</Col>
      </Row>
        </div>
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
