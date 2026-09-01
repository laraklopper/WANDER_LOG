import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/TravelLog.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function TravelLog({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'TRAVEL LOG'}/>
      <Footer logout={logout}/>
    </div>
  )
}
