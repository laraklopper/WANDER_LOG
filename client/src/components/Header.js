import React, { useEffect, useState } from 'react'
import '../css/componentCss/Header.css'
import '../css/componentCss/Navbar.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import ListGroup from 'react-bootstrap/ListGroup';
import { NavLink } from 'react-router-dom';
// IMPORT ICONS FROM LUCIDE-REACT
import { Calendar, Clock8 } from 'lucide-react';
import { dateDisplay, timeDisplay } from '../util/dateFunctions';

export default function Header({heading, currentUser}) {
  const [date, setDate] = useState(false)

  useEffect(() => {
    // Create an interval that updates the time every second
    const timer = setInterval(() => {
      setDate(new Date())
    }, 1000);
    // Cleanup function:
    // Clears interval when component unmounts
    // Prevents memory leaks and duplicate timers
    return () => clearInterval(timer)
  },[])
  return (
    <header id='page-header'>
        <Row id='header-row1'>
        <Col md={12}/>
      </Row>
         <Row id='header-row2'>
        <Col id='heading-col1'>
            <div id='clockBlock'>
         <ListGroup id='headerClock'>
      <ListGroup.Item id='headDateItem'>
        <h5 className='headerClockText'>
          <Calendar className='headerClockItem' aria-hidden='true' focusable='false'/>
          {dateDisplay(date)}
        </h5>
      </ListGroup.Item>
      <ListGroup.Item id='headTimeItem'>
        <h5  className='headerClockText'>
          <Clock8 className='headerClockItem' aria-hidden='true' focusable='false'/>
          {timeDisplay(date)}
        </h5>
      </ListGroup.Item>
    </ListGroup>
      </div>
        </Col>
        <Col xs={6} id='heading-col'>
        <Stack gap={3} id='heading-stack'>
            <div className="p-2" id='appHeadingBlock'>
              <h1 id='appHeading'>WANDER LOG</h1>
            </div>
            <div className="p-2" id='pageHeadingBlock'>
              <h2 id='pageHeading'>{heading}</h2>
            </div>
          </Stack>
        </Col>
        <Col id='heading-col2'/>
      </Row>
      <Row id='header-row3'>
      
        <Col id='header-nav-col'>
          <nav id='navigation'>
            <ul id='navbar'>
               <Stack gap={3} id='header-nav-stack'>
      <div className="p-2" id='header-nav-block1'>
        {currentUser && (
          <li className="link-item">
            <NavLink to='/' className="refLink">
              DASHBOARD
            </NavLink>
          </li>
        )}
        {currentUser && (
          <li className="link-item">
            <NavLink to='/travelLog' className="refLink">
              TRAVEL LOG
            </NavLink>
          </li>
        )}
        {currentUser && (
          <li className="link-item">
            <NavLink to='/journal' className="refLink">
              JOURNAL
            </NavLink>
          </li>
        )}
      </div>
      <div className="p-2" id='header-nav-block2'>
      {currentUser && (
        <li className='link-item'>
          <NavLink to='/exp' className='refLink'>
            EXPENSES
          </NavLink>
        </li>
      )}
        {currentUser && (
          <li className="link-item">
            <NavLink to='/budget' className="refLink">
              BUDGET
            </NavLink>
          </li>
        )}
        {currentUser && (
          <li className="link-item">
            <NavLink to='/profile' className="refLink">
              PROFILE
            </NavLink>
          </li>
        )}
      </div>
        {currentUser.admin && (
          <div className='p-2' id='admin-nav-block'>
            <li className="link-item">
              <NavLink to='/users' className="refLink">
                USERS
              </NavLink>
            </li>
          </div>
        )}
    </Stack>
            </ul>
          </nav>
        </Col>        
      </Row>
    </header>
  )
}
