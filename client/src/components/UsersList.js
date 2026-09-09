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
                    <tr colSpan={5}>
                        <th>USERS</th>
                    </tr>
                    <tr>
                        <th>USERNAME</th>
                        <th>FULLNAME</th>
                        <th>EMAIL</th>
                        <th>IS ADMIN</th>
                        <th></th>
                    </tr>
                </thead>
            </table>
            <tbody>

            </tbody>
            <tfoot>
                <tr colSpan={5}>
                    <td>
                    <Badge pill bg="danger">ADMIN USERS CANNOT BE VIEWED OR REMOVED</Badge>
                    </td>
                </tr>
            </tfoot>

        </div>
        {/* USER PANAL : users cannot view adminUserPanal */}
        <div id='userPanal'>
            <div id='usersHeaderBlock'>
            <Stack direction="horizontal" gap={3} id='userHeaderStack'>
      <div className="p-2">First item</div>
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
            <div>
                
            </div>
        </div>
    </div>
  )
}
