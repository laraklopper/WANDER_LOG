// FilterTrips.js
/* The filter form under the trips list (TripsList.js).

Narrows the list by the four things a trip is stored with that a whole group of
trips can share: what it was for, where it went, how far along it is, and whether
a budget was ever set for it. The list itself does the narrowing — see
util/filterFunctions.js — and this form only collects the values.

The selects are held here as a draft rather than written straight through to the
list, because the form has an APPLY button: a user setting three filters should
see the list change once, when they say so, and not watch it jump after each
select. APPLY lifts the draft to the list; CLEAR FILTERS empties both. */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import '../css/componentCss/FilterForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Ban, Search } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS AND SHARED DATA
import { PURPOSES, DESTINATION_TYPES, STATUSES } from '../data/tripData';
import { BLANK_TRIP_FILTERS, countFilters } from '../util/filterFunctions';

export default function FilterTrips({
  /* The filters the list is currently applying. The form opens on them, so
  reopening it reports what is actually narrowing the list rather than a blank
  set of selects */
  filters = BLANK_TRIP_FILTERS,
  applyFilters,
  clearFilters,
  // True while the list is reloading, so the form is not submitted against a list that is about to be replaced
  disabled = false
}) {
  // ========STATE VARIABLES============
  /* What the selects are showing, which is not yet what the list is applying.
  Seeded from the applied filters, so the form opens on them */
  const [draft, setDraft] = useState(filters)

  /* Re-seeded whenever the list's applied filters change from anywhere other
  than this form's APPLY — the list clearing them when it is reloaded, for
  instance — so the selects cannot end up reporting filters that are no longer
  being applied */
  useEffect(() => {
    setDraft(filters)
  },[filters])

  /* Whether there is anything for CLEAR FILTERS to clear. Both are counted: a
  draft that was changed without being applied is still something to clear, and
  so are applied filters the user has not touched since opening the form */
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

    console.log('[INFO: FilterTrips.js] Applying trip filters:', draft);
    applyFilters?.(draft)
  },[disabled, draft, applyFilters])

  /* Empties the selects and the list's filters together. The list is told even
  when the draft is already blank, because the applied filters may not be */
  const handleClear = useCallback(() => {
    setDraft(BLANK_TRIP_FILTERS)
    console.log('[INFO: FilterTrips.js] Cleared the trip filters');
    clearFilters?.()
  },[clearFilters])

  // ========= IDs USED BY htmlFor =========
  const purposeId = 'filterTripPurpose';// ID used for the purpose select
  const statusId = 'filterTripStatus';// ID used for the status select
  const destinationTypeId = 'filterTripDestinationType';// ID used for the destination type select
  const hasBudgetId = 'filterTripHasBudget';// ID used for the has budget select
  const formTitleId = 'filterTripsFormTitle';// ID used for the form's own title

  //===============JSX RENDERING==============
  return (
    <form id='filterForm' onSubmit={handleApply} aria-labelledby={formTitleId}>
        <p className='visually-hidden' id={formTitleId}>FILTER TRIPS FORM</p>
        <div id='filter-form-input'>
            <Stack gap={3}>
                <div className="p-2">
                    <div className='filter-group'>
                        <div className='filter-input'>
<label className='filterLabel' htmlFor={purposeId}>PURPOSE</label>
                        <select
                        className='input'
                        id={purposeId}
                        name='purpose'
                        value={draft.purpose}
                        onChange={handleChange}
                        disabled={disabled}
                        >
                            {/* SET SELECT AS PLACEHOLDER: the value a filter
                            that is not set submits */}
                            <option value=''>SELECT</option>
                            {/* The same two the add and edit trip forms offer,
                            from one shared list, so a filter cannot name a
                            purpose no trip could have been logged under */}
                            {PURPOSES.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        </div>
                        <div className='filter-input'>
                            <label className='filterLabel' htmlFor={statusId}>STATUS:</label>
                            <select
                            className='input'
                            id={statusId}
                            name='status'
                            value={draft.status}
                            onChange={handleChange}
                            disabled={disabled}
                            >
                                <option value=''>SELECT</option>
                                {STATUSES.map(({ value, label }) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                            </select>

                        </div>
                    </div>
                </div>
                <div className="p-2">
                    <div className='filter-group'>
                        <div className='filter-input'>
                            <label className='filterLabel' htmlFor={destinationTypeId}>DESTINATION TYPE:</label>
                            <select
                            className='input'
                            id={destinationTypeId}
                            name='destinationType'
                            value={draft.destinationType}
                            onChange={handleChange}
                            disabled={disabled}
                            >
                            <option value=''>SELECT</option>
                            {DESTINATION_TYPES.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                            </select>

                        </div>
                        <div className='filter-input'>
                            <label className='filterLabel' htmlFor={hasBudgetId}>HAS BUDGET</label>
                           {/* Stored as a boolean, so the value submitted is the
                           word and filterFunctions.js reads it back as true or
                           false. NO covers a trip with no budget set at all,
                           which is what the list's own column shows */}
                           <select
                           className='input'
                           id={hasBudgetId}
                           name='hasBudget'
                           value={draft.hasBudget}
                           onChange={handleChange}
                           disabled={disabled}
                           >
                            <option value=''>SELECT</option>
                            <option value='YES'>YES</option>
                            <option value='NO'>NO</option>
                           </select>
                        </div>
                    </div>
                </div>
            </Stack>
            <Stack direction="horizontal" gap={3}>
                <div className="p-2"></div>
                <div className="p-2 ms-auto">
                    <Button
                    id='applyFiltersBtn'
                    type='submit'
                    variant='light'
                    disabled={disabled}
                    // ARIA ATTRIBUTES:
                    aria-label='Apply these filters to your trips'
                    aria-disabled={disabled}
                    >APPLY<Search aria-hidden='true' focusable='false' /></Button>
                </div>
                <div className="vr" />
                <div className="p-2">
                    <Button variant='danger' id='clearFiltersBtn'
                    type='button'
                    onClick={handleClear}
                    // Nothing is set, so there is nothing for this to do
                    disabled={disabled || !anythingToClear}
                    // ARIA ATTRIBUTES:
                    aria-label='Clear the trip filters'
                    aria-disabled={disabled || !anythingToClear}
                    >CLEAR FILTERS<Ban fontWeight={700} aria-hidden='true' focusable='false'/></Button>
                </div>
    </Stack>

        </div>

    </form>
  )
}
