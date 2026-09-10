import React from 'react'
import '../css/componentCss/DetailsPanal.css'
import '../css/componentCss/EntriesList.css'
import Stack from 'react-bootstrap/Stack';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
export default function EntriesList({currentUser, toggleEditEntry, showEditEntry}) {

    const username = currentUser?.username || '';//Current loggedin user username
  return (
    <div id='entriesList'>
        <div id='entriesTableBlock'>
            <table>
                <thead>
                    <tr>
                        <th colSpan={4}>
                            {username}: ENTRIES
                        </th>
                    </tr>
                    <tr>
                        <th>TRIP</th>
                        <th>TITLE</th>
                        <th>DATE</th>
                        <th></th>{/*VIEW PANAL BUTTON*/}
                    </tr>
                </thead>
                <tbody>

                </tbody>
            </table>
        </div>
        {/* ENTRIES DETAILS PANAL */}
        <div id='entryDetailsPanal'>
            <div id='entryHeaderBlock'>
            <Stack direction="horizontal" gap={3}>
      <div className="p-2"/>
      <div className="p-2 ms-auto"/>
      <div className="p-2">
        <p className='panalUsername'>@{username}</p>
      </div>
    </Stack>
            <Stack direction="horizontal" gap={3} id='entryHeaderStack'>
      <div className="p-2">
        <h5>ENTRY TITLE</h5>
      </div>
      <div className="p-2 ms-auto">
        <Button 
            variant='warning' 
            onClick={toggleEditEntry} 
            id='toggleEditEntryBtn' 
            aria-expanded={showEditEntry}>
            {showEditEntry ? 'Hide Form' : 'Edit Entry'}
        </Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button
            variant='warning'
            id='closePanalBtn'
            >
                CLOSE
            </Button>
      </div>
    </Stack>
            </div>
            {/* ENTRY PANAL */}
            <div id='entryPanalBody'>
            <Stack direction="horizontal" gap={3} id='entryPanalStack1'>
      <div className="p-2">
                <span className='detail-span'>
                    <p className='detail-label'>TRIP:</p>
                    <p className='detail-value'></p>
                </span>
            </div>
      <div className="p-2 ms-auto"/>
      <div className="p-2">
        <span className='detail-span'>
            <p className='details-label'>DATE:</p>
            <p className='detail-value'></p>
        </span>
      </div>
    </Stack>
      <div id='entryBodyDiv'>
       <Card id='tripEntryCard'>
      <Card.Body id='entryCardBody'>
        <Card.Title id='entryCardTitle' >
            {/* ENTRY TITLE */}
            <h5 id='entryCardTitle'>ENTRY TITLE</h5>
        </Card.Title>
        <Card.Text>
          <p id='entryBody'>
            Entry body text here
          </p>
        </Card.Text>
      </Card.Body>
  </Card>
                
            </div>
            </div>
            <div id='entryFooterBlock'>
            <Stack direction="horizontal" gap={3} id='entryFooterStack'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto"></div>
      <div className="vr" />
      <div className="p-2">
        <Button
        variant='danger'
        id='deleteItemBtn'
        // onClick={}
        type='button'
        >
            DELETE
        </Button>
      </div>
    </Stack>



            </div>
        </div>
    </div>
  )
}
