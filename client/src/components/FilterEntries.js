// FilterEntries.js
/* The filter form under the journal entries list (EntriesList.js).

The entries list holds every entry the account has written, across every trip, so
the one thing worth narrowing it by is the trip an entry was written about. The
list itself does the narrowing — see util/filterFunctions.js — and this form only
collects the value.

The select is held here as a draft rather than written straight through to the
list, because the form has an APPLY button: the list changes when the user says
so. APPLY lifts the draft to the list; CLEAR FILTERS empties both.

The trips offered are the ones the entries themselves name, passed in as
`tripOptions`, rather than every trip on the account: a trip nothing has been
written about could only ever filter the list down to nothing. */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import '../css/componentCss/FilterForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Ban, Search } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import { BLANK_ENTRY_FILTERS, countFilters } from '../util/filterFunctions';


// FilterEntries component
export default function FilterEntries({
  /* The filters the list is currently applying. The form opens on them, so
  reopening it reports what is actually narrowing the list */
  filters = BLANK_ENTRY_FILTERS,
  /* The trips the entries were written about, as { value, label } pairs built by
  tripFilterOptions in util/filterFunctions.js */
  tripOptions = [],
  applyFilters,
  clearFilters,
  // True while the list is reloading, so the form is not submitted against a list that is about to be replaced
  disabled = false
}) {
  // ========STATE VARIABLES============
  // What the select is showing, which is not yet what the list is applying
  const [draft, setDraft] = useState(filters)

  /* Re-seeded whenever the list's applied filters change from anywhere other
  than this form's APPLY, so the select cannot end up reporting a trip that is no
  longer being filtered on */
  useEffect(() => {
    setDraft(filters)
  },[filters])

  // Whether there is anything for CLEAR FILTERS to clear, in the draft or applied
  const anythingToClear = useMemo(
    () => countFilters(draft) > 0 || countFilters(filters) > 0,
    [draft, filters]
  );

  /* No trip in the list to filter by, which is the case for an account that has
  not written an entry yet. The select is left on its placeholder and the form
  says so, rather than offering an empty select with nothing in it */
  const noTrips = tripOptions.length === 0;

  //================EVENT LISTENERS========================
  // Holds the select's value in the draft, named by the filter it sets
  const handleChange = useCallback((event) => {
    const { name, value } = event.target;

    setDraft((prev) => ({ ...prev, [name]: value }))
  },[])

  // Hands the draft to the list, which is what actually narrows it
  const handleApply = useCallback((event) => {
    event.preventDefault()

    if (disabled) return;

    console.log('[INFO: FilterEntries.js] Applying entry filters:', draft);
    applyFilters?.(draft)
  },[disabled, draft, applyFilters])

  /* Empties the select and the list's filter together. The list is told even
  when the draft is already blank, because the applied filter may not be */
  const handleClear = useCallback(() => {
    setDraft(BLANK_ENTRY_FILTERS)
    console.log('[INFO: FilterEntries.js] Cleared the entry filters');
    clearFilters?.()
  },[clearFilters])

  // ========= IDs USED BY htmlFor AND aria-describedby =========
  const tripId = 'filterEntriesTrip';// ID used for the trip select
  const noTripsId = 'filterEntriesNoTrips';// ID used for the message shown when there is no trip to filter by
  const formTitleId = 'filterEntriesFormTitle';// ID used for the form's own title

  //===============JSX RENDERING==============
  return (
    <form id='filterForm' method='GET' onSubmit={handleApply} aria-labelledby={formTitleId}>
    <p className='visually-hidden' id={formTitleId}>FILTER ENTRIES FORM</p>
    <div id='filter-form-input'>
      <Stack direction="horizontal" gap={3}>
      <div className="p-2">
        <div className='filter-input'>
          <label className='filterLabel' htmlFor={tripId}>
            FILTER BY TRIP:
          </label>
          <select
          className='input'
          id={tripId}
          name='tripId'
          value={draft.tripId}
          onChange={handleChange}
          disabled={disabled || noTrips}
          // ARIA ATTRIBUTES:
          aria-describedby={noTrips ? noTripsId : undefined}
          >
            {/* SET SELECT AS PLACEHOLDER: the value a filter that is not set submits */}
            <option value=''>SELECT</option>
            {/* Only the trips the entries name, so the select cannot offer one
            that would empty the list */}
            {tripOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="p-2 ms-auto">
        <Button
        variant='warning'
        id='applyFiltersBtn'
        type='submit'
        disabled={disabled || noTrips}
        // ARIA ATTRIBUTES:
        aria-label='Apply this filter to your journal entries'
        aria-disabled={disabled || noTrips}
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
         aria-label='Clear the journal entry filters'
         aria-disabled={disabled || !anythingToClear}
         >
          CLEAR FILTERS<Ban fontWeight={700} aria-hidden='true' focusable='false'/>
        </Button>
      </div>
    </Stack>
    {/* Says why the select is empty, rather than leaving a disabled one with
    nothing in it and no explanation */}
    {noTrips && (
      <p id={noTripsId} className='infoText' aria-live='polite'>
        THERE ARE NO TRIPS TO FILTER BY YET
      </p>
    )}
    </div>

    </form>
  )
}
