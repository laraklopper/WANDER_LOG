// FilterExpenses.js
/* The filter form under the expenses list (ExpensesList.js).

Narrows the list by the five things an expense is stored with that a whole group
of expenses can share: the trip it was spent on, the currency it was paid in,
what it was paid with, what it was for, and whether it has actually been settled.
The list itself does the narrowing — see util/filterFunctions.js — and this form
only collects the values.

The selects are held here as a draft rather than written straight through to the
list, because the form has an APPLY button: a user setting three filters should
see the list change once, when they say so. APPLY lifts the draft to the list;
CLEAR FILTERS empties both.

The trip and currency selects are built from the expenses themselves, passed in
as `tripOptions` and `currencyOptions`: a trip nothing was spent on, or one of
the 165 codes the converter knows that nothing was paid in, would only ever
filter the list down to nothing. The category and payment method selects come
from the shared lists the add and edit expense forms are built from, so a filter
can only ever name a value an expense could have been logged under. */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import '../css/componentCss/FilterForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Ban, Search } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS AND SHARED DATA
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../data/financeData';
import { BLANK_EXPENSE_FILTERS, countFilters } from '../util/filterFunctions';

export default function FilterExpenses({
  /* The filters the list is currently applying. The form opens on them, so
  reopening it reports what is actually narrowing the list */
  filters = BLANK_EXPENSE_FILTERS,
  /* The trips the expenses were spent on, and the currencies they were paid in,
  as { value, label } pairs built by tripFilterOptions and valueFilterOptions in
  util/filterFunctions.js */
  tripOptions = [],
  currencyOptions = [],
  applyFilters,
  clearFilters,
  // True while the list is reloading, so the form is not submitted against a list that is about to be replaced
  disabled = false
}) {
  // ========STATE VARIABLES============
  // What the selects are showing, which is not yet what the list is applying
  const [draft, setDraft] = useState(filters)

  /* Re-seeded whenever the list's applied filters change from anywhere other
  than this form's APPLY, so the selects cannot end up reporting filters that are
  no longer being applied */
  useEffect(() => {
    setDraft(filters)
  },[filters])

  // Whether there is anything for CLEAR FILTERS to clear, in the draft or applied
  const anythingToClear = useMemo(
    () => countFilters(draft) > 0 || countFilters(filters) > 0,
    [draft, filters]
  );

  //================EVENT LISTENERS========================
  // Holds one select's value in the draft, named by the filter it sets
  const handleChange = useCallback((event) => {
    const { name, value } = event.target;

    setDraft((prev) => ({ ...prev, [name]: value }))
  },[])

  // Hands the draft to the list, which is what actually narrows it
  const handleApply = useCallback((event) => {
    event.preventDefault()

    if (disabled) return;

    console.log('[INFO: FilterExpenses.js] Applying expense filters:', draft);
    applyFilters?.(draft)
  },[disabled, draft, applyFilters])

  /* Empties the selects and the list's filters together. The list is told even
  when the draft is already blank, because the applied filters may not be */
  const handleClear = useCallback(() => {
    setDraft(BLANK_EXPENSE_FILTERS)
    console.log('[INFO: FilterExpenses.js] Cleared the expense filters');
    clearFilters?.()
  },[clearFilters])

  // ========= IDs USED BY htmlFor =========
  const tripId = 'filterExpenseTrip';// ID used for the trip select
  const currencyId = 'filterExpenseCurrency';// ID used for the currency select
  const paymentMethodId = 'filterExpensePaymentMethod';// ID used for the payment method select
  const categoryId = 'filterExpenseCategory';// ID used for the category select
  const isPaidId = 'filterExpenseIsPaid';// ID used for the paid select
  const formTitleId = 'filterExpensesFormTitle';// ID used for the form's own title

  //===============JSX RENDERING==============
  return (
    <form id='filterForm' onSubmit={handleApply} aria-labelledby={formTitleId}>
    <p className='visually-hidden' id={formTitleId}>FILTER EXPENSES FORM</p>
    <div id='filter-form-input'>
 <Stack gap={3}>
      <div className="p-2">
        <div className='input-div'>
          <div className='filter-input'>
            <label className='filterLabel' htmlFor={tripId}>TRIP:</label>
            <select
            className='input'
            id={tripId}
            name='tripId'
            value={draft.tripId}
            onChange={handleChange}
            disabled={disabled || tripOptions.length === 0}
            >
              {/* SET SELECT AS PLACEHOLDER: the value a filter that is not set submits */}
              <option value=''>SELECT</option>
              {/* Only the trips the expenses name, so the select cannot offer
              one that would empty the list */}
              {tripOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className='input-div'>
          {/* THE CURRENCY THE EXPENSE WAS PAID IN: an expense is paid in the
          currency of the day, so two rows can be in different ones. Built from
          the codes the expenses were actually paid in rather than from all 165
          the converter knows */}
          <label className='filterLabel' htmlFor={currencyId}>CURRENCY:</label>
            <select
            className='input'
            id={currencyId}
            name='currency'
            value={draft.currency}
            onChange={handleChange}
            disabled={disabled || currencyOptions.length === 0}
            >
            <option value=''>SELECT</option>
            {currencyOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
            </select>
          </div>
        </div>
      </div>
      <div className="p-2">
      <div className='filter-group'>
      {/* PAYMENT METHOD */}
      <div className='filter-input'>
          <label className='filterLabel' htmlFor={paymentMethodId}>PAYMENT METHOD:</label>
          <select
          className='input'
          id={paymentMethodId}
          name='paymentMethod'
          value={draft.paymentMethod}
          onChange={handleChange}
          disabled={disabled}
          // ARIA ATTRIBUTES:
          aria-required='false'
          >
            <option value=''>SELECT</option>
            {/* Stored as the schema's own key, offered as the add expense form
            named it, from one shared list */}
            {PAYMENT_METHODS.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        {/* Filter By Category */}
        <div className='filter-input'>
          <label className='filterLabel' htmlFor={categoryId}>CATEGORY:</label>
          <select
          id={categoryId}
          name='category'
          value={draft.category}
          onChange={handleChange}
          disabled={disabled}
          className='input'>
            <option value=''>SELECT</option>
            {EXPENSE_CATEGORIES.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      </div>
      <div className="p-2">
        <div className='filter-input'>
          <label className='filterLabel' htmlFor={isPaidId}>PAID:</label>
          {/* Stored as a boolean, so the value submitted is the word and
          filterFunctions.js reads it back as true or false. NO is a committed
          but unsettled cost, such as an unpaid deposit */}
          <select
          className='input'
          id={isPaidId}
          name='isPaid'
          value={draft.isPaid}
          onChange={handleChange}
          disabled={disabled}
          >
            <option value=''>SELECT</option>
            <option value='YES'>YES</option>
            <option value='NO'>NO</option>
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
        type='submit'
        disabled={disabled}
        // ARIA ATTRIBUTES:
        aria-label='Apply these filters to your expenses'
        aria-disabled={disabled}
        >
          APPLY<Search fontWeight={700} aria-hidden='true' focusable='false' />
        </Button>
      </div>
      <div className="p-2">
         <Button
         variant='danger'
         id='clearFiltersBtn'
         type='button'
         onClick={handleClear}
         // Nothing is set, so there is nothing for this to do
         disabled={disabled || !anythingToClear}
         // ARIA ATTRIBUTES:
         aria-label='Clear the expense filters'
         aria-disabled={disabled || !anythingToClear}
         >
          CLEAR FILTERS<Ban fontWeight={700} aria-hidden='true' focusable='false'/>
        </Button>
      </div>
    </Stack>
    </div>

    </form>
  )
}
