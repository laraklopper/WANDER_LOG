// tripData.js
/* The option values the API accepts, spelled the way tripSchema's enums store
them. The labels are shown in upper case to match the rest of the form, while
the value that is submitted stays in the schema's own casing. The same three
lists AddTripForm.js offers, since an edit may set a trip to anything a new one
could have been created as */
export const PURPOSES = [
  { value: 'Holiday', label: 'HOLIDAY' },
  { value: 'Business', label: 'BUSINESS' },
];
export const DESTINATION_TYPES = [
  { value: 'Domestic', label: 'DOMESTIC' },
  { value: 'International', label: 'INTERNATIONAL' },
];
export const STATUSES = [
  { value: 'upcoming', label: 'UPCOMING' },
  { value: 'ongoing', label: 'ONGOING' },
  { value: 'completed', label: 'COMPLETED' },
];
