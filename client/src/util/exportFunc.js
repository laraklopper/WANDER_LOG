// exportFunc.js
/* The four things that can be exported, keyed by the resource the list passes
in. The key is also the path segment on the API and the middle of the filename,
so a list only ever names its resource once.

`title` is what the form calls itself, for the heading a screen reader reads on
arriving at it. `noun` is the same thing in a sentence, for the messages. */
export const EXPORT_RESOURCES = {
  trips: { title: 'EXPORT TRIPS', noun: 'trips' },
  entries: { title: 'EXPORT JOURNAL ENTRIES', noun: 'journal entries' },
  expenses: { title: 'EXPORT EXPENSES', noun: 'expenses' },
  budgets: { title: 'EXPORT TRIP BUDGETS', noun: 'trip budgets' },
};

// The two formats the API builds, and the extension each file is saved with
export const EXPORT_FORMATS = ['csv', 'xlsx'];

/* Used to name the download when the response's own name cannot be read. The
server names every export, but Content-Disposition is only readable across
origins because app.js exposes it, so a name is worked out here as well rather
than leaving the browser to save the file as 'download' with no extension */
export const fallbackFilename = (resource, format) => {
  const today = new Date().toISOString().slice(0, 10);// The date as 2025-03-01
  return `wanderlog-${resource}-${today}.${format}`;
}