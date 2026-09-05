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
// IMPORT UTILITY FUNCTIONS AND SHARED DATA
import { FALLBACK_CURRENCIES } from '../util/currencyFunc';
import { todayInputValue } from '../util/dateFunctions';
import BudgetForm from '../components/BudgetForm';

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
    /* Offered by the currency select until GET /api/currencies answers, and kept
    if it never does. The same list the currency converter falls back to */
    const [currencyOptions] = useState(FALLBACK_CURRENCIES)
    
    //================EVENT HANDLERS=====================
    // Function to toggle AddExpenseForm
    const toggleAddExpForm = useCallback(() => {
      setShowAddExp(prev => (!prev))
      setShowAddBudget(false)
    },[])
    // Function to toggle AddBudgetForm
    const toggleAddBudgetForm = useCallback(() => {
      setShowAddBudget(prev => (!prev))
      setShowAddExp(false)
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

    //=====================SIDE EFFECTS=========================
    /* Opens the budget form when the page was reached from the journal's ADD
    TRIP BUDGET link, which sets openBudgetForm on the location. Kept as an
    effect as well as an initial state, because the link is also reachable from
    a journal already sitting on this route, where the component is not
    remounted and only the location changes.

    The flag is then replaced out of the history entry, so reloading the page or
    coming back to it does not reopen a form the user has since closed */
    useEffect(() => {
      if (!location.state?.openBudgetForm) return;

      setShowAddBudget(true)
      // Closed, the two panels are shown one at a time
      setShowAddExp(false)
      navigate(location.pathname, { replace: true, state: null })
      console.log('[INFO: Expenses.js] Opened the budget form from the journal link')
    }, [location.state, location.pathname, navigate])

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

    //======================================================
  return (
    <div id='pageContainer'>
        <Header currentUser={currentUser} heading={'EXPENSES'}/>
         <section id='expensesSection1'>
                <div id='exp-section1-panal'>
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
                    setError={setError}
                />
            </div>
        </Col>
      </Row>

                </div>
            </section>
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
                <Col id='addExpCol1'/>
                <Col xs={12} md={8} id='addExpCol'>
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
                <Col id='addExpCol2'/>
            </Row>
        </div>
      )}
      {/* TOGGLE ADD BUDGET PANAL */}
      {showAddBudget && (
        <div id='add-budget-panal'>
<Row style={{width: '100%'}}>
      <Col style={{width: '100%'}}>
      <div id='addBudget-form-display'>
 <BudgetForm/>
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
