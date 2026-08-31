import React from 'react'
import '../css/pagesCss/PageSetup.css'
import Header from '../components/Header'

export default function Users({currentUser, logout}) {
  return (
    <div>
      <Header currentUser={currentUser} heading={'USERS'}/>
    </div>
  )
}
