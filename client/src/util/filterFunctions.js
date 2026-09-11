// filterFunctions.js
/* The filtering behind the three filter forms (FilterTrips.js, FilterEntries.js
and FilterExpenses.js) and the three lists they sit in.

Every filter is applied here rather than by the API. The pages already load the
whole of each list in one request — GET /trip/fetchTrips, /entry/fetchEntries and
/expense/fetchExpenses each answer with everything on the account — so narrowing
one is a question about records that are already in memory. Asking the server
again would cost a round trip to arrive at the same rows, and would empty a list
the user is reading every time a select is changed.

The form and the list are a pair: the form collects the values and the list
applies them, so the shapes and the predicates live together in one file. A
filter form that added a select without a rule here, or the other way round,
would be obvious rather than silently doing nothing.

Each blank shape below is also the cleared state, so a form's CLEAR FILTERS and a
list's initial state are the same object rather than two lists of empty strings
that could drift apart. Every value is a string, because that is what a select
gives back, and '' is what the SELECT placeholder submits — meaning the filter is
not set at all. */

import { NOT_AVAILABLE } from './formatCalculations';

/* The four things a trip can be narrowed by, matching the selects FilterTrips.js
shows. purpose, status and destinationType hold the values tripSchema's enums
store, so a chosen one is compared against the trip untranslated. hasBudget is a
YES or NO against a boolean */
export const BLANK_TRIP_FILTERS = {
  purpose: '',
  status: '',
  destinationType: '',
  hasBudget: '',
};

/* An entry is narrowed by the trip it was written about, and nothing else:
that is the one select FilterEntries.js shows */
export const BLANK_ENTRY_FILTERS = {
  tripId: '',
};

/* The five things an expense can be narrowed by, matching the selects
FilterExpenses.js shows. category and paymentMethod hold the keys budgetSchema's
enums store, currency an ISO 4217 code, and isPaid a YES or NO against a boolean */
export const BLANK_EXPENSE_FILTERS = {
  tripId: '',
  currency: '',
  paymentMethod: '',
  category: '',
  isPaid: '',
};

/*=====================================
MATCHING ONE VALUE
=======================================*/
/* Whether a record satisfies one filter.

A filter that was not set matches everything, which is what makes the predicates
below read as a plain chain of ands: an unset select does not narrow the list.

Both sides are compared as strings, because a select always gives a string back
while the value on the record may not be one — an entry's tripId arrives as the
id Mongo stored, and comparing that to the select's value by identity would never
match. */
const matches = (chosen, value) =>
  !chosen || String(value ?? '') === String(chosen);

/* Whether a record satisfies a YES or NO filter.

hasBudget and isPaid are booleans on the record and are offered as YES and NO in
the form, so the chosen word is turned back into the boolean it stands for. NO
therefore matches a record that is false and one the field is missing from
entirely, which is what the lists themselves show: both read a missing flag as
NO rather than as unknown. */
const matchesFlag = (chosen, value) =>
  !chosen || (chosen === 'YES') === Boolean(value);

/*=====================================
HOW MANY ARE SET
=======================================*/
/* How many of a shape's filters are actually set. Used by the three predicates
below to answer a list that is not being narrowed at all, by the lists to decide
whether to say what is being hidden, and by the forms to decide whether there is
anything for CLEAR FILTERS to clear */
export const countFilters = (filters = {}) =>
  Object.values(filters).filter((value) => String(value ?? '').trim()).length;

/* The line a list shows above its table while it is being narrowed, so a user
looking at four rows out of thirty knows the other twenty six are hidden rather
than gone. Left to the caller to render only when a filter is set */
export const filterSummary = (shown, total) =>
  `SHOWING ${shown} OF ${total}`;

/*=====================================
THE THREE FILTERS
=======================================*/
/* The trips that satisfy every filter that was set. Returns the list untouched
when none were, rather than a copy, so a list with no filters applied is the
array the page loaded */
export const filterTrips = (trips = [], filters = BLANK_TRIP_FILTERS) => {
  if (!countFilters(filters)) return trips;

  return trips.filter((trip) => (
    matches(filters.purpose, trip?.purpose)
    && matches(filters.status, trip?.status)
    && matches(filters.destinationType, trip?.destination?.destinationType)
    /* Answered by the API off the caller's own budgets rather than read off the
    trip, so this is the same YES or NO the list's own column shows */
    && matchesFlag(filters.hasBudget, trip?.hasBudget)
  ));
}

// The entries written about the chosen trip
export const filterEntries = (entries = [], filters = BLANK_ENTRY_FILTERS) => {
  if (!countFilters(filters)) return entries;

  return entries.filter((entry) => matches(filters.tripId, entry?.tripId));
}

// The expenses that satisfy every filter that was set
export const filterExpenses = (expenses = [], filters = BLANK_EXPENSE_FILTERS) => {
  if (!countFilters(filters)) return expenses;

  return expenses.filter((expense) => (
    matches(filters.tripId, expense?.tripId)
    && matches(filters.currency, expense?.currency)
    && matches(filters.paymentMethod, expense?.paymentMethod)
    && matches(filters.category, expense?.category)
    && matchesFlag(filters.isPaid, expense?.isPaid)
  ));
}

/*=====================================
BUILDING THE SELECT OPTIONS
=======================================*/
/* The trips that appear in a list, as the { value, label } pairs a select is
built from.

Read out of the records themselves rather than off the account's trips, for two
reasons: the list is what is being narrowed, so a trip with nothing in it would
only ever filter the list down to nothing, and neither list is handed the trips
in the first place — an entry and an expense each carry the title of the trip
they belong to, which is what the rows are labelled with.

`titleKey` differs between the two because the APIs name it differently: an entry
stores the title as `trip`, while an expense is shaped with `tripTitle` by
GET /expense/fetchExpenses. Sorted by title, so the select is in a stable order
rather than in whichever order the records happened to arrive in. */
export const tripFilterOptions = (records = [], titleKey = 'trip') => {
  const trips = new Map();

  for (const record of records) {
    const value = record?.tripId ? String(record.tripId) : '';

    // Skipped when the record names no trip, and when this trip is already held
    if (!value || trips.has(value)) continue;

    trips.set(value, String(record?.[titleKey] || '').trim() || NOT_AVAILABLE);
  }

  return [...trips]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/* The distinct values a field holds across a list, as select options. Used for
the currency select, which is built from the codes the expenses were actually
paid in rather than from all 165 the converter knows: a code nothing was spent in
is an option that can only empty the list */
export const valueFilterOptions = (records = [], key) => [...new Set(
  records
    .map((record) => String(record?.[key] || '').trim().toUpperCase())
    .filter(Boolean)
)]
  .sort()
  .map((value) => ({ value, label: value }));
