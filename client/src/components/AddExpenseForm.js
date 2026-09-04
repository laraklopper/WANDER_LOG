// AddExpenseForm.js
/* The add expense form, rendered by pages/Expenses.js behind its
#add-exp-panal toggle. Against section 6.1 of Documents/SCHEMAS.md and section 10
of Documents/FORMS.md.

An expense is embedded in the budget of the trip it belongs to, one budget per
trip, so this form writes through the parent: the page posts to
POST /expense/addExpense, which finds that budget and pushes the expense onto it.
A trip with no budget has nowhere to put an expense, which is why the trip select
is filled from the user's budgets rather than from all of their trips.

Follows AddTripForm.js and AddEntryForm.js: the page owns the form state and the
request, this component owns the validation, the touched state and the messages. */
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useMemo, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/AddExpenseForm.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import { Asterisk, Bug } from 'lucide-react';
// IMPORT SHARED DATA AND UTILITY FUNCTIONS
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../data/financeData';
import { FALLBACK_CURRENCIES, currencyOptionLabel } from '../util/currencyFunc';
import { todayInputValue } from '../util/dateFunctions';

/* The maxlength values the expense subdocument stores, repeated here so each
input stops accepting characters at the point the API would refuse them */
const TITLE_MAX = 100;
const NOTES_MAX = 300;

/* The empty form used by the clear button when the page does not supply one.
Kept in sync with EMPTY_EXPENSE in pages/Expenses.js, which is passed in as a
prop. The trip is held as tripId, because that is what the API finds the parent
budget by. The two fields the schema defaults are pre-filled with those defaults
rather than left blank, so an untouched form submits what the schema would have
stored anyway. The owner is left out on purpose: the username comes from the
account, and convertedAmount is worked out from a rate rather than typed */
const BLANK_EXPENSE = {
  tripId: '',
  title: '',
  amount: '',
  currency: 'ZAR',
  category: '',
  date: '',
  notes: '',
  paymentMethod: 'cash',
  isPaid: true,
};

