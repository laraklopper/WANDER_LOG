// currencyCalculations.js
/*Utility(helper) functions relating to currencies and currency conversion
*/
import { currencyCountries } from '../data/financeData'
import { NOT_AVAILABLE, toDecimal } from './formatCalculations'

export const formatCurrency = (value) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(value);


//===========================================================================
// CURRENCY OPTIONS (CurrencyConverter.js, CurrencyConvertForm.js)
//===========================================================================
// The converter's inputs before the user has filled anything in, and on reset
export const EMPTY_CONVERT_FORM = {
    amount: '',
    from: '',
    to: ''
};

/* Currencies offered until GET /api/currencies answers, and kept if it never
does. The local country data covers the same codes, so an unreachable API leaves
the converter working off a curated list rather than an empty dropdown. */
export const FALLBACK_CURRENCIES = currencyCountries.map(
    ({ code, name }) => ({ code, name, symbol: '' })
);

/* Label a currency in the converter's dropdowns, e.g. 'ZAR - South African
Rand'. A code the provider reports without a name is still offered, listed by
its code alone. */
export const currencyOptionLabel = (code, name) => (name ? `${code} - ${name}` : code)

/* Country lookup by currency code, built once from the static data rather than
searched through for every row. */
const COUNTRIES_BY_CODE = currencyCountries.reduce((lookup, { code, countries }) => {
    lookup[code] = countries;
    return lookup;
}, {});

/* The countries a currency is used in, as one string. This is not something the
currencies API reports, so it is looked up in the local currencyCountries data
and left as a dash for any code that data does not cover. */
export const countriesForCode = (code) =>
    COUNTRIES_BY_CODE[code] ? COUNTRIES_BY_CODE[code].join(', ') : '—'

/* Name lookup by currency code, built once from the static data, and the
fallback for a code the provider list does not carry a name for. */
const NAMES_BY_CODE = currencyCountries.reduce((lookup, { code, name }) => {
    lookup[code] = name;
    return lookup;
}, {});

//===========================================================================
// CONVERSION RESULT (CurrencyConvertForm.js)
//===========================================================================
/* A converted amount, to currency precision. The figure comes back from the API
as a number, so it is fixed to 2 decimals the way money is written. */
export const toConvertedAmount = (value) => Number(value).toFixed(2)

/* An exchange rate as quoted. Rates are quoted to far more than 2 decimals, and
rounding one to currency precision would show a weak pair as 0.00, so 4 are
kept. */
export const toQuotedRate = (value) => Number(value).toFixed(4)

//===========================================================================
// SAVED CONVERSIONS (CurrencyCalculations.js)
//===========================================================================
/* Format an exchange rate with the pair it prices. Rates are quoted to far more
than 2 decimals, so a rate is shown to 6 rather than being rounded to currency
precision, which would show a weak pair as 0,00. */
export const toRate = (rate, baseCurrency, targetCurrency) => {
    const formatted = toDecimal(rate, 6)
    if (formatted === NOT_AVAILABLE || !baseCurrency || !targetCurrency) return formatted
    return `${formatted} ${targetCurrency} PER 1 ${baseCurrency}`
}

/* A currency's full name, e.g. 'ZAR' gives 'South African Rand'. A saved
conversion stores only the two codes, so the name is looked for in the currency
list the converter loaded from the provider, and in the local country data for
any code that list reports without a name. */
export const currencyNameOf = (code, currencies = []) => {
    if (!code) return '';
    const match = currencies.find((currency) => currency.code === code);
    return match?.name || NAMES_BY_CODE[code] || '';
}

/* A saved conversion's currency written out in full, e.g. 'ZAR - South African
Rand'. Falls back to the code alone for a currency nothing has a name for, and
to a dash for a record missing the code itself. */
export const currencyLabelOf = (code, currencies) =>
    code ? currencyOptionLabel(code, currencyNameOf(code, currencies)) : NOT_AVAILABLE

/* The converted amount as stored. The schema exposes it as a virtual, so it
arrives on the record; it is recomputed from amount * rate only as a fallback. */
export const convertedAmountOf = (conversion) => {
    if (typeof conversion?.convertedAmount === 'number') return conversion.convertedAmount
    if (typeof conversion?.amount === 'number' && typeof conversion?.rate === 'number') {
        return conversion.amount * conversion.rate
    }
    return null
}