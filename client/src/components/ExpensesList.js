// ExpensesList.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useEffect, useMemo, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/ExpensesList.css'
import '../css/componentCss/DetailsPanal.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import FilterExpenses from '../components/FilterExpenses'
import ExportForm from '../components/ExportForm'
import { ArrowDownAZ } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS AND SHARED DATA
import { NOT_AVAILABLE, rowClass, toLongDate, toMoney } from '../util/formatCalculations';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../data/financeData';

/* The two enums an expense is stored with, keyed by the value the schema keeps
so a row can be labelled the way the form offered it: 'credit_card' is stored,
'CREDIT CARD' is shown. Built once from the same lists the add and edit forms
build their selects from, rather than searched through for every row */
const CATEGORY_LABELS = EXPENSE_CATEGORIES.reduce((labels, { key, label }) => ({
  ...labels,
  [key]: label,
}), {});

const PAYMENT_METHOD_LABELS = PAYMENT_METHODS.reduce((labels, { key, label }) => ({
  ...labels,
  [key]: label,
}), {});

/* An enum value as the forms name it, falling back to the stored value for one
the lists do not cover, so a row shows what is stored rather than nothing */
const enumLabel = (labels, value) => {
  if (!value) return NOT_AVAILABLE;
  return labels[value] || String(value).replace(/_/g, ' ').toUpperCase();
}

