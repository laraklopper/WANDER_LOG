import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Journal.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
export default function Journal({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'JOURNAL'}/>
      <Footer logout={logout}/>
    </div>
  )
}
