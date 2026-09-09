// UsersList.js : only available to admin users
// IMPORT REQUIRED MODULES AND PACKAGES
import React from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/UsersList.css'
import '../css/componentCss/DetailsPanal.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';

export default function UsersList() {
  return (
    <div id='usersList'>
    {/* USER LIST TABLE */}
        <div id='userListTableBlock'>
            <table id='usersTable'>
                <thead>
                    <tr>
                        <th  colSpan={5}>USERS</th>
                    </tr>
                    <tr>
                        <th>USERNAME</th>
                        <th>FULLNAME</th>
                        <th>EMAIL</th>
                        <th>IS ADMIN</th>
                        <th></th>
                    </tr>
                </thead>
                 <tbody>
                    <tr>
                        <td></td>
                    </tr>

            </tbody>
            <tfoot>
                <tr>
                    <td  colSpan={5} id='tableFooterInfo'>
                    <Badge pill bg="danger">ADMIN USERS CANNOT BE VIEWED OR REMOVED</Badge>
                    </td>
                </tr>
            </tfoot>
            </table>
           

        </div>
        {/* USER PANAL : users cannot view adminUserPanal */}
        <div id='userPanal'>
            <div id='usersHeaderBlock'>
            <Stack direction="horizontal" gap={3} id='userHeaderStack'>
      <div className="p-2">
        <h4>FULL NAME</h4>
      </div>
      <div className="p-2 ms-auto">
        <Button variant='danger' id='deleteItemBtn'>DELETE USER</Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button
            variant='warning' 
            id='closeUserPanalBtn'
            type='button'
            // onClick={}
            >
            CLOSE
        </Button>
      </div>
    </Stack>

            </div>
            <div id='userPanalBody'>
                <Stack gap={3} id='userDetailsStack1'>
      <div className="p-2">
        {/* Username */}
        <span className='details-span'>
            <p className='details-label'>USERNAME:</p>
            <p className='details-value'></p>
        </span>
        
      </div>
      <div className="p-2">
        {/* Email */}
            <span>
                <p className='details-label'>EMAIL</p>
                <p className='details-value'></p>
            </span>
      </div>
      <div className="p-2" id='userDetailsAddress'>
        {/* address */}
        <div>
            <p className='nested-details-label'>ADDRESS:</p>
        </div>
        <div>
            <span>
                <p className='details-label'>STREET ADDRESSS</p>
                <p className='details-value'></p>
            </span>
            <span>
                <p className='details-label'>OPTIONAL ADDRESS DETAILS:</p>
            </span>
            <span>
                <p className='details-label'>CITY/TOWN:</p>
                <p className='details-value'></p>
            </span>
            <span>
                <span className='details-span'>
            <p className='details-label'>DATE OF BIRTH:</p>
            <p className='details-value'></p>
        </span>
            </span>
        </div>

      </div>
    </Stack>
    <Stack gap={3} id='userDetailsStack2'>
      <div className="p-2">
        {/* Full name */}
        <span className='detail-span'>
            <p className='details-label'>NAME:
            </p>
            <p className='details-value'>
                {/* user.fullName.firstName user.fullName.lastName */}
            </p>
        </span>
      </div>
      <div className="p-2">
        {/* Date of birth */}
      </div>

    </Stack>
            </div>
        </div>
    </div>
  )
}
