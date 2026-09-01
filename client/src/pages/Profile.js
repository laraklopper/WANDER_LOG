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

export default function Profile({currentUser, logout}) {
  const [showEditPswdForm, setShowEditPswdForm] = useState(false);

  const toggleEditPswd = useCallback(() => {
    setShowEditPswdForm(prevState => !prevState);
  }, []);
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} heading={'PROFILE'}/>
      <section id='profileSection1'>
        <div id='profileSection1Content' aria-describedby='profileText'>
          <Row id='toggleEditProfileRow'>
        <Col id='toggleEditProfileCol1'/>
        <Col xs={5} id='toggleEditProfileCol'>
          <Stack gap={3} id='toggleEditProfileStack'>
          {/* EDIT PROFILE FORM BUTTON */}
          <Button variant="light" id='editUserToggleBtn'>
            Edit Profile
          </Button>
      <div className="p-2"></div>
      {/* TOGGLE EDIT PASSWORD FORM BUTTON */}
      <div className="p-2">
        <Button variant="light" id='editPswdToggleBtn' onClick={toggleEditPswd}>
          Edit Password
        </Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggleEditProfileCol2'/>
      </Row>
        </div>
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
