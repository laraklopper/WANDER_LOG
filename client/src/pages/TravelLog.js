import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/TravelLog.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

//=======MAIN TRAVELLOG FUNCTION COMPONENT=========
export default function TravelLog(//Export the default TravelLog.js function component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, 
    logout
  }
) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'TRAVEL LOG'}/>
      <Footer logout={logout}/>
    </div>
  )
}
