//ExportForm.js
/*Display a component used for all export functions/requests
/exports/trips
/exports/entries
/exports/expenses
/exports/budgets

toggle form display under the lists where the data can be
exported (trips, entries, expenses, budget)

One form serves all four, because every export asks the same single question —
CSV or Excel — and differs only in which endpoint answers it. The list that
renders the form says which, through the `resource` prop, and everything else on
screen is named from that: the form's own title, the button's label, and the
messages both come from one entry in EXPORT_RESOURCES below.

The file is fetched rather than linked to. An <a href> or a window.open cannot
carry the Authorization header the export routes are behind, so the response is
read as a blob and saved through an object URL, which also means a refusal comes
back as JSON this form can report instead of as a downloaded error page.
*/

import React, { useCallback, useMemo, useState } from 'react'
import '../css/componentCss/ExportForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button'
import { Bug, Download } from 'lucide-react';

/* The four things that can be exported, keyed by the resource the list passes
in. The key is also the path segment on the API and the middle of the filename,
so a list only ever names its resource once.

`title` is what the form calls itself, for the heading a screen reader reads on
arriving at it. `noun` is the same thing in a sentence, for the messages. */
const EXPORT_RESOURCES = {
  trips: { title: 'EXPORT TRIPS', noun: 'trips' },
  entries: { title: 'EXPORT JOURNAL ENTRIES', noun: 'journal entries' },
  expenses: { title: 'EXPORT EXPENSES', noun: 'expenses' },
  budgets: { title: 'EXPORT TRIP BUDGETS', noun: 'trip budgets' },
};

// The two formats the API builds, and the extension each file is saved with
const EXPORT_FORMATS = ['csv', 'xlsx'];

/* Used to name the download when the response's own name cannot be read. The
server names every export, but Content-Disposition is only readable across
origins because app.js exposes it, so a name is worked out here as well rather
than leaving the browser to save the file as 'download' with no extension */
const fallbackFilename = (resource, format) => {
  const today = new Date().toISOString().slice(0, 10);// The date as 2025-03-01
  return `wanderlog-${resource}-${today}.${format}`;
}

/* The filename the server chose, read off the response. Both the plain and the
encoded form of the header are matched, so a name is still found if the header is
ever written the other way. Returns null when there is nothing usable in it, and
the caller falls back to the name above */
const filenameFromResponse = (response, resource, format) => {
  const header = response.headers.get('Content-Disposition');

  if (!header) return fallbackFilename(resource, format);

  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);

  if (!match) return fallbackFilename(resource, format);

  try {
    return decodeURIComponent(match[1]).trim() || fallbackFilename(resource, format);
  } catch (error) {
    /* A name that is not valid percent encoding is used as it stands rather
    than costing the user the download */
    return match[1].trim() || fallbackFilename(resource, format);
  }
}

