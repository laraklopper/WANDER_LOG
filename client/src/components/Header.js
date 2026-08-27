import React from 'react'
import '../css/componentCss/Header.css'
import '../css/componentCss/Navbar.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import { NavLink } from 'react-router-dom';

export default function Header({heading, currentUser}) {
  return (
    <header id='page-header'>
        <Row id='header-row1'>
        <Col md={12}/>
      </Row>
         <Row id='header-row2'>
        <Col/>
        <Col xs={6}>
        <Stack gap={3} id='heading-stack'>
            <div className="p-2">
              <h1 id='appHeading'>WANDER LOG</h1>
            </div>
            <div className="p-2">
              <h2 id='pageHeading'>{heading}</h2>
            </div>
          </Stack>
        </Col>
        <Col/>
      </Row>
      <Row id='header-row3'>
      <Col/>
        <Col xs={12} md={8}>
          <nav id='navigation'>
            <ul id='navbar'>
               <Stack gap={3} id='header-nav-stack'>
      <div className="p-2">
        {currentUser && (
          <li>
            <NavLink to='/'>DASHBOARD</NavLink>
          </li>
        )}
        {currentUser && (
          <li>
            <NavLink to='/travelLog'>TRAVEL LOG</NavLink>
          </li>
        )}
        {currentUser && (
          <li>
            <NavLink to='/journal'>JOURNAL</NavLink>
          </li>
        )}
      </div>
      <div className="p-2">
        {currentUser && (
          <li>
            <NavLink to='/budget'>BUDGET</NavLink>
          </li>
        )}
        {currentUser && (
          <li>
            <NavLink to='/profile'>PROFILE</NavLink>
          </li>
        )}
        {currentUser.admin && (
          <li>
            <NavLink to='/users'>USERS</NavLink>
          </li>
        )}
      </div>
    </Stack>
            </ul>
          </nav>
        </Col>
        <Col/>
      </Row>
    </header>
  )
}
