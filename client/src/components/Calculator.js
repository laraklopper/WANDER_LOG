import React, { useCallback, useRef, useEffect, useState } from 'react'
import Stack from 'react-bootstrap/Stack';
import ButtonGrid from './ButtonGrid';
// IMPORT COMPONENTS FROM math.js
import {evaluate} from 'mathjs'
// IMPORT ICONS FROM LUCIDE-REACT
import { Equal } from 'lucide-react';

export default function Calculator() {
     const [input, setInput] = useState('');// State to store the mathematical expression entered by the user
    const [result, setResult] = useState('');// Stores the calculated result displayed below the calculator
    /*State to Stores accessibility messages that are announced by screen readers
    whenever a button is pressed or a calculation is completed */
    const [liveMessage, setLiveMessage] = useState('');
    const inputRef = useRef(null)

   
        //Function to handles button clicks from ButtonGrid
    const handleClick = (value, label) => {
        setInput((prev) => prev + value)// Append the selected value to the current mathematical expression
        setLiveMessage(`${label} pressed`)// Announce the pressed button for screen readers
    }
    // Function to clear expression + result and announces the action
    const handleClear = () => {
        setInput('');                           // Clear the current expression
        setResult('');                           // Clear the calculated result
        setLiveMessage('Calculator cleared');    // Announce the action for screen readers
    };
    // Function to remove the last character from the current expression
    const handleBackspace = () => {
        setInput((prev) => prev.slice(0, -1));   // Remove the final character from the input string
        setLiveMessage('Backspace pressed');     // Announce the action for screen readers
    };

       //--------CALCULATOR  LOGIC------------
    // Memoized function that evaluates the mathematical expression
     const handleEquals = useCallback(() => {
        try {
            const evalResult = evaluate(input)
            setResult(evalResult)
            setLiveMessage(`Result is ${evalResult}`);
        } catch (error) {
            setResult(Error)
            setLiveMessage('Invalid expression');
        }
    }, [input])

          // ===============================
    // EFFECT: GLOBAL KEYBOARD SUPPORT
    // ===============================
    // Allows users to type directly using the keyboard:
    // - numbers and operators → appended
    // - Enter/= → evaluate
    // - Escape/c → clear
    // - Backspace → delete last character
    useEffect(() => {
             const handleKeyDown = (event) => {
            const { key } = event;
            // Accept digits + basic operators
            if (/[0-9+\-*/.]/.test(key)) {// Numbers and operators
                handleClick(key, key);// label matches key for SR announcement
            } else if (key === 'Enter' || key === '=') {// Equals / Enter
                handleEquals();                      // compute result
            } else if (key === 'Escape' || key.toLowerCase() === 'c') {// Clear (Escape or "c")
                handleClear();// clear calculator
            } else if (key === 'Backspace') {// Backspace
                handleBackspace();// remove last character
            }
        };
        window.addEventListener('keydown', handleKeyDown);// Attach global keydown listener
        // Cleanup prevents memory leaks when component unmounts
        return () => window.removeEventListener('keydown', handleKeyDown);// Cleanup on unmount
    },[handleEquals])
    // ===============================
    // EFFECT: AUTO-FOCUS INPUT ON MOUNT
    // ===============================
    // Improves keyboard usability by placing focus in the calculator immediately
    useEffect(() => {
        // Only focus if ref exists and current input element is mounted
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [])

  return (
    <div id='general-calculator-div'>
     {/* Screen-reader live region for announcing actions (hidden visually) */}
        <div aria-live='assertive' aria-atomic='true' className='visually-hidden'>
              {liveMessage}
        </div>
<Stack gap={3} id='basic-calculator-stack'>
      <div className="p-2" id='calculator-input-block'>
        <input
            type='text'
            placeholder='0'
            id='calculatorInput'
            className='input'
            tabIndex={0}
            value={input}
            ref={inputRef}
            readOnly
        />
      </div>
       <div id='resultBlock'>
         <div
            id='result'    
            tabIndex={-1}                        // Not focusable via tab key                      
            aria-live='polite'                   // Accessibility: announce updates non-interruptively
            aria-atomic='true'                   // Announce the entire content change
        >
        {/* Result display with '=' prefix */}
            <h4 id='outputText'>
                <Equal aria-hidden='true' focusable='false'/>{result} 
            </h4>
        </div>
      </div>
    </Stack>
    <div id='buttonBlock'>
        <ButtonGrid/>
    </div>
    </div>
  )
}
