// Expenses.js Route '/exp'
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useEffect, useState } from 'react'
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
    // ========STATE VARIABLES=============================
    const [showAddExp, setShowAddExp] = useState(false)
    const [showAddBudget, setShowAddBudget] = useState(false)
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
    },[submittingExpense, newExpenseData, setError, fetchBudgets])

    //=====================SIDE EFFECTS=========================
    /* Loads the budgets once, when the page mounts, so the add expense form's
    trip select is already filled the first time the form is opened */
    useEffect(() => {
      fetchBudgets()
    }, [fetchBudgets])

    //======================================================
  return (
    <div id='pageContainer'>
        <Header currentUser={currentUser} heading={'EXPENSES'}/>
         <section id='expensesSection1'>
                <div id='exp-section1-panal'>
<Row id='expenses-list-row'>

        <Col id='expensesListCol'>
            <div id='expensesListBlock'>
                <ExpensesList/>
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
      <div className="p-2">
        <Button 
        variant='light'
        id='toggleAddBudgetBtn'
        onClick={toggleAddBudgetForm}
        type='button'
        // ARIA ATTRIBUTES:
        >
          ADD TRIP BUDGET
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
