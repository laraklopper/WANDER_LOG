import React, {useState, useCallback, useEffect, useMemo} from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Profile.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Header from '../components/Header'
import Footer from '../components/Footer'
import EditPasswordForm from '../components/EditPasswordForm';
import EditUserForm from '../components/EditUserForm';
import { errorMessage } from '../api/config';

export default function Profile({currentUser, logout, setError}) {
  const [showEditProfileForm, setShowEditProfileForm] = useState(false);
  const [showEditPswdForm, setShowEditPswdForm] = useState(false);
  // Blocks a second submit while the first request is in flight
  const [submitting, setSubmitting] = useState(false)
  /* Field keyed messages returned by the server when Mongoose validation fails,
  for example { username: 'Username is already taken' }. Passed to the form so
  each message can be shown against its own input */
  const [fieldErrors, setFieldErrors] = useState({})
  const [editUserData, setEditUserData] = useState({
    username: '',
    fullName: {
      firstName: '',
      lastName: '',
    },
    email: '',
    profilePicture: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      province: ''
    }
  })

  /* The saved account in the shape the form holds. An edit form starts from the
  current details rather than from an empty form, so the user only has to change
  the field they came to change */
  const savedUserData = useMemo(() => ({
    username: currentUser?.username || '',
    fullName: {
      firstName: currentUser?.fullName?.firstName || '',
      lastName: currentUser?.fullName?.lastName || '',
    },
    email: currentUser?.email || '',
    profilePicture: currentUser?.profilePicture || '',
    address: {
      line1: currentUser?.address?.line1 || '',
      line2: currentUser?.address?.line2 || '',
      city: currentUser?.address?.city || '',
      province: currentUser?.address?.province || '',
    }
  }), [currentUser])

  /* Refills the form whenever it is opened, and again if currentUser is
  replaced after a successful save. Keyed on the toggle as well as the account
  so that closing and reopening the panel discards any half finished edit */
  useEffect(() => {
    if (!showEditProfileForm) return;
    setEditUserData(savedUserData);
    setFieldErrors({});
  }, [showEditProfileForm, savedUserData])

  const editUser = useCallback(async () => {
    if (submitting) return;

    /* The API shapes a user with toPublicJSON, which names the key userId,
    so currentUser.id is always undefined */
    const userId = currentUser?.userId;
    const token = localStorage.getItem('token');

    // Without either of these the request can only come back as a 401 or a 404
    if (!token || !userId) {
      const message = 'Your session has expired. Please log in again to edit your profile.';
      setError?.(message);
      console.error('[ERROR: Profile.js] Edit blocked, no token or no user id');
      return;
    }

    try {
      setSubmitting(true)
      setError?.(null)
      setFieldErrors({})

      const response = await fetch(`http://localhost:3001/users/${userId}/editUser`, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editUserData.username,
          fullName: editUserData.fullName,
          email: editUserData.email,
          address: editUserData.address,
          /* Optional field. Sent as null when blank, because the schema types it
          as a String defaulting to null and '' would be stored as an empty URL */
          profilePicture: editUserData.profilePicture || null,
        }),
      })

      /* Safely parse the JSON response. Guarded because the body is empty or is
      not JSON at all on a 429 from the rate limiter, and response.json() would
      throw before the status could be reported */
      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setError?.(null)
        setFieldErrors({})
        alert('Profile updated successfully.')
        setShowEditProfileForm(false)
      } else {
        const message = errorMessage(response, data, 'Profile update failed.');
        // Present on a 400 from Mongoose validation, absent on a 409 or a 500
        if (data.errors) setFieldErrors(data.errors);
        setError?.(message);
        console.error(`[ERROR: Profile.js] Profile update failed with status ${response.status}: ${message}`);
      }
    } catch (error) {
      // Only a network level failure reaches here, a 4xx or 5xx is handled above
      setError?.('Could not reach the server. Please check your connection and try again.');
      console.error(`[ERROR: Profile.js] Profile update request failed: ${error.message}`);
    } finally {
      setSubmitting(false)
    }
  },[submitting, currentUser, editUserData, setError])
  const toggleEditProfile = useCallback(() => {
    setShowEditProfileForm(prevState => !prevState);
    setShowEditPswdForm(false); // Ensure the edit password form is hidden when toggling the profile form
  }, []);
  const toggleEditPswd = useCallback(() => {
    setShowEditPswdForm(prevState => !prevState);
    setShowEditProfileForm(false); // Ensure the edit profile form is hidden when toggling the password form
  }, []);


  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'PROFILE'}/>
      <section id='profileSection1'>
        <div id='profileSection1Content' aria-describedby='profileText'>
          <Row id='toggleEditProfileRow'>
        <Col id='toggleEditProfileCol1'/>
        <Col xs={5} id='toggleEditProfileCol'>
          <Stack gap={3} id='toggleEditProfileFormsStack'>
          {/* EDIT PROFILE FORM BUTTON */}
          <Button 
          variant="light" 
          id='editUserToggleBtn'
          onClick={toggleEditProfile}
          type="button"
          // ARIA ATTRIBUTES
          aria-expanded={showEditProfileForm}
          aria-controls="edit-profile-panal"
          aria-label={showEditProfileForm ? 'Close Edit Profile Form' : 'Edit Profile'}
          aria-describedby="edit-profile-panal"
          aria-pressed={showEditProfileForm}
          >
            {showEditProfileForm ? 'Close Form' : 'Edit Profile'}
          </Button>
      <div className="p-2"></div>
      {/* TOGGLE EDIT PASSWORD FORM BUTTON */}
      <div className="p-2">
        <Button 
          variant="light" 
          id='editPswdToggleBtn' 
          onClick={toggleEditPswd}
          type="button"
          // ARIA ATTRIBUTES
          aria-expanded={showEditPswdForm}
          aria-controls="edit-password-panal"
          aria-label={showEditPswdForm ? 'Close Edit Password Form' : 'Edit Password'}
          aria-describedby="edit-password-panal"
          aria-pressed={showEditPswdForm}
          >
          {showEditPswdForm ? 'Close Form' : 'Edit Password'}
        </Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggleEditProfileCol2'/>
      </Row>
        </div>
        {showEditProfileForm && (
          <div id='edit-profile-panal'>
            <Row id='edit-profile-row'>
              <Col id='edit-profile-col1'/>
              <Col md={10} id='edit-profile-col'>
                <EditUserForm
                  currentUser={currentUser}
                  editUser={editUser}
                  editUserData={editUserData}
                  setEditUserData={setEditUserData}
                  submitting={submitting}
                  fieldErrors={fieldErrors}
                />
              </Col>
              <Col id='edit-profile-col2'/>
            </Row>
          </div>
        )}
        {showEditPswdForm && (
          <div id='edit-password-panal'>
            <Row id='edit-password-row'>
              <Col id='edit-password-col1'/>
              <Col xs={6} id='edit-password-col'>
              <div id='edit-pswd-div'>
                <EditPasswordForm
                  currentUser={currentUser}
                  setError={setError}
                />
              </div>
              </Col>
              <Col id='edit-password-col2'/>
            </Row>
          </div>
        )}
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
