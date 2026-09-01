import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Budget.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
export default function Budget({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'BUDGET'}/>
      <Footer logout={logout}/>
    </div>
  )
}
