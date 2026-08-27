import React from 'react'
import '../css/componentCss/Header.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import { NavLink } from 'react-router-dom';

export default function MainHeader({mainHeading}) {
  return (
    <header id='main-header'>
      <Row id='header-row1'>
        <Col md={12} id='mainheader-col1'>
          <Stack direction="horizontal" gap={3}>
      <div className="p-2"></div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2">
        <nav id='navigation'>
          <ul id='mainhead-navbar'>
            <li className='link-item'>
              <NavLink to='/'>LOGIN</NavLink>
            </li>
            <li className='link-item'>
              <NavLink to='/reg'>REGISTRATION</NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </Stack>

        </Col>
      </Row>
         <Row id='header-row2'>
        <Col id='heading-col1'/>
        <Col xs={6} id='heading-col'>
          <Stack gap={3} id='heading-stack'>
            <div className="p-2" id='headerBlock1'>
              <h1 id='appHeading'>WANDER LOG</h1>
            </div>
            <div className="p-2" id='headerBlock2'>
              <h2 id='pageHeading'>{mainHeading}</h2>
            </div>
          </Stack>
        </Col>
        <Col id='heading-col2'/>
      </Row>
      <Row id='header-row3'>
        <Col md={12}/>
      </Row>
    </header>
  )
}
