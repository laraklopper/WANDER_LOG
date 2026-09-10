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

/* Empty edit entry shape, used for the initial state and by the form's clear
button. Every field is blank because this form changes only what it is filled in
with: an untouched field is the entry being left as it is stored. The trip is
held as tripId rather than a title, because that is what the API takes: it loads
the trip and reads the stored title off it. The owner is left out on purpose,
userId and username stay as they were written from the token and the account */
const EMPTY_ENTRY_EDIT = {
  tripId: '',
  title: '',
  body: '',
};

/* Builds the PATCH body for an entry edit out of the form and the entry it was
opened on, so only what was actually filled in is sent and everything else is
left as it is stored.

The trip is the one field that can be filled in without being a change: the
select's first option keeps the trip the entry is already filed against, and an
id that names that same trip is dropped rather than sent as a move the API would
have nothing to do about. */
const entryChanges = (form = {}, entry = null) => {
  const changes = {};

  const title = String(form.title || '').trim();
  const tripId = String(form.tripId || '').trim();

  if (title) changes.title = title;
  /* Sent as it was written rather than trimmed, the schema keeps the body as it
  stands, but a box holding nothing but whitespace is not a change */
  if (String(form.body || '').trim()) changes.body = form.body;
  // Only sent when it names a trip other than the one the entry is already on
  if (tripId && tripId !== String(entry?.tripId || '')) changes.tripId = tripId;

  return changes;
}

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
  const [userEntries, setUserEntries] = useState([])//State to display the users journal entries
  const [loadingEntries, setLoadingEntries] = useState(false)
  // ============EDIT TRIP STATE=============
  const [editingTripId, setEditingTripId] = useState(null)//State to indicate which trip is being edited
  const [editTripData, setEditTripData] = useState(EMPTY_TRIP_EDIT)// The changes typed into the edit form, empty until a field is filled in
  const [submittingTrip, setSubmittingTrip] = useState(false)// Blocks a second submit while the first request is in flight
  const [tripFieldErrors, setTripFieldErrors] = useState({})
  // ============EDIT ENTRY STATE=============
  /* The entry the edit form is open on, held whole rather than by id: it is
  handed over by the entries list the form is opened from, and every field on the
  form reports what that entry currently holds */
  const [editingEntry, setEditingEntry] = useState(null)
  const [editEntryData, setEditEntryData] = useState(EMPTY_ENTRY_EDIT)// The changes typed into the edit form, empty until a field is filled in
  const [submittingEntry, setSubmittingEntry] = useState(false)// Blocks a second submit while the first request is in flight
  const [entryFieldErrors, setEntryFieldErrors] = useState({})


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

  /* Toggle button to display the edit entry form. Opened on the entry the
  entries list hands over, so the form always has one to report what each of its
  fields currently holds, and closed on nothing: the changes and the errors of
  the entry it was open on go with it */
  const toggleEditEntry = useCallback((entry = null) => {
    /* Guarded on the id, so a press that carried something other than an entry,
    a click event for instance, is treated as no entry at all: the form then
    reports that there is nothing open to edit */
    const nextEntry = entry?._id ? entry : null;

    /* Pressed from an entry the form is not already open on, it switches to
    that entry rather than closing: the button belongs to the panel, and the
    panel may have moved to another entry since the form was opened */
    const opening = !showEditEntry
      || Boolean(nextEntry && String(nextEntry._id) !== String(editingEntry?._id));

    setShowEditEntry(opening)
    setEditingEntry(opening ? nextEntry : null)
    setEditEntryData(EMPTY_ENTRY_EDIT)
    setEntryFieldErrors({})
    setShowEditTrip(false)
    setShowTrips(false)
  },[showEditEntry, editingEntry])
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

  /* Loads every entry the account has written from GET /entry/fetchEntries.
  The route is behind checkJwtToken and filters on the userId it reads off that
  token, so the list only ever holds this account's own entries. Called on
  mount, by the list's own REFRESH, and again after an entry is edited, so a
  change is on screen without the page being reloaded */
  const fetchEntries = useCallback(async () => {
    const token = localStorage.getItem('token');
    // Conditional rendering to check a session is still stored
    if (!token) {
      console.warn('[WARN: TravelLog.js] No token stored, cannot fetch entries');
      return;
    }

    try {
      setLoadingEntries(true)

      const response = await fetch('http://localhost:3001/entry/fetchEntries', {
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
        setUserEntries(Array.isArray(data.entries) ? data.entries : [])
        console.log(`[SUCCESS: TravelLog.js] Loaded ${data.entries?.length || 0} entries`)
      } else {
        /* Reported without clearing the entries already on screen, so a failed
        refresh does not empty a list the user is reading */
        const message = data?.message || response?.statusText || 'Could not load your entries.';
        setError?.(message)
        console.error(`[ERROR: TravelLog.js] Fetch entries failed with status ${response.status}: ${message}`)
      }
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError?.('Could not reach the server. Please check your connection and try again.')
      console.error(`[ERROR: TravelLog.js] Fetch entries request failed: ${error.message}`)
    } finally {
      setLoadingEntries(false)
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

  /* Sends the filled in fields of the edit entry form to
  PATCH /entry/editEntry/:id.
  The route is behind checkJwtToken, so the stored token is attached to the
  request. Only what was changed is sent, everything else is left as the entry is
  stored, and only the trip's id is sent when the entry is being moved: the API
  loads that trip, checks it belongs to the account on the token, and reads the
  title off the document. The entry's owner is not sent at all, userId and
  username stay as they were written from the token and the account */
  const editEntry = useCallback(async () => {
    if (submittingEntry) return;

    // Conditional rendering to check an entry is open for editing
    if (!editingEntry?._id) {
      setError?.('No entry is open for editing.')
      console.warn('[WARN: TravelLog.js] No entry id, cannot edit an entry');
      return;
    }

    const changes = entryChanges(editEntryData, editingEntry);

    /* Checked here as well as by the form, so a call that did not come through
    its submit handler is not sent as an empty PATCH the API would refuse */
    if (!Object.keys(changes).length) {
      setError?.('Nothing has been changed yet.')
      console.warn('[WARN: TravelLog.js] No changes submitted, cannot edit an entry');
      return;
    }

    const token = localStorage.getItem('token');
    // Conditional rendering to check a session is still stored
    if (!token) {
      setError?.('Your session has expired. Please log in again.')
      console.warn('[WARN: TravelLog.js] No token stored, cannot edit an entry');
      return;
    }

    try {
      setSubmittingEntry(true)
      setError?.(null)
      setEntryFieldErrors({})

      const response = await fetch(`http://localhost:3001/entry/editEntry/${editingEntry._id}`, {
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
        setEntryFieldErrors({})
        // Closed on the entry it was opened on, with the changes cleared out of it
        setShowEditEntry(false)
        setEditingEntry(null)
        setEditEntryData(EMPTY_ENTRY_EDIT)
        /* Both reloaded: the entries list is what the edit shows up in, and a
        trip carries the number of entries filed against it, so an entry moved
        to another trip is re-counted on both */
        fetchEntries()
        fetchUserTrips()
        alert(data.message || 'Entry updated successfully.')
        console.log('[SUCCESS: TravelLog.js] Entry updated:', data.entry?._id)
      } else {
        /* Falls back through the shapes the API can return: a plain message, an
        error string, then the status text */
        const message =
          data?.message ||
          data?.error ||
          response?.statusText ||
          'Could not update the entry.';
        // Present on a 400 from Mongoose validation, absent on a 401, 404 or a 500
        if (data.errors) setEntryFieldErrors(data.errors);
        setError?.(message);
        console.error(`[ERROR: TravelLog.js] Edit entry failed with status ${response.status}: ${message}`);
      }
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError?.('Could not reach the server. Please check your connection and try again.');
      console.error(`[ERROR: TravelLog.js] Edit entry request failed: ${error.message}`);
    } finally {
      setSubmittingEntry(false)
    }
  },[submittingEntry, editingEntry, editEntryData, setError, fetchEntries, fetchUserTrips])

  /* Sends one entry to DELETE /entry/delete/:id.
  The route is behind checkJwtToken, so the stored token is attached to the
  request, and it matches the entry on its id and the owner together: an entry
  on another account is not found at all rather than found and then refused.
  Returns whether the entry was actually removed, so the list can keep its panel
  open on it when it was not */
  const deleteEntry = useCallback(async (entryId) => {
    // Conditional rendering to check an entry was identified
    if (!entryId) {
      console.warn('[WARN: TravelLog.js] No entry id given, cannot delete the entry');
      return false;
    }

    const token = localStorage.getItem('token');
    // Conditional rendering to check a session is still stored
    if (!token) {
      setError?.('Your session has expired. Please log in again.')
      console.warn('[WARN: TravelLog.js] No token stored, cannot delete the entry');
      return false;
    }

    try {
      setError?.(null)

      const response = await fetch(`http://localhost:3001/entry/delete/${entryId}`, {
        method: 'DELETE',
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

      if (!response.ok) {
        const message = data?.message || response?.statusText || 'Could not delete the entry.';
        setError?.(message)
        console.error(`[ERROR: TravelLog.js] Delete entry failed with status ${response.status}: ${message}`)
        return false
      }

      /* The edit form is closed when it was open on the entry that went, rather
      than left offering fields with nothing to write them to */
      if (String(editingEntry?._id) === String(entryId)) {
        setShowEditEntry(false)
        setEditingEntry(null)
        setEditEntryData(EMPTY_ENTRY_EDIT)
        setEntryFieldErrors({})
        console.log('[INFO: TravelLog.js] Closed the edit form, entry', entryId, 'was deleted');
      }

      /* Both awaited so the caller's delete stays busy until the refreshed
      lists have arrived rather than only until the DELETE answered, and the row
      is gone from the list by the time the button reports itself done. The
      trips are reloaded because the hook on entrySchema has just taken this
      entry off its trip's entryCount, which the trip list and its panel show */
      await Promise.all([fetchEntries(), fetchUserTrips()])

      alert(data.message || 'Entry deleted successfully.')
      console.log('[SUCCESS: TravelLog.js] Entry deleted:', data.entryId || entryId, 'from trip', data.tripId)
      return true
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError?.('Could not reach the server. Please check your connection and try again.')
      console.error(`[ERROR: TravelLog.js] Delete entry request failed: ${error.message}`)
      return false
    }
  },[editingEntry, setError, fetchEntries, fetchUserTrips])

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

      /* The entries filed against the trip went with it, so a form open on one
      of them is closed: the entry it was open on is no longer stored */
      if (editingEntry && String(editingEntry.tripId) === String(tripId)) {
        setShowEditEntry(false)
        setEditingEntry(null)
        setEditEntryData(EMPTY_ENTRY_EDIT)
        setEntryFieldErrors({})
        console.log('[INFO: TravelLog.js] Closed the edit entry form, trip', tripId, 'was deleted with its entries');
      }

      /* Both awaited so the caller's delete stays busy until the refreshed
      lists have arrived rather than only until the DELETE answered, and the
      rows are gone by the time the button reports itself done. The entries go
      with the trip, so that list is reloaded as well */
      await Promise.all([fetchUserTrips(), fetchEntries()])

      alert(data.message || 'Trip deleted successfully.')
      console.log('[SUCCESS: TravelLog.js] Trip deleted:', data.tripId || tripId, 'with', data.removedEntries ?? 0, 'entry(s) and', data.removedExpenses ?? 0, 'expense(s)')
      return true
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError?.('Could not reach the server. Please check your connection and try again.')
      console.error(`[ERROR: TravelLog.js] Delete trip request failed: ${error.message}`)
      return false
    }
  },[editingTripId, editingEntry, setError, fetchUserTrips, fetchEntries])


  //====================USE EFFECTS==========================
  /* Loads the trips and the entries once, when the page mounts. Neither fetch
  changes unless setError does, so this does not re-run as the lists are
  toggled, and both lists are filled before either is opened */
  useEffect(() => {
    fetchUserTrips()
    fetchEntries()
  },[fetchUserTrips, fetchEntries])
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
                  userEntries={userEntries}
                  loadingEntries={loadingEntries}
                  fetchEntries={fetchEntries}
                  toggleEditEntry={toggleEditEntry}
                  showEditEntry={showEditEntry}
                  deleteEntry={deleteEntry}
                  /* Marks the entry the edit form is open on, so the panel says
                  which entry the form below it belongs to */
                  editingEntryId={editingEntry?._id || null}
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
        <section className='travelLogSec2'>
        <div id='editEntryFormBlock'>
<Row id='editEntryRow'>
            <Col id='editEntryCol1'/>
              <Col xs={12} md={10} id='editEntryCol'>
              <div id='editEntryPanal'>
                <EditEntry
                  currentUser={currentUser}
                  /* The entry the form was opened on. Null until the entries
                  list hands one over, which the form reports rather than
                  offering fields with nothing to write them to */
                  entry={editingEntry}
                  editEntryData={editEntryData}
                  setEditEntryData={setEditEntryData}
                  editEntry={editEntry}
                  submitting={submittingEntry}
                  fieldErrors={entryFieldErrors}
                  emptyForm={EMPTY_ENTRY_EDIT}
                  /* Fills the trip select, so an entry can be moved to another
                  of the account's trips. Already loaded for the trips list */
                  trips={userTrips}
                  loadingTrips={loadingTrips}
                />
                </div>
              </Col>
              <Col id='editEntryCol2'/>
            </Row>
        </div>  
        </section>
      )}
      <Footer logout={logout}/>
    </div>
  )
}
