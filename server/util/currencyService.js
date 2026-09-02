// currencyService.js
/* Single point of contact with Frankfurter (https://frankfurter.dev), the
exchange rate provider behind the currency converter. Frankfurter is free and
keyless, so there is no API key to configure, and the v2 API aggregates the
rates published by 84 central banks rather than the 30 ECB reference rates the
older v1 endpoints were limited to.

Two things are read from it:
  GET /v2/currencies           - every currency code the API can convert
  GET /v2/rates?base=&quotes=  - the rate for one currency pair

Unlike a fixed-base provider, /v2/rates accepts an arbitrary base, so the rate
for the requested pair comes back directly and no cross-rate maths is needed.

The currency list is cached in memory because it changes at most a handful of
times a year, while every conversion fetches its own rate so a stored rate is
never stale. If the list cannot be fetched, the static array in
dataArrays/currencies.js stands in, so the converter's dropdowns still populate
and /convert still validates its input while Frankfurter is unreachable. */

const { apiCurrencies } = require('../dataArrays/currencies');

// Root of the Frankfurter v2 API
const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v2';
/* How long a fetched currency list is trusted before it is fetched again. A day
is comfortably shorter than the rate at which currencies come and go. */
const CURRENCY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/* Give up on an upstream request rather than holding a client's request open
indefinitely when Frankfurter stops responding. */
const REQUEST_TIMEOUT_MS = 8000;

// The last successful currency list: { currencies, codes, fetchedAt }
let currencyCache = null;

/* Wraps fetch with a timeout and throws on a non-2xx response, so every caller
below can assume it is handed valid JSON. The upstream status is carried on the
error, letting a caller tell a rejected request apart from a broken provider. */
const fetchJson = async (url) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    // Conditional rendering to check the upstream API responded successfully
    if (!response.ok) {
        const error = new Error(`Frankfurter responded with status ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

/* The offline list, used only when Frankfurter has never answered. Just the
codes are known without the API, so each code stands in for its own name. */
const buildFallbackList = () => apiCurrencies.map((code) => ({ code, name: code, symbol: '' }));

/* Every currency the API can convert, as { code, name, symbol } sorted by code,
alongside a Set of the codes for validation and a `live` flag reporting whether
the list came from Frankfurter or from the offline fallback. */
const getSupportedCurrencies = async () => {
    // Conditional rendering to serve the cached list while it is still fresh
    if (currencyCache && (Date.now() - currencyCache.fetchedAt) < CURRENCY_CACHE_TTL_MS) {
        return { currencies: currencyCache.currencies, codes: currencyCache.codes, live: true };
    }

    try {
        const data = await fetchJson(`${FRANKFURTER_BASE_URL}/currencies`);

        /* /v2/currencies responds with an array of
        { iso_code, iso_numeric, name, symbol, start_date, end_date } objects. */
        const currencies = (Array.isArray(data) ? data : [])
            .filter((entry) => entry && typeof entry.iso_code === 'string')
            .map((entry) => ({
                code: entry.iso_code.toUpperCase(),
                name: entry.name || entry.iso_code.toUpperCase(),
                symbol: entry.symbol || ''
            }))
            .sort((a, b) => a.code.localeCompare(b.code));

        // Conditional rendering to reject an empty or unrecognised payload
        if (!currencies.length) {
            throw new Error('Frankfurter returned no currencies');
        }

        const codes = new Set(currencies.map((currency) => currency.code));
        currencyCache = { currencies, codes, fetchedAt: Date.now() };

        console.info('[SUCCESS: currencyService.js, getSupportedCurrencies] Loaded', currencies.length, 'currencies');
        return { currencies, codes, live: true };
    } catch (error) {
        console.error('[ERROR: currencyService.js, getSupportedCurrencies]', error.message);
        /* A stale cache is preferred over the offline list: it is real data that
        was live at some point, where the fallback is only ever a list of codes. */
        if (currencyCache) {
            return { currencies: currencyCache.currencies, codes: currencyCache.codes, live: false };
        }
        const currencies = buildFallbackList();
        return { currencies, codes: new Set(currencies.map((currency) => currency.code)), live: false };
    }
}

/* The rate for one currency pair, as target-per-base, together with the date
the rate was published. Returns null when the API reports no rate for the pair,
letting the caller answer with a 502 instead of converting on a bad number. */
const getConversionRate = async (fromCurrency, toCurrency) => {
    const url = `${FRANKFURTER_BASE_URL}/rates?base=${encodeURIComponent(fromCurrency)}&quotes=${encodeURIComponent(toCurrency)}`;

    let data;
    try {
        data = await fetchJson(url);
    } catch (error) {
        /* Frankfurter answers 422 when it will not price the pair. That is a
        statement about the currencies, not a broken provider, so it is reported
        as a missing rate rather than raised as an upstream failure. */
        if (error.status === 422) {
            console.error('[ERROR: currencyService.js, getConversionRate] Frankfurter rejected the pair', fromCurrency, toCurrency);
            return null;
        }
        throw error;
    }

    /* /v2/rates responds with an array of { date, base, quote, rate } objects,
    one per requested quote currency. */
    const match = Array.isArray(data)
        ? data.find((entry) => entry && entry.quote === toCurrency)
        : null;
    const rate = match ? parseFloat(match.rate) : NaN;

    // Conditional rendering to guard against a missing or malformed rate
    if (!rate || isNaN(rate)) {
        return null;
    }

    return { rate, date: match.date || null };
}

module.exports = { getSupportedCurrencies, getConversionRate };