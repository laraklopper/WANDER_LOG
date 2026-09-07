import React, { useCallback, useMemo, useState } from 'react'
import '../css/componentCss/TripList.css'
import '../css/componentCss/DetailsPanal.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { ArrowDownAZ } from 'lucide-react';
import {Link} from 'react-router-dom'
// IMPORT UTILITY FUNCTIONS
import { NOT_AVAILABLE, rowClass, toLongDate } from '../util/formatCalculations';
import FilterTrips from './FilterTrips';
/* The travel log's trip list. The request itself lives on TravelLog.js, which
owns the list state, and arrives here as `userTrips` with `fetchUserTrips` to
reload it - the same arrangement as VatCalculationsList.js */
export default function TripsList(
    {//PROPS PASSED FROM PARENT COMPONENT (TravelLog.js)
        currentUser,
        userTrips = [],
        loadingTrips = false,
        fetchUserTrips

    }
) {
    const [showFilter, setShowFilter] = useState(false)

    const toggleFilter = useCallback(() => {
        setShowFilter(prev => !prev)
    },[])
    const username = currentUser?.username || '';

    /* Which trip the details panel is showing, held as an id rather than as the
    trip itself. The list is refetched by the REFRESH button, so a stored object
    could outlive the record it was copied from and leave the panel showing a
    trip the database no longer holds */
    const [selectedId, setSelectedId] = useState(null)

    /* Resolved out of the list on every render, so the panel follows the state
    TravelLog.js owns: when a refetch drops the selected trip the panel closes
    itself rather than displaying a stale copy */
    const selectedTrip = useMemo(
        () => userTrips.find((trip) => trip._id === selectedId) || null,
        [userTrips, selectedId]
    )

    //================EVENT LISTENERS========================
    // Opens the details panel on one trip
    const handleSelect = useCallback((tripId) => {
        setSelectedId(tripId)
    },[])

    // Closes the details panel without touching the list itself
    const handleClose = useCallback(() => {
        setSelectedId(null)
    },[])

    /* The country is only stored on an international trip, so it is read
    through here: the panel's COUNTRY row is left off a domestic trip rather
    than shown empty, and the list's LOCATION column appends it when it is
    there. Written once so the two cannot start disagreeing */
    const tripLocation = (trip) => {
        const location = trip?.destination?.tripLocation;
        if (!location) return NOT_AVAILABLE;
        return [location, trip?.destination?.country].filter(Boolean).join(', ');
    }

  return (
    <div id='tripListDisplay'>
        <div id='filterTripsDisplay'>
        <Stack direction="horizontal" gap={3}>
      <div className="p-2"/>
      <div className="p-2 ms-auto">
        {/* Reloads the list from the API. Ignored while a request is already
        running, so a second press cannot start a fetch that would race the
        first and answer out of order */}
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
      <div className="p-2 ">
        <Button id='toggleFilterBtn' variant='light' onClick={toggleFilter}>
        {showFilter ? (
            <>
                Hide Filter
            </>
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
            {/* aria-busy reports a refresh of a list that already has rows:
            those rows are deliberately left on screen rather than replaced by
            the loading row, so nothing else on the table says a request is
            running */}
            <table id='tripsListTable' aria-busy={loadingTrips}>
                <thead>
                    <tr>
                        <th colSpan={7} id='tripsListMainHead'>
                            {username} : TRIPS
                        </th>
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
                    {/* Conditional rendering to tell a user with no trips apart
                    from a list that has not loaded: both are an empty array,
                    and an empty table with no message reads as a failure rather
                    than as an account that has logged nothing yet. The request
                    in flight is reported first, so 'NO TRIPS LOGGED YET' is
                    only ever shown once the answer is actually in */}
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
                                {/* The country is appended to the location
                                rather than given a column of its own, which a
                                domestic trip would always leave empty */}
                                <td>{tripLocation(trip)}</td>
                                <td>{trip.status || NOT_AVAILABLE}</td>
                                {/* Answered by the API off the caller's budgets,
                                not by the flag stored on the trip, which no
                                route writes to */}
                                <td>{trip.hasBudget ? 'YES' : 'NO'}</td>
                                <td>
                                    {/* A button per row rather than a click
                                    handler on the row itself, so the panel can
                                    be opened from the keyboard without
                                    rebuilding what a button already does */}
                                    <Button
                                        variant='light'
                                        className='viewTripBtn'
                                        type='button'
                                        onClick={() => handleSelect(trip._id)}
                                        // ARIA ATTRIBUTES:
                                        aria-label={`View the details of ${trip.title || 'this trip'}`}
                                        aria-pressed={trip._id === selectedId}
                                    >
                                        VIEW
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        {/* DETAILS PANAL: panal to display the data for one trip.
        Only rendered once a row's VIEW has been pressed, so the panel is never
        on screen with a set of empty labels in it */}
        {selectedTrip && (
        <div id='trip-details-panal' aria-live='polite'>
            <div id='tripDetailsHeading'>
                <Stack direction="horizontal" gap={3} id='detailsHeadStack'>
      <div className="p-2">
        <h3 id='trip-details-heading'>
            {/* TRIP TITLE */}
            {selectedTrip.title || NOT_AVAILABLE}
        </h3>
      </div>
      <div className="p-2 ms-auto">
      {/* TOGGLE EDIT TRIP FORM: left unwired, PATCH /trip/editTrip/:id is not
      written yet, so there is nothing for EditTripForm.js to submit to */}
        <Button
        variant='warning'
        id='toggleEditTripBtn'
        >
            EDIT
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
            <p className='details-label'>HAS BUDGET:</p>
            <p className='details-value'>{selectedTrip.hasBudget ? 'YES' : 'NO'}</p>
            {/* ONLY DISPLAY LINK IF THERE IS NO TRIP BUDGET */}
            <span>
                <Link>ADD BUDGET</Link>
            </span>
                
           
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
        {/* Left unwired for the same reason as EDIT above: DELETE
        /trip/deleteTrip/:id is not written yet, so there is nothing to send the
        selected trip's id to */}
        <Button
        variant='danger'
        id='deleteItemBtn'
        type='button'
        // onClick={}
        >DELETE:</Button>
      </div>
    </Stack>

            </div>
        </div>
        )}
    </div>
  )
}
