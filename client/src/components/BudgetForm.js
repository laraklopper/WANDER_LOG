// BudgetForm.js
/* The budget form, rendered by pages/Expenses.js behind its #add-budget-panal
toggle. Against section 6 of Documents/SCHEMAS.md and section 9 of
Documents/FORMS.md.

One budget per trip, so the same form does both jobs: mode is 'create' for a trip
that has none and 'edit' for one that has. The only field that behaves
differently is tripId, which is disabled in edit mode because a budget cannot be
moved to another trip — the route refuses it as well as the select.

Follows AddExpenseForm.js and AddTripForm.js: the page owns the form state and
the request, this component owns the validation, the touched state and the
messages. The page posts to POST /budget/addBudget or PATCH
/budget/editBudget/:id depending on the mode, which is why one saveBudget prop
covers both. */
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useMemo, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/BudgetForm.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS
import { Asterisk, Bug } from 'lucide-react';
// IMPORT SHARED DATA AND UTILITY FUNCTIONS
import { EXPENSE_CATEGORIES } from '../data/financeData';
import { FALLBACK_CURRENCIES, currencyOptionLabel } from '../util/currencyFunc';

/* The empty form used by the clear button when the page does not supply one.
Kept in sync with EMPTY_BUDGET in pages/Expenses.js, which is passed in as a
prop. The two fields the schema defaults are pre-filled with those defaults
rather than left blank, so an untouched form submits what the schema would have
stored anyway.

The ten category limits open blank, which is what 'no cap' means, and so does the
daily budget: left blank, the schema's pre('save') hook divides the total by the
length of the trip. Neither the owner nor the totals are here — userId comes from
the token, and totalSpent, remaining and percentUsed are virtuals worked out from
the expenses rather than typed. */
const BLANK_BUDGET = {
  tripId: '',
  baseCurrency: 'ZAR',
  totalBudget: '',
  dailyBudget: '',
  categoryLimits: EXPENSE_CATEGORIES.reduce((limits, { key }) => ({ ...limits, [key]: '' }), {}),
  alerts: { notifyAt80Percent: true, notifyOnExceed: true },
};

/* An optional amount is usable when it was left blank, and otherwise has to be a
number that is not negative. Used for the daily budget and for each of the ten
category limits, all of which are min 0 on the schema and may simply be absent */
const optionalAmountInvalid = (value) => {
  const amount = String(value ?? '').trim();

  if (!amount) return false;

  return Number.isNaN(Number(amount)) || Number(amount) < 0;
};