// ExpensesList function component
export default function ExpensesList(
  {//PROPS PASSED FROM PARENT COMPONENT (Expenses.js)
    currentUser,
    /* Every expense on the account, loaded by the Expenses page from
    GET /expense/fetchExpenses and already sorted newest spend first. */
    expenses = [],
    loadingExpenses = false,
    fetchExpenses,
    startExpenseEdit,//Opens the edit form against the expense as it is currently stored
    closeEditExpense,//Closes the edit form on the Expenses page
    deleteExpense,//Removes one expense by its id and reports whether it actually went.
    showEditExp = false,
    /* The id of the expense the edit form is open on, so the panel says which
    expense the form further down the page belongs to */
    editingExpenseId = null
  }) {

  // ========STATE VARIABLES============
  const [selectedId, setSelectedId] = useState(null)//State used to indicate which expense the details panel is showing
  /* Blocks a second press of EDIT while the read that fills the form is still
  running, so two of them cannot answer out of order into the same form */
  const [openingEdit, setOpeningEdit] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [showExportForm, setShowExportForm] = useState(false)//State to toggle exportForm
  const [deletingId, setDeletingId] = useState(null)//The expense whose DELETE is in flight
  
  const isDeleting = Boolean(deletingId)

  const username = currentUser?.username || '';//Current loggedin user username

  const toggleFilter = useCallback(() => {
    setShowFilter(prev => !prev)
  },[])
  const toggleExportForm = useCallback(() => {
    setShowExportForm(prev => !prev)
  },[])

  const selectedExpense = useMemo(
    () => expenses.find((expense) => expense._id === selectedId) || null,
    [expenses, selectedId]
  )

  /* Whether the edit form is open on the expense the panel is showing, rather
  than merely open. The button belongs to the panel, so on an expense the form
  is not open on it offers to edit that expense instead of offering to hide a
  form that is reporting a different one */
  const formOpenOnExpense = Boolean(
    showEditExp
    && editingExpenseId
    && selectedExpense
    && String(editingExpenseId) === String(selectedExpense._id)
  )

  /* Whether the expense was converted into the currency its budget is totalled
  in. convertedAmount is stored as null in the two cases the schema documents —
  the expense was already in the base currency, or no rate could be read — so
  the panel says which of the two it is rather than reporting a figure it does
  not have */
  const isConverted = typeof selectedExpense?.convertedAmount === 'number';
  const sameCurrency = Boolean(
    selectedExpense?.baseCurrency
    && selectedExpense.currency === selectedExpense.baseCurrency
  );

  //================EVENT LISTENERS========================
  // Opens the details panel on one expense
  const handleSelect = useCallback((expenseId) => {
    setSelectedId(expenseId)
  },[])

  /* Closes the details panel without touching the list itself, and closes the
  edit form with it: the form is opened from this panel and reports the expense
  it is editing from it, so one left behind would be offering to change an
  expense that is no longer on screen */
  const handleClose = useCallback(() => {
    setSelectedId(null)
    closeEditExpense?.()
  },[closeEditExpense])

  /* Opens or hides the edit form for the expense the panel is showing. Opening
  reads the expense back by its id first, so the form is filled from what is
  currently stored rather than from this list's copy, which may have been
  changed since it was loaded */
  const handleEdit = useCallback(async () => {
    const expenseId = selectedExpense?._id;

    if (!expenseId) return;// Nothing on screen to edit
    if (openingEdit) return;// A read is already running

    // Already open on this expense, so the press closes it again
    if (formOpenOnExpense) {
      closeEditExpense?.()
      console.log('[INFO: ExpensesList.js] Closed the edit form on expense', expenseId);
      return;
    }

    setOpeningEdit(true)

    try {
      await startExpenseEdit?.(expenseId)
    } finally {
      setOpeningEdit(false)
    }
  },[selectedExpense, openingEdit, formOpenOnExpense, closeEditExpense, startExpenseEdit])

  /* Removes the expense the panel is showing.*/
  const handleDelete = useCallback(async () => {
    const expenseId = selectedExpense?._id;

    if (!expenseId) return;// Nothing on screen to delete
    if (deletingId) return;// A delete is already running

    const confirmDelete = window.confirm(// Ask the user to confirm before the expense is removed
      `Delete ${selectedExpense.title || 'this expense'}${
        selectedExpense.amount ? ` (${toMoney(selectedExpense.amount, selectedExpense.currency)})` : ''
      }${
        selectedExpense.tripTitle ? ` from ${selectedExpense.tripTitle}` : ''
      }? This cannot be undone.`
    )

    // Conditional rendering to check the user confirmed the delete
    if (!confirmDelete) {
      console.log('[INFO: ExpensesList.js] Delete of expense', expenseId, 'was cancelled');
      return;
    }

    setDeletingId(expenseId)

    try {
      const removed = await deleteExpense?.(expenseId)

      // Conditional rendering to check the expense was actually removed
      if (!removed) {
        console.warn('[WARN: ExpensesList.js] Expense', expenseId, 'was not deleted, the panel was left open on it');
        return;
      }

      setSelectedId(null)
      console.log('[SUCCESS: ExpensesList.js] Deleted expense', expenseId);
    } finally {
      setDeletingId(null)
    }
  },[selectedExpense, deletingId, deleteExpense])

  //================SIDE EFFECTS=======================
  useEffect(() => {
    if (!selectedId || loadingExpenses || selectedExpense) return;

    console.log('[INFO: ExpensesList.js] Expense', selectedId, 'is no longer in the list, closed the panel');
    setSelectedId(null)
    closeEditExpense?.()
  },[selectedId, selectedExpense, loadingExpenses, closeEditExpense])

  //============JSX RENDERING====================
  return (
    <div id='expensesList'>
      <div id='expenseFilterBlock'>
        <Stack direction="horizontal" gap={3}>
      <div className="p-2">
 {/* Reloads the list from the API. Ignored while a request is already
        running, so a second press cannot start a fetch that would race the
        first and answer out of order */}
        <Button
        variant='light'
        id='reloadBtn'
        type='button'
        onClick={fetchExpenses}
        disabled={loadingExpenses}
        // ARIA ATTRIBUTES:
        aria-label='Reload your expenses'
        aria-disabled={loadingExpenses}
        >
          {loadingExpenses ? 'LOADING...' : 'RELOAD'}
        </Button>
      </div>
      <div className="p-2 ms-auto">
        <Button 
        variant='light'
        id='toggleExportBtn'
        onClick={toggleExportForm}
        aria-expanded={showExportForm}
        >
          {showExportForm ? 'Hide Form' : 'Export Expenses'}
        </Button>
      </div>
      <div className="p-2">
        <Button
        onClick={toggleFilter}
        variant='light'
        type='button'
        id='toggleFilterBtn'
        // ARIA ATTRIBUTES:
        aria-label={showFilter ? 'Hide the expense filter' : 'Filter Expenses'}
        aria-pressed={showFilter}
        aria-expanded={showFilter}
        >
          {showFilter ? (
                      <>Hide Filter</>
                  ):(
                      <>
                          Filter Expenses<ArrowDownAZ fontWeight={700} aria-hidden='true' focusable='false'/>
                      </>
                  )}
        </Button>
      </div>
    </Stack>
    {/* TOGGLE EXPENSE FILTER*/}
    {showFilter && (
      <div id='filterExpensePanal'>
        <div id='filterBlock'>
          <FilterExpenses/>
      </div>
      </div>
    )}

      </div>
      <div id='expensesTableBlock'>
        <table id='expensesTable' aria-busy={loadingExpenses}>
          <thead>
            <tr>
              <th colSpan={7} id='expensesMainHead'>{username}: EXPENSES</th>
            </tr>
            <tr id='expensesHeadRow'>
              <th scope='col'>TITLE</th>
              <th scope='col'>AMOUNT</th>
              <th scope='col'>CURRENCY</th>
              <th scope='col'>CATEGORY</th>
              <th scope='col'>PAYMENT METHOD</th>
              <th scope='col'>IS PAID</th>
              <th></th>{/*VIEW EXPENSES BUTTON*/}
            </tr>
          </thead>
          <tbody>
            {/* The three states the list can be in: a request still running with
            nothing to show yet, an account that has not logged an expense, and
            the expenses themselves. The request in flight is reported first, so
            'NO EXPENSES LOGGED YET' is only ever shown once the answer is in */}
            {loadingExpenses && expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className='expenses-list-loading'>
                  LOADING YOUR EXPENSES...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className='expenses-list-empty'>
                  NO EXPENSES LOGGED YET
                </td>
              </tr>
            ) : (
              expenses.map((expense, index) => (
                <tr
                  key={expense._id}
                  className={`${rowClass(index)}${
                    expense._id === selectedId ? ' selectedRow' : ''
                  }`}
                >
                  <td>{expense.title || NOT_AVAILABLE}</td>
                  {/* Named by its code rather than shown with a symbol: an
                  expense is paid in the currency of the day, so two rows can be
                  in different ones */}
                  <td>{toMoney(expense.amount, expense.currency)}</td>
                  <td>{expense.currency || NOT_AVAILABLE}</td>
                  {/* Stored as the schema's own key, shown as the form named it */}
                  <td>{enumLabel(CATEGORY_LABELS, expense.category)}</td>
                  <td>{enumLabel(PAYMENT_METHOD_LABELS, expense.paymentMethod)}</td>
                  {/* Read as YES or NO rather than through || , which would
                  report an unsettled cost as NOT AVAILABLE */}
                  <td>{expense.isPaid ? 'YES' : 'NO'}</td>
                  <td>
                    <div className='viewExpense-div'>
                    {/* A button per row rather than a click handler on the row
                    itself, so the panel can be opened from the keyboard without
                    rebuilding what a button already does */}
                    <Button
                      variant='light'
                      className='viewExpenseBtn'
                      type='button'
                      onClick={() => handleSelect(expense._id)}
                      /* Blocked while a delete is in flight, so the panel is not
                      moved onto another expense only to be closed when that
                      delete answers */
                      disabled={isDeleting}
                      // ARIA ATTRIBUTES:
                      aria-label={`View the details of ${expense.title || 'this expense'}`}
                      aria-pressed={expense._id === selectedId}
                      aria-disabled={isDeleting}
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
        {/* EXPORT FORM*/}
        {showExportForm && (
          <div id='exportListBlock'>
          <ExportForm/>

        </div>
        ) }
        
      </div>
      {/* EXPENSE DETAILS PANAL: only on screen once a row's VIEW has been
      pressed, so it is bordered off from the table rather than reading as more
      of the list */}
      {selectedExpense && (
      <div id='expenseDetailsPanal' aria-live='polite'>
              <div id='expDetailHeader'>
               <Stack direction="horizontal" gap={3}>
      <div className="p-2"/>
      <div className="p-2 ms-auto"/>
      <div className="p-2">
        {/* Whose expense this is: read off the expense rather than the session,
        so the panel names the account it was logged by */}
        <p className='panalUsername'>@ {selectedExpense.username || username}</p>
      </div>
    </Stack>
                 <Stack direction="horizontal" gap={3}>
      <div className="p-2">
        {/* EXPENSE TITLE */}
        <h5 id='exp-details-heading'>{selectedExpense.title || NOT_AVAILABLE}</h5>
      </div>
      <div className="p-2 ms-auto">
        {/* TOGGLE EDIT EXPENSE FORM: the expense on screen is read back by its
        id with the press, so the form opens on the one the panel is showing
        rather than on nothing */}
        <Button variant='warning'
        id='toggleEditExpBtn'
        type='button'
        onClick={handleEdit}
        /* Blocked while the read that fills the form is running, and while this
        expense's delete is in flight, so an edit cannot be opened against an
        expense that is on its way out */
        disabled={openingEdit || isDeleting}
        // ARIA ATTRIBUTES:
        aria-label={formOpenOnExpense
          ? 'Hide Form'
          : `Edit ${selectedExpense.title || 'this expense'}`}
        aria-controls='editExpensePanal'
        aria-pressed={formOpenOnExpense}
        aria-expanded={formOpenOnExpense}
        aria-disabled={openingEdit || isDeleting}
        >{openingEdit ? 'OPENING...' : formOpenOnExpense ? 'HIDE FORM' : 'EDIT'}</Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button
        variant='warning'
        onClick={handleClose}
        id='closePanalBtn'
        type='button'
        // ARIA ATTRIBUTES:
        aria-label='Close the expense details panel'
        >CLOSE</Button>
      </div>
    </Stack>
              </div>
              <div id='expDetailsBody'>
                <Stack gap={3} id='expDetailsStack1'>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>TRIP</p>
          {/* The trip the expense was filed against, read off the budget it is
          embedded in. An expense whose trip has since been deleted is still
          listed, labelled by the API rather than dropped: it is a record of
          money already spent */}
          <p className='detail-value'>{selectedExpense.tripTitle || NOT_AVAILABLE}</p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>CURRENCY</p>
          <p className='detail-value'>{selectedExpense.currency || NOT_AVAILABLE}</p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>EXPENSE NOTES:</p>
          <p className='detail-value'>
            {/* Optional on both forms, and stored as an empty string when it is
            left blank, so a dash stands in for an expense with no notes */}
            {selectedExpense.notes || '—'}
          </p>
        </span>
      </div>
    </Stack>
    <Stack gap={3}>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>TITLE:</p>
          <p className='detail-value'>{selectedExpense.title || NOT_AVAILABLE}</p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>EXPENSE CATEGORY:</p>
          <p className='detail-value'>{enumLabel(CATEGORY_LABELS, selectedExpense.category)}</p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>PAID:</p>
          {/* false records a committed but unsettled cost, such as an unpaid
          deposit, which is still counted against the budget */}
          <p className='detail-value'>{selectedExpense.isPaid ? 'YES' : 'NO'}</p>
        </span>
      </div>
    </Stack>
    <Stack gap={3}>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>AMOUNT:</p>
          <p className='detail-value'>{toMoney(selectedExpense.amount, selectedExpense.currency)}</p>
        </span>
      </div>
      <div className="p-2">
        {/* CONVERTED AMOUNT: the figure the parent budget is totalled on, worked
        out by the API from the rate on the day the expense was added rather than
        typed into either form. Stored as null when there was nothing to convert
        or no rate could be read, so which of the two it is is said here instead
        of a figure the expense does not carry */}
        <span className='detail-span'>
          <p className='detail-label'>
            {selectedExpense.baseCurrency
              ? `IN ${selectedExpense.baseCurrency}:`
              : 'CONVERTED:'}
          </p>
          <p className='detail-value'>
            {isConverted
              ? toMoney(selectedExpense.convertedAmount, selectedExpense.baseCurrency)
              : sameCurrency
                ? toMoney(selectedExpense.amount, selectedExpense.currency)
                : 'NO RATE STORED'}
          </p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>PAYMENT METHOD:</p>
          <p className='detail-value'>{enumLabel(PAYMENT_METHOD_LABELS, selectedExpense.paymentMethod)}</p>
        </span>
      </div>
      <div className="p-2">
        <span className='detail-span'>
          <p className='detail-label'>DATE:</p>
          {/* Stored as a Date and arrives as an ISO string, so it is read
          through toLongDate rather than printed raw */}
          <p className='detail-value'>{toLongDate(selectedExpense.date)}</p>
        </span>
      </div>
    </Stack>
              </div>
              <div id='expDetailsFooter'>
                 <Stack direction="horizontal" gap={3}>
      <div className="p-2">
        {/* Says whether this is the expense the edit form is open on, so a form
        further down the page is not read as belonging to whichever expense the
        panel has since moved to */}
        {formOpenOnExpense && (
          <small className='expenseNote'>OPEN IN THE EDIT FORM BELOW</small>
        )}
      </div>
      <div className="p-2 ms-auto"/>
      <div className="vr" />
      <div className="p-2">
        {/* Sends the selected expense's id to DELETE /expense/delete/:id.
        Disabled while its own request is in flight, so the expense cannot be
        deleted twice and answer 404 for one that has already gone, and the panel
        is only closed once the API has answered that it went */}
        <Button
        variant='danger'
        id='deleteItemBtn'
        type='button'
        onClick={handleDelete}
        disabled={isDeleting}
        // ARIA ATTRIBUTES:
        aria-label={`Delete ${selectedExpense.title || 'this expense'}`}
        aria-disabled={isDeleting}
        >{isDeleting ? 'DELETING...' : 'DELETE'}</Button>
      </div>
    </Stack>
              </div>

      </div>
      )}
    </div>
  )
}
