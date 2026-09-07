import React from 'react'
import '../css/componentCss/BudgetList.css'
import '../css/componentCss/DetailsPanal.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
/*
TABLE DISPLAY
- trip
- base currency
- total budget 
- expenses

*/

export default function BudgetList({currentUser}) {

    const username = currentUser?.username || '';
  return (
    <div id='budgetListDiv'>
        <div id='budgetTableblock'>
            <table id='budgetListTable'>
                <thead>
                    <tr>
                        <th colSpan={6}>
                            {username} : TRIP BUDGETS
                        </th>
                    </tr>
                    <tr>
                        <th>TRIP</th>
                        <th>TRIP STATUS</th>
                        <th>BASE CURRENCY</th>
                        <th>TOTAL BUDGET</th>
                        {/* NUMBER OF TRIP EXPENSES */}
                        <th>EXPENSES:</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>

                </tbody>
            </table>
        </div>
        <div id='budget-details-panal'>
            <div id='budgetPanalHeader'>
 <Stack direction="horizontal" gap={3} id='budgetHeaderStack'>
      <div className="p-2">
      <span>
{/* <h6>Trip Name:</h6> */}<h6>BUDGET</h6>
      </span>
        
      </div>
      <div className="p-2 ms-auto">
      {/* TOGGLE EDIT BUDGET FORM BUTTON */}
        <Button>EDIT</Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button 
            variant='warning' 
            id='closePanalBtn'
            type='button'
            // onClick={}
            // ARIA ATTRIBUTES:
            >
            CLOSE
            </Button>
      </div>
    </Stack>
            </div>
            <div id='budget-panal-body'>
                <Stack gap={3} id='budgetDetailsStack1'>
      <div className="p-2">
        {/* TRIP */}
      </div>
      <div className="p-2">
        {/* TOTAL BUDGET */}
      </div>
      <div className="p-2">
        {/* category limits */}
      </div>
        <div className="p-2">
        {/* TOTAL number of EXPENSES */}
      </div>
    </Stack>
    <Stack gap={3} id='budgetDetailsStack2'>
      <div className="p-2">
        {/* Base currency */}
      </div>
      <div className="p-2">
        {/* daily budget */}
      </div>
      <div className="p-2">
        {/* Alerts */}
      </div>
    </Stack>
            </div>
            <div id='budgetPanalFooter'>
                 <Stack direction="horizontal" gap={3} id='budgetFooterStack'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto"></div>
      <div className="vr" />
      <div className="p-2">
        <Button variant='danger' id='removeItemBtn'>DELETE</Button>
      </div>
    </Stack>

            </div>
        </div>
    </div>
  )
}