// ======MAIN BUDGETFORM.js COMPONENT====================
export default function BudgetForm({
  mode = 'create',// 'create' for a trip with no budget, 'edit' for one that already has one
  /* The user's trips, for the tripId select. In create mode the page passes
  only the trips that do not already have a budget */
  trips = [],
  loadingTrips = false,// True while the page's fetchTrips request is in flight
  /* Offered until GET /api/currencies answers, and kept if it never does. Same
  list the currency converter uses */
  currencyOptions = FALLBACK_CURRENCIES,
  budget = null,// The saved budget in edit mode, so the form opens filled in. null on create
  /* The form's own values, owned by the page so the request can read them. The
  nested categoryLimits and alerts are held as objects, keyed the way the schema
  keys them, so one change handler covers every input */
  budgetData = BLANK_BUDGET,
  setBudgetData,
  /* Sends the form. The page decides between the create and the edit request
  from the same mode this component renders against */
  saveBudget,
  emptyForm = BLANK_BUDGET,
  submitting = false,// True while the request is in flight, set by the page
  formError = null,// Form level error, raised by the submit handler once it exists
  fieldErrors = {},// Field keyed messages from the server, keyed by schema path
}) {
  const isEdit = mode === 'edit';

  /* Every expense is converted into the budget's base currency as it is added,
  and totalSpent sums those stored figures, so PATCH /budget/editBudget/:id
  refuses a change once there are any. The select is disabled here for the same
  reason, so the rule is visible before a round trip rather than after one.

  Read off the saved budget, so a list that returns one without its expenses
  leaves the select enabled and the refusal is reported as the server's 409
  against baseCurrency instead */
  const currencyLocked = isEdit && Boolean(budget?.expenses?.length);

  // Form level error shown above the submit button, raised by handleSaveBudget
  const [localError, setLocalError] = useState(null)
  const [touched, setTouched] = useState({
    tripId: false,       // Tracks if the trip select was touched
    baseCurrency: false, // Tracks if the base currency select was touched
    totalBudget: false,  // Tracks if the total budget field was touched
    dailyBudget: false,  // Tracks if the daily budget field was touched
  })

  // Marks a single field as touched so its error message may be announced
  const markTouched = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Marks every field as touched, used when the form is submitted
  const markAllTouched = () =>
    setTouched({
      tripId: true,
      baseCurrency: true,
      totalBudget: true,
      dailyBudget: true,
    });

  //========== EMPTY FIELD VALIDATION ====================
  /* Checks if no trip was selected. Not reported in edit mode: the select is
  disabled there, and the trip is whichever one the saved budget belongs to */
  const tripEmpty = useMemo(
    () => !isEdit && !String(budgetData.tripId || '').trim(), [isEdit, budgetData.tripId]
  );
  // Checks if no base currency was selected
  const baseCurrencyEmpty = useMemo(
    () => !String(budgetData.baseCurrency || '').trim(), [budgetData.baseCurrency]
  );
  // Checks if the total budget is empty
  const totalBudgetEmpty = useMemo(
    () => !String(budgetData.totalBudget ?? '').trim(), [budgetData.totalBudget]
  );

  //========== VALUE VALIDATION ====================
  /* The total is min 0 on the schema, so a negative one is refused. The number
  input's own min holds the spinner, but a typed value still reaches state */
  const totalBudgetInvalid = useMemo(() => {
    if (totalBudgetEmpty) return false;
    const total = Number(budgetData.totalBudget);
    return Number.isNaN(total) || total < 0;
  }, [totalBudgetEmpty, budgetData.totalBudget]);

  /* Optional, so only checked once something has been typed into it. Left blank
  the schema works it out from the total and the length of the trip */
  const dailyBudgetInvalid = useMemo(
    () => optionalAmountInvalid(budgetData.dailyBudget), [budgetData.dailyBudget]
  );

  /* The keys of the category limits that were filled in with something that is
  not a usable amount. Held as a list rather than a flag, so each one can be
  reported against its own input and named in the form level message */
  const invalidLimits = useMemo(
    () => EXPENSE_CATEGORIES
      .filter(({ key }) => optionalAmountInvalid(budgetData.categoryLimits?.[key]))
      .map(({ key }) => key),
    [budgetData.categoryLimits]
  );

  /* A budget belongs to a trip, so an account with none has nothing to set one
  for. Checked once the trips have finished loading, so an empty list mid request
  is not reported as no trips. Never in edit mode, where the trip already exists
  and the select is disabled anyway */
  const noTrips = !isEdit && !loadingTrips && trips.length === 0;

  /* What the disabled trip select is labelled with in edit mode. GET
  /budget/fetchBudget/:id returns the title alongside the id for exactly this,
  so it is read off the budget first: the trips list may not have arrived yet,
  and a trip that has since been deleted is not in it at all. Falls back to the
  list, and then to the same wording the route uses for a trip that is gone */
  const editTripTitle = useMemo(() => {
    if (!isEdit) return '';
    if (budget?.tripTitle) return budget.tripTitle;

    const tripId = String(budgetData.tripId ?? '');
    const trip = trips.find(({ _id }) => String(_id) === tripId);

    return trip?.title || 'Trip no longer available';
  }, [isEdit, budget, budgetData.tripId, trips]);

  const showTripError = touched.tripId && tripEmpty;
  const showBaseCurrencyError = touched.baseCurrency && baseCurrencyEmpty;
  const showTotalBudgetError = touched.totalBudget && totalBudgetEmpty;
  const showTotalBudgetInvalidError = touched.totalBudget && totalBudgetInvalid;
  const showDailyBudgetInvalidError = touched.dailyBudget && dailyBudgetInvalid;

  /* Blocked while a request is running, and on a create while the trips are
  still loading or none of them can be given a budget */
  const submitDisabled = submitting || (!isEdit && (loadingTrips || noTrips));

  //================EVENT HANDLERS=====================
  /* One handler for every input, including the nested paths. Each input is named
  by the schema path it writes to, so a category limit arrives as
  'categoryLimits.food' and an alert as 'alerts.notifyOnExceed', and the group is
  copied rather than replaced so changing one limit leaves the other nine */
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    // The alerts are the only checkboxes, and a checkbox reports itself through checked
    const next = type === 'checkbox' ? checked : value;

    setLocalError(null);// Any edit clears the form level error
    setBudgetData?.((prev) => {
      const [group, key] = name.split('.');

      // A plain top level field, written straight onto the form state
      if (!key) return { ...prev, [name]: next };

      return { ...prev, [group]: { ...prev[group], [key]: next } };
    });
  };

  /* Only the rules the browser cannot enforce on its own are checked here.
  Empty, min and type constraints are still handled by the native validation on
  each input, which blocks submit before this runs. */
  const handleSaveBudget = (event) => {
    event.preventDefault()
    // Ignored while a request is already running, so the form cannot double post
    if (submitting) return
    markAllTouched()

    /* The trips are what the select is built from, so this cannot be reported
    against a single input: with none there is no option to choose and nothing
    for the required attribute to catch */
    if (noTrips) {
      setLocalError('Create a trip before setting a budget, a budget is set for one.')
      console.warn('[WARN: BudgetForm.js]: No trips available to set a budget for')
      return
    }
    if (!isEdit && loadingTrips) {
      setLocalError('Your trips are still loading, please try again in a moment.')
      console.warn('[WARN: BudgetForm.js]: Submit attempted while the trips were still loading')
      return
    }

    /* Repeated here rather than left to the browser alone, so a submission that
    reaches this point with a field missing, from native validation being
    bypassed, is reported on screen and the field is focused */
    if (tripEmpty) {
      setLocalError('Please select the trip this budget is for.')
      console.warn('[WARN: BudgetForm.js]: No trip selected')
      document.getElementById('budgetTripId')?.focus()
      return
    }
    if (baseCurrencyEmpty) {
      setLocalError('Please select the currency the budget is set in.')
      console.warn('[WARN: BudgetForm.js]: No base currency selected')
      document.getElementById('budgetBaseCurrency')?.focus()
      return
    }
    if (totalBudgetEmpty || totalBudgetInvalid) {
      setLocalError('Please enter a total budget of 0 or more.')
      console.warn('[WARN: BudgetForm.js]: Total budget missing or not a usable amount')
      document.getElementById('budgetTotalBudget')?.focus()
      return
    }
    /* The daily budget and the limits are optional, so the browser has no
    required attribute to catch a value that was typed and is not usable */
    if (dailyBudgetInvalid) {
      setLocalError('The daily budget must be 0 or more, or left blank to work it out from the trip.')
      console.warn('[WARN: BudgetForm.js]: Daily budget is not a usable amount')
      document.getElementById('budgetDailyBudget')?.focus()
      return
    }
    if (invalidLimits.length) {
      setLocalError('A category limit must be 0 or more, or left blank for no cap.')
      console.warn('[WARN: BudgetForm.js]: Category limits are not usable amounts:', invalidLimits.join(', '))
      document.getElementById(`budgetLimit-${invalidLimits[0]}`)?.focus()
      return
    }

    setLocalError(null)
    console.log(`[INFO: BudgetForm.js]: ${isEdit ? 'Saving budget changes' : 'Creating a new budget'}`);
    saveBudget?.()
  }

  /* Clears a create back to the empty shape and resets an edit to the budget as
  it is stored, which is why the button says CLEAR FORM in one mode and RESET
  FORM in the other */
  const handleClear = () => {
    const confirmClear = window.confirm(// Ask the user to confirm before discarding their input
      isEdit
        ? 'Are you sure you want to discard your changes and restore the saved budget?'
        : 'Are you sure you want to clear the form?'
    );
    if (!confirmClear) return;

    setBudgetData?.(emptyForm);
    setTouched({
      tripId: false,
      baseCurrency: false,
      totalBudget: false,
      dailyBudget: false,
    });
    setLocalError(null);
  }

  // ========= IDs USED BY aria-describedby =========
  const tripHelpId = 'budgetTripHelp';// ID used for the note on which trips are listed
  const tripErrorId = 'budgetTripError';// ID used for the trip error message
  const baseCurrencyHelpId = 'budgetBaseCurrencyHelp';// ID used for the base currency hint
  const baseCurrencyErrorId = 'budgetBaseCurrencyError';// ID used for the base currency error message
  const totalBudgetErrorId = 'budgetTotalBudgetError';// ID used for the total budget error message
  const totalBudgetInvalidErrorId = 'budgetTotalBudgetInvalidError';// ID used for the total budget value error message
  const dailyBudgetHelpId = 'budgetDailyBudgetHelp';// ID used for the auto-calculated daily budget hint
  const dailyBudgetInvalidErrorId = 'budgetDailyBudgetInvalidError';// ID used for the daily budget value error message
  const categoryLimitsHelpId = 'budgetCategoryLimitsHelp';// ID used for the blank means no cap hint
  const noTripsId = 'budgetNoTrips';// ID used for the no trips message
  const formErrorId = 'budgetFormError';// ID used for the form level error message
  const serverErrorId = 'budgetServerErrors';// ID used for the block listing the server's field errors

  // Joins the IDs that are currently rendered into a single aria-describedby value
  const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

  /* The server returns its errors keyed by schema path, so a category limit
  arrives as 'categoryLimits.food' and an alert as 'alerts.notifyOnExceed' */
  const serverErrors = Object.entries(fieldErrors || {});
  const hasServerError = (path) => Boolean(fieldErrors?.[path]);

  /* The page's error takes precedence over this component's, so a message from
  the request that has just failed is not replaced by a stale local one */
  const shownFormError = formError || localError;

  //==============JSX RENDERING==================
  return (
    /* No method attribute: a form element only accepts GET or POST, and the
    create and the edit are both sent by fetch rather than by the browser */
    <form
      id='budget-form'
      aria-labelledby='formHeading'
      onSubmit={handleSaveBudget}
    >
      <div id='formHeadingBlock'>
        <h3 id='formHeading'>{isEdit ? 'EDIT BUDGET' : 'SET A BUDGET'}</h3>
      </div>
      <div id='budget-input'>
        {/* GROUP 1: THE TRIP, THE CURRENCY AND THE TWO AMOUNTS */}
        <div id='budget-group1'>
        {/* STACK 1: TRIP */}
           <Stack direction="horizontal" gap={3} id='budget-stack1'>
      <div className="p-2" id='budget-trip-block'>
        <label className='budget-label' htmlFor='budgetTripId'>TRIP:</label>
        <div className='input-div'>
                <select
                  className='input'
                  id='budgetTripId'
                  name='tripId'
                  required={!isEdit}
                  value={budgetData.tripId || ''}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('tripId')}
                  /* tripId is unique on the schema, so an existing budget
                  cannot be moved to another trip. In edit mode the trip is
                  shown but not changeable */
                  disabled={isEdit || submitting || loadingTrips || noTrips}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  /* Only a create waits on the trips list, an edit is labelled
                  from the budget it was opened on */
                  aria-busy={!isEdit && loadingTrips}
                  aria-invalid={showTripError || hasServerError('tripId') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    tripHelpId,
                    showTripError && tripErrorId,
                    noTrips && noTripsId,
                    hasServerError('tripId') && serverErrorId
                  )}
                >
                  {/* The denormalised trip title comes from the same choice.
                  An edit carries the one option the budget already belongs to,
                  built from the budget rather than from the trips list: the
                  select's value would otherwise match nothing in that list
                  while it is still loading, or once the trip has been deleted,
                  and the disabled select would report the budget's trip as
                  LOADING TRIPS... or as SELECT */}
                  {isEdit ? (
                    <option value={budgetData.tripId || ''}>{editTripTitle}</option>
                  ) : (
                    <>
                      {loadingTrips && <option value=''>LOADING TRIPS...</option>}
                      {!loadingTrips && noTrips && <option value=''>NO TRIPS YET</option>}
                      {!loadingTrips && !noTrips && (
                        <>
                          <option value=''>SELECT</option>
                          {trips.map(({ _id, title }) => (
                            <option key={_id} value={_id}>{title}</option>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </select>
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                {/* TRIP ERROR MESSAGE */}
                {showTripError && (
                  <p id={tripErrorId} className='visually-hidden' role='alert'>Trip is required.</p>
                )}
        </div>
        {/* NO TRIPS MESSAGE, shown on screen because the select has nothing to
        offer and the required attribute cannot report it */}
        {noTrips && (
          <p id={noTripsId} className='formErrorMessage' role='alert'>
            <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
            Create a trip before setting a budget
          </p>
        )}
      </div>
      <div className="p-2 ms-auto"/>
      <div className="p-2">
          <small id={tripHelpId} className='budget-infoText'>
                {isEdit
                  ? 'A budget cannot be moved to another trip'
                  : 'Only trips that do not have a budget yet are listed'}
              </small>
            </div>
    </Stack>
    {/* STACK 2: BASE-CURRENCY */}
        <Stack gap={3} direction="horizontal" id='budget-stack2' >
        {/* BASE CURRENCY SELECT */}
              <div className="p-2" id='budget-basecurrency-block'>
                <label className='budget-label' htmlFor='budgetBaseCurrency'>BASE CURRENCY:</label>
                <div className='input-div'>
                  <select
                    className='input'
                    id='budgetBaseCurrency'
                    name='baseCurrency'
                    required
                    value={budgetData.baseCurrency || ''}
                    onChange={handleInputChange}
                    onBlur={() => markTouched('baseCurrency')}
                    disabled={submitting || currencyLocked}
                    // ARIA ATTRIBUTES:
                    aria-required='true'
                    aria-invalid={showBaseCurrencyError || hasServerError('baseCurrency') ? 'true' : 'false'}
                    aria-describedby={describedBy(
                      baseCurrencyHelpId,
                      showBaseCurrencyError && baseCurrencyErrorId,
                      hasServerError('baseCurrency') && serverErrorId
                    )}
                  >
                    {/* Labelled 'CODE - Name' by currencyOptionLabel, the same
                    as the converter's dropdowns */}
                    {currencyOptions.map(({ code, name }) => (
                      <option key={code} value={code}>{currencyOptionLabel(code, name)}</option>
                    ))}
                  </select>
                  <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                  {/* BASE CURRENCY ERROR MESSAGE */}
                  {showBaseCurrencyError && (
                    <p id={baseCurrencyErrorId} className='visually-hidden' role='alert'>Base currency is required.</p>
                  )}
                </div>
                 </div>
                <div className="p-2 ms-auto"/>
                <div className="p-2">
                 <small id={baseCurrencyHelpId} className='budget-infoText'>
                  {/* Every expense is converted into this currency as it is
                  added, so the route refuses a change once there are any */}
                  {currencyLocked
                    ? 'Locked: the expenses on this budget were already converted into this currency'
                    : 'The budget and its totals are reported in this currency'}
                </small>
                </div>
    </Stack>
    {/* STACK 3: TOTAL BUDGET */}
        <Stack gap={3} direction="horizontal" id='budget-stack3' >
        {/* TOTAL BUDGET INPUT */}
      <div className="p-2" id='budget-total-block'>
        <label className='budget-label' htmlFor='budgetTotalBudget'>TOTAL BUDGET:</label>
                <div className='input-div'>
                  <input
                    className='input'
                    type='number'
                    id='budgetTotalBudget'
                    name='totalBudget'
                    placeholder='0.00'
                    min='0'
                    step='0.01'
                    required
                    value={budgetData.totalBudget ?? ''}
                    onChange={handleInputChange}
                    onBlur={() => markTouched('totalBudget')}
                    disabled={submitting}
                    // ARIA ATTRIBUTES:
                    aria-required='true'
                    aria-invalid={showTotalBudgetError || showTotalBudgetInvalidError || hasServerError('totalBudget') ? 'true' : 'false'}
                    aria-describedby={describedBy(
                      showTotalBudgetError && totalBudgetErrorId,
                      showTotalBudgetInvalidError && totalBudgetInvalidErrorId,
                      hasServerError('totalBudget') && serverErrorId
                    )}
                  />
                  <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                  {/* TOTAL BUDGET ERROR MESSAGE */}
                  {showTotalBudgetError && (
                    <p id={totalBudgetErrorId} className='visually-hidden' role='alert'>Total budget is required.</p>
                  )}
                </div>
                {/* The total cannot be negative, which the input's min cannot
                enforce on a typed value, so it is reported on screen */}
                {showTotalBudgetInvalidError && (
                  <p id={totalBudgetInvalidErrorId} className='formErrorMessage' role='alert'>
                    <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                    The total budget must be 0 or more
                  </p>
                )}
      </div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2" id='budget-basecurrency-block'></div>
    </Stack>
    {/* STACK 4: DAILY BUDGET */}
      <Stack direction="horizontal" gap={3} id='budget-stack4'>
      {/* DAILY BUDGED */}
      <div className='p-2' id='budget-daily-block'>
              <label className='budget-label' htmlFor='budgetDailyBudget'>DAILY BUDGET:</label>
              <div className='input-div'>
                <input
                  className='input'
                  type='number'
                  id='budgetDailyBudget'
                  name='dailyBudget'
                  placeholder='0.00'
                  min='0'
                  step='0.01'
                  value={budgetData.dailyBudget ?? ''}
                  onChange={handleInputChange}
                  onBlur={() => markTouched('dailyBudget')}
                  disabled={submitting}
                  // ARIA ATTRIBUTES:
                  aria-invalid={showDailyBudgetInvalidError || hasServerError('dailyBudget') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    dailyBudgetHelpId,
                    showDailyBudgetInvalidError && dailyBudgetInvalidErrorId,
                    hasServerError('dailyBudget') && serverErrorId
                  )}
                />
              </div>
              {/* Optional, so there is no required attribute to report a value
              that was typed and cannot be stored */}
              {showDailyBudgetInvalidError && (
                <p id={dailyBudgetInvalidErrorId} className='formErrorMessage' role='alert'>
                  <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
                  The daily budget must be 0 or more, or left blank
                </p>
              )}

            </div>
      <div className="p-2 " >
        <small>
          Optional.
        </small>
      </div>
      <div className="p-2 ms-auto" >
         {/* Left blank, the schema's pre('save') hook divides the total
              by the trip's day count */}
              <small id={dailyBudgetHelpId} className='budget-infoText'>
                Left blank, this is worked out from the total and the length of the trip
              </small>
      </div>
    </Stack>
        </div>
        {/* GROUP 2: CATEGORY LIMITS, ONE PER EXPENSE CATEGORY */}
        <div id='budget-group2'>
        <div id='form-category-div'>
<span id='form-category-span'>
          <h4 className='formSectionHeading'>CATEGORY LIMITS</h4>

         </span>
          <span className='budgetCategorySpan' id={categoryLimitsHelpId} >
            <p className='budgetCategoryInfo'><u>A category left blank has no cap of its own</u></p>

          </span>
        </div>

         {/* STACK 5: BUDGET CATEGORIES */}
            {/* The ten keys are read from EXPENSE_CATEGORIES, the same list the
            add expense form's category select is built from */}
            <Stack id='budget-category-stack'>
            <i><p className='budgetCategoryInfo'>Optional</p></i>
              {EXPENSE_CATEGORIES.map(({ key, label }) => (
                <div key={key} className='budget-category-col'>
                  <div className=' budget-category-block'>
                    <label className='budget-label' htmlFor={`budgetLimit-${key}`}>{label}:</label>
                    <div className='input-div'>
                      <input
                        className='input'
                        type='number'
                        id={`budgetLimit-${key}`}
                        name={`categoryLimits.${key}`}
                        placeholder='0'
                        min='0'
                        step='0.01'
                        value={budgetData.categoryLimits?.[key] ?? ''}
                        onChange={handleInputChange}
                        disabled={submitting}
                        // ARIA ATTRIBUTES:
                        aria-invalid={invalidLimits.includes(key) || hasServerError(`categoryLimits.${key}`) ? 'true' : 'false'}
                        aria-describedby={describedBy(
                          categoryLimitsHelpId,
                          hasServerError(`categoryLimits.${key}`) && serverErrorId
                        )}
                      />
                      <p className='infoText'>NO LIMIT</p>
                    </div>
                  </div>
                </div>
              ))}
            </Stack>
        </div>
        {/* GROUP 3: ALERTS, BOTH ON BY DEFAULT */}
        <div id='budget-group3'>
          <h4 className='formSectionHeading'>ALERTS</h4>
          <div id='budgetAlerts'>
{/* STACK 6 */}
          <Stack gap={3} id='budget-stack6'>
            <div className='p-2' id='budget-alert-80-block'>
              <div className='input-div'>
                <input
                  type='checkbox'
                  className='budget-checkbox'
                  id='budgetNotifyAt80'
                  name='alerts.notifyAt80Percent'
                  checked={Boolean(budgetData.alerts?.notifyAt80Percent)}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
                <label className='budget-label' htmlFor='budgetNotifyAt80'>
                  WARN ME AT 80% OF THE TOTAL
                </label>
              </div>
            </div>
            <div className='p-2' id='budget-alert-exceed-block'>
              <div className='input-div'>
                <input
                  type='checkbox'
                  className='budget-checkbox'
                  id='budgetNotifyOnExceed'
                  name='alerts.notifyOnExceed'
                  checked={Boolean(budgetData.alerts?.notifyOnExceed)}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
                <label className='budget-label' htmlFor='budgetNotifyOnExceed'>
                  WARN ME WHEN THE TOTAL IS EXCEEDED
                </label>
              </div>
            </div>
          </Stack>
          </div>

        </div>
      </div>
      {/* FORM LEVEL ERROR, raised by handleSaveBudget when submit is blocked, or
      passed down by the page when the request itself failed */}
      {shownFormError && (
        <div id={formErrorId} className='formErrorBlock' role='alert' aria-live='assertive'>
          <p className='formErrorMessage'>
            <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
            {shownFormError}
          </p>
        </div>
      )}
      {/* SERVER SIDE FIELD ERRORS, returned when the API rejects the budget.
      A trip that already has a budget arrives here as a 409 on tripId */}
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
      {/* GROUP 4: REQUIRED FIELDS LEGEND AND SUBMISSION BUTTONS */}
      <div id='budget-group4'>
      {/* STACK 4 */}
        <Stack direction='horizontal' gap={3} id='budgetBtnStack'>
          {/* REQUIRED INFO MESSAGE */}
          <div className='p-2' id='requiredInfo'>
            <p className='infoMsg'>
              <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
            </p>
          </div>
          <div className='p-2 ms-auto'>
            <Button
              type='submit'
              id='budgetBtn'
              variant='light'
              // Disabled while the request runs, so the form cannot double post
              disabled={submitDisabled}
              // ARIA ATTRIBUTES:
              aria-label={submitting ? 'Saving the budget, please wait' : isEdit ? 'Save budget changes' : 'Create this budget'}
              aria-disabled={submitDisabled}
              aria-busy={submitting}
              aria-describedby={describedBy(
                shownFormError && formErrorId,
                noTrips && noTripsId,
                serverErrors.length > 0 && serverErrorId
              )}
            >{submitting ? 'SAVING...' : isEdit ? 'SAVE BUDGET' : 'CREATE BUDGET'}</Button>
          </div>
          <div className='p-2' id='clearFormBlock'>
            {/* Guarded by window.confirm. A create clears to the empty shape,
            an edit resets to the saved budget */}
            <Button
              variant='danger'
              id='clearFormBtn'
              type='button'
              disabled={submitting}
              onClick={handleClear}
              // ARIA ATTRIBUTES:
              aria-label={isEdit ? 'Discard changes and restore the saved budget' : 'Clear the budget form'}
              aria-disabled={submitting}
            >{isEdit ? 'RESET FORM' : 'CLEAR FORM'}</Button>
          </div>
        </Stack>
      </div>
    </form>
  )
}