/* Saves a blob to disk under a given name. The link is built, clicked and
removed rather than rendered, because there is nothing for the user to press: the
download is the answer to the EXPORT button they already pressed.

The object URL is released on the next tick rather than immediately after the
click. Revoking it in the same turn leaves some browsers cancelling the download
they were still starting. */
const saveBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export default function ExportForm({
  /* Which of the four lists this form sits under. Also the path segment on the
  API, so a list names what it exports once and nothing here has to translate it */
  resource = 'trips',
  /* How many records the list is currently showing, when the page knows. Used
  only to keep the button from asking for an export of an empty account, which
  the API would answer with a 404 anyway. Left null by a list that does not pass
  it, and the guard is then skipped */
  count = null
}) {
  // ========STATE VARIABLES============
  const [format, setFormat] = useState('')// The selected export format, '' while the select is on its placeholder
  const [exporting, setExporting] = useState(false)// True while the export request is in flight
  const [formError, setFormError] = useState(null)// Shown when the export could not be produced
  const [confirmation, setConfirmation] = useState(null)// Shown once a file has been handed to the browser

  /* What this form is exporting. An unrecognised resource falls back to trips
  rather than rendering a form with no name, which is also what the default prop
  above gives a list that renders the form without saying */
  const { title, noun } = useMemo(
    () => EXPORT_RESOURCES[resource] || EXPORT_RESOURCES.trips,
    [resource]
  );

  // Nothing on the account to export, so far as the list that rendered this knows
  const nothingToExport = typeof count === 'number' && count === 0;

  // ========= IDs USED BY aria-describedby =========
  /* Suffixed with the resource, because the travel log renders this form twice —
  once under the trips list and once under the entries list — and two blocks
  sharing an id would leave a select described by the other form's error */
  const formatSelectId = `exportFormat-${resource}`;// ID used for the format select
  const formTitleId = `exportFormTitle-${resource}`;// ID used for the form's own title
  const formErrorId = `exportFormError-${resource}`;// ID used for the error message
  const confirmationId = `exportConfirmation-${resource}`;// ID used for the confirmation message

  // Joins the IDs that are currently rendered into a single aria-describedby value
  const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

  //================EVENT LISTENERS========================
  /* Choosing a format clears both messages: the error was about the submission
  that has just been changed, and the confirmation was about a file that has
  already been saved */
  const handleFormatChange = useCallback((event) => {
    setFormat(event.target.value)
    setFormError(null)
    setConfirmation(null)
  },[])

  /* Requests the file and hands it to the browser.

  The whole response is read before anything is saved, so a refusal is reported
  in the form rather than downloaded as a file holding an error message. */
  const handleExport = useCallback(async (event) => {
    event.preventDefault()

    // Ignored while a request is already running, so the form cannot double post
    if (exporting) return;

    setConfirmation(null)

    /* The select opens on its SELECT placeholder, so an empty value means no
    format was chosen. Checked here as well as by the API, which refuses a
    request with no format rather than defaulting it */
    if (!EXPORT_FORMATS.includes(format)) {
      setFormError('Please choose an export format.')
      console.warn('[WARN: ExportForm.js] Export submitted with no format chosen');
      document.getElementById(formatSelectId)?.focus()
      return;
    }

    // Conditional rendering to check there is something on the account to export
    if (nothingToExport) {
      setFormError(`There are no ${noun} to export yet.`)
      console.warn('[WARN: ExportForm.js] Export of', resource, 'requested with nothing in the list');
      return;
    }

    const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage

    // Conditional rendering to check the session is still carrying a token
    if (!token) {
      setFormError('Your session has ended, please log in again to export.')
      console.error('[ERROR: ExportForm.js] No token in localStorage');
      return;
    }

    setExporting(true)
    setFormError(null)

    try {
      const response = await fetch(
        `http://localhost:3001/exports/${resource}?format=${format}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      /* A refusal answers with JSON rather than with a file, so the reason is
      read out of it and reported in the form. A body that cannot be read as
      JSON leaves the status to speak for itself instead of failing twice */
      if (!response.ok) {
        let message = `The export failed (${response.status}).`;

        try {
          const failure = await response.json();
          if (failure?.message) message = failure.message;
        } catch (error) {
          console.warn('[WARN: ExportForm.js] Export failed with a response that was not JSON');
        }

        setFormError(message)
        console.error(`[ERROR: ExportForm.js] Export of ${resource} failed with status ${response.status}: ${message}`);
        return;
      }

      const file = await response.blob();

      // Conditional rendering to check a file actually came back
      if (!file || file.size === 0) {
        setFormError('The export came back empty, please try again.')
        console.error('[ERROR: ExportForm.js] Export of', resource, 'returned an empty file');
        return;
      }

      const filename = filenameFromResponse(response, resource, format);

      saveBlob(file, filename)

      setConfirmation(`Your ${noun} were exported as ${filename}.`)
      console.log('[SUCCESS: ExportForm.js] Exported', resource, 'as', filename);
    } catch (error) {
      /* Only a request that never completed reaches here — the API being down,
      or the connection dropping. A refusal is handled above */
      setFormError('The export could not be reached, please check your connection and try again.')
      console.error('[ERROR: ExportForm.js] Export request failed:', error.message);
    } finally {
      setExporting(false)
    }
  },[exporting, format, formatSelectId, nothingToExport, noun, resource])

  // Returns the form to the state it opened in, messages included
  const handleClear = useCallback(() => {
    setFormat('')
    setFormError(null)
    setConfirmation(null)
  },[])

  //===============JSX RENDERING==============
  return (
    <form id='exportForm' onSubmit={handleExport} aria-labelledby={formTitleId}>
    <p className='visually-hidden' id={formTitleId}>
            {/* EXPORT TITLE: e.g Export Trips */}
            {title}
        </p>
       <Stack direction="horizontal" gap={3}>
      <div className="p-2" id='exportFormSelectBlock'>
        <label className='exportLabel' htmlFor={formatSelectId}>CHOOSE EXPORT FORM</label>
        <select
        className='input'
        id={formatSelectId}
        name='format'
        value={format}
        onChange={handleFormatChange}
        disabled={exporting}
        // ARIA ATTRIBUTES:
        aria-required='true'
        aria-invalid={Boolean(formError)}
        aria-describedby={describedBy(
          formError && formErrorId,
          confirmation && confirmationId
        )}
        >
            {/* SET SELECT AS PLACEHOLDER */}
            <option value=''>SELECT</option>
            <option value='csv'>CSV (.csv)</option>
            <option value='xlsx'>EXCEL (.xlsx)</option>
        </select>
      </div>
      <div className="p-2 ms-auto"></div>
       {/* ==========ERROR/CONFIRMATION MESSAGE================
      A failure is an assertive alert, because the user pressed a button and
      needs to know it did not work assertive status; a successful
      completed download is a polite status. */}
      <div className="p-2">
      {formError && (
        <div id={formErrorId} className='formErrorBlock' role='alert' aria-live='assertive'>
          <p className='formErrorMessage'>
            <Bug aria-hidden='true' focusable='false'/>
            {formError}
          </p>
        </div>
      )}
      {!formError && confirmation && (
        <div id={confirmationId} className='exportConfirmationBlock' role='status' aria-live='polite'>
          <p className='exportConfirmationMessage'>
            <Download aria-hidden='true' focusable='false'/>
            {confirmation}
          </p>
        </div>
      )}
      </div>
    </Stack>
    <Stack direction="horizontal" gap={3}>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        <Button
        variant='light'
        id='exportDataBtn'
        type='submit'
        /* Blocked while a request is running, so a second press cannot start an
        export that races the first, and on an empty list, which the API would
        answer with a 404 */
        disabled={exporting || nothingToExport}
        // ARIA ATTRIBUTES:
        aria-label={`Export your ${noun}`}
        aria-disabled={exporting || nothingToExport}
        >
            {exporting ? 'EXPORTING...' : 'EXPORT'}
        </Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        <Button
        variant='danger'
        id='clearFormBtn'
        type='button'
        onClick={handleClear}
        disabled={exporting}
        // ARIA ATTRIBUTES:
        aria-label='Clear the export form'
        aria-disabled={exporting}
        >
            CLEAR FORM
        </Button>
      </div>
    </Stack>

    </form>
  )
}
