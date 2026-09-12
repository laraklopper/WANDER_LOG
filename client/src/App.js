import React, {useCallback, useEffect, useState} from 'react'
import './App.css'
import './css/pagesCss/Errors.css'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Routes, Route, useNavigate } from 'react-router-dom'
// IMPORT ICONS FROM LUCIDE-REACT
import { Bug, GlobeOff } from 'lucide-react';
import ProtectedUserRoute from './protectedRoutes/ProtectedUserRoute'
import ProtectedAdminRoute from './protectedRoutes/ProtectedAdminRoute'
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'
import TravelLog from './pages/TravelLog';
import Budget from './pages/Budget';
import Journal from './pages/Journal';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Expenses from './pages/Expenses';


/* The login form only ever fills in these two fields, so this is the whole
shape of userData. Registration keeps its own state inside pages/Register.js */
const EMPTY_CREDENTIALS = {
  username: '',
  password: '',
};

export default function App() {
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userData, setUserData] = useState(EMPTY_CREDENTIALS)
  const [currentUser, setCurrentUser] = useState(null)
  /* Seeded from localStorage so a page reload does not drop a valid session.
  The token is confirmed against the API by the effect below, which logs the
  user out again if it has expired or been tampered with */
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('token')))
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  /* Loads every registered user for the admin only users page.
  Held here rather than in pages/Users.js because the list is state the whole
  app shares, and defined as a callback rather than inside the effect below so
  that the page's refresh button and deleteUser can both reload it.

  loadingUsers is reported to the list so the table can say a request is in
  flight instead of showing itself empty while the users are on their way */
  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('token');
    // Conditional rendering to check a session is still stored
    if (!token) {
      console.warn('[WARN: App.js] No token stored, cannot fetch the users');
      return;
    }

    try {
      setLoadingUsers(true)

      const response = await fetch('http://localhost:3001/users/findUsers', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })

      const fetchedUsers = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(fetchedUsers?.message || fetchedUsers?.error || 'Failed to fetch users');

      if (Array.isArray(fetchedUsers)) {
      setUsers(fetchedUsers);//Update the setUsers state with the usersList
      setError(null);// Clear any previous errors
      console.log(`[SUCCESS: App.js] Fetched ${fetchedUsers.length} users`);
      }else{
        throw new Error('Invalid data format received from server');//Throw an error message if the data format is invalid
      }
    } catch (error) {
      console.error('Error fetching user data:', error.message);//Log an error message in the console for debugging purposes
      setError(`Error fetching user data: ${error.message}`);
    } finally {
      setLoadingUsers(false)
    }
  },[])

  /* Sends one user's id to DELETE /users/:id/deleteUser.
  The route is admin only and refuses both the acting admin's own account and
  any other admin, so those two are reported back as a 403 rather than removed.

  Nothing an account owns outlives it: the route clears the user's trips,
  journal entries, budgets, the expenses embedded in those budgets and both
  saved calculation histories. That is why the list is reloaded rather than the
  row simply being dropped here.

  Returns whether the user actually went, so the list can close its details
  panel on success and leave it open on the account it failed to remove */
  const deleteUser = useCallback(async (userId) => {
    // Conditional rendering to check a user was identified
    if (!userId) {
      console.warn('[WARN: App.js] No user id given, cannot delete the user');
      return false;
    }

    const token = localStorage.getItem('token');
    // Conditional rendering to check a session is still stored
    if (!token) {
      setError('Your session has expired. Please log in again.')
      console.warn('[WARN: App.js] No token stored, cannot delete the user');
      return false;
    }

    try {
      setError(null)

      const response = await fetch(`http://localhost:3001/users/${userId}/deleteUser`, {
        method: 'DELETE',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      /* Safely parse the JSON response. Guarded because the body may be empty
      or not JSON at all, and response.json() would throw before the status
      could be reported */
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        /* A 400 for a malformed id, a 403 for an admin account or the admin's
        own, a 404 for a user that is not stored and a 401 once the session has
        gone all arrive with their own message, so it is reported as it was given */
        const message = data?.message || response?.statusText || 'Could not delete the user.';
        setError(message)
        console.error(`[ERROR: App.js] Delete user failed with status ${response.status}: ${message}`)
        return false
      }

      /* Awaited so the caller's delete stays busy until the refreshed list has
      arrived rather than only until the DELETE answered, and the row is gone
      from the table by the time the button reports itself done */
      await fetchUsers()

      alert(data.message || 'User deleted successfully.')
      console.log('[SUCCESS: App.js] User deleted:', data.username || userId, 'with', data.removedTrips ?? 0, 'trip(s) and', data.removedEntries ?? 0, 'entry(s)')
      return true
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError('Could not reach the server. Please check your connection and try again.')
      console.error(`[ERROR: App.js] Delete user request failed: ${error.message}`)
      return false
    }
  },[fetchUsers])

  /* The user list is only of use on the admin only users page, so it waits
  until currentUser has loaded and turns out to be an admin. The admin flag is
  read as a boolean rather than the effect depending on currentUser itself,
  which is replaced by a new object on every fetch and would re-run this
  endlessly */
  useEffect(() => {
    if (loggedIn && currentUser?.admin) {
      fetchUsers();
    }
  },[loggedIn, currentUser?.admin, fetchUsers])

  useEffect(() => {
 const fetchCurrentUser = async () => {//Define an async function to fetch current user details
      try {
        const token = localStorage.getItem('token');
        if(!token || !loggedIn) return;
        const response = await fetch('http://localhost:3001/users/me', {
          method: 'GET',//HTTP request method
          mode: 'cors',//Enable Cross-Origin Resource Sharing
          headers: {
            'Content-Type':'application/json',
            'Authorization': `Bearer ${token}`
          },// Attach the token in the Authorization header
        });

         const fetchedUser = await response.json().catch(() => ({}));

        /* A 401 means the token is expired or invalid rather than that the
        request went wrong, so the session is ended instead of showing an error */
        if (response.status === 401) {
          console.warn('[WARN: App.js] Stored session is no longer valid, logging out');
          return;
        }

       if (!response.ok) throw new Error(fetchedUser?.message || fetchedUser?.error || 'Failed to fetch current user');

        setCurrentUser(fetchedUser);
        setError(null);// Clear any previous errors
        console.log('[SUCCESS: App.js] Fetched current user data');
      } catch (error) {
        console.error('Error fetching current user data:', error.message);//Log an error message in the console for debugging purposes
        /* The session could not be confirmed, so it is ended rather than left
        with loggedIn true and currentUser null, a state the protected routes
        cannot resolve. logout() clears the error, so it is set afterwards */
      
        setError(`Could not restore your session: ${error.message}`);// Set the error state to display the error in the UI
      }
    };
    if (loggedIn) {
      fetchCurrentUser();
    }
  },[loggedIn])


  //========EVENT HANDLERS==================
   const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('loggedIn')
    setLoggedIn(false)
    setCurrentUser(null)
    setUsers([])
    setError('')
    setUserData(EMPTY_CREDENTIALS)
    navigate('/');

  },[navigate])

  // /* True only while a token exists and the user behind it is still being
  // fetched. The effect above always resolves it, either by setting currentUser or
  // by logging out, so this is never a permanent state */
  const authLoading = loggedIn && !currentUser;
  return (
    <>
      <Container id='appContainer'>
        <Row id='global-error-row'>
          <Col xs={0} md id='errorCol1'/>
          <Col xs={12} md={8} id='global-error-col'>
            {/* ---------GLOBAL ERROR MESSAGE------------ */}
            <div id='globalErrorBlock' role='alert' aria-atomic='true'>
              {error && 
              <span id='error-span'>
                <Bug size={20} fontWeight={900} color='#3D0F13' aria-hidden='true'/>
                <p id='errorMessage'>{error}</p>  
              </span>
              }
            </div>
          </Col>
          <Col xs={0} md id='errorCol2'/>
        </Row>
        {/* A session was found but the user behind it has not loaded yet.
        The routes are held back until it has, because the protected routes read
        currentUser and would otherwise redirect to '/', which is itself a
        protected route, sending the app into a redirect loop */}
        {authLoading ? (
          <div id='authLoadingBlock' role='status' aria-live='polite'>
            <p id='authLoadingText'>Restoring your session...</p>
          </div>
        ) : (
        <Routes>
        {loggedIn ? (
          <>
            <Route exact path='/' element={
              <ProtectedUserRoute currentUser={currentUser}>
                <Dashboard currentUser={currentUser} logout={logout}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/travelLog' element={
              <ProtectedUserRoute currentUser={currentUser}>
                {/* setError is passed through because the trip list loads
                itself from /trip/fetchTrips: a failed request is reported in
                the global error block above, the same as the other pages */}
                <TravelLog currentUser={currentUser} logout={logout} setError={setError}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/journal' element={
              <ProtectedUserRoute currentUser={currentUser}>
                <Journal currentUser={currentUser} logout={logout} setError={setError}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/exp' element={
              <ProtectedUserRoute currentUser={currentUser}>
                <Expenses currentUser={currentUser} logout={logout} setError={setError}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/budget' element={
              <ProtectedUserRoute currentUser={currentUser}>
                {/* loggedIn is passed through because the saved VAT calculations
                list gates itself on it: /vat/history takes the user from the
                token, so without a session there is nothing to list */}
                <Budget currentUser={currentUser} logout={logout} setError={setError} error={error} loggedIn={loggedIn}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/profile' element={
              <ProtectedUserRoute currentUser={currentUser}>
                {/* setCurrentUser is passed down because the edit form saves
                changes to the account held here, and the PATCH returns the
                updated user. Without it a new profile picture would not appear
                until the next reload refetched the account */}
                <Profile
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser}
                  logout={logout}
                  setError={setError}
                />
              </ProtectedUserRoute>
            }/>
            <Route path='/users' element={
              <ProtectedAdminRoute currentUser={currentUser}>
                {/* The user list, its loading flag, its reload and its delete
                are all passed down because they are owned here: the list is
                fetched on login and reloaded after a delete, so the page
                displays that state rather than keeping a copy of its own */}
                <Users
                  currentUser={currentUser}
                  users={users}
                  loadingUsers={loadingUsers}
                  fetchUsers={fetchUsers}
                  deleteUser={deleteUser}
                  logout={logout}
                />
              </ProtectedAdminRoute>
            }/>
          </>
        ):(
          <>
            <Route exact path='/' element={
              <Login
                userData={userData}
                setUserData={setUserData}
                setError={setError}
                loggedIn={loggedIn}
                setLoggedIn={setLoggedIn}
                setCurrentUser={setCurrentUser}
              />
            }/>
            <Route path='/reg' element={
              <Register
                setError={setError}
              />
            }/>
          </>
        )}
        {/* FALL BACK ROUTE: Response 404 PAGE NOT FOUND */}
        <Route path='*' element={
          <span id='pageNotFound'>
           <h2 id='pageNotFound-text'>404: Page Not Found</h2><GlobeOff fontSize={42} fontWeight={800} color='#470D09'/>
          </span>
        }/>
        </Routes>
        )}
      </Container>
    </>
  )
}
