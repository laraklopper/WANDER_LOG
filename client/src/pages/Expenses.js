// Expenses.js Route '/exp'
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useEffect, useState } from 'react'
// IMPORT ROUTING HOOKS
import { useLocation, useNavigate } from 'react-router-dom'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/Expenses.css'
import '../css/pagesCss/PageSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
// IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'
import AddExpenseForm from '../components/AddExpenseForm';
import ExpensesList from '../components/ExpensesList';
import BudgetForm from '../components/BudgetForm';
import BudgetList from '../components/BudgetList';
// IMPORT UTILITY FUNCTIONS AND SHARED DATA
import { FALLBACK_CURRENCIES } from '../util/currencyFunc';
import { todayInputValue } from '../util/dateFunctions';
import { EXPENSE_CATEGORIES } from '../data/financeData';
import EditExpense from '../components/EditExpense';


/* Empty expense shape, used for the initial state and by the form's clear
button. The trip is held as tripId, because that is what the API finds the parent
budget by: an expense is embedded in the budget of its trip, so it is written
through that parent rather than stored on its own.

The three fields the schema defaults are pre-filled with those defaults rather
than left blank — the currency the app reports in, a cash payment and a settled
cost — so an untouched form submits what the schema would have stored anyway. The
date starts at today, which is when an expense is usually entered.

The owner is left out on purpose: the API takes the userId from the token and
reads the username off the account. convertedAmount is left out for a different
reason — it is not typed at all, the API applies the rate. */
const EMPTY_EXPENSE = {
  tripId: '',
  title: '',
  amount: '',
  currency: 'ZAR',
  category: '',
  date: todayInputValue(),
  notes: '',
  paymentMethod: 'cash',
  isPaid: true,
};

/* Empty budget shape, used for the initial state and by the budget form's clear
button. The trip is held as tripId, which is what the API sets the budget against
and what makes it unique: one budget per trip.

The nested categoryLimits and alerts are held as objects keyed the way the schema
keys them, so the form's inputs can be named by their schema path —
'categoryLimits.food', 'alerts.notifyOnExceed' — and one change handler covers
every one of them. The ten limit keys are read from EXPENSE_CATEGORIES rather
than typed out, the same list the add expense form's category select is built
from.

The two alerts are pre-filled with the schema's own defaults, so an untouched
form submits what it would have stored anyway. The daily budget and the ten
limits open blank on purpose: a blank limit means the category has no cap, and a
blank daily budget is what the schema's pre('save') hook works out from the total
and the length of the trip.

The owner is left out, the API takes the userId from the token, and so are the
totals: totalSpent, remaining and percentUsed are virtuals worked out from the
expenses rather than typed. */
const EMPTY_BUDGET = {
  tripId: '',
  baseCurrency: 'ZAR',
  totalBudget: '',
  dailyBudget: '',
  categoryLimits: EXPENSE_CATEGORIES.reduce((limits, { key }) => ({ ...limits, [key]: '' }), {}),
  alerts: { notifyAt80Percent: true, notifyOnExceed: true },
};

/* A saved budget in the shape the form holds it, for opening an edit against
what is currently stored.

An amount that is not set is stored as null — that is what the schema means by no
daily budget and by a category with no cap — and a null in a controlled number
input would make React warn and the field uncontrolled, so each one is turned
back into the empty string the input represents it with. The alerts are read as
booleans for the same reason: a checkbox is controlled by checked. */
const budgetToForm = (budget) => ({
  tripId: String(budget?.tripId ?? ''),
  baseCurrency: budget?.baseCurrency || 'ZAR',
  totalBudget: budget?.totalBudget ?? '',
  dailyBudget: budget?.dailyBudget ?? '',
  categoryLimits: EXPENSE_CATEGORIES.reduce((limits, { key }) => ({
    ...limits,
    [key]: budget?.categoryLimits?.[key] ?? '',
  }), {}),
  alerts: {
    notifyAt80Percent: budget?.alerts?.notifyAt80Percent ?? true,
    notifyOnExceed: budget?.alerts?.notifyOnExceed ?? true,
  },
});

