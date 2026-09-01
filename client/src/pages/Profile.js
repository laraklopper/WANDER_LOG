import React, {useState, useCallback} from 'react'
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

export default function Profile({currentUser, logout}) {
  const [showEditProfileForm, setShowEditProfileForm] = useState(false);
  const [showEditPswdForm, setShowEditPswdForm] = useState(false);

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
            {showEditProfileForm ? 'Close Edit Profile Form' : 'Edit Profile'}
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
          {showEditPswdForm ? 'Close Edit Password Form' : 'Edit Password'}
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
                <EditUserForm/>
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
                <EditPasswordForm/>
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
