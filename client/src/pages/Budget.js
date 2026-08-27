import React from 'react'
import '../css/pagesCss/PageSetup.css'
import Header from '../components/Header'
export default function Budget({currentUser}) {
  return (
    <div>
      <Header currentUser={currentUser} heading={'BUDGET'}/>
    </div>
  )
}
