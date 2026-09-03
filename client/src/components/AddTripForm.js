import React, { useMemo, useState } from 'react'
import '../css/componentCss/AddTripForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk, Bug, MapPin, Calendars  } from 'lucide-react';

/* The option values the API accepts, spelled the way tripSchema's enums store
them. The labels are shown in upper case to match the rest of the form, while
the value that is submitted stays in the schema's own casing */
const PURPOSES = [
  { value: 'Holiday', label: 'HOLIDAY' },
  { value: 'Business', label: 'BUSINESS' },
];
const DESTINATION_TYPES = [
  { value: 'Domestic', label: 'DOMESTIC' },
  { value: 'International', label: 'INTERNATIONAL' },
];
const STATUSES = [
  { value: 'upcoming', label: 'UPCOMING' },
  { value: 'ongoing', label: 'ONGOING' },
  { value: 'completed', label: 'COMPLETED' },
];

/* The empty form used by the clear button when the page does not supply one.
Kept in sync with EMPTY_TRIP in pages/Journal.js, which is passed in as a prop.
The two nested objects mirror the shape tripSchema stores, so the submitted body
does not have to be reassembled before it is sent */
const BLANK_TRIP = {
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

export default function AddTripForm({
  currentUser,
  newTripData = BLANK_TRIP,
  setNewTripData,
  addTrip,
  // True while the add trip request is in flight, set by the Journal page
  submitting = false,
  /* Field keyed messages from the server, for rules the browser cannot check.
  Keyed by schema path, so a nested field arrives as 'destination.tripLocation' */
  fieldErrors = {},
  emptyForm = BLANK_TRIP
}) {
  const [formError, setFormError] = useState(null)// Form level error shown above the submit button
  const [touched, setTouched] = useState({
    title: false,          // Tracks if the title field was touched
    purpose: false,        // Tracks if the purpose select was touched
    destinationType: false,// Tracks if the destination type select was touched
    tripLocation: false,   // Tracks if the location field was touched
    country: false,        // Tracks if the country field was touched
    status: false,         // Tracks if the status select was touched
    startDate: false,      // Tracks if the start date field was touched
    endDate: false,        // Tracks if the end date field was touched
  })

  // Marks a single field as touched so its error message may be announced
  const markTouched = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Marks every field as touched, used when the form is submitted
  const markAllTouched = () =>
    setTouched({
      title: true,
      purpose: true,
      destinationType: true,
      tripLocation: true,
      country: true,
      status: true,
      startDate: true,
      endDate: true,
    });

  /* An international trip has to name its country, a domestic one does not, so
  the country input is only rendered, and only required, for the former */
  const isInternational = newTripData.destination?.destinationType === 'International';

  //========== EMPTY FIELD VALIDATION ====================
  // Checks if the trip title is empty
  const titleEmpty = useMemo(
    () => !String(newTripData.title || '').trim(), [newTripData.title]
  );
  // Checks if no travel purpose was selected
  const purposeEmpty = useMemo(
    () => !String(newTripData.purpose || '').trim(), [newTripData.purpose]
  );
  // Checks if no destination type was selected
  const destinationTypeEmpty = useMemo(
    () => !String(newTripData.destination?.destinationType || '').trim(),
    [newTripData.destination?.destinationType]
  );
  // Checks if the destination location is empty
  const tripLocationEmpty = useMemo(
    () => !String(newTripData.destination?.tripLocation || '').trim(),
    [newTripData.destination?.tripLocation]
  );
  // Checks if the country is empty, which only matters for an international trip
  const countryEmpty = useMemo(
    () => !String(newTripData.destination?.country || '').trim(),
    [newTripData.destination?.country]
  );
  // Checks if no trip status was selected
  const statusEmpty = useMemo(
    () => !String(newTripData.status || '').trim(), [newTripData.status]
  );
  // Checks if the start date is empty
  const startDateEmpty = useMemo(
    () => !String(newTripData.date?.startDate || '').trim(), [newTripData.date?.startDate]
  );
  // Checks if the end date is empty
  const endDateEmpty = useMemo(
    () => !String(newTripData.date?.endDate || '').trim(), [newTripData.date?.endDate]
  );

  //========== CROSS FIELD VALIDATION ====================
  /* The browser cannot compare two inputs, so the order of the dates is checked
  here as well as by the min attribute on the end date. Compared as ISO strings
  from a date input, which sort the same way the dates themselves do */
  const endBeforeStart = useMemo(
    () =>
      !startDateEmpty &&
      !endDateEmpty &&
      String(newTripData.date.endDate) < String(newTripData.date.startDate),
    [startDateEmpty, endDateEmpty, newTripData.date?.startDate, newTripData.date?.endDate]
  );
  // A country is only missing when the trip is one that needs it
  const countryMissing = useMemo(
    () => isInternational && countryEmpty, [isInternational, countryEmpty]
  );

  const showTitleError = touched.title && titleEmpty;
  const showPurposeError = touched.purpose && purposeEmpty;
  const showDestinationTypeError = touched.destinationType && destinationTypeEmpty;
  const showTripLocationError = touched.tripLocation && tripLocationEmpty;
  const showCountryError = touched.country && countryMissing;
  const showStatusError = touched.status && statusEmpty;
  const showStartDateError = touched.startDate && startDateEmpty;
  const showEndDateError = touched.endDate && endDateEmpty;
  const showEndBeforeStartError = touched.endDate && endBeforeStart;

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormError(null);// Any edit clears the form level error

    /* The two nested objects are written by prefix rather than by a flat key, so
    an input named 'destination.tripLocation' updates that field and leaves the
    rest of the destination alone */
    if (name.startsWith('destination.')) {
      const [, field] = name.split('.');
      setNewTripData((prev) => ({
        ...prev,
        destination: { ...prev.destination, [field]: value },
      }));
      return;
    }
    if (name.startsWith('date.')) {
      const [, field] = name.split('.');
      setNewTripData((prev) => ({
        ...prev,
        date: { ...prev.date, [field]: value },
      }));
      return;
    }
    setNewTripData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* Changing the destination type clears the country as well as setting the
  type. Without this, a country typed for an international trip would still be
  sitting in state after the trip is switched to domestic, and would be sent
  with it even though the input is no longer on screen */
  const handleDestinationTypeChange = (event) => {
    const { value } = event.target;

    setFormError(null);
    setNewTripData((prev) => ({
      ...prev,
      destination: {
        ...prev.destination,
        destinationType: value,
        country: value === 'International' ? prev.destination?.country || '' : '',
      },
    }));
  };

  /* Only the rules the browser cannot enforce on its own are checked here.
  Empty, maxLength and type constraints are still handled by the native
  validation on each input, which blocks submit before this runs. */
  const handleAddTrip = (e) => {
    e.preventDefault()
    // Ignored while a request is already running, so the form cannot double post
    if (submitting) return
    markAllTouched()

    /* The country input is conditionally rendered, so its required attribute is
    not on the page when the field is missing from an earlier switch of type */
    if (countryMissing) {
      setFormError('Please enter the country for an international trip.')
      console.warn('[WARN: AddTripForm.js]: Country missing for an international trip')
      document.getElementById('newTripCountry')?.focus()
      return
    }
    if (endBeforeStart) {
      setFormError('The end date cannot be before the start date.')
      console.warn('[WARN: AddTripForm.js]: End date is before the start date')
      document.getElementById('newTripEndDate')?.focus()
      return
    }

    setFormError(null)
    console.log('[INFO: AddTripForm.js]: Adding new trip');
    addTrip?.()
  }

  const handleClear = () => {
    const confirmClear = window.confirm(// Ask the user to confirm before clearing all input fields
      "Are you sure you want to clear the form?"
    );
    if (!confirmClear) return;
    // Reset to the same empty shape the page initialised the form with
    setNewTripData(emptyForm);
    setTouched({
      title: false,
      purpose: false,
      destinationType: false,
      tripLocation: false,
      country: false,
      status: false,
      startDate: false,
      endDate: false,
    });
    setFormError(null);
  }

  // ========= IDs USED BY aria-describedby =========
  const titleErrorId = 'addTripTitleError';// ID used for the title error message
  const purposeErrorId = 'addTripPurposeError';// ID used for the purpose error message
  const destinationTypeErrorId = 'addTripDestinationTypeError';// ID used for the destination type error message
  const tripLocationErrorId = 'addTripLocationError';// ID used for the location error message
  const countryErrorId = 'addTripCountryError';// ID used for the country error message
  const countryHelpId = 'addTripCountryHelp';// ID used for the country hint
  const statusErrorId = 'addTripStatusError';// ID used for the status error message
  const startDateErrorId = 'addTripStartDateError';// ID used for the start date error message
  const endDateErrorId = 'addTripEndDateError';// ID used for the end date error message
  const endBeforeStartErrorId = 'addTripEndBeforeStartError';// ID used for the date order error message
  const formErrorId = 'addTripFormError';// ID used for the form level error message
  const serverErrorId = 'addTripServerErrors';// ID used for the block listing the server's field errors

  // Joins the IDs that are currently rendered into a single aria-describedby value
  const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

  /* The server returns its errors keyed by schema path, so a nested field
  arrives as 'destination.tripLocation' or 'date.endDate'. Listed as entries for
  rendering, and looked up by path to mark the matching input invalid */
  const serverErrors = Object.entries(fieldErrors || {});
  const hasServerError = (path) => Boolean(fieldErrors?.[path]);

  return (
    <form id='addTripForm' method='POST' onSubmit={handleAddTrip} aria-labelledby='formHeading'>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>ADD TRIP</h3>
        </div>
        {/* INPUT */}
        <div id='addtrip-input-details'>
        {/* GROUP 1: USERNAME + TITLE + PURPOSE */}
            <div id='addTrip-group1'>
                <Stack gap={3} id='addTrip-stack1'>
                    <div className="p-2" id='add-trip-block1'>
                        <label className='add-trip-label' htmlFor='new-trip-username'>USERNAME:</label>
                        <div className='input-div'>
                            {/* Read only, and never submitted: the API takes the
                            owner from the token and reads the username from the
                            account, so this is only here to confirm who the trip
                            is being logged for */}
                            <input
                                className='input'
                                id='new-trip-username'
                                readOnly
                                value={`${currentUser?.username || 'USERNAME'}`}
                                // ARIA ATTRIBUTES:
                                aria-required='true'
                                aria-readonly='true'
                            />
                            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        </div>
                    </div>
                    <div className="p-2" id='add-trip-block2'>
                    <div className='trip-input-group'>
                        <div className='trip-input-div'>
                            <label className='add-trip-label' htmlFor='newTripTitle'>TITLE:</label>
                            <input
                                className='input'
                                id='newTripTitle'
                                type='text'
                                placeholder='TITLE'
                                required
                                maxLength={100}
                                name='title'
                                value={newTripData.title || ''}
                                onChange={handleInputChange}
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
                            {/* TITLE ERROR MESSAGE */}
                            {showTitleError && (
                              <p id={titleErrorId} className='visually-hidden' role='alert'>Trip title is required.</p>
                            )}
                        </div>
                        <div className='trip-input-div'>
                            <label className='add-trip-label' htmlFor='newTripPurpose'>PURPOSE:</label>
                            <select
                            className='input'
                            id='newTripPurpose'
                            required
                            name='purpose'
                            value={newTripData.purpose || ''}
                            onChange={handleInputChange}
                            onBlur={() => markTouched('purpose')}
                            // ARIA ATTRIBUTES:
                            aria-required='true'
                            aria-invalid={showPurposeError || hasServerError('purpose') ? 'true' : 'false'}
                            aria-describedby={describedBy(
                              showPurposeError && purposeErrorId,
                              hasServerError('purpose') && serverErrorId
                            )}
                            >
                                <option value=''>SELECT</option>
                                {/* The value submitted is the schema's spelling, the label is the one shown */}
                                {PURPOSES.map(({ value, label }) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                            {/* PURPOSE ERROR MESSAGE */}
                            {showPurposeError && (
                              <p id={purposeErrorId} className='visually-hidden' role='alert'>Travel purpose is required.</p>
                            )}
                        </div>
                        </div>
                    </div>
                 </Stack>
            </div>
            {/* GROUP 2: DESTINATION */}
            <div id='addTrip-group2'>
            <div className='addTripGroupHead'>
                <span id='addTrip-group2Head-span'>
<h4 className='formSectionHeading'>DESTINATION</h4>
<MapPin style={{margin: '0px', padding: '0px'}} fontWeight={700} size={24} aria-hidden='true' focusable='false'/>
                </span>
            </div>
            {/* STACK 2 */}
                 <Stack direction="horizontal" gap={3} id='addTrip-stack2'>
      <div className="p-2" id='destination-type-block'>
        <label className='add-trip-label' htmlFor='newTripDestinationType'>TYPE:</label>
        <div className='trip-input-div'>
            <select
            className='input'
            id='newTripDestinationType'
            required
            name='destination.destinationType'
            value={newTripData.destination?.destinationType || ''}
            /* Not handleInputChange: switching the type also has to clear a
            country left behind by the previous selection */
            onChange={handleDestinationTypeChange}
            onBlur={() => markTouched('destinationType')}
            // ARIA ATTRIBUTES:
            aria-required='true'
            aria-invalid={showDestinationTypeError || hasServerError('destination.destinationType') ? 'true' : 'false'}
            aria-describedby={describedBy(
              showDestinationTypeError && destinationTypeErrorId,
              hasServerError('destination.destinationType') && serverErrorId
            )}
            >
                <option value=''>SELECT</option>
                {DESTINATION_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
            </select>
                            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>

        </div>
      </div>
      <div className="p-2">
        {/* DESTINATION TYPE ERROR MESSAGE */}
        {showDestinationTypeError && (
          <p id={destinationTypeErrorId} className='visually-hidden' role='alert'>Destination type is required.</p>
        )}
      </div>
      <div className="p-2"></div>
    </Stack>
    {/* STACK 3 */}
 <Stack direction="horizontal" gap={3} id='addTrip-stack3'>
      <div className="p-2" id='addTrip-location-block'>
        <label className='add-trip-label' htmlFor='newTripLocation'>LOCATION:</label>
        <div className='trip-input-div'>
            <input
                type='text'
                className='input'
                placeholder='LOCATION'
                id='newTripLocation'
                required
                maxLength={50}
                name='destination.tripLocation'
                value={newTripData.destination?.tripLocation || ''}
                onChange={handleInputChange}
                onBlur={() => markTouched('tripLocation')}
                // ARIA ATTRIBUTES
                aria-required='true'
                aria-invalid={showTripLocationError || hasServerError('destination.tripLocation') ? 'true' : 'false'}
                aria-describedby={describedBy(
                  showTripLocationError && tripLocationErrorId,
                  hasServerError('destination.tripLocation') && serverErrorId
                )}
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
        {/* LOCATION ERROR MESSAGE */}
        {showTripLocationError && (
          <p id={tripLocationErrorId} className='visually-hidden' role='alert'>Destination is required.</p>
        )}
      </div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2">
      {/* ONLY DISPLAY IF DESTINATION TYPE IS INTERNATIONAL */}
        {isInternational && (
        <div id='tripCountryInput-div'>
            <label className='add-trip-label' htmlFor='newTripCountry'>COUNTRY:</label>
            <div className='trip-input-div'>
                <input
                    className='input'
                    id='newTripCountry'
                    type='text'
                    placeholder='COUNTRY'
                    /* Required only while this input is on screen. A domestic
                    trip stores no country at all */
                    required
                    maxLength={50}
                    name='destination.country'
                    value={newTripData.destination?.country || ''}
                    onChange={handleInputChange}
                    onBlur={() => markTouched('country')}
                    // ARIA ATTRIBUTES:
                    aria-required='true'
                    aria-invalid={showCountryError || hasServerError('destination.country') ? 'true' : 'false'}
                    aria-describedby={describedBy(
                      countryHelpId,
                      showCountryError && countryErrorId,
                      hasServerError('destination.country') && serverErrorId
                    )}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            </div>
            <small id={countryHelpId} className='visually-hidden'>Required for an international trip</small>
            {/* COUNTRY ERROR MESSAGE */}
            {showCountryError && (
              <p id={countryErrorId} className='visually-hidden' role='alert'>Country is required for an international trip.</p>
            )}
        </div>
        )}
      </div>
    </Stack>
            </div>
            {/* GROUP 3: DATE */}
            <div id='addTrip-group3'>
                <div className='addTripGroupHead'>
                    <span id='addTrip-group3Head-span'>
                        <h4 className='formSectionHeading'>DATE</h4>
                        <Calendars style={{margin: '0px', padding: '0px'}} fontWeight={700} size={24} aria-hidden='true' focusable='false'/>
                    </span>

                </div>
                {/* STACK 4 */}
                <Stack gap={3} id='addTrip-stack4'>
      <div className="p-2" id='addTrip-status-block'>
        <label className='add-trip-label' htmlFor='newTripStatus'>STATUS:</label>
        <div className='input-div'>
            <select
            className='input'
            id='newTripStatus'
            required
            name='status'
            value={newTripData.status || ''}
            onChange={handleInputChange}
            onBlur={() => markTouched('status')}
            // ARIA ATTRIBUTES:
            aria-required='true'
            aria-invalid={showStatusError || hasServerError('status') ? 'true' : 'false'}
            aria-describedby={describedBy(
              showStatusError && statusErrorId,
              hasServerError('status') && serverErrorId
            )}
            >
                <option value=''>SELECT:</option>
                {STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
        {/* STATUS ERROR MESSAGE */}
        {showStatusError && (
          <p id={statusErrorId} className='visually-hidden' role='alert'>Trip status is required.</p>
        )}
      </div>
      <div className="p-2">
        <div className='trip-input-group'>
            <div className='trip-input-div'>
                <label className='add-trip-label' htmlFor='newTripStartDate'>START DATE:</label>
                 <input
                    type='date'
                    className='input'
                    required
                    id='newTripStartDate'
                    name='date.startDate'
                    value={newTripData.date?.startDate || ''}
                    onChange={handleInputChange}
                    onBlur={() => markTouched('startDate')}
                    // ARIA ATTRIBUTES:
                    aria-required='true'
                    aria-invalid={showStartDateError || hasServerError('date.startDate') ? 'true' : 'false'}
                    aria-describedby={describedBy(
                      showStartDateError && startDateErrorId,
                      hasServerError('date.startDate') && serverErrorId
                    )}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                {/* START DATE ERROR MESSAGE */}
                {showStartDateError && (
                  <p id={startDateErrorId} className='visually-hidden' role='alert'>Start date is required.</p>
                )}
            </div>
            <div className='trip-input-div'>
                <label className='add-trip-label' htmlFor='newTripEndDate'>END DATE:</label>
                <input
                    type='date'
                    className='input'
                    required
                    id='newTripEndDate'
                    /* Stops the picker offering a date before the trip starts.
                    Only set once a start date is chosen, otherwise the attribute
                    would rule out every date */
                    min={newTripData.date?.startDate || undefined}
                    name='date.endDate'
                    value={newTripData.date?.endDate || ''}
                    onChange={handleInputChange}
                    onBlur={() => markTouched('endDate')}
                    // ARIA ATTRIBUTES:
                    aria-required='true'
                    aria-invalid={showEndDateError || showEndBeforeStartError || hasServerError('date.endDate') ? 'true' : 'false'}
                    aria-describedby={describedBy(
                      showEndDateError && endDateErrorId,
                      showEndBeforeStartError && endBeforeStartErrorId,
                      hasServerError('date.endDate') && serverErrorId
                    )}
                />
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                {/* END DATE ERROR MESSAGE */}
                {showEndDateError && (
                  <p id={endDateErrorId} className='visually-hidden' role='alert'>End date is required.</p>
                )}
            </div>
        </div>
        {/* The browser cannot compare two inputs, so this error is shown on screen too */}
        {showEndBeforeStartError && (
          <p id={endBeforeStartErrorId} className='formErrorMessage' role='alert'>
            <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
            End date must be on or after the start date
          </p>
        )}
      </div>
    </Stack>
            </div>
        </div>
        {/* FORM LEVEL ERROR, raised by handleAddTrip when submit is blocked */}
        {formError && (
          <div id={formErrorId} className='formErrorBlock' role='alert' aria-live='assertive'>
            <p className='formErrorMessage'>
              <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
              {formError}
            </p>
          </div>
        )}
        {/* SERVER SIDE FIELD ERRORS, returned when the API rejects the trip.
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
        <div id='addTrip-group4'>
        <Stack direction="horizontal" gap={3} id='addTrip-stack5'>
         {/* REQUIRED INFO MESSAGE*/}
        <div className="p-2" id='requiredInfo'>
            <p className='infoMsg'>
            <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
            </p>
        </div>
      <div className="p-2 ms-auto">
        <Button
        variant='light'
        id='addTripBtn'
        type='submit'
        // Disabled while the request runs, so the trip cannot be added twice
        disabled={submitting}
        // ARIA ATTRIBUTES:
        aria-label={submitting ? 'Adding trip, please wait' : 'Add trip'}
        aria-disabled={submitting}
        aria-busy={submitting}
        aria-describedby={describedBy(
          formError && formErrorId,
          serverErrors.length > 0 && serverErrorId
        )}
        >
            {submitting ? 'ADDING TRIP...' : 'ADD TRIP'}
        </Button>
      </div>
      <div className="p-2">
        <Button
        variant='danger'
        id='clearFormBtn'
        type='button'
        disabled={submitting}
        onClick={handleClear}
        // ARIA ATTRIBUTES:
        aria-label='Clear add trip form'
        aria-disabled={submitting}
        >CLEAR</Button>
      </div>
    </Stack>

        </div>
    </form>
  )
}
