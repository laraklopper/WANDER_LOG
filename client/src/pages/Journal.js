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
import AddEntryForm from '../components/AddEntryForm';
import AddExpenseForm from '../components/AddExpenseForm';

/* Empty trip shape, used for the initial state and by the form's clear button.
The two nested objects mirror the shape tripSchema stores, so the state can be
sent to the API as it is. The owner is left out on purpose: the API takes the
userId from the token and reads the username off the account */
const EMPTY_TRIP = {
  title: '',
  purpose: '',
  destination: {
    destinationType: '',
    tripLocation: '',
    country: '',
  },
  date: {
    startDate: '',
    endDate: '',
  },
  status: '',
};

// ============MAIN JOURNAL COMPONENT============
export default function Journal(//Export default Journal.js component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, logout, setError}) {
      const [showAddTripForm, setShowAddTripForm] = useState(false)
      const [showAddEntryForm, setShowAddEntryForm] = useState(false)
      const [showAddExpForm, setShowAddExpForm] = useState(false)
      // ============ADD TRIP STATE=============
      const [newTripData, setNewTripData] = useState(EMPTY_TRIP)
      // Blocks a second submit while the first request is in flight
      const [submittingTrip, setSubmittingTrip] = useState(false)
      /* Field keyed messages returned by the server when Mongoose validation
      fails, for example { 'date.endDate': 'End date must be after start date' }.
      Passed to the form so each message can be shown against its own input */
      const [tripFieldErrors, setTripFieldErrors] = useState({})

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

      //======================CALLBACKS/REQUEST FUNCTIONS========================
      /* Sends the completed form to POST /trip/addTrip.
      The route is behind checkJwtToken, so the stored token is attached to the
      request. The trip's owner is not sent with it: the API reads the userId off
      that token, which is what stops a trip being filed against another account */
      const addTrip = useCallback(async () => {
        if (submittingTrip) return;

        const token = localStorage.getItem('token');
        // Conditional rendering to check a session is still stored
        if (!token) {
          setError?.('Your session has expired. Please log in again.');
          console.warn('[WARN: Journal.js] No token stored, cannot add a trip');
          return;
        }

        try {
          setSubmittingTrip(true)
          setError?.(null)
          setTripFieldErrors({})

          const response = await fetch('http://localhost:3001/trip/addTrip', {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: newTripData.title,
              purpose: newTripData.purpose,
              destination: {
                destinationType: newTripData.destination?.destinationType,
                tripLocation: newTripData.destination?.tripLocation,
                /* Only sent for an international trip. The API drops it from a
                domestic one anyway, so this keeps the two in agreement */
                country: newTripData.destination?.destinationType === 'International'
                  ? newTripData.destination?.country
                  : undefined,
              },
              date: newTripData.date,
              status: newTripData.status,
            })
          })

          /* Safely parse the JSON response. Guarded because the body is empty or
          is not JSON at all on a 429 from the rate limiter, and response.json()
          would throw before the status could be reported */
          const data = await response.json().catch(() => ({}))

          if (response.ok) {
            setError?.(null)
            setTripFieldErrors({})
            // Cleared so the next trip starts from an empty form
            setNewTripData(EMPTY_TRIP)
            setShowAddTripForm(false)
            alert(data.message || 'Trip added successfully.')
            console.log('[SUCCESS: Journal.js] Trip created:', data.trip?._id)
          } else {
            /* Falls back through the shapes the API can return: a plain
            message, an error string, then the status text */
            const message =
              data?.message ||
              data?.error ||
              response?.statusText ||
              'Could not add the trip.';
            // Present on a 400 from Mongoose validation, absent on a 401 or a 500
            if (data.errors) setTripFieldErrors(data.errors);
            setError?.(message);
            console.error(`[ERROR: Journal.js] Add trip failed with status ${response.status}: ${message}`);
          }
        } catch (error) {
          // Only a network level failure reaches here, a 4xx or 5xx is handled above
          setError?.('Could not reach the server. Please check your connection and try again.');
          console.error(`[ERROR: Journal.js] Add trip request failed: ${error.message}`);
        } finally {
          setSubmittingTrip(false)
        }
      },[submittingTrip, newTripData, setError])
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'JOURNAL'}/>
      <section id='journalSection1'>
        <div id='journal-section1-panal'>
          <Row id='toggleJournalRow'>
        <Col id='toggleJournalCol1'/>
        <Col xs={5} id='toggleJournalCol'>
           <Stack gap={3} id='toggleJournalFormsStack'>
      <div className="p-2" id='toggle-addtrip-block'>
        <Button
        variant='light'
        onClick={toggleAddTripForm}
        id='toggleAddTripBtn'
        type='button'
        // ARIA ATTRIBUTES
        aria-label={showAddTripForm ? 'Hide Form' : 'Add Trip'}
        aria-controls='add-trip-panal'
        aria-pressed={showAddTripForm}
        aria-expanded={showAddTripForm}
        >
          {showAddTripForm ? 'Hide Form' : 'Add Trip'}
        </Button>
      </div>
      <div className="p-2" id='toggle-addEntry-block'>
        <Button
        variant='light'
        onClick={toggleAddEntryForm}
        id='toggleAddEntryBtn'
        type='button'
        // ARIA ATTRIBUTES:
        aria-label={showAddEntryForm ? 'Hide Form' : 'Add Entry'}
        aria-controls='add-entry-panal'
        aria-pressed={showAddEntryForm}
        aria-expanded={showAddEntryForm}
        >
        {showAddEntryForm ? 'Hide Form' : 'Add Entry'}
        </Button>
      </div>
      <div className="p-2" id='toggle-addexp-block'>
        <Button
        variant='light'
        onClick={toggleAddExpenseForm}
        id='toggleAddExpBtn'
        type='button'
        // ARIA ATTRIBUTES
        aria-label={showAddExpForm ? 'Hide Form': 'Add Trip Expense'}
        aria-pressed={showAddExpForm}
        aria-expanded={showAddExpForm}
        aria-controls='add-exp-panal'
        >
          {showAddExpForm ? 'Hide Form': 'Add Trip Expense'}
        </Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggleJournalCol2'/>
      </Row>
      <div id='journal-form-panal'>
      {/* TOGGLE ADD TRIP FORM */}
        {showAddTripForm && (
          <div id='add-trip-panal'>
            <Row id='addTripRow'>
            <Col id='addTripCol1'/>
              <Col xs={12} md={8} id='addTripCol'>
                <div id='addTrip-display-block'>
                  <AddTripForm
                    currentUser={currentUser}
                    newTripData={newTripData}
                    setNewTripData={setNewTripData}
                    addTrip={addTrip}
                    submitting={submittingTrip}
                    fieldErrors={tripFieldErrors}
                    emptyForm={EMPTY_TRIP}
                  />
                </div>
              </Col>
              <Col id='addTripCol2'/>
            </Row>
          </div>
        )}
        {/* TOGGLE ADD ENTRY FORM */}
        {showAddEntryForm && (
          <div id='add-entry-panal'>
            <Row id='addEntry-Row'>
              <Col id='addEntryCol1'/>
              <Col md={10} id='addEntryCol'>
                <div id='addEntry-display-block'>
                  <AddEntryForm
                    currentUser={currentUser}
                  />
                </div>
              </Col>
              <Col id='addEntryCol2'/>
            </Row>
          </div>
        )}
        {/* TOGGLE ADD EXPENSE FORM */}
        {showAddExpForm && (
          <div id='add-exp-panal'>
            <Row id='add-expense-row'>
              <Col>
                <div>
                  <AddExpenseForm/>
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
