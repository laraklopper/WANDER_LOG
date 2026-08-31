import React, {useState} from 'react'
import './App.css'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Routes, Route } from 'react-router-dom'
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
                <Dashboard currentUser={currentUser}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/travelLog' element={
              <ProtectedUserRoute currentUser={currentUser}>
                <TravelLog currentUser={currentUser}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/journal' element={
              <ProtectedUserRoute currentUser={currentUser}>
                <Journal currentUser={currentUser}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/budget' element={
              <ProtectedUserRoute currentUser={currentUser}>
                <Budget currentUser={currentUser}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/profile' element={
              <ProtectedUserRoute currentUser={currentUser}>
                <Profile currentUser={currentUser}/>
              </ProtectedUserRoute>
            }/>
            <Route path='/users' element={
              <ProtectedAdminRoute currentUser={currentUser}>
                <Users currentUser={currentUser}/>
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
