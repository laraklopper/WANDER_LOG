import React from 'react'
import '../css/pagesCss/PageSetup.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
export default function Budget({currentUser, logout}) {
  return (
    <div>
      <Header currentUser={currentUser} heading={'BUDGET'}/>
      <Footer logout={logout}/>
    </div>
  )
}
