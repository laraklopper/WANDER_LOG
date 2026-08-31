import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function TravelLog({currentUser, logout}) {
  return (
    <div>
      <Header currentUser={currentUser} heading={'TRAVEL LOG'}/>
      <Footer logout={logout}/>
    </div>
  )
}
