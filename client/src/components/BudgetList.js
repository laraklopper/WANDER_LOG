import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../css/componentCss/BudgetList.css'
import '../css/componentCss/DetailsPanal.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT UTILITY FUNCTIONS AND SHARED DATA
import { NOT_AVAILABLE, rowClass, toMoney, toPercent } from '../util/formatCalculations';
import { EXPENSE_CATEGORIES } from '../data/financeData';
/*
TABLE DISPLAY
- trip
- base currency
- total budget
- expenses

The trip budget list. The requests themselves live on Expenses.js, which owns the
list state, and arrive here as `budgets` with `fetchBudgets` to reload it - the
same arrangement as TripsList.js.

One difference from that list: a row of GET /expense/fetchBudgets carries only the
four fields the add expense form's trip select reads, so the details panel cannot
be filled from the row the way a trip's panel is. VIEW reads the whole budget back
by its id through `fetchBudget`, which is the same call the edit form is opened
with - it is the only response that carries the category limits, the alerts and
the totals worked out from the expenses.
*/

export default function BudgetList(
    {//PROPS PASSED FROM PARENT COMPONENT (Expenses.js)
        currentUser,
        budgets = [],
        loadingBudgets = false,
        fetchBudgets,
        /* Reads one budget back from the API by its id, whole and with its
        virtuals, for the details panel to be filled from */
        fetchBudget,
        // Opens the budget form as an edit against the budget as it is stored
        startBudgetEdit,
        /* The trips, for the TRIP STATUS column: a budget row does not carry the
        status of the trip it was set for, that is stored on the trip itself */
        trips = [],
        /* Every expense on the account, for the EXPENSES column. An expense is
        embedded in the budget of its trip and carries the budgetId it came out
        of, so the count per budget is read from this list rather than from the
        rows, which leave the expenses out on purpose */
        expenses = []
    }
) {
    const username = currentUser?.username || '';

    /* Which budget the details panel is showing, held as an id rather than as
    the budget itself. The list is refetched by the REFRESH button, so the id is
    what the panel is checked against below: a budget that is no longer on the
    account closes the panel rather than leaving a stale copy of it open */
    const [selectedId, setSelectedId] = useState(null)
    /* The budget the panel is built from, read back whole by its id. Unlike
    TripsList.js this cannot be resolved out of the list on every render: the
    list holds four fields and the panel reports on all of them */
    const [selectedBudget, setSelectedBudget] = useState(null)
    const [loadingDetails, setLoadingDetails] = useState(false)

    /* The id of the read the panel is currently waiting on. Two VIEWs pressed in
    quick succession start two requests that can answer out of order, so a reply
    is only shown while it is still the one that was asked for last */
    const requestedIdRef = useRef(null)

    //================EVENT LISTENERS========================
    /* Opens the details panel on one budget, reading it back by its id first.
    Nothing is shown until it arrives, so a read that failed leaves the panel
    closed rather than opening it on a set of empty labels */
    const handleSelect = useCallback(async (budgetId) => {
        if (!budgetId) return;

        setSelectedId(budgetId)
        setSelectedBudget(null)
        setLoadingDetails(true)
        requestedIdRef.current = budgetId

        const budget = await fetchBudget?.(budgetId);

        /* Conditional rendering to check this is still the budget being asked
        for: a later VIEW, or a CLOSE, has moved on from this request and its
        answer is no longer what the panel is showing */
        if (requestedIdRef.current !== budgetId) {
            console.warn('[WARN: BudgetList.js] Ignored a late reply for budget', budgetId);
            return;
        }

        setLoadingDetails(false)

        // Conditional rendering to check the budget was read back
        if (!budget) {
            setSelectedId(null)
            console.warn('[WARN: BudgetList.js] Could not load budget', budgetId, 'so the details panel was not opened');
            return;
        }

        setSelectedBudget(budget)
    },[fetchBudget])

    // Closes the details panel without touching the list itself
    const handleClose = useCallback(() => {
        // Cleared so a read still in flight for this budget is not shown on arrival
        requestedIdRef.current = null
        setSelectedId(null)
        setSelectedBudget(null)
        setLoadingDetails(false)
    },[])

    /* Opens the budget form as an edit of the budget the panel is showing. The
    form is on the same page and reads the budget back by its id itself, so only
    the id is handed over. A budget cannot be created twice - one per trip, and
    the POST answers 409 for a trip that has one - so this is the only way to
    change one */
    const handleEdit = useCallback(() => {
        if (!selectedBudget?._id) return;
        startBudgetEdit?.(selectedBudget._id)
    },[selectedBudget, startBudgetEdit])

    //================DERIVED VALUES========================
    /* The number of expenses filed against each budget, keyed by budgetId. Built
    once per change rather than filtered inside the map, which would walk the
    whole expense list again for every row */
    const expenseCounts = useMemo(() => expenses.reduce((counts, expense) => {
        const budgetId = String(expense?.budgetId ?? '');
        if (!budgetId) return counts;
        counts[budgetId] = (counts[budgetId] || 0) + 1;
        return counts;
    },{}),[expenses])

    // The status of each trip, keyed by trip id, for the list's TRIP STATUS column
    const tripStatuses = useMemo(() => trips.reduce((statuses, trip) => {
        statuses[String(trip?._id ?? '')] = trip?.status;
        return statuses;
    },{}),[trips])

    /* The categories this budget actually caps. A limit is stored as null when
    the category has no cap of its own, which is what a blank input on the form
    means, so those are left out rather than listed against nothing */
    const cappedCategories = useMemo(() => EXPENSE_CATEGORIES.filter(
        ({ key }) => typeof selectedBudget?.categoryLimits?.[key] === 'number'
    ),[selectedBudget])

    //================SIDE EFFECTS========================
    /* Closes the panel when the budget it is showing is no longer in the list,
    which is what a REFRESH after a delete leaves behind. Skipped while a request
    is running, so a list that is mid-reload does not close a panel the user is
    reading, and while a read of the panel's own budget is still in flight */
    useEffect(() => {
        if (!selectedId || loadingBudgets || loadingDetails) return;
        if (budgets.some((budget) => String(budget.budgetId) === String(selectedId))) return;

        console.log('[INFO: BudgetList.js] Budget', selectedId, 'is no longer listed, closing the details panel');
        setSelectedId(null)
        setSelectedBudget(null)
    },[budgets, selectedId, loadingBudgets, loadingDetails])

    //===============JSX RENDERING==============
  return (
    <div id='budgetListDiv'>
       
        <div id='budgetTableblock'>
            {/* aria-busy reports a refresh of a list that already has rows:
            those rows are deliberately left on screen rather than replaced by
            the loading row, so nothing else on the table says a request is
            running */}
            <table id='budgetListTable' style={{width: ''}} aria-busy={loadingBudgets}>
                <thead>
                    <tr>
                        <th colSpan={6} id='budgetTableHeadRow'>
                            {username} : TRIP BUDGETS
                        </th>
                    </tr>
                    <tr id='budgetListHeadRow'>
                        <th scope='col'>TRIP</th>
                        <th scope='col'>TRIP STATUS</th>
                        <th scope='col'>BASE CURRENCY</th>
                        <th scope='col'>TOTAL BUDGET</th>
                        {/* NUMBER OF TRIP EXPENSES */}
                        <th scope='col'>EXPENSES:</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {/* Conditional rendering to tell a user with no budgets apart
                    from a list that has not loaded: both are an empty array, and
                    an empty table with no message reads as a failure rather than
                    as an account that has set nothing yet. The request in flight
                    is reported first, so 'NO TRIP BUDGETS SET YET' is only ever
                    shown once the answer is actually in */}
                    {loadingBudgets && budgets.length === 0 ? (
                        <tr>
                            <td colSpan={6} className='budget-list-loading'>
                                LOADING YOUR TRIP BUDGETS...
                            </td>
                        </tr>
                    ) : budgets.length === 0 ? (
                        <tr>
                            <td colSpan={6} className='budget-list-empty'>
                                NO TRIP BUDGETS SET YET
                            </td>
                        </tr>
                    ) : (
                        budgets.map(({ budgetId, tripId, tripTitle, baseCurrency, totalBudget }, index) => (
                            <tr
                                key={budgetId}
                                className={`${rowClass(index)}${
                                    String(budgetId) === String(selectedId) ? ' selectedRow' : ''
                                }`}
                            >
                                <td>{tripTitle || NOT_AVAILABLE}</td>
                                {/* Read off the trip rather than the budget: a
                                budget row does not carry it, and a trip that has
                                since been deleted has no status to report */}
                                <td>{tripStatuses[String(tripId)] || NOT_AVAILABLE}</td>
                                <td>{baseCurrency || NOT_AVAILABLE}</td>
                                {/* Named by its code rather than shown with a
                                symbol: a budget is set in the currency of its
                                own trip, so two rows can be in different ones */}
                                <td>{toMoney(totalBudget, baseCurrency)}</td>
                                {/* Counted rather than read through || , which
                                would report a budget with nothing spent against
                                it yet as NOT AVAILABLE */}
                                <td>{expenseCounts[String(budgetId)] || 0}</td>
                                <td>
                                    {/* A button per row rather than a click
                                    handler on the row itself, so the panel can
                                    be opened from the keyboard without
                                    rebuilding what a button already does */}
                                    <Button
                                        variant='light'
                                        className='viewBudgetBtn'
                                        type='button'
                                        onClick={() => handleSelect(budgetId)}
                                        /* Blocked while the panel's own read is
                                        running, so a second press cannot start a
                                        request that races the first */
                                        disabled={loadingDetails}
                                        // ARIA ATTRIBUTES:
                                        aria-label={`View the budget for ${tripTitle || 'this trip'}`}
                                        aria-pressed={String(budgetId) === String(selectedId)}
                                        aria-disabled={loadingDetails}
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
         <div id='refreshBudgetsDisplay'>
       
        {/* Reloads the list from the API. Ignored while a request is already
        running, so a second press cannot start a fetch that would race the
        first and answer out of order */}
        <Button
        id='refreshBudgetsBtn'
        variant='light'
        type='button'
        onClick={fetchBudgets}
        disabled={loadingBudgets}
        // ARIA ATTRIBUTES:
        aria-label='Reload your trip budgets'
        aria-disabled={loadingBudgets}
        >
          {loadingBudgets ? 'LOADING...' : 'REFRESH'}
        </Button>
      
        </div>
        {/* DETAILS PANAL: panal to display the data for one trip budget.
        Only rendered once a row's VIEW has been pressed and the budget behind it
        has been read back, so the panel is never on screen with a set of empty
        labels in it */}
        {loadingDetails && (
            <p className='infoText' id='budgetDetailsLoading' aria-live='polite'>
                LOADING THE BUDGET...
            </p>
        )}
        {selectedBudget && (
        <div id='budget-details-panal' aria-live='polite'>
            <div id='budgetPanalHeader'>
 <Stack direction="horizontal" gap={3} id='detailsHeadStack'>
      <div className="p-2">
      <span>
<h6 style={{textTransform: 'uppercase'}}>{`BUDGET: ${selectedBudget.tripTitle || NOT_AVAILABLE}`}</h6>
      </span>

      </div>
      <div className="p-2 ms-auto">
      {/* TOGGLE EDIT BUDGET FORM BUTTON */}
        <Button
            id='editBudgetBtn'
            type='button'
            onClick={handleEdit}
            variant='warning'

            // ARIA ATTRIBUTES:
            aria-label={`Edit the budget for ${selectedBudget.tripTitle || 'this trip'}`}
            aria-controls='add-budget-panal'
            >
            EDIT
            </Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button
            variant='warning'
            id='closePanalBtn'
            type='button'
            onClick={handleClose}
            // ARIA ATTRIBUTES:
            aria-label='Close the budget details panel'
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
        <div className='details-group'>
            <p className='details-label'>TRIP:</p>
            <p className='details-value'>{selectedBudget.tripTitle || NOT_AVAILABLE}</p>
        </div>
      </div>
      <div className="p-2">
        {/* TOTAL BUDGET: shown with the three figures worked out from it, which
        are virtuals on the schema rather than stored fields. percentUsed is
        returned as a string by toFixed, and is unusable on a budget of nothing,
        so it is read as a number and checked before it is shown */}
        <div className='details-group'>
        <span><p className='nested-details-label'>TOTAL BUDGET:</p></span>
        <div className='nested-details-group'>
            <span className='nested-details-span'>
                <p className='details-label'>TOTAL:</p>
                <p className='details-value'>{toMoney(selectedBudget.totalBudget, selectedBudget.baseCurrency)}</p>
            </span>
            <span className='nested-details-span'>
                <p className='details-label'>SPENT:</p>
                <p className='details-value'>{toMoney(selectedBudget.totalSpent, selectedBudget.baseCurrency)}</p>
            </span>
            <span className='nested-details-span'>
                <p className='details-label'>REMAINING:</p>
                <p className='details-value'>{toMoney(selectedBudget.remaining, selectedBudget.baseCurrency)}</p>
            </span>
            <span className='nested-details-span'>
                <p className='details-label'>USED:</p>
                <p className='details-value'>
                    {Number.isFinite(Number(selectedBudget.percentUsed))
                        ? toPercent(Number(selectedBudget.percentUsed))
                        : NOT_AVAILABLE}
                </p>
            </span>
        </div>
        </div>
      </div>
      <div className="p-2">
        {/* category limits: one optional cap per expense category, listed only
        where there is one. A limit stored as null means the category has no cap
        of its own and is only capped by the total, so all ten missing is a
        budget with no category limits rather than a budget with none loaded */}
        <div className='details-group'>
        <span><p className='nested-details-label'>CATEGORY LIMITS:</p></span>
        <div className='nested-details-group'>
            {cappedCategories.length === 0 ? (
            <span className='nested-details-span'>
                <p className='details-value'>NO CATEGORY LIMITS SET</p>
            </span>
            ) : (
            cappedCategories.map(({ key, label }) => (
            <span className='nested-details-span' key={key}>
                <p className='details-label'>{`${label}:`}</p>
                <p className='details-value'>
                    {toMoney(selectedBudget.categoryLimits[key], selectedBudget.baseCurrency)}
                </p>
            </span>
            ))
            )}
        </div>
        </div>
      </div>
        <div className="p-2">
        {/* TOTAL number of EXPENSES: counted off the expenses the budget was
        returned with, so it counts what is actually filed against it. Read as a
        length rather than through || , which would report a budget with nothing
        spent against it yet as NOT AVAILABLE */}
        <div className='details-group'>
            <p className='details-label'>TOTAL EXPENSES:</p>
            <p className='details-value'>
                {Array.isArray(selectedBudget.expenses) ? selectedBudget.expenses.length : 0}
            </p>
        </div>
      </div>
    </Stack>
    <Stack gap={3} id='budgetDetailsStack2'>
      <div className="p-2">
        {/* Base currency: what every expense on this budget is converted into as
        it is added, and what the totals above are expressed in */}
        <div className='details-group'>
            <p className='details-label'>BASE CURRENCY:</p>
            <p className='details-value'>{selectedBudget.baseCurrency || NOT_AVAILABLE}</p>
        </div>
      </div>
      <div className="p-2">
        {/* daily budget: optional on the form. Left blank, the schema's
        pre('save') hook divides the total by the length of the trip, so a
        budget only shows nothing here when the trip has no dates to divide by */}
        <div className='details-group'>
            <p className='details-label'>DAILY BUDGET:</p>
            <p className='details-value'>
                {typeof selectedBudget.dailyBudget === 'number'
                    ? toMoney(selectedBudget.dailyBudget, selectedBudget.baseCurrency)
                    : NOT_AVAILABLE}
            </p>
        </div>
      </div>
      <div className="p-2">
        {/* Alerts: both are booleans that default to true on the schema, so they
        are read as ON or OFF rather than through || , which would report an
        alert that was switched off as NOT AVAILABLE */}
        <div className='details-group'>
        <span><p className='nested-details-label'>ALERTS:</p></span>
        <div className='nested-details-group'>
            <span className='nested-details-span'>
                <p className='details-label'>AT 80%:</p>
                <p className='details-value'>{selectedBudget.alerts?.notifyAt80Percent ? 'ON' : 'OFF'}</p>
            </span>
            <span className='nested-details-span'>
                <p className='details-label'>ON EXCEED:</p>
                <p className='details-value'>{selectedBudget.alerts?.notifyOnExceed ? 'ON' : 'OFF'}</p>
            </span>
        </div>
        </div>
      </div>
    </Stack>
            </div>
            <div id='budgetPanalFooter'>
                 <Stack direction="horizontal" gap={3} id='detailsFooterStack'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto"></div>
      <div className="vr" />
      <div className="p-2">
        {/* Left unwired: DELETE /budget/deleteBudget/:id is not written yet, so
        there is nothing to send the selected budget's id to. A budget holds its
        trip's expenses, so deleting one deletes those with it */}
        <Button
        variant='danger'
        id='deleteItemBtn'
        type='button'
        // onClick={}
        >DELETE</Button>
      </div>
    </Stack>

            </div>
        </div>
        )}
    </div>
  )
}
