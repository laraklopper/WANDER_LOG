// TravelLog.js Route '/travelLog'
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import EditTripForm from '../components/EditTripForm';
import EntriesList from '../components/EntriesList';
import EditEntry from '../components/EditEntry';


const EMPTY_TRIP_EDIT = {
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

const tripChanges = (form = {}, trip = null) => {
  const changes = {};

  const title = String(form.title || '').trim();
  const tripLocation = String(form.destination?.tripLocation || '').trim();
  const country = String(form.destination?.country || '').trim();
  // The chosen type where one was chosen, otherwise the one already stored
  const destinationType = form.destination?.destinationType || trip?.destination?.destinationType;

  if (title) changes.title = title;
  if (form.purpose) changes.purpose = form.purpose;
  if (form.status) changes.status = form.status;

  /* Built as the nested object the schema stores rather than as three flat keys,
  and left off entirely when the destination was not touched */
  const destination = {};

  if (form.destination?.destinationType) destination.destinationType = form.destination.destinationType;
  if (tripLocation) destination.tripLocation = tripLocation;
  if (country && destinationType === 'International') destination.country = country;

  if (Object.keys(destination).length) changes.destination = destination;

  // Either date may be moved on its own, so only the one that was is sent
  const date = {};

  if (form.date?.startDate) date.startDate = form.date.startDate;
  if (form.date?.endDate) date.endDate = form.date.endDate;

  if (Object.keys(date).length) changes.date = date;

  return changes;
}

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
  const [showEditTrip, setShowEditTrip] = useState(false)
  const [showEditEntry, setShowEditEntry] = useState(false)
  const [userTrips, setUserTrips] = useState([])//State to display the users trips
  const [loadingTrips, setLoadingTrips] = useState(false)
  // ============EDIT TRIP STATE=============
  const [editingTripId, setEditingTripId] = useState(null)//State to indicate which trip is being edited
  const [editTripData, setEditTripData] = useState(EMPTY_TRIP_EDIT)// The changes typed into the edit form, empty until a field is filled in
  const [submittingTrip, setSubmittingTrip] = useState(false)// Blocks a second submit while the first request is in flight
  const [tripFieldErrors, setTripFieldErrors] = useState({})
 


  const editingTrip = useMemo(
    () => userTrips.find((trip) => trip._id === editingTripId) || null,
    [userTrips, editingTripId]
  )

  //================EVENT HANDLERS=====================
  const toggleTrips = useCallback(() => {
    setShowTrips(prev => (!prev))
    setShowEntries(false)
  },[])

  const toggleEntries = useCallback(() => {
    setShowEntries(prev => (!prev))
    setShowTrips(false)
  },[])

  // Toggle button to display edit trip form
  const toggleEditTrip = useCallback((trip = null) => {
    const opening = !showEditTrip;

    setShowEditTrip(opening)
    setEditingTripId(opening ? trip?._id || null : null)
    setEditTripData(EMPTY_TRIP_EDIT)
    setTripFieldErrors({})
  },[showEditTrip])

  const toggleEditEntry = useCallback(() => {
    setShowEditEntry(prev => !prev)
    setEditTripData(false)
    setShowTrips(false)
  },[])
  //======================CALLBACKS/REQUEST FUNCTIONS========================
  /* Loads the logged in user's trips from GET /trip/fetchTrips.*/
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

  /* Loads one trip from GET /trip/fetchTrip/:id, with the journal entries filed
  against it.Returns `{ trip, entries }`, or null when it could not be read */
  const fetchTrip = useCallback(async (tripId) => {
    // Conditional rendering to check a trip was identified
    if (!tripId) {
      console.warn('[WARN: TravelLog.js] No trip id given, cannot fetch the trip');
      return null;
    }

    const token = localStorage.getItem('token');
    // Conditional rendering to check a session is still stored
    if (!token) {
      setError?.('Your session has expired. Please log in again.')
      console.warn('[WARN: TravelLog.js] No token stored, cannot fetch the trip');
      return null;
    }

    try {
      const response = await fetch(`http://localhost:3001/trip/fetchTrip/${tripId}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })


      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        console.log(`[SUCCESS: TravelLog.js] Loaded trip ${data.trip?._id} with ${data.count ?? 0} entries`)
        // Conditional rendering to check the trip actually came back with the 200
        if (!data.trip) {
          console.warn('[WARN: TravelLog.js] Trip', tripId, 'was answered without a trip on it');
          return null
        }
        return {
          trip: data.trip,         
          entries: Array.isArray(data.entries) ? data.entries : [],// Defaulted to an empty array, so a caller always maps over one
        }
      }

      const message = data?.message || response?.statusText || 'Could not load that trip.';
      setError?.(message)
      console.error(`[ERROR: TravelLog.js] Fetch trip failed with status ${response.status}: ${message}`)
      return null
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError?.('Could not reach the server. Please check your connection and try again.')
      console.error(`[ERROR: TravelLog.js] Fetch trip request failed: ${error.message}`)
      return null
    }
  },[setError])

  // Function to edit ad trip
  const editTrip = useCallback(async () => {
    if (submittingTrip) return;

    // Conditional rendering to check a trip is open for editing
    if (!editingTripId) {
      setError?.('No trip is open for editing.')
      console.warn('[WARN: TravelLog.js] No trip id, cannot edit a trip');
      return;
    }

    const changes = tripChanges(editTripData, editingTrip);

    /* Checked here as well as by the form, so a call that did not come through
    its submit handler is not sent as an empty PATCH the API would refuse */
    if (!Object.keys(changes).length) {
      setError?.('Nothing has been changed yet.')
      console.warn('[WARN: TravelLog.js] No changes submitted, cannot edit a trip');
      return;
    }

    const token = localStorage.getItem('token');
    // Conditional rendering to check a session is still stored
    if (!token) {
      setError?.('Your session has expired. Please log in again.')
      console.warn('[WARN: TravelLog.js] No token stored, cannot edit a trip');
      return;
    }

    try {
      setSubmittingTrip(true)
      setError?.(null)
      setTripFieldErrors({})

      const response = await fetch(`http://localhost:3001/trip/editTrip/${editingTripId}`, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(changes)
      })

     
      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setError?.(null)
        setTripFieldErrors({})
        // Closed on the trip it was opened on, with the changes cleared out of it
        setShowEditTrip(false)
        setEditingTripId(null)
        setEditTripData(EMPTY_TRIP_EDIT)
      
        fetchUserTrips()
        alert(data.message || 'Trip updated successfully.')
        console.log('[SUCCESS: TravelLog.js] Trip updated:', data.trip?._id)
      } else {
        /* Falls back through the shapes the API can return: a plain message, an
        error string, then the status text */
        const message =
          data?.message ||
          data?.error ||
          response?.statusText ||
          'Could not update the trip.';
        // Present on a 400 from Mongoose validation, absent on a 401, 404 or a 500
        if (data.errors) setTripFieldErrors(data.errors);
        setError?.(message);
        console.error(`[ERROR: TravelLog.js] Edit trip failed with status ${response.status}: ${message}`);
      }
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError?.('Could not reach the server. Please check your connection and try again.');
      console.error(`[ERROR: TravelLog.js] Edit trip request failed: ${error.message}`);
    } finally {
      setSubmittingTrip(false)
    }
  },[submittingTrip, editingTripId, editingTrip, editTripData, setError, fetchUserTrips])

