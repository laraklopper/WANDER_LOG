// EntriesList.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useEffect, useMemo, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/DetailsPanal.css'
import '../css/componentCss/EntriesList.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import FilterEntries from './FilterEntries';
import { ArrowDownAZ } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import { NOT_AVAILABLE, rowClass, toLongDate, toLongDateTime } from '../util/formatCalculations';
import {
    BLANK_ENTRY_FILTERS,
    countFilters,
    filterEntries,
    filterSummary,
    tripFilterOptions,
} from '../util/filterFunctions';
import ExportForm from './ExportForm';

export default function EntriesList(
    {//PROPS PASSED FROM PARENT COMPONENT (TravelLog.js)
        currentUser,
        /* Every entry the account has written, loaded by the travel log page
        from GET /entry/fetchEntries and already sorted newest first */
        userEntries = [],
        loadingEntries = false,
        fetchEntries,
        toggleEditEntry,
        showEditEntry,
        /* Closes the edit form on the travel log page. The form is opened from
        this panel and names the entry it is editing from it, so it is closed
        whenever the panel is */
        closeEditEntry,
        deleteEntry,
        /* The id of the entry the edit form is open on, so the panel says which
        entry the form further down the page belongs to */
        editingEntryId = null
    }) {

    // ========STATE VARIABLES============
    const [selectedId, setSelectedId] = useState(null)//State used to indicate which entry the details panel is showing
    const [showFilter, setShowFilter] = useState(false)
    const [exportList, setExportList] = useState(false)
    /* The filters the list is currently narrowed by, set by the filter form's
    APPLY. Held here rather than in the form because it is the list they narrow:
    the form only collects them, and closing it leaves them applied */
    const [filters, setFilters] = useState(BLANK_ENTRY_FILTERS)
    /* The entry whose DELETE is in flight, held as an id rather than as a plain
    boolean so the button reports itself busy for the entry it is actually
    removing and not for whichever one the panel has since moved to */
    const [deletingId, setDeletingId] = useState(null)
    const isDeleting = Boolean(deletingId)

    const username = currentUser?.username || '';//Current loggedin user username

    // ========FILTERING============
    /* The rows the table actually shows. Recomputed only when the entries or
    the filters change, rather than on every render, because the panel and the
    buttons below set state of their own */
    const filteredEntries = useMemo(
        () => filterEntries(userEntries, filters), [userEntries, filters]
    )

    /* The trips the entries name, for the filter form's select. Built from the
    entries rather than from the account's trips — which this list is not handed
    — so the select cannot offer a trip nothing has been written about */
    const tripOptions = useMemo(
        () => tripFilterOptions(userEntries, 'trip'), [userEntries]
    )

    // Whether the list is being narrowed at all, so it can say what is hidden
    const filtersActive = countFilters(filters) > 0;

    // Applies the filters the form collected
    const applyFilters = useCallback((next) => {
        setFilters(next)
    },[])

    // Returns the list to every entry on the account
    const clearFilters = useCallback(() => {
        setFilters(BLANK_ENTRY_FILTERS)
    },[])

    /* Resolved out of the filtered list on every render, so the panel follows
    the state TravelLog.js owns: an edit shows as soon as the refetched list
    arrives, and an entry that is no longer in the list closes the panel rather
    than leaving a stale copy of it on screen.

    Read off the filtered list rather than the whole one, so a filter that hides
    the selected row closes the panel with it — a panel left open on an entry
    that is no longer in the table is reporting something the user cannot see */
    const selectedEntry = useMemo(
        () => filteredEntries.find((entry) => entry._id === selectedId) || null,
        [filteredEntries, selectedId]
    )

    /* Whether the edit form is open on the entry the panel is showing, rather
    than merely open. The button belongs to the panel, so on an entry the form
    is not open on it offers to edit that entry instead of offering to hide a
    form that is reporting a different one */
    const formOpenOnEntry = Boolean(
        showEditEntry
        && editingEntryId
        && selectedEntry
        && String(editingEntryId) === String(selectedEntry._id)
    )

    //================EVENT LISTENERS========================
    // Opens the details panel on one entry
    const handleSelect = useCallback((entryId) => {
        setSelectedId(entryId)
    },[])

    /* Closes the details panel without touching the list itself, and closes the
    edit form with it: the form is opened from this panel and reports the entry
    it is editing from it, so one left behind would be offering to change an
    entry that is no longer on screen */
    const handleClose = useCallback(() => {
        setSelectedId(null)
        closeEditEntry?.()
    },[closeEditEntry])

    const toggleFilter = useCallback(() => {
        setShowFilter(prev => !prev)
    },[])
    const toggleExportForm = useCallback(() => {
        setExportList(prev => !prev)
    },[])
    /* The panel also closes on its own, when the list no longer holds the entry
    it was showing — one deleted from another session, or one a newly applied
    filter hides. The selected id is dropped and the form closed here too, so a
    panel that closed without CLOSE being pressed leaves no form open behind it */
    useEffect(() => {
        if (!selectedId || selectedEntry) return;

        console.log('[INFO: EntriesList.js] Entry', selectedId, 'is no longer in the list, closed the panel');
        setSelectedId(null)
        closeEditEntry?.()
    },[selectedId, selectedEntry, closeEditEntry])

    //Function to delete an entry
    const handleDelete = useCallback(async () => {
        const entryId = selectedEntry?._id;

        if (!entryId) return;// Nothing on screen to delete
        if (deletingId) return;// A delete is already running

        /* Named in the confirmation along with the trip it was filed against,
        because the panel shows one entry of several and the list is sorted by
        date rather than grouped by trip */
        const confirmDelete = window.confirm(// Ask the user to confirm before the entry is removed
            `Delete ${selectedEntry.title || 'this entry'}${
                selectedEntry.trip ? ` from ${selectedEntry.trip}` : ''
            }? This cannot be undone.`
        )

        // Conditional rendering to check the user confirmed the delete
        if (!confirmDelete) {
            console.log('[INFO: EntriesList.js] Delete of entry', entryId, 'was cancelled');
            return;
        }

        setDeletingId(entryId)

        try {
            const removed = await deleteEntry?.(entryId)

            // Conditional rendering to check the entry was actually removed
            if (!removed) {
                console.warn('[WARN: EntriesList.js] Entry', entryId, 'was not deleted, the panel was left open on it');
                return;
            }

            setSelectedId(null)
            console.log('[SUCCESS: EntriesList.js] Deleted entry', entryId);
        } finally {
            setDeletingId(null)
        }
    },[selectedEntry, deletingId, deleteEntry])

    //===============JSX RENDERING==============
  return (
    <div id='entriesList'>
        <div id='entriesListToolbar'>
        <Stack direction="horizontal" gap={3} id='entriesToolbarStack'>
      
      <div className="p-2">
        {/* Button to reload the list from the API */}
        <Button
        id='refreshEntriesBtn'
        variant='light'
        type='button'
        onClick={fetchEntries}
        disabled={loadingEntries}
        // ARIA ATTRIBUTES:
        aria-label='Reload your entries'
        aria-disabled={loadingEntries}
        >
            {loadingEntries ? 'LOADING...' : 'REFRESH'}
        </Button>
      </div>
      <div className="p-2 ms-auto">
        <Button
        variant='light'
        id='toggleExportBtn'
        onClick={toggleExportForm}
        aria-pressed={exportList}
        aria-expanded={exportList}
        >
            EXPORT ENTRIES
        </Button>
      </div>
      <div className="p-2">
        <Button
        variant='light'
        id='toggleFilterBtn'
        onClick={toggleFilter}
        aria-expanded={showFilter}
        aria-label={showFilter ? 'Hide Form' : 'Filter Entries'}
        >
           {showFilter ? (
                      <>Hide Filter</>
                  ):(
                      <>
                          Filter Entries<ArrowDownAZ fontWeight={700} aria-hidden='true' focusable='false'/>
                      </>
                  )}
        </Button>
      </div>
    </Stack>

        {showFilter&& (
            <div id='entriesFilterPanal'>
                <div id='filterBlock'>
                    <FilterEntries
                    /* The filter as it is being applied, so the form opens on
                    it rather than on a blank select */
                    filters={filters}
                    /* Only the trips the entries name, so the select cannot
                    offer one that would empty the list */
                    tripOptions={tripOptions}
                    applyFilters={applyFilters}
                    clearFilters={clearFilters}
                    disabled={loadingEntries}
                    />
                </div>
            </div>
        )}
        </div>
        <div id='entriesTableBlock'>
        {/* WHAT THE FILTER IS HIDING: only on screen while the list is being
        narrowed, so a user looking at four rows out of thirty knows the rest
        are hidden rather than gone */}
        {filtersActive && (
            <p className='infoText' id='entriesFilterSummary' aria-live='polite'>
                {filterSummary(filteredEntries.length, userEntries.length)}
            </p>
        )}
        {/* ENTRIES LIST TABLE: table displaying userEntries, narrowed by the filter */}
            <table id='entriesListTable' aria-busy={loadingEntries}>
                <thead>
                    <tr>
                        <th colSpan={4} id='entriesListMainHead'>
                            {username}: ENTRIES
                        </th>
                    </tr>
                    <tr id='entriesListHeadRow'>
                        <th scope='col'>TRIP</th>
                        <th scope='col'>TITLE</th>
                        <th scope='col'>DATE</th>
                        <th></th>{/*VIEW PANAL BUTTON*/}
                    </tr>
                </thead>
                <tbody>
                    {/* The three states the list can be in: a request still
                    running with nothing to show yet, an account that has not
                    written an entry, and the entries themselves */}
                    {loadingEntries && userEntries.length === 0 ? (
                        <tr>
                            <td colSpan={4} className='entries-list-loading'>
                                LOADING YOUR ENTRIES...
                            </td>
                        </tr>
                    ) : userEntries.length === 0 ? (
                        <tr>
                            <td colSpan={4} className='entries-list-empty'>
                                NO ENTRIES WRITTEN YET
                            </td>
                        </tr>
                    /* An account with entries, none of which are on the chosen
                    trip. Told apart from an account with no entries at all,
                    because the two are the user's to fix in different ways: one
                    by clearing the filter, the other by writing an entry */
                    ) : filteredEntries.length === 0 ? (
                        <tr>
                            <td colSpan={4} className='entries-list-empty'>
                                NO ENTRIES MATCH THIS FILTER
                            </td>
                        </tr>
                    ) : (
                        filteredEntries.map((entry, index) => (
                            <tr
                                key={entry._id}
                                className={`${rowClass(index)}${
                                    entry._id === selectedId ? ' selectedRow' : ''
                                }`}
                            >
                                {/* The trip's title is stored on the entry, so
                                the row names the trip without it being loaded */}
                                <td>{entry.trip || NOT_AVAILABLE}</td>
                                <td>{entry.title || NOT_AVAILABLE}</td>
                                {/* Stored as a Date and arrives as an ISO
                                string, so it is read through toLongDate rather
                                than printed raw */}
                                <td>{toLongDate(entry.date)}</td>
                                <td>
                                    <div id='viewEntry-div'>
                                    <Button
                                        variant='light'
                                        id='viewEntryBtn'
                                        type='button'
                                        onClick={() => handleSelect(entry._id)}
                                        // ARIA ATTRIBUTES:
                                        aria-label={`View the details of ${entry.title || 'this entry'}`}
                                        aria-pressed={entry._id === selectedId}
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
            {exportList && (
                <div>
                    {/* The count is passed so the form can keep the button from
                    asking for an export of an account with no entries on it */}
                    <ExportForm resource='entries' count={userEntries.length}/>
                </div>
            )}
        </div>
        {/* ENTRIES DETAILS PANAL: only on screen once a row's VIEW has been pressed, */}
        {selectedEntry && (
        <div id='entryDetailsPanal' aria-live='polite'>
            <div id='entryHeaderBlock'>
            <Stack direction="horizontal" gap={3}>
      <div className="p-2"/>
      <div className="p-2 ms-auto"/>
      <div className="p-2">
        {/* Whose entry this is: read off the entry rather than the session, so
        the panel names the account it was written by */}
        <p className='panalUsername'>@{selectedEntry.username || username}</p>
      </div>
    </Stack>
            <Stack direction="horizontal" gap={3} id='entryHeaderStack'>
      <div className="p-2">
        <h5 id='entry-details-heading'>{selectedEntry.title || NOT_AVAILABLE}</h5>
      </div>
      <div className="p-2 ms-auto">
        {/* TOGGLE EDIT ENTRY FORM: the entry on screen is handed over with the
        press, so the form opens on the one the panel is showing rather than on
        nothing */}
        <Button
            variant='warning'
            onClick={() => toggleEditEntry?.(selectedEntry)}
            id='toggleEditEntryBtn'
            type='button'
            // ARIA ATTRIBUTES:
            aria-label={formOpenOnEntry ? 'Hide Form' : `Edit ${selectedEntry.title || 'this entry'}`}
            aria-pressed={formOpenOnEntry}
            aria-expanded={formOpenOnEntry}>
            {formOpenOnEntry ? 'Hide Form' : 'Edit Entry'}
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
            aria-label='Close the entry details panel'
            >
                CLOSE
            </Button>
      </div>
    </Stack>
            </div>
            {/* ENTRY PANAL */}
            <div id='entryPanalBody'>
            <Stack direction="horizontal" gap={3} id='entryPanalStack1'>
      <div className="p-2">
                <span className='detail-span'>
                    <p className='detail-label'>TRIP:</p>
                    <p className='detail-value'>{selectedEntry.trip || NOT_AVAILABLE}</p>
                </span>
            </div>
      <div className="p-2 ms-auto"/>
      <div className="p-2">
        <span className='detail-span'>
            <p className='details-label'>DATE:</p>
            <p className='detail-value'>{toLongDate(selectedEntry.date)}</p>
        </span>
      </div>
    </Stack>
      <div id='entryBodyDiv'>
       <Card id='tripEntryCard'>
      <Card.Body id='entryCardBody'>
        {/* ENTRY TITLE: rendered as the heading itself rather than wrapping one,
        so the id it is styled by is on a single element */}
        <Card.Title as='h5' id='entryCardTitle'>
            {selectedEntry.title || NOT_AVAILABLE}
        </Card.Title>
        {/* Rendered as a div, because the entry below it is a paragraph and
        Card.Text is one itself */}
        <Card.Text as='div'>
          {/* Kept as it was written: pre-wrap keeps the paragraph breaks typed
          into the form as breaks on screen rather than one run of text */}
          <p id='entryBody' style={{ whiteSpace: 'pre-wrap' }}>
            {selectedEntry.body || 'NO DETAILS STORED YET'}
          </p>
        </Card.Text>
      </Card.Body>
  </Card>

            </div>
            </div>
            <div id='entryFooterBlock'>
            <Stack direction="horizontal" gap={3} id='entryFooterStack'>
      {/* WHEN THE ENTRY WAS LOGGED: timestamps kept by the schema, read through
      toLongDateTime because they arrive as ISO strings */}
      <div className="p-2">
        <small className='entryTimestamp'>LOGGED: {toLongDateTime(selectedEntry.createdAt)}</small>
      </div>
      <div className="p-2 ms-auto">
        {/* Only said once the entry has actually been edited: an entry is
        written with its two timestamps equal, so an unedited one would
        otherwise report having been updated the moment it was logged */}
        {selectedEntry.updatedAt && selectedEntry.updatedAt !== selectedEntry.createdAt && (
            <small className='entryTimestamp'>
                LAST UPDATED: {toLongDateTime(selectedEntry.updatedAt)}
            </small>
        )}
        {/* Says whether this is the entry the edit form is open on, so a form
        further down the page is not read as belonging to whichever entry the
        panel has since moved to */}
        {formOpenOnEntry && (
            <small className='entryTimestamp'>OPEN IN THE EDIT FORM BELOW</small>
        )}
      </div>
      <div className="vr" />
      <div className="p-2">
        {/* Removes the entry the panel is showing. Disabled while its own
        request is in flight, so the entry cannot be deleted twice, and the
        panel is only closed once the API has answered that it went */}
        <Button
        variant='danger'
        id='deleteItemBtn'
        type='button'
        onClick={handleDelete}
        disabled={isDeleting}
        // ARIA ATTRIBUTES:
        aria-label={`Delete ${selectedEntry.title || 'this entry'}`}
        aria-disabled={isDeleting}
        >
            {isDeleting ? 'DELETING...' : 'DELETE'}
        </Button>
      </div>
    </Stack>
            </div>
        </div>
        )}
    </div>
  )
}
