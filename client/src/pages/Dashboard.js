//Dashboard.js: Route '/'
//IMPORT REQUIRED MODULES AND PACKAGES
import React from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Dashboard.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'

// ============MAIN DASHBOARD COMPONENT============
export default function Dashboard(//Export the default Dashboard.js function component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, 
    logout
  }
) {
  /* fullName arrives from the API as a nested { firstName, lastName } object, so
  it cannot be rendered directly. The fullNameString virtual is the flattened
  form the API sends alongside it, and the nested parts are joined as a fallback
  in case a response was built without the virtual */
  const {firstName = '', lastName = ''} = currentUser?.fullName || {};
  const fullName = currentUser?.fullNameString?.trim() || `${firstName} ${lastName}`.trim();

  //=====================JSX RENDERING========================
  return (
    <div id='pageContainer' aria-labelledby='pageTitle' role='main'>
    {/* ---------Screen Reader Page Heading-------------- */}
    <p className='visually-hidden' id='pageTitle'>USER DASHBOARD PAGE</p>
    {/* =========HEADER========= */}
    {/* Render the Header.js function component 
    with 'DASHBOARD' as the pageHeader */}
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
