// EditExpense.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useMemo, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/EditExpense.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
// IMPORT ICONS FROM LUCIDE-REACT
import { Bug } from 'lucide-react';
// IMPORT SHARED DATA AND UTILITY FUNCTIONS
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../data/financeData';
import { FALLBACK_CURRENCIES, currencyOptionLabel } from '../util/currencyFunc';
import { todayInputValue, toDateInputValue } from '../util/dateFunctions';
import { NOT_AVAILABLE, toLongDate, toMoney } from '../util/formatCalculations';

/* The maxlength values the expense subdocument stores, repeated here so each
input stops accepting characters at the point the API would refuse them */
const TITLE_MAX = 100;
const NOTES_MAX = 300;

/* The empty form used by the clear button when the page does not supply one.
Kept in sync with EMPTY_EXPENSE_EDIT in pages/Expenses.js, which is passed in as
a prop. Every field opens blank, which is this form's way of saying 'leave it as
it is stored' — except isPaid, which is a checkbox and so has to open on what the
expense currently holds. The trip is held as tripId, because that is what the API
finds the parent budget by. The owner is left out on purpose, and so is
convertedAmount: the API works that out from the rate rather than reading it */
const BLANK_EDIT = {
  tripId: '',
  title: '',
  amount: '',
  currency: '',
  category: '',
  date: '',
  notes: '',
  paymentMethod: '',
  isPaid: true,
};

