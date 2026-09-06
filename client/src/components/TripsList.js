import React from 'react'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { ArrowDownAZ } from 'lucide-react';
export default function TripsList(
    {//PROPS PASSED FROM PARENT COMPONENT (TravelLog.js)
        currentUser

    }
) {
    const username = currentUser?.username || '';
  return (
    <div id='tripListDisplay'>
        <div id='filterForm'>
        <Stack direction="horizontal" gap={3}>
      <div className="p-2"/>
      <div className="p-2 ms-auto"/>
      <div className="p-2 ">
        <Button id='toggleFilterBtn' variant='light'>FILTER <ArrowDownAZ fontWeight={700} aria-hidden='true' focusable='false'/></Button>
      </div>
    </Stack>  
    {/* TOGGLE FILTER TRIPS  FORM 
    <div></div>   */}
        </div>
        
        <div id='tripListBlock'>
            <table id='tripsListTable'>
                <thead>
                    <tr>
                        <th colSpan={7} id='tripsListMainHead'>
                            {username} : TRIPS
                        </th>
                    </tr>
                    <tr id='tripsListHeadRow'>
                        <th>TITLE</th>
                        <th>PURPOSE</th>
                        <th>TYPE:</th>{/*DESTINATION TYPE */}
                        <th>LOCATION:</th>{/*DESTINATION LOCATION */}
                        <th>STATUS</th>{/*Trip status */}
                        <th>hasBudget</th>{/*YES/NO indicate whether a trip budget exists*/}
                        <th></th>
                    </tr>
                </thead>
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
        <Button>
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
            <Stack direction="horizontal" gap={3}>
      <div className="p-2">
        {/* Title */}
        <div className='details-group'>
            <p className='details-label'>TITLE:</p>
            <p className='details-value'></p>
        </div>
      </div>
      <div className="p-2">
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
      <div className="p-2">
        {/* STATUS */}
        <div className='details-group'>
            <p className='details-label'>STATUS:</p>
            <p className='details-value'></p>
        </div>
      </div>
      <div className="p-2">
        {/* ENTRY COUNT */}
         <div className='details-group'>
            <p className='details-label'>ENTRY COUNT:</p>
            <p className='details-value'></p>
        </div>
      </div>
    </Stack>
<Stack direction="horizontal" gap={3}>
      <div className="p-2">
      {/* PURPOSE */}
        <div className='details-group'>
            <p className='details-label'>ENTRY COUNT:</p>
            <p className='details-value'></p>
        </div>
      </div>
      <div className="p-2">
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
      <div className="p-2">
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
