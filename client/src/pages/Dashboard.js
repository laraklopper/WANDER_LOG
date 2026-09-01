import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Dashboard.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Dashboard({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'DASHBOARD'}/>
      <section id='dashboardSection1'>
        
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