//EditExpense function component
export default function EditExpense(
  {//PROPS PASSED FROM PARENT COMPONENT (Expenses.js)
    currentUser,
    /* The expense being edited, read back from the API by the page when the form
    was opened, which is what every field reports as the value it would be left
    with. Without one there is nothing to edit */
    expense,
    editExpenseData = BLANK_EDIT,
    setEditExpenseData,
    editExpense,
    // True while the edit request is in flight, set by the Expenses page
    submitting = false,
    /* Field keyed messages from the server, for rules the browser cannot check.
    Keyed by the field name, so an amount arrives as 'amount' */
    fieldErrors = {},
    emptyForm = BLANK_EDIT,
    /* The logged in user's budgets, loaded by the Expenses page as
    { tripId, tripTitle, baseCurrency }. An expense is embedded in one of them,
    so these are the only trips it can be moved to: a trip with no budget has
    nowhere to keep it */
    budgets = [],
    loadingBudgets = false,
    /* Offered until GET /api/currencies answers, and kept if it never does. The
    same list the add expense form and the converter use */
    currencyOptions = FALLBACK_CURRENCIES,
  }) {
    // =========STATE VARIABLES=============
    const [formError, setFormError] = useState(null)// Form level error shown above the submit button

    //========== WHAT THE EXPENSE CURRENTLY HOLDS ====================
    const storedTitle = expense?.title || '';
    const storedTrip = expense?.tripTitle || '';
    // Held as a string, the id arrives as one and is compared against the select's value
    const storedTripId = expense?.tripId ? String(expense.tripId) : '';
    const storedCurrency = expense?.currency || '';
    const storedCategory = expense?.category || '';
    const storedPaymentMethod = expense?.paymentMethod || '';
    const storedIsPaid = Boolean(expense?.isPaid);
    // The stored date as a date input writes it, for the hint under the input
    const storedDate = toDateInputValue(expense?.date, '');

    /* The two enums as the form names them, so a hint can report what is stored
    the way the select offers it: 'credit_card' is stored, 'CREDIT CARD' shown */
    const storedCategoryLabel = EXPENSE_CATEGORIES
      .find(({ key }) => key === storedCategory)?.label || '';
    const storedPaymentMethodLabel = PAYMENT_METHODS
      .find(({ key }) => key === storedPaymentMethod)?.label || '';

    /* An expense can only be edited once one has been opened from the expenses
    list. Checked on the id rather than the object, so a value passed without one
    is treated as no expense at all */
    const noExpense = !expense?._id;

    /* Today, as the date input writes it. Used for the max attribute and for the
    future date check below, which compare as strings because this format sorts
    the same way the dates themselves do */
    const today = useMemo(() => todayInputValue(), []);

    /* The trips this expense could be moved to: every trip with a budget except
    the one it is already filed against, which is what the select's first option
    keeps. Checked once the budgets have finished loading, so an empty list mid
    request is not reported as nowhere to move it to */
    const otherBudgets = useMemo(
      () => budgets.filter(({ tripId }) => String(tripId) !== storedTripId),
      [budgets, storedTripId]
    );
    const noOtherTrips = !loadingBudgets && otherBudgets.length === 0;

    /* The budget the expense would end up on: the one it is already embedded in
    while the select is left alone, and the chosen trip's once it names another.
    Its base currency is what the amount is converted into, which is what the
    conversion note below reports */
    const targetBudget = useMemo(() => {
      const tripId = String(editExpenseData.tripId || '').trim() || storedTripId;
      return budgets.find((budget) => String(budget.tripId) === String(tripId)) || null;
    },[budgets, editExpenseData.tripId, storedTripId]);

    // The currency the expense would be left in, which is the stored one until it is changed
    const targetCurrency = String(editExpenseData.currency || '').trim() || storedCurrency;

    /* Said whenever the expense will be held in a currency other than the one
    its budget is totalled in, because the API reworks the converted amount from
    a live rate whenever the amount, the currency or the budget moves */
    const showConversionNote = Boolean(
      targetBudget?.baseCurrency
      && targetCurrency
      && targetBudget.baseCurrency !== targetCurrency
    );

    //========== VALUE VALIDATION ====================
    // An amount that was filled in has to be a positive number, the same as on a create
    const amountInvalid = useMemo(() => {
      const amount = String(editExpenseData.amount ?? '').trim();
      if (!amount) return false;// Left blank, so the stored amount stays as it is
      return Number.isNaN(Number(amount)) || Number(amount) <= 0;
    },[editExpenseData.amount]);

    /* An expense records money already spent, so a date filled in cannot be in
    the future. The input's own max cannot be relied on for a typed date */
    const dateInFuture = useMemo(
      () => Boolean(editExpenseData.date) && String(editExpenseData.date) > today,
      [editExpenseData.date, today]
    );

    //========== CHANGE VALIDATION ====================
    /* Whether anything was actually filled in. A PATCH with nothing in it is
    answered by the API with 'There is nothing to update', so it is reported here
    instead of being sent. The four selects and the checkbox only count when they
    disagree with what is stored: leaving one on the value the expense already
    holds is not a change, which is the same judgement the API makes of it */
    const hasChanges = useMemo(() => {
      const tripId = String(editExpenseData.tripId || '').trim();
      const currency = String(editExpenseData.currency || '').trim();
      const category = String(editExpenseData.category || '').trim();
      const paymentMethod = String(editExpenseData.paymentMethod || '').trim();

      return Boolean(
        String(editExpenseData.title || '').trim() ||
        String(editExpenseData.amount ?? '').trim() ||
        String(editExpenseData.notes || '').trim() ||
        String(editExpenseData.date || '').trim() ||
        (tripId && tripId !== storedTripId) ||
        (currency && currency !== storedCurrency) ||
        (category && category !== storedCategory) ||
        (paymentMethod && paymentMethod !== storedPaymentMethod) ||
        Boolean(editExpenseData.isPaid) !== storedIsPaid
      );
    },[editExpenseData, storedTripId, storedCurrency, storedCategory, storedPaymentMethod, storedIsPaid]);

    /* Blocked while a request is running, and while there is no expense open to
    edit: without one there is nothing for the changes to be written to */
    const submitDisabled = submitting || noExpense;

    //================EVENT HANDLERS========================
    // Function to handle input changes in the form
    const handleInputChange = (event) => {
      const { name, value, type, checked } = event.target;// Extract the input name and value

      setFormError(null);// Any edit clears the form level error
      /* isPaid is the only checkbox on the form, and a checkbox reports itself
      through checked rather than value */
      setEditExpenseData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    };

    /* Only the rules the browser cannot enforce on its own are checked here.
    maxLength, min and type constraints are still handled by the native
    validation on each input, which blocks submit before this runs. No field is
    required: a blank one is a field being left as it is stored */
    const handleEditExpense = (event) => {
      event.preventDefault()
      // Ignored while a request is already running, so the form cannot double post
      if (submitting) return

      // Conditional rendering to check an expense is open for editing
      if (noExpense) {
        setFormError('No expense is open for editing. Please choose one from the list.')
        console.warn('[WARN: EditExpense.js]: No expense open for editing')
        return
      }
      /* Nothing was filled in, so there is no change to send. Reported here
      rather than by the API, which would answer the empty PATCH with a 400 */
      if (!hasChanges) {
        setFormError('Nothing has been changed yet. Fill in only the fields you want to update.')
        console.warn('[WARN: EditExpense.js]: Submitted with no changes')
        return
      }
      // An amount that was filled in has to be a positive number
      if (amountInvalid) {
        setFormError('Please enter an amount greater than 0, or leave it blank to keep the amount as it is.')
        console.warn('[WARN: EditExpense.js]: Expense amount is not a positive number')
        document.getElementById('editExpenseAmount')?.focus()
        return
      }
      /* The browser cannot be relied on to enforce max on a typed date, so the
      rule the form states under the input is checked here as well */
      if (dateInFuture) {
        setFormError('The expense date cannot be in the future.')
        console.warn('[WARN: EditExpense.js]: Expense date is in the future')
        document.getElementById('editExpenseDate')?.focus()
        return
      }

      setFormError(null)
      console.log('[INFO: EditExpense.js]: Editing expense', expense._id);
      editExpense?.()
    }

    // Function to clear the form
    const handleClear = () => {
      const confirmClear = window.confirm(// Ask the user to confirm before clearing all input fields
        "Are you sure you want to clear the form?"
      )
      if (!confirmClear) return;

      /* Reset to the same empty shape, which for this form means every field
      left as the expense is stored, the checkbox included */
      setEditExpenseData(emptyForm)
      setFormError(null)
    }

    // ========= IDs USED BY aria-describedby =========
    const tripHelpId = 'editExpTripHelp';// ID used for the stored trip hint
    const titleHelpId = 'editExpTitleHelp';// ID used for the stored title hint
    const amountHelpId = 'editExpAmountHelp';// ID used for the stored amount hint
    const amountInvalidErrorId = 'editExpAmountInvalidError';// ID used for the amount value error message
    const paymentMethodHelpId = 'editExpPaymentMethodHelp';// ID used for the stored payment method hint
    const currencyHelpId = 'editExpCurrencyHelp';// ID used for the stored currency hint
    const conversionNoteId = 'editExpConversionNote';// ID used for the converted amount note
    const categoryHelpId = 'editExpCategoryHelp';// ID used for the stored category hint
    const notesHelpId = 'editExpNotesHelp';// ID used for the stored notes hint
    const isPaidHelpId = 'editExpIsPaidHelp';// ID used for the stored isPaid hint
    const dateHelpId = 'editExpDateHelp';// ID used for the stored date hint
    const dateInFutureErrorId = 'editExpDateInFutureError';// ID used for the future date error message
    const noExpenseId = 'editExpNoExpense';// ID used for the no expense open message
    const formErrorId = 'editExpFormError';// ID used for the form level error message
    const serverErrorId = 'editExpServerErrors';// ID used for the block listing the server's field errors

    // Joins the IDs that are currently rendered into a single aria-describedby value
    const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

    /* The server returns its errors keyed by field name. Listed as entries for
    rendering, and looked up by name to mark the matching input invalid */
    const serverErrors = Object.entries(fieldErrors || {});
    const hasServerError = (field) => Boolean(fieldErrors?.[field]);

  //==========JSX RENDERING============
  return (
    <form
      id='editExpenseForm'
      method='PATCH'
      aria-describedby='editExpenseName'
      onSubmit={handleEditExpense}
    >
      <div id='formHeadingBlock'>
      {/* FORM HEADING: EDIT EXPENSE + the expense's title. The expense being
      edited is named in the heading, so the form cannot be filled in for one
      expense while another is the one open */}
      <span className='formHeadingSpan' id='editExpenseName'>
      <h3 id='formHeading'>EDIT EXPENSE:</h3>
      <h3 className='formItem'>{storedTitle || NOT_AVAILABLE}</h3>
      </span>
      </div>
      <div id='editExpenseInfoDiv'>
            {/* Form Input Message: says once what every field on the form then
            relies on, rather than repeating 'leave blank to keep' under each */}
            <p className='editInfoMsg'>
            <i><small>Only fill in what you want to change. Anything left blank stays as it is.</small></i>
            </p>
        </div>
        {/* NO EXPENSE OPEN MESSAGE, shown on screen because there is no single
        input this can be reported against: with no expense open there is nothing
        for any of the fields below to be written to */}
        {noExpense && (
          <div id='editExpNoExpenseBlock'>
            <p id={noExpenseId} className='formErrorMessage' role='alert'>
              <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false' />
              No expense is open for editing. Please choose one from the expenses list.
            </p>
          </div>
        )}
        {/* =========EDIT EXPENSE INPUT======== */}
        <div id='editExpenseInput'>
        {/* GROUP 1 */}
          <div id='editExpGroup1'>
          {/* STACK 1 */}
             <Stack gap={3} id='editExpStack1'>
      {/* USERNAME: read only, and never submitted. The API leaves the stored
      username as it is, so this is only here to confirm whose expense is being
      edited */}
      <div className="p-2 visually-hidden" id='editExpUsernameBlock'>
        <label className='editExpLabel' htmlFor='editExpenseUsername'>USERNAME:</label>
        <input
          className='input'
          id='editExpenseUsername'
          readOnly
          value={expense?.username || currentUser?.username || ''}
          // ARIA ATTRIBUTES:
          aria-readonly='true'
        />
      </div>
      <div className="p-2" id='editExpTripBlock'>
        <label className='editExpLabel' htmlFor='editExpenseTrip'>EDIT TRIP:</label>
        <select
        className='input'
        id='editExpenseTrip'
        name='tripId'
        value={editExpenseData.tripId || ''}
        onChange={handleInputChange}
        /* Nothing to choose from until the budgets have loaded, and nowhere to
        move the expense to when no other trip has a budget to keep it */
        disabled={submitting || noExpense || loadingBudgets || noOtherTrips}
        // ARIA ATTRIBUTES:
        aria-required='false'
        aria-busy={loadingBudgets}
        aria-invalid={hasServerError('tripId') ? 'true' : 'false'}
        aria-describedby={describedBy(
          tripHelpId,
          hasServerError('tripId') && serverErrorId
        )}
        >
        {/* MAP ALL TRIPS WITH A BUDGET and USE THE CURRENT TRIP AS THE
        PLACEHOLDER. An expense is embedded in the budget of its trip, so only a
        trip that already has one can hold it. The first option is the trip the
        expense is already filed against and carries no value, so leaving the
        select on it sends no trip with the edit */}
          {loadingBudgets && <option value=''>LOADING TRIPS...</option>}
          {!loadingBudgets && (
            <>
              <option value=''>
                {storedTrip ? `KEEP: ${storedTrip.toUpperCase()}` : 'SELECT'}
              </option>
              {/* The trip the expense is already on is left out: it is what the
              option above keeps. The value submitted is each trip's id, because
              that is what the API finds the budget by */}
              {otherBudgets.map(({ tripId, tripTitle }) => (
                <option key={tripId} value={tripId}>{tripTitle}</option>
              ))}
            </>
          )}
        </select>
        <small id={tripHelpId} className='infoText'>
          CURRENTLY: {storedTrip || NOT_AVAILABLE}
          {/* Said here rather than as an error, because keeping the trip the
          expense is filed against is a valid way to leave it */}
          {!loadingBudgets && noOtherTrips && ' — NO OTHER TRIP WITH A BUDGET TO MOVE IT TO'}
        </small>
      </div>
      <div className="p-2">
        <label className='editExpLabel' htmlFor='editExpenseTitle'>TITLE:</label>
        {/* The stored title is the placeholder rather than the value, so an
        untouched input sends nothing at all */}
        <input
          className='input'
          id='editExpenseTitle'
          type='text'
          placeholder={storedTitle || 'TITLE'}
          maxLength={TITLE_MAX}
          autoComplete='off'
          name='title'
          value={editExpenseData.title || ''}
          onChange={handleInputChange}
          disabled={submitting || noExpense}
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
    </Stack>
          </div>
          {/* GROUP 2 */}
          <div id='editExpGroup2'>
                <Stack gap={3} id='editExpStack2'>
      <div className="p-2">
        <div>
          <div className='input-div'>
            <label className='editExpLabel' htmlFor='editExpenseAmount'>AMOUNT:</label>
            <input
              className='input'
              id='editExpenseAmount'
              type='number'
              step='0.01'
              min='0.01'
              inputMode='decimal'
              placeholder={expense?.amount ?? '0.00'}
              name='amount'
              value={editExpenseData.amount ?? ''}
              onChange={handleInputChange}
              disabled={submitting || noExpense}
              // ARIA ATTRIBUTES:
              aria-required='false'
              aria-invalid={amountInvalid || hasServerError('amount') ? 'true' : 'false'}
              aria-describedby={describedBy(
                amountHelpId,
                amountInvalid && amountInvalidErrorId,
                hasServerError('amount') && serverErrorId
              )}
            />
            <small id={amountHelpId} className='infoText'>
              {/* Named by its code rather than shown with a symbol: an expense
              is paid in the currency of the day */}
              CURRENTLY: {toMoney(expense?.amount, storedCurrency)}
            </small>
          </div>
          <div className='input-div'>
            <label className='editExpLabel' htmlFor='editExpensePaymentMethod'>PAYMENT METHOD:</label>
            <select
              className='input'
              id='editExpensePaymentMethod'
              name='paymentMethod'
              value={editExpenseData.paymentMethod || ''}
              onChange={handleInputChange}
              disabled={submitting || noExpense}
              // ARIA ATTRIBUTES:
              aria-required='false'
              aria-invalid={hasServerError('paymentMethod') ? 'true' : 'false'}
              aria-describedby={describedBy(
                paymentMethodHelpId,
                hasServerError('paymentMethod') && serverErrorId
              )}
              >
              {/* The stored method is the first option and carries no value, so
              leaving the select on it sends nothing. The value submitted is the
              schema's own spelling, the label is the one shown */}
                <option value=''>
                  {storedPaymentMethodLabel ? `KEEP: ${storedPaymentMethodLabel}` : 'SELECT'}
                </option>
                {PAYMENT_METHODS
                  .filter(({ key }) => key !== storedPaymentMethod)
                  .map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
              </select>
              <small id={paymentMethodHelpId} className='infoText'>
                CURRENTLY: {storedPaymentMethodLabel || NOT_AVAILABLE}
              </small>
          </div>
        </div>
        {/* The amount has to be a positive number, which the input's min cannot
        enforce on a typed value, so it is reported on screen */}
        {amountInvalid && (
          <p id={amountInvalidErrorId} className='formErrorMessage' role='alert'>
            <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
            Amount must be greater than 0
          </p>
        )}
      </div>
      <div className="p-2">
      <div className='editExp-group'>
 <div className='input-div'>
          <label className='editExpLabel' htmlFor='editExpenseCurrency'>CURRENCY:</label>
          <select
            className='input'
            id='editExpenseCurrency'
            name='currency'
            value={editExpenseData.currency || ''}
            onChange={handleInputChange}
            disabled={submitting || noExpense}
            // ARIA ATTRIBUTES
            aria-required='false'
            aria-invalid={hasServerError('currency') ? 'true' : 'false'}
            aria-describedby={describedBy(
              currencyHelpId,
              showConversionNote && conversionNoteId,
              hasServerError('currency') && serverErrorId
            )}
            >
            {/* MAP ALL CURRENCIES AVAILABLE IN THE CURRENCIES ARRAY, with the
            stored one as the placeholder. Labelled 'CODE - Name' by
            currencyOptionLabel, the same as the add form's dropdown */}
            <option value=''>
              {storedCurrency ? `KEEP: ${storedCurrency}` : 'SELECT'}
            </option>
            {currencyOptions
              .filter(({ code }) => code !== storedCurrency)
              .map(({ code, name }) => (
                <option key={code} value={code}>{currencyOptionLabel(code, name)}</option>
              ))}
          </select>
          <small id={currencyHelpId} className='infoText'>
            CURRENTLY: {storedCurrency || NOT_AVAILABLE}
          </small>
        </div>
        <div className='input-div'>
          <label className='editExpLabel' htmlFor='editExpenseCategory'>CATEGORY:</label>
          <select
          className='input'
          id='editExpenseCategory'
          name='category'
          value={editExpenseData.category || ''}
          onChange={handleInputChange}
          disabled={submitting || noExpense}
          // ARIA ATTRIBUTES:
          aria-required='false'
          aria-invalid={hasServerError('category') ? 'true' : 'false'}
          aria-describedby={describedBy(
            categoryHelpId,
            hasServerError('category') && serverErrorId
          )}
          >
          {/* MAP ALL AVAILABLE CATEGORIES WITH THE CURRENT CATEGORY AS THE
          PLACEHOLDER. The key is what is stored, and is also the key of the
          matching limit on the parent budget */}
            <option value=''>
              {storedCategoryLabel ? `KEEP: ${storedCategoryLabel}` : 'SELECT'}
            </option>
            {EXPENSE_CATEGORIES
              .filter(({ key }) => key !== storedCategory)
              .map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
          </select>
          <small id={categoryHelpId} className='infoText'>
            CURRENTLY: {storedCategoryLabel || NOT_AVAILABLE}
          </small>
        </div>
      </div>
      {/* CONVERTED AMOUNT NOTE. convertedAmount is not a form field: the API
      reworks it from the rate whenever the amount, the currency or the budget
      the expense sits on moves, so the form says what will happen rather than
      asking */}
      {showConversionNote && (
        <p id={conversionNoteId} className='infoText'>
          {`CONVERTED INTO ${targetBudget.baseCurrency}, THE BUDGET'S BASE CURRENCY, AT THE RATE ON THE DAY THIS EDIT IS SAVED`}
        </p>
      )}
      </div>
    </Stack>
          </div>
          {/* GROUP 3 */}
          <div id='editExpGroup3'>
            <Stack direction="horizontal" gap={3} id='editExpStack3'>
      <div className="p-2" id='editExpTextInputBlock'>
        <label className='editExpLabel' htmlFor='editExpenseNotes'>NOTES:</label>
        <textarea
          className='editExpTextInput'
          id='editExpenseNotes'
          rows={3}
          placeholder={expense?.notes || 'OPTIONAL NOTES'}
          maxLength={NOTES_MAX}
          name='notes'
          value={editExpenseData.notes || ''}
          onChange={handleInputChange}
          disabled={submitting || noExpense}
          // ARIA ATTRIBUTES:
          aria-required='false'
          aria-invalid={hasServerError('notes') ? 'true' : 'false'}
          aria-describedby={describedBy(
            notesHelpId,
            hasServerError('notes') && serverErrorId
          )}
        />
      </div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2">
        {/* Optional on both forms, so what is stored is reported rather than
        asked for. Anything typed here replaces the notes as they stand */}
        <small id={notesHelpId} className='infoText'>
          {expense?.notes
            ? `CURRENTLY: ${expense.notes} — REPLACES THE NOTES AS THEY STAND`
            : `NO NOTES STORED YET — OPTIONAL, UP TO ${NOTES_MAX} CHARACTERS`}
        </small>
      </div>
    </Stack>
        <Stack direction="horizontal" gap={3} id='editExpStack4'>
      <div className="p-2">
        <label className='editExpLabel' htmlFor='editExpenseIsPaid'>IS PAID:</label>
        {/* The one field that cannot open blank: a checkbox has no way of saying
        'leave it as it is', so it opens on what the expense currently holds and
        is only sent once it disagrees with that */}
        <input
        type='checkbox'
        id='editExpenseIsPaid'
        name='isPaid'
        checked={Boolean(editExpenseData.isPaid)}
        onChange={handleInputChange}
        disabled={submitting || noExpense}
        // ARIA ATTRIBUTES:
        aria-describedby={describedBy(
          isPaidHelpId,
          hasServerError('isPaid') && serverErrorId
        )}
        />
        <small id={isPaidHelpId} className='infoText'>
          CURRENTLY: {storedIsPaid ? 'PAID' : 'NOT PAID YET'}
        </small>
      </div>
      <div className="p-2" id='editExpDateBlock'>
        <label className='editExpLabel' htmlFor='editExpenseDate'>EDIT DATE:</label>
        <input
          type='date'
          className='input'
          id='editExpenseDate'
          /* An expense records money already spent, so the picker is stopped at
          today. The typed case is caught by dateInFuture */
          max={today}
          name='date'
          value={editExpenseData.date || ''}
          onChange={handleInputChange}
          disabled={submitting || noExpense}
          // ARIA ATTRIBUTES:
          aria-required='false'
          aria-invalid={dateInFuture || hasServerError('date') ? 'true' : 'false'}
          aria-describedby={describedBy(
            dateHelpId,
            dateInFuture && dateInFutureErrorId,
            hasServerError('date') && serverErrorId
          )}
        />
        <small id={dateHelpId} className='infoText'>
          {/* Stored as a Date and arrives as an ISO string, so the date it was
          spent on is read through toLongDate rather than printed raw */}
          CURRENTLY: {storedDate ? toLongDate(expense?.date) : NOT_AVAILABLE} — CANNOT BE IN THE FUTURE
        </small>
      </div>
      <div className="p-2">
        {/* Ensure that the expense date is not in the future */}
        {dateInFuture && (
          <p id={dateInFutureErrorId} className='formErrorMessage' role='alert'>
            <Bug size={16} fontWeight={900} aria-hidden='true' focusable='false' />
            The date cannot be in the future
          </p>
        )}
      </div>
    </Stack>

          </div>
        </div>
        {/* =======END OF INPUT========== */}
        {/* FORM LEVEL ERROR, raised by handleEditExpense when submit is blocked */}
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
        <div id='editExpGroup4'>
          <Stack direction="horizontal" gap={3} id='editExpBtnStack'>
      <div className="p-2"/>
      <div className="p-2 ms-auto">
        <Button
        variant='warning'
        id='editExpBtn'
        type='submit'
        // Disabled while the request runs, so the expense cannot be edited twice
        disabled={submitDisabled}
        // ARIA ATTRIBUTES:
        aria-label={submitting
          ? 'Saving your changes, please wait'
          : `Save your changes to ${storedTitle || 'this expense'}`}
        aria-disabled={submitDisabled}
        aria-busy={submitting}
        aria-describedby={describedBy(
          formError && formErrorId,
          noExpense && noExpenseId,
          serverErrors.length > 0 && serverErrorId
        )}
        >
          {submitting ? 'SAVING...' : 'EDIT EXPENSE'}
        </Button>
      </div>
      <div className="p-2">
        {/* Clear Form Button: empties the form, which for this one means every
        field left as the expense is stored */}
        <Button
        variant='danger'
        id='clearFormBtn'
        type='button'
        disabled={submitting}// Disabled while the request runs, so a change cannot be cleared mid submit
        onClick={handleClear}
        // ARIA ATTRIBUTES:
        aria-label='Clear edit expense form'
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
