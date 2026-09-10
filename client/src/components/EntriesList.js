import React from 'react'
import '../css/componentCss/DetailsPanal.css'
import '../css/componentCss/EntriesList.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
export default function EntriesList({currentUser}) {

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
                        <th></th>{/*VIEW PANAL BLOCK*/}
                    </tr>
                </thead>
            </table>
        </div>
        {/* ENTRIES DETAILS PANAL */}
        <div id='entryDetailsPanal'>
            <div id='entryHeaderBlock'>
            <Stack direction="horizontal" gap={3}>
      <div className="p-2">
        <h5>ENTRY TITLE</h5>
      </div>
      <div className="p-2 ms-auto">
        <Button>
            EDIT ENTRY
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
            <div id='entryPanalBody'>
            <Stack gap={3}>
            <div className="p-2">
                <span className='detail-span'>
                    <p className='detail-label'>TRIP:</p>
                    <p className='detail-value'></p>

                </span>
            </div>
            <div className="p-2">Second item</div>
            <div className="p-2">Third item</div>
            </Stack>
            <Stack gap={3}>
            <div className="p-2">
                
            </div>
            <div className="p-2">Second item</div>
            <div className="p-2">Third item</div>
            </Stack>

            </div>
            <div id='entryFooterBlock'>
            <Stack direction="horizontal" gap={3} id='entryFooterStack'>
      <div className="p-2">First item</div>
      <div className="p-2 ms-auto">Second item</div>
      <div className="vr" />
      <div className="p-2">Third item</div>
    </Stack>



            </div>

        </div>
    </div>
  )
}
