import React, { useCallback, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/TravelLog.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Header from '../components/Header'
import Footer from '../components/Footer'
import TripsList from '../components/TripsList';

//=======MAIN TRAVELLOG FUNCTION COMPONENT=========
export default function TravelLog(//Export the default TravelLog.js function component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, 
    logout
  }
) {
  const [showTrips, setShowTrips] = useState(false)
  const [showEntries, setShowEntries] = useState(false)

  const toggleTrips = useCallback(() => {
    setShowTrips(prev => (!prev))
    setShowEntries(false)
  },[])

  const toggleEntries = useCallback(() => {
    setShowEntries(prev => (!prev))
    setShowTrips(false)
  },[])
  //============JSX RENDERING=================
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'TRAVEL LOG'}/>
      <section id='travelLog-section1'>
        <div id='travelLog-sec1Panal'>
           <Row id='travelLogToggleRow'>
        <Col id='travelLogToggleCol1'/>
        <Col xs={6} id='travelLogToggleCol'>
          <Stack gap={3} id='travelLogToggleStack'>
            <div className="p-2" id='toggleTripsBlock'>
              <Button
              variant='light'
               onClick={toggleTrips} 
               id='toggleTripListBtn'
               >SHOW TRIPS</Button>
            </div>
            <div className="p-2" id='toggleEntryBlock'>
              <Button variant='light' onClick={toggleEntries} id='toggleEntriesListBtn'>SHOW ENTRIES</Button>
            </div>
    </Stack>
        </Col>
        <Col id='travelLogToggleCol2'/>
      </Row>
      {showTrips && (
        <div id='trips-list-panal'>
          <Row id='tripsListRow'>
            <Col id='tripsListCol'>
              <div id='tripsList-div'>
                <TripsList
                  currentUser={currentUser}
                />
              </div>
            </Col>
          </Row>
        </div>
      )}
      {showEntries && (
        <div>
          <Row>
            <Col>
              <div>
                ENTRIES LIST
              </div>
            </Col>
          </Row>
        </div>
      )}
        </div>


      </section>
      <Footer logout={logout}/>
    </div>
  )
}
