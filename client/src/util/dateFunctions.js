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

/* A stored date as 'YYYY-MM-DD', the format a date input reads and writes.

Used by the edit forms, where a date already on the record has to be readable by
a date input: as the min attribute on an end date that may not fall before the
start date the trip is already stored with, and as the value of an input opened
on what is currently saved.

Sliced off the ISO string rather than read from the local date parts, the
opposite of todayInputValue above. The dates the API stores were built from a
date input's own 'YYYY-MM-DD' value, so they are held at midnight UTC: taking
the UTC day back off gives the day that was chosen, while reading the local
parts of a moment two hours into a SAST day would be the roundabout way to the
same answer, and the wrong one for anywhere west of UTC.

`fallback` is what stands in for a date that is missing or unreadable, and is
undefined by default so the result can be given straight to a min attribute,
which has to be absent rather than empty when there is no date to enforce. */
export const toDateInputValue = (value, fallback = undefined) => {
    if (!value) return fallback;
    const date = new Date(value);
    if (isNaN(date.getTime())) return fallback;
    return date.toISOString().slice(0, 10);
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