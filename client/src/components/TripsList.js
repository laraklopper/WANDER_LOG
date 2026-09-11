import React, { useCallback, useEffect, useMemo, useState } from 'react'
import '../css/componentCss/TripList.css'
import '../css/componentCss/DetailsPanal.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import ExportForm from '../components/ExportForm'
import { ArrowDownAZ } from 'lucide-react';
import {Link} from 'react-router-dom'
// IMPORT UTILITY FUNCTIONS
import { NOT_AVAILABLE, rowClass, toLongDate } from '../util/formatCalculations';
import FilterTrips from './FilterTrips';

export default function TripsList(
    {//PROPS PASSED FROM PARENT COMPONENT (TravelLog.js)
        currentUser,
        userTrips = [],
        loadingTrips = false,
        fetchUserTrips,
        toggleEditTrip,
        showEditTrip,
        /* Closes the edit form on the travel log page. The form is opened from
        this panel and names the trip it is editing from it, so it is closed
        whenever the panel is */
        closeEditTrip,
        deleteTrip

    }
) {
    // ========STATE VARIABLES============
    const [showFilter, setShowFilter] = useState(false)
    const [selectedId, setSelectedId] = useState(null)//State used to indicate which trip trip the details panel is showing
    const [exportList, setExportList] = useState(false)

    // Function to toggle the filter form
    const toggleFilter = useCallback(() => {
        setShowFilter(prev => !prev)
    },[])
    // Function to toggle Export Form
    const toggleExportForm = useCallback(() => {
        setExportList(prev => !prev)
    },[])
   
    const username = currentUser?.username || '';//Current loggedin user username

    /* Resolved out of the list on every render, so the panel follows the state
    TravelLog.js owns: when a refetch drops the selected trip the panel closes
    itself rather than displaying a stale copy */
    const selectedTrip = useMemo(
        () => userTrips.find((trip) => trip._id === selectedId) || null,
        [userTrips, selectedId]
    )

    /* The trip whose DELETE is in flight, held as an id rather than as a plain
    boolean so the button reports itself busy for the trip it is actually
    removing and not for whichever one the panel has since moved to */
    const [deletingId, setDeletingId] = useState(null)
    const isDeleting = Boolean(deletingId)

    //================EVENT LISTENERS========================
    // Opens the details panel on one trip
    const handleSelect = useCallback((tripId) => {
        setSelectedId(tripId)
    },[])

    /* Closes the details panel without touching the list itself, and closes the
    edit form with it: the form is opened from this panel and names the trip it
    is editing from it, so one left behind would be offering to change a trip
    that is no longer on screen */
    const handleClose = useCallback(() => {
        setSelectedId(null)
        closeEditTrip?.()
    },[closeEditTrip])

    /* The panel also closes on its own, when a refetch no longer holds the trip
    it was showing — one deleted from another session, for instance. The
    selected id is dropped and the form closed here too, so a panel that closed
    without CLOSE being pressed leaves no form open behind it */
    useEffect(() => {
        if (!selectedId || selectedTrip) return;

        console.log('[INFO: TripsList.js] Trip', selectedId, 'is no longer in the list, closed the panel');
        setSelectedId(null)
        closeEditTrip?.()
    },[selectedId, selectedTrip, closeEditTrip])

    //Function to delete a trip
    const handleDelete = useCallback(async () => {
        const tripId = selectedTrip?._id;

        if (!tripId) return;// Nothing on screen to delete
        if (deletingId) return;// A delete is already running

        const entryCount = Number.isFinite(selectedTrip.entryCount) ? selectedTrip.entryCount : 0;

        /* Listed for the confirmation, and each left out when the trip does not
        have any: a trip that was logged and never written about is confirmed as
        the trip on its own */
        const alsoRemoved = [
            entryCount ? `${entryCount} journal ${entryCount === 1 ? 'entry' : 'entries'}` : null,
            selectedTrip.hasBudget ? 'its budget and any expenses logged against it' : null,
        ].filter(Boolean);

        const confirmDelete = window.confirm(// Ask the user to confirm before the trip is removed
            `Delete ${selectedTrip.title || 'this trip'}?${
                alsoRemoved.length ? ` The ${alsoRemoved.join(' and ')} will be deleted with it.` : ''
            } This cannot be undone.`
        )

        // Conditional rendering to check the user confirmed the delete
        if (!confirmDelete) {
            console.log('[INFO: TripsList.js] Delete of trip', tripId, 'was cancelled');
            return;
        }

        setDeletingId(tripId)

        try {
            const removed = await deleteTrip?.(tripId)

            // Conditional rendering to check the trip was actually removed
            if (!removed) {
                console.warn('[WARN: TripsList.js] Trip', tripId, 'was not deleted, the panel was left open on it');
                return;
            }

            setSelectedId(null)
            console.log('[SUCCESS: TripsList.js] Deleted trip', tripId);
        } finally {
            setDeletingId(null)
        }
    },[selectedTrip, deletingId, deleteTrip])

    const tripLocation = (trip) => {
        const location = trip?.destination?.tripLocation;
        if (!location) return NOT_AVAILABLE;
        return [location, trip?.destination?.country].filter(Boolean).join(', ');
    }

    //===============JSX RENDERING==============
  return (
    <div id='tripListDisplay'>
        <div id='filterTripsDisplay'>
        <Stack direction="horizontal" gap={3}>
      <div className="p-2">
         {/* Button to reload the list from the API. */}
        <Button
        id='refreshTripsBtn'
        variant='light'
        type='button'
        onClick={fetchUserTrips}
        disabled={loadingTrips}
        // ARIA ATTRIBUTES:
        aria-label='Reload your trips'
        aria-disabled={loadingTrips}
        >
          {loadingTrips ? 'LOADING...' : 'REFRESH'}
        </Button>
      </div>
      <div className="p-2 ms-auto">
        <Button
        type='button'
        onClick={toggleExportForm}
        id='toggleExportBtn'
        variant='light'
        >
            {exportList ? 'Hide Form': 'Export Trips'}
        </Button>
       
      </div>
      <div className="p-2 ">
      {/* Button to toggle filter form */}
        <Button
        id='toggleFilterBtn'
        variant='light'
        onClick={toggleFilter}
        type='button'
        // ARIA ATTRIBUTES:
        aria-label={showFilter ? 'Hide the trip filter' : 'Filter your trips'}
        aria-controls='filter-trip-panal'
        aria-pressed={showFilter}
        aria-expanded={showFilter}
        >
        {showFilter ? (
            <>Hide Filter</>
        ):(
            <>
                Filter Trips<ArrowDownAZ fontWeight={700} aria-hidden='true' focusable='false'/>
            </>
        )}
         </Button>
      </div>
    </Stack>
    {/* TOGGLE FILTER TRIPS  FORM */}
    {showFilter && (
        <div id='filter-trip-panal'>
            <div id='trip-filter-block'>
                <FilterTrips/>
            </div>
        </div>
    )}
        </div>
        <div id='tripListBlock'>
        {/* TRIPS LIST TABLE: table displaying userTrips */}
            <table id='tripsListTable' aria-busy={loadingTrips}>
                <thead>
                    <tr>
                        <th colSpan={7} id='tripsListMainHead'>{username} : TRIPS</th>
                    </tr>
                    <tr id='tripsListHeadRow'>
                        <th scope='col'>TITLE</th>
                        <th scope='col'>PURPOSE</th>
                        <th scope='col'>TYPE:</th>{/*DESTINATION TYPE */}
                        <th scope='col'>LOCATION:</th>{/*DESTINATION LOCATION */}
                        <th scope='col'>STATUS</th>{/*Trip status */}
                        <th scope='col'>hasBudget</th>{/*YES/NO indicate whether a trip budget exists*/}
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {loadingTrips && userTrips.length === 0 ? (
                        <tr>
                            <td colSpan={7} className='trips-list-loading'>
                                LOADING YOUR TRIPS...
                            </td>
                        </tr>
                    ) : userTrips.length === 0 ? (
                        <tr>
                            <td colSpan={7} className='trips-list-empty'>
                                NO TRIPS LOGGED YET
                            </td>
                        </tr>
                    ) : (
                        userTrips.map((trip, index) => (
                            <tr
                                key={trip._id}
                                className={`${rowClass(index)}${
                                    trip._id === selectedId ? ' selectedRow' : ''
                                }`}
                            >
                                <td>{trip.title || NOT_AVAILABLE}</td>
                                <td>{trip.purpose || NOT_AVAILABLE}</td>
                                <td>{trip.destination?.destinationType || NOT_AVAILABLE}</td>
                                <td>{tripLocation(trip)}</td>{/* The country is appended to the location*/}
                                <td>{trip.status || NOT_AVAILABLE}</td>
                                <td>{trip.hasBudget ? 'YES' : 'NO'}</td>
                                <td>
                                    <div id='viewTrip-div'>
                                    <Button
                                        variant='light'
                                        id='viewTripBtn'
                                        type='button'
                                        onClick={() => handleSelect(trip._id)}
                                        // ARIA ATTRIBUTES:
                                        aria-label={`View the details of ${trip.title || 'this trip'}`}
                                        aria-pressed={trip._id === selectedId}
                                    >
                                        VIEW
                                    </Button>   
                                    </div>                      
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            {exportList && (
                <div id='exportTripsBlock'>
                    {/* The count is passed so the form can keep the button from
                    asking for an export of an account with no trips on it */}
                    <ExportForm resource='trips' count={userTrips.length}/>
                </div>
            )}
        </div>
        {/* DETAILS PANAL: panal to display the data for one trip.*/}
        {selectedTrip && (
        <div id='trip-details-panal' aria-live='polite'>
            <div id='tripDetailsHeading'>
                <Stack direction="horizontal" gap={3} id='detailsHeadStack'>
      <div className="p-2">
      <h3 id='trip-details-heading'>{selectedTrip.title || NOT_AVAILABLE}</h3>
      </div>
      <div className="p-2 ms-auto">
      {/* TOGGLE EDIT TRIP FORM */}
        <Button
        variant='warning'
        id='toggleEditTripBtn'
        onClick={() => toggleEditTrip?.(selectedTrip)}
        type='button'
        // ARIA ATTRIBUTES:
        aria-label={showEditTrip ? 'Hide Form' : 'Edit Trip'}
        aria-pressed={showEditTrip}
        aria-expanded={showEditTrip}
        >
        {showEditTrip ? 'Hide Form' : 'Edit Trip'}
        </Button>
      </div>
      <div className="vr" />
      <div className="p-2">
      <Button
      variant='warning'
      id='closeTripDetailsBtn'
      type='button'
      onClick={handleClose}
      // ARIA ATTRIBUTES:
      aria-label='Close the trip details panel'
      >
        CLOSE
      </Button>
      </div>
    </Stack>
            </div>
            <div id='trip-details-body'>
            <Stack direction="horizontal" gap={3} id='trip-details-stack1'>
      <div className="p-2" id='tripDetailsBlock1'>
        {/* Title */}
        <div className='details-group'>
            <p className='details-label'>TITLE:</p>
            <p className='details-value'>{selectedTrip.title || NOT_AVAILABLE}</p>
        </div>
      </div>
      <div className="p-2" id='tripDetailsBlock2'>
        {/* DESTINATION */}
        <div className='details-group'>
        <span><p className='nested-details-label'>DESTINATION:</p></span>
        <div className='nested-details-group'>
            <span className='nested-details-span'>
                <p className='details-label'>TYPE:</p>
                <p className='details-value'>{selectedTrip.destination?.destinationType || NOT_AVAILABLE}</p>
            </span>
            <span className='nested-details-span'>
                <p className='details-label'>LOCATION:</p>
                <p className='details-value'>{selectedTrip.destination?.tripLocation || NOT_AVAILABLE}</p>
            </span>
            {/* DISPLAY ONLY IF TYPE IS INTERNATIONAL: the API drops the country
            from a domestic trip, so the row is left off rather than shown with
            nothing against it */}
            {selectedTrip.destination?.destinationType === 'International' && (
            <span className='nested-details-span'>
                <p className='details-label'>COUNTRY:</p>
                <p className='details-value'>{selectedTrip.destination?.country || NOT_AVAILABLE}</p>
            </span>
            )}
        </div>
        </div>
      </div>
      <div className="p-2" id='tripDetailsBlock3'>
        {/* STATUS */}
        <div className='details-group'>
            <p className='details-label'>STATUS:</p>
            <p className='details-value'>{selectedTrip.status || NOT_AVAILABLE}</p>
        </div>
      </div>
      <div className="p-2" id='tripDetailsBlock4'>
        {/* ENTRY COUNT: maintained by the hooks on entrySchema, so it counts
        the entries actually filed against this trip. Read as a number rather
        than through || , which would report a trip with none as NOT AVAILABLE */}
         <div className='details-group'>
            <p className='details-label'>ENTRY COUNT:</p>
            <p className='details-value'>
                {Number.isFinite(selectedTrip.entryCount) ? selectedTrip.entryCount : 0}
            </p>
        </div>
      </div>
    </Stack>
<Stack direction="horizontal" gap={3} id='trip-details-stack2'>
      <div className="p-2" id='tripDetailsBlock5'>
      {/* PURPOSE */}
        <div className='details-group'>
            <p className='details-label'>PURPOSE:</p>
            <p className='details-value'>{selectedTrip.purpose || NOT_AVAILABLE}</p>
        </div>
      </div>
      <div className="p-2" id='tripDetailsBlock6'>
      {/* DATE: both are stored as Dates and arrive as ISO strings, so they are
      read through toLongDate rather than printed raw */}
        <div className='details-group'>
        <span><p className='nested-details-label'>DATE:</p></span>
            <div className='nested-details-group'>
             <span className='nested-details-span'>
                <p className='details-label'>START DATE:</p>
                <p className='details-value'>{toLongDate(selectedTrip.date?.startDate)}</p>
            </span>
            <span className='nested-details-span'>
                <p className='details-label'>END DATE:</p>
                <p className='details-value'>{toLongDate(selectedTrip.date?.endDate)}</p>
            </span>

            </div>
        </div>
      </div>
      <div className="p-2" id='tripDetailsBlock7'>
        <div className='details-group'>
        <span className='nested-details-span'>
 <p className='details-label'>HAS BUDGET:</p>
            <p className='details-value'>{selectedTrip.hasBudget ? 'YES' : 'NO'}</p>
        </span>
           
            {/* ONLY DISPLAY LINK IF THERE IS NO TRIP BUDGET: a trip may only
            ever hold one, so the link is left off a trip that already has one
            rather than sent to a form the API would answer with a 409 */}
            {!selectedTrip.hasBudget && (
            <span>
                {/* The form that sets a budget lives on the expenses page, so
                this leaves the travel log for it. openBudgetForm is carried on
                the location rather than in the path, so the page is still
                reached at its own route and opens its budget panel on arrival -
                the same arrangement as the journal's ADD TRIP BUDGET link.
                tripId travels with it, for the form's trip select to open on
                the trip whose panel this link was pressed from */}
                <Link
                className='reflink'
                id='addBudgetLink'
                to='/exp'
                state={{ openBudgetForm: true, tripId: selectedTrip._id }}
                // ARIA ATTRIBUTES:
                aria-label={`Add a budget for ${selectedTrip.title || 'this trip'} on the expenses page`}
                >
                    ADD TRIP BUDGET
                </Link>
            </span>
            )}
        </div>
      </div>
    </Stack>
            </div>
            <div id='tripDetailsFooter'>
            <Stack direction="horizontal" gap={3} id='detailsFooterStack'>
      <div className="p-2"/>
      <div className="p-2 ms-auto"/>
      <div className="vr" />
      <div className="p-2">
        <Button
        variant='danger'
        id='deleteItemBtn'
        type='button'
        onClick={handleDelete}
        disabled={isDeleting}
        // ARIA ATTRIBUTES:
        aria-label={`Delete ${selectedTrip.title || 'this trip'}`}
        aria-disabled={isDeleting}
        >
        {isDeleting ? 'DELETING...' : 'DELETE'}
        </Button>
      </div>
    </Stack>
            </div>
        </div>
        )}
    </div>
  )
}
