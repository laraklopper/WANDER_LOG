import React, {useState} from 'react'
import './App.css'

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
  const [loggedIn, setLoggedIn] = useState
  return (
    <>

    </>
   
  )
}
