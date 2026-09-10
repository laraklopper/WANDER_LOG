import React from 'react'
import '../css/componentCss/EditEntry.css'
import '../css/componentCss/FormSetup.css'
export default function EditEntry() {
  return (
    <form id='editEntryForm'>
        <div id='formHeadingBlock'>
        <span className='formHeadingSpan'>
            <h3 id='formHeading'>EDIT ENTRY:</h3>
            <h3 className='formItem'>ENTRY TITLE</h3>
        </span>
        </div>
        <div id='editEntryInfoBlock'>
            <p className='infoMsg'>
                <small>Only fill in what you want to change. Anything left blank stays as it is.</small>
            </p>
        </div>
    </form>
  )
}
