// exportFile.js
/* File building for the export endpoints (routes/exportRoutes.js).

All four exports answer the same two questions — which columns, and which of the
two formats — so the building of the file itself is written once here and each
route only says what its rows are.

A row is a plain object of native values: a Date stays a Date, an amount stays a
Number, a yes or no stays a Boolean. Neither builder is handed text that has
already been formatted, because the two formats want different things out of the
same value. A CSV holds nothing but text, while a spreadsheet should receive a
real date and a real number so that a column can be sorted, filtered and totalled
in Excel rather than read as a string. Each column therefore declares its type
and each builder reads the value its own way. */
const ExcelJS = require('exceljs');

/* The two formats the export form offers. A request naming anything else is
refused rather than guessed at, so a file is never returned under a name whose
extension does not match what is inside it */
const EXPORT_FORMATS = ['csv', 'xlsx'];

// The media type each format is served as, so the browser saves it as that type
const CONTENT_TYPES = {
    csv: 'text/csv; charset=utf-8',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/* Excel's own display formats, applied per column by buildXlsx below. The value
in the cell is the date or the number itself either way — these only say how it
is written on screen, so the underlying figure is still sortable and addable */
const NUMBER_FORMATS = {
    date: 'yyyy-mm-dd',
    datetime: 'yyyy-mm-dd hh:mm',
    money: '#,##0.00',
    decimal: '0.00',
    number: '0',
};

/* A leading character Excel and Sheets read as the start of a formula rather
than as text. A title or a note is whatever the user typed, so one beginning
this way is written as text rather than handed to the spreadsheet as something
to evaluate. Only applied to text columns: a negative amount legitimately starts
with a minus and belongs in the file as a number */
const FORMULA_START = /^[=+\-@\t\r]/;

// A cell that has to be quoted, because it holds a delimiter or a line break
const CSV_NEEDS_QUOTES = /[",\r\n]/;

/*=====================================
FORMAT
=======================================*/
/* Matches a requested format against one of the two above without caring about
the casing it arrived in, so 'CSV' and 'csv' are read the same way. Returns the
matched format, or undefined when the value is not one that is offered */
const matchFormat = (value) =>
    EXPORT_FORMATS.find(
        (format) => format === String(value ?? '').trim().toLowerCase()
    );

/*=====================================
VALUE READING
=======================================*/
const pad = (value) => String(value).padStart(2, '0');

/* Read as a Date rather than trusted as one: a value read off a document is a
Date, but the same field on a lean object or a nested subdocument can arrive as
an ISO string. Returns null for anything that cannot be read as a date, so a
missing or broken one leaves the cell empty instead of writing 'Invalid Date' */
const readDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

/* Read as a number for the same reason. Returns null for anything that is not a
usable figure, so a missing amount leaves the cell empty rather than writing NaN
into a column that is going to be totalled */
const readNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
};

// A date as 2025-03-01, the form a spreadsheet reads back as a date in any locale
const isoDate = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// A date and time as 2025-03-01 14:30
const isoDateTime = (date) =>
    `${isoDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

/*=====================================
TEXT TIDYING
=======================================*/
/* A journal entry's body is stored as the rich text HTML the editor produced, so
exporting it raw would put markup in the cell instead of what was written. The
tags are dropped and the ones that separate blocks are turned back into line
breaks first, so a two paragraph entry still reads as two paragraphs.

The five named entities an editor writes are decoded as well, with &amp; left
until last so an escaped entity such as &amp;lt; is not decoded twice. */
const plainText = (value) => String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/* An enum value written the way the lists show it: the schemas store 'credit_card'
and 'accommodation', and the pages display 'CREDIT CARD' and 'ACCOMMODATION', so
the file matches what the user was looking at when they pressed EXPORT */
const enumLabel = (value) =>
    String(value ?? '').replace(/_/g, ' ').trim().toUpperCase();

/* Reduces a value to the characters that are safe in a filename and in the
header that carries it. Used for the username, which the account owner chose and
which could otherwise hold a quote or a line break — either of which would break
the Content-Disposition header rather than merely look odd in a file manager */
const slug = (value, fallback) =>
    String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40)
    || fallback;

/*=====================================
FILE NAMING
=======================================*/
/* What the browser saves the download as, for example
lara-trips-2025-03-01.xlsx. The account and the date it was taken are both in the
name, because an export is a snapshot: two taken a month apart do not overwrite
each other in the downloads folder, and one found later still says whose data it
holds and when it was true */
const exportFilename = (resource, username, format) =>
    `${slug(username, 'wanderlog')}-${resource}-${isoDate(new Date())}.${format}`;

/* The header that makes the response a download rather than something the
browser tries to display. The filename has already been through slug above, so
there is nothing left in it that could close the quoted string early */
const contentDisposition = (filename) => `attachment; filename="${filename}"`;

/*=====================================
CSV
=======================================*/
/* One value written as CSV text. The type decides how it is read, so a date
column is not at the mercy of whatever toString would have produced and a
boolean is written as the YES or NO the lists show rather than as 'true' */
const csvText = (value, type) => {
    switch (type) {
        case 'date': {
            const date = readDate(value);
            return date ? isoDate(date) : '';
        }
        case 'datetime': {
            const date = readDate(value);
            return date ? isoDateTime(date) : '';
        }
        case 'money': {
            const amount = readNumber(value);
            // Written to the two decimals money is written in, unrounded figures included
            return amount === null ? '' : amount.toFixed(2);
        }
        case 'decimal': {
            const amount = readNumber(value);
            return amount === null ? '' : amount.toFixed(2);
        }
        case 'number': {
            const amount = readNumber(value);
            return amount === null ? '' : String(amount);
        }
        case 'boolean':
            return value ? 'YES' : 'NO';
        default:
            return value === null || value === undefined ? '' : String(value);
    }
};

// One value escaped into a CSV cell
const csvCell = (value, type) => {
    const text = csvText(value, type);

    /* Only a text cell can hold something a spreadsheet would read as a formula.
    The others are written by csvText from a number, a date or a boolean, so
    there is nothing in them to guard against */
    const guarded = type === 'text' && FORMULA_START.test(text) ? `'${text}` : text;

    /* A quote inside a quoted cell is escaped by doubling it, which is what RFC
    4180 specifies and what every spreadsheet reads back */
    return CSV_NEEDS_QUOTES.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
};

