// formatCalculations.js
/* Display formatting shared by the three saved-calculation lists
(CurrencyCalculations.js, TaxCalculations.js, InterestCalculations.js).

All three list stored records, so they all have the same formatting problems to
solve: a timestamp to read, a fullName to join, a money figure to show and a
missing value to stand in for. Those answers live here rather than in each
component, so the three lists cannot start disagreeing about how a date or an
amount is written. */

// Shown in place of any detail a record does not carry
export const NOT_AVAILABLE = 'NOT AVAILABLE'

/* Format an ISO date string as e.g. 01 March 2025.

`fallback` is what stands in for a date that is missing or unreadable. The saved
calculation lists want NOT_AVAILABLE, while the user records say NOT PROVIDED,
so the wording is the caller's to choose (see userFunc.js) and the parsing
itself is written once. */
export const toLongDate = (value, fallback = NOT_AVAILABLE) => {
  if (!value) return fallback
  const date = new Date(value)
  if (isNaN(date.getTime())) return fallback
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// Format an ISO date string as e.g. 01 March 2025, 14:30
export const toLongDateTime = (value) => {
  if (!value) return NOT_AVAILABLE
  const date = new Date(value)
  if (isNaN(date.getTime())) return NOT_AVAILABLE
  return `${toLongDate(value)}, ${date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`
}

// Join the first and last name, tolerating a missing half
export const toFullName = (fullName, fallback = NOT_AVAILABLE) => {
  const name = [fullName?.firstName, fullName?.lastName].filter(Boolean).join(' ')
  return name || fallback
}

// Row striping: STYLES.md 1.5. TABLES
export const rowClass = (index) => (index % 2 === 0 ? 'evenRow' : 'oddRow')

/* Format an amount in a given currency. `currencyDisplay` is the caller's
choice because the two cases want different things: a conversion is between two
currencies and has to name which one a figure is in, while the tax and interest
calculators only ever work in rands and read better with the symbol. A record
missing its code still shows its figure rather than nothing. */
const formatMoney = (value, code, currencyDisplay) => {
  if (typeof value !== 'number' || isNaN(value)) return NOT_AVAILABLE
  if (!code) return value.toFixed(2)
  try {
    return value.toLocaleString('en-ZA', {
      style: 'currency',
      currency: code,
      currencyDisplay,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  } catch (error) {
    // An unusable currency code should not cost the user the figure itself
    return `${code} ${value.toFixed(2)}`
  }
}

/* An amount in its own currency, named by its code, e.g. ZAR 1 500,00. Used by
the conversions list, where two different currencies sit side by side and a
bare symbol would not say which is which. */
export const toMoney = (value, code) => formatMoney(value, code, 'code')

/* An amount in rands, e.g. R 1 500,00. The tax and interest calculators work
only in rands, so their lists show the symbol, matching what the calculator
forms themselves display. */
export const toRands = (value) => formatMoney(value, 'ZAR', 'symbol')

// Format a percentage held as a number, e.g. 26.5 as 26,50%
export const toPercent = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return NOT_AVAILABLE
  return `${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

/* Format a plain number, e.g. an exchange rate or a duration. Rates are quoted
to far more than 2 decimals, and rounding one to currency precision would show a
weak pair as 0,00, so the caller says how many decimals to keep. */
export const toDecimal = (value, maximumFractionDigits = 2) => {
  if (typeof value !== 'number' || isNaN(value)) return NOT_AVAILABLE
  return value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits })
}