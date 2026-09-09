// Budget.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useState, useEffect } from 'react'
// IMPORT ROUTING HOOKS
/* The budget form lives on the expenses page, so the list's EDIT navigates there
rather than opening a form this page does not hold */
import { useNavigate } from 'react-router-dom'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Budget.css'
import '../css/componentCss/CalculatorsDisplay.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'
import CurrencyConverter from '../components/CurrencyConverter';
import ConversionsList from '../components/ConversionsList';
import Calculator from '../components/Calculator';
import VatCalculator from '../components/VatCalculator';
import VatCalculationsList from '../components/VatCalculationsList';
import BudgetList from '../components/BudgetList'
// IMPORT UTILITY FUNCTIONS
import { EMPTY_CONVERT_FORM, FALLBACK_CURRENCIES } from '../util/currencyFunc';
import ExpensesList from '../components/ExpensesList';

// ======MAIN BUDGET.js COMPONENT====================
export default function Budget(//Export default Budget.js component
  {//PROPS PASSED FROM PARENT COMPONENT(App.js)
    currentUser, 
    logout, 
    setError, 
    error,
    loggedIn
  }) {
  /* The budget form is on the expenses page, and a budget can only ever be
  edited rather than created a second time, so the list's EDIT hands the budget
  over to that page instead of opening a form here */
  const navigate = useNavigate()
  // ==========STATE VARIABLES===============
  // VAT CALCULATOR VARIABLES
  const [vatCalculations, setVatCalculations] = useState([])
  const [vatCalculationsTotal, setVatCalculationsTotal] = useState(0)
  const [vatCalculationsError, setVatCalculationsError] = useState('')
  /* Whether the saved calculations request is in flight. Kept so the list can
  tell a user who has saved nothing apart from a list that has not arrived yet:
  the two look identical as an empty array, and an empty table with no message
  reads as a failure rather than as an empty history. */
  const [loadingVatCalculations, setLoadingVatCalculations] = useState(false)
  // CURRENCY CONVERTER VARIABLES
  const [currencyOptions, setCurrencyOptions] = useState(FALLBACK_CURRENCIES)
  const [form, setForm] = useState(EMPTY_CONVERT_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [conversions, setConversions] = useState([])
  const [conversionsTotal, setConversionsTotal] = useState(0)
  /* Whether the saved conversions request is in flight, for the same reason the
  VAT list keeps one: an empty array is both a history with nothing in it and a
  list that has not arrived, and ConversionsList.js has to say which. */
  const [loadingConversions, setLoadingConversions] = useState(false)
  // TRIP BUDGET LIST VARIABLES
  /* The logged in user's trip budgets, one per trip. Each row carries only the
  four fields GET /expense/fetchBudgets returns, so the list's own VIEW reads the
  whole budget back by its id through fetchBudget below */
  const [budgets, setBudgets] = useState([])
  /* Whether the budgets request is in flight, for the same reason the two
  calculation lists keep one: an empty array is both an account that has set no
  budgets and a list that has not arrived, and BudgetList.js has to say which */
  const [loadingBudgets, setLoadingBudgets] = useState(false)
  /* Kept apart from the page's own `error`, which is passed to the currency
  converter and the conversions list: a budget that failed to load has to be
  reported above the list it failed to fill, not in a panel that may be closed */
  const [budgetsError, setBudgetsError] = useState('')
  /* Every expense on the account, for the list's EXPENSES column. An expense is
  embedded in the budget of its trip and carries the budgetId it came out of, so
  the count per budget is read from this list rather than from the budget rows,
  which leave the expenses out */
  const [expenses, setExpenses] = useState([])
  /* The trips, for the list's TRIP STATUS column: a budget row does not carry
  the status of the trip it was set for, that is stored on the trip itself */
  const [trips, setTrips] = useState([])
  // Toggle Buttons State
  const [showExpenses, setShowExpenses] = useState(false)
  const [showBudgetList, setShowBudgetList] = useState(false)
  const [showCalculator, setShowCaculator] = useState(false)
  const [showVatCalc, setShowVatCalc] = useState(false)
  const [showConverter, setShowConverter] = useState(false)
  const [showVatCalculations, setShowVatCalculations] = useState(false)
  const [showConversions, setShowConversions] = useState(false)

  /* Loads the currencies the converter offers from the provider, through the
  server. The dropdowns already hold FALLBACK_CURRENCIES, so a failure here
  leaves them populated from the curated local list rather than empty — which is
  why nothing is reported to the UI and the state is only ever replaced on a
  usable response. */
  useEffect(() => {
      /* Guards against a response arriving after the page has unmounted, which
      would set state on a component that is no longer mounted */
      let ignore = false;

      const loadCurrencies = async () => {
        const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
        /* Nothing to fetch without a session, and the endpoint would answer
        401. The dropdowns keep the local fallback list either way */
        if (!token) return;

        try {
          const response = await fetch(`http://localhost:3001/api/currencies`, {
              method: 'GET',//HTTP request method
              mode: 'cors',//Enable Cross-Origin Resource Sharing
              headers: {
                'Authorization': `Bearer ${token}` // Attach the token in the Authorization header
              }
            })

            const data = await response.json().catch(() => ({}));//Parse the response as json

            //Conditional rendering to check the request succeeded
            if (!response.ok) {
              console.error('[ERROR: Budget.js, loadCurrencies]', data.message || 'Could not load currencies.');//Log an error message in the console for debugging purposes
              return;
            }

            // Conditional rendering to drop a response that arrived after unmount
            if (ignore) return;

            /* `live` is false when the server served its own offline snapshot,
            which carries codes without names or symbols. The local fallback
            already covers those codes WITH their names, so a stand-in list is
            left alone rather than replacing 'ZAR - South African Rand' with a
            bare 'ZAR' */
            if (data.live && data.currencies?.length) {
              setCurrencyOptions(data.currencies);
              console.log('[SUCCESS: Budget.js, loadCurrencies] Loaded', data.currencies.length, 'currencies');
              return;
            }

            console.warn('[WARN: Budget.js, loadCurrencies] Provider list unavailable, keeping the local currency list');
        } catch (error) {
          console.error('[ERROR: Budget.js, loadCurrencies]', error.message);
        }
      }
      loadCurrencies();
      return () => { ignore = true }
    },[])

    /* Converts the amount on the form between the two selected currencies.
    Nothing is written to the database: the quote is only kept once the user
    asks for it through saveConversions below.

    The three inputs go up as query params, each encoded, because /api/convert
    is a GET. The rate is worked out server side against a live provider quote,
    so the figure on screen is never one the browser calculated. */
    const convert = useCallback(async () => {
      setError('')
      setResult(null)

      // Conditional rendering to check all three inputs were filled in
      if (!form.amount || !form.from || !form.to) {
        setError('Please fill in all fields.');
          return;
      }

      const token = localStorage.getItem('token')
      /* Nothing to convert without a session, and the endpoint would answer
      401. Returned before the loading flag is raised, so the button never
      reports a request that was never sent */
      if (!token) {
        setError('Please log in again to convert a currency.');
        return;
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          amount: form.amount,
          from: form.from,
          to: form.to,
        });
        const response = await fetch(`http://localhost:3001/api/convert?${params}`,{
          method: 'GET',//HTTP request method
          mode:'cors',//Enable Cross-Origin Resource Sharing
          headers: {
            'Authorization': `Bearer ${token}`// Attach the token in the Authorization header
          }
        })
        const data = await response.json().catch(() => ({}))//Parse the response as json

        //Conditional rendering to check the request succeeded
         if (!response.ok) {
           const message = data.message || 'Conversion failed.';
           console.error('[ERROR: Budget.js, convert]', message);//Log an error message in the console for debugging purposes
            setError(message);// Set the error state to display the error in the UI
            return;
        }

        /* The whole response is kept, not just the converted figure: the
        converter reads `amount`, `from`, `to`, `rate` and `date` off it to
        report which rate the answer was worked out at */
        setResult(data);
        console.log('[SUCCESS: Budget.js, convert]', data.amount, data.from, '=', data.result, data.to);
      } catch (error) {
        console.error('[ERROR: Budget.js, convert]', error.message);//Log an error message in the console for debugging purposes
          setError('Failed to convert. Please try again.');//Set the Error state to display a message in the UI
      }finally{
        /* Cleared in a finally, so a failed or rejected request leaves the
        button usable rather than stuck on 'CONVERTING...' */
        setLoading(false)
      }
    },[setError, form.to, form.from, form.amount])

       /* Loads the logged in user's saved conversions. The user is taken from
       the token on the server, so no id is sent: the endpoint can only ever
       return the requester's own records. */
       const fetchConversions = useCallback(async () => {
      try {
       const token = localStorage.getItem('token')
       /* Nothing to fetch without a session, and the endpoint would answer 401.
       Returned before the loading flag is raised, so a signed out user never
       sees the list report a request that was never sent. */
       if (!token) return;

       setLoadingConversions(true)// The list shows a loading row until this clears
       const response =  await fetch(`http://localhost:3001/api/history`,{
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
       } )
       const data = await response.json().catch(() =>({}))

       //Conditional rendering to check the request succeeded
       if (!response.ok) {
        const message = data.message || 'Could not load your saved conversions.';
        console.error('[ERROR: Budget.js, fetchConversions]', message);//Log an error message in the console for debugging purposes
        setError(message);// Set the error state to display the error in the UI
        return;// Exit the function early, keeping whatever list is already on screen
       }

       const fetchedConversions = Array.isArray(data.conversions) ? data.conversions : [];
       setConversions(fetchedConversions)
       /* The response reports the total separately from the array, because only
       the newest 100 records are returned. It is kept so the list can say when
       it is showing a truncated view. */
       setConversionsTotal(typeof data.total === 'number' ? data.total : fetchedConversions.length)
       setError('');//Clear any previous error messages
       console.log(`[SUCCESS: Budget.js, fetchConversions] Fetched ${fetchedConversions.length} of ${data.total ?? fetchedConversions.length} conversion(s)`);
      } catch (error) {
        console.error('[ERROR: Budget.js, fetchConversions]', error.message);//Log an error message in the console for debugging purposes
        setError(`Error fetching conversion data, ${error.message}`)
      } finally {
        /* Cleared in a finally, so a failed or rejected request leaves the list
        showing its error rather than a loading row that never ends */
        setLoadingConversions(false)
      }
    },[setError])

     /* Removes one of the user's saved conversions. The list is refetched
     rather than filtered in place, so what is on screen is what the database
     holds. */
     const deleteConversion = useCallback(async (conversionId) => {
      try {
        const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
        if (!token) return false;

        const response = await fetch(`http://localhost:3001/api/history/${conversionId}`,{
          method: 'DELETE',//HTTP request method
          mode: 'cors',//Enable Cross-Origin Resource Sharing
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,// Attach the token in the Authorization header
          }
        })
        const data = await response.json().catch(() => ({}))//Parse the response as json

        //Conditional rendering to check the request succeeded
        if (!response.ok) {
          const message = data.message || 'Could not remove the conversion.';
          console.error('[ERROR: Budget.js, deleteConversion]', message);//Log an error message in the console for debugging purposes
          setError(message);// Set the error state to display the error in the UI
          return false;
        }

        setError('');//Clear any previous error messages
        console.log('[SUCCESS: Budget.js, deleteConversion] Deleted conversion', conversionId);
        /* Awaited, so the caller's delete stays busy until the refreshed list
        has arrived rather than only until the DELETE answered. The panel is
        closed by the record leaving the list, which happens here. */
        await fetchConversions();// Refresh the list so the removal is visible straight away
        return true;
      } catch (error) {
        console.error('[ERROR: Budget.js, deleteConversion]', error.message);//Log an error message in the console for debugging purposes
        setError(`Error removing the conversion, ${error.message}`)
        return false;
      }
     },[fetchConversions, setError])
     /* Saves the conversion currently on screen to the user's history. Only the
     three inputs are sent: the server refetches the rate, so a saved record
     always holds a rate the provider actually quoted rather than one the
     browser could have edited on its way up.

     Throws rather than setting an error, because the save button in
     CurrencyConverter.js reports the outcome against itself — the conversion on
     screen is unaffected by a failed save. */
     const saveConversions = useCallback(async (conversion) => {
      const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
      // Conditional rendering to check there is a session to save against
      if (!token) throw new Error('Please log in again to save this conversion.');

      let response;
      let data;
      try {
        response = await fetch(`http://localhost:3001/api/save`,{
          method: 'POST',//HTTP request method
          mode: 'cors',//Enable Cross-Origin Resource Sharing
          headers: {
            'Content-Type': 'application/json',// Specify that we're sending JSON data in the request body
            'Authorization': `Bearer ${token}`,// Attach the token in the Authorization header
          },
          body: JSON.stringify({// Send the conversion's inputs in the request body as JSON
            amount: conversion.amount,
            from: conversion.from,
            to: conversion.to,
          })
        })
        data = await response.json().catch(() => ({}));//Parse the response as json
      } catch (error) {
        /* A network level failure, so the request never reached the server.
        Rethrown as a readable message rather than 'Failed to fetch' */
        console.error('[ERROR: Budget.js, saveConversions]', error.message);//Log an error message in the console for debugging purposes
        throw new Error('Could not reach the server. Please try again.');
      }

      //Conditional rendering to check the request succeeded
      if (!response.ok) {
        const message = data.message || 'Could not save the conversion. Please try again.';
        console.error('[ERROR: Budget.js, saveConversions]', message);//Log an error message in the console for debugging purposes
        throw new Error(message);
      }

      console.log('[SUCCESS: Budget.js, saveConversions] Saved conversion', data.saved?._id);
      /* Refresh the conversions list so a save is visible straight away. The
      list fetches when its panel is opened, so this only matters while it is
      already open — but without it the panel would sit there missing the
      conversion just saved. */
      fetchConversions();

      return data;
        },[fetchConversions])

        /* Loads the logged in user's saved VAT calculations for the VAT
        calculations list. The user is taken from the token on the server, so no
        id is sent: the endpoint can only ever return the requester's own
        records. */
        const fetchVatCalculations = useCallback(async () => {
          try {
            const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
            /* Nothing to fetch without a session, and the endpoint would answer
            401. Returned before the loading flag is raised, so a signed out
            user never sees the list report a request that was never sent. */
            if (!token) return;

            setLoadingVatCalculations(true)// The list shows a loading row until this clears
            const response = await fetch(`http://localhost:3001/vat/history`,{
              method: 'GET',//HTTP request method
              mode: 'cors',//Enable Cross-Origin Resource Sharing
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,// Attach the token in the Authorization header
              }
            })
            const data = await response.json().catch(() => ({}))//Parse the response as json

            //Conditional rendering to check the request succeeded
            if (!response.ok) {
              const message = data.message || 'Could not load your saved VAT calculations.';
              console.error('[ERROR: Budget.js, fetchVatCalculations]', message);//Log an error message in the console for debugging purposes
              setVatCalculationsError(message);// Set the error state to display the error in the UI
              return;// Exit the function early, keeping whatever list is already on screen
            }

            const fetchedCalculations = Array.isArray(data.calculations) ? data.calculations : [];
            setVatCalculations(fetchedCalculations)
            /* The response reports the total separately from the array, because
            only the newest 100 records are returned. It is kept so the list can
            say when it is showing a truncated view. */
            setVatCalculationsTotal(typeof data.total === 'number' ? data.total : fetchedCalculations.length)
            setVatCalculationsError('');//Clear any previous error messages
            console.log(`[SUCCESS: Budget.js, fetchVatCalculations] Fetched ${fetchedCalculations.length} of ${data.total ?? fetchedCalculations.length} VAT calculation(s)`);
          } catch (error) {
            console.error('[ERROR: Budget.js, fetchVatCalculations]', error.message);//Log an error message in the console for debugging purposes
            setVatCalculationsError(`Error fetching VAT calculations, ${error.message}`)
          } finally {
            /* Cleared in a finally, so a failed or rejected request leaves the
            list showing its error rather than a loading row that never ends */
            setLoadingVatCalculations(false)
          }
        },[])

        /* Removes one of the user's saved VAT calculations. The list is
        refetched rather than filtered in place, so what is on screen is what
        the database holds. */
        const deleteVatCalculation = useCallback(async (calculationId) => {
          try {
            const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
            if (!token) return false;

            const response = await fetch(`http://localhost:3001/vat/history/${calculationId}`,{
              method: 'DELETE',//HTTP request method
              mode: 'cors',//Enable Cross-Origin Resource Sharing
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,// Attach the token in the Authorization header
              }
            })
            const data = await response.json().catch(() => ({}))//Parse the response as json

            //Conditional rendering to check the request succeeded
            if (!response.ok) {
              const message = data.message || 'Could not remove the VAT calculation.';
              console.error('[ERROR: Budget.js, deleteVatCalculation]', message);//Log an error message in the console for debugging purposes
              setVatCalculationsError(message);// Set the error state to display the error in the UI
              return false;
            }

            setVatCalculationsError('');//Clear any previous error messages
            console.log('[SUCCESS: Budget.js, deleteVatCalculation] Deleted VAT calculation', calculationId);
            /* Awaited, so the caller's delete stays busy until the refreshed
            list has arrived rather than only until the DELETE answered. The
            panel is closed by the record leaving the list, which happens here. */
            await fetchVatCalculations();// Refresh the list so the removal is visible straight away
            return true;
          } catch (error) {
            console.error('[ERROR: Budget.js, deleteVatCalculation]', error.message);//Log an error message in the console for debugging purposes
            setVatCalculationsError(`Error removing the VAT calculation, ${error.message}`)
            return false;
          }
        },[fetchVatCalculations])

        /*=====================================
        THE TRIP BUDGET LIST
        =======================================*/
        /* Loads the logged in user's trip budgets from
        GET /expense/fetchBudgets. The route is behind checkJwtToken and filters
        on the userId it reads off that token, so the list can only ever hold
        this account's own budgets, and no id is sent.

        Each row carries four fields — the budget's id, its trip, its base
        currency and its total — so the list's VIEW reads the whole budget back
        by its id through fetchBudget below rather than opening the panel on the
        part of it that is already on screen. */
        const fetchBudgets = useCallback(async () => {
          const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
          /* Nothing to fetch without a session, and the endpoint would answer
          401. Returned before the loading flag is raised, so a signed out user
          never sees the list report a request that was never sent */
          if (!token) {
            console.warn('[WARN: Budget.js, fetchBudgets] No token stored, cannot fetch the budgets');
            return;
          }

          try {
            setLoadingBudgets(true)// The list shows a loading row until this clears
            const response = await fetch('http://localhost:3001/expense/fetchBudgets',{
              method: 'GET',//HTTP request method
              mode: 'cors',//Enable Cross-Origin Resource Sharing
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,// Attach the token in the Authorization header
              }
            })
            const data = await response.json().catch(() => ({}))//Parse the response as json

            //Conditional rendering to check the request succeeded
            if (!response.ok) {
              /* Reported without clearing the budgets already on screen, so a
              failed refresh leaves the list the user is reading as it was */
              const message = data.message || response.statusText || 'Could not load your trip budgets.';
              console.error('[ERROR: Budget.js, fetchBudgets]', message);//Log an error message in the console for debugging purposes
              setBudgetsError(message);// Set the error state to display the error above the list
              return;// Exit the function early, keeping whatever list is already on screen
            }

            // Defaulted to an empty array, so the list always maps over one
            const fetchedBudgets = Array.isArray(data.budgets) ? data.budgets : [];
            setBudgets(fetchedBudgets)
            setBudgetsError('');//Clear any previous error messages
            console.log(`[SUCCESS: Budget.js, fetchBudgets] Loaded ${fetchedBudgets.length} budget(s)`);
          } catch (error) {
            // Only a network level failure reaches here, a 4xx or 5xx is handled above
            console.error('[ERROR: Budget.js, fetchBudgets]', error.message);//Log an error message in the console for debugging purposes
            setBudgetsError('Could not reach the server. Please check your connection and try again.')
          } finally {
            /* Cleared in a finally, so a failed or rejected request leaves the
            list showing its error rather than a loading row that never ends */
            setLoadingBudgets(false)
          }
        },[])

        /* Loads every expense on the account from GET /expense/fetchExpenses,
        for the list's EXPENSES column. An expense is embedded in the budget of
        its trip, so the API gathers them out of the caller's budgets and returns
        them as one list, each carrying the budgetId it came out of — which is
        what the count per row is worked out from.

        Failures are only logged: the column falls back to 0 for every row, which
        is a great deal less than the list itself failing to load and is not
        worth an error message over the whole table. */
        const fetchExpenses = useCallback(async () => {
          const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
          if (!token) return;

          try {
            const response = await fetch('http://localhost:3001/expense/fetchExpenses',{
              method: 'GET',//HTTP request method
              mode: 'cors',//Enable Cross-Origin Resource Sharing
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,// Attach the token in the Authorization header
              }
            })
            const data = await response.json().catch(() => ({}))//Parse the response as json

            //Conditional rendering to check the request succeeded
            if (!response.ok) {
              console.error('[ERROR: Budget.js, fetchExpenses]', data.message || 'Could not load your expenses.');//Log an error message in the console for debugging purposes
              return;// Exit the function early, the column counts what it has
            }

            // Defaulted to an empty array, so the count is always reduced over one
            setExpenses(Array.isArray(data.expenses) ? data.expenses : [])
            console.log(`[SUCCESS: Budget.js, fetchExpenses] Loaded ${data.expenses?.length || 0} expense(s)`);
          } catch (error) {
            console.error('[ERROR: Budget.js, fetchExpenses]', error.message);//Log an error message in the console for debugging purposes
          }
        },[])

        /* Loads the logged in user's trips from GET /trip/fetchTrips, for the
        list's TRIP STATUS column: a budget row carries the title of its trip but
        not its status, which is stored on the trip itself.

        Failures are only logged, the same as the expenses above: the column
        falls back to NOT AVAILABLE per row rather than the table failing. */
        const fetchTrips = useCallback(async () => {
          const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
          if (!token) return;

          try {
            const response = await fetch('http://localhost:3001/trip/fetchTrips',{
              method: 'GET',//HTTP request method
              mode: 'cors',//Enable Cross-Origin Resource Sharing
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,// Attach the token in the Authorization header
              }
            })
            const data = await response.json().catch(() => ({}))//Parse the response as json

            //Conditional rendering to check the request succeeded
            if (!response.ok) {
              console.error('[ERROR: Budget.js, fetchTrips]', data.message || 'Could not load your trips.');//Log an error message in the console for debugging purposes
              return;// Exit the function early, the column reports what it has
            }

            // Defaulted to an empty array, so the statuses are always reduced over one
            setTrips(Array.isArray(data.trips) ? data.trips : [])
            console.log(`[SUCCESS: Budget.js, fetchTrips] Loaded ${data.trips?.length || 0} trip(s)`);
          } catch (error) {
            console.error('[ERROR: Budget.js, fetchTrips]', error.message);//Log an error message in the console for debugging purposes
          }
        },[])

        /* Loads one budget from GET /budget/fetchBudget/:id, whole and with the
        virtuals the schema is set to include. The route matches the id against
        the account on the token, so another user's budget is reported as missing
        rather than returned.

        This is what fills the list's details panel: the rows hold four fields
        and the panel reports the totals, the ten category limits and the two
        alerts, none of which /expense/fetchBudgets returns.

        Returns the budget so the list can open its panel on it, or null when it
        could not be read — the panel is left closed rather than opened on a set
        of empty labels. */
        const fetchBudget = useCallback(async (budgetId) => {
          // Conditional rendering to check a budget was identified
          if (!budgetId) {
            console.warn('[WARN: Budget.js, fetchBudget] No budget id given, cannot fetch the budget');
            return null;
          }

          const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
          if (!token) {
            setBudgetsError('Your session has expired. Please log in again.');
            console.warn('[WARN: Budget.js, fetchBudget] No token stored, cannot fetch the budget');
            return null;
          }

          try {
            const response = await fetch(`http://localhost:3001/budget/fetchBudget/${budgetId}`,{
              method: 'GET',//HTTP request method
              mode: 'cors',//Enable Cross-Origin Resource Sharing
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,// Attach the token in the Authorization header
              }
            })
            const data = await response.json().catch(() => ({}))//Parse the response as json

            //Conditional rendering to check the request succeeded
            if (!response.ok) {
              /* A 400 for a malformed id, a 404 for a budget that is not on this
              account and a 401 once the session has gone all arrive with their
              own message, so it is reported as it was given */
              const message = data.message || response.statusText || 'Could not load that budget.';
              console.error('[ERROR: Budget.js, fetchBudget]', message);//Log an error message in the console for debugging purposes
              setBudgetsError(message);// Set the error state to display the error above the list
              return null;
            }

            setBudgetsError('');//Clear any previous error messages
            console.log('[SUCCESS: Budget.js, fetchBudget] Loaded budget', data.budget?._id);
            return data.budget ?? null;
          } catch (error) {
            // Only a network level failure reaches here, a 4xx or 5xx is handled above
            console.error('[ERROR: Budget.js, fetchBudget]', error.message);//Log an error message in the console for debugging purposes
            setBudgetsError('Could not reach the server. Please check your connection and try again.')
            return null;
          }
        },[])

        /* Opens the budget form on the expenses page as an edit of one budget.
        The form is not on this page — a budget is set from there, against a trip
        that already exists — so the budget is handed over on the location the
        same way the journal's ADD TRIP BUDGET link hands over a new one, and
        Expenses.js reads editBudgetId off it and opens the form against what is
        currently stored. */
        const startBudgetEdit = useCallback((budgetId) => {
          // Conditional rendering to check a budget was identified
          if (!budgetId) {
            console.warn('[WARN: Budget.js, startBudgetEdit] No budget id given, cannot edit the budget');
            return;
          }

          console.log('[INFO: Budget.js, startBudgetEdit] Opening budget', budgetId, 'for editing on the expenses page');
          navigate('/exp', { state: { openBudgetForm: true, editBudgetId: budgetId } })
        },[navigate])

        /* Sends one budget's id to DELETE /budget/deleteBudget/:id. The route
        matches that id against the account on the token, so another user's
        budget is reported as missing rather than removed.

        An expense is embedded in the budget of its trip, so the expenses filed
        against that trip go with it — which is why the expenses and the trips
        are reloaded alongside the budgets rather than the budgets alone: the
        EXPENSES column loses the rows that were counted in it, and each trip's
        hasBudget is answered off the caller's budgets, so the trip that just
        lost one is offered a new budget again.

        Returns whether the budget actually went, so the list can close its
        details panel on success and leave it open on the budget it failed to
        remove. */
        const deleteBudget = useCallback(async (budgetId) => {
          // Conditional rendering to check a budget was identified
          if (!budgetId) {
            console.warn('[WARN: Budget.js, deleteBudget] No budget id given, cannot delete the budget');
            return false;
          }

          const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
          if (!token) {
            setBudgetsError('Your session has expired. Please log in again.');
            console.warn('[WARN: Budget.js, deleteBudget] No token stored, cannot delete the budget');
            return false;
          }

          try {
            const response = await fetch(`http://localhost:3001/budget/deleteBudget/${budgetId}`,{
              method: 'DELETE',//HTTP request method
              mode: 'cors',//Enable Cross-Origin Resource Sharing
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,// Attach the token in the Authorization header
              }
            })
            const data = await response.json().catch(() => ({}))//Parse the response as json

            //Conditional rendering to check the request succeeded
            if (!response.ok) {
              const message = data.message || response.statusText || 'Could not delete the budget.';
              console.error('[ERROR: Budget.js, deleteBudget]', message);//Log an error message in the console for debugging purposes
              setBudgetsError(message);// Set the error state to display the error above the list
              return false;
            }

            setBudgetsError('');//Clear any previous error messages
            /* Awaited so the caller's delete stays busy until the refreshed
            lists have arrived rather than only until the DELETE answered, and
            the row is gone from the table by the time the button reports itself
            done */
            await Promise.all([
              // The budget itself is gone, and this is what the table is built from
              fetchBudgets(),
              /* The expenses embedded in it went with it, so the EXPENSES column
              would otherwise keep counting expenses that are no longer stored */
              fetchExpenses(),
              /* hasBudget is answered off the caller's budgets, so the trip is
              offered a new budget again once this has reloaded */
              fetchTrips(),
            ])

            console.log('[SUCCESS: Budget.js, deleteBudget] Deleted budget', data.budgetId || budgetId, 'with', data.removedExpenses ?? 0, 'expense(s)');
            return true;
          } catch (error) {
            // Only a network level failure reaches here, a 4xx or 5xx is handled above
            console.error('[ERROR: Budget.js, deleteBudget]', error.message);//Log an error message in the console for debugging purposes
            setBudgetsError('Could not reach the server. Please check your connection and try again.')
            return false;
          }
        },[fetchBudgets, fetchExpenses, fetchTrips])

  /* Loads the saved calculations when the panel is opened rather than on mount,
  so a user who never opens it never pays for the request, and reopening it
  shows anything saved since it was last closed. */
  useEffect(() => {
    if (showVatCalculations) fetchVatCalculations()
  },[showVatCalculations, fetchVatCalculations])

  /* Same for the saved conversions, so opening that panel loads the history
  rather than showing an empty list until something new is saved. */
  useEffect(() => {
    if (showConversions) fetchConversions()
  },[showConversions, fetchConversions])

  /* Same for the trip budgets, so opening that panel loads them rather than
  showing an empty table, and reopening it shows anything set or spent since it
  was last closed — the totals in the panel move with every expense.

  All three are loaded together: the table's TRIP STATUS is read off the trips
  and its EXPENSES count off the expenses, neither of which a budget row
  carries. They are requested side by side rather than in sequence, so a trip
  list that is slow does not hold up the budgets the table is built from. */
  useEffect(() => {
    if (!showBudgetList) return;

    fetchBudgets()
    fetchExpenses()
    fetchTrips()
  },[showBudgetList, fetchBudgets, fetchExpenses, fetchTrips])

  //================EVENT LISTENERS========================
  const toggleExpensesList = useCallback(() => {
    setShowExpenses(prev => !prev)
    /* Hide calculation and conversions list but allow 
    Calculator or Currency converter display*/
    setShowConversions(false)
    setShowVatCalculations(false)
  },[])
  const toggleBudgetList = useCallback(() => {
    setShowBudgetList(prev => !prev)
    setShowConversions(false)
    setShowVatCalculations(false)
    setShowExpenses(false)
    setShowConverter(false)
  }, [])
  //  Function to toggle general/number calculator
  const toggleCalculator = useCallback(() => {
    setShowCaculator(prev => !prev)
    setShowVatCalc(false)
    setShowConverter(false)
  },[])
  //  Function to toggle Vat calculator
  const toggleVatCalculator = useCallback(() => {
    setShowVatCalc(prev => !prev)
    setShowCaculator(false)
    setShowConverter(false)
  },[])
  //  Function to toggle currency converter
  const toggleConverter = useCallback(() => {
    setShowConverter(prev => !prev)
    setShowCaculator(false)
    setShowVatCalc(false)
setShowBudgetList(false)
  },[])
  const toggleVatCalculations = useCallback(() => {
    setShowVatCalculations(prev => (!prev))
    setShowConversions(false)
    setShowCaculator(false)
    setShowVatCalc(false)
    setShowConverter(false)

  },[])
  const toggleConversions = useCallback(() => {
    setShowConversions(prev => (!prev))
    setShowVatCalculations(false)
    setShowCaculator(false)
    setShowVatCalc(false)
    setShowConverter(false)
  },[])

  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'BUDGET'}/>
        <section id='budget-section1'>
          <div id='section-1-panal'>
          <div id='budgetPageExpList'>
    <Row id='toggleExpListRow'>
        <Col id='toggleExpListCol1'/>
        <Col xs={5} id='toggleExpListCol'>
        <Stack gap={3} id='toggleListStack'>
      <div className="p-2" id='toggleExpensesListBlock'>
        <Button 
            variant='light'
            id='toggleExpListBtn'
            type='button'
            onClick={toggleExpensesList}
            // ARIA ATTRIBUTES
            aria-label={showExpenses ? 'Hide Travel Expenses': 'Show Travel Expenses'}
            aria-pressed={showExpenses}
            aria-expanded={showExpenses}
            aria-controls='expenses-list-panal'
            >
              {showExpenses ? 'Hide Travel Expenses': 'Show Travel Expenses'}
            </Button>
      </div>
      <div className="p-2" id='showBudgetListBlock'>
        <Button 
         variant='light'
         onClick={toggleBudgetList}
         id='toggleBudgetsBtn'
         type='button'
          //ARIA ATTRIBUTES:
          aria-label={showBudgetList ? 'Hide Travel Budgets': 'Show Travel Budgets'}
          aria-controls='budgetList-panal'
          aria-pressed={showBudgetList}
          aria-expanded={showBudgetList}
         >
          {showBudgetList ? 'Hide Travel Budgets': 'Show Travel Budgets'}
         </Button>
      </div>
      
    </Stack>
          
        </Col>
        <Col id='toggleExpListCol2'/>
      </Row>

      
          </div>
      <div id='calculator-panal'>
   <Row id='toggle-btns-row'>
        <Col id='toggle-col1'/>
        <Col xs={5} id='toggle-col'>
          <Stack gap={1} id='toggle-btns-stack'>
      <div id='toggle-calculator-block'>
        <Button 
          variant='light' 
          onClick={toggleCalculator} 
          id='toggleCalcBtn'
          type='button'
          // ARIA ATTRIBUTES:
          aria-label={showCalculator ? 'Hide Calculator': 'Show Calculator'}
          aria-pressed={showCalculator}
          aria-expanded={showCalculator}
          aria-controls='basic-calculator-panal'
          >
          {showCalculator ? 'Hide Calculator': 'Show Calculator'}
        </Button>
      </div>
      <div id='toggle-vatcalculator-block'>
        <Button
          variant='light'
          id='toggleVatCalcBtn'
          onClick={toggleVatCalculator}
          type='button'
          // ARIA ATTRIBUTES:
          aria-label={showVatCalc ? 'Hide Vat Calculator': 'Show Vat Calculator'}
          aria-pressed={showVatCalc}
          aria-expanded={showVatCalc}
          >{showVatCalc ? 'Hide Calculator': 'Show Vat Calculator'}</Button>
      </div>
      <div id='toggle-converter-block'>
        <Button 
        variant='light'
        type='button'
        onClick={toggleConverter} 
        id='toggleConverterBtn'
        // ARIA ATTRIBUTES:
        aria-label={showConverter ? 'Close Converter': 'Show Currency Converter'}
        aria-pressed={showConverter}
        aria-expanded={showConverter}
        aria-controls='currency-converter-panal'
        >
          {showConverter ? 'Close Converter': 'Show Currency Converter'}
        </Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggle-col2'/>
      </Row>
       </div>
       </div>
        </section>
              <div id='budgetPage-list-panal'>
{/* TOGGLE THE USER EXPENSES LIST */}
      {showExpenses && (
        <section className='budgetListSection'>
          <div id='expenses-list-panal'>
            <Row id='expenses-listRow'>
              <Col md={12} id='expListCol'>
                <ExpensesList/>
              </Col>
            </Row>
         </div>
        </section>
  
      )}
      {showBudgetList && (
        <section className='budgetListSection'>
        <div id='budgetList-panal'>
          <Row md={12} id='budgetsListRow'>
            <Col md={12} id='budgetsListCol'>
              {/* Reported above the table rather than inside it, so a list that
              failed to load says so where the rows would have been and a
              failed refresh does not replace the rows already on screen */}
              {budgetsError && (
                <p
                  className='infoText'
                  id='budgetsListError'
                  style={{ color: '#C22419' }}
                  role='alert'
                  aria-live='assertive'
                  >
                  {budgetsError}
                </p>
              )}
              {/* The trip budgets, read from the same GET /expense/fetchBudgets
              the add expense form's trip select is filled from. Each row carries
              only the four fields that list returns, so the list's own VIEW
              reads the whole budget back by its id through fetchBudget */}
              <BudgetList
                currentUser={currentUser}
                budgets={budgets}
                loadingBudgets={loadingBudgets}
                fetchBudgets={fetchBudgets}
                /* Reads one budget back from the API by its id, whole and with
                its virtuals, for the list's details panel */
                fetchBudget={fetchBudget}
                /* The budget form is on the expenses page, so this navigates
                there with the budget to be edited rather than opening a form */
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
            </Col>
          </Row>
        </div>
        </section>
      )}
      </div>
      {/* ======CALCULATORS + CURRENCY CONVERTER DISPLAY======= */}
      <div id='calculator-display-panal'>
      {/* TOGGLE THE CALCULATOR */}
      {showCalculator && (
        <section className='budgetSection2'>
<div id='basic-calculator-panal'>
          <Row id='basic-calculator-row'>
        <Col id='basic-calculator-col1'/>
        <Col xs={5} id='basic-calculator-col'>
          <div id='basic-calculator-block'>
            <Calculator/>
          </div>
        </Col>
        <Col id='basic-calculator-col2'/>
      </Row>
        </div>
        </section>
        
      )}
      {/* TOGGLE THE VAT CALCULATOR */}
      {showVatCalc && (
        <section className='budgetSection2'>
 <div id='vat-calculator-panal'>
          <Row id='vat-calculator-row'>
            <Col id='vat-calculator-col1'/>
            <Col xs={6}  id='vat-calculator-col'>
              <div id='vat-calculator-block'>
                <VatCalculator/>
              </div>
            </Col>
            <Col id='vat-calculator-col2'/>
          </Row>
        </div>
        </section>
       
      )}
      {/* TOGGLE THE CURRENCY CONVERTER */}
      {showConverter && (
        <section className='budgetSection2'>
           <div id='currency-converter-panal'>
        <Row id='currency-converter-row'>
        <Col id='currency-convert-col1'/>
        <Col xs={6} id='currency-convert-col'>
          <div id='converter-display-block'>
           <CurrencyConverter
            convert={convert}
            saveConversions={saveConversions}
            EMPTY_CONVERT_FORM={EMPTY_CONVERT_FORM}
            currencyOptions={currencyOptions}
            form={form}
            setForm={setForm}
            result={result}
            error={error}
            setError={setError}
            loading={loading}
            setLoading={setLoading}
            setResult={setResult}
          /> 
          </div>
        </Col>
        <Col id='currency-convert-col2'/>
      </Row>
        </div>
        </section>
       
      )}
      </div>
      
         
      
        {/* ====================
        SECTION 3
        ========== */}
        <section id='budgetSection3'>
        <div id='budget-section3-panal'>
          <Row id='toggle-calculations-row'>
        <Col id='toggle-calculations-col1'/>
        <Col xs={5} id='toggle-calculations-col'>
          <Stack gap={3} id='show-calculations-stack'>
      <div className="p-2">
        <Button
        variant='light'
        onClick={toggleVatCalculations}
        id='toggleVatCalculationsBtn'
        type='button'
        // ARIA ATTRIBUTES:
        aria-label={showVatCalculations ? 'Hide Vat Calculations':'SHOW VAT CALCULATIONS'}
        aria-pressed={showVatCalculations}
        aria-expanded={showVatCalculations}
        aria-controls='vat-calculations-panal'
        >
          {showVatCalculations ? 'Hide Vat Calculations':'SHOW VAT CALCULATIONS'}
        </Button>
      </div>
      <div className="p-2">
        <Button
        variant='light'
        onClick={toggleConversions}
        type='button'
        id='toggleConversionsBtn'
        // ARIA ATTRIBUTES:
        aria-label={showConversions ? 'Hide Conversions' : 'Show Conversions'}
        aria-pressed={showConversions}
        aria-expanded={showConversions}
        aria-controls='conversions-list-panal'
        >
          {showConversions ? 'Hide Conversions' : 'Show Conversions'}
        </Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggle-calculations-col2'/>
        </Row>
        <div id='calculations-panal'>
        {/* TOGGLE VAT CALCULATIONS LIST */}
        {showVatCalculations && (
          <div id='vat-calculations-panal'>
            <Row id='vatCalculationsRow'>
              <Col id='vatCalculationsCol'>
                <div id='vat-calculations-display-block'>
                  <VatCalculationsList
                  currentUser={currentUser}
                    vatCalculationsTotal={vatCalculationsTotal}
                    loggedIn={loggedIn}
                    vatCalculations={vatCalculations}
                    loadingVatCalculations={loadingVatCalculations}
                    vatCalculationError={vatCalculationsError}
                    setVatCalculationsError={setVatCalculationsError}
                    fetchVatCalculations={fetchVatCalculations}
                    deleteVatCalculation={deleteVatCalculation}
                  />
                </div>
              </Col>
            </Row>
          </div>
        )}
        {/* TOGGLE CONVERSIONS LIST */}
        {showConversions && (
          <div id='conversions-list-panal'>
          <Row id='conversions-list-Row'>
            <Col id='conversionsListCol'>
              <div id='conversions-list-display'>
                <ConversionsList
                  currentUser={currentUser}
                  loggedIn={loggedIn}
                  conversionsTotal={conversionsTotal}
                  currencyOptions={currencyOptions}
                  conversions={conversions}
                  loadingConversions={loadingConversions}
                  error={error}
                  setError={setError}
                  fetchConversions={fetchConversions}
                  deleteConversion={deleteConversion}
                />
              </div>
            </Col>
          </Row>
          </div>
        )}
        </div>
        </div>
        </section>
      <Footer logout={logout}/>
    </div>
  )
}
