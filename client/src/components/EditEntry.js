// EditEntry.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useMemo, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/EditEntry.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import { Bug } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import { NOT_AVAILABLE, toLongDate } from '../util/formatCalculations';

/* The maxlength values entrySchema stores, repeated here so each input stops
accepting characters at the point the API would refuse them */
const TITLE_MAX = 150;
const BODY_MAX = 2000;

/* The empty form used by the clear button when the page does not supply one.
Kept in sync with EMPTY_ENTRY_EDIT in pages/TravelLog.js, which is passed in as a
prop. The trip is held as tripId rather than a title, because that is what the
API takes: it loads the trip and reads the stored title off it. The owner is left
out on purpose, userId and username come from the token and the database */
const BLANK_EDIT = {
  tripId: '',
  title: '',
  body: '',
};

//EditEntry function component
export default function EditEntry(
  {//PROPS PASSED FROM PARENT COMPONENT(TravelLog.js)
    currentUser,
    /* The entry being edited, which is what every field on the form reports as
    the value it would be left with. Without one there is nothing to edit */
    entry,
    editEntryData = BLANK_EDIT,
    setEditEntryData,
    editEntry,
    // True while the edit request is in flight, set by the travel log page
    submitting = false,
    /* Field keyed messages from the server, for rules the browser cannot check.
    Keyed by schema path, so the trip arrives as 'tripId' */
    fieldErrors = {},
    emptyForm = BLANK_EDIT,
    /* The logged in user's trips, loaded by the travel log page. An entry is
    filed against one of them, so these fill the select that moves it to another */
    trips = [],
    loadingTrips = false
  }) {
    // =========STATE VARIABLES=============
    const [formError, setFormError] = useState(null)// Form level error shown above the submit button

    //========== WHAT THE ENTRY CURRENTLY HOLDS ====================
    const storedTrip = entry?.trip || '';
    // Held as a string, the id arrives as one and is compared against the select's value
    const storedTripId = entry?.tripId ? String(entry.tripId) : '';
    const storedTitle = entry?.title || '';
    const storedBody = entry?.body || '';

    /* An entry can only be edited once one has been opened from the entries
    list. Checked on the id rather than the object, so a value passed without one
    is treated as no entry at all */
    const noEntry = !entry?._id;

    /* Nothing to choose from until the trips have loaded, and nothing to move
    the entry to when the account only holds the trip it is already on. Checked
    once the trips have finished loading, so an empty list mid request is not
    reported as no trips */
    const noOtherTrips = !loadingTrips
      && trips.filter((trip) => String(trip._id) !== storedTripId).length === 0;

    //========== CHANGE VALIDATION ====================
    /* Whether anything was actually filled in. A PATCH with nothing in it is
    answered by the API with 'There is nothing to update', so it is reported here
    instead of being sent. The trip only counts when it names a different one:
    leaving the select on the trip the entry is already filed against is not a
    change, which is the same judgement the API makes of it */
    const hasChanges = useMemo(
      () =>
        Boolean(
          String(editEntryData.title || '').trim() ||
          String(editEntryData.body || '').trim() ||
          (String(editEntryData.tripId || '').trim() &&
            String(editEntryData.tripId) !== storedTripId)
        ),
      [editEntryData, storedTripId]
    );

    /* Blocked while a request is running, and while there is no entry open to
    edit: without one there is nothing for the changes to be written to */
    const submitDisabled = submitting || noEntry;

    //================EVENT HANDLERS========================
    // Function to handle input changes in the form
    const handleInputChange = (event) => {
      const { name, value } = event.target;// Extract the input name and value

      setFormError(null);// Any edit clears the form level error
      // Update the specific field that changed
      setEditEntryData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    /* Only the rules the browser cannot enforce on its own are checked here.
    maxLength is still handled by the native validation on each input, which
    blocks submit before this runs. There is nothing to check for an empty field:
    this form requires none of them, a blank one is a field being left as it is */
    const handleEditEntry = (event) => {
      event.preventDefault()
      // Ignored while a request is already running, so the form cannot double post
      if (submitting) return

      // Conditional rendering to check an entry is open for editing
      if (noEntry) {
        setFormError('No entry is open for editing. Please choose one from the list.')
        console.warn('[WARN: EditEntry.js]: No entry open for editing')
        return
      }
      /* Nothing was filled in, so there is no change to send. Reported here
      rather than by the API, which would answer the empty PATCH with a 400 */
      if (!hasChanges) {
        setFormError('Nothing has been changed yet. Fill in only the fields you want to update.')
        console.warn('[WARN: EditEntry.js]: Submitted with no changes')
        return
      }

      setFormError(null)
      console.log('[INFO: EditEntry.js]: Editing entry', entry._id);
      editEntry?.()
    }

    // Function to clear the form
    const handleClear = () => {
      const confirmClear = window.confirm(// Ask the user to confirm before clearing all input fields
        "Are you sure you want to clear the form?"
      )
      if (!confirmClear) return;

      setEditEntryData(emptyForm)//Reset to the same empty shape, every field left as the entry is stored
      setFormError(null)
    }

    // ========= IDs USED BY aria-describedby =========
    const tripHelpId = 'editEntryTripHelp';// ID used for the stored trip hint
    const titleHelpId = 'editEntryTitleHelp';// ID used for the stored title hint
    const bodyHelpId = 'editEntryBodyHelp';// ID used for the stored details hint
    const noEntryId = 'editEntryNoEntry';// ID used for the no entry open message
    const formErrorId = 'editEntryFormError';// ID used for the form level error message
    const serverErrorId = 'editEntryServerErrors';// ID used for the block listing the server's field errors

    // Joins the IDs that are currently rendered into a single aria-describedby value
    const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

    /* The server returns its errors keyed by schema path. Listed as entries for
    rendering, and looked up by path to mark the matching input invalid */
    const serverErrors = Object.entries(fieldErrors || {});
    const hasServerError = (path) => Boolean(fieldErrors?.[path]);

    //==========JSX RENDERING============
  return (
    <form id='editEntryForm' method='PATCH' aria-describedby='editEntryName' onSubmit={handleEditEntry}>
        <div id='formHeadingBlock'>
        {/* FORM HEADING: EDIT ENTRY + entry.title. The entry being edited is
        named in the heading, so the form cannot be filled in for one entry
        while another is the one open */}
        <span className='formHeadingSpan' id='editEntryName'>
            <h3 id='formHeading'>EDIT ENTRY:</h3>
            <h3 className='formItem'>{storedTitle || NOT_AVAILABLE}</h3>
        </span>
        </div>
        {/* Form Input Message: says once what every field on the form then
        relies on, rather than repeating 'leave blank to keep' under each input */}
        <div id='editEntryInfoBlock'>
            <p className='editInfoMsg'>
            <i><small>Only fill in what you want to change. Anything left blank stays as it is.</small></i>
            </p>
        </div>
        {/* NO ENTRY OPEN MESSAGE, shown on screen because there is no single
        input this can be reported against: with no entry open there is nothing
        for any of the fields below to be written to */}
        {noEntry && (
          <div id='editEntryNoEntryBlock'>
            <p id={noEntryId} className='formErrorMessage' role='alert'>
              <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
              No entry is open for editing. Please choose one from the entries list.
            </p>
          </div>
        )}
        {/* ==FORM INPUT========= */}
        <div id='editEntryInput'>
        {/* GROUP 1 : username(hidden: readonly) + Trip + Title + Body*/}
            <div id='editEntryGroup1'>
            {/* STACK 1 */}
            <Stack gap={3} id='editEntryStack1'>
            {/* USERNAME: read only, and never submitted: the API takes the owner
            from the token and leaves the stored username as it is, so this is
            only here to confirm whose entry is being edited */}
                <div className="p-2 visually-hidden" id='editEntryUsername'>
                    <label className='editEntryLabel' htmlFor='editEntryUsernameInput'>USERNAME:</label>
                    <input
                        className='input'
                        id='editEntryUsernameInput'
                        readOnly
                        //current user username
                        value={entry?.username || currentUser?.username || ''}
                        // ARIA ATTRIBUTES:
                        aria-readonly='true'
                    />
                </div>
                {/* EDIT TRIP */}
                <div className="p-2" id='editEntryTripBlock'>
                    <label className='editEntryLabel' htmlFor='editEntryTrip'>EDIT TRIP:</label>
                    <select
                        className='input'
                        id='editEntryTrip'
                        name='tripId'
                        value={editEntryData.tripId || ''}
                        onChange={handleInputChange}
                        /* Nothing to choose from until the trips have loaded,
                        and nothing to move the entry to when the account holds
                        no trip other than the one it is already filed against */
                        disabled={submitting || noEntry || loadingTrips || noOtherTrips}
                        // ARIA ATTRIBUTES:
                        aria-required='false'
                        aria-busy={loadingTrips}
                        aria-invalid={hasServerError('tripId') ? 'true' : 'false'}
                        aria-describedby={describedBy(
                          tripHelpId,
                          hasServerError('tripId') && serverErrorId
                        )}
                    >
                    {/* MAP ALL TRIPS WITH THE CURRENT TRIP AS PLACEHOLDER.
                    The first option is the trip the entry already has, and
                    carries no value, so leaving the select on it sends no trip
                    with the edit. The value submitted is each trip's id, the
                    label is its title, because the API files the entry by id */}
                        {loadingTrips && <option value=''>LOADING TRIPS...</option>}
                        {!loadingTrips && (
                          <>
                            <option value=''>
                              {storedTrip ? `KEEP: ${storedTrip.toUpperCase()}` : 'SELECT'}
                            </option>
                            {/* The trip the entry is already on is left out: it
                            is what the option above keeps */}
                            {trips
                              .filter((trip) => String(trip._id) !== storedTripId)
                              .map((trip) => (
                                <option key={trip._id} value={trip._id}>{trip.title}</option>
                              ))}
                          </>
                        )}
                    </select>
                    <small id={tripHelpId} className='infoText'>
                        CURRENTLY: {storedTrip || NOT_AVAILABLE}
                        {/* Said here rather than as an error, because keeping
                        the trip the entry is on is a valid way to leave it */}
                        {!loadingTrips && noOtherTrips && ' — NO OTHER TRIP TO MOVE IT TO'}
                    </small>
                </div>
                {/* EDIT TITLE */}
                <div className="p-2" id='editEntryTitleBlock'>
                    <label className='editEntryLabel' htmlFor='editEntryTitle'>EDIT TITLE:</label>
                    {/* The stored title is the placeholder rather than the
                    value, so an untouched input sends nothing at all */}
                    <input
                        type='text'
                        className='input'
                        id='editEntryTitle'
                        placeholder={storedTitle || 'TITLE'}
                        maxLength={TITLE_MAX}
                        name='title'
                        value={editEntryData.title || ''}
                        onChange={handleInputChange}
                        disabled={submitting || noEntry}
                        // ARIA ATTRIBUTES:
                        aria-required='false'
                        aria-invalid={hasServerError('title') ? 'true' : 'false'}
                        aria-describedby={describedBy(
                          titleHelpId,
                          hasServerError('title') && serverErrorId
                        )}
                    />
                    <small id={titleHelpId} className='infoText'>
                        CURRENTLY: {storedTitle || NOT_AVAILABLE}
                    </small>
                </div>
                <div className="p-2" id='editEntryBodyBlock'>
                {/* EDIT ENTRY BODY */}
                    <label className='editEntryLabel' htmlFor='editEntryBody'>EDIT ENTRY BODY:</label>
                    <textarea
                        id='editEntryBody'
                        className='editEntryTextInput'
                        placeholder='Update your entry'
                        maxLength={BODY_MAX}
                        name='body'//Current entry
                        rows={3}
                        value={editEntryData.body || ''}
                        onChange={handleInputChange}
                        disabled={submitting || noEntry}
                        // ARIA ATTRIBUTES:
                        aria-required='false'
                        aria-invalid={hasServerError('body') ? 'true' : 'false'}
                        aria-describedby={describedBy(
                          bodyHelpId,
                          hasServerError('body') && serverErrorId
                        )}
                    />
                    {/* A textarea has no room to hold the stored details as a
                    placeholder, so the entry is dated underneath instead: the
                    body itself is on screen in the details panel this form is
                    opened from */}
                    <small id={bodyHelpId} className='infoText'>
                        {storedBody
                          ? `WRITTEN: ${toLongDate(entry?.date)} — REPLACES THE DETAILS AS THEY STAND`
                          : 'NO DETAILS STORED YET'}
                    </small>
                </div>
    </Stack>
            </div>
            {/* GROUP 2: PHOTOS : ADD LATER */}
            {/* <div id='editEntryGroup2'></div> */}
        </div>
        {/* ==END OF INPUT=========== */}
        {/* FORM LEVEL ERROR, raised by handleEditEntry when submit is blocked */}
        {formError && (
          <div id={formErrorId} className='formErrorBlock' role='alert' aria-live='assertive'>
            <p className='formErrorMessage'>
              <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
              {formError}
            </p>
          </div>
        )}
        {/* SERVER SIDE FIELD ERRORS, returned when the API rejects the edit.
        These are rules the browser cannot check on its own, so they can only be
        reported after a round trip */}
        {serverErrors.length > 0 && (
          <div id={serverErrorId} className='formErrorBlock' role='alert' aria-live='assertive'>
            {serverErrors.map(([field, message]) => (
              <p key={field} className='formErrorMessage'>
                <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
                {message}
              </p>
            ))}
          </div>
        )}
        {/* GROUP3: SUBMIT FORM BUTTON + CLEAR FORM BUTTON */}
        <div id='editEntryGroup3'>
        {/* STACK: SUBMIT FORM BUTTON CLEAR FORM BUTTON */}
            <Stack direction="horizontal" gap={3} id='editEntryBtnStack'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        <Button
            variant='warning'
            type='submit'
            id='editEntryBtn'
            // Disabled while the request runs, so the entry cannot be edited twice
            disabled={submitDisabled}
            // ARIA ATTRIBUTES:
            aria-label={submitting
              ? 'Saving your changes, please wait'
              : `Save your changes to ${storedTitle || 'this entry'}`}
            aria-disabled={submitDisabled}
            aria-busy={submitting}
            aria-describedby={describedBy(
              formError && formErrorId,
              noEntry && noEntryId,
              serverErrors.length > 0 && serverErrorId
            )}
        >
            {submitting ? 'SAVING...' : 'EDIT ENTRY'}
        </Button>
      </div>
      <div className="p-2">
        {/* Clear Form Button: empties the form, which for this one means every
        field left as the entry is stored */}
        <Button
            variant='danger'
            id='clearFormBtn'
            type='button'
            disabled={submitting}// Disabled while the request runs, so a change cannot be cleared mid submit
            onClick={handleClear}
            // ARIA ATTRIBUTES:
            aria-label='Clear edit entry form'
            aria-disabled={submitting}
            >
                CLEAR
            </Button>
      </div>
    </Stack>
        </div>
    </form>
  )
}
