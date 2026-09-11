import React from 'react'
import '../css/componentCss/FilterForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';

export default function FilterExpenses() {
  return (
    <form id='filterForm'>
      <div id='filter-form-input'>
      {/*Filter expenes by currency, paymentMethod, category, is paid  */}
           <Stack gap={3}>
      <div className="p-2">
        <div className='input-div'>
          <label>CURRENCY:</label>
          <select>
            <option>SELECT</option>
          </select>

        </div>
      </div>
      <div className="p-2">Second item</div>
      <div className="p-2">Third item</div>
    </Stack>

    <Stack direction="horizontal" gap={3}>
      <div className="p-2">First item</div>
      <div className="p-2 ms-auto">Second item</div>
      <div className="p-2">Third item</div>
    </Stack>
      </div>

    </form>
  )
}
