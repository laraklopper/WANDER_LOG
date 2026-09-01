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
        <Col id='heading-col1'/>
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
        {currentUser.admin && (
          <li className="link-item">
            <NavLink to='/users' className="refLink">
              USERS
            </NavLink>
          </li>
        )}
      </div>
    </Stack>
            </ul>
          </nav>
        </Col>        
      </Row>
    </header>
  )
}
