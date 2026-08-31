import React from 'react'
import '../css/pagesCss/PageSetup.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Users({currentUser, logout}) {
  return (
    <div>
      <Header currentUser={currentUser} heading={'USERS'}/>
      <Footer logout={logout}/>
    </div>
  )
}
