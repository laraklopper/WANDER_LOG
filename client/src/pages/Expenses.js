import React from 'react'
import '../css/pagesCss/Expenses.css'
import '../css/pagesCss/PageSetup.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Expenses({currentUser, logout}) {
  return (
    <div id='pageContainer'>
        <Header currentUser={currentUser}/>
        <Footer logout={logout}/>
    </div>
  )
}
