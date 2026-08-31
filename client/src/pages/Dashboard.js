import React from 'react'
import '../css/pagesCss/PageSetup.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Dashboard({currentUser, logout}) {
  return (
    <div>
      <Header currentUser={currentUser} heading={'DASHBOARD'}/>
      <Footer logout={logout}/>
    </div>
  )
}