//  Function to delete a trip
  const deleteTrip = useCallback(async (tripId) => {
    // Conditional rendering to check a trip was identified
    if (!tripId) {
      console.warn('[WARN: TravelLog.js] No trip id given, cannot delete the trip');
      return false;
    }

    const token = localStorage.getItem('token');
    // Conditional rendering to check a session is still stored
    if (!token) {
      setError?.('Your session has expired. Please log in again.')
      console.warn('[WARN: TravelLog.js] No token stored, cannot delete the trip');
      return false;
    }

    try {
      setError?.(null)

      const response = await fetch(`http://localhost:3001/trip/deleteTrip/${tripId}`, {
        method: 'DELETE',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

     
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = data?.message || response?.statusText || 'Could not delete the trip.';
        setError?.(message)
        console.error(`[ERROR: TravelLog.js] Delete trip failed with status ${response.status}: ${message}`)
        return false
      }

      if (String(editingTripId) === String(tripId)) {
        setShowEditTrip(false)
        setEditingTripId(null)
        setEditTripData(EMPTY_TRIP_EDIT)
        setTripFieldErrors({})
        console.log('[INFO: TravelLog.js] Closed the edit form, trip', tripId, 'was deleted');
      }

      /* Awaited so the caller's delete stays busy until the refreshed list has
      arrived rather than only until the DELETE answered, and the row is gone
      from the list by the time the button reports itself done */
      await fetchUserTrips()

      alert(data.message || 'Trip deleted successfully.')
      console.log('[SUCCESS: TravelLog.js] Trip deleted:', data.tripId || tripId, 'with', data.removedEntries ?? 0, 'entry(s) and', data.removedExpenses ?? 0, 'expense(s)')
      return true
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError?.('Could not reach the server. Please check your connection and try again.')
      console.error(`[ERROR: TravelLog.js] Delete trip request failed: ${error.message}`)
      return false
    }
  },[editingTripId, setError, fetchUserTrips])


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
         </div>

      </section>
      {showTrips && (
        <section className='travelLogSec2'>
        <div id='trips-list-panal'>
          <Row id='tripsListRow'>
            <Col id='tripsListCol'>
              <div id='tripsList-div'>
                <TripsList
                  currentUser={currentUser}
                  userTrips={userTrips}
                  loadingTrips={loadingTrips}
                  fetchUserTrips={fetchUserTrips}
                  toggleEditTrip={toggleEditTrip}
                  showEditTrip={showEditTrip}
                  deleteTrip={deleteTrip}
                  fetchTrip={fetchTrip}
                />
              </div>
            </Col>
          </Row>
        </div>
         </section>
      )}
      {showEntries && (
        <section className='travelLogSec2'>
        <div id='entriesListPanal'>
          <Row id='entriesListRow'>
            <Col id='entriesListCol'>
                <EntriesList
                  currentUser={currentUser}
                  toggleEditEntry={toggleEditEntry}
                  showEditEntry={showEditEntry}
                />
            </Col>
          </Row>
        </div>
        </section>
      )}
      {/* SHOW EDIT TRIP FORM: only rendered once a trip's EDIT TRIP has been
      pressed, so the form is never on screen without a trip to say what each of
      its fields currently holds */}
      {showEditTrip && editingTrip && (
        <section className='travelLogSec2'>
        <div id='edit-trip-panal'>
            <Row id='editTripRow'>
            <Col id='editTripCol'>
              <EditTripForm
                trip={editingTrip}
                editTripData={editTripData}
                setEditTripData={setEditTripData}
                editTrip={editTrip}
                submitting={submittingTrip}
                fieldErrors={tripFieldErrors}
                emptyForm={EMPTY_TRIP_EDIT}
              />
            </Col>
          </Row>
        </div>

        </section>
      )}
      {/* SHOW EDIT ENTRY */}
      {showEditEntry && (
        <section>
          <div>
            <Row>
              <Col>
                <EditEntry
                />
              </Col>
            </Row>
          </div>
        </section>
      )}
      <Footer logout={logout}/>
    </div>
  )
}
