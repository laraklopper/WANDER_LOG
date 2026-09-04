import React, { useMemo, useState } from 'react'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/AddEntryForm.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import { Asterisk, Bug } from 'lucide-react';

/* The maxlength values entrySchema stores, repeated here so each input stops
accepting characters at the point the API would refuse them */
const TITLE_MAX = 150;
const BODY_MAX = 2000;

/* The empty form used by the clear button when the page does not supply one.
Kept in sync with EMPTY_ENTRY in pages/Journal.js, which is passed in as a prop.
The trip is held as tripId rather than a title, because that is what the API
takes: it loads the trip and reads the stored title off it. The owner is left out
on purpose, userId and username come from the token and the database */
const BLANK_ENTRY = {
  tripId: '',
  title: '',
  body: '',
  date: ''
}

export default function AddEntryForm(
    {//PROPS PASSED FROM PARENT COMPONENT(Journal.js)
        currentUser,
        newEntryData = BLANK_ENTRY,
        setNewEntryData,
        addEntry,
        // True while the add entry request is in flight, set by the Journal page
        submitting = false,
        /* Field keyed messages from the server, for rules the browser cannot
        check. Keyed by schema path, so the trip arrives as 'tripId' */
        fieldErrors = {},
        emptyForm = BLANK_ENTRY,
        /* The logged in user's trips, loaded by the Journal page. An entry has to
        be filed against one of them, so the form cannot be submitted until at
        least one trip exists */
        trips = [],
        loadingTrips = false
    }) {
        const [formError, setFormError] = useState(null)// Form level error shown above the submit button
        const [touched, setTouched] = useState({
            tripId: false,// Tracks if the trip select was touched
            title: false, // Tracks if the title field was touched
            body: false,  // Tracks if the details field was touched
            date: false   // Tracks if the date field was touched
        })

        // Marks a single field as touched so its error message may be announced
        const markTouched = (field) =>
            setTouched((prev) => ({ ...prev, [field]: true }));

        // Marks every field as touched, used when the form is submitted
        const markAllTouched = () =>
            setTouched({
                tripId: true,
                title: true,
                body: true,
                date: true
            });

        //========== EMPTY FIELD VALIDATION ====================
        // Checks if no trip was selected
        const tripEmpty = useMemo(
            () => !String(newEntryData.tripId || '').trim(), [newEntryData.tripId]
        )
        // Checks if the entry title is empty
        const titleEmpty = useMemo(
            () => !String(newEntryData.title || '').trim(), [newEntryData.title]
        )
        // Checks if the entry details are empty
        const bodyEmpty = useMemo(
            () => !String(newEntryData.body || '').trim(), [newEntryData.body]
        )
        // Checks if the entry date is empty
        const dateEmpty = useMemo(
            () => !String(newEntryData.date || '').trim(), [newEntryData.date]
        );

        /* An entry belongs to a trip, so there is nothing to file one against
        until the account has at least one. Checked once the trips have finished
        loading, so an empty list mid request is not reported as no trips */
        const noTrips = !loadingTrips && trips.length === 0;

        const showTripError = touched.tripId && tripEmpty;
        const showTitleError = touched.title && titleEmpty;
        const showBodyError = touched.body && bodyEmpty;
        const showDateError = touched.date && dateEmpty;

        /* Blocked while a request is running, while the trips are still loading,
        and when the account has no trip to write about */
        const submitDisabled = submitting || loadingTrips || noTrips;

        /* Only the rules the browser cannot enforce on its own are checked in
        handleAddEntry. Empty, maxLength and type constraints are still handled by
        the native validation on each input, which blocks submit before it runs */
        const handleAddEntry = (event) => {
            event.preventDefault()
            // Ignored while a request is already running, so the form cannot double post
            if (submitting) return
            markAllTouched()

            /* The trips are what the select is built from, so this cannot be
            reported against a single input: with none loaded there is no option
            to choose and nothing for the required attribute to catch */
            if (noTrips) {
                setFormError('Add a trip before writing an entry, an entry has to belong to one.')
                console.warn('[WARN: AddEntryForm.js]: No trips available to file the entry against')
                return
            }
            if (loadingTrips) {
                setFormError('Your trips are still loading, please try again in a moment.')
                console.warn('[WARN: AddEntryForm.js]: Submit attempted while the trips were still loading')
                return
            }

            /* Repeated here rather than left to the browser alone, so a submission
            that reaches this point with a field missing, from native validation
            being bypassed, is reported on screen and the field is focused */
            if (tripEmpty) {
                setFormError('Please select the trip this entry belongs to.')
                console.warn('[WARN: AddEntryForm.js]: No trip selected')
                document.getElementById('newEntryTrip')?.focus()
                return
            }
            if (titleEmpty) {
                setFormError('Please enter a title for the entry.')
                console.warn('[WARN: AddEntryForm.js]: Entry title missing')
                document.getElementById('newEntryTitle')?.focus()
                return
            }
            if (bodyEmpty) {
                setFormError('Please write the details of the entry.')
                console.warn('[WARN: AddEntryForm.js]: Entry details missing')
                document.getElementById('entryTextInput')?.focus()
                return
            }
            if (dateEmpty) {
                setFormError('Please choose the date of the entry.')
                console.warn('[WARN: AddEntryForm.js]: Entry date missing')
                document.getElementById('currentDate')?.focus()
                return
            }

            setFormError(null)
            console.log('[INFO: AddEntryForm.js]: Adding new entry');
            addEntry?.()
        }

        const handleInput = (event) => {
            const {name, value} = event.target;

            setFormError(null)// Any edit clears the form level error
            setNewEntryData((prev) => ({
                ...prev,
                [name]: value
            }))
        }

        const clearForm = () => {
            const confirmClear = window.confirm(// Ask the user to confirm before clearing all input fields
                "Are you sure you want to clear the form?"
            )
            if (!confirmClear) return;
            // Reset to the same empty shape the page initialised the form with
            setNewEntryData(emptyForm)
            setTouched({
                tripId: false,
                title: false,
                body: false,
                date: false
            });
            setFormError(null)
        }

        // ========= IDs USED BY aria-describedby =========
        const tripErrorId = 'addEntryTripError';// ID used for the trip error message
        const titleErrorId = 'addEntryTitleError';// ID used for the title error message
        const bodyErrorId = 'addEntryBodyError';// ID used for the details error message
        const dateErrorId = 'addEntryDateError';// ID used for the date error message
        const noTripsId = 'addEntryNoTrips';// ID used for the no trips message
        const formErrorId = 'addEntryFormError';// ID used for the form level error message
        const serverErrorId = 'addEntryServerErrors';// ID used for the block listing the server's field errors

        // Joins the IDs that are currently rendered into a single aria-describedby value
        const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

        /* The server returns its errors keyed by schema path. Listed as entries
        for rendering, and looked up by path to mark the matching input invalid */
        const serverErrors = Object.entries(fieldErrors || {});
        const hasServerError = (path) => Boolean(fieldErrors?.[path]);

        // =============JSX RENDERING============
  return (
    <form id='addEntryForm' method='POST' aria-labelledby='formTitle' onSubmit={handleAddEntry}>
        <p className='visually-hidden' id='formTitle'>ADD ENTRY FORM</p>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>ADD ENTRY</h3>
        </div>
        {/* =========FORM INPUT======= */}
        <div id='add-entry-input'>
        {/* GROUP 1 */}
            <div id='addEntry-group1'>
            <Stack gap={3} id='addEntry-stack1'>
                <div className="p-2" id='addEntry-div1'>
                    <div className='input-div'>
                        <label className='addEntry-label' htmlFor='newEntryUsername'>USERNAME:</label>
                        {/* Read only, and never submitted: the API takes the
                        owner from the token and reads the username from the
                        account, so this is only here to confirm who the entry
                        is being logged for */}
                        <input
                            className='input'
                            id='newEntryUsername'
                            readOnly
                            value={`${currentUser?.username || 'USERNAME'}`}
                            // ARIA ATTRIBUTES:
                            aria-required='true'
                            aria-readonly='true'
                        />
                        <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                    </div>
                </div>
                <div className="p-2">
                    <div className='input-div'>
                        <label className='addEntry-label' htmlFor='newEntryTrip'>TRIP:</label>
                        <select
                        className='input'
                        id='newEntryTrip'
                        required
                        name='tripId'
                        value={newEntryData.tripId || ''}
                        onChange={handleInput}
                        onBlur={() => markTouched('tripId')}
                        /* Nothing to choose from until the trips have loaded, and
                        nothing at all to choose when the account has none */
                        disabled={submitting || loadingTrips || noTrips}
                        // ARIA ATTRIBUTES:
                        aria-required='true'
                        aria-busy={loadingTrips}
                        aria-invalid={showTripError || hasServerError('tripId') ? 'true' : 'false'}
                        aria-describedby={describedBy(
                          showTripError && tripErrorId,
                          noTrips && noTripsId,
                          hasServerError('tripId') && serverErrorId
                        )}
                        >
                        {/* MAP ALL LOGGED IN USER TRIPS FROM THE DATABASE.
                        The value submitted is the trip's id, the label is its
                        title, because the API files the entry by id */}
                            {loadingTrips && <option value=''>LOADING TRIPS...</option>}
                            {!loadingTrips && noTrips && <option value=''>NO TRIPS YET</option>}
                            {!loadingTrips && !noTrips && (
                              <>
                                <option value=''>SELECT</option>
                                {trips.map((trip) => (
                                  <option key={trip._id} value={trip._id}>{trip.title}</option>
                                ))}
                              </>
                            )}
                        </select>
                        <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        {/* TRIP ERROR MESSAGE */}
                        {showTripError && (
                          <p id={tripErrorId} className='visually-hidden' role='alert'>Trip is required.</p>
                        )}
                    </div>
                    {/* NO TRIPS MESSAGE, shown on screen because the select has
                    nothing to offer and the required attribute cannot report it */}
                    {noTrips && (
                      <p id={noTripsId} className='formErrorMessage' role='alert'>
                        <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                        Add a trip before writing an entry
                      </p>
                    )}
                </div>
      <div className="p-2">
        <label className='addEntry-label' htmlFor='currentDate'>DATE:</label>
        <div className='input-div'>
            <input
            type='date'
            id='currentDate'
                className='input'
                required
                name='date'
                value={newEntryData.date || ''}
                onChange={handleInput}
                onBlur={() => markTouched('date')}
                // ARIA ATTRIBUTES:
                aria-required='true'
                aria-invalid={showDateError || hasServerError('date') ? 'true' : 'false'}
                aria-describedby={describedBy(
                  showDateError && dateErrorId,
                  hasServerError('date') && serverErrorId
                )}
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
        {/* DATE ERROR MESSAGE */}
        {showDateError && (
          <p id={dateErrorId} className='visually-hidden' role='alert'>Entry date is required.</p>
        )}
      </div>
    </Stack>
            </div>
            {/* GROUP 2 */}
            <div id='addEntry-group2'>
                 <Stack gap={3} id='addEntry-stack2'>
                    <div className="p-2" id='entry-block1'>
                        <label className='addEntry-label' htmlFor='newEntryTitle'>TITLE:</label>
                        <div className='input-div'>
                            <input
                                className='input'
                                id='newEntryTitle'
                                type='text'
                                required
                                    maxLength={TITLE_MAX}
                                    placeholder='TITLE'
                                    name='title'
                                    value={newEntryData.title || ''}
                                    onChange={handleInput}
                                    onBlur={() => markTouched('title')}
                                    // ARIA ATTRIBUTES:
                                    aria-required='true'
                                    aria-invalid={showTitleError || hasServerError('title') ? 'true' : 'false'}
                                    aria-describedby={describedBy(
                                      showTitleError && titleErrorId,
                                      hasServerError('title') && serverErrorId
                                    )}
                                />
                                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        </div>
                        {/* TITLE ERROR MESSAGE */}
                        {showTitleError && (
                          <p id={titleErrorId} className='visually-hidden' role='alert'>Entry title is required.</p>
                        )}
                    </div>
                    <div className="p-2" id='entry-block2'>
                        <label className='addEntry-label' htmlFor='entryTextInput'>DETAILS:</label>
                        <div className='input-div'>
                            <textarea
                                id='entryTextInput'
                                placeholder='Enter your entry'
                                required
                                maxLength={BODY_MAX}
                                name='body'
                                value={newEntryData.body || ''}
                                onChange={handleInput}
                                onBlur={() => markTouched('body')}
                                // ARIA ATTRIBUTES:
                                aria-label='Entry Details'
                                aria-required='true'
                                aria-invalid={showBodyError || hasServerError('body') ? 'true' : 'false'}
                                aria-describedby={describedBy(
                                  showBodyError && bodyErrorId,
                                  hasServerError('body') && serverErrorId
                                )}
                            />
                            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        </div>
                        {/* DETAILS ERROR MESSAGE */}
                        {showBodyError && (
                          <p id={bodyErrorId} className='visually-hidden' role='alert'>Entry details are required.</p>
                        )}
                    </div>
                </Stack>
            </div>
            {/* GROUP 3: PHOTO INPUT (add later) */}
            {/* <div id='addEntry-group3'></div> */}
        </div>
        {/* FORM LEVEL ERROR, raised by handleAddEntry when submit is blocked */}
        {formError && (
          <div id={formErrorId} className='formErrorBlock' role='alert' aria-live='assertive'>
            <p className='formErrorMessage'>
              <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
              {formError}
            </p>
          </div>
        )}
        {/* SERVER SIDE FIELD ERRORS, returned when the API rejects the entry.
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
       {/* GROUP 4: REQUIRED INFO MESSAGE + BUTTONS */}
        <div id='addEntry-group4'>
        <Stack direction="horizontal" gap={3} id='addEntry-stack3'>
         {/* REQUIRED INFO MESSAGE*/}
        <div className="p-2" id='requiredInfo'>
            <p className='infoMsg'>
            <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
            </p>
        </div>
      <div className="p-2 ms-auto">
        <Button
        variant='light'
        id='addEntryBtn'
        type='submit'
        // Disabled while the request runs, so the entry cannot be added twice
        disabled={submitDisabled}
        // ARIA ATTRIBUTES:
        aria-label={submitting ? 'Adding entry, please wait' : 'Add entry'}
        aria-disabled={submitDisabled}
        aria-busy={submitting}
        aria-describedby={describedBy(
          formError && formErrorId,
          noTrips && noTripsId,
          serverErrors.length > 0 && serverErrorId
        )}
        >
            {submitting ? 'ADDING ENTRY...' : 'ADD ENTRY'}
        </Button>
      </div>
      <div className="p-2">
        <Button
        variant='danger'
        id='clearFormBtn'
        type='button'
        disabled={submitting}
        onClick={clearForm}
        // ARIA ATTRIBUTES:
        aria-label='Clear add entry form'
        aria-disabled={submitting}
        >CLEAR</Button>
      </div>
    </Stack>

        </div>
    </form>
  )
}
