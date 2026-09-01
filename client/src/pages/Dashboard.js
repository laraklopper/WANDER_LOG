import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Dashboard.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Dashboard({currentUser, logout}) {
  /* fullName arrives from the API as a nested { firstName, lastName } object, so
  it cannot be rendered directly. The fullNameString virtual is the flattened
  form the API sends alongside it, and the nested parts are joined as a fallback
  in case a response was built without the virtual */
  const {firstName = '', lastName = ''} = currentUser?.fullName || {};
  const fullName = currentUser?.fullNameString?.trim() || `${firstName} ${lastName}`.trim();

  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'DASHBOARD'}/>
      <section id='dashboardSection1'>
        <div id='dashboardSection1Content'>
          <Row id='dashboard-row1'>
            <Col md={12}>
              <h3 id='dashboardHeading'>Welcome {fullName || 'User'} to Wander Log!</h3>
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
