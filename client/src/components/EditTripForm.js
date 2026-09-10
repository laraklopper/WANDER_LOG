// EditTripForm.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useMemo, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/EditTrip.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import {  Bug, MapPin, Calendars  } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import { toDateInputValue } from '../util/dateFunctions';
import { NOT_AVAILABLE, toLongDate } from '../util/formatCalculations';
import { PURPOSES, DESTINATION_TYPES, STATUSES } from '../data/tripData';


/* The empty form used by the clear button when the page does not supply one.
Kept in sync with EMPTY_TRIP_EDIT*/
const BLANK_EDIT = {
  title: '',
  purpose: '',
  destination: {
    destinationType: '',
    tripLocation: '',
    country: '',
  },
  date: {
    startDate: '',
    endDate: '',
  },
  status: '',
};

//EditTripForm function component
export default function EditTripForm(
    {//PROPS PASSED FROM PARENT COMPONENT(TravelLog.js)
    trip,
    editTripData = BLANK_EDIT,
    setEditTripData,
    editTrip,
    // True while the edit request is in flight, set by the travel log page
    submitting = false,
    /* Field keyed messages from the server, for rules the browser cannot check.
    Keyed by schema path, so a nested field arrives as 'destination.tripLocation' */
    fieldErrors = {},
    emptyForm = BLANK_EDIT
}) {
    // =========STATE VARIABLES=============
    const [dateMsg, setDateMsg] = useState(false)
    const [formError, setFormError] = useState(null)// Form level error shown above the submit button
    /* Only the two fields that can be wrong without being empty are tracked. The
    rest cannot: this form has no required input, so a blank one is a field being
    left as it is rather than a field with something missing from it */
    const [touched, setTouched] = useState({
        country: false,// Tracks if the country field was touched
        endDate: false,// Tracks if the end date field was touched
    })

    // Marks a single field as touched so its error message may be announced
    const markTouched = (field) =>
        setTouched((prev) => ({ ...prev, [field]: true }));

    //========== WHAT THE TRIP CURRENTLY HOLDS ====================
    const storedTitle = trip?.title || '';
    const storedPurpose = trip?.purpose || '';
    const storedType = trip?.destination?.destinationType || '';
    const storedLocation = trip?.destination?.tripLocation || '';
    const storedCountry = trip?.destination?.country || '';
    const storedStatus = trip?.status || '';
    // The dates are stored as Dates and arrive as ISO strings
    const storedStartDate = toDateInputValue(trip?.date?.startDate, '');
    const storedEndDate = toDateInputValue(trip?.date?.endDate, '');

    //========== WHAT THE TRIP WOULD BE LEFT AS ====================
    /* Each field as this edit would leave it: the submitted change where one was
    made, and the stored value where the input was left alone. The same merge the
    API makes of the body and the document, so the two cannot disagree about the
    trip that is being checked */
    const destinationType = editTripData.destination?.destinationType || storedType;

    /* An international trip has to name its country, a domestic one does not, so
    the country input is only rendered, and only asked for, while the trip is
    being left as, or changed to, the former */
    const isInternational = destinationType === 'International';

    const country = useMemo(
        () =>
            String(editTripData.destination?.country || '').trim() ||
            String(storedCountry).trim(),
        [editTripData.destination?.country, storedCountry]
    );
    const startDate = editTripData.date?.startDate || storedStartDate;
    const endDate = editTripData.date?.endDate || storedEndDate;

    //========== CHANGE AND CROSS FIELD VALIDATION ====================
    /* Whether anything was actually filled in. A PATCH with nothing in it is
    answered by the API with 'There is nothing to update', so it is reported here
    instead of being sent. The country only counts while its input is on screen:
    switching the trip to domestic clears the field as well as the type */
    const hasChanges = useMemo(
        () =>
            Boolean(
                String(editTripData.title || '').trim() ||
                editTripData.purpose ||
                editTripData.status ||
                editTripData.destination?.destinationType ||
                String(editTripData.destination?.tripLocation || '').trim() ||
                (isInternational && String(editTripData.destination?.country || '').trim()) ||
                editTripData.date?.startDate ||
                editTripData.date?.endDate
            ),
        [editTripData, isInternational]
    );

    /* The browser cannot compare two inputs, and one of the two dates may not be
    on the form at all, so the order is checked against the merged pair as well
    as by the min attribute on the end date. Compared as the 'YYYY-MM-DD' strings
    a date input reads and writes, which sort the same way the dates themselves
    do */
    const endBeforeStart = useMemo(
        () => Boolean(startDate && endDate && String(endDate) < String(startDate)),
        [startDate, endDate]
    );

    /* A country is only missing when the trip is one that needs it, and is only
    missing when neither this edit nor the trip itself supplies one: a trip
    already stored as international keeps the country it holds */
    const countryMissing = isInternational && !country;

    const showCountryError = touched.country && countryMissing;
    const showEndBeforeStartError = touched.endDate && endBeforeStart;

    //================EVENT HANDLERS========================
    // Function to handle input changes in the form
    const handleInputChange = (event) => {
        const { name, value } = event.target;// Extract the input name and value

        setFormError(null);// Any edit clears the form level error

        // Input change for the destination object
        if (name.startsWith('destination.')) {
            const [, field] = name.split('.');
            setEditTripData((prev) => ({
                ...prev,
                destination: { ...prev.destination, [field]: value },
            }));
            return;
        }
        // Input change for the date object
        if (name.startsWith('date.')) {
            const [, field] = name.split('.');
            setEditTripData((prev) => ({
                ...prev,
                date: { ...prev.date, [field]: value },
            }));
            return;
        }
        // Update the specific field that changed.
        setEditTripData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /* Changing the destination type clears the country as well as setting the
    type. Without this, a country typed while the trip was being made
    international would still be sitting in state after it was switched back to
    domestic, and would be sent with an edit whose input is no longer on screen.
    The API drops the stored country from a domestic trip anyway, so clearing the
    field keeps the form saying what the edit will actually do */
    const handleDestinationTypeChange = (event) => {
        const { value } = event.target;

        setFormError(null);
        setEditTripData((prev) => ({
            ...prev,
            destination: {
                ...prev.destination,
                destinationType: value,
                country: value === 'International' ? prev.destination?.country || '' : '',
            },
        }));
    };

    /* Only the rules the browser cannot enforce on its own are checked here.
    maxLength and type constraints are still handled by the native validation on
    each input, which blocks submit before this runs. There is nothing to check
    for an empty field: this form requires none of them */
    const handleEditTrip = (e) => {
        e.preventDefault()
        // Ignored while a request is already running, so the form cannot double post
        if (submitting) return

        // Conditional rendering to check a trip is open for editing
        if (!trip?._id) {
            setFormError('No trip is open for editing. Please choose one from the list.')
            console.warn('[WARN: EditTripForm.js]: No trip open for editing')
            return
        }
        /* Nothing was filled in, so there is no change to send. Reported here
        rather than by the API, which would answer the empty PATCH with a 400 */
        if (!hasChanges) {
            setFormError('Nothing has been changed yet. Fill in only the fields you want to update.')
            console.warn('[WARN: EditTripForm.js]: Submitted with no changes')
            return
        }

        setTouched({ country: true, endDate: true })

        /* The country input is conditionally rendered, so its required attribute
        is not on the page when the trip is only now being made international */
        if (countryMissing) {
            setFormError('Please enter the country for an international trip.')
            console.warn('[WARN: EditTripForm.js]: Country missing for an international trip')
            document.getElementById('editTripCountry')?.focus()
            return
        }
        if (endBeforeStart) {
            setFormError('The end date cannot be before the start date.')
            console.warn('[WARN: EditTripForm.js]: End date is before the start date')
            document.getElementById('editTripEndDate')?.focus()
            return
        }

        setFormError(null)
        console.log('[INFO: EditTripForm.js]: Editing trip', trip._id);
        editTrip?.()
    }

    // Function to clear trip
    const handleClear = () => {
        const confirmClear = window.confirm(// Ask the user to confirm before clearing all input fields
            "Are you sure you want to clear the form?"
        );
        if (!confirmClear) return;
       
        setEditTripData(emptyForm);//Reset to the same empty shape. every field left as the trip is stored 
        setTouched({ country: false, endDate: false });
        setFormError(null);
    }

    // ========= IDs USED BY aria-describedby =========
    const titleHelpId = 'editTripTitleHelp';// ID used for the stored title hint
    const purposeHelpId = 'editTripPurposeHelp';// ID used for the stored purpose hint
    const statusHelpId = 'editTripStatusHelp';// ID used for the stored status hint
    const destinationTypeHelpId = 'editTripTypeHelp';// ID used for the stored destination type hint
    const locationHelpId = 'editTripLocationHelp';// ID used for the stored location hint
    const countryHelpId = 'editTripCountryHelp';// ID used for the country hint
    const countryErrorId = 'editTripCountryError';// ID used for the country error message
    const startDateHelpId = 'editTripStartDateHelp';// ID used for the stored start date hint
    const endDateHelpId = 'editTripEndDateHelp';// ID used for the stored end date hint
    const endBeforeStartErrorId = 'editTripEndBeforeStartError';// ID used for the date order error message
    const formErrorId = 'editTripFormError';// ID used for the form level error message
    const serverErrorId = 'editTripServerErrors';// ID used for the block listing the server's field errors

    // Joins the IDs that are currently rendered into a single aria-describedby value
    const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

    /* The server returns its errors keyed by schema path, so a nested field
    arrives as 'destination.tripLocation' or 'date.endDate'. Listed as entries for
    rendering, and looked up by path to mark the matching input invalid */
    const serverErrors = Object.entries(fieldErrors || {});
    const hasServerError = (path) => Boolean(fieldErrors?.[path]);

    //==========JSX RENDERING============
  return (
    <form id='editTripForm' method='PATCH' aria-labelledby='formHeading'
    onSubmit={handleEditTrip}
    >
        <div id='formHeadingBlock'>
            {/* The trip being edited is named in the heading, so the form cannot
            be filled in for one trip while another is the one open */}
            <h3 id='formHeading'>EDIT TRIP: {trip?.title || NOT_AVAILABLE}</h3>
        </div>
        {/* Says once what every field on the form then relies on, rather than
        repeating 'leave blank to keep' under each of the eight inputs */}
        <div id='editTripInfoBlock'>
            <p className='editInfoMsg'>
            <i><small>Only fill in what you want to change. Anything left blank stays as it is.</small></i> 
            </p>
        </div>
        {/* =====FORM INPUT============ */}
        <div id='editTripInput'>
        {/* GROUP 1: EDIT TITLE + EDIT PURPOSE + EDIT STATUS */}
            <div id='editTripGroup1'>
            {/* STACK1 */}
                <Stack gap={3} id='editTripStack1'>
                    <div className="p-2" id='editTitleBlock'>
                        <label className='editTrip-label' htmlFor='editTripTitle'>EDIT TITLE:</label>
                        <div className='input-div'>
                        {/* The stored title is the placeholder rather than the
                        value, so an untouched input sends nothing at all */}
                            <input
                                type='text'
                                className='input'
                                id='editTripTitle'
                                placeholder={storedTitle || 'TITLE'}
                                maxLength={100}
                                name='title'
                                value={editTripData.title || ''}
                                onChange={handleInputChange}
                                // ARIA ATTRIBUTES:
                                aria-required='false'
                                aria-invalid={hasServerError('title') ? 'true' : 'false'}
                                aria-describedby={describedBy(
                                  titleHelpId,
                                  hasServerError('title') && serverErrorId
                                )}
                            />
                        </div>
                        <small id={titleHelpId} className='infoText'>
                            CURRENTLY: {storedTitle || NOT_AVAILABLE}
                        </small>
                    </div>
                    <div className="p-2" id='editPurposeBlock'>
                        <label className='editTrip-label' htmlFor='editTripPurpose'>PURPOSE</label>
                        <div className='input-div'>
                        {/* The first option is the purpose the trip already has,
                        and carries no value, so leaving the select on it sends
                        no purpose with the edit */}
                            <select
                            className='input'
                            id='editTripPurpose'
                            name='purpose'
                            value={editTripData.purpose || ''}
                            onChange={handleInputChange}
                            // ARIA ATTRIBUTES:
                            aria-required='false'
                            aria-invalid={hasServerError('purpose') ? 'true' : 'false'}
                            aria-describedby={describedBy(
                              purposeHelpId,
                              hasServerError('purpose') && serverErrorId
                            )}
                            >
                                <option value=''>
                                    {storedPurpose ? `KEEP: ${storedPurpose.toUpperCase()}` : 'SELECT'}
                                </option>
                                {/* The value submitted is the schema's spelling, the label is the one shown */}
                                {PURPOSES.map(({ value, label }) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <small id={purposeHelpId} className='infoText'>
                            CURRENTLY: {storedPurpose || NOT_AVAILABLE}
                        </small>
                    </div>
                    <div className="p-2" id='editStatusBlock'>
                    {/* EDIT STATUS */}
                        <label className='editTrip-label' htmlFor='editTripStatus'>EDIT STATUS:</label>
                        <div className='input-div'>
                            <select
                            className='input'
                            id='editTripStatus'
                            name='status'
                            value={editTripData.status || ''}
                            onChange={handleInputChange}
                            // ARIA ATTRIBUTES:
                            aria-required='false'
                            aria-invalid={hasServerError('status') ? 'true' : 'false'}
                            aria-describedby={describedBy(
                              statusHelpId,
                              hasServerError('status') && serverErrorId
                            )}
                            >
                            <option value=''>
                                {storedStatus ? `KEEP: ${storedStatus.toUpperCase()}` : 'SELECT'}
                            </option>
                            {STATUSES.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                            </select>
                        </div>
                        <small id={statusHelpId} className='infoText'>
                            CURRENTLY: {storedStatus || NOT_AVAILABLE}
                        </small>
                    </div>
                </Stack>
            </div>
            {/* GROUP 2: DESTINATION */}
            <div id='editTripGroup2' aria-labelledby='editTrigroup2Head-span'>
                <div className='editTripGroupHead'>
                <span id='editTrigroup2Head-span'>
                    <h4 className='formSectionHeading'>EDIT DESTINATION</h4>
                    <MapPin style={{margin: '0px', padding: '0px'}} fontWeight={700} size={24} aria-hidden='true' focusable='false'/>
                </span>
            </div>
            {/* STACK 2 : destination : Type, location, country*/}
                <Stack gap={3} id='editTripStack2'>
                    <div className="p-2" id='editTripTypeBlock'>
                        <label className='editTrip-label' htmlFor='editTripDestinationType'>EDIT DESTINATION TYPE:</label>
                        <select
                        className='input'
                        id='editTripDestinationType'
                        name='destination.destinationType'
                        value={editTripData.destination?.destinationType || ''}
                        /* Not handleInputChange: switching the type also has to
                        clear a country typed for the previous selection */
                        onChange={handleDestinationTypeChange}
                        // ARIA ATTRIBUTES:
                        aria-required='false'
                        aria-invalid={hasServerError('destination.destinationType') ? 'true' : 'false'}
                        aria-describedby={describedBy(
                          destinationTypeHelpId,
                          hasServerError('destination.destinationType') && serverErrorId
                        )}
                        >
                            <option value=''>
                                {storedType ? `KEEP: ${storedType.toUpperCase()}` : 'SELECT'}
                            </option>
                            {DESTINATION_TYPES.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <small id={destinationTypeHelpId} className='infoText'>
                            CURRENTLY: {storedType || NOT_AVAILABLE}
                        </small>
                    </div>
                    <div className="p-2" id='editLocationBlock'>
                        <div className='input-div'>
                         <label className='editTrip-label' htmlFor='editTripLocation'>EDIT LOCATION:</label>
                            <input
                                className='input'
                                id='editTripLocation'
                                type='text'
                                placeholder={storedLocation || 'LOCATION'}
                                maxLength={50}
                                name='destination.tripLocation'
                                value={editTripData.destination?.tripLocation || ''}
                                onChange={handleInputChange}
                                // ARIA ATTRIBUTES
                                aria-required='false'
                                aria-invalid={hasServerError('destination.tripLocation') ? 'true' : 'false'}
                                aria-describedby={describedBy(
                                  locationHelpId,
                                  hasServerError('destination.tripLocation') && serverErrorId
                                )}
                            />
                            <small id={locationHelpId} className='infoText'>
                                CURRENTLY: {storedLocation || NOT_AVAILABLE}
                            </small>
                        </div>
                        {/* ONLY DISPLAY IF TYPE IS INTERNATIONAL: read off the
                        type this edit would leave the trip with, so the input
                        appears as soon as the select is switched to
                        international and goes again when it is switched back.
                        A domestic trip stores no country at all */}
                        {isInternational && (
                          <div className='input-div'>
                         <label className='editTrip-label' htmlFor='editTripCountry'>COUNTRY:</label>
                            <input
                                className='input'
                                id='editTripCountry'
                                type='text'
                                /* Only required while the trip is being made
                                international and holds no country to keep:
                                without one there would be nothing to store */
                                required={countryMissing}
                                maxLength={50}
                                placeholder={storedCountry || 'COUNTRY'}
                                name='destination.country'
                                value={editTripData.destination?.country || ''}
                                onChange={handleInputChange}
                                onBlur={() => markTouched('country')}
                                // ARIA ATTRIBUTES:
                                aria-required={countryMissing}
                                aria-invalid={showCountryError || hasServerError('destination.country') ? 'true' : 'false'}
                                aria-describedby={describedBy(
                                  countryHelpId,
                                  showCountryError && countryErrorId,
                                  hasServerError('destination.country') && serverErrorId
                                )}
                            />
                            <small id={countryHelpId} className='infoText'>
                                {storedCountry
                                  ? `CURRENTLY: ${storedCountry}`
                                  : 'REQUIRED FOR AN INTERNATIONAL TRIP'}
                            </small>
                            {/* COUNTRY ERROR MESSAGE */}
                            {showCountryError && (
                              <p id={countryErrorId} className='formErrorMessage' role='alert'>
                                <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                                Country is required for an international trip
                              </p>
                            )}
                        </div>
                        )}
                    </div>
                </Stack>
            </div>
            {/* GROUP 3: START DATE + END DATE */}
              <div id='editTripGroup3'>
              <div className='editTripGroupHead'>
              <span id='editTripGroup3Head-span'>
                    <h4 className='formSectionHeading'>DATE</h4>
                <Calendars style={{margin: '0px', padding: '0px'}} fontWeight={700} size={24} aria-hidden='true' focusable='false'/>
              </span>
              </div>
              {/* STACK 3 */}
                 <Stack direction="horizontal" gap={3} id='editTripStack3'>
      <div className="p-2" id='editTripDateBlock'>
        <div className='date-input'>
        {/* START DATE */}
            <div className='input-div'>
                <label className='editTrip-label' htmlFor='editTripStartDate'>EDIT START DATE:</label>
                <input
                className='input'
                id='editTripStartDate'
                name='date.startDate'
                value={editTripData.date?.startDate || ''}
                type='date'
                onFocus={() => setDateMsg(true)}
                onBlur={() => setDateMsg(false)}
                onChange={handleInputChange}
                // ARIA ATTRIBUTES:
                aria-required='false'
                aria-invalid={hasServerError('date.startDate') ? 'true' : 'false'}
                aria-describedby={describedBy(
                  startDateHelpId,
                  hasServerError('date.startDate') && serverErrorId
                )}
                />
                {/* A date input has no placeholder to put the stored date in, so
                it is written out underneath instead, in the long form the trip
                list and the details panel show it in */}
                <small id={startDateHelpId} className='infoText'>
                    CURRENTLY: {toLongDate(trip?.date?.startDate)}
                </small>
            </div>
            {/* END DATE */}
            <div className='input-div'>
                <label className='editTrip-label' htmlFor='editTripEndDate'>EDIT END DATE:</label>
                <input
                    className='input'
                    id='editTripEndDate'
                    name='date.endDate'
                    value={editTripData.date?.endDate || ''}
                    type='date'
                    /* Stops the picker offering a date before the trip starts,
                    whether that is the start date this edit is setting or the
                    one the trip is already stored with */
                    min={startDate || undefined}
                    onFocus={() => setDateMsg(true)}
                    onBlur={() => {
                      setDateMsg(false)
                      markTouched('endDate')
                    }}
                    onChange={handleInputChange}
                    //ARIA ATTRIBUTES:
                    aria-required='false'
                    aria-invalid={showEndBeforeStartError || hasServerError('date.endDate') ? 'true' : 'false'}
                    aria-describedby={describedBy(
                      endDateHelpId,
                      showEndBeforeStartError && endBeforeStartErrorId,
                      hasServerError('date.endDate') && serverErrorId
                    )}
                />
                <small id={endDateHelpId} className='infoText'>
                    CURRENTLY: {toLongDate(trip?.date?.endDate)}
                </small>
            </div>
        </div>
      </div>
      <div className="p-2"/>
      <div className="p-2  ms-auto">
        {/* DATE MESSAGE */}
        {dateMsg && (
            <span aria-live='polite'>
                <p className='dateinfoText'>End date must be on or after the start date</p>
            </span>
        )}
        {/* DATE ORDER ERROR MESSAGE: the browser cannot compare two inputs, and
        only one of the two may have been changed, so this is shown on screen as
        well as enforced by the min attribute above */}
        {showEndBeforeStartError && (
          <p id={endBeforeStartErrorId} className='formErrorMessage' role='alert'>
            <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
            End date must be on or after the start date
          </p>
        )}
      </div>
    </Stack>
        </div>
        {/* PHOTO INPUT (ADD LATER) */}
        {/* <div id='editTripGroup4'></div> */}
        </div>
        {/* END OF FORM INPUT */}
        {/* FORM LEVEL ERROR, raised by handleEditTrip when submit is blocked */}
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
        {/* GROUP 4 */}
        <div id='editTripGroup5'>
        {/* STACK 4 */}
            <Stack direction="horizontal" gap={3} id='editTripBtnStack'>
                <div className="p-2"></div>
                <div className="p-2 ms-auto">
                {/* Submit Form Button */}
                    <Button
                        variant='warning'
                        id='editTripBtn'
                        type='submit'
                        disabled={submitting}// Disabled while the request runs, so the trip cannot be edited twice
                        // ARIA ATTRIBUTES:
                        aria-label={submitting ? 'Saving your changes, please wait' : `Save your changes to ${trip?.title || 'this trip'}`}
                        aria-disabled={submitting}
                        aria-busy={submitting}
                        aria-describedby={describedBy(
                          formError && formErrorId,
                          serverErrors.length > 0 && serverErrorId
                        )}
                        >{submitting ? 'SAVING...' : 'EDIT TRIP'}</Button>
                </div>
                <div className="p-2">
                {/* Clear Form Button: empties the form, which for this one means
                every field left as the trip is stored */}
                    <Button
                        variant='danger'
                        id='clearFormBtn'
                        type='button'
                        disabled={submitting}// Disabled while the request runs, so a change cannot be cleared mid submit
                        onClick={handleClear}
                        // ARIA ATTRIBUTES
                        aria-label='Clear edit trip form'
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
