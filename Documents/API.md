# APPLICATION PROGRAMMING INTERFACE `(API)`

An `API` call is a request by a software application to access data or any other service from another application or any other server.

HTTP defines a set of request methods to indicate the purpose of the request and what is expected if the request is successful

| **HTTP Verb** | **CRUD Operation** | **Description** |
|--------|-------|------|
| POST | CREATE | Used to submit data about a specific entity to the server |
| GET | READ | Used to fetch information from the database |
| PUT | UPDATE | Full replacement update of a resource on the database |
| PATCH | UPDATE | Partial update of a resource on the database |
| DELETE | DELETE | Deletes a specific resource |

## TABLE OF CONTENTS

1. [APPLICATION LEVEL REQUESTS (REST API'S)](#1-application-level-requests-rest-apis)
   - [1.1. ROUTERS AND BASE PATHS](#11-routers-and-base-paths)
   - [1.2. CONVENTIONS](#12-conventions)
   - [1.3. AUTH](#13-auth)
   - [1.4. USERS](#14-users)
   - [1.5. TRIPS](#15-trips)
   - [1.6. ENTRIES](#16-entries)
   - [1.7. EXPENSES](#17-expenses)
   - [1.8. BUDGET](#18-budget)
   - [1.9. VAT](#19-vat)
   - [1.10. CURRENCY CONVERTER](#110-currency-converter)
   - [1.11. EXPORT](#111-export)
   - [1.12. SYSTEM](#112-system)
2. [THIRD PARTY APIS](#2-third-party-apis)
   - [2.1. FRANKFURTER](#21-frankfurter)
3. [STATUS CODES USED](#3-status-codes-used)
4. [KNOWN GAPS](#4-known-gaps)
5. [REFERENCES](#5-references)

- *View [GLOSSARY.md](../GLOSSARY.md) for terminology.*
- *View [SCHEMAS.md](SCHEMAS.md) for the shape of the documents these routes read and write.*
---

## 1. APPLICATION LEVEL REQUESTS (REST API'S)

`REST  APIs` use `JSON` (most common), `XML`, `HTML`, or plain text format. `REST APIs` are the most common APIs used across the web today. `HTTP` is an application-layer protocol for fetching resources such as `HTML` .

| **HTTP Verb** | **CRUD Operation** | **Description** |
|--------|-------|------|
| POST | CREATE | Used to submit data about a specific entity to the server |
| GET | READ | Used to fetch information from the database |
| PUT | UPDATE | Full replacement update of a resource on the database |
| PATCH | UPDATE | Partial update of a resource on the database |
| DELETE | DELETE | Deletes a specific resource |

All routes that require authentication expect a `Bearer <token>` value in the `Authorization` header except the `/auth` login and registration routes.

### 1.1. ROUTERS AND BASE PATHS

Every router is mounted on a base path in [app.js](../server/app.js#L64-L69). The endpoints in the tables below are written in full, base path included.

| Base path | Router | Mounted | Purpose |
|---|---|---|---|
| `/auth` | [authRoutes.js](../server/routes/authRoutes.js) | Yes | Login and registration |
| `/users` | [userRoutes.js](../server/routes/userRoutes.js) | Yes | The current user, user lookups and profile edits |
| `/trip` | [tripRoutes.js](../server/routes/tripRoutes.js) | Yes | The logged in user's trips |
| `/entry` | [entryRoutes.js](../server/routes/entryRoutes.js) | Yes | Journal entries written against a trip |
| `/expense` | [expenseRoutes.js](../server/routes/expenseRoutes.js) | Yes | Expenses, embedded in the budget of their trip |
| `/vat` | [vatRoutes.js](../server/routes/vatRoutes.js) | Yes | The VAT calculator and the user's saved calculations |
| `/api` | [apiRoutes.js](../server/routes/apiRoutes.js) | **No** | Currency list, conversion and saved conversions — see [4. KNOWN GAPS](#4-known-gaps) |
| `/export` | [exportRoutes.js](../server/routes/exportRoutes.js) | **No** | Data export to `.csv` / `.xlsx` — a stub, no handlers written |
| — | — | — | No budget router exists; see [1.8. BUDGET](#18-budget) |

### 1.2. CONVENTIONS

These apply to every table below, so they are not repeated in each one.

- **Auth** is `JWT` where [checkJwtToken](../server/routes/middleware.js#L13) runs before the handler, and `None` where the route is public. The token is signed with `HS256` and expires after **12 hours**.
- **The owner is always taken from the token**, never from the request body or a query param, so a request can only ever read or write the caller's own records.
- **Status** records whether the handler is written. `Implemented` is live; `Planned` is documented in the route file's header comment but has no handler yet, so it falls through to the 404 handler in [app.js](../server/app.js#L77).
- **Response shape** is not uniform across the routers. `/auth` and `/users` return the payload or `{ message }` at the top level; `/trip`, `/entry`, `/expense`, `/vat` and `/api` wrap every response in `{ success: boolean, ... }`.
- **Ownership checks are folded into the query** on the routes that read one record by id, so another account's record is *not found* rather than *found and refused*, and an id cannot be guessed at to discover whether it exists elsewhere.
- **Rate limited** routes return `429` once the quota is used up. Only three routes carry a limiter — see the notes in [1.3](#13-auth) and [1.4](#14-users).

### 1.3. AUTH

**Base path:** `/auth` — *No JWT required*. Defined in [authRoutes.js](../server/routes/authRoutes.js).

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `POST` | [`/auth/login`](../server/routes/authRoutes.js#L60) | None | Implemented | Validates credentials; returns `{ token, user }` |
| `POST` | [`/auth/register`](../server/routes/authRoutes.js#L92) | None | Implemented | Creates a new account; returns `{ token, user }` and logs the user straight in |

**Notes**

| Endpoint | Body | Rate limit | Other |
|---|---|---|---|
| `POST /auth/login` | `username`, `password` | 10 attempts / 15 min / IP | An unknown username and a wrong password both return the same `401`, so the endpoint cannot be used to test which usernames exist |
| `POST /auth/register` | `username`, `fullName`, `email`, `dateOfBirth`, `address`, `password`, `confirmPassword`, `profilePicture` (optional), `admin` (default `false`) | 20 registrations / hour / IP | [checkPassword](../server/routes/middleware.js#L74) enforces 8+ characters with one special character. A taken username or email returns `409` naming the field |

### 1.4. USERS

**Base path:** `/users`. Defined in [userRoutes.js](../server/routes/userRoutes.js).

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/users/me`](../server/routes/userRoutes.js#L28) | JWT | Implemented | Returns the currently authenticated user's public profile |
| `GET` | [`/users/findUsers`](../server/routes/userRoutes.js#L38) | JWT | Implemented | Returns all users, or one filtered by the `?username=` query param |
| `PATCH` | [`/users/:id/editUser`](../server/routes/userRoutes.js#L147) | JWT | Implemented | Updates `username`, `fullName`, `email`, `address` and `profilePicture` |
| `PATCH` | [`/users/:id/editPassword`](../server/routes/userRoutes.js#L63) | JWT | Implemented | Updates the account password |
| `DELETE` | `/users/:id` | JWT | **Not written** | No delete handler exists on this router |

**Notes**

| Endpoint | Body | Rate limit | Other |
|---|---|---|---|
| `PATCH /users/:id/editUser` | Any of `username`, `fullName`, `email`, `address`, `profilePicture` | — | Only those five fields are read, so `admin`, `password` or `entries` in the body cannot escalate the account. `403` when `:id` is not the caller's own id; `409` on a taken username or email; `400` when nothing changed |
| `PATCH /users/:id/editPassword` | `currentPassword`, `newPassword` | 10 attempts / 15 min / IP | The current password is confirmed even though the token is valid, so a token taken from a shared machine is not enough to lock the owner out. `403` when `:id` is not the caller's own id — admins are not exempt |

### 1.5. TRIPS

**Base path:** `/trip`. Defined in [tripRoutes.js](../server/routes/tripRoutes.js). All routes require JWT.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/trip/fetchTrips`](../server/routes/tripRoutes.js#L145) | JWT | Implemented | Lists every trip belonging to the logged in user, newest start date first, each with a resolved `hasBudget` |
| `GET` | `/trip/fetchTrip/:id` | JWT | Planned | Get one trip (optionally with its entries) |
| `POST` | [`/trip/addTrip`](../server/routes/tripRoutes.js#L180) | JWT | Implemented | Creates one trip for the logged in user |
| `PATCH` | `/trip/editTrip/:id` | JWT | Planned | Update a trip |
| `DELETE` | `/trip/deleteTrip/:id` | JWT | Planned | Delete a single trip by id |

**Notes**

| Endpoint | Body / params | Other |
|---|---|---|
| `GET /trip/fetchTrips` | — | Returns `{ success, count, trips }`, each trip whole. Fills the journal's add-entry trip select and the travel log's trip list. `hasBudget` is answered off the caller's budgets rather than read from the flag stored on the trip, which no route writes to |
| `POST /trip/addTrip` | `title`, `purpose`, `destination.destinationType`, `destination.tripLocation`, `destination.country`, `date.startDate`, `date.endDate`, `status` | `userId` and `username` come from the token and the database, never the body. `purpose` is `Holiday` \| `Business`, `destinationType` is `Domestic` \| `International`, `status` is `upcoming` \| `ongoing` \| `completed` (default `upcoming`) — all matched case-insensitively. `country` is required for an international trip and dropped from a domestic one. `entryCount` is maintained by the hooks on `entrySchema` |

### 1.6. ENTRIES

**Base path:** `/entry`. Defined in [entryRoutes.js](../server/routes/entryRoutes.js). All routes require JWT.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | `/entry/fetchEntries` | JWT | Planned | Fetch all entries for the logged in user |
| `GET` | `/entry/fetchEntry/:id` | JWT | Planned | Fetch one entry |
| `POST` | [`/entry/addEntry`](../server/routes/entryRoutes.js#L119) | JWT | Implemented | Creates one journal entry against one of the user's trips |
| `PATCH` | `/entry/editEntry/:id` | JWT | Planned | Edit / update an entry |
| `DELETE` | `/entry/delete/:id` | JWT | Planned | Delete an entry |

**Notes**

| Endpoint | Body | Other |
|---|---|---|
| `POST /entry/addEntry` | `tripId`, `title` (≤150), `body` (≤2000), `date` | The trip is matched on its id **and** the owner together, so an entry cannot be filed against another account's trip — a mismatch returns `404`. The stored trip title is read off the trip document rather than trusted from the body |

### 1.7. EXPENSES

**Base path:** `/expense`. Defined in [expenseRoutes.js](../server/routes/expenseRoutes.js). All routes require JWT.

An expense is **not a model of its own**: it is embedded in the budget of the trip it belongs to, one budget per trip (see [SCHEMAS.md §6.1](SCHEMAS.md#expense)). So an expense is always written through its parent budget, and a trip with no budget has nowhere to put one.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/expense/fetchBudgets`](../server/routes/expenseRoutes.js#L272) | JWT | Implemented | Lists the user's budgets with their trip title and base currency, for the form's trip select |
| `GET` | [`/expense/fetchExpenses`](../server/routes/expenseRoutes.js#L323) | JWT | Implemented | Lists every expense across all of the user's trips, newest spend first |
| `GET` | [`/expense/fetchExpense/:id`](../server/routes/expenseRoutes.js#L368) | JWT | Implemented | Fetches one expense by its own subdocument id |
| `POST` | [`/expense/addExpense`](../server/routes/expenseRoutes.js#L445) | JWT | Implemented | Adds one expense to the budget of the selected trip |
| `PATCH` | `/expense/updateExpense/:id` | JWT | Planned | Edit an expense |
| `DELETE` | `/expense/delete/:id` | JWT | Planned | Delete / remove an expense |

**Notes**

| Endpoint | Body / params | Other |
|---|---|---|
| `GET /expense/fetchBudgets` | — | A budget whose trip has since been deleted is left out: there is no trip left to file an expense against |
| `GET /expense/fetchExpenses` | — | Each expense is flattened and carries `budgetId`, `baseCurrency`, `tripId` and `tripTitle`. An expense whose trip is gone is still listed, labelled `Trip no longer available` |
| `GET /expense/fetchExpense/:id` | `:id` is the embedded subdocument's `_id` | The parent budget is found by the expense it holds, matched on the owner at the same time. `400` on a malformed id, `404` when it is not on the caller's account |
| `POST /expense/addExpense` | `tripId`, `title` (≤100), `amount` (>0), `currency`, `category`, `date`, `notes` (≤300), `paymentMethod` (default `cash`), `isPaid` (default `true`) | The trip must already have a budget — `404` if not, rather than silently creating one. `convertedAmount` is worked out from a **live** Frankfurter rate rather than read from the body, and stored as `null` when the expense is already in the base currency or no rate could be read. `date` cannot be in the future. Returns the new expense plus the budget's recomputed `totalSpent`, `remaining` and `percentUsed` |

### 1.8. BUDGET

**No budget router exists.** The `Budget` model is defined in [budgetSchema.js](../server/models/budgetSchema.js) and is read by the expense routes, but there is no endpoint that creates, edits or deletes one. This blocks `POST /expense/addExpense`, which returns `404` for any trip without a budget.

The intended shape, for when the router is written:

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | `/budget/fetchBudgets` | JWT | Not written | Fetch all trip budgets for the authenticated user — currently served by [`/expense/fetchBudgets`](#17-expenses) |
| `GET` | `/budget/fetchBudget/:id` | JWT | Not written | Fetch a single trip budget |
| `POST` | `/budget/addBudget` | JWT | Not written | Add a new trip budget. A single trip may only ever have one |
| `PATCH` | `/budget/editBudget/:id` | JWT | Not written | Edit a single trip budget |
| `DELETE` | `/budget/deleteBudget/:id` | JWT | Not written | Delete a trip budget, and the expenses embedded in it |

### 1.9. VAT

**Base path:** `/vat`. Defined in [vatRoutes.js](../server/routes/vatRoutes.js). All routes require JWT. See [CALCULATORS.md](CALCULATORS.md) for the maths.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `POST` | [`/vat/calculate`](../server/routes/vatRoutes.js#L75) | JWT | Implemented | Works out the VAT on one amount. Saves nothing |
| `POST` | [`/vat/save`](../server/routes/vatRoutes.js#L113) | JWT | Implemented | Saves a calculation to the logged in user's history |
| `GET` | [`/vat/history`](../server/routes/vatRoutes.js#L189) | JWT | Implemented | The user's saved calculations, newest first |
| `DELETE` | [`/vat/history/:id`](../server/routes/vatRoutes.js#L228) | JWT | Implemented | Removes one of the user's saved calculations |

**Notes**

| Endpoint | Body / params | Other |
|---|---|---|
| `POST /vat/calculate` | `amount`, `mode` (default `exclusive`), `isZeroRated` (default `false`) | A `POST` rather than a `GET` so it takes the same JSON body as `/vat/save` and the client does not have to build a query string for one and a body for the other |
| `POST /vat/save` | Same three fields | The net, VAT and gross amounts are **recomputed** server-side rather than read off the body, so a stored record always holds figures the server worked out |
| `GET /vat/history` | — | Returns `{ success, total, limit, calculations }`. Capped at the newest **100** records; `total` is reported separately so the client can tell a truncated view from the whole history. Nothing is recalculated — each record holds the rate it was worked out at |
| `DELETE /vat/history/:id` | `:id` | The id and the user are matched in a single query, so another user's calculation behaves exactly like one that does not exist. `400` on a malformed id, `404` when not found |

### 1.10. CURRENCY CONVERTER

**Base path:** `/api`. Defined in [apiRoutes.js](../server/routes/apiRoutes.js). All routes require JWT.

> **This router is not mounted** in [app.js](../server/app.js#L64-L69), so every endpoint below currently returns the `404` fallback even though [Budget.js](../client/src/pages/Budget.js#L65) calls four of them. See [4. KNOWN GAPS](#4-known-gaps).

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/api/currencies`](../server/routes/apiRoutes.js#L67) | JWT | Written, not mounted | Every currency the converter can offer, as `{ code, name, symbol }` |
| `GET` | [`/api/convert`](../server/routes/apiRoutes.js#L86) | JWT | Written, not mounted | Converts an amount between two currencies. Saves nothing |
| `POST` | [`/api/save`](../server/routes/apiRoutes.js#L178) | JWT | Written, not mounted | Saves a conversion to the logged in user's history |
| `GET` | [`/api/history`](../server/routes/apiRoutes.js#L142) | JWT | Written, not mounted | The user's saved conversions, newest first |
| `DELETE` | [`/api/history/:id`](../server/routes/apiRoutes.js#L249) | JWT | Written, not mounted | Removes one of the user's saved conversions |

**Notes**

| Endpoint | Body / params | Other |
|---|---|---|
| `GET /api/currencies` | — | Returns `{ success, live, total, currencies }`. `live` is `false` when the list came from the offline snapshot in [currencies.js](../server/serverData/currencies.js), so the client can tell a real list from a stand-in |
| `GET /api/convert` | Query: `from`, `to`, `amount` | A conversion between a currency and itself short-circuits to a rate of `1` without calling the provider. `502` when Frankfurter cannot price the pair |
| `POST /api/save` | Body: `from`, `to`, `amount` | The rate is **fetched here** rather than read from the body, so a saved record always holds a rate the provider actually quoted |
| `GET /api/history` | — | Returns `{ success, total, limit, conversions }`, capped at the newest **100** records, same as `/vat/history` |
| `DELETE /api/history/:id` | `:id` | Matched on the id and the user in a single query, same as `/vat/history/:id` |

### 1.11. EXPORT

**Base path:** `/export`. [exportRoutes.js](../server/routes/exportRoutes.js) is a **comment-only stub** — it defines no router and exports nothing, and is not mounted.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | `/export/trips` | JWT | Not written | Export trips to `.csv` or `.xlsx` |
| `GET` | `/export/entries` | JWT | Not written | Export journal entries to `.csv` or `.xlsx` |
| `GET` | `/export/expenses` | JWT | Not written | Export expenses to `.csv` or `.xlsx` |
| `GET` | `/export/budget` | JWT | Not written | Export trip budgets to `.csv` or `.xlsx` |

### 1.12. SYSTEM

Defined directly on the app in [app.js](../server/app.js), not in a router.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/health`](../server/app.js#L71) | None | Implemented | Lightweight liveness check. Returns `{ status: 'ok', database: boolean }`, where `database` reflects the Mongoose connection state |
| `ALL` | [`*` fallback](../server/app.js#L77) | None | Implemented | Any unmatched path returns `404` as JSON — `{ message: "Cannot <METHOD> <url>" }` — rather than Express's default HTML page |
| `ALL` | [error handler](../server/app.js#L84) | None | Implemented | Catches anything passed to `next(error)`. A malformed JSON body returns `400`; anything else returns `500 Internal Server Error` |

## 2. THIRD PARTY APIS

All third-party API keys are stored as environment variables and are never exposed to the browser. The backend acts as a proxy, making external requests server-side and returning only the relevant data to the client.

### 2.1. FRANKFURTER

Exchange rate provider behind the currency converter and the expense conversion. Wrapped by [currencyService.js](../server/util/currencyService.js), which is the single point of contact with it. Frankfurter is **free and keyless**, so there is no API key to configure. The v2 API aggregates the rates published by 84 central banks.

**Base URL:** `https://api.frankfurter.dev/v2`

| Method | Upstream endpoint | Called by | Description |
|---|---|---|---|
| `GET` | `/v2/currencies` | `getSupportedCurrencies()` | Every currency code the API can convert |
| `GET` | `/v2/rates?base=&quotes=` | `getConversionRate()` | The rate for one currency pair |

**Behaviour**

- **Caching:** the currency list is cached in memory for **24 hours**, because it changes at most a handful of times a year. Every *rate*, by contrast, is fetched fresh so a stored rate is never stale.
- **Timeout:** an upstream request is abandoned after **8 seconds** rather than holding a client's request open.
- **Offline fallback:** if the list cannot be fetched, the static array in [currencies.js](../server/serverData/currencies.js) stands in, so the dropdowns still populate and `/api/convert` still validates its input while Frankfurter is unreachable. The `live: false` flag on `GET /api/currencies` reports when this has happened.
- **Arbitrary base:** unlike a fixed-base provider, `/v2/rates` accepts any base currency, so the rate for the requested pair comes back directly and no cross-rate maths is needed.

## 3. STATUS CODES USED

| Code | Meaning | When this API returns it |
|---|---|---|
| `200` | OK | A successful `GET`, `PATCH` or `DELETE` |
| `201` | Created | A successful `POST` that wrote a new record |
| `400` | Bad Request | A missing or malformed field, a malformed `ObjectId`, a Mongoose `ValidationError`, or a JSON body that could not be parsed |
| `401` | Unauthorized | Missing, malformed, invalid or expired token; wrong credentials on login; wrong current password on a password change; a token whose user no longer exists |
| `403` | Forbidden | A valid token aimed at another account's profile or password |
| `404` | Not Found | The record does not exist, **or** belongs to another account; also any unmatched path |
| `409` | Conflict | A username or email that is already registered |
| `429` | Too Many Requests | A rate limited route's quota is used up |
| `500` | Internal Server Error | An unhandled fault. The message is deliberately generic; the detail is logged server-side |
| `502` | Bad Gateway | Frankfurter is unreachable, or will not price the requested currency pair |

## 4. KNOWN GAPS

Points where the code does not yet match the tables above. Recorded here so the tables can be read as the intended shape.

| Where | Issue |
|---|---|
| [app.js:64-69](../server/app.js#L64-L69) | `apiRoutes.js` is never required or mounted, so `/api/currencies`, `/api/convert`, `/api/save` and `/api/history` all hit the 404 fallback. [Budget.js](../client/src/pages/Budget.js#L65) calls all four |
| [apiRoutes.js:149](../server/routes/apiRoutes.js#L149) | The handlers reference `CurrencyConvert`, a name that is never defined — the model is imported as `Conversion` on line 16. Every `/api` route that touches the database would throw a `ReferenceError` |
| [apiRoutes.js:256](../server/routes/apiRoutes.js#L256) | `mongoose.Types.ObjectId.isValid` is called but `mongoose` is not required in the file |
| [currConverterSchema.js](../server/models/currConverterSchema.js) | Requiring the module throws a `ReferenceError` — see [SCHEMAS.md §10](SCHEMAS.md#10-known-discrepancies). Mounting `apiRoutes.js` would fail at import until this is fixed |
| [exportRoutes.js](../server/routes/exportRoutes.js) | A comment-only stub: no `express.Router()`, no handlers, no `module.exports`, and not mounted |
| — | No budget router. A budget can be read through `/expense/fetchBudgets` but never created, edited or deleted, so `POST /expense/addExpense` cannot succeed for any trip |
| [userRoutes.js](../server/routes/userRoutes.js) | No delete handler, so an account cannot be removed through the API |
| [tripRoutes.js:239-244](../server/routes/tripRoutes.js#L239-L244), [entryRoutes.js:190-197](../server/routes/entryRoutes.js#L190-L197), [expenseRoutes.js:555-562](../server/routes/expenseRoutes.js#L555-L562) | The `PATCH` and `DELETE` sections are placeholder comments with no handlers. Trips, entries and expenses can be created and read but not edited or removed |
| [SCHEMAS.md §9](SCHEMAS.md#9-relationships) | Deletes are not cascaded by the schemas, so the delete routes above are responsible for clearing dependents — removing a trip must also clear its entries and its budget |

## 5. REFERENCES

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PATCH
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
- https://api.frankfurter.dev/v2/rates
- https://frankfurter.dev/
- https://expressjs.com/en/guide/routing.html
