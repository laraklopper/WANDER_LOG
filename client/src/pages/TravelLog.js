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

/* The empty edit trip form, used for the initial state, each time the form is
opened on a trip, and by its clear button. The two nested objects mirror the
shape tripSchema stores, so a change does not have to be reassembled before it
is sent.

Empty rather than filled with the trip because the form submits a PATCH: nothing
on it is required, and a field left blank is one being left as it is stored
rather than one being cleared. The form shows what each field currently holds
beside the input instead */
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

/* Builds the body the PATCH is sent with, holding only the fields the form was
actually filled in with: an input left alone is not sent at all, and the API
leaves that field as it is stored. A blank is not a value here, it is the form
saying nothing about that field.

The country is only sent while the trip is, or is being made, international. A
switch to domestic sends the type on its own and the API unsets the stored
country with it, which is also why the type this edit would leave behind is what
decides whether the country travels rather than the one currently stored. */
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
  /* The logged in user's trips, displayed by the trip list. Held here rather
  than in TripsList.js so the page owns the request, the same arrangement the
  journal and the expenses page use for their own lists */
  const [userTrips, setUserTrips] = useState([])
  const [loadingTrips, setLoadingTrips] = useState(false)
  // ============EDIT TRIP STATE=============
  /* Which trip the edit form is open on, held as an id rather than as the trip
  itself for the same reason the list holds its selection that way: the trips are
  refetched after an edit, and a stored object could outlive the record it was
  copied from and leave the form saying a field currently holds something the
  database no longer has */
  const [editingTripId, setEditingTripId] = useState(null)
  // The changes typed into the edit form, empty until a field is filled in
  const [editTripData, setEditTripData] = useState(EMPTY_TRIP_EDIT)
  // Blocks a second submit while the first request is in flight
  const [submittingTrip, setSubmittingTrip] = useState(false)
  /* Field keyed messages returned by the server when Mongoose validation fails,
  for example { 'date.endDate': 'End date must be after start date' }. Passed to
  the form so each message can be shown against its own input */
  const [tripFieldErrors, setTripFieldErrors] = useState({})

  /* Resolved out of the list on every render, so the form follows the state this
  page owns: when a refetch drops the trip being edited, the form is left with
  nothing to report as currently stored rather than showing a stale copy */
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

  /* Opens the edit form on the trip whose details panel it was pressed from, so
  the page knows which id to PATCH and the form knows what each field currently
  holds. The form is emptied either way, on the way in as well as on the way out,
  so a change typed for one trip cannot be left sitting in the inputs when the
  form is opened on another */
  const toggleEditTrip = useCallback((trip = null) => {
    const opening = !showEditTrip;

    setShowEditTrip(opening)
    setEditingTripId(opening ? trip?._id || null : null)
    setEditTripData(EMPTY_TRIP_EDIT)
    setTripFieldErrors({})
  },[showEditTrip])

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

  /* Sends the filled in fields of the edit form to PATCH /trip/editTrip/:id.
  The id is the trip's own, and the route matches it against the account on the
  token, so another user's trip is reported as missing rather than written to.

  A PATCH, so only what was actually typed is sent and every other field keeps
  the value it is stored with — which is why nothing on the form is required and
  why the body is built by tripChanges rather than from the state as it stands.
  The owner is not sent either, for the same reason it is not on a create: userId
  and username are read from the token and the account */
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

      /* Safely parse the JSON response. Guarded because the body is empty or is
      not JSON at all on a 429 from the rate limiter, and response.json() would
      throw before the status could be reported */
      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setError?.(null)
        setTripFieldErrors({})
        // Closed on the trip it was opened on, with the changes cleared out of it
        setShowEditTrip(false)
        setEditingTripId(null)
        setEditTripData(EMPTY_TRIP_EDIT)
        /* Reloaded so the edited trip is what the list and its details panel
        show, both of which are built from this page's copy */
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
                  toggleEditTrip={toggleEditTrip}
                  showEditTrip={showEditTrip}
                  setShowEditTrip={setShowEditTrip}
                  setError={setError}
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
      <Footer logout={logout}/>
    </div>
  )
}
