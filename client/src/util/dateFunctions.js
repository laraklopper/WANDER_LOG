// utilFunctions/dateFunction.js
//-----------DATE FUNCTIONS-----------
// Function to specify the date format
export const dateDisplay = (dateString) => {
    const options = {
        day: '2-digit',// Display day as two digit
        month: '2-digit',// Display month as two digits
        year: 'numeric',// Display year as four digits
        timeZone: 'Africa/Johannesburg'// Set the timezone
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-GB', options);
}

// Function to get the current date in 'DD/MM/YYYY' format
export const currentDate = () => {
    const options = {
        day: '2-digit', // Display day as two digit
        month: '2-digit',  // Display month as two digits
        year: 'numeric',// Display year as four digits
        timeZone: 'Africa/Johannesburg'// Set the timezone
    };
    return new Intl.DateTimeFormat('en-GB', options).format(new Date());// Format the current date
};

/* Today as 'YYYY-MM-DD', the format a date input reads and writes. Used for the
max attribute on an input that may not take a future date, and to compare a
chosen date against today, which sorts correctly as a string in this format.
Built from the local date parts rather than from toISOString(), which converts to
UTC first and so reports yesterday for the early hours of a day in SAST. */
export const todayInputValue = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
};

//-----------TIME FUNCTIONS-----------
// Format time as hh:mm:ss
export const timeDisplay = (dateObj) => {
    return dateObj.toLocaleTimeString('en-GB', {
        hour: '2-digit',// Display hour as two digits
        minute: '2-digit',// Display minute as two digits
        second: '2-digit',// Display second as two digits
        hour12: false,// Use 24-hour format
        timeZone: 'Africa/Johannesburg'// Set the timezone
    });
};