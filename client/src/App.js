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

export default function App() {
  const [users, setUsers] = useState([])
  const [userData, setUserData] = useState({
    username: '',
    fullName: {
      firstName: '',
      lastName: '',
    },
    email : '',
    dateOfBirth: '',
    password: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      province: '',
    },
    admin: false,
    profilePicture: ''
  })
  const [currentUser, setCurrentUser] = useState(null)
  const [loggedIn, setLoggedIn] = useState (false)
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
       const token = localStorage.getItem('token');
       if (!token || !loggedIn) return

       const response = await fetch('http://localhost:3001/fetchUsers', {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
       })
       const fetchedUsers = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(fetchedUsers?.message || fetchedUsers?.error || 'Failed to fetch users');

          if (Array.isArray(fetchedUsers)) {
          setUsers(fetchedUsers);//Update the setUsers state with the usersList
          setError(null);// Clear any previous errors
          console.log(`[SUCCESS: App.js] Fetched ${fetchedUsers.length} users`);
        } else {
          throw new Error('Invalid data format received from server');//Throw an error message if the data format is invalid
        }
      } catch (error) {
        console.error('Error fetching user data:', error.message);//Log an error message in the console for debugging purposes
        setError(`Error fetching user data: ${error.message}`);
      }
    }
     //Function to fetch current loggedIn user
    const fetchCurrentUser = async () => {//Define an async function to fetch current user details
      try {
        const token = localStorage.getItem('token');// Retrieve the JWT token from localStorage
        if (!token || !loggedIn) return;// If no token is found, exit the function
        const response = await fetch('http://localhost:3001/users/me', {
          method: 'GET',//HTTP request method
          mode: 'cors',//Enable Cross-Origin Resource Sharing 
          headers: { 
            'Content-Type': 'application/json',// Specify the Content-Type being sent in the request payload.
            'Authorization': `Bearer ${token}` // Attach the token in the Authorization header  
          },
        });
        const fetchedUser = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(fetchedUser?.message || fetchedUser?.error || 'Failed to fetch current user');
        if (fetchedUser && typeof fetchedUser === 'object' && !fetchedUser.error) {
          setCurrentUser(fetchedUser);
          setError(null);// Clear any previous errors
          console.log('[SUCCESS: App.js] Fetched current user data');
        } else {
          throw new Error('Invalid data format received from server');//Throw an error message if the data format is invalid
        }
      } catch (error) {
        console.error('Error fetching current user data:', error.message);//Log an error message in the console for debugging purposes
        setError(`Error fetching current user data: ${error.message}`);// Set the error state to display the error in the UI
      }
    };
        //Conditional rendering to check if the user is logged in before fetching data
    if (loggedIn) {
      /* Call the FetchUsers function to 
      fetch the list of users*/
      fetchCurrentUser();
      /*Call the FetchCurrentUser function to fetch the 
      current user's details*/
      fetchUsers();
    }
  },[users, setError, loggedIn])
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('loggedIn')
    setLoggedIn(false)
    setError('')
    setUserData(
      {
        username: '',
        password: ''
      }
    )
    navigate('/');

  },[navigate])
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
                <Users currentUser={currentUser} logout={logout}/>
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
      </Container>
    </>
  )
}
