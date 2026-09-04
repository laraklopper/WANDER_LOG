// BudgetForm.js
/* WIREFRAME. The markup, ids and layout of the budget form only: there is no
state, no validation and no request in here yet. Every input is uncontrolled
(defaultValue, no onChange) so the shape can be looked at and styled before the
behaviour is written, and submit is swallowed so the page cannot navigate.

What is still to be added, per section 9 of Documents/FORMS.md:
  - the form state, owned by Budget.js, and one change handler for the nested
    categoryLimits and alerts paths
  - the touched state, the field messages and the component level rules
  - POST /budgets to create, and the PATCH to edit, neither of which exists
    (expenseRoutes.js is empty, see KNOWN GAPS)

One budget per trip, so the same form does both: it creates a budget for a trip
that has none, and edits the budget thereafter. mode says which, and the only
field that behaves differently is tripId, which cannot be moved once a budget
exists because tripId is unique on the schema. */
//IMPORT REQUIRED MODULES AND PACKAGES
import React from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/BudgetForm.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS
import { Asterisk, Bug } from 'lucide-react';
// IMPORT SHARED DATA AND UTILITY FUNCTIONS
import { EXPENSE_CATEGORIES } from '../data/financeData';
import { FALLBACK_CURRENCIES, currencyOptionLabel } from '../util/currencyFunc';

