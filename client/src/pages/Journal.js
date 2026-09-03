// Journal.js Route '/journal'
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useState } from 'react'
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
import AddTripForm from '../components/AddTripForm';

// ============MAIN JOURNAL COMPONENT============
export default function Journal(//Export default Journal.js component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, logout}) {
      const [showAddTripForm, setShowAddTripForm] = useState(false)
      const [showAddEntryForm, setShowAddEntryForm] = useState(false)
      const [showAddExpForm, setShowAddExpForm] = useState(false)

      const toggleAddTripForm = useCallback(() => {
        setShowAddTripForm(prev => (!prev))
        setShowAddEntryForm(false)
        setShowAddExpForm(false)

      },[])
      const toggleAddEntryForm = useCallback(() => {
        setShowAddEntryForm(prev => (!prev))
        setShowAddTripForm(false)
        setShowAddExpForm(false)
      },[])
      const toggleAddExpenseForm = useCallback(() => {
        setShowAddExpForm(prev => (!prev))
        setShowAddEntryForm(false)
        setShowAddTripForm(false)

      },[])
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'JOURNAL'}/>
      <section id='journalSection1'>
        <div id='journal-section1-panal'>
          <Row id='toggleJournalRow'>
        <Col id='toggleJournalCol1'/>
        <Col xs={5} id='toggleJournalCol'>
           <Stack gap={3} id='toggleJournalFormsStack'>
      <div className="p-2">
        <Button
        variant='light'
        onClick={toggleAddTripForm}
        id='toggleAddTripBtn'
        type='button'
        // ARIA ATTRIBUTES
        >
          {showAddTripForm ? 'Hide Form' : 'Add Trip'}
        </Button>
      </div>
      <div className="p-2">
        <Button
        variant='light'
        onClick={toggleAddEntryForm}
        id='toggleAddEntryBtn'
        type='button'
        // ARIA ATTRIBUTES:
        >
        {showAddEntryForm ? 'Hide Form' : 'Add Entry'}
        </Button>
      </div>
      <div className="p-2">
        <Button
        variant='light'
        onClick={toggleAddExpenseForm}
        id='toggleAddExpBtn'
        type='button'
        // ARIA ATTRIBUTES
        >
          {showAddExpForm ? 'Hide Form': 'Add Trip Expense'}
        </Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggleJournalCol2'/>
      </Row>
      <div id='journal-form-panal'>
        {showAddTripForm && (
          <div id='add-trip-panal'>
            <Row id='addTripRow'>
            <Col id='addTripCol1'/>
              <Col xs={12} md={8} id='addTripCol'>
                <div id='addTrip-display-block'>
                  <AddTripForm/>
                </div>
              </Col>
              <Col id='addTripCol2'/>
            </Row>
          </div>
        )}
        {showAddEntryForm && (
          <div>
            <Row>
              <Col>
                <div>
                  ADD ENTRY
                </div>
              </Col>
            </Row>
          </div>
        )}
        {showAddExpForm && (
          <div>
            <Row>
              <Col>
                <div>
                  ADD ENTRY
                </div>
              </Col>
            </Row>
          </div>
        )}
      </div>
        </div>
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
