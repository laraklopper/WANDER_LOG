import React, { useState } from 'react'
import '../css/componentCss/EditUserForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { provinces } from '../data/locations';
export default function EditUserForm() {
  const [emailMsg, setEmailMsg] = useState(false)
  return (
    <form id='edit-profile-form' aria-labelledby='formHeading'>
      <div id='formHeadingBlock'>
        <h3 id='formHeading'>EDIT USER</h3>
      </div>
      <div id='edit-user-input'>
        <div id='edit-profile-group1'>
            <Stack gap={3} id='edit-user-stack1'>
      <div className="p-2" id='edit-username-block'>
        <label className='edit-profile-label' htmlFor='editUsername'>USERNAME:</label>
        <div className='input-div'>
          <input
          type='text'
            className='input'
            id='editUsername'
            placeholder='USERNAME'// current user username or username if not found
            // name=''
            // value={}
            // onChange={}
          />
          <div>
            {/* Error Message */}
          </div>
        </div>
      </div>
      <div id='edit-user-fullname-block' className='p-2'>
      <label className='edit-profile-label'>FULL NAME</label>
        <div className='input-div'>
          <label htmlFor='editFirstName' className='edit-profile-label' hidden>EDIT FIRST NAME:</label>
          <input
            className='input'
            id='editFirstName'
            // placeholder=''//user first name
            // name=''
            // value={}
            // onChange={}
          />
        </div>
        <div className='input-div'>
          <label htmlFor='editLastName' className='edit-profile-label' hidden>LAST NAME:</label>
          <input
            className='input'
            id='editLastName'
            placeholder='LAST NAME'//currentUser last name
          />

        </div>
        <div>
          {/* Error */}
        </div>
      </div>
    </Stack>
    {/* STACK 2 */}
 <Stack direction="horizontal" gap={3} id='edit-user-stack2'>
 {/* EMAIL INPUT */}
      <div className="p-2" id='edit-email-block'>       
        <div className='input-div'>
        <label className='edit-profile-label' htmlFor='editUserEmail'>EMAIL</label>
          <input
            type='email'
            className='input'
            id='editUserEmail'
            // placeholder=''//current user email
            // name=''
            // value={}
            // onChange={}
            onFocus={() => setEmailMsg(true)}
            onBlur={() => setEmailMsg(false)}
            // ARIA ATTRIBUTES:
            />
        </div>
      </div>
      {/* ERROR MESSAGE */}
      <div className="p-2 ms-auto"></div>
      {emailMsg && (
        <div className="p-2">
          <p className='infoText'>WE WILL NEVER SHARE YOUR EMAIL</p>
        </div>
      )}
      
    </Stack>
    {/* STACK 3: */}
 <Stack direction="horizontal" gap={3} id='edit-user-stack3'>
 {/* PROFILE PICTURE */}
      <div className="p-2" id='edituser-profile-pic-block'>
      <label className='edit-profile-label' htmlFor='editProfilePic'>PROFILE PICTURE:</label>
        <div className='input-div'>
          <input
            className='input'
            type='url'
            id='editProfilePic'
            placeholder='PROFILE PICTURE URL'
            // name=''
            // value={}
            // onChange={}
          />
        </div>
      </div>
      <div className="p-2 ">
        <p className='infoText'>ENTER FULL URL</p>
      </div>
      {/* ERROR */}
      <div className="p-2 ms-auto">
      </div>
    </Stack>
        </div>
        {/* GROUP 2: ADDRESS */}
        <div id='edit-profile-group2'>
          <Stack gap={3} id='edit-user-stack4'>
            <div className="p-2" id='edit-address-block1'>
            {/* Address Line 1:  */}
                <div className='input-div'>
                  <label className='edit-profile-label' htmlFor='editAddressLine1'>STREET ADDRESS:</label>
                  <textarea
                  className='edit-profile-textinput'
                    rows={3}
                    placeholder='STREET ADDRESS'//Current user streetAddress/addressline 1
                    // name=''
                    // value={}
                  //  onChange={}
                  />
                </div>
                <div className='input-div'>
                  <label className='edit-profile-label visually-hidden'>ADDITIONAL ADDRESS DETAILS</label>
                  <textarea
                    rows={3}
                    className='edit-profile-textinput'
                    placeholder='ADDITIONAL ADDRESS DETAILS'//currentUser address line 2 or additional address details if none exist
                  // name=''
                  // value={}
                  // onChange={}

                  />

                </div>

            
            </div>
            <div className="p-2" id='edit-address-block2'>
              <div className='input-div'>
                <label className='edit-profile-label'>CITY/TOWN:</label>
                <input
                  className='input'
                  placeholder='CITY/TOWN'//CurrentUser City/town
                  // name=''
                  // value={}
                  // onChange={}
                />
              </div>
              <div className='input-div'>
                <label className='edit-profile-label'>PROVINCE:</label>
                <select
                className='input'
                // name=''
                // value={}
                // onChange={}
                >
                   <option value=''>SELECT</option>
                      {/* MAP ALL PROVINCES WITH THE CURRENT PROVINCE AS THE PLACEHOLDER */}
                      {provinces.map(({ code, name }) => (
                        <option key={code} value={name}>{name}</option>
                      ))}
                </select>
              </div>
            </div>
          </Stack>
        </div>
      </div>
      <div id='edit-profile-group3'>
        <Stack direction="horizontal" gap={3} id='edit-user-stack5'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        <Button type='submit' id='editUserBtn' variant='light'>EDIT USER</Button>
      </div>
      <div className="p-2" id='clearFormBlock'>
        <Button variant='danger' id='clearFormBtn' type='button'>CLEAR FORM</Button>
      </div>
    </Stack>
      </div>
    </form>
  )
}
