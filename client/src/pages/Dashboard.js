//Dashboard.js: Route '/'
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
        <div id='dashboardSection1Content' aria-describedby='dashboardText'>
        <p id='dashboardText' className='visually-hidden'>Wander Log is a travel journal application that allows you to document your travel experiences, create a travel log, and keep track of your adventures.</p>
          <Row id='dashboard-row1'>
            <Col md={12} id='dashboard-col1'>
              <h3 id='dashboardHeading'>Welcome {fullName || 'User'}!</h3>
            </Col>
          </Row>
          <Row id='dashboard-row2'>
            <Col md={12} id='dashboard-col2'>
              
            </Col>
          </Row>
        </div>
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
