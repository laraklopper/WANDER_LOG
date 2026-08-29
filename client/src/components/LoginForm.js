import React, { useState } from 'react'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
export default function LoginForm() {
    const [showPswdMsg, setShowPswdMsg] = useState(false)

  return (
    <form>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>SIGN IN</h3>
        </div>
        <div >
           <Stack gap={3}>
      <div className="p-2">
        <label className='login-label'>USERNAME</label>
        <input
            className='input'
            placeholder='USERNAME'
            required
            autoComplete='username'
            // name=''
            // value={}
            // ARIA ATTRIBUTES:

        />
      </div>
      {/* Error Message */}
      {/* <div className="p-2">Second item</div> */}
      {/* <div className="p-2">Third item</div> */}
    </Stack>
     <Stack gap={3}>
      <div className="p-2">
        <label>PASSWORD:</label>
        <input
            className='input'
            
        />
      </div>
      <div className="p-2">Second item</div>
      <div className="p-2">Third item</div>
    </Stack>  
        </div>

    </form>
  )
}
