import React from 'react'
import '../css/pagesCss/PageSetup.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Profile({currentUser, logout}) {
  return (
    <div>
      <Header currentUser={currentUser} heading={'PROFILE'}/>
      <Footer logout={logout}/>
    </div>
  )
}
