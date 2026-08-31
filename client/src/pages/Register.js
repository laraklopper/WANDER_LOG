import React, { useCallback, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MainHeader from '../components/MainHeader'
import RegistrationForm from '../components/RegistrationForm'; 
import { useNavigate } from 'react-router-dom';


// Empty form shape, shared with the page that owns the sta

export default function Register({setError}) {
  const [newUserData, setNewUserData] = useState({
     username: '',
  fullName: {
    firstName: '',
    lastName: '',
  },
  email: '',
  dateOfBirth: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    province: '',
  },
  admin: false,
  profilePicture: '',
  password: '',
  confirmPassword: ''
  })

  const navigate = useNavigate()
  const addUser = useCallback(async () => {
    try {
      setError?.(null)

      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username :newUserData.username,
          fullName: newUserData.fullName,
          email: newUserData.email,
          dateOfBirth: newUserData.dateOfBirth,
          address: newUserData.address,
          admin : newUserData.admin,
          profilePicture: newUserData.profilePicture,
          password: newUserData.password,
          // Sent so the schema can re-check the match on the server
          confirmPassword: newUserData.confirmPassword

        })
      })

       const data = await response.json().catch(() => ({}));

       if (response.ok) {
        setError?.(null)
        alert('Registration Successful')
        navigate('/')
       } else {
          const message = data.message || 'Registration failed.';
           setError?.(message);
      console.error(`Registration failed: ${message}`);
       }
    } catch (error) {
    alert('Registration failed. Please try again.');
    setError?.(`Registration failed: ${error.message}`);
    console.error(`Registration failed: ${error.message}`);
    }
  },[setError, navigate, newUserData])
  return (
    <div id='pageContainer'>
      <MainHeader mainHeading={'REGISTER'}/>
      <section id='regis-section1'>
   <Row id='register-row'>
        <Col md={12}>
          <div id='regis-form-panal'>
            <div>
             <RegistrationForm
              newUserData={newUserData}
              setNewUserData={setNewUserData}
              addUser={addUser}
             /> 
            </div>
            
          </div>
          
        </Col>
  
      </Row>
      </section>
   
    </div>
  )
}
