// UsersList.js : only available to admin users
// IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useMemo, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/UsersList.css'
import '../css/componentCss/DetailsPanal.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
// IMPORT UTILITY FUNCTIONS
import { NOT_AVAILABLE, rowClass, toFullName, toLongDate } from '../util/formatCalculations';

export default function UsersList(
  {//PROPS PASSED FROM PARENT COMPONENT (Users.js)
    currentUser,
    users = [],
    loadingUsers = false,
    fetchUsers,
    deleteUser
  }
) {
  // ========STATE VARIABLES============
  /* Which user the details panel is showing, held as an id rather than as the
  user itself so the panel follows the list App.js owns: when a refetch drops
  the selected account the panel closes itself rather than displaying a stale
  copy of a user that is no longer stored */
  const [selectedId, setSelectedId] = useState(null)

  /* True while the DELETE is in flight. Held as an id rather than as a plain
  boolean so the button reports itself busy for the account it is actually
  removing and not for whichever one the panel has since moved to */
  const [deletingId, setDeletingId] = useState(null)
  const isDeleting = Boolean(deletingId)

  /* The users are returned by toPublicJSON, which names the id `userId` rather
  than `_id`, so that is what a row and the panel are matched on */
  const selectedUser = useMemo(
    () => users.find((user) => String(user.userId) === String(selectedId)) || null,
    [users, selectedId]
  )

  //================EVENT LISTENERS========================
  // Opens the details panel on one user
  const handleSelect = useCallback((userId) => {
    setSelectedId(userId)
  },[])

  // Closes the details panel without touching the list itself
  const handleClose = useCallback(() => {
    setSelectedId(null)
  },[])

  /* Removes the account the panel is open on.
  The API clears everything filed against a user along with it, so the counts
  the confirmation names are the records the admin is agreeing to lose - none of
  which are on this page to be seen */
  const handleDelete = useCallback(async () => {
    const userId = selectedUser?.userId;

    if (!userId) return;// Nothing on screen to delete
    if (deletingId) return;// A delete is already running

    /* Refused here as well as by the API, so the two accounts the route will
    not remove are not offered a confirmation that can only end in a 403 */
    if (selectedUser.admin) {
      console.warn('[WARN: UsersList.js] Admin accounts cannot be deleted');
      return;
    }

    if (String(currentUser?.userId) === String(userId)) {
      console.warn('[WARN: UsersList.js] An admin cannot delete their own account');
      return;
    }

    const entryCount = Array.isArray(selectedUser.entries) ? selectedUser.entries.length : 0;

    const confirmDelete = window.confirm(// Ask the admin to confirm before the account is removed
      `Delete ${selectedUser.username || 'this user'}?${
        entryCount ? ` Their ${entryCount} journal ${entryCount === 1 ? 'entry' : 'entries'} will be deleted with the account.` : ''
      } Their trips, budgets, expenses and saved calculations are removed as well. This cannot be undone.`
    )

    // Conditional rendering to check the admin confirmed the delete
    if (!confirmDelete) {
      console.log('[INFO: UsersList.js] Delete of user', userId, 'was cancelled');
      return;
    }

    setDeletingId(userId)

    try {
      const removed = await deleteUser?.(userId)

      // Conditional rendering to check the account was actually removed
      if (!removed) {
        console.warn('[WARN: UsersList.js] User', userId, 'was not deleted, the panel was left open on them');
        return;
      }

      setSelectedId(null)
      console.log('[SUCCESS: UsersList.js] Deleted user', userId);
    } finally {
      setDeletingId(null)
    }
  },[selectedUser, deletingId, deleteUser, currentUser])

  /* An account the panel will not open on: an admin, which this page does not
  display or remove, and the logged in admin's own account with it */
  const isProtected = useCallback((user) => (
    Boolean(user?.admin) || String(currentUser?.userId) === String(user?.userId)
  ),[currentUser])

  //===============JSX RENDERING==============
  return (
    <div id='usersList'>
    {/* USER LIST TABLE */}
        <div id='userListTableBlock'>
            <Stack direction="horizontal" gap={3} id='usersToolbarStack'>
              <div className="p-2"/>
              <div className="p-2 ms-auto">
                {/* Button to reload the list from the API */}
                <Button
                id='refreshUsersBtn'
                variant='light'
                type='button'
                onClick={fetchUsers}
                disabled={loadingUsers}
                // ARIA ATTRIBUTES:
                aria-label='Reload the registered users'
                aria-disabled={loadingUsers}
                >
                  {loadingUsers ? 'LOADING...' : 'REFRESH'}
                </Button>
              </div>
            </Stack>
            <table id='usersTable' aria-busy={loadingUsers}>
                <thead>
                    <tr>
                        <th  colSpan={5}>USERS</th>
                    </tr>
                    <tr id='usersHeadRow'>
                        <th scope='col'>USERNAME</th>
                        <th scope='col'>FULLNAME</th>
                        <th scope='col'>EMAIL</th>
                        <th scope='col'>IS ADMIN</th>
                        <th></th>
                    </tr>
                </thead>
                 <tbody>
                    {/* A request in flight and an empty list are reported as
                    their own single cell row, so the table never sits blank
                    without saying why */}
                    {loadingUsers && users.length === 0 ? (
                        <tr>
                            <td colSpan={5} className='users-list-loading'>
                                LOADING THE USERS...
                            </td>
                        </tr>
                    ) : users.length === 0 ? (
                        <tr>
                            <td colSpan={5} className='users-list-empty'>
                                NO USERS REGISTERED
                            </td>
                        </tr>
                    ) : (
                        users.map((user, index) => (
                            <tr
                                key={user.userId}
                                className={`${rowClass(index)}${
                                    String(user.userId) === String(selectedId) ? ' selectedRow' : ''
                                }`}
                            >
                                <td>{user.username || NOT_AVAILABLE}</td>
                                {/* fullNameString is a virtual and is carried by
                                toPublicJSON, but toFullName is used so a record
                                missing half a name still reads as the half it has */}
                                <td>{toFullName(user.fullName)}</td>
                                <td>{user.email || NOT_AVAILABLE}</td>
                                <td>{user.admin ? 'YES' : 'NO'}</td>
                                <td>
                                    <div id='viewUser-div'>
                                    {/* An admin account has no VIEW button at
                                    all rather than one that is refused: the
                                    panel is the only thing it would open, and
                                    the delete on it would answer 403 */}
                                    {isProtected(user) ? (
                                        <span className='users-list-protected'>&#8212;</span>
                                    ) : (
                                    <Button
                                        variant='light'
                                        id='viewUserBtn'
                                        type='button'
                                        onClick={() => handleSelect(user.userId)}
                                        // ARIA ATTRIBUTES:
                                        aria-label={`View the details of ${user.username || 'this user'}`}
                                        aria-pressed={String(user.userId) === String(selectedId)}
                                    >
                                        VIEW
                                    </Button>
                                    )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}

            </tbody>
            <tfoot>
                <tr>
                    <td  colSpan={5} id='tableFooterInfo'>
                    <Badge pill bg="danger" id='adminUserBg'>ADMIN USERS CANNOT BE VIEWED OR REMOVED</Badge>
                    </td>
                </tr>
            </tfoot>
            </table>


        </div>
        {/* USER PANAL : users cannot view adminUserPanal */}
        {selectedUser && (
        <div id='userPanal' aria-live='polite'>
            <div id='usersHeaderBlock'>
            <Stack direction="horizontal" gap={3} id='userHeaderStack'>
      <div className="p-2">
        <h4 id='userDetailsFullName'>{toFullName(selectedUser.fullName)}</h4>
      </div>
      <div className="p-2 ms-auto">
        <Button
            variant='danger'
            id='deleteItemBtn'
            type='button'
            onClick={handleDelete}
            disabled={isDeleting}
            // ARIA ATTRIBUTES:
            aria-label={`Delete ${selectedUser.username || 'this user'}`}
            aria-disabled={isDeleting}
            >
            {isDeleting ? 'DELETING...' : 'DELETE USER'}
        </Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button
            variant='warning'
            id='closeUserPanalBtn'
            type='button'
            onClick={handleClose}
            // ARIA ATTRIBUTES:
            aria-label='Close the user details panel'
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
        <span className='detail-span'>
            <p className='details-label'>USERNAME:</p>
            <p className='details-value'>{selectedUser.username || NOT_AVAILABLE}</p>
        </span>

      </div>
      <div className="p-2">
        {/* Email */}
            <span className='detail-span'>
                <p className='details-label'>EMAIL:</p>
                <p className='details-value'>{selectedUser.email || NOT_AVAILABLE}</p>
            </span>
      </div>
      <div className="p-2" id='userDetailsAddress'>
        {/* address */}
        <div id='userDetailsAddress1'>
            <p className='nested-details-label'>ADDRESS:</p>
        </div>
        <div id='userAddressDetails2'>
            <span className='detail-span'>
                <p className='details-label'>STREET ADDRESSS</p>
                <p className='details-value'>{selectedUser.address?.line1 || NOT_AVAILABLE}</p>
            </span>
            {/* ONLY DISPLAYED WHEN THE USER GAVE ONE: line2 is optional and the
            schema stores a blank as undefined, so the row is left off rather
            than shown with nothing against it */}
            {selectedUser.address?.line2 && (
            <span className='detail-span'>
                <p className='details-label'>OPTIONAL ADDRESS DETAILS:</p>
                <p className='details-value'>{selectedUser.address.line2}</p>
            </span>
            )}
            <span className='detail-span'>
                <p className='details-label'>CITY/TOWN:</p>
                <p className='details-value'>{selectedUser.address?.city || NOT_AVAILABLE}</p>
            </span>
            <span className='detail-span'>
                <p className='details-label'>PROVINCE:</p>
                <p className='details-value'>{selectedUser.address?.province || NOT_AVAILABLE}</p>
            </span>
            <span>
                <span className='detail-span'>
            <p className='details-label'>DATE OF BIRTH:</p>
            {/* Stored as a Date and arrives as an ISO string, so it is read
            through toLongDate rather than printed raw */}
            <p className='details-value'>{toLongDate(selectedUser.dateOfBirth)}</p>
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
                {toFullName(selectedUser.fullName)}
            </p>
        </span>
      </div>
      <div className="p-2">
        {/* Journal entries: the field holds the ids of the entries filed by
        this account, so it is counted rather than displayed. Read as a length
        rather than through || , which would report an account with none of
        them as NOT AVAILABLE */}
        <span className='detail-span'>
            <p className='details-label'>JOURNAL ENTRIES:</p>
            <p className='details-value'>
                {Array.isArray(selectedUser.entries) ? selectedUser.entries.length : 0}
            </p>
        </span>
      </div>
      <div className="p-2">
        {/* Admin: always NO here, because an admin account has no VIEW button
        to open this panel with. Shown all the same, so the panel says which
        kind of account it is displaying rather than leaving it to be assumed */}
        <span className='detail-span'>
            <p className='details-label'>IS ADMIN:</p>
            <p className='details-value'>{selectedUser.admin ? 'YES' : 'NO'}</p>
        </span>
      </div>
      <div className="p-2">
        {/* Registered: the createdAt timestamp mongoose stores on the account */}
        <span className='detail-span'>
            <p className='details-label'>REGISTERED:</p>
            <p className='details-value'>{toLongDate(selectedUser.createdAt)}</p>
        </span>
      </div>

    </Stack>
            </div>
        </div>
        )}
    </div>
  )
}
