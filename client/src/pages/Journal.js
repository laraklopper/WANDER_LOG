import React from 'react'
import '../css/pagesCss/PageSetup.css'
import Header from '../components/Header'
export default function Journal({currentUser}) {
  return (
    <div>
      <Header currentUser={currentUser} heading={'JOURNAL'}/>
    </div>
  )
}
