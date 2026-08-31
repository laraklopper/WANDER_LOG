import React from 'react'
import Header from '../components/Header'

export default function TravelLog({currentUser, logout}) {
  return (
    <div>
      <Header currentUser={currentUser} heading={'TRAVEL LOG'}/>
    </div>
  )
}
