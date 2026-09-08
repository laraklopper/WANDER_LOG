//Dashboard.js: Route '/'
//IMPORT REQUIRED MODULES AND PACKAGES
import React from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Dashboard.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
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
          <div id='dashBoardProfile'>
              <Row id='dashboard-row2'>
               <Col xs={12} md={8} id='dashboardProfile-col1'>
              <div id='dashboardProfileBody'>
{/* username , email, admin status */}
<Stack gap={3} id='dashboardStack'>
{/* FULL NAME */}
      <div className="p-2" id='dashboardUsernameBlock1'>
     
      <span className='profile-span'>
        <h5 className='profile-label'>NAME:</h5>
        <span id='profileFullName'>
          <h6 className='profile-value'>{currentUser?.fullName?.firstName || 'NOT_AVAILABLE'}</h6>
          <h6 className='profile-value'> {currentUser?.fullName?.lastName || 'NOT_AVAILABLE'}</h6>
        </span>
        
      </span>
             
      
      </div>
      {/* USERNAME */}
      <div className="p-2" id='dashboardProfileBlock2'>
  <span className='profile-span'>
          <h5 className='profile-label'>USERNAME:</h5>
          <h6 className='profile-value'>{currentUser?.username || 'NOT_AVAILABLE'}</h6>
        </span>
      </div>
      {/* EMAIL */}
      <div className="p-2" id='dashboardProfileBlock3'>
        <span className='profile-span'>
          <h5 className='profile-label'>EMAIL:</h5>
          <h6 className='profile-value'>{currentUser?.email || 'NOT_AVAILABLE'}</h6>
        </span>
      </div>
      {/* ADMIN STATUS */}
      <div className="p-2" id='dashboardProfileBlock4'>
        <span className='profile-span'>
          <h5 className='profile-label'>LOGGED IN AS:</h5>
          <h6 className='profile-value'>
            {currentUser?.admin ? 'ADMIN' : 'USER'}
          </h6>
        </span>
      </div>
    </Stack>
              </div>
            </Col>
            <Col xs={6} md={4} id='dashboardProfile-col2'>
              {/* PROFILE PICTURE IF SET */}
            </Col>
          </Row>
          </div>
         
        </div>
      </section>
      <section id='dashboardSection2'>
        <div id='dashBoardSec2-panal'>
          <Row id='dashboardLinkRow'>
            <Col md={12} id='dashBoardLinkCol'>
              
            </Col>
            
      </Row>

        </div>
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
