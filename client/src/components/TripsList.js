import React from 'react'
import '../css/componentCss/TripList.css'
import '../css/componentCss/DetailsPanal.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { ArrowDownAZ } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import { NOT_AVAILABLE, rowClass } from '../util/formatCalculations';
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
    const username = currentUser?.username || '';
  return (
    <div id='tripListDisplay'>
        <div id='filterForm'>
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
        <Button id='toggleFilterBtn' variant='light'>FILTER <ArrowDownAZ fontWeight={700} aria-hidden='true' focusable='false'/></Button>
      </div>
    </Stack>
    {/* TOGGLE FILTER TRIPS  FORM 
    <div></div>   */}
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
                            <tr key={trip._id} className={rowClass(index)}>
                                <td>{trip.title || NOT_AVAILABLE}</td>
                                <td>{trip.purpose || NOT_AVAILABLE}</td>
                                <td>{trip.destination?.destinationType || NOT_AVAILABLE}</td>
                                {/* The country is only stored on an international
                                trip, so it is appended to the location rather
                                than given a column that a domestic trip would
                                always leave empty */}
                                <td>
                                    {trip.destination?.tripLocation
                                        ? [trip.destination.tripLocation, trip.destination.country].filter(Boolean).join(', ')
                                        : NOT_AVAILABLE}
                                </td>
                                <td>{trip.status || NOT_AVAILABLE}</td>
                                {/* Answered by the API off the caller's budgets,
                                not by the flag stored on the trip, which no
                                route writes to */}
                                <td>{trip.hasBudget ? 'YES' : 'NO'}</td>
                                {/* Left empty for the VIEW button that opens the
                                details panel below, which is not wired up yet */}
                                <td></td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        <div id='trip-details-panal'>
            <div id='tripDetailsHeading'>
                <Stack direction="horizontal" gap={3} id='detailsHeadStack'>
      <div className="p-2">
        <h3 id='trip-details-heading'>
            {/* TRIP TITLE */}
        </h3>
      </div>
      <div className="p-2 ms-auto">
      {/* TOGGLE EDIT TRIP FORM */}
        <Button
        variant='warning'
        id='toggleEditTripBtn'
        >
            EDIT
        </Button>
      </div>
      <div className="vr" />
      <div className="p-2">
      <Button variant='warning'>
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
            <p className='details-value'></p>
        </div>
      </div>
      <div className="p-2" id='tripDetailsBlock2'>
        {/* DESTINATION */}
        <div className='details-group'>
        <span><p className='nested-details-label'>DESTINATION:</p></span>
        <div className='nested-details-group'>
            <span className='nested-details-span'>
                <p className='details-label'>TYPE:</p>
                <p className='details-value'></p>
            </span>
            <span className='nested-details-span'>
                <p className='details-label'>LOCATION:</p>
                <p className='details-value'></p>
            </span>
            {/* DISPLAY ONLY IF TYPE IS INTERNATIONAL */}
            <span className='nested-details-span'>
                <p className='details-label'>COUNTRY:</p>
                <p className='details-value'></p>
            </span>
        </div>
        </div>
      </div>
      <div className="p-2" id='tripDetailsBlock3'>
        {/* STATUS */}
        <div className='details-group'>
            <p className='details-label'>STATUS:</p>
            <p className='details-value'></p>
        </div>
      </div>
      <div className="p-2" id='tripDetailsBlock4'>
        {/* ENTRY COUNT */}
         <div className='details-group'>
            <p className='details-label'>ENTRY COUNT:</p>
            <p className='details-value'></p>
        </div>
      </div>
    </Stack>
<Stack direction="horizontal" gap={3} id='trip-details-stack2'>
      <div className="p-2" id='tripDetailsBlock5'>
      {/* PURPOSE */}
        <div className='details-group'>
            <p className='details-label'>PURPOSE:</p>
            <p className='details-value'></p>
        </div>
      </div>
      <div className="p-2" id='tripDetailsBlock6'>
      {/* DATE */}
        <div className='details-group'>
        <span><p className='nested-details-label'>DATE:</p></span>
            <div className='nested-details-group'>
             <span className='nested-details-span'>
                <p className='details-label'>START DATE:</p>
                <p className='details-value'></p>
            </span>
            <span className='nested-details-span'>
                <p className='details-label'>END DATE:</p>
                <p className='details-value'></p>
            </span>

            </div>
        </div>
      </div>
      <div className="p-2" id='tripDetailsBlock7'>
        <div className='details-group'>
            <p className='details-label'>HAS BUDGET:</p>
            <p className='details-value'>:</p>
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
        // onClick={}
        >DELETE:</Button>
      </div>
    </Stack>

            </div>
        </div>
    </div>
  )
}