// ============MAIN EXPENSES COMPONENT============
export default function Expenses(//Export default Expenses.js component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser,
    logout,
    setError
  }) {
    // ========ROUTING=============================
    /* The journal's ADD TRIP BUDGET link navigates here with
    { openBudgetForm: true } on the location, because a budget can only be set
    for a trip that already exists and the form that sets one is on this page.
    location is read for that flag and navigate is used to clear it again */
    const location = useLocation()
    const navigate = useNavigate()

    // ========STATE VARIABLES=============================
    // Variables to to toggle expense and budget Lists and details
    const [showBudgetList, setShowBudgetList] = useState(false)
    const [showExpList, setShowExpList] = useState(false)
    const [showEditExp, setShowEditExp] = useState(false)
    // State to toggle addExpenseForms and BudgetForms
    const [showAddExp, setShowAddExp] = useState(false)
    /* Read off the location on the first render rather than in an effect, so a
    page reached from that link opens with the budget form already showing
    instead of rendering the closed page for a frame first */
    const [showAddBudget, setShowAddBudget] = useState(
      Boolean(location.state?.openBudgetForm)
    )
    // ============ADD EXPENSE STATE=============
    const [newExpenseData, setNewExpenseData] = useState(EMPTY_EXPENSE)
    // Blocks a second submit while the first request is in flight
    const [submittingExpense, setSubmittingExpense] = useState(false)
    /* Field keyed messages returned by the server when Mongoose validation
    fails, for example { amount: 'Amount cannot be negative' }. Passed to the
    form so each message can be shown against its own input */
    const [expenseFieldErrors, setExpenseFieldErrors] = useState({})
    /* The logged in user's budgets, used to fill the add expense form's trip
    select. An expense is embedded in a budget, so only a trip that has one can
    be spent against and the form cannot be submitted until these have loaded */
    const [budgets, setBudgets] = useState([])
    const [loadingBudgets, setLoadingBudgets] = useState(false)
    /* Every expense the logged in user has logged, across all of their trips,
    gathered out of their budgets by the API. What the list is built from */
    const [expenses, setExpenses] = useState([])
    const [loadingExpenses, setLoadingExpenses] = useState(false)
    // ============BUDGET STATE=============
    /* The logged in user's trips, used to fill the budget form's trip select. A
    budget is set for a trip, and each trip carries a hasBudget flag the API
    answers from the caller's budgets, so create mode can offer only the trips
    that do not have one yet */
    const [trips, setTrips] = useState([])
    const [loadingTrips, setLoadingTrips] = useState(false)
    const [newBudgetData, setNewBudgetData] = useState(EMPTY_BUDGET)
    // Blocks a second submit while the first request is in flight
    const [submittingBudget, setSubmittingBudget] = useState(false)
    /* Field keyed messages returned by the server, keyed by schema path, for
    example { 'categoryLimits.food': 'A category limit cannot be negative' }.
    Passed to the form so each message can be shown against its own input */
    const [budgetFieldErrors, setBudgetFieldErrors] = useState({})
    // Form level message for the budget form, separate from the page's error
    const [budgetFormError, setBudgetFormError] = useState(null)
    /* The budget being edited, or null while a new one is being set. One budget
    per trip, so the same form does both jobs and this is what decides which:
    non-null puts the form in edit mode and its id is what the PATCH is
    addressed to */
    const [editingBudget, setEditingBudget] = useState(null)
    /* Offered by the currency select until GET /api/currencies answers, and kept
    if it never does. The same list the currency converter falls back to */
    const [currencyOptions] = useState(FALLBACK_CURRENCIES)
    
    //================EVENT HANDLERS=====================
    // TOGGLE FUNCTIONS
    // Function to toggle ExpensesList
    const toggleExpList = useCallback(() => {
      setShowExpList(prev => (!prev))
      setShowBudgetList(false)
      setShowAddBudget(false)
      // Allow AddExpenseForm display if Expenses List is open
    },[])
    // Function to toggle BudgetList
    const toggleBudgetList = useCallback(() => {
      setShowBudgetList(prev => (!prev))
      setShowExpList(false)
      setShowAddExp(false)
      // Allow BudgetFormDisplay if Budget List is open
    },[])
    // Function to toggle AddExpenseForm
    const toggleAddExpForm = useCallback(() => {
      setShowAddExp(prev => (!prev))
      setShowAddBudget(false)
    },[])
    // Function to toggle AddBudgetForm
    const toggleAddBudgetForm = useCallback(() => {
      setShowAddBudget(prev => (!prev))
      setShowAddExp(false)
      /* Closed and reopened as a create, so the toggle does not reopen a form
      still filled in with the budget that was last edited in it. The messages go
      with it: they belong to a submission that is no longer on screen */
      setEditingBudget(null)
      setNewBudgetData(EMPTY_BUDGET)
      setBudgetFieldErrors({})
      setBudgetFormError(null)
    },[])

    const toggleEditExpenseForm = useCallback(()=> {
      setShowEditExp(prev => !prev)
      setShowAddExp(false)
      setShowBudgetList(false)
    },[])


    //======================CALLBACKS/REQUEST FUNCTIONS========================
    /* Loads the logged in user's budgets from GET /expense/fetchBudgets.
    The route is behind checkJwtToken and filters on the userId it reads off that
    token, so the list only ever holds this account's own budgets. Each carries
    the title of the trip it was set for and its base currency, which is what the
    form's trip select and its conversion note are built from. Called on mount,
    and again after an expense is added so the totals stay current */
    const fetchBudgets = useCallback(async () => {
      const token = localStorage.getItem('token');
      // Conditional rendering to check a session is still stored
      if (!token) {
        console.warn('[WARN: Expenses.js] No token stored, cannot fetch budgets');
        return;
      }

      try {
        setLoadingBudgets(true)

        const response = await fetch('http://localhost:3001/expense/fetchBudgets', {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          // Defaulted to an empty array, so the form always maps over a list
          setBudgets(Array.isArray(data.budgets) ? data.budgets : [])
          console.log(`[SUCCESS: Expenses.js] Loaded ${data.budgets?.length || 0} budgets`)
        } else {
          /* Reported without clearing the budgets already on screen, so a failed
          refresh does not empty a select the user is part way through using */
          const message = data?.message || response?.statusText || 'Could not load your budgets.';
          setError?.(message)
          console.error(`[ERROR: Expenses.js] Fetch budgets failed with status ${response.status}: ${message}`)
        }
      } catch (error) {
        // Only a network level failure reaches here, a 4xx or 5xx is handled above
        setError?.('Could not reach the server. Please check your connection and try again.')
        console.error(`[ERROR: Expenses.js] Fetch budgets request failed: ${error.message}`)
      } finally {
        setLoadingBudgets(false)
      }
    },[setError])

    /* Loads every expense the logged in user has logged from
    GET /expense/fetchExpenses.
    The route is behind checkJwtToken and filters on the userId it reads off that
    token, so the list only ever holds this account's own expenses. An expense is
    embedded in the budget of its trip, so the API gathers them out of the
    caller's budgets and returns them as one list, newest spend first, each
    carrying the trip it was filed against and the currency it was converted
    into. Called on mount, and again after an expense is added */
    const fetchExpenses = useCallback(async () => {
      const token = localStorage.getItem('token');
      // Conditional rendering to check a session is still stored
      if (!token) {
        console.warn('[WARN: Expenses.js] No token stored, cannot fetch expenses');
        return;
      }

      try {
        setLoadingExpenses(true)

        const response = await fetch('http://localhost:3001/expense/fetchExpenses', {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          // Defaulted to an empty array, so the list always maps over one
          setExpenses(Array.isArray(data.expenses) ? data.expenses : [])
          console.log(`[SUCCESS: Expenses.js] Loaded ${data.expenses?.length || 0} expenses`)
        } else {
          /* Reported without clearing the expenses already on screen, so a
          failed refresh does not empty a list the user is reading */
          const message = data?.message || response?.statusText || 'Could not load your expenses.';
          setError?.(message)
          console.error(`[ERROR: Expenses.js] Fetch expenses failed with status ${response.status}: ${message}`)
        }
      } catch (error) {
        // Only a network level failure reaches here, a 4xx or 5xx is handled above
        setError?.('Could not reach the server. Please check your connection and try again.')
        console.error(`[ERROR: Expenses.js] Fetch expenses request failed: ${error.message}`)
      } finally {
        setLoadingExpenses(false)
      }
    },[setError])

    /* Loads one expense from GET /expense/fetchExpense/:id.
    The id is the one Mongo gave the embedded expense, and the route matches it
    against the account on the token, so another user's expense is reported as
    missing rather than returned. Used to fill the edit form with what is
    currently stored, rather than editing the copy the list is holding, which
    may have been changed since it was loaded.

    Returns the expense so the caller can put it straight into the form, or null
    when it could not be read */
    const fetchExpense = useCallback(async (expenseId) => {
      // Conditional rendering to check an expense was identified
      if (!expenseId) {
        console.warn('[WARN: Expenses.js] No expense id given, cannot fetch the expense');
        return null;
      }

      const token = localStorage.getItem('token');
      // Conditional rendering to check a session is still stored
      if (!token) {
        setError?.('Your session has expired. Please log in again.');
        console.warn('[WARN: Expenses.js] No token stored, cannot fetch the expense');
        return null;
      }

      try {
        const response = await fetch(`http://localhost:3001/expense/fetchExpense/${expenseId}`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          console.log('[SUCCESS: Expenses.js] Loaded expense', data.expense?._id)
          return data.expense ?? null
        }

        /* A 400 for a malformed id, a 404 for an expense that is not on this
        account, and a 401 once the session has gone all arrive with their own
        message, so it is reported as it was given */
        const message = data?.message || response?.statusText || 'Could not load that expense.';
        setError?.(message)
        console.error(`[ERROR: Expenses.js] Fetch expense failed with status ${response.status}: ${message}`)
        return null
      } catch (error) {
        // Only a network level failure reaches here, a 4xx or 5xx is handled above
        setError?.('Could not reach the server. Please check your connection and try again.')
        console.error(`[ERROR: Expenses.js] Fetch expense request failed: ${error.message}`)
        return null
      }
    },[setError])

    /* Sends the completed form to POST /expense/addExpense.
    The route is behind checkJwtToken, so the stored token is attached to the
    request. Only the trip's id is sent, not its budget: the API finds that
    budget by the trip and the account on the token, which is what stops an
    expense being added to someone else's budget. The owner is not sent either,
    the username comes from the account, and neither is convertedAmount, which
    the API works out from the rate on the day */
    const addExpense = useCallback(async () => {
      if (submittingExpense) return;

      const token = localStorage.getItem('token');
      // Conditional rendering to check a session is still stored
      if (!token) {
        setError?.('Your session has expired. Please log in again.');
        console.warn('[WARN: Expenses.js] No token stored, cannot add an expense');
        return;
      }

      try {
        setSubmittingExpense(true)
        setError?.(null)
        setExpenseFieldErrors({})

        const response = await fetch('http://localhost:3001/expense/addExpense', {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            tripId: newExpenseData.tripId,
            title: newExpenseData.title,
            amount: newExpenseData.amount,
            currency: newExpenseData.currency,
            category: newExpenseData.category,
            date: newExpenseData.date,
            notes: newExpenseData.notes,
            paymentMethod: newExpenseData.paymentMethod,
            /* Sent as a boolean rather than left to the checkbox, so an
            unticked box arrives as false instead of being dropped from the
            body and defaulting back to true on the schema */
            isPaid: Boolean(newExpenseData.isPaid),
          })
        })

        /* Safely parse the JSON response. Guarded because the body is empty or
        is not JSON at all on a 429 from the rate limiter, and response.json()
        would throw before the status could be reported */
        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          setError?.(null)
          setExpenseFieldErrors({})
          // Cleared so the next expense starts from an empty form
          setNewExpenseData(EMPTY_EXPENSE)
          setShowAddExp(false)
          /* Reloaded because the budget's totals move with every expense, and
          they are what the trip select and the list are built from */
          fetchBudgets()
          /* Reloaded rather than appending the returned expense, so the list is
          re-sorted by date and the new expense lands where it belongs rather
          than on the end */
          fetchExpenses()
          alert(data.message || 'Expense added successfully.')
          console.log('[SUCCESS: Expenses.js] Expense added:', data.expense?._id)
        } else {
          /* Falls back through the shapes the API can return: a plain message,
          an error string, then the status text */
          const message =
            data?.message ||
            data?.error ||
            response?.statusText ||
            'Could not add the expense.';
          // Present on a 400 from Mongoose validation, absent on a 401, 404 or a 500
          if (data.errors) setExpenseFieldErrors(data.errors);
          setError?.(message);
          console.error(`[ERROR: Expenses.js] Add expense failed with status ${response.status}: ${message}`);
        }
      } catch (error) {
        // Only a network level failure reaches here, a 4xx or 5xx is handled above
        setError?.('Could not reach the server. Please check your connection and try again.');
        console.error(`[ERROR: Expenses.js] Add expense request failed: ${error.message}`);
      } finally {
        setSubmittingExpense(false)
      }
    },[submittingExpense, newExpenseData, setError, fetchBudgets, fetchExpenses])

    /* Loads the logged in user's trips from GET /trip/fetchTrips.
    The route is behind checkJwtToken and filters on the userId it reads off that
    token, so the list only ever holds this account's own trips. Each carries a
    hasBudget flag the route answers from the caller's budgets rather than from
    the stored field, which no route writes to — so the budget form's create
    select can offer only the trips that do not have one yet. Called on mount,
    and again after a budget is created so the trip that just got one drops out
    of that select */
    const fetchTrips = useCallback(async () => {
      const token = localStorage.getItem('token');
      // Conditional rendering to check a session is still stored
      if (!token) {
        console.warn('[WARN: Expenses.js] No token stored, cannot fetch trips');
        return;
      }

      try {
        setLoadingTrips(true)

        const response = await fetch('http://localhost:3001/trip/fetchTrips', {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          // Defaulted to an empty array, so the form always maps over a list
          setTrips(Array.isArray(data.trips) ? data.trips : [])
          console.log(`[SUCCESS: Expenses.js] Loaded ${data.trips?.length || 0} trips`)
        } else {
          /* Reported without clearing the trips already on screen, so a failed
          refresh does not empty a select the user is part way through using */
          const message = data?.message || response?.statusText || 'Could not load your trips.';
          setError?.(message)
          console.error(`[ERROR: Expenses.js] Fetch trips failed with status ${response.status}: ${message}`)
        }
      } catch (error) {
        // Only a network level failure reaches here, a 4xx or 5xx is handled above
        setError?.('Could not reach the server. Please check your connection and try again.')
        console.error(`[ERROR: Expenses.js] Fetch trips request failed: ${error.message}`)
      } finally {
        setLoadingTrips(false)
      }
    },[setError])

    /* Sends the completed form to POST /budget/addBudget.
    The route is behind checkJwtToken, so the stored token is attached to the
    request. Only the trip's id is sent, not the owner: the route takes the
    userId from that token and matches the trip on it, which is what stops a
    budget being set against someone else's trip.

    The amounts go as they were typed. Every one of them is coerced and checked
    by the route before a document is built, and a blank one is stored as null —
    which is what a category having no cap means, and what makes the schema's
    pre('save') hook work the daily budget out from the length of the trip. The
    totals are not sent at all: they are virtuals worked out from the expenses */
    const addBudget = useCallback(async () => {
      if (submittingBudget) return;

      const token = localStorage.getItem('token');
      // Conditional rendering to check a session is still stored
      if (!token) {
        setBudgetFormError('Your session has expired. Please log in again.');
        console.warn('[WARN: Expenses.js] No token stored, cannot add a budget');
        return;
      }

      try {
        setSubmittingBudget(true)
        setBudgetFormError(null)
        setBudgetFieldErrors({})

        const response = await fetch('http://localhost:3001/budget/addBudget', {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            tripId: newBudgetData.tripId,
            baseCurrency: newBudgetData.baseCurrency,
            totalBudget: newBudgetData.totalBudget,
            dailyBudget: newBudgetData.dailyBudget,
            // Sent nested, the way the schema keys them
            categoryLimits: newBudgetData.categoryLimits,
            /* Sent as booleans rather than left to the checkboxes, so an
            unticked box arrives as false instead of being dropped from the
            body and defaulting back to true on the schema */
            alerts: {
              notifyAt80Percent: Boolean(newBudgetData.alerts?.notifyAt80Percent),
              notifyOnExceed: Boolean(newBudgetData.alerts?.notifyOnExceed),
            },
          })
        })

        /* Safely parse the JSON response. Guarded because the body is empty or
        is not JSON at all on a 429 from the rate limiter, and response.json()
        would throw before the status could be reported */
        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          setBudgetFormError(null)
          setBudgetFieldErrors({})
          // Cleared so the next budget starts from an empty form
          setNewBudgetData(EMPTY_BUDGET)
          setShowAddBudget(false)
          /* Reloaded so the trip that has just been given a budget drops out of
          the create select, which lists only the trips whose hasBudget is false */
          fetchTrips()
          /* Reloaded because this is the budget an expense is filed against, and
          the add expense form's trip select is built from that list — a trip
          with no budget is not offered by it at all */
          fetchBudgets()
          alert(data.message || 'Budget created successfully.')
          console.log('[SUCCESS: Expenses.js] Budget created:', data.budget?._id)
        } else {
          /* Falls back through the shapes the API can return: a plain message,
          an error string, then the status text */
          const message =
            data?.message ||
            data?.error ||
            response?.statusText ||
            'Could not create the budget.';
          /* Present on a 400 from Mongoose validation and on the 409 for a trip
          that already has a budget, which is keyed on tripId. Absent on a 401,
          404 or a 500 */
          if (data.errors) setBudgetFieldErrors(data.errors);
          setBudgetFormError(message);
          console.error(`[ERROR: Expenses.js] Add budget failed with status ${response.status}: ${message}`);
        }
      } catch (error) {
        // Only a network level failure reaches here, a 4xx or 5xx is handled above
        setBudgetFormError('Could not reach the server. Please check your connection and try again.');
        console.error(`[ERROR: Expenses.js] Add budget request failed: ${error.message}`);
      } finally {
        setSubmittingBudget(false)
      }
    },[submittingBudget, newBudgetData, fetchTrips, fetchBudgets])

    /* Sends the edited form to PATCH /budget/editBudget/:id.
    The id is the budget's own, and the route matches it against the account on
    the token, so another user's budget is reported as missing rather than
    written to.

    A PATCH, so only what the form owns is sent. tripId is left out on purpose:
    a budget cannot be moved to another trip, the select is disabled in edit mode
    and the route refuses a body that carries a different one. baseCurrency is
    still sent, but the route refuses a change to it once the budget holds
    expenses — each was converted into the old currency as it was added — and
    answers 409 keyed on baseCurrency, which the form shows against the select */
    const editBudget = useCallback(async () => {
      if (submittingBudget) return;

      const budgetId = editingBudget?._id;
      // Conditional rendering to check a budget is open for editing
      if (!budgetId) {
        setBudgetFormError('No budget is open for editing.');
        console.warn('[WARN: Expenses.js] No budget id, cannot edit a budget');
        return;
      }

      const token = localStorage.getItem('token');
      // Conditional rendering to check a session is still stored
      if (!token) {
        setBudgetFormError('Your session has expired. Please log in again.');
        console.warn('[WARN: Expenses.js] No token stored, cannot edit a budget');
        return;
      }

      try {
        setSubmittingBudget(true)
        setBudgetFormError(null)
        setBudgetFieldErrors({})

        const response = await fetch(`http://localhost:3001/budget/editBudget/${budgetId}`, {
          method: 'PATCH',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            baseCurrency: newBudgetData.baseCurrency,
            totalBudget: newBudgetData.totalBudget,
            /* Sent even when it is blank, which clears it back to null and lets
            the schema's pre('save') hook work it out from the trip again */
            dailyBudget: newBudgetData.dailyBudget,
            categoryLimits: newBudgetData.categoryLimits,
            alerts: {
              notifyAt80Percent: Boolean(newBudgetData.alerts?.notifyAt80Percent),
              notifyOnExceed: Boolean(newBudgetData.alerts?.notifyOnExceed),
            },
          })
        })

        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          setBudgetFormError(null)
          setBudgetFieldErrors({})
          // Closed back to a create, so the toggle does not reopen this edit
          setEditingBudget(null)
          setNewBudgetData(EMPTY_BUDGET)
          setShowAddBudget(false)
          /* Reloaded because the base currency and the total are what the add
          expense form's select reports against the trip it offers */
          fetchBudgets()
          alert(data.message || 'Budget updated successfully.')
          console.log('[SUCCESS: Expenses.js] Budget updated:', data.budget?._id)
        } else {
          const message =
            data?.message ||
            data?.error ||
            response?.statusText ||
            'Could not update the budget.';
          // Present on a 400 from validation and on the 409 for a locked base currency
          if (data.errors) setBudgetFieldErrors(data.errors);
          setBudgetFormError(message);
          console.error(`[ERROR: Expenses.js] Edit budget failed with status ${response.status}: ${message}`);
        }
      } catch (error) {
        // Only a network level failure reaches here, a 4xx or 5xx is handled above
        setBudgetFormError('Could not reach the server. Please check your connection and try again.');
        console.error(`[ERROR: Expenses.js] Edit budget request failed: ${error.message}`);
      } finally {
        setSubmittingBudget(false)
      }
    },[submittingBudget, editingBudget, newBudgetData, fetchBudgets])

    /* Loads one budget from GET /budget/fetchBudget/:id.
    The route matches the id against the account on the token, so another user's
    budget is reported as missing rather than returned.

    Used to open the edit form against what is currently stored rather than
    against the copy /expense/fetchBudgets is holding, which carries only the
    four fields that list's trip select reads: an edit submits every field the
    form owns, so opening it from that copy would write ten blank category
    limits over the stored ones.

    Returns the budget so the caller can put it straight into the form, or null
    when it could not be read */
    const fetchBudget = useCallback(async (budgetId) => {
      // Conditional rendering to check a budget was identified
      if (!budgetId) {
        console.warn('[WARN: Expenses.js] No budget id given, cannot fetch the budget');
        return null;
      }

      const token = localStorage.getItem('token');
      // Conditional rendering to check a session is still stored
      if (!token) {
        setError?.('Your session has expired. Please log in again.');
        console.warn('[WARN: Expenses.js] No token stored, cannot fetch the budget');
        return null;
      }

      try {
        const response = await fetch(`http://localhost:3001/budget/fetchBudget/${budgetId}`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          console.log('[SUCCESS: Expenses.js] Loaded budget', data.budget?._id)
          return data.budget ?? null
        }

        /* A 400 for a malformed id, a 404 for a budget that is not on this
        account, and a 401 once the session has gone all arrive with their own
        message, so it is reported as it was given */
        const message = data?.message || response?.statusText || 'Could not load that budget.';
        setError?.(message)
        console.error(`[ERROR: Expenses.js] Fetch budget failed with status ${response.status}: ${message}`)
        return null
      } catch (error) {
        // Only a network level failure reaches here, a 4xx or 5xx is handled above
        setError?.('Could not reach the server. Please check your connection and try again.')
        console.error(`[ERROR: Expenses.js] Fetch budget request failed: ${error.message}`)
        return null
      }
    },[setError])

    /* Opens the budget form as an edit, filled in with the budget as it is
    currently stored. One budget per trip, so an existing one cannot be created
    again — its trip is not offered by the create select at all, and the POST
    answers 409 for it, which is why editing is the only way to change one.

    The budget is read back by its id first rather than taken from the list,
    which holds only part of it. Nothing on screen changes until it arrives, so
    a read that failed leaves the form as it was instead of opening an edit of
    a budget that could not be loaded */
    const startBudgetEdit = useCallback(async (budgetId) => {
      const budget = await fetchBudget(budgetId);

      // Conditional rendering to check the budget was read back
      if (!budget) {
        console.warn('[WARN: Expenses.js] Could not load budget', budgetId, 'so the edit form was not opened');
        return;
      }

      setEditingBudget(budget)
      setNewBudgetData(budgetToForm(budget))
      setBudgetFieldErrors({})
      setBudgetFormError(null)
      setShowAddBudget(true)
      setShowAddExp(false)
      console.log('[INFO: Expenses.js] Editing budget', budget._id)
    },[fetchBudget])

    /* Sends one budget's id to DELETE /budget/deleteBudget/:id.
    The route matches that id against the account on the token, so another user's
    budget is reported as missing rather than removed.

    An expense is embedded in the budget of its trip, so the expenses filed
    against that trip go with it — which is why all three lists are reloaded
    afterwards rather than only the budgets: the expense list loses the rows that
    were on it, and each trip's hasBudget is answered off the caller's budgets, so
    the trip that just lost one becomes available to the create select again.

    Returns whether the budget actually went, so the list can close its details
    panel on success and leave it open on the budget it failed to remove */
    const deleteBudget = useCallback(async (budgetId) => {
      // Conditional rendering to check a budget was identified
      if (!budgetId) {
        console.warn('[WARN: Expenses.js] No budget id given, cannot delete the budget');
        return false;
      }

      const token = localStorage.getItem('token');
      // Conditional rendering to check a session is still stored
      if (!token) {
        setError?.('Your session has expired. Please log in again.');
        console.warn('[WARN: Expenses.js] No token stored, cannot delete the budget');
        return false;
      }

      try {
        setError?.(null)

        const response = await fetch(`http://localhost:3001/budget/deleteBudget/${budgetId}`, {
          method: 'DELETE',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          /* A 400 for a malformed id, a 404 for a budget that is not on this
          account, and a 401 once the session has gone all arrive with their own
          message, so it is reported as it was given */
          const message = data?.message || response?.statusText || 'Could not delete the budget.';
          setError?.(message)
          console.error(`[ERROR: Expenses.js] Delete budget failed with status ${response.status}: ${message}`)
          return false
        }

        /* Closed back to a create when the deleted budget is the one the form is
        open on, so an edit cannot be submitted against a budget that is no
        longer there — the PATCH would only answer 404. A form open on a
        different budget, or on a new one, is left as it is */
        if (String(editingBudget?._id) === String(budgetId)) {
          setEditingBudget(null)
          setNewBudgetData(EMPTY_BUDGET)
          setBudgetFieldErrors({})
          setBudgetFormError(null)
          setShowAddBudget(false)
          console.log('[INFO: Expenses.js] Closed the edit form, budget', budgetId, 'was deleted');
        }

        /* Awaited so the caller's delete stays busy until the refreshed lists
        have arrived rather than only until the DELETE answered, and the row is
        gone from the list by the time the button reports itself done */
        await Promise.all([
          /* The budget itself is gone, and this list is what both the budget
          list and the add expense form's trip select are built from */
          fetchBudgets(),
          /* The expenses embedded in it went with it, so the list would
          otherwise keep showing rows that are no longer stored */
          fetchExpenses(),
          /* hasBudget is answered off the caller's budgets, so the trip is
          offered by the create select again once this has reloaded */
          fetchTrips(),
        ])

        alert(data.message || 'Budget deleted successfully.')
        console.log('[SUCCESS: Expenses.js] Budget deleted:', data.budgetId || budgetId, 'with', data.removedExpenses ?? 0, 'expense(s)')
        return true
      } catch (error) {
        // Only a network level failure reaches here, a 4xx or 5xx is handled above
        setError?.('Could not reach the server. Please check your connection and try again.')
        console.error(`[ERROR: Expenses.js] Delete budget request failed: ${error.message}`)
        return false
      }
    },[editingBudget, setError, fetchBudgets, fetchExpenses, fetchTrips])

    /* One budget per trip, so one form does both jobs and this is what the form
    submits to. Which request runs is decided by the same editingBudget the form
    reads its mode from, so the two cannot disagree */
    const saveBudget = useCallback(() => {
      if (editingBudget?._id) return editBudget();
      return addBudget();
    },[editingBudget, addBudget, editBudget])

    //=====================SIDE EFFECTS=========================
    /* Opens the budget form when the page was reached from the journal's ADD
    TRIP BUDGET link, which sets openBudgetForm on the location. Kept as an
    effect as well as an initial state, because the link is also reachable from
    a journal already sitting on this route, where the component is not
    remounted and only the location changes.

    The budget page's list carries editBudgetId alongside that flag, because the
    form that changes a budget is here rather than there: the budget is read back
    by that id and the form opens against what is currently stored, exactly as it
    does for an edit started from this page's own list.

    The flag is then replaced out of the history entry, so reloading the page or
    coming back to it does not reopen a form the user has since closed */
    useEffect(() => {
      if (!location.state?.openBudgetForm) return;

      const editBudgetId = location.state.editBudgetId;

      setShowAddBudget(true)
      // Closed, the two panels are shown one at a time
      setShowAddExp(false)
      /* Opened as an edit when a budget was named, which reads it back and fills
      the form in. Without one the form is left as the create it already is */
      if (editBudgetId) startBudgetEdit(editBudgetId);
      navigate(location.pathname, { replace: true, state: null })
      console.log('[INFO: Expenses.js] Opened the budget form from a link', editBudgetId ? `to edit budget ${editBudgetId}` : 'to set a new budget')
    }, [location.state, location.pathname, navigate, startBudgetEdit])

    /* Loads the budgets once, when the page mounts, so the add expense form's
    trip select is already filled the first time the form is opened */
    useEffect(() => {
      fetchBudgets()
    }, [fetchBudgets])

    /* Loads the expenses once, when the page mounts, so the list is filled
    before the user opens anything. Kept separate from the budgets so a failure
    to read one does not stop the other being loaded */
    useEffect(() => {
      fetchExpenses()
    }, [fetchExpenses])

    /* Loads the trips once, when the page mounts, so the budget form's trip
    select is already filled the first time the form is opened — including when
    the page is reached from the journal's ADD TRIP BUDGET link, which opens it
    on the first render */
    useEffect(() => {
      fetchTrips()
    }, [fetchTrips])

    //======================================================
  return (
    <div id='pageContainer' role='main' aria-labelledby='pageTitle'>
    <p className='visually-hidden' id='pageTitle'>EXPENSES PAGE</p>
        <Header currentUser={currentUser} heading={'EXPENSES'}/>
         <section id='expensesSection1'>
            <div id='exp-section1-panal' aria-describedby='ExpSection1Descrip'>
                {/* -------Section Screen Reader Description------------ */}
                  <p className='visually-hidden' id='ExpSection1Descrip'>
                    ExpensesList and Trip BudgetList display with toggle list display buttons
                  </p>
                <Row id='toggleListsRow'>
            <Col id='toggleListCol1'/>
        <Col xs={5} id='toggleListCol'>
        {/* TOGGLE LISTS BUTTONS STACK */}
  <Stack gap={3} id='toggleListsBtnsStack'>
      <div className="p-2" id='toggleExpListBlock'>
        <Button 
        variant='light'  
        id='toggleExpListBtn'
        type='button'
        onClick={toggleExpList}
        // ARIA ATTRIBUTES
        aria-label={showExpList ? 'Hide Expenses': 'Show Expenses'}
        aria-pressed={showExpList}
        aria-expanded={showExpList}
        aria-controls=''
        >
        {showExpList ? 'Hide Expenses': 'Show Expenses'}
        </Button>
      </div>
      <div className="p-2" id='toggleBudgetListBlock'>
        <Button 
        variant='light'
        onClick={toggleBudgetList}
        id='toggleBudgetListBtn'
        type='button'
        // ARIA ATTRIBUTES
        aria-label={showBudgetList ? 'Hide Trip Budgets': 'Show Budgets'}
        aria-pressed={showBudgetList}
        aria-expanded={showBudgetList}
        aria-controls=''
        >
        {showBudgetList ? 'Hide Trip Budgets': 'Show Budgets'}
        </Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggleListCol2'/>
      </Row>
      <div id='pageListsDisplay'>
 {showExpList && (
        <div id='expenses-list-panal'>
          <Row id='expenses-list-row'>
            <Col id='expensesListCol'>
                <div id='expensesListBlock'>
                    <ExpensesList
                        expenses={expenses}
                        loadingExpenses={loadingExpenses}
                        /* Reads one expense back from the API by its id, for
                        editing it against what is currently stored */
                        fetchExpense={fetchExpense}
                        fetchExpenses={fetchExpenses}
                        currentUser={currentUser}
                        setError={setError}
                        toggleEditExpenseForm={toggleEditExpenseForm}
                        showEditExp={showEditExp}
                    />
                </div>
            </Col>
          </Row>
        </div>
      )}
      {showBudgetList && (
        <div id='budget-list-panal'>
          <Row id='budget-list-row'>
            <Col id='budgetListCol'>
            {/* The trip budgets, read from the same GET /expense/fetchBudgets
            the add expense form's trip select is filled from. Each row carries
            only the four fields that list returns, so the list's own VIEW reads
            the whole budget back by its id through fetchBudget, and its EDIT
            opens the form from that same read: an existing budget cannot be
            created again, so a PATCH is the only way to change one */}
            <div id='budgetListBlock'>
              <BudgetList
                currentUser={currentUser}
                budgets={budgets}
                loadingBudgets={loadingBudgets}
                fetchBudgets={fetchBudgets}
                /* Reads one budget back from the API by its id, whole and with
                its virtuals, for the list's details panel */
                fetchBudget={fetchBudget}
                startBudgetEdit={startBudgetEdit}
                /* Removes one budget, and the expenses embedded in it, then
                reloads all three lists. Reports whether it actually went, so
                the list can close its details panel on success */
                deleteBudget={deleteBudget}
                /* A budget row does not carry the status of the trip it was set
                for, that is stored on the trip itself */
                trips={trips}
                /* An expense carries the budgetId it was filed against, so the
                list counts the expenses per budget off this one */
                expenses={expenses}
              />
            </div>
            </Col>
          </Row>
        </div>
      )}
      </div>
                </div>
            </section>
            {showEditExp && (
              <section className='editFormSection'>
                <div id='editExpenseBlock' style={{width: '100%'}}>
                  <Row id='editExpRow' style={{width: '100%'}}>
                    <Col id='editExpenseCol' style={{width: '100%'}}>
                      <div id='editExpensePanal' style={{width: '100%'}} >
                        <EditExpense/>
                      </div>
                    </Col>
                  </Row>
                </div>
              </section>
            )}
            {/* SECTION 2 : ADD EXPENSE FORM + BUDGET FORM */}
            <section id='expensesSection2'>
                <div id='exp-section2-panal'>
                    <Row id='toggleExpFormRow'>
        <Col id='toggleExpFormCol1'/>
        <Col xs={5} id='toggleExpFormCol'>
         <Stack gap={3}>
      <div className="p-2" id='toggle-addexp-block'>
         <Button
                variant='light'
                id='toggleAddExpBtn'
                onClick={toggleAddExpForm}
                type='button'
                aria-controls='add-exp-panal'
                aria-label={showAddExp ? 'Hide Form': 'Add Trip Expense'}
                aria-pressed={showAddExp}
                aria-expanded={showAddExp}
                >
                {showAddExp ? 'Hide Form': 'Add Trip Expense'}
                </Button>
      </div>
      <div className="p-2" id='toggleAddBudgetBlock'>
        <Button
        variant='light'
        id='toggleAddBudgetBtn'
        onClick={toggleAddBudgetForm}
        type='button'
        // ARIA ATTRIBUTES:
        aria-controls='add-budget-panal'
        aria-label={showAddBudget ? 'Hide Form' : 'Add Trip Budget'}
        aria-pressed={showAddBudget}
        aria-expanded={showAddBudget}
        >
          {showAddBudget ? 'HIDE FORM' : 'ADD TRIP BUDGET'}
        </Button>
      </div>
     
    </Stack>
        </Col>
        <Col id='toggleExpFormCol2'/>
      </Row>
      {/* TOGGLE ADD EXPENSE FORM */}
      {showAddExp && (
        <div id='add-exp-panal'>
            <Row id='add-expense-row'>
                <Col id='addExpCol'>
                    <div id='addExp-Form-display'>
                        <AddExpenseForm
                            currentUser={currentUser}
                            newExpenseData={newExpenseData}
                            setNewExpenseData={setNewExpenseData}
                            addExpense={addExpense}
                            submitting={submittingExpense}
                            fieldErrors={expenseFieldErrors}
                            emptyForm={EMPTY_EXPENSE}
                            /* Fills the trip select, an expense is embedded in
                            the budget of the trip it is filed against */
                            budgets={budgets}
                            loadingBudgets={loadingBudgets}
                            currencyOptions={currencyOptions}
                        />
                    </div>
                </Col>
            </Row>
        </div>
      )}
      {/* TOGGLE ADD BUDGET PANAL */}
      {showAddBudget && (
        <div id='add-budget-panal'>
<Row style={{width: '100%'}}>
      <Col style={{width: '100%'}}>
      <div id='addBudget-form-display'>
        <BudgetForm
          /* One budget per trip, so the same form creates and edits. The mode
          follows whichever budget startBudgetEdit opened, if any */
          mode={editingBudget ? 'edit' : 'create'}
          budget={editingBudget}
          /* Create mode offers only the trips that do not have a budget yet:
          a second one cannot be set for the same trip, and the POST answers
          409 for it. Edit mode is passed the whole list so the disabled
          select can still show the title of the trip it belongs to */
          trips={editingBudget ? trips : trips.filter(({ hasBudget }) => !hasBudget)}
          loadingTrips={loadingTrips}
          currencyOptions={currencyOptions}
          budgetData={newBudgetData}
          setBudgetData={setNewBudgetData}
          saveBudget={saveBudget}
          /* An edit resets to the budget as it is stored, a create clears to
          the empty shape */
          emptyForm={editingBudget ? budgetToForm(editingBudget) : EMPTY_BUDGET}
          submitting={submittingBudget}
          formError={budgetFormError}
          fieldErrors={budgetFieldErrors}
        />
      </div>
       
      </Col>
</Row>
        </div>
      )}

                </div>
            </section>

        <Footer logout={logout}/>
    </div>
  )
}
