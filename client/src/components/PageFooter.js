import React, { useEffect, useState } from 'react'
import '../css/componentCss/Footer.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import ListGroup from 'react-bootstrap/ListGroup';
import {Calendar, Clock8, Copyright } from 'lucide-react';
import { dateDisplay, timeDisplay } from '../util/dateFunctions';

export default function PageFooter() {
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
      return () => clearInterval(timer)
    }, 1000);
    return () => clearInterval(timer)
  },[])
  return (
    <footer id='footer'>
     <Row id='footer-row1'>
        <Col md={12} id='footer-col1'>
          <div className='footerPlaceHolder'></div>
        </Col>
    </Row>
    <Row id='footer-row2'>
        <Col id='footerTimeCol'>
          <Stack direction="horizontal" gap={3} id='footerTimeStack'>
            <div className="p-2"/>
            <div className="p-2 ms-auto"/>
            <div className="p-2">
              <ListGroup id='footerDateList'>
      <ListGroup.Item id='dateItem' aria-labelledby='dateLabel'>
      {/* ----------Screen Reader Text------*/}
       <p id='dateLabel' className='visually-hidden'>Current Date:</p>
     
       {/* DATE: dateDisplay  -> formats Date into readable date string */}
        
        <h5 className='timeStamp'><Calendar size={20} aria-hidden='true' focusable='false'/>{dateDisplay(date)}</h5>
    
      </ListGroup.Item>
      <ListGroup.Item id='timeItem' aria-labelledby='timeLabel'>
      {/* ----------Screen Reader Text------*/}
          <p id='timeLabel' className='visually-hidden'>Current Time:</p>
            <Clock8 size={20} aria-hidden='true' focusable='false'/>
            {/* TIME: timeDisplay  -> formats Date into readable time string */}
            <h5 className='timeStamp'>{timeDisplay(date)}</h5>
      </ListGroup.Item>
    </ListGroup>

            </div>
    </Stack>

        </Col>
      </Row>
     <Row id='footer-row3'>
        <Col/>
        <Col xs={6} id='copyRightDetailsCol' aria-live='polite'>
          {/* COPYRIGHT INFO */}
                <div aria-labelledby='footerTextTitle' id='copyRightBlock'>
                    <p id='footerTextTitle' className='visually-hidden'>Copyright</p>
                    <span>
                    <Copyright size={16} aria-hidden='true'/><h6 id='footerText'> 2026 Travel App. All rights reserved.</h6>

                    </span>
                    
                </div>   
        </Col>
        <Col/>
      </Row>



    </footer>
  )
}