// ======MAIN ADDEXPENSEFORM.js COMPONENT====================
export default function AddExpenseForm(
  {//PROPS PASSED FROM PARENT COMPONENT (Expenses.js)
    currentUser,
    newExpenseData = BLANK_EXPENSE,
    setNewExpenseData,
    addExpense,
    // True while the add expense request is in flight, set by the Expenses page
    submitting = false,
    /* Field keyed messages from the server, for rules the browser cannot check.
    Keyed by the field name, so an amount arrives as 'amount' */
    fieldErrors = {},
    emptyForm = BLANK_EXPENSE,
    /* The logged in user's budgets, loaded by the Expenses page as
    { tripId, tripTitle, baseCurrency }. An expense is embedded in one of them,
    so the form cannot be submitted until at least one trip has a budget */
    budgets = [],
    loadingBudgets = false,
    /* Offered until GET /api/currencies answers, and kept if it never does. The
    same list the currency converter and the budget form use */
    currencyOptions = FALLBACK_CURRENCIES,
  }) {
  const [dateMessage, setDateMessage] = useState(false)
  const [formError, setFormError] = useState(null)// Form level error shown above the submit button
  const [touched, setTouched] = useState({
    tripId: false,       // Tracks if the trip select was touched
    title: false,        // Tracks if the title field was touched
    amount: false,       // Tracks if the amount field was touched
    currency: false,     // Tracks if the currency select was touched
    category: false,     // Tracks if the category select was touched
    paymentMethod: false,// Tracks if the payment method select was touched
    date: false,         // Tracks if the date field was touched
  })

  // Marks a single field as touched so its error message may be announced
  const markTouched = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Marks every field as touched, used when the form is submitted
  const markAllTouched = () =>
    setTouched({
      tripId: true,
      title: true,
      amount: true,
      currency: true,
      category: true,
      paymentMethod: true,
      date: true,
    });

  /* Today, as the date input writes it. Used for the max attribute and for the
  future date check below, which compare as strings because this format sorts
  the same way the dates themselves do */
  const today = useMemo(() => todayInputValue(), []);

  //========== EMPTY FIELD VALIDATION ====================
  // Checks if no trip was selected
  const tripEmpty = useMemo(
    () => !String(newExpenseData.tripId || '').trim(), [newExpenseData.tripId]
  );
  // Checks if the expense title is empty
  const titleEmpty = useMemo(
    () => !String(newExpenseData.title || '').trim(), [newExpenseData.title]
  );
  // Checks if the amount is empty
  const amountEmpty = useMemo(
    () => !String(newExpenseData.amount ?? '').trim(), [newExpenseData.amount]
  );
  // Checks if no currency was selected
  const currencyEmpty = useMemo(
    () => !String(newExpenseData.currency || '').trim(), [newExpenseData.currency]
  );
  // Checks if no category was selected
  const categoryEmpty = useMemo(
    () => !String(newExpenseData.category || '').trim(), [newExpenseData.category]
  );
  // Checks if no payment method was selected
  const paymentMethodEmpty = useMemo(
    () => !String(newExpenseData.paymentMethod || '').trim(), [newExpenseData.paymentMethod]
  );
  // Checks if the date is empty
  const dateEmpty = useMemo(
    () => !String(newExpenseData.date || '').trim(), [newExpenseData.date]
  );

  //========== VALUE VALIDATION ====================
  /* An expense of nothing is not an expense, and a negative one is a refund, so
  the amount has to be a positive number. The number input's own min stops the
  spinner going below 0.01, but a typed value still reaches state */
  const amountInvalid = useMemo(() => {
    if (amountEmpty) return false;
    const amount = Number(newExpenseData.amount);
    return Number.isNaN(amount) || amount <= 0;
  }, [amountEmpty, newExpenseData.amount]);

  /* An expense records money that has already been spent, so its date cannot be
  after today. The max attribute stops the picker offering one, and this catches
  a date typed straight into the field */
  const dateInFuture = useMemo(
    () => !dateEmpty && String(newExpenseData.date) > today,
    [dateEmpty, newExpenseData.date, today]
  );

  /* An expense is embedded in a budget, so there is nothing to add one to until
  a trip has one. Checked once the budgets have finished loading, so an empty
  list mid request is not reported as no budgets */
  const noBudgets = !loadingBudgets && budgets.length === 0;

  /* The budget of the selected trip, for the note under the currency select.
  Its baseCurrency is what the amount is converted into and totalled in */
  const selectedBudget = useMemo(
    () => budgets.find((budget) => String(budget.tripId) === String(newExpenseData.tripId)),
    [budgets, newExpenseData.tripId]
  );
  /* Only worth mentioning when the two differ: an expense already in the base
  currency is stored as it was paid, with no conversion at all */
  const showConversionNote = Boolean(
    selectedBudget?.baseCurrency &&
    newExpenseData.currency &&
    selectedBudget.baseCurrency !== newExpenseData.currency
  );

  const showTripError = touched.tripId && tripEmpty;
  const showTitleError = touched.title && titleEmpty;
  const showAmountError = touched.amount && amountEmpty;
  const showAmountInvalidError = touched.amount && amountInvalid;
  const showCurrencyError = touched.currency && currencyEmpty;
  const showCategoryError = touched.category && categoryEmpty;
  const showPaymentMethodError = touched.paymentMethod && paymentMethodEmpty;
  const showDateError = touched.date && dateEmpty;
  const showDateInFutureError = touched.date && dateInFuture;

  /* Blocked while a request is running, while the budgets are still loading, and
  when no trip has a budget to spend against */
  const submitDisabled = submitting || loadingBudgets || noBudgets;

  //================EVENT HANDLERS=====================
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormError(null);// Any edit clears the form level error
    /* isPaid is the only checkbox on the form, and a checkbox reports itself
    through checked rather than value */
    setNewExpenseData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /* Only the rules the browser cannot enforce on its own are checked here.
  Empty, maxLength, min and type constraints are still handled by the native
  validation on each input, which blocks submit before this runs. */
  const handleAddExpense = (event) => {
    event.preventDefault()
    // Ignored while a request is already running, so the form cannot double post
    if (submitting) return
    markAllTouched()

    /* The budgets are what the trip select is built from, so this cannot be
    reported against a single input: with none loaded there is no option to
    choose and nothing for the required attribute to catch */
    if (noBudgets) {
      setFormError('Set a budget for a trip before adding an expense, an expense is recorded against one.')
      console.warn('[WARN: AddExpenseForm.js]: No budgets available to add the expense to')
      return
    }
    if (loadingBudgets) {
      setFormError('Your budgets are still loading, please try again in a moment.')
      console.warn('[WARN: AddExpenseForm.js]: Submit attempted while the budgets were still loading')
      return
    }

    /* Repeated here rather than left to the browser alone, so a submission that
    reaches this point with a field missing, from native validation being
    bypassed, is reported on screen and the field is focused */
    if (tripEmpty) {
      setFormError('Please select the trip this expense belongs to.')
      console.warn('[WARN: AddExpenseForm.js]: No trip selected')
      document.getElementById('newExpenseTrip')?.focus()
      return
    }
    if (titleEmpty) {
      setFormError('Please enter a title for the expense.')
      console.warn('[WARN: AddExpenseForm.js]: Expense title missing')
      document.getElementById('newExpenseTitle')?.focus()
      return
    }
    if (amountEmpty || amountInvalid) {
      setFormError('Please enter an amount greater than 0.')
      console.warn('[WARN: AddExpenseForm.js]: Expense amount missing or not a positive number')
      document.getElementById('newExpenseAmount')?.focus()
      return
    }
    if (currencyEmpty) {
      setFormError('Please select the currency the expense was paid in.')
      console.warn('[WARN: AddExpenseForm.js]: No currency selected')
      document.getElementById('newExpenseCurrency')?.focus()
      return
    }
    if (categoryEmpty) {
      setFormError('Please select the category of the expense.')
      console.warn('[WARN: AddExpenseForm.js]: No category selected')
      document.getElementById('newExpenseCategory')?.focus()
      return
    }
    if (paymentMethodEmpty) {
      setFormError('Please select how the expense was paid.')
      console.warn('[WARN: AddExpenseForm.js]: No payment method selected')
      document.getElementById('newExpensePaymentMethod')?.focus()
      return
    }
    if (dateEmpty) {
      setFormError('Please choose the date the money was spent.')
      console.warn('[WARN: AddExpenseForm.js]: Expense date missing')
      document.getElementById('newExpenseDate')?.focus()
      return
    }
    /* The browser cannot be relied on to enforce max on a typed date, so the
    rule the form states under the input is checked here as well */
    if (dateInFuture) {
      setFormError('The expense date cannot be in the future.')
      console.warn('[WARN: AddExpenseForm.js]: Expense date is in the future')
      document.getElementById('newExpenseDate')?.focus()
      return
    }

    setFormError(null)
    console.log('[INFO: AddExpenseForm.js]: Adding new expense');
    addExpense?.()
  }

  const handleClear = () => {
    const confirmClear = window.confirm(// Ask the user to confirm before clearing all input fields
      "Are you sure you want to clear the form?"
    );
    if (!confirmClear) return;
    // Reset to the same empty shape the page initialised the form with
    setNewExpenseData(emptyForm);
    setTouched({
      tripId: false,
      title: false,
      amount: false,
      currency: false,
      category: false,
      paymentMethod: false,
      date: false,
    });
    setFormError(null);
  }

  // ========= IDs USED BY aria-describedby =========
  const tripErrorId = 'addExpTripError';// ID used for the trip error message
  const titleErrorId = 'addExpTitleError';// ID used for the title error message
  const amountErrorId = 'addExpAmountError';// ID used for the amount error message
  const amountInvalidErrorId = 'addExpAmountInvalidError';// ID used for the amount value error message
  const currencyErrorId = 'addExpCurrencyError';// ID used for the currency error message
  const conversionNoteId = 'addExpConversionNote';// ID used for the converted amount note
  const categoryErrorId = 'addExpCategoryError';// ID used for the category error message
  const paymentMethodErrorId = 'addExpPaymentMethodError';// ID used for the payment method error message
  const notesHelpId = 'addExpNotesHelp';// ID used for the notes hint
  const isPaidHelpId = 'addExpIsPaidHelp';// ID used for the is paid hint
  const dateErrorId = 'addExpDateError';// ID used for the date error message
  const dateHelpId = 'dateMsg';// ID used for the date rule shown while the input has focus
  const dateInFutureErrorId = 'addExpDateInFutureError';// ID used for the future date error message
  const noBudgetsId = 'addExpNoBudgets';// ID used for the no budgets message
  const formErrorId = 'addExpFormError';// ID used for the form level error message
  const serverErrorId = 'addExpServerErrors';// ID used for the block listing the server's field errors

  // Joins the IDs that are currently rendered into a single aria-describedby value
  const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

  /* The server returns its errors keyed by field name. An embedded expense is
  keyed by its position in the parent, for example 'expenses.3.amount', and the
  route strips that prefix before it answers, so the keys here are the plain
  field names the inputs are named by */
  const serverErrors = Object.entries(fieldErrors || {});
  const hasServerError = (path) => Boolean(fieldErrors?.[path]);

  // =============JSX RENDERING============
  return (
    <form id='add-expense-form' method='POST' onSubmit={handleAddExpense} aria-labelledby='formHeading'>
      <div id='formHeadingBlock'>
        <h3 id='formHeading'>ADD EXPENSE</h3>
      </div>
      {/* FORM INPUT */}
      <div id='addExp-input-details'>
      {/* GROUP 1: USERNAME + TRIP + TITLE */}
        <div id='addExp-group1'>
        {/* STACK 1 */}
            <Stack gap={3} id='addExpenseStack1'>
            {/* USERNAME (READ ONLY)*/}
      <div className="p-2" id='addExp-Block1'>
          <div className='addExp-input-div'>
            <label className='addExp-label' htmlFor='newExpenseUsername'>USERNAME:</label>
            <div className='input-div'>
              {/* Read only, and never submitted: the API takes the owner from
              the token and reads the username from the account, so this is only
              here to confirm who the expense is being logged for */}
              <input
                className='input'
                id='newExpenseUsername'
                readOnly
                value={`${currentUser?.username || 'USERNAME'}`}
                // ARIA ATTRIBUTES:
                aria-required='true'
                aria-readonly='true'
              />
              <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
            </div>
          </div>
          {/* TRIP */}
          <div className='addExp-input-div'>
            <label className='addExp-label' htmlFor='newExpenseTrip'>TRIP:</label>
            <div className='input-div'>
              <select
                className='input'
                id='newExpenseTrip'
                required
                name='tripId'
                value={newExpenseData.tripId || ''}
                onChange={handleInputChange}
                onBlur={() => markTouched('tripId')}
                /* Nothing to choose from until the budgets have loaded, and
                nothing at all to choose while no trip has one */
                disabled={submitting || loadingBudgets || noBudgets}
                // ARIA ATTRIBUTES:
                aria-required='true'
                aria-busy={loadingBudgets}
                aria-invalid={showTripError || hasServerError('tripId') ? 'true' : 'false'}
                aria-describedby={describedBy(
                  showTripError && tripErrorId,
                  noBudgets && noBudgetsId,
                  hasServerError('tripId') && serverErrorId
                )}
              >
              {/* MAP THE TRIPS THAT HAVE A BUDGET, since an expense is embedded
              in one. The value submitted is the trip's id, the label is its
              title, because the API finds the budget by that id */}
                {loadingBudgets && <option value=''>LOADING TRIPS...</option>}
                {!loadingBudgets && noBudgets && <option value=''>NO BUDGETS YET</option>}
                {!loadingBudgets && !noBudgets && (
                  <>
                    <option value=''>SELECT</option>
                    {budgets.map(({ tripId, tripTitle }) => (
                      <option key={tripId} value={tripId}>{tripTitle}</option>
                    ))}
                  </>
                )}
              </select>
              <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
              {/* TRIP ERROR MESSAGE */}
              {showTripError && (
                <p id={tripErrorId} className='visually-hidden' role='alert'>Trip is required.</p>
              )}
            </div>

          </div>
          {/* NO BUDGETS MESSAGE, shown on screen because the select has nothing
          to offer and the required attribute cannot report it */}
          {noBudgets && (
            <p id={noBudgetsId} className='formErrorMessage' role='alert'>
              <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
              Set a budget for a trip before adding an expense
            </p>
          )}
      </div>
      {/* TITLE */}
      <div className="p-2" id='addExp-Title-block'>
        <label className='addExp-label' htmlFor='newExpenseTitle'>TITLE:</label>
        <div>
          <input
            className='input'
            id='newExpenseTitle'
            type='text'
            required
            placeholder='TITLE'
            maxLength={TITLE_MAX}
            autoComplete='off'
            name='title'
            value={newExpenseData.title || ''}
            onChange={handleInputChange}
            onBlur={() => markTouched('title')}
            // ARIA ATTRIBUTES
            aria-required='true'
            aria-invalid={showTitleError || hasServerError('title') ? 'true' : 'false'}
            aria-describedby={describedBy(
              showTitleError && titleErrorId,
              hasServerError('title') && serverErrorId
            )}
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
            {/* TITLE ERROR MESSAGE */}
            {showTitleError && (
              <p id={titleErrorId} className='visually-hidden' role='alert'>Expense title is required.</p>
            )}
        </div>
      </div>
    </Stack>
        </div>
        {/* GROUP 2: AMOUNT + CURRENCY + CATEGORY + PAYMENT METHOD */}
        <div id='addExp-group2'>
        {/* STACK 2 */}
          <Stack gap={3} id='addExpenseStack2'>
      <div className="p-2" id='addExp-Finance-block1'>
      {/* AMOUNT */}
      <div className='addExp-input-div'>
<label className='addExp-label' htmlFor='newExpenseAmount'>AMOUNT:</label>
<div className='input-div'>
    <input
      className='input'
      id='newExpenseAmount'
      type='number'
      required
      placeholder='0.00'
      step='0.01'
      min='0.01'
      name='amount'
      value={newExpenseData.amount ?? ''}
      onChange={handleInputChange}
      onBlur={() => markTouched('amount')}
      // ARIA ATTRIBUTES
      aria-required='true'
      aria-invalid={showAmountError || showAmountInvalidError || hasServerError('amount') ? 'true' : 'false'}
      aria-describedby={describedBy(
        showAmountError && amountErrorId,
        showAmountInvalidError && amountInvalidErrorId,
        hasServerError('amount') && serverErrorId
      )}
    />
<small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
</div>
        {/* AMOUNT ERROR MESSAGE */}
        {showAmountError && (
          <p id={amountErrorId} className='visually-hidden' role='alert'>Amount is required.</p>
        )}
      </div>
      {/* PAYMENT METHOD */}
        <div className='addExp-input-div'>
          <label className='addExp-label' htmlFor='newExpensePaymentMethod'>PAYMENT METHOD:</label>
          <div className='input-div'>
            <select
              className='input'
              id='newExpensePaymentMethod'
              required
              name='paymentMethod'
              value={newExpenseData.paymentMethod || ''}
              onChange={handleInputChange}
              onBlur={() => markTouched('paymentMethod')}
              disabled={submitting}
              // ARIA ATTRIBUTES:
              aria-required='true'
              aria-invalid={showPaymentMethodError || hasServerError('paymentMethod') ? 'true' : 'false'}
              aria-describedby={describedBy(
                showPaymentMethodError && paymentMethodErrorId,
                hasServerError('paymentMethod') && serverErrorId
              )}
            >
            {/* USE SELECT AS THE PLACEHOLDER. The value submitted is the
            schema's spelling, the label is the one shown */}
              <option value=''>SELECT</option>
              {PAYMENT_METHODS.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
            {/* PAYMENT METHOD ERROR MESSAGE */}
            {showPaymentMethodError && (
              <p id={paymentMethodErrorId} className='visually-hidden' role='alert'>Payment method is required.</p>
            )}
          </div>
        </div>
      </div>
      {/* The amount has to be a positive number, which the input's min cannot
      enforce on a typed value, so it is reported on screen */}
      {showAmountInvalidError && (
        <p id={amountInvalidErrorId} className='formErrorMessage' role='alert'>
          <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
          Amount must be greater than 0
        </p>
      )}
      <div className="p-2" id='addExp-Finance-block2'>
      {/* CURRENCY */}
        <div className='addExp-input-div'>
          <label className='addExp-label' htmlFor='newExpenseCurrency'>CURRENCY:</label>
          <div className='input-div'>
            <select
            className='input'
            id='newExpenseCurrency'
            required
            name='currency'
            value={newExpenseData.currency || ''}
            onChange={handleInputChange}
            onBlur={() => markTouched('currency')}
            disabled={submitting}
            // ARIA ATTRIBUTES:
            aria-required='true'
            aria-invalid={showCurrencyError || hasServerError('currency') ? 'true' : 'false'}
            aria-describedby={describedBy(
              showConversionNote && conversionNoteId,
              showCurrencyError && currencyErrorId,
              hasServerError('currency') && serverErrorId
            )}
            >
            {/* MAP ALL CURRENCIES AVAILABLE IN THE CURRENCIES ARRAY
            WITH SELECT AS THE PLACEHOLDER. Labelled 'CODE - Name' by
            currencyOptionLabel, the same as the converter's dropdowns */}
              <option value=''>SELECT</option>
              {currencyOptions.map(({ code, name }) => (
                <option key={code} value={code}>{currencyOptionLabel(code, name)}</option>
              ))}
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
            {/* CURRENCY ERROR MESSAGE */}
            {showCurrencyError && (
              <p id={currencyErrorId} className='visually-hidden' role='alert'>Expense currency is required.</p>
            )}
          </div>
        </div>
        {/* EXPENSE CATEGORY */}
         <div className='addExp-input-div'>
            <label className='addExp-label' htmlFor='newExpenseCategory'>EXPENSE CATEGORY:</label>
<div className='input-div'>
            <select
            className='input'
            id='newExpenseCategory'
            required
            name='category'
            value={newExpenseData.category || ''}
            onChange={handleInputChange}
            onBlur={() => markTouched('category')}
            disabled={submitting}
            // ARIA ATTRIBUTES:
            aria-required='true'
            aria-invalid={showCategoryError || hasServerError('category') ? 'true' : 'false'}
            aria-describedby={describedBy(
              showCategoryError && categoryErrorId,
              hasServerError('category') && serverErrorId
            )}
            >
            {/* MAP ALL CATEGORIES IN THE THE EXPENSE_CATEGORIES ARRAY
            WITH SELECT AS THE PLACEHOLDER. The key is what is stored, and is
            also the key of the matching limit on the parent budget */}
              <option value=''>SELECT</option>
              {EXPENSE_CATEGORIES.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
            {/* CATEGORY ERROR MESSAGE */}
            {showCategoryError && (
              <p id={categoryErrorId} className='visually-hidden' role='alert'>Expense category is required.</p>
            )}
          </div>

        </div>
      </div>
      {/* CONVERTED AMOUNT NOTE. convertedAmount is not a form field: the API
      applies the rate, so the form says what will happen rather than asking */}
      {showConversionNote && (
        <div className="p-2">
          <p id={conversionNoteId} className='infoText'>
            {`CONVERTED INTO ${selectedBudget.baseCurrency}, THE BUDGET'S BASE CURRENCY, AT THE RATE ON THE DAY IT IS ADDED`}
          </p>
        </div>
      )}
    </Stack>
        </div>
        {/* GROUP 3: OPTIONAL NOTES + ISPAID CHECKBOX + DATE */}
        <div id='addExp-group3'>
           <Stack gap={3} id='addExpenseStack3'>
      <div className="p-2" id='addExp-Notes-Block'>
      <div className='addExp-input-div'>
      <label className='addExp-label' htmlFor='newExpenseNotes'>NOTES:</label>
        <div className='input-div'>
          <textarea
            className='addExp-textInput'
            id='newExpenseNotes'
            placeholder='OPTIONAL NOTES'
            maxLength={NOTES_MAX}
            name='notes'
            value={newExpenseData.notes || ''}
            onChange={handleInputChange}
            // ARIA ATTRIBUTES:
            aria-label='Optional notes about the expense'
            aria-invalid={hasServerError('notes') ? 'true' : 'false'}
            aria-describedby={describedBy(
              notesHelpId,
              hasServerError('notes') && serverErrorId
            )}
          />
        </div>
        <small id={notesHelpId} className='infoText'>{`OPTIONAL, UP TO ${NOTES_MAX} CHARACTERS`}</small>
      </div>
      </div>
      <div className="p-2" >
{/* IS PAID */}
        <div className='addExp-input-div'>
          <label className='addExp-label' htmlFor='newExpenseIsPaid'>IS PAID:</label>
          <div className='input-div'>
            {/* Ticked by default, matching the schema. Unticking it records a
            committed but unsettled cost, such as an unpaid deposit, which is
            still counted against the budget */}
            <input
              type='checkbox'
              id='newExpenseIsPaid'
              name='isPaid'
              checked={Boolean(newExpenseData.isPaid)}
              onChange={handleInputChange}
              // ARIA ATTRIBUTES:
              aria-describedby={isPaidHelpId}
            />
          </div>
          <small id={isPaidHelpId} className='infoText'>UNTICK FOR A COST OWED BUT NOT YET PAID</small>
        </div>
      </div>

    </Stack>
    <Stack direction="horizontal" gap={3} id='addExp-dateStack'>
      {/* DATE: CANNOT BE IN THE FUTURE */}
      <div className="p-2" id='addExp-date-block'>
        <label className='addExp-label' htmlFor='newExpenseDate'>DATE:</label>
        <div className='input-div'>
          <input
            className='input'
            id='newExpenseDate'
            type='date'
            required
            /* An expense records money already spent, so the picker is stopped
            at today. The typed case is caught by dateInFuture */
            max={today}
            name='date'
            value={newExpenseData.date || ''}
            onChange={handleInputChange}
            onFocus={() => setDateMessage(true)}
            onBlur={() => {
              setDateMessage(false)
              markTouched('date')
            }}
            // ARIA ATTRIBUTES:
            aria-required='true'
            aria-invalid={showDateError || showDateInFutureError || hasServerError('date') ? 'true' : 'false'}
            aria-describedby={describedBy(
              /* Only referenced while it is on screen: the hint is rendered
              from the focus that this attribute is read on */
              dateMessage && dateHelpId,
              showDateError && dateErrorId,
              showDateInFutureError && dateInFutureErrorId,
              hasServerError('date') && serverErrorId
            )}
          />
          <small><Asterisk color='#C22419' fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
          {/* DATE ERROR MESSAGE */}
          {showDateError && (
            <p id={dateErrorId} className='visually-hidden' role='alert'>Expense date is required.</p>
          )}
        </div>
        {/* The rule the max attribute enforces, reported on screen for a date
        that was typed rather than picked */}
        {showDateInFutureError && (
          <p id={dateInFutureErrorId} className='formErrorMessage' role='alert'>
            <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
            The date cannot be in the future
          </p>
        )}
      </div>
      <div className="p-2 ms-auto"></div>
      {dateMessage && (
          <div className='p-2' id={dateHelpId}>
            <p className='infoText'>DATE CANNOT BE IN THE FUTURE</p>
          </div>
        )}
    </Stack>

        </div>
      </div>
      {/* END OF INPUT */}
      {/* FORM LEVEL ERROR, raised by handleAddExpense when submit is blocked */}
      {formError && (
        <div id={formErrorId} className='formErrorBlock' role='alert' aria-live='assertive'>
          <p className='formErrorMessage'>
            <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
            {formError}
          </p>
        </div>
      )}
      {/* SERVER SIDE FIELD ERRORS, returned when the API rejects the expense.
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
      {/* GROUP 4: REQUIRED INFO MESSAGE + SUBMIT BTN + CLEAR BTN */}
      <div id='addExp-group4'>
      {/* STACK 4 */}
          <Stack direction="horizontal" gap={3} id='addExpenseStack4'>
             <div className="p-2" id='requiredInfo'>
                <p className='infoMsg'>
                    <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
                </p>
              </div>
            <div className="p-2 ms-auto">
              <Button
                id='addExpBtn'
                type='submit'
                variant='light'
                // Disabled while the request runs, so the expense cannot be added twice
                disabled={submitDisabled}
                // ARIA ATTRIBUTES:
                aria-label={submitting ? 'Adding expense, please wait' : 'Add expense'}
                aria-disabled={submitDisabled}
                aria-busy={submitting}
                aria-describedby={describedBy(
                  formError && formErrorId,
                  noBudgets && noBudgetsId,
                  serverErrors.length > 0 && serverErrorId
                )}
              >
                {submitting ? 'ADDING EXPENSE...' : 'ADD EXPENSE'}
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
                aria-label='Clear add expense form'
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
