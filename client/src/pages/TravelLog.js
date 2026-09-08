// TravelLog.js Route '/travelLog'
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useEffect, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/TravelLog.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Header from '../components/Header'
import Footer from '../components/Footer'
import TripsList from '../components/TripsList';

//=======MAIN TRAVELLOG FUNCTION COMPONENT=========
export default function TravelLog(//Export the default TravelLog.js function component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser,
    logout,
    setError
  }
) {
  // ========STATE VARIABLES=============================
  const [showTrips, setShowTrips] = useState(false)
  const [showEntries, setShowEntries] = useState(false)
  /* The logged in user's trips, displayed by the trip list. Held here rather
  than in TripsList.js so the page owns the request, the same arrangement the
  journal and the expenses page use for their own lists */
  const [userTrips, setUserTrips] = useState([])
  const [loadingTrips, setLoadingTrips] = useState(false)

  //================EVENT HANDLERS=====================
  const toggleTrips = useCallback(() => {
    setShowTrips(prev => (!prev))
    setShowEntries(false)
  },[])

  const toggleEntries = useCallback(() => {
    setShowEntries(prev => (!prev))
    setShowTrips(false)
  },[])

  //======================CALLBACKS/REQUEST FUNCTIONS========================
  /* Loads the logged in user's trips from GET /trip/fetchTrips.
  The route is behind checkJwtToken and filters on the userId it reads off that
  token, so the list only ever holds this account's own trips. Each trip carries
  its destination, dates, status, entryCount and hasBudget, which is every column
  the list displays, so no second request is needed to fill a row.

  Called on mount rather than when the list is opened, so the trips are already
  in hand by the time SHOW TRIPS is pressed, and passed to TripsList.js as
  fetchUserTrips as well, so the list can reload itself after an edit or a
  delete without the page being reloaded */
  const fetchUserTrips = useCallback(async () => {
    const token = localStorage.getItem('token');
    // Conditional rendering to check a session is still stored
    if (!token) {
      console.warn('[WARN: TravelLog.js] No token stored, cannot fetch trips');
      return;
    }

    try {
      setLoadingTrips(true)

      const response = await fetch('http://localhost:3001/trip/fetchTrips', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      /* Safely parse the JSON response. Guarded because the body is empty or is
      not JSON at all on a 429 from the rate limiter, and response.json() would
      throw before the status could be reported */
      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        // Defaulted to an empty array, so the list always maps over one
        setUserTrips(Array.isArray(data.trips) ? data.trips : [])
        console.log(`[SUCCESS: TravelLog.js] Loaded ${data.trips?.length || 0} trips`)
      } else {
        /* Reported without clearing the trips already on screen, so a failed
        refresh does not empty a list the user is reading */
        const message = data?.message || response?.statusText || 'Could not load your trips.';
        setError?.(message)
        console.error(`[ERROR: TravelLog.js] Fetch trips failed with status ${response.status}: ${message}`)
      }
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError?.('Could not reach the server. Please check your connection and try again.')
      console.error(`[ERROR: TravelLog.js] Fetch trips request failed: ${error.message}`)
    } finally {
      setLoadingTrips(false)
    }
  },[setError])

  //====================USE EFFECTS==========================
  /* Loads the trips once, when the page mounts. fetchUserTrips only changes
  when setError does, so this does not re-run as the lists are toggled */
  useEffect(() => {
    fetchUserTrips()
  },[fetchUserTrips])
  //============JSX RENDERING=================
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'TRAVEL LOG'}/>
      <section id='travelLog-section1'>
        <div id='travelLog-sec1Panal'>
           <Row id='travelLogToggleRow'>
        <Col id='travelLogToggleCol1'/>
        <Col xs={6} id='travelLogToggleCol'>
          <Stack gap={3} id='travelLogToggleStack'>
            <div className="p-2" id='toggleTripsBlock'>
              <Button
              variant='light'
               onClick={toggleTrips}
               id='toggleTripListBtn'
               type='button'
               // ARIA ATTRIBUTES
               aria-label={showTrips ? 'Hide Trips' : 'Show Trips'}
               aria-controls='trips-list-panal'
               aria-pressed={showTrips}
               /* Reports whether the list is on screen, and is what
               TravelLog.css marks the open button on */
               aria-expanded={showTrips}
               >SHOW TRIPS</Button>
            </div>
            <div className="p-2" id='toggleEntryBlock'>
              {/* aria-controls is left off until the entries list has a panel of
              its own to name: the block below it is still a placeholder */}
              <Button
              variant='light'
              onClick={toggleEntries}
              id='toggleEntriesListBtn'
              type='button'
              // ARIA ATTRIBUTES
              aria-label={showEntries ? 'Hide Entries' : 'Show Entries'}
              aria-pressed={showEntries}
              aria-expanded={showEntries}
              >SHOW ENTRIES</Button>
            </div>
    </Stack>
        </Col>
        <Col id='travelLogToggleCol2'/>
      </Row>
      {showTrips && (
        <div id='trips-list-panal'>
          <Row id='tripsListRow'>
            <Col id='tripsListCol'>
              <div id='tripsList-div'>
                <TripsList
                  currentUser={currentUser}
                  userTrips={userTrips}
                  loadingTrips={loadingTrips}
                  fetchUserTrips={fetchUserTrips}
                />
              </div>
            </Col>
          </Row>
        </div>
      )}
      {showEntries && (
        <div>
          <Row>
            <Col>
              <div>
                ENTRIES LIST
              </div>
            </Col>
          </Row>
        </div>
      )}
        </div>


      </section>
      <Footer logout={logout}/>
    </div>
  )
}
