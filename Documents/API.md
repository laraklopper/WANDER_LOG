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

Every router is mounted on a base path in [app.js](../server/app.js#L65-L71). The endpoints in the tables below are written in full, base path included.

| Base path | Router | Mounted | Purpose |
|---|---|---|---|
| `/auth` | [authRoutes.js](../server/routes/authRoutes.js) | Yes | Login and registration |
| `/users` | [userRoutes.js](../server/routes/userRoutes.js) | Yes | The current user, user lookups and profile edits |
| `/vat` | [vatRoutes.js](../server/routes/vatRoutes.js) | Yes | The VAT calculator and the user's saved calculations |
| `/trip` | [tripRoutes.js](../server/routes/tripRoutes.js) | Yes | The logged in user's trips |
| `/entry` | [entryRoutes.js](../server/routes/entryRoutes.js) | Yes | Journal entries written against a trip |
| `/expense` | [expenseRoutes.js](../server/routes/expenseRoutes.js) | Yes | Expenses, embedded in the budget of their trip |
| `/budget` | [budgetRoutes.js](../server/routes/budgetRoutes.js) | Yes | One budget per trip, and the expenses embedded in it |
| `/api` | [apiRoutes.js](../server/routes/apiRoutes.js) | Yes | Currency list, conversion and saved conversions |
| `/export` | [exportRoutes.js](../server/routes/exportRoutes.js) | **No** | Data export to `.csv` / `.xlsx` — a stub, no handlers written |

The table is in mount order, which is also the order the routers are required at the top of [app.js](../server/app.js#L16-L22).

### 1.2. CONVENTIONS

These apply to every table below, so they are not repeated in each one.

- **Auth** is `JWT` where [checkJwtToken](../server/routes/middleware.js#L13) runs before the handler, and `None` where the route is public. The token is signed with `HS256` and expires after **12 hours**.
- **The owner is always taken from the token**, never from the request body or a query param, so a request can only ever read or write the caller's own records.
- **Status** records whether the handler is written. `Implemented` is live; `Planned` is documented in the route file's header comment but has no handler yet; `Not written` is neither, and is listed only because the client or this document expects it. All but the first fall through to the 404 handler in [app.js](../server/app.js#L79).
- **A planned route is left as a comment, never as a handler-less `router.get`.** Express 5 throws `argument handler is required` when a route is registered without one, which would stop the whole router loading and take every route below it with it. This is why the placeholders in the route files are comments — see the note in [budgetRoutes.js](../server/routes/budgetRoutes.js#L230-L235).
- **Response shape** is not uniform across the routers. `/auth` and `/users` return the payload or `{ message }` at the top level; `/trip`, `/entry`, `/expense`, `/budget`, `/vat` and `/api` wrap every response in `{ success: boolean, ... }`.
- **Field-level errors come back keyed by their schema path.** A rule only Mongoose can judge is caught as a `ValidationError` and flattened into `{ message, errors: { <path>: <message> } }`, so the form can show each message against the input that caused it. The keys are the schema's own paths — `totalBudget`, `categoryLimits.food` — and each form names its inputs by that path, so nothing has to be translated.
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
| `GET` | [`/users/me`](../server/routes/userRoutes.js#L35) | JWT | Implemented | Returns the currently authenticated user's public profile |
| `GET` | [`/users/findUsers`](../server/routes/userRoutes.js#L55) | JWT | Implemented | Returns all users, or one filtered by the `?username=` query param |
| `PATCH` | [`/users/:id/editPassword`](../server/routes/userRoutes.js#L85) | JWT | Implemented | Updates the account password |
| `PATCH` | [`/users/:id/editUser`](../server/routes/userRoutes.js#L169) | JWT | Implemented | Updates `username`, `fullName`, `email`, `address` and `profilePicture` |
| `DELETE` | `/users/:id` | JWT | **Not written** | No delete handler exists on this router |

**Notes**

| Endpoint | Body | Rate limit | Other |
|---|---|---|---|
| `GET /users/me` | — | — | The token is turned back into an account by looking up the `userId` in its payload, so a token whose account has since been deleted returns `401` and the client ends the session, rather than reporting a server fault. The response is `toPublicJSON()`, which strips the password |
| `GET /users/findUsers` | — | — | Query: `?username=`. Every record is returned through `toPublicJSON()`. `password` is `select: false` on the schema and stripped again by the `toJSON` transform |
| `PATCH /users/:id/editPassword` | `currentPassword`, `newPassword` | 10 failed attempts / 15 min / IP | The current password is confirmed even though the token is valid, so a token taken from a shared machine is not enough to lock the owner out. `403` when `:id` is not the caller's own id — admins are not exempt. `400` when the new password matches the current one. `checkPassword` runs before the limiter and a successful change is not counted, so only a real guess spends an attempt |
| `PATCH /users/:id/editUser` | Any of `username`, `fullName`, `email`, `address`, `profilePicture` | — | Only those five fields are read, so `admin`, `password` or `entries` in the body cannot escalate the account. `address` is written key by key from a fixed list rather than looped over the body, so an unknown key cannot be added to the document. `profilePicture` is cleared by sending `null` — an absent key is the only value meaning *leave this alone*. `403` when `:id` is not the caller's own id; `409` on a taken username or email; `400` when nothing changed |

### 1.5. TRIPS

**Base path:** `/trip`. Defined in [tripRoutes.js](../server/routes/tripRoutes.js). All routes require JWT.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/trip/fetchTrips`](../server/routes/tripRoutes.js#L157) | JWT | Implemented | Lists every trip belonging to the logged in user, newest start date first, each with a resolved `hasBudget` |
| `GET` | `/trip/fetchTrip/:id` | JWT | Planned | Get one trip (optionally with its entries) |
| `POST` | [`/trip/addTrip`](../server/routes/tripRoutes.js#L211) | JWT | Implemented | Creates one trip for the logged in user |
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

An expense is **not a model of its own**: it is embedded in the budget of the trip it belongs to, one budget per trip (see [SCHEMAS.md §6.1](SCHEMAS.md#61-expense)). So an expense is always written through its parent budget, and a trip with no budget has nowhere to put one — set one with [`POST /budget/addBudget`](#18-budget) first.

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
| `POST /expense/addExpense` | `tripId`, `title` (≤100), `amount` (>0), `currency`, `category`, `date`, `notes` (≤300), `paymentMethod` (default `cash`), `isPaid` (default `true`) | The trip must already have a budget — `404` if not, rather than silently creating one, because a budget needs a total this form does not ask for. `convertedAmount` is worked out from a **live** Frankfurter rate rather than read from the body, and stored as `null` when the expense is already in the base currency or no rate could be read. `date` cannot be in the future. `category` and `paymentMethod` are matched case-insensitively and with either separator, so the form's `CREDIT CARD` stores as `credit_card`. A `ValidationError` on an embedded expense is keyed by its position — `expenses.3.amount` — so the index is stripped back to the field name the form knows. Returns the new expense plus the budget's recomputed `totalSpent`, `remaining` and `percentUsed` |

### 1.8. BUDGET

**Base path:** `/budget`. Defined in [budgetRoutes.js](../server/routes/budgetRoutes.js). All routes require JWT.

One budget per trip, with that trip's expenses embedded in it (see [SCHEMAS.md §6](SCHEMAS.md#6-budget)). This router is what the whole expense chain waits on: a trip with no budget has nowhere to put an expense, which is why [`POST /expense/addExpense`](#17-expenses) answers `404` for one, and why the add-expense form's trip select is filled from the budgets rather than from the trips.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | `/budget/fetchBudgets` | JWT | Planned | List the user's budgets — served for now by [`/expense/fetchBudgets`](#17-expenses) |
| `GET` | [`/budget/fetchBudget/:id`](../server/routes/budgetRoutes.js#L253) | JWT | Implemented | Fetches one budget whole, with its virtuals and its trip title |
| `POST` | [`/budget/addBudget`](../server/routes/budgetRoutes.js#L328) | JWT | Implemented | Sets the budget for one trip. A trip may only ever have one |
| `PATCH` | [`/budget/editBudget/:id`](../server/routes/budgetRoutes.js#L436) | JWT | Implemented | Edits the fields the budget form owns |
| `DELETE` | `/budget/deleteBudget/:id` | JWT | Planned | Delete a budget, and the expenses embedded in it |

**Notes**

| Endpoint | Body / params | Other |
|---|---|---|
| `GET /budget/fetchBudget/:id` | `:id` is the budget's own `_id` | Written alongside the edit route because that route cannot be reached without it: an edit is a `PATCH` of the fields the form owns, so the form has to open against all of them as currently stored, and `/expense/fetchBudgets` returns only the four its trip select reads. The expenses come back with it too, since the base currency is locked once there are any. `tripId` is flattened back to the id the form submits, with `tripTitle` alongside it for the disabled select to label. `400` on a malformed id, `404` when it is not on the caller's account |
| `POST /budget/addBudget` | `tripId`, `baseCurrency`, `totalBudget`, `dailyBudget` (optional), `categoryLimits.<category>` (optional ×10), `alerts.notifyAt80Percent`, `alerts.notifyOnExceed` | The trip is matched on its id **and** the owner together, so another account's trip returns `404`. **One budget per trip is enforced here, not by the database** — `tripId` carries a plain index rather than a unique one — so a trip that already has one returns `409` keyed on `tripId`. Saved through the document rather than with `insertOne`, because the schema's `pre('save')` hook is what fills in `dailyBudget` from the trip's dates when it was left blank. Returns the budget whole, with virtuals, so the page can report that worked-out daily figure without refetching |
| `PATCH /budget/editBudget/:id` | Any of the above except `tripId` | Two fields cannot be written. **`tripId`**: a budget cannot be moved to another trip, since that would either collide with the target's own or leave the original with none — `400` keyed on `tripId`, though resubmitting the *same* trip is not a change and is ignored. **`baseCurrency`**: locked once the budget holds expenses, because each one was converted into that currency as it was added and `totalSpent` sums those stored figures — `409` keyed on `baseCurrency`. It is free to change while nothing has been spent. `400` when the body carried nothing to change |

**Shared behaviour**

- **Both writes save through the document, not `findOneAndUpdate`**, so the schema's `pre('save')` hook runs. Clearing `dailyBudget` stores `null`, and the hook then works it out again from the total and the trip's dates — which is what the form promises under that input.
- **Every amount is optional except `totalBudget`.** One left blank is stored as `null` rather than left unset, which is the schema's own default and what *no cap* means for a category limit. Zero is allowed, matching `min: 0` on the schema.
- **`categoryLimits` and `alerts` are assigned by path**, not by replacing the nested object, so an edit carrying one category limit leaves the other nine as stored. A limit is only accepted for one of the ten keys in [expenseData.js](../server/serverData/expenseData.js), the same list `budgetSchema` builds the subdocument from.
- **Both shapes of key are read.** A body built as `{ categoryLimits: { food: 500 } }` and one built as `{ 'categoryLimits.food': 500 }` store the same limit, because the form names its inputs by schema path.
- **Alerts are coerced to real booleans**, so an unticked box arriving as the string `'false'` turns the alert off instead of being read as a truthy string. Both default to `true`.
- **`baseCurrency` is checked against the supported currency list**, not just its length: the schema caps the field at 3 characters, so an unpriceable code would otherwise be stored and every expense filed against it would fail to convert.
- **The expenses and the totals are never read from the body.** Expenses are written through `/expense/addExpense`, and `totalSpent`, `remaining`, `percentUsed` and `spendingByCategory` are virtuals worked out from them.

### 1.9. VAT

**Base path:** `/vat`. Defined in [vatRoutes.js](../server/routes/vatRoutes.js). All routes require JWT. See [CALCULATORS.md](CALCULATORS.md) for the maths.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `POST` | [`/vat/calculate`](../server/routes/vatRoutes.js#L101) | JWT | Implemented | Works out the VAT on one amount. Saves nothing |
| `POST` | [`/vat/save`](../server/routes/vatRoutes.js#L140) | JWT | Implemented | Saves a calculation to the logged in user's history |
| `GET` | [`/vat/history`](../server/routes/vatRoutes.js#L217) | JWT | Implemented | The user's saved calculations, newest first |
| `DELETE` | [`/vat/history/:id`](../server/routes/vatRoutes.js#L256) | JWT | Implemented | Removes one of the user's saved calculations |

**Notes**

| Endpoint | Body / params | Other |
|---|---|---|
| `POST /vat/calculate` | `amount`, `mode` (default `exclusive`), `isZeroRated` (default `false`), `ratePercent` (default `15`) | A `POST` rather than a `GET` so it takes the same JSON body as `/vat/save` and the client does not have to build a query string for one and a body for the other. `ratePercent` is optional: any rate from 0 to 100 is accepted, and one left out or sent empty falls back to the SARS standard rate. `isZeroRated` overrides it to 0. `400` on a rate outside those bounds |
| `POST /vat/save` | Same four fields | The net, VAT and gross amounts are **recomputed** server-side rather than read off the body, so a stored record always holds figures the server worked out |
| `GET /vat/history` | — | Returns `{ success, total, limit, calculations }`. Capped at the newest **100** records; `total` is reported separately so the client can tell a truncated view from the whole history. Nothing is recalculated — each record holds the rate it was worked out at |
| `DELETE /vat/history/:id` | `:id` | The id and the user are matched in a single query, so another user's calculation behaves exactly like one that does not exist. `400` on a malformed id, `404` when not found |

### 1.10. CURRENCY CONVERTER

**Base path:** `/api`. Defined in [apiRoutes.js](../server/routes/apiRoutes.js). All routes require JWT.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/api/currencies`](../server/routes/apiRoutes.js#L70) | JWT | Implemented | Every currency the converter can offer, as `{ code, name, symbol }` |
| `GET` | [`/api/convert`](../server/routes/apiRoutes.js#L89) | JWT | Implemented | Converts an amount between two currencies. Saves nothing |
| `GET` | [`/api/history`](../server/routes/apiRoutes.js#L145) | JWT | Implemented | The user's saved conversions, newest first |
| `POST` | [`/api/save`](../server/routes/apiRoutes.js#L181) | JWT | Implemented | Saves a conversion to the logged in user's history |
| `DELETE` | [`/api/history/:id`](../server/routes/apiRoutes.js#L255) | JWT | Implemented | Removes one of the user's saved conversions |

`GET /api/currencies` is the most-called endpoint in the app: besides the converter it fills the currency select on the budget form, the add-expense form and the expenses page, and is the source for [financeData.js](../client/src/data/financeData.js#L7) and [currencyFunc.js](../client/src/util/currencyFunc.js#L24).

**Notes**

| Endpoint | Body / params | Other |
|---|---|---|
| `GET /api/currencies` | — | Returns `{ success, live, total, currencies }`. `live` is `false` when the list came from the offline snapshot in [currencies.js](../server/serverData/currencies.js), so the client can tell a real list from a stand-in — [Budget.js](../client/src/pages/Budget.js#L59) keeps its own curated list when it is, because the snapshot carries codes without names |
| `GET /api/convert` | Query: `from`, `to`, `amount` | Both codes are trimmed and uppercased, so `?from=zar` is accepted. A conversion between a currency and itself short-circuits to a rate of `1` without calling the provider, and returns no `date`. `400` on a missing field, a non-positive amount, or a code the provider does not support; `502` when Frankfurter cannot price the pair. Returns `{ success, result, rate, date, from, to, amount }` |
| `GET /api/history` | — | Returns `{ success, total, limit, conversions }`, capped at the newest **100** records, same as `/vat/history` |
| `POST /api/save` | Body: `from`, `to`, `amount` | The rate is **fetched here** rather than read from the body, so a saved record always holds a rate the provider actually quoted. The `username` is read off the account, never trusted from the body. `convertedAmount` is not stored — it is a virtual off the amount and the rate, so there is no third figure to disagree with them |
| `DELETE /api/history/:id` | `:id` | Matched on the id and the user in a single query, same as `/vat/history/:id`. `400` on a malformed id, `404` when not found |

### 1.11. EXPORT

**Base path:** `/export`. [exportRoutes.js](../server/routes/exportRoutes.js) is a **comment-only stub** — eight lines, defining no router and exporting nothing, and it is not mounted.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | `/export/trips` | JWT | Not written | Export trips to `.csv` or `.xlsx` |
| `GET` | `/export/entries` | JWT | Not written | Export journal entries to `.csv` or `.xlsx` |
| `GET` | `/export/expenses` | JWT | Not written | Export expenses to `.csv` or `.xlsx` |
| `GET` | `/export/budget` | JWT | Not written | Export trip budgets to `.csv` or `.xlsx` |

The first three are the ones the stub's own header comment lists; `/export/budget` is named alongside them in [ExportForm.js](../client/src/components/ExportForm.js#L3-L6), which is where all four are recorded on the client.

### 1.12. SYSTEM

Defined directly on the app in [app.js](../server/app.js), not in a router.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/health`](../server/app.js#L73) | None | Implemented | Lightweight liveness check. Returns `{ status: 'ok', database: boolean }`, where `database` reflects the Mongoose connection state |
| `ALL` | [`*` fallback](../server/app.js#L79) | None | Implemented | Any unmatched path returns `404` as JSON — `{ message: "Cannot <METHOD> <url>" }` — rather than Express's default HTML page |
| `ALL` | [error handler](../server/app.js#L86) | None | Implemented | Catches anything passed to `next(error)`. A malformed JSON body returns `400`; anything else returns the error's own `status` or `500`, always with the generic `Internal Server Error` message |

**Request-level middleware**, applied in [app.js](../server/app.js#L41-L61) before any router:

| Middleware | Purpose |
|---|---|
| `helmet` | A baseline of security response headers, including a Content Security Policy. `crossOriginResourcePolicy` is relaxed to `cross-origin` so the React app on another origin can still load resources served from here |
| `cors` | The frontend and the API run on different ports, so every request is cross-origin. Only `CLIENT_URL` is allowed — defaulting to `http://localhost:3000` — and only the methods and headers the app actually sends |
| `express.json` | Parses JSON bodies into `req.body`, capped at **1mb** so an oversized payload is not buffered into memory |
| `express.urlencoded` | Parses form-encoded bodies, for a client that posts a plain HTML form |
| `trust proxy` | Set to `1` so `express-rate-limit` reads the real client IP rather than the proxy's when deployed behind one |

`ensureJwtSecret` runs before any of it, at the very top of [app.js](../server/app.js#L5-L8), so the route modules can read `JWT_SECRET_KEY` from the environment at import time.

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
| `400` | Bad Request | A missing or malformed field, a malformed `ObjectId`, a Mongoose `ValidationError`, a body with nothing to update, an attempt to move a budget to another trip, or a JSON body that could not be parsed |
| `401` | Unauthorized | Missing, malformed, invalid or expired token; wrong credentials on login; wrong current password on a password change; a token whose user no longer exists |
| `403` | Forbidden | A valid token aimed at another account's profile or password |
| `404` | Not Found | The record does not exist, **or** belongs to another account; a trip with no budget on `POST /expense/addExpense`; also any unmatched path |
| `409` | Conflict | A username or email that is already registered; a trip that already has a budget; a base currency changed on a budget that already holds expenses |
| `429` | Too Many Requests | A rate limited route's quota is used up |
| `500` | Internal Server Error | An unhandled fault. The message is deliberately generic; the detail is logged server-side |
| `502` | Bad Gateway | Frankfurter is unreachable, or will not price the requested currency pair |

## 4. KNOWN GAPS

Points where the code does not yet match the tables above. Recorded here so the tables can be read as the intended shape.

| Where | Issue |
|---|---|
| [exportRoutes.js](../server/routes/exportRoutes.js) | A comment-only stub: no `express.Router()`, no handlers, no `module.exports`, and not mounted. [ExportForm.js](../client/src/components/ExportForm.js#L3-L6) records all four paths |
| [ConversionsList.js](../client/src/components/ConversionsList.js) | A placeholder component that renders its own name. `GET /api/history` answers and [Budget.js](../client/src/pages/Budget.js) fetches into `conversions`, but nothing renders the rows yet. The formatters it needs are already written — `toRate`, `currencyLabelOf` and `convertedAmountOf` in [currencyFunc.js](../client/src/util/currencyFunc.js#L68-L104) |
| [currConverterSchema.js](../server/models/currConverterSchema.js) | `baseCurrency` and `targetCurrency` are `enum`d against the offline snapshot while the routes validate against the **live** provider list. The two match today (165 codes), but a currency Frankfurter adds would pass `/api/convert` and then fail validation on `/api/save` as a `400` |
| [budgetRoutes.js:235](../server/routes/budgetRoutes.js#L235) | `GET /budget/fetchBudgets` is a comment, not a handler. Listing a user's budgets is served by `/expense/fetchBudgets`, which returns only the four fields its trip select reads |
| [budgetRoutes.js:556](../server/routes/budgetRoutes.js#L556) | `DELETE /budget/deleteBudget/:id` is a comment, not a handler, so a budget cannot be removed. [BudgetList.js](../client/src/components/BudgetList.js#L447) already records the path |
| [budgetSchema.js:204](../server/models/budgetSchema.js#L204) | `tripId` is documented as unique but carries a plain index, so the one-budget-per-trip rule is enforced by the `409` in `POST /budget/addBudget` rather than by the database. Two concurrent creates for the same trip could both pass that check |
| [userRoutes.js](../server/routes/userRoutes.js) | No delete handler, so an account cannot be removed through the API |
| [tripRoutes.js:270-275](../server/routes/tripRoutes.js#L270-L275), [entryRoutes.js:190-197](../server/routes/entryRoutes.js#L190-L197), [expenseRoutes.js:555-562](../server/routes/expenseRoutes.js#L555-L562) | The `PATCH` and `DELETE` sections are placeholder comments with no handlers. Trips, entries and expenses can be created and read but not edited or removed. [TripsList.js](../client/src/components/TripsList.js#L222) records `/trip/editTrip/:id` and `/trip/deleteTrip/:id` |
| [SCHEMAS.md §9](SCHEMAS.md#9-relationships) | Deletes are not cascaded by the schemas, so the delete routes above are responsible for clearing dependents — removing a trip must also clear its entries and its budget |

## 5. REFERENCES

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PATCH
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
- https://api.frankfurter.dev/v2/rates
- https://frankfurter.dev/
- https://expressjs.com/en/guide/routing.html
