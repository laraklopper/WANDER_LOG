import React from 'react'
import '../css/componentCss/FilterForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Ban, Search } from 'lucide-react';
export default function FilterTrips() {
  return (
    <form id='filterForm' method='GET'>
        <p className='visually-hidden'>FILTER TRIPS FORM</p>
        <div id='filter-form-input'>
            <Stack gap={3}>
                <div className="p-2">
                    <div className='filter-group'>
                        <div className='filter-input'>
<label className='filterLabel'>PURPOSE</label>
                        <select className='input'>
                            <option>SELECT</option>
                            <option>HOLIDAY</option>
                            <option>BUSINESS</option>
                        </select>
                        </div>
                        <div className='filter-input'>
                            <label className='filterLabel'>STATUS:</label>
                            <select
                            className='input'
                            id='filterTripStatus'
                            >
                                <option>SELECT</option>
                                <option>UPCOMING</option>
                                <option>ONGOING</option>
                                <option>COMPLETED</option>
                            </select>

                        </div>
                    </div>
                </div>
                <div className="p-2">
                    <div className='filter-group'>
                        <div className='filter-input'>
                            <label className='filterLabel'>DESTINATION TYPE:</label>
                            <select
                            className='input'
                            >
                            <option>SELECT</option>
                            <option>DOMESTIC</option>
                            <option>INTERNATIONAL</option>
                            </select>
                           
                        </div>
                        <div className='filter-input'>
                            <label className='filterLabel'>HAS BUDGET</label>
                           <select
                           className='input'
                           >
                            <option>SELECT</option>
                            <option>YES</option>
                            <option>NO</option>
                           </select>
                        </div>
                    </div>
                </div>
            </Stack>
            <Stack direction="horizontal" gap={3}>
                <div className="p-2"></div>
                <div className="p-2 ms-auto">
                    <Button id='applyFiltersBtn' type='submit' variant='light'>APPLY<Search aria-hidden='true' focusable='false' /></Button>
                </div>
                <div className="vr" />
                <div className="p-2">
                    <Button variant='danger' id='clearFiltersBtn'>CLEAR FILTERS<Ban fontWeight={700} aria-hidden='true' focusable='false'/></Button>
                </div>
    </Stack>

        </div>

    </form>
  )
}
