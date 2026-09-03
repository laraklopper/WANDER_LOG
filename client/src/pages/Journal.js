// Journal.js Route '/journal'
//IMPORT REQUIRED MODULES AND PACKAGES
import React from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Journal.css'
// IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'

// ============MAIN JOURNAL COMPONENT============
export default function Journal(//Export default Journal.js component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'JOURNAL'}/>
      <Footer logout={logout}/>
    </div>
  )
}
