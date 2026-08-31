import React, {useCallback, useEffect, useState} from 'react'
import './App.css'
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
import { ENDPOINTS, authHeaders, errorMessage, parseJson } from './api/config';

/* The login form only ever fills in these two fields, so this is the whole
shape of userData. Registration keeps its own state inside pages/Register.js */
const EMPTY_CREDENTIALS = {
  username: '',
  password: '',
};

export default function App() {
  const [users, setUsers] = useState([])
  const [userData, setUserData] = useState(EMPTY_CREDENTIALS)
  const [currentUser, setCurrentUser] = useState(null)
  /* Seeded from localStorage so a page reload does not drop a valid session.
  The token is confirmed against the API by the effect below, which logs the
  user out again if it has expired or been tampered with */
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('token')))
  const [error, setError] = useState(null)

  const navigate = useNavigate()

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

  /* Turns the stored token back into a user object, on login and on every
  reload. Until this resolves currentUser is null, which is what the protected
  routes check, so an expired token cannot leave a stale user signed in */
  useEffect(() => {
    if (!loggedIn) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setLoggedIn(false);
      return;
    }

    // Set if the component unmounts first, so no state is written afterwards
    let cancelled = false;

    const fetchCurrentUser = async () => {//Define an async function to fetch current user details
      try {
        const response = await fetch(ENDPOINTS.currentUser, {
          method: 'GET',//HTTP request method
          mode: 'cors',//Enable Cross-Origin Resource Sharing
          headers: authHeaders(token),// Attach the token in the Authorization header
        });

        const fetchedUser = await parseJson(response);
        if (cancelled) return;

        /* A 401 means the token is expired or invalid rather than that the
        request went wrong, so the session is ended instead of showing an error */
        if (response.status === 401) {
          console.warn('[WARN: App.js] Stored session is no longer valid, logging out');
          logout();
          return;
        }

        if (!response.ok) {
          throw new Error(errorMessage(response, fetchedUser, 'Failed to fetch current user'));
        }

        setCurrentUser(fetchedUser);
        setError(null);// Clear any previous errors
        console.log('[SUCCESS: App.js] Fetched current user data');
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching current user data:', error.message);//Log an error message in the console for debugging purposes
        /* The session could not be confirmed, so it is ended rather than left
        with loggedIn true and currentUser null, a state the protected routes
        cannot resolve. logout() clears the error, so it is set afterwards */
        logout();
        setError(`Could not restore your session: ${error.message}`);// Set the error state to display the error in the UI
      }
    };

    fetchCurrentUser();

    return () => { cancelled = true };
  },[loggedIn, logout])

  /* The user list is an admin only endpoint, so it is fetched in its own effect
  that waits until currentUser has loaded and turns out to be an admin.
  Requesting it for a regular user would only ever come back as a 403 */
  useEffect(() => {
    if (!currentUser?.admin) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    let cancelled = false;

    const fetchUsers = async () => {
      try {
        const response = await fetch(ENDPOINTS.findUsers, {
          method: 'GET',
          mode: 'cors',
          headers: authHeaders(token),
        })

        const fetchedUsers = await parseJson(response);
        if (cancelled) return;

        if (!response.ok) {
          throw new Error(errorMessage(response, fetchedUsers, 'Failed to fetch users'));
        }

        if (!Array.isArray(fetchedUsers)) {
          throw new Error('Invalid data format received from server');//Throw an error message if the data format is invalid
        }

        setUsers(fetchedUsers);//Update the setUsers state with the usersList
        setError(null);// Clear any previous errors
        console.log(`[SUCCESS: App.js] Fetched ${fetchedUsers.length} users`);
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching user data:', error.message);//Log an error message in the console for debugging purposes
        setError(`Error fetching user data: ${error.message}`);
      }
    }

    fetchUsers();

    return () => { cancelled = true };
  },[currentUser])

  /* True only while a token exists and the user behind it is still being
  fetched. The effect above always resolves it, either by setting currentUser or
  by logging out, so this is never a permanent state */
  const authLoading = loggedIn && !currentUser;
  return (
    <>
      <Container id='appContainer'>
        <Row>
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
                <TravelLog currentUser={currentUser} logout={logout}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/journal' element={
              <ProtectedUserRoute currentUser={currentUser}>
                <Journal currentUser={currentUser} logout={logout}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/budget' element={
              <ProtectedUserRoute currentUser={currentUser}>
                <Budget currentUser={currentUser} logout={logout}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/profile' element={
              <ProtectedUserRoute currentUser={currentUser}>
                <Profile currentUser={currentUser} logout={logout}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/users' element={
              <ProtectedAdminRoute currentUser={currentUser}>
                <Users currentUser={currentUser} users={users} logout={logout}/>
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
