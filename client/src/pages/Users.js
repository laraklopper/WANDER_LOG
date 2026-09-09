// Users.js Route: '/users'; Admin Only Page
//IMPORT REQUIRED MODULES AND PACKAGES
import React from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Users.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'
import UsersList from '../components/UsersList';

//=======MAIN USERS FUNCTION COMPONENT=========
export default function Users(///Export default Users.js component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser,
    users,
    loadingUsers,
    fetchUsers,
    deleteUser,
    logout
}
) {
  //============JSX RENDERING=============
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'USERS'}/>
      {/* ===========
      SECTION 1:
      ============ */}
      <section id='usersSection1'>
        <div id='users-Section1Content'>
          <Row id='usersListRow'>
           <Col id='usersListCol'>
            {/* Passed straight through from App.js, which owns the list: the
            page is the layout the table and its details panel sit in and does
            not hold any user state of its own */}
            <UsersList
              currentUser={currentUser}
              users={users}
              loadingUsers={loadingUsers}
              fetchUsers={fetchUsers}
              deleteUser={deleteUser}
            />
           </Col>
         </Row>

        </div>
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
