import React from 'react'
import '../css/componentCss/FilterForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Ban, Search } from 'lucide-react';


// FilterEntries component
export default function FilterEntries() {
  return (
    <form id='filterForm' method='GET' aria-labelledby='formTitle'>
    <p className='visually-hidden' id='formTitle'>FILTER ENTRIES FORM</p>
    <div id='filter-form-input'>
      <Stack direction="horizontal" gap={3}>
      <div className="p-2">
        <div className='filter-input'>
          <label className='filterLabel'>
            FILTER BY TRIP: 
          </label>
          <select
          className='input'
          >
            <option>SELECT</option>
          </select>
        </div>
      </div>
      <div className="p-2 ms-auto">
        <Button
        variant='warning'
        id='applyFiltersBtn'      
        >
          APPLY<Search fontWeight={700} aria-hidden='true' focusable='false' />
        </Button>
      </div>
      <div className="p-2">
        <Button
         variant='danger'
         id='clearFiltersBtn'
         >
          CLEAR FILTERS<Ban fontWeight={700} aria-hidden='true' focusable='false'/>
        </Button>
      </div>
    </Stack>

    </div>

    </form>
  )
}
