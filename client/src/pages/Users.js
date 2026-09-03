// Users.js Route: '/users'; Admin Only Page
//IMPORT REQUIRED MODULES AND PACKAGES
import React from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Users.css'
// IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'

//=======MAIN USERS FUNCTION COMPONENT=========
export default function Users(///Export default Users.js component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, 
    logout
}
) {
  //============JSX RENDERING=============
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'USERS'}/>
      <Footer logout={logout}/>
    </div>
  )
}
