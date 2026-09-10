import React, { useCallback, useState } from 'react'
import '../css/componentCss/ExpensesList.css'
import '../css/componentCss/DetailsPanal.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { ArrowDownAZ } from 'lucide-react';
export default function ExpensesList({
  currentUser,
  expenses, 
  loadingExpenses, 
  fetchExpense, 
  fetchExpenses, 
  toggleEditExpenseForm,
  showEditExp,
  setError

}) {
  const [showFilter, setShowFilter] = useState(false)
  const [selectedId, setSelectedId] = useState(null)//State used to indicate which expense the details panel is showing


  const username = currentUser?.username || '';//Current loggedin user username

  const toggleExpenseFilter = useCallback(() => {
    setShowFilter(prev => !prev)
  },[])


  //================EVENT LISTENERS========================
  // Opens the details panel on one expense
  const handleSelect = useCallback((expenseId) => {
    setSelectedId(expenseId)
  },[])
  //Function to close the expense details panal
  const handleClose = useCallback(() =>{
    setSelectedId(null)
    /* close the editExpenseForm if the panal is closed*/
  },[])

  //============JSX RENDERING====================
  return (
    <div id='expensesList'>
      <div id='expenseFilterBlock'>
        <Stack direction="horizontal" gap={3}>
      <div className="p-2"/>
      <div className="p-2 ms-auto">
        <Button
        variant='light'
        id='reloadBtn'
        type='btn'
        >
          RELOAD
        </Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button
          id='toggleFilterBtn'
          variant='light'
          onClick={toggleExpenseFilter}
          type='button'
          // ARIA ATTRIBUTES:
          aria-label={showFilter ? 'Hide the trip filter' : 'Filter your trips'}
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
      </div>
      <div id='expensesTableBlock'>
        <table id='expensesTable'>
          <thead>
            <tr>
              <th colSpan={8}>{username}: EXPENSES</th>
            </tr>
            <tr>
              <th>TITLE</th>
              <th>AMOUNT</th>
              <th>CURRENCY</th>
              <th>CATEGORY</th>
              <th>PAYMENT METHOD</th>
              <th>IS PAID</th>
              <th></th>{/*VIEW EXPENSES BUTTON*/}
            </tr>
          </thead>
        </table>
      </div>
      <div id='expenseDetailsPanal'>
              <div id='expDetailHeader'>
               <Stack direction="horizontal" gap={3}>
      <div className="p-2"/>
      <div className="p-2 ms-auto"/>
      <div className="p-2">
        <p className='panalUsername'>@ {username}</p>
      </div>
    </Stack>
                 <Stack direction="horizontal" gap={3}>
      <div className="p-2">
        {/* EXPENSE TITLE */}
      </div>
      <div className="p-2 ms-auto">
        <Button variant='warning'
        // onClick={}
        >EDIT</Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button variant='warning' onClick={handleClose} id='closePanalBtn'>CLOSE</Button>
      </div>
    </Stack>
              </div>
              <div id='expDetailsBody'>
                <Stack gap={3} id='expDetailsStack1'>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>TRIP</p>
          <p className='detail-value'></p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>CURRENCY</p>
          <p className='detail-value'></p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>EXPENSE NOTES:</p>
          <p className='detail-value'>
            {/* if applicable: leave a hyphen(-) if no notes exist */}
          </p>
        </span>
      </div>
    </Stack>
    <Stack gap={3}>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>TITLE:</p>
          <p className='detail-value'></p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>EXPENSE CATEGORY:</p>
          <p className='detail-value'></p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>PAID:</p>
          <p className='detail-value'>{/*isPaid : YES/NO */}</p>
        </span>
      </div>
    </Stack>
    <Stack gap={3}>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>AMOUNT:</p>
          <p className='detail-value'></p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>PAYMENT METHOD:</p>
          <p className='detail-value'></p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>DATE:</p>
          <p className='detail-value'></p>
        </span>
      </div>
    </Stack>
              </div>
              <div id='expDetailsFooter'>
                 <Stack direction="horizontal" gap={3}>
      <div className="p-2"/>
      <div className="p-2 ms-auto"/>
      <div className="vr" />
      <div className="p-2">
        <Button variant='danger' id='deleteItemBtn'>DELETE</Button>
      </div>
    </Stack>
              </div>

      </div>
    </div>
  )
}
