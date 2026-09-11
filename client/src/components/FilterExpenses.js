import React from 'react'
import '../css/componentCss/FilterForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';

export default function FilterExpenses() {
  return (
    <form id='filterForm'>
    <div id='filter-form-input'>
 <Stack gap={3}>
      <div className="p-2">
        <div className='input-div'>
          <div className='filter-input'>
            <label className='filterLabel'>TRIP:</label>
            <select className='input'>
              <option>SELECT</option>
            </select>
          </div>
          <div className='input-div'>
          <label className='filterLabel'>CURRENCY CONVERTER:</label>
            <select
            className='input'
            // id=''
            // name=''
            // value={}
            >
            <option>SELECT</option>              
            </select>
          </div>
        </div>
      </div>
      <div className="p-2">
      <div className='filter-group'>
      {/* PAYMENT METHOD */}
      <div className='filter-input'>
          <label className='filterLabel'>PAYMENT METHOD:</label>
          <select
          className='input'
          // name=''
          // value={}
          // id=''
          // ARIA ATTRIBUTES:
          aria-required='false'
          >
            <option>SELECT</option>
          </select>
        </div>
        {/* Filter By Category */}
        <div className='filter-input'>
          <label className='filterLabel'>CATEGORY:</label>
          <select 
          // id=''
          // name=''
          // value={}
          // onChange={}
          className='input'>
            <option>SELECT</option>
          </select>
        </div>
      </div>
        
      </div>
      <div className="p-2">
        <div className='filter-input'>
          <label className='filterLabel' htmlFor=''>PAID:</label>
          <select
          className='input'
          >
            <option>SELECT</option>
            <option>YES</option>
            <option>NO</option>
          </select>
        </div>
      </div>
    </Stack>
    <Stack direction="horizontal" gap={3}>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        <Button
        variant='warning'
        id='applyFiltersBtn'      
        >
          APPLY
        </Button>
      </div>
      <div className="p-2">
         <Button
         variant='danger'
         id='clearFiltersBtn'
         >
          CLEAR FILTERS
        </Button>
      </div>
    </Stack>
    </div>
     
    </form>
  )
}
