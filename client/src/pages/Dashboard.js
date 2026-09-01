import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Dashboard.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Dashboard({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'DASHBOARD'}/>
      <section id='dashboardSection1'>
        <div id='dashboardSection1Content'>
          <Row id='dashboard-row1'>
            <Col md={12}>
              <h3 id='dashboardHeading'>Welcome {currentUser?.fullName || 'User'} to Wander Log!</h3>
            </Col>
          </Row>
          <Row id='dashboard-row2'>
            <Col md={12}>
              <p id='dashboardText'>Wander Log is a travel journal application that allows you to document your travel experiences, create a travel log, and keep track of your adventures. You can add entries to your travel log, write journal entries, and view your past trips. Start exploring the world and documenting your journeys with Wander Log!</p>
            </Col>
          </Row>
        </div>
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
