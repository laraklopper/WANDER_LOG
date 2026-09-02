import React from 'react'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import { Divide, 
        Equal, 
        Minus, 
        X, 
        Plus, 
        Delete
    } from 'lucide-react';
export default function ButtonGrid() {
  return (
    <div id='btnGrid'>
        {/* ---------Screen Reader Heading----- */}
        <p className='visually-hidden' id='calculatorBtnGrid'>BUTTON GRID</p>
       
         <Stack gap={3}>
            {/* --------LINE 1------------ */}
            <div className="p-2">
                <Button variant='secondary'>7</Button>
                <Button variant='secondary'>8</Button>
                <Button variant='secondary'>9</Button>
                <Button variant='secondary'>
                    <Divide size={16} fontWeight={700} aria-hidden='true' focusable='false'/>
                </Button>
            </div>
            {/* Line 2 */}
            <div className="p-2">
                <Button variant='secondary'></Button>
                <Button variant='secondary'></Button>
                <Button variant='secondary'></Button>
                <Button variant='secondary'>
                    <X size={16} fontWeight={700} aria-hidden='true' focusable='false'/>
                </Button>
            </div>
            {/* Line 3 : 1 + 2 + 3 + Minus */}
            <div className="p-2">
                <Button variant='secondary'>1</Button>
                <Button variant='secondary'>2</Button>
                <Button variant='secondary'>3</Button>
                <Button variant='secondary'>
                    <Minus size={16} fontWeight={700} aria-hidden='true' focusable='false'/>
                </Button>
            </div>
            {/* ------LINE 4: 0 , decimal,equal, plus ------------ */}
            <div className="p-2">
                <Button variant='secondary'>0</Button>
                <Button variant='secondary'>.</Button>
                <Button variant='secondary'>
                    <Equal size={16}  fontWeight={700} aria-hidden='true' focusable='false'/>
                </Button>
                <Button variant='secondary'>
                    <Plus size={16}  fontWeight={700} aria-hidden='true' focusable='false'/>
                </Button>
            </div>
             {/* -----LINE 5: Clear Btn + BackSpace------------ */}
            <div className="p-2">
                <Button variant='secondary'></Button>
                <Button variant='secondary'></Button>
            </div>
    </Stack>
    
    </div>
  )
}
