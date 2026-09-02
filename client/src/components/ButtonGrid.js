import React from 'react'
import '../css/componentCss/Buttons.css'
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
export default function ButtonGrid({
    handleClear,
    handleClick,
    handleEquals, 
    handleBackspace
}) {
  return (
    <div id='btnGrid'>
        {/* ---------Screen Reader Heading----- */}
        <p className='visually-hidden' id='calculatorBtnGrid'>BUTTON GRID</p>
       
         <Stack gap={3} id='buttonGridStack'>
            {/* --------LINE 1------------ */}
            <div className="p-2" id='line1'>
                <Button 
                    variant='secondary' 
                    id='Btn7'
                    className='numButton'
                    size='sm'
                    onClick={() => handleClick('7', 'seven')}
                    aria-label='Seven'
                    >7</Button>
                <Button 
                variant='secondary' 
                id='Btn8' 
                size='sm'
                className='numButton' // Shared styling class
                onClick={() => handleClick('8', 'Eight')}
                    // ARIA ATTRIBUTES:
                        aria-label='eight'>
                8</Button>
                {/* Button 9 */}
                    <Button
                        variant='secondary'
                        type='button'
                        size='sm'
                        id='Btn9'
                        className='numButton' // Shared styling class
                        onClick={() => handleClick('9', 'nine')}
                        // ARIA ATTRIBUTES:
                        role='button'
                        aria-label='Nine'
                    >
                        9
                    </Button>
               {/* Button: Divide */}
                    <Button
                        variant='secondary'
                        type='button'             // Declares it as a Clicakble button (prevents form submission)
                        className='operationBtn'
                        id='divideBtn'
                        size='sm'
                        onClick={() => handleClick('/', 'Divide')} // Appends '/' operator with a live message
                        // ARIA ATTRIBUTES:
                        role='button'
                        aria-label='Divide'               // Accessibility label for screen reader
                    >
                        <Divide size={20} fontWeight={700} aria-hidden='true' focusable='false'/>
                    </Button>
            </div>
            {/* -----------LINE 2: 4, 5, 6, Multiply ---------------- */}
                <div id='line2' aria-label='Second row of calculator buttons'>
                    {/* Button 4 */}
                    <Button
                        variant='secondary'
                        type='button'
                        size='sm'
                        id='Btn4'
                        className='numButton' // Shared styling class
                        onClick={() => handleClick('4', 'Four')}
                        // ARIA ATTRIBUTES:
                        aria-label='Four'
                    >
                        4
                    </Button>
                    {/* Button 5 */}
                    <Button
                        variant='secondary'
                        type='button'
                        size='sm'
                        id='Btn5'
                        className='numButton' // Shared styling class
                        onClick={() => handleClick('5', 'Five')}
                        // ARIA ATTRIBUTES:
                        aria-label='Five'
                    >
                        5
                    </Button>
                    {/* Button: 6 */}
                    <Button
                        variant='secondary'
                        type='button'
                        id='Btn6'
                        size='sm'
                        className='numButton' // Shared styling class
                        onClick={() => handleClick('6', 'Six')}// Appends '6' to the input expression with live message
                        // ARIA ATTRIBUTES:
                        aria-label='Six'  // Screen reader will announce "Six"
                    >
                        6
                    </Button>
                    {/* Button: Multiply */}
                    <Button
                        variant='secondary'
                        type='button'
                        id='multiplyBtn'
                        size='sm'
                        onClick={() => handleClick('*', 'Multiply')} // Appends multiplication operator to input with a live message
                        // ARIA ATTRIBUTES:
                        aria-label='Multiply'
                    >
                        <X size={20} fontWeight={700} aria-hidden='true' focusable='false'/>
                    </Button>
                </div>
          
            {/* Line 3 : 1 + 2 + 3 + Minus */}
            {/* ------LINE 3 : 1, 2, 3, Minus------------ */}
                <div className="p-2" id='line3' aria-label='Third row of calculator buttons'>
                    {/* Button: 1 */}
                    <Button
                        variant='secondary'
                        type='button'
                        size='sm'
                        id='Btn1'
                        onClick={() => handleClick('1', 'One')} // Appends '1' to the input expression with live message
                        // ARIA ATTRIBUTES:
                        aria-label='One'
                    >
                        1
                    </Button>
                    {/* Button: 2 */}
                    <Button
                        variant='secondary'
                        type='button'
                        size='sm'
                        id='Btn2'
                        className='numButton' // Shared styling class
                        onClick={() => handleClick('2', 'Two')}// Appends '2' to the input expression with live message
                        // ARIA ATTRIBUTES:
                        aria-label='Two'
                    >
                        2
                    </Button>
                    {/* Button 3 */}
                    <Button
                        variant='secondary'
                        type='button' // Declares it as a Clicakble button (prevents form submission)
                        size='sm'
                        id='Btn3'
                        className='numButton' // Shared styling class
                        onClick={() => handleClick('3', 'Three')}
                        // ARIA ATTRIBUTES:
                        aria-label='Three' // Screen reader will announce "Three"
                    >
                        3
                    </Button>
                    {/* Button: Minus */}
                    <Button
                        type='button' // Declares it as a Clicakble button (prevents form submission)
                        className='operationBtn' // Shared styling class
                        id='minusBtn'
                        onClick={() => handleClick('-', 'Minus')}// Appends minus operator to input with a live message
                        variant='secondary'
                        size='sm'
                        // ARIA ATTRIBUTES:
                        aria-label='Minus' // Announced as "Minus" for accessibility
                    >
                        <Minus size={20} fontWeight={700} aria-hidden='true' focusable='false'/>
                    </Button>
                </div>
            <div className="p-2" id='line3'>
                <Button variant='secondary'>1</Button>
                <Button variant='secondary'>2</Button>
                <Button variant='secondary'>3</Button>
                <Button variant='secondary'>
                    <Minus size={16} fontWeight={700} aria-hidden='true' focusable='false'/>
                </Button>
            </div>
            {/* ------LINE 4: 0 , decimal,equal, plus ------------ */}
            <div className="p-2" id='line4'>
                 <Button
                        variant='secondary'
                        type='button'                          // Declares it as a Clicakble button (prevents form submission)
                        className='numButton'                     // Shared styling class
                        onClick={() => handleClick('0', 'Zero')} // Appends '0' to the input expression
                        id='Btn0'
                        size='sm'
                        // ARIA ATTRIBUTES:
                        role='button'
                        aria-label='Zero'                      // Accessibility label for screen readers
                    >
                        0
                    </Button>
                    {/* Button: Decimal Point */}
                    <Button variant='secondary'
                        type='button'    // Declares it as a Clicakble button (prevents form submission)
                        aria-label='Decimal Point'             // Helps users with screen readers understand it's a decimal
                        className='operationBtn'                   // Shared styling class
                        onClick={() => handleClick('.', 'Decimal Point')} // Adds a decimal point to the input
                        id='divideBtn'
                        role='button'
                    >
                        .
                    </Button>
                    {/* Button: Equals */}
                    <Button variant='secondary'
                        type='button'              // Declares it as a Clicakble button (prevents form submission)
                        className='operationBtn'                  // Shared styling class
                        onClick={handleEquals}                 // Triggers the calculation logic
                        id='equalsBtn'
                        size='sm'
                        //ARIA ATTRIBUTES:
                        role='button'
                        aria-label='Equals'                    // Accessibility label: announces "Equals"
                    >
                        <Equal size={16}  fontWeight={700} aria-hidden='true' focusable='false'/>
                    </Button>
                    {/* Button: Plus */}
                    <Button
                        variant='secondary'
                        type='button'             // Declares it as a Clicakble button (prevents form submission)
                        className='operationBtn'                 // Shared styling class
                        onClick={() => handleClick('+', 'Plus')} // Appends '+' to the expression
                        id='plusBtn'
                        //ARIA ATTRIBUTES:
                        aria-label='Plus'                      // Accessibility label: announces "Plus"
                    >
                        <Plus size={16}  fontWeight={700} aria-hidden='true' focusable='false'/>
                    </Button>
            </div>
             {/* -----LINE 5: Clear Btn + BackSpace------------ */}
            <div className="p-2" id='line5'>
                 {/* Button: Clear (C) */}
                    <Button
                        variant='secondary'
                        type='button'
                        className='clearBtn'
                        onClick={handleClear}
                        id='clearBtn'
                        size='sm'
                        // ARIA ATTRIBUTES:
                        aria-label='Clear Input and Output'
                    >
                        C
                    </Button>
                    {/* Button: Backspace */}
                    <Button
                        variant='secondary'
                        type='button'
                        size='sm'
                        className='operationBtn'
                        onClick={handleBackspace}
                        id='backspaceBtn'
                        // ARIA ATTRIBUTES:
                        aria-label='Backspace'
                    >
                        <Delete size={20} fontWeight={700} aria-hidden='true' focusable='false' />
                    </Button>
            </div>
    </Stack>
    
    </div>
  )
}
