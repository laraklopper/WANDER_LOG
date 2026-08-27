import React, {useState} from 'react'
import './App.css'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// IMPORT ICONS FROM LUCIDE-REACT
import { Bug, GlobeOff } from 'lucide-react';

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
      <Container>
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
      </Container>

    </>
   
  )
}