// ======MAIN BUDGETFORM.js COMPONENT====================
export default function BudgetForm({
  // 'create' for a trip with no budget, 'edit' for one that already has one
  mode = 'create',
  /* The user's trips, for the tripId select. In create mode the page passes
  only the trips that do not already have a budget */
  trips = [],
  /* Offered until GET /api/currencies answers, and kept if it never does. Same
  list the currency converter uses */
  currencyOptions = FALLBACK_CURRENCIES,
  // The saved budget in edit mode, so the form opens filled in. null on create
  budget = null,
  // True while the request is in flight, set by the page
  submitting = false,
  // Form level error, raised by the submit handler once it exists
  formError = null,
  // Field keyed messages from the server, keyed by schema path
  fieldErrors = {},
}) {
  const isEdit = mode === 'edit';

  // ========= IDs USED BY aria-describedby =========
  const tripHelpId = 'budgetTripHelp';// ID used for the note on which trips are listed
  const baseCurrencyHelpId = 'budgetBaseCurrencyHelp';// ID used for the base currency hint
  const dailyBudgetHelpId = 'budgetDailyBudgetHelp';// ID used for the auto-calculated daily budget hint
  const categoryLimitsHelpId = 'budgetCategoryLimitsHelp';// ID used for the blank means no cap hint
  const formErrorId = 'budgetFormError';// ID used for the form level error message
  const serverErrorId = 'budgetServerErrors';// ID used for the block listing the server's field errors

  // Joins the IDs that are currently rendered into a single aria-describedby value
  const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

  /* The server returns its errors keyed by schema path, so a category limit
  arrives as 'categoryLimits.food' and an alert as 'alerts.notifyOnExceed' */
  const serverErrors = Object.entries(fieldErrors || {});
  const hasServerError = (path) => Boolean(fieldErrors?.[path]);

  //==============JSX RENDERING==================
  return (
    /* No method attribute: a form element only accepts GET or POST, and the
    create and the edit are both sent by fetch rather than by the browser */
    <form
      id='budget-form'
      aria-labelledby='formHeading'
      onSubmit={(e) => e.preventDefault()}// Placeholder, the handler is not written yet
    >
      <div id='formHeadingBlock'>
        <h3 id='formHeading'>{isEdit ? 'EDIT BUDGET' : 'SET A BUDGET'}</h3>
      </div>
      <div id='budget-input'>
        {/* GROUP 1: THE TRIP, THE CURRENCY AND THE TWO AMOUNTS */}
        <div id='budget-group1'>
          <Stack gap={3} id='budget-stack1'>
            {/* TRIP SELECT */}
            <div className='p-2' id='budget-trip-block'>
              <label className='budget-label' htmlFor='budgetTripId'>TRIP:</label>
              <div className='input-div'>
                <select
                  className='input'
                  id='budgetTripId'
                  name='tripId'
                  defaultValue={budget?.tripId || ''}
                  /* tripId is unique on the schema, so an existing budget
                  cannot be moved to another trip. In edit mode the trip is
                  shown but not changeable */
                  disabled={isEdit || submitting}
                  // ARIA ATTRIBUTES:
                  aria-required='true'
                  aria-invalid={hasServerError('tripId') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    tripHelpId,
                    hasServerError('tripId') && serverErrorId
                  )}
                >
                  <option value=''>SELECT</option>
                  {/* The denormalised trip title comes from the same choice */}
                  {trips.map(({ _id, title }) => (
                    <option key={_id} value={_id}>{title}</option>
                  ))}
                </select>
                <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
              <small id={tripHelpId} className='infoText'>
                {isEdit
                  ? 'A budget cannot be moved to another trip'
                  : 'Only trips that do not have a budget yet are listed'}
              </small>
            </div>
            {/* BASE CURRENCY AND TOTAL BUDGET */}
            <Stack direction='horizontal' gap={3} id='budget-stack2'>
              {/* BASE CURRENCY SELECT */}
              <div className='p-2' id='budget-basecurrency-block'>
                <label className='budget-label' htmlFor='budgetBaseCurrency'>BASE CURRENCY:</label>
                <div className='input-div'>
                  <select
                    className='input'
                    id='budgetBaseCurrency'
                    name='baseCurrency'
                    defaultValue={budget?.baseCurrency || 'ZAR'}
                    disabled={submitting}
                    // ARIA ATTRIBUTES:
                    aria-required='true'
                    aria-invalid={hasServerError('baseCurrency') ? 'true' : 'false'}
                    aria-describedby={describedBy(
                      baseCurrencyHelpId,
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
                </div>
                <small id={baseCurrencyHelpId} className='infoText'>
                  The budget and its totals are reported in this currency
                </small>
              </div>
              {/* TOTAL BUDGET INPUT */}
              <div className='p-2 ms-auto' id='budget-total-block'>
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
                    defaultValue={budget?.totalBudget ?? ''}
                    disabled={submitting}
                    // ARIA ATTRIBUTES:
                    aria-required='true'
                    aria-invalid={hasServerError('totalBudget') ? 'true' : 'false'}
                    aria-describedby={describedBy(hasServerError('totalBudget') && serverErrorId)}
                  />
                  <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                </div>
              </div>
            </Stack>
            {/* DAILY BUDGET INPUT */}
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
                  defaultValue={budget?.dailyBudget ?? ''}
                  disabled={submitting}
                  // ARIA ATTRIBUTES:
                  aria-invalid={hasServerError('dailyBudget') ? 'true' : 'false'}
                  aria-describedby={describedBy(
                    dailyBudgetHelpId,
                    hasServerError('dailyBudget') && serverErrorId
                  )}
                />
              </div>
              {/* Left blank, the schema's pre('save') hook divides the total
              by the trip's day count */}
              <small id={dailyBudgetHelpId} className='infoText'>
                Optional. Left blank, this is worked out from the total and the length of the trip
              </small>
            </div>
          </Stack>
        </div>
        {/* GROUP 2: CATEGORY LIMITS, ONE PER EXPENSE CATEGORY */}
        <div id='budget-group2'>
          <h4 className='formSectionHeading'>CATEGORY LIMITS</h4>
          <small id={categoryLimitsHelpId} className='infoText'>
            All optional. A category left blank has no cap of its own
          </small>
          <Stack gap={3} id='budget-stack3'>
            {/* The ten keys are read from EXPENSE_CATEGORIES, the same list the
            add expense form's category select is built from */}
            <Row id='budget-category-limits-row'>
              {EXPENSE_CATEGORIES.map(({ key, label }) => (
                <Col xs={6} key={key} className='budget-category-col'>
                  <div className='p-2 budget-category-block'>
                    <label className='budget-label' htmlFor={`budgetLimit-${key}`}>{label}:</label>
                    <div className='input-div'>
                      <input
                        className='input'
                        type='number'
                        id={`budgetLimit-${key}`}
                        name={`categoryLimits.${key}`}
                        placeholder='NO LIMIT'
                        min='0'
                        step='0.01'
                        defaultValue={budget?.categoryLimits?.[key] ?? ''}
                        disabled={submitting}
                        // ARIA ATTRIBUTES:
                        aria-invalid={hasServerError(`categoryLimits.${key}`) ? 'true' : 'false'}
                        aria-describedby={describedBy(
                          categoryLimitsHelpId,
                          hasServerError(`categoryLimits.${key}`) && serverErrorId
                        )}
                      />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Stack>
        </div>
        {/* GROUP 3: ALERTS, BOTH ON BY DEFAULT */}
        <div id='budget-group3'>
          <h4 className='formSectionHeading'>ALERTS</h4>
          <Stack gap={3} id='budget-stack4'>
            <div className='p-2' id='budget-alert-80-block'>
              <div className='input-div'>
                <input
                  type='checkbox'
                  className='budget-checkbox'
                  id='budgetNotifyAt80'
                  name='alerts.notifyAt80Percent'
                  defaultChecked={budget?.alerts?.notifyAt80Percent ?? true}
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
                  defaultChecked={budget?.alerts?.notifyOnExceed ?? true}
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
      {/* FORM LEVEL ERROR, to be raised by the submit handler when submit is blocked */}
      {formError && (
        <div id={formErrorId} className='formErrorBlock' role='alert' aria-live='assertive'>
          <p className='formErrorMessage'>
            <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
            {formError}
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
        <Stack direction='horizontal' gap={3} id='budget-stack5'>
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
              disabled={submitting}
              // ARIA ATTRIBUTES:
              aria-label={submitting ? 'Saving the budget, please wait' : isEdit ? 'Save budget changes' : 'Create this budget'}
              aria-disabled={submitting}
              aria-busy={submitting}
              aria-describedby={describedBy(
                formError && formErrorId,
                serverErrors.length > 0 && serverErrorId
              )}
            >{submitting ? 'SAVING...' : isEdit ? 'SAVE BUDGET' : 'CREATE BUDGET'}</Button>
          </div>
          <div className='p-2' id='clearFormBlock'>
            {/* Guarded by window.confirm once the handler is written. A create
            clears to the empty shape, an edit resets to the saved budget */}
            <Button
              variant='danger'
              id='clearFormBtn'
              type='button'
              disabled={submitting}
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