/* The whole file as a Buffer, headers first.

Rows are separated by CRLF, the line ending RFC 4180 gives for CSV, and the file
opens with a byte order mark: without it Excel on Windows reads a UTF-8 file as
the system codepage, which turns every accented place name in a trip list into
mojibake. */
const buildCsv = (columns, rows) => {
    const header = columns.map((column) => csvCell(column.header, 'text')).join(',');
    const body = rows.map(
        (row) => columns.map((column) => csvCell(row[column.key], column.type)).join(',')
    );

    return Buffer.from(`\uFEFF${[header, ...body].join('\r\n')}\r\n`, 'utf8');
};

/*=====================================
EXCEL
=======================================*/
/* A date shifted onto the UTC clock, keeping the day and time it reads as
locally.

exceljs writes a JS Date to a cell as the UTC instant behind it, and Excel then
displays that instant with no timezone of its own. csvText above writes the same
value in local time, so without this the two formats would disagree about a
record stored near midnight: an expense logged at one in the morning in South
Africa is stored as the previous day at 23:00 UTC, which the CSV would date
correctly and the spreadsheet would date a day early.

The local date and time are therefore what is written to the sheet, so both
formats say the same thing and both say what the page showed. */
const sheetDate = (date, withTime) => new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    withTime ? date.getHours() : 0,
    withTime ? date.getMinutes() : 0
));

/* One value as the workbook should hold it. A date and a number are written as
themselves rather than as text, so the column can be sorted by date and totalled
in the spreadsheet; how each is displayed is the column's numFmt, set below.

null is used for anything missing, which exceljs writes as a genuinely empty
cell — an empty string would leave a cell that looks blank but still counts as
filled when the sheet is sorted or a range is measured. */
const xlsxValue = (value, type) => {
    switch (type) {
        case 'date': {
            const date = readDate(value);
            return date ? sheetDate(date, false) : null;
        }
        case 'datetime': {
            const date = readDate(value);
            return date ? sheetDate(date, true) : null;
        }
        case 'money':
        case 'decimal':
        case 'number':
            return readNumber(value);
        case 'boolean':
            return value ? 'YES' : 'NO';
        default:
            return value === null || value === undefined || value === '' ? null : String(value);
    }
};

/* Excel refuses a sheet name holding any of these, and truncates one past 31
characters, so the name is reduced to something it will accept rather than left
to fail when the workbook is written */
const sheetTitle = (name) =>
    String(name ?? '').replace(/[\\/*?:[\]]/g, ' ').trim().slice(0, 31) || 'Export';

/* The whole workbook as a Buffer, one sheet holding the rows.

The header row is frozen and filtered, because an export of a full account runs
to hundreds of rows and the point of choosing Excel over CSV is to be able to
work through them. */
const buildXlsx = async (columns, rows, sheetName) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Wander Log';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetTitle(sheetName), {
        // Keeps the headers on screen while the rows are scrolled
        views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = columns.map((column) => ({
        header: column.header,
        key: column.key,
        width: column.width || 20,
        style: NUMBER_FORMATS[column.type] ? { numFmt: NUMBER_FORMATS[column.type] } : {},
    }));

    // The header row, which sheet.columns above has already filled with the labels
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle' };
    headerRow.commit();

    for (const row of rows) {
        sheet.addRow(
            Object.fromEntries(
                columns.map((column) => [column.key, xlsxValue(row[column.key], column.type)])
            )
        );
    }

    /* Only set once there are rows to filter: an autoFilter over the header
    alone leaves Excel reporting the sheet as damaged when it is opened */
    if (rows.length) {
        sheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: columns.length },
        };
    }

    const buffer = await workbook.xlsx.writeBuffer();

    /* writeBuffer answers with a Buffer under Node, but an ArrayBuffer in other
    environments, and the route reads a byte length off what it is given */
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
};

//=============EXPORTS==================
module.exports = {
    EXPORT_FORMATS,
    CONTENT_TYPES,
    matchFormat,
    exportFilename,
    contentDisposition,
    plainText,
    enumLabel,
    buildCsv,
    buildXlsx,
};
