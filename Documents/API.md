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

Every router is mounted on a base path in [app.js](../server/app.js#L72-L80). The endpoints in the tables below are written in full, base path included.

| Base path | Router | Mounted | Purpose |
|---|---|---|---|
| `/auth` | [authRoutes.js](../server/routes/authRoutes.js) | Yes | Login and registration |
| `/users` | [userRoutes.js](../server/routes/userRoutes.js) | Yes | The current user, user lookups, profile edits and the admin delete |
| `/vat` | [vatRoutes.js](../server/routes/vatRoutes.js) | Yes | The VAT calculator and the user's saved calculations |
| `/trip` | [tripRoutes.js](../server/routes/tripRoutes.js) | Yes | The logged in user's trips |
| `/entry` | [entryRoutes.js](../server/routes/entryRoutes.js) | Yes | Journal entries written against a trip |
| `/expense` | [expenseRoutes.js](../server/routes/expenseRoutes.js) | Yes | Expenses, embedded in the budget of their trip |
| `/budget` | [budgetRoutes.js](../server/routes/budgetRoutes.js) | Yes | One budget per trip, and the expenses embedded in it |
| `/exports` | [exportRoutes.js](../server/routes/exportRoutes.js) | Yes | Data export to `.csv` / `.xlsx` |
| `/api` | [apiRoutes.js](../server/routes/apiRoutes.js) | Yes | Currency list, conversion and saved conversions |

The table is in mount order, which is also the order the routers are required at the top of [app.js](../server/app.js#L16-L24). Note the export base path is **`/exports`**, plural — it is the one base path that does not match its router's filename, and the client builds its URLs from the same plural in [ExportForm.js](../client/src/components/ExportForm.js#L167).

### 1.2. CONVENTIONS

These apply to every table below, so they are not repeated in each one.

- **Auth** is `JWT` where [checkJwtToken](../server/routes/middleware.js#L17) runs before the handler, and `None` where the route is public. The token is signed with `HS256` and expires after **12 hours**.
- **The owner is always taken from the token**, never from the request body or a query param, so a request can only ever read or write the caller's own records.
- **Admin-only routes add [checkAdmin](../server/routes/middleware.js#L162)** after `checkJwtToken`. It loads the stored account rather than trusting the `admin` claim on the token, because a token is signed once at login and carries the flag as it stood then — an account since demoted would otherwise keep presenting a token that still claims the right until it expires. Only [`DELETE /users/:id/deleteUser`](#14-users) uses it.
- **Body rules that do not need the database are enforced as middleware**, before the handler runs, so a bad request is refused without a lookup or a write. Two run on registration — [checkPassword](../server/routes/middleware.js#L220) and [checkAge](../server/routes/middleware.js#L300) — and both are mirrored by the same rule in the schema, which stays the last line of defence for any write that does not come through the route.
- **Status** records whether the handler is written. `Implemented` is live; `Planned` is documented in the route file's header comment but has no handler yet. A planned route falls through to the 404 handler in [app.js](../server/app.js#L89).
- **A planned route is left as a comment, never as a handler-less `router.get`.** Express 5 throws `argument handler is required` when a route is registered without one, which would stop the whole router loading and take every route below it with it. This is why the placeholders in the route files are comments — see the note in [budgetRoutes.js](../server/routes/budgetRoutes.js#L185-L190).
- **Response shape** is not uniform across the routers. `/auth` and `/users` return the payload or `{ message }` at the top level; `/trip`, `/entry`, `/expense`, `/budget`, `/vat` and `/api` wrap every response in `{ success: boolean, ... }`. `/exports` is the exception either way: a success is the **file itself**, not JSON, and only its failures are `{ success: false, message }`.
- **Field-level errors come back keyed by their schema path.** A rule only Mongoose can judge is caught as a `ValidationError` and flattened into `{ message, errors: { <path>: <message> } }`, so the form can show each message against the input that caused it. The keys are the schema's own paths — `totalBudget`, `categoryLimits.food` — and each form names its inputs by that path, so nothing has to be translated.
- **Ownership checks are folded into the query** on the routes that read one record by id, so another account's record is *not found* rather than *found and refused*, and an id cannot be guessed at to discover whether it exists elsewhere.
- **Rate limited** routes return `429` once the quota is used up. Seven routes carry a limiter: `/auth/login`, `/auth/register`, `/users/:id/editPassword`, and all four `/exports` routes, which share one limiter between them. The quotas are given in each section's notes.

### 1.3. AUTH

**Base path:** `/auth` — *No JWT required*. Defined in [authRoutes.js](../server/routes/authRoutes.js).

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `POST` | [`/auth/login`](../server/routes/authRoutes.js#L47) | None | Implemented | Validates credentials; returns `{ token, user }` |
| `POST` | [`/auth/register`](../server/routes/authRoutes.js#L82) | None | Implemented | Creates a new account; returns `{ token, user }` and logs the user straight in |

**Notes**

| Endpoint | Body | Rate limit | Other |
|---|---|---|---|
| `POST /auth/login` | `username`, `password` | 10 attempts / 15 min / IP | An unknown username and a wrong password both return the same `401`, so the endpoint cannot be used to test which usernames exist |
| `POST /auth/register` | `username`, `fullName`, `email`, `dateOfBirth`, `address`, `password`, `confirmPassword`, `profilePicture` (optional), `admin` (default `false`) | 20 registrations / hour / IP | Two middleware run before the handler, in this order: [checkPassword](../server/routes/middleware.js#L220) enforces 8+ characters with one special character, and [checkAge](../server/routes/middleware.js#L300) enforces the minimum age. A taken username or email returns `409` naming the field |

**The age rule.** All users must be **18 or older**; an account registering with `admin: true` must be **21 or older**. The limit is checked twice, on purpose:

| Where | What it does |
|---|---|
| [checkAge](../server/routes/middleware.js#L300) | Refuses the request before any database work — no duplicate lookup, no save. Returns `400` with `{ success, message, errors: { dateOfBirth } }` |
| [`userSchema.pre('validate')`](../server/models/userSchema.js#L205) | The same two limits, applied to the document itself, so an underage account cannot be written by any other path. Surfaces as the route's usual `ValidationError` `400` |

Each keeps its limits in a `MIN_AGE = { user: 18, admin: 21 }` map alongside an `ageInYears` helper that decrements when the birthday has not yet come round this year — a plain year subtraction would let someone through on the day before their eighteenth. The refusal message is worded identically in both places, so the user sees one wording whichever layer catches them. The map and the helper are **duplicated** rather than shared, so a change to either limit has to be made in both files.

`checkAge` returns `400` for four distinct cases, each keyed to `dateOfBirth` so [Register.js](../client/src/pages/Register.js#L110) can show it against the date input rather than only in the page banner:

| Case | Message |
|---|---|
| No `dateOfBirth` in the body | `Date of Birth is required` |
| A value that does not parse as a date | `Date of Birth must be a valid date` |
| A date not in the past | `Date of Birth must be a valid past date` |
| Below the limit for the role | `You must be at least 18 years old to register`, or `…at least 21 years old to register as an admin` |

`admin` is read as `true` or the string `'true'`, so a checkbox arriving from a form-encoded body decides the limit the same way a JSON boolean does, and nothing else counts as a request for admin rights.

### 1.4. USERS

**Base path:** `/users`. Defined in [userRoutes.js](../server/routes/userRoutes.js).

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/users/me`](../server/routes/userRoutes.js#L43) | JWT | Implemented | Returns the currently authenticated user's public profile |
| `GET` | [`/users/findUsers`](../server/routes/userRoutes.js#L63) | JWT | Implemented | Returns all users, or one filtered by the `?username=` query param |
| `PATCH` | [`/users/:id/editPassword`](../server/routes/userRoutes.js#L93) | JWT | Implemented | Updates the account password |
| `PATCH` | [`/users/:id/editUser`](../server/routes/userRoutes.js#L177) | JWT | Implemented | Updates `username`, `fullName`, `email`, `address` and `profilePicture` |
| `DELETE` | [`/users/:id/deleteUser`](../server/routes/userRoutes.js#L324) | JWT + **admin** | Implemented | Removes one account and every record filed against it |

**Notes**

| Endpoint | Body | Rate limit | Other |
|---|---|---|---|
| `GET /users/me` | — | — | The token is turned back into an account by looking up the `userId` in its payload, so a token whose account has since been deleted returns `401` and the client ends the session, rather than reporting a server fault. The response is `toPublicJSON()`, which strips the password |
| `GET /users/findUsers` | — | — | Query: `?username=`. Every record is returned through `toPublicJSON()`. `password` is `select: false` on the schema and stripped again by the `toJSON` transform |
| `PATCH /users/:id/editPassword` | `currentPassword`, `newPassword` | 10 failed attempts / 15 min / IP | The current password is confirmed even though the token is valid, so a token taken from a shared machine is not enough to lock the owner out. `403` when `:id` is not the caller's own id — admins are not exempt. `400` when the new password matches the current one. `checkPassword` runs before the limiter and a successful change is not counted, so only a real guess spends an attempt |
| `PATCH /users/:id/editUser` | Any of `username`, `fullName`, `email`, `address`, `profilePicture` | — | Only those five fields are read, so `admin`, `password` or `entries` in the body cannot escalate the account. `address` is written key by key from a fixed list rather than looped over the body, so an unknown key cannot be added to the document. `profilePicture` is cleared by sending `null` — an absent key is the only value meaning *leave this alone*. `403` when `:id` is not the caller's own id; `409` on a taken username or email; `400` when nothing changed |
| `DELETE /users/:id/deleteUser` | `:id` is the target account's `_id` | — | The inverse of every other route on this router: it acts on **another** account, never the caller's own, which is why it is the one route behind `checkAdmin`. Two refusals come before the delete — `403` when `:id` is the acting admin's own id, and `403` when the target is itself an admin, read off the stored document so the flag cannot be talked around. **Everything the account owns goes with it**, because the schemas do not cascade: trips, journal entries, budgets with their embedded expenses, and both calculation histories. The expenses are counted *before* the budgets are removed, since an expense is a sub-document of its budget and there is nothing left to count once the parent has gone. The two histories are matched on `user` rather than `userId`, the field name their own schemas use. The account is deleted **last**, so a failure part way through leaves the user listed and the delete can be run again — recoverable in a way an orphaned record is not. `400` on a malformed id, `404` when no such account. Returns `{ success, message, userId, username, removedTrips, removedEntries, removedBudgets, removedExpenses, removedVatCalculations, removedConversions }`, and the message names each non-zero count, because those records are not on screen and the admin has no other way of seeing what the delete reached |

### 1.5. TRIPS

**Base path:** `/trip`. Defined in [tripRoutes.js](../server/routes/tripRoutes.js). All routes require JWT.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/trip/fetchTrips`](../server/routes/tripRoutes.js#L249) | JWT | Implemented | Lists every trip belonging to the logged in user, newest start date first, each with a resolved `hasBudget` |
| `GET` | [`/trip/fetchTrip/:id`](../server/routes/tripRoutes.js#L293) | JWT | Implemented | Reads one trip back whole, with the journal entries filed against it |
| `POST` | [`/trip/addTrip`](../server/routes/tripRoutes.js#L355) | JWT | Implemented | Creates one trip for the logged in user |
| `PATCH` | [`/trip/editTrip/:id`](../server/routes/tripRoutes.js#L428) | JWT | Implemented | Updates the fields the body carries on one of the user's trips |
| `DELETE` | [`/trip/deleteTrip/:id`](../server/routes/tripRoutes.js#L579) | JWT | Implemented | Deletes one trip, and the entries and budget filed against it |

**Notes**

| Endpoint | Body / params | Other |
|---|---|---|
| `GET /trip/fetchTrips` | — | Returns `{ success, count, trips }`, each trip whole. Fills the journal's add-entry trip select and the travel log's trip list. `hasBudget` is answered off the caller's budgets rather than read from the flag stored on the trip, which no route writes to |
| `GET /trip/fetchTrip/:id` | `:id` is the trip's own `_id` | Matched on the id and the owner in a single query, so another account's trip behaves exactly like one that does not exist, and the entries are only looked up once that has answered. **The entries are what this route adds** — `/fetchTrips` already returns every trip whole, while an entry is its own document filed against a trip by id and no other route returns them. Sorted newest first, the order [`entrySchema`'s](../server/models/entrySchema.js#L80) `{ tripId, date }` index is built in. `hasBudget` is resolved off the caller's budgets, the same as on the list, so the two routes cannot answer it differently. `400` on a malformed id, `404` when it is not on the caller's account. Returns `{ success, trip, entries, count }`, where `count` is the entries this read returned — the trip's own `entryCount` is left as stored, and reporting the two separately is what would show them drifting apart |
| `POST /trip/addTrip` | `title`, `purpose`, `destination.destinationType`, `destination.tripLocation`, `destination.country`, `date.startDate`, `date.endDate`, `status` | `userId` and `username` come from the token and the database, never the body. `purpose` is `Holiday` \| `Business`, `destinationType` is `Domestic` \| `International`, `status` is `upcoming` \| `ongoing` \| `completed` (default `upcoming`) — all matched case-insensitively. `country` is required for an international trip and dropped from a domestic one. `entryCount` is maintained by the hooks on `entrySchema` |
| `DELETE /trip/deleteTrip/:id` | `:id` is the trip's own `_id` | Read back on the id and the owner together before anything is removed, so the dependents of another account's trip are never touched and a trip that is not on the caller's account behaves exactly like one that does not exist. **The entries and the budget go with it**, because the schemas do not cascade a delete: the journal entries filed against the trip are removed, and so is its budget along with the expenses embedded in it (an expense is a sub-document of its trip's budget, not a model of its own). The dependents are cleared first and the trip last, so a failure part way through leaves the trip in place to be deleted again rather than leaving records with no trip to reach them through. `400` on a malformed id, `404` when it is not on the caller's account. Returns `{ success, message, tripId, removedEntries, removedBudget, removedExpenses }`, and the message names the counts because the journal and the expenses page are built from those records |

### 1.6. ENTRIES

**Base path:** `/entry`. Defined in [entryRoutes.js](../server/routes/entryRoutes.js). All routes require JWT.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/entry/fetchEntries`](../server/routes/entryRoutes.js#L143) | JWT | Implemented | Lists every entry the logged in user has written, newest first — the entries of **one** trip are served by [`GET /trip/fetchTrip/:id`](#15-trips) |
| `GET` | `/entry/fetchEntry/:id` | JWT | Planned | Fetch one entry |
| `POST` | [`/entry/addEntry`](../server/routes/entryRoutes.js#L174) | JWT | Implemented | Creates one journal entry against one of the user's trips |
| `PATCH` | [`/entry/editEntry/:id`](../server/routes/entryRoutes.js#L247) | JWT | Implemented | Updates the fields the body carries on one of the user's entries |
| `DELETE` | [`/entry/delete/:id`](../server/routes/entryRoutes.js#L369) | JWT | Implemented | Deletes one of the user's entries, and takes it off its trip's `entryCount` |

**Notes**

| Endpoint | Body | Other |
|---|---|---|
| `GET /entry/fetchEntries` | — | Returns `{ success, count, entries }`, each entry whole. Filtered on the userId read off the token, never one carried in the query. Sorted newest date first, the same order the entries of one trip are read back in by `GET /trip/fetchTrip/:id`, so the journal reads the same way whichever route filled it. Each entry stores the title of the trip it is filed against, so nothing is populated to name the trip — `PATCH /editEntry/:id` is what keeps that title in step. Fills the travel log's entries list |
| `POST /entry/addEntry` | `tripId`, `title` (≤150), `body` (≤2000), `date` | The trip is matched on its id **and** the owner together, so an entry cannot be filed against another account's trip — a mismatch returns `404`. The stored trip title is read off the trip document rather than trusted from the body |
| `PATCH /entry/editEntry/:id` | `:id` is the entry's own `_id`; any of `tripId`, `title` (≤150), `body` (≤2000), `date` | Only the fields the body carries are written, everything else is left as stored, and each one that is present is checked exactly as a create checks it — a blank title is refused rather than written over the stored one. `userId`, `username` and the stored `trip` title cannot be set through here: the owner stays as it was written from the token and the account, and the title is read off the trip document the entry is being moved to. A `tripId` naming the trip the entry is already on is dropped rather than sent as a move, so a body that carries nothing else returns `400`. The entry is matched on its id and the owner together, and so is the trip it is moved to, so another account's entry or trip behaves exactly like one that does not exist. **Moving an entry re-counts both trips** — `entryCount` is `$inc`-ed off the old trip and onto the new one, because [`entrySchema`'s](../server/models/entrySchema.js#L83) hooks only maintain it on a create and a delete. Written through `findOneAndUpdate` for the same reason: the post-save hook cannot tell an edit from a create, so saving the document would count the entry twice. `400` on a malformed id or an unusable field, `404` when the entry or the trip is not on the caller's account. Returns `{ success, message, entry }` |
| `DELETE /entry/delete/:id` | `:id` is the entry's own `_id` | Matched on the id and the owner together, so another account's entry behaves exactly like one that does not exist. Nothing is filed against an entry, so unlike a trip there is nothing to cascade: the only other record that knows about it is the `entryCount` on its trip, which the post `findOneAndDelete` hook on [`entrySchema`](../server/models/entrySchema.js#L90) decrements. Removed through `findOneAndDelete` for exactly that reason — `deleteOne` would not fire the hook and the trip would go on counting an entry that is no longer stored. `400` on a malformed id, `404` when it is not on the caller's account. Returns `{ success, message, entryId, tripId }`, the trip id so the caller can reload the trip whose count has just changed |

### 1.7. EXPENSES

**Base path:** `/expense`. Defined in [expenseRoutes.js](../server/routes/expenseRoutes.js). All routes require JWT.

An expense is **not a model of its own**: it is embedded in the budget of the trip it belongs to, one budget per trip (see [SCHEMAS.md §6.1](SCHEMAS.md#61-expense)). So an expense is always written through its parent budget, and a trip with no budget has nowhere to put one — set one with [`POST /budget/addBudget`](#18-budget) first. The same embedding is why [`DELETE /budget/deleteBudget/:id`](#18-budget) removes a trip's expenses along with its budget: there is no expense document left to keep once the parent has gone.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/expense/fetchBudgets`](../server/routes/expenseRoutes.js#L340) | JWT | Implemented | Lists the user's budgets with their trip title and base currency, for the form's trip select |
| `GET` | [`/expense/fetchExpenses`](../server/routes/expenseRoutes.js#L391) | JWT | Implemented | Lists every expense across all of the user's trips, newest spend first |
| `GET` | [`/expense/fetchExpense/:id`](../server/routes/expenseRoutes.js#L428) | JWT | Implemented | Fetches one expense by its own subdocument id |
| `POST` | [`/expense/addExpense`](../server/routes/expenseRoutes.js#L488) | JWT | Implemented | Adds one expense to the budget of the selected trip |
| `PATCH` | [`/expense/updateExpense/:id`](../server/routes/expenseRoutes.js#L598) | JWT | Implemented | Edits one expense, moving it to another trip's budget when the trip is changed |
| `DELETE` | [`/expense/delete/:id`](../server/routes/expenseRoutes.js#L816) | JWT | Implemented | Removes one expense from the budget it was spent against |

**Notes**

| Endpoint | Body / params | Other |
|---|---|---|
| `GET /expense/fetchBudgets` | — | A budget whose trip has since been deleted is left out: there is no trip left to file an expense against |
| `GET /expense/fetchExpenses` | — | Each expense is flattened and carries `budgetId`, `baseCurrency`, `tripId` and `tripTitle`. An expense whose trip is gone is still listed, labelled `Trip no longer available` |
| `GET /expense/fetchExpense/:id` | `:id` is the embedded subdocument's `_id` | The parent budget is found by the expense it holds, matched on the owner at the same time. `400` on a malformed id, `404` when it is not on the caller's account |
| `POST /expense/addExpense` | `tripId`, `title` (≤100), `amount` (>0), `currency`, `category`, `date`, `notes` (≤300), `paymentMethod` (default `cash`), `isPaid` (default `true`) | The trip must already have a budget — `404` if not, rather than silently creating one, because a budget needs a total this form does not ask for. `convertedAmount` is worked out from a **live** Frankfurter rate rather than read from the body, and stored as `null` when the expense is already in the base currency or no rate could be read. `date` cannot be in the future. `category` and `paymentMethod` are matched case-insensitively and with either separator, so the form's `CREDIT CARD` stores as `credit_card`. A `ValidationError` on an embedded expense is keyed by its position — `expenses.3.amount` — so the index is stripped back to the field name the form knows. Returns the new expense plus the budget's recomputed `totalSpent`, `remaining` and `percentUsed` |
| `PATCH /expense/updateExpense/:id` | `:id` is the embedded subdocument's `_id`. Any of the `addExpense` fields, only the ones being changed | Partial: a field the body does not carry is left as it is stored, one that is present is checked the same way a create checks it, and a field carrying the value already stored is not counted as a change. `400` with `There is nothing to update` when nothing is left to write. Changing `tripId` is a **move**, not a field being written: the expense is taken off one budget and pushed onto the other with its own `_id` kept, so anything open on that id still is afterwards — the destination is saved first, so a failure between the two leaves the expense listed twice rather than not at all, and a trip with no budget is `404`. `convertedAmount` is reworked from a live rate only when the figure it came from moves: the amount, its currency, or the base currency it is converted into. `username` cannot be written through here. Returns the updated expense, shaped as `fetchExpenses` returns one, plus the recomputed figures of the budget it now sits on |
| `DELETE /expense/delete/:id` | `:id` is the embedded subdocument's `_id` | The parent budget is found by the expense it holds, matched on the owner at the same time, and the expense is pulled off it. `400` on a malformed id, `404` when it is not on the caller's account. Nothing else is filed against an expense, so there is nothing to clear up after it: the budget's `totalSpent`, `remaining` and `percentUsed` are virtuals worked out from the expenses it holds, so they are correct the moment it is gone, and are returned with the response. The budget itself is left standing — the reverse is [`DELETE /budget/deleteBudget/:id`](#18-budget), which removes a budget along with every expense embedded in it. Returns `expenseId`, `budgetId` and `tripId`, so the client can drop the row and close anything open on that expense |

### 1.8. BUDGET

**Base path:** `/budget`. Defined in [budgetRoutes.js](../server/routes/budgetRoutes.js). All routes require JWT.

One budget per trip, with that trip's expenses embedded in it (see [SCHEMAS.md §6](SCHEMAS.md#6-budget)). This router is what the whole expense chain waits on: a trip with no budget has nowhere to put an expense, which is why [`POST /expense/addExpense`](#17-expenses) answers `404` for one, and why the add-expense form's trip select is filled from the budgets rather than from the trips.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | `/budget/fetchBudgets` | JWT | Planned | List the user's budgets — served for now by [`/expense/fetchBudgets`](#17-expenses) |
| `GET` | [`/budget/fetchBudget/:id`](../server/routes/budgetRoutes.js#L202) | JWT | Implemented | Fetches one budget whole, with its virtuals and its trip title |
| `POST` | [`/budget/addBudget`](../server/routes/budgetRoutes.js#L261) | JWT | Implemented | Sets the budget for one trip. A trip may only ever have one |
| `PATCH` | [`/budget/editBudget/:id`](../server/routes/budgetRoutes.js#L365) | JWT | Implemented | Edits the fields the budget form owns |
| `DELETE` | [`/budget/deleteBudget/:id`](../server/routes/budgetRoutes.js#L509) | JWT | Implemented | Deletes a budget, and the expenses embedded in it |

**Notes**

| Endpoint | Body / params | Other |
|---|---|---|
| `GET /budget/fetchBudget/:id` | `:id` is the budget's own `_id` | Written alongside the edit route because that route cannot be reached without it: an edit is a `PATCH` of the fields the form owns, so the form has to open against all of them as currently stored, and `/expense/fetchBudgets` returns only the four its trip select reads. The expenses come back with it too, since the base currency is locked once there are any. `tripId` is flattened back to the id the form submits, with `tripTitle` alongside it for the disabled select to label. `400` on a malformed id, `404` when it is not on the caller's account |
| `POST /budget/addBudget` | `tripId`, `baseCurrency`, `totalBudget`, `dailyBudget` (optional), `categoryLimits.<category>` (optional ×10), `alerts.notifyAt80Percent`, `alerts.notifyOnExceed` | The trip is matched on its id **and** the owner together, so another account's trip returns `404`. **One budget per trip is enforced here, not by the database** — `tripId` carries a plain index rather than a unique one — so a trip that already has one returns `409` keyed on `tripId`. Saved through the document rather than with `insertOne`, because the schema's `pre('save')` hook is what fills in `dailyBudget` from the trip's dates when it was left blank. Returns the budget whole, with virtuals, so the page can report that worked-out daily figure without refetching |
| `PATCH /budget/editBudget/:id` | Any of the above except `tripId` | Two fields cannot be written. **`tripId`**: a budget cannot be moved to another trip, since that would either collide with the target's own or leave the original with none — `400` keyed on `tripId`, though resubmitting the *same* trip is not a change and is ignored. **`baseCurrency`**: locked once the budget holds expenses, because each one was converted into that currency as it was added and `totalSpent` sums those stored figures — `409` keyed on `baseCurrency`. It is free to change while nothing has been spent. `400` when the body carried nothing to change |
| `DELETE /budget/deleteBudget/:id` | `:id` is the budget's own `_id` | Matched on the id and the owner in a single query, so another account's budget behaves exactly like one that does not exist. **The expenses go with it** — an expense is a sub-document of its trip's budget, not a model of its own, so removing the parent removes every expense on that trip in the same write and nothing is left orphaned. `removedExpenses` reports how many, and the message names the count, because the client's expense list is built from the budgets and would otherwise appear to lose rows unexplained. The trip is left alone and can be given a new budget straight away: the `409` on `POST /budget/addBudget` only stands while one exists. The trip's stored `hasBudget` flag is not written, the same as on the create — `GET /trip/fetchTrips` answers that field off the caller's budgets rather than reading it. `400` on a malformed id, `404` when it is not on the caller's account. Returns `{ success, message, budgetId, tripId, removedExpenses }` |

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
| `GET` | [`/api/currencies`](../server/routes/apiRoutes.js#L69) | JWT | Implemented | Every currency the converter can offer, as `{ code, name, symbol }` |
| `GET` | [`/api/convert`](../server/routes/apiRoutes.js#L88) | JWT | Implemented | Converts an amount between two currencies. Saves nothing |
| `GET` | [`/api/history`](../server/routes/apiRoutes.js#L144) | JWT | Implemented | The user's saved conversions, newest first |
| `POST` | [`/api/save`](../server/routes/apiRoutes.js#L180) | JWT | Implemented | Saves a conversion to the logged in user's history |
| `DELETE` | [`/api/history/:id`](../server/routes/apiRoutes.js#L249) | JWT | Implemented | Removes one of the user's saved conversions |

`GET /api/currencies` is the most-called endpoint in the app: besides the converter it fills the currency select on the budget form, the add-expense form and the expenses page, and is the source for [financeData.js](../client/src/data/financeData.js#L7) and [currencyFunc.js](../client/src/util/currencyFunc.js#L27).

Every route on this router is called from the client, all five through [Budget.js](../client/src/pages/Budget.js), which owns the converter's state and passes the requests down: `/api/currencies`, `/api/convert` and `/api/save` to [CurrencyConverter.js](../client/src/components/CurrencyConverter.js), and `/api/history` and `/api/history/:id` to [ConversionsList.js](../client/src/components/ConversionsList.js). Nothing on the list is repriced — each record holds the rate its save fetched, so the display formatters in [currencyFunc.js](../client/src/util/currencyFunc.js#L61-L104) only read stored figures.

**Notes**

| Endpoint | Body / params | Other |
|---|---|---|
| `GET /api/currencies` | — | Returns `{ success, live, total, currencies }`. `live` is `false` when the list came from the offline snapshot in [currencies.js](../server/serverData/currencies.js), so the client can tell a real list from a stand-in — [Budget.js](../client/src/pages/Budget.js#L50) keeps its own curated list when it is, because the snapshot carries codes without names |
| `GET /api/convert` | Query: `from`, `to`, `amount` | Both codes are trimmed and uppercased, so `?from=zar` is accepted. A conversion between a currency and itself short-circuits to a rate of `1` without calling the provider, and returns no `date`. `400` on a missing field, a non-positive amount, or a code the provider does not support; `502` when Frankfurter cannot price the pair. Returns `{ success, result, rate, date, from, to, amount }` |
| `GET /api/history` | — | Returns `{ success, total, limit, conversions }`, capped at the newest **100** records, same as `/vat/history`. Each record carries the `convertedAmount` virtual, because `converterSchema` sets `toJSON: { virtuals: true }`. Fetched by [Budget.js](../client/src/pages/Budget.js#L186) when the conversions panel is opened, and rendered by [ConversionsList.js](../client/src/components/ConversionsList.js), which compares `total` against the array it was given to say when the view is truncated |
| `POST /api/save` | Body: `from`, `to`, `amount` | The rate is **fetched here** rather than read from the body, so a saved record always holds a rate the provider actually quoted. The `username` is read off the account, never trusted from the body. `convertedAmount` is not stored — it is a virtual off the amount and the rate, so there is no third figure to disagree with them |
| `DELETE /api/history/:id` | `:id` | Matched on the id and the user in a single query, same as `/vat/history/:id`. `400` on a malformed id, `404` when not found. Returns `conversionId` so the client can drop the row, though `deleteConversion` in [Budget.js](../client/src/pages/Budget.js#L226) refetches the list instead, so what is on screen is what the database holds |

### 1.11. EXPORT

**Base path:** `/exports` — note the plural. Defined in [exportRoutes.js](../server/routes/exportRoutes.js). All routes require JWT and share one rate limiter.

Every route answers with a **file** rather than with JSON, in either `.csv` or `.xlsx`, and returns the whole of that record type on the account.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/exports/trips`](../server/routes/exportRoutes.js#L207) | JWT | Implemented | Every trip on the account, newest departure first |
| `GET` | [`/exports/entries`](../server/routes/exportRoutes.js#L289) | JWT | Implemented | Every journal entry on the account, newest first |
| `GET` | [`/exports/expenses`](../server/routes/exportRoutes.js#L357) | JWT | Implemented | Every expense across all trips, newest spend first |
| `GET` | [`/exports/budgets`](../server/routes/exportRoutes.js#L441) | JWT | Implemented | Every trip budget on the account, newest first |

All four are recorded on the client in [ExportForm.js](../client/src/components/ExportForm.js#L3-L6), one form serving all four because every export asks the same single question.

**Notes**

| Endpoint | Query | Rate limit | Other |
|---|---|---|---|
| All four | `?format=csv` or `?format=xlsx` | 60 exports / 15 min / IP, **shared** across the four | The format is required, not defaulted: the select opens on a placeholder, so an empty one means the user submitted without choosing and is told so rather than handed a format they did not pick. `400` naming both formats when it is missing or unrecognised |
| `GET /exports/trips` | — | — | `hasBudget` is answered from the caller's own budgets rather than read off the trip, the same way `GET /trip/fetchTrips` answers it. `entryCount` is read through a finite-number check rather than a falsy fallback, so a trip with no entries yet writes a nought instead of an empty cell |
| `GET /exports/entries` | — | — | The body is stored as the editor's rich text HTML, so it is reduced to plain text before it is written — exported raw, the cell would hold markup. The trip is read off the entry's own stored title, so an entry whose trip has since been deleted still says which trip it was about |
| `GET /exports/expenses` | — | — | There is no expense collection to query, so the caller's budgets are read and the expenses they hold are flattened into one list, then sorted after they are gathered because they arrive grouped by budget. Each row carries **both** figures — the amount as paid and the amount in the budget's base currency — so that second column totals to the trip's spend whatever each expense was paid in |
| `GET /exports/budgets` | — | — | The whole document is loaded rather than a field selection, because the spend figures are virtuals computed off the embedded expenses and selecting away `expenses` would leave every total reading nought. `percentUsed` is worked out in the route rather than read off the virtual, which divides by the total and would write `Infinity` for a budget set at nought |

**Shared behaviour**

- **A success is the file, not JSON.** The response carries the media type of the format, a `Content-Disposition` naming the file, a `Content-Length` set from the buffer so the browser can show real download progress, and `Cache-Control: no-store`, because the body is one account's records and must not be kept by a cache. `Content-Disposition` is in the `exposedHeaders` of the CORS config in [app.js](../server/app.js#L52-L56), so the form can read the name the server chose instead of inventing one.
- **The filename is built from the account and the date** it was taken, so two exports a month apart do not overwrite each other in the downloads folder.
- **The username is read off the account, not the token**, which `signToken` deliberately fills with the id and the role alone. That lookup doubles as a check that the account still exists — a deleted one leaves a token that still verifies and has no data left to export, so it answers `401`.
- **An empty export is a `404`**, not an empty file, and the message names the record type: there is nothing to open in a spreadsheet with no rows in it.
- **Nothing is read from the query beyond the format**, and every query is filtered on the userId from the token, so an export can only ever hold the caller's own records.
- **The list filters are not applied.** An export is a copy of the data, not a copy of the screen, and the filter forms do not yet submit anything for a route to filter on.
- **The file itself is built by [exportFile.js](../server/util/exportFile.js)**, handed the columns and rows of native values each route shapes. A `date` cell is written as a real date and a `money` cell as a real number, so both sort and total in a spreadsheet rather than reading back as text.

### 1.12. SYSTEM

Defined directly on the app in [app.js](../server/app.js), not in a router.

| Method | Endpoint | Auth | Status | Description |
|---|---|---|---|---|
| `GET` | [`/health`](../server/app.js#L83) | None | Implemented | Lightweight liveness check. Returns `{ status: 'ok', database: boolean }`, where `database` reflects the Mongoose connection state |
| `ALL` | [`*` fallback](../server/app.js#L89) | None | Implemented | Any unmatched path returns `404` as JSON — `{ message: "Cannot <METHOD> <url>" }` — rather than Express's default HTML page |
| `ALL` | [error handler](../server/app.js#L96) | None | Implemented | Catches anything passed to `next(error)`. A malformed JSON body returns `400`; anything else returns the error's own `status` or `500`, always with the generic `Internal Server Error` message |

**Request-level middleware**, applied in [app.js](../server/app.js#L43-L68) before any router:

| Middleware | Purpose |
|---|---|
| `helmet` | A baseline of security response headers, including a Content Security Policy. `crossOriginResourcePolicy` is relaxed to `cross-origin` so the React app on another origin can still load resources served from here |
| `cors` | The frontend and the API run on different ports, so every request is cross-origin. Only `CLIENT_URL` is allowed — defaulting to `http://localhost:3000` — and only the methods and headers the app actually sends. `Content-Disposition` is added to `exposedHeaders`, because a cross-origin response only lets the page read a handful of headers by default and the export form would otherwise be unable to read the filename the server chose |
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
| `200` | OK | A successful `GET`, `PATCH` or `DELETE` — and on `/exports`, the file itself |
| `201` | Created | A successful `POST` that wrote a new record |
| `400` | Bad Request | A missing or malformed field, a malformed `ObjectId`, a Mongoose `ValidationError`, a body with nothing to update, a registration below the minimum age for its role, an attempt to move a budget to another trip, a missing or unrecognised `?format=` on an export, or a JSON body that could not be parsed |
| `401` | Unauthorized | Missing, malformed, invalid or expired token; wrong credentials on login; wrong current password on a password change; a token whose user no longer exists |
| `403` | Forbidden | A valid token aimed at another account's profile or password; a non-admin token on `DELETE /users/:id/deleteUser`; an admin aiming that route at their own account or at another admin |
| `404` | Not Found | The record does not exist, **or** belongs to another account; a trip with no budget on `POST /expense/addExpense`; an export with no records to write; also any unmatched path |
| `409` | Conflict | A username or email that is already registered; a trip that already has a budget; a base currency changed on a budget that already holds expenses |
| `429` | Too Many Requests | A rate limited route's quota is used up |
| `500` | Internal Server Error | An unhandled fault. The message is deliberately generic; the detail is logged server-side |
| `502` | Bad Gateway | Frankfurter is unreachable, or will not price the requested currency pair |

## 4. KNOWN GAPS

Points where the code does not yet match the tables above. Recorded here so the tables can be read as the intended shape.

| Where | Issue |
|---|---|
| [currConverterSchema.js](../server/models/currConverterSchema.js#L39) | `baseCurrency` and `targetCurrency` are `enum`d against the offline snapshot while the routes validate against the **live** provider list. The two match today (165 codes), but a currency Frankfurter adds would pass `/api/convert` and then fail validation on `/api/save` as a `400` |
| [budgetRoutes.js:190](../server/routes/budgetRoutes.js#L185-L190) | `GET /budget/fetchBudgets` is a comment, not a handler. Listing a user's budgets is served by `/expense/fetchBudgets`, which returns only the four fields its trip select reads |
| [budgetSchema.js:204](../server/models/budgetSchema.js#L204) | `tripId` is documented as unique but carries a plain index, so the one-budget-per-trip rule is enforced by the `409` in `POST /budget/addBudget` rather than by the database. Two concurrent creates for the same trip could both pass that check |
| [entryRoutes.js](../server/routes/entryRoutes.js) | `GET /entry/fetchEntry/:id` is named in the router's header comment but has no handler. Nothing needs it yet: the entries of one trip come back with `GET /trip/fetchTrip/:id`, and the whole list from `GET /entry/fetchEntries` |
| [middleware.js:282](../server/routes/middleware.js#L282), [userSchema.js:18](../server/models/userSchema.js#L18) | `MIN_AGE` and `ageInYears` are defined twice, once per file, so the 18/21 limits and the age calculation have to be changed in both places. Shared behaviour with no shared source — see [1.3](#13-auth) |
| [middleware.js](../server/routes/middleware.js#L248) | Three exports are unused by any route — `hashPassword`, `generalRateLimiter` and `passwordUpdateRateLimiter`. `hashPassword` would also throw on its first call: it uses `bcrypt` without requiring it. Password hashing is done by the `pre('save')` hook on `userSchema`, and the password-change quota by `editPasswordLimiter`, which [userRoutes.js](../server/routes/userRoutes.js#L24) defines itself |
| [SCHEMAS.md §9](SCHEMAS.md#9-relationships) | Deletes are not cascaded by the schemas, so each delete route clears its own dependents: `DELETE /trip/deleteTrip/:id` for a trip's entries and budget, `DELETE /budget/deleteBudget/:id` for a budget's expenses, and `DELETE /users/:id/deleteUser` for everything an account owns. A schema-level hook would remove the need for each new route to remember |

## 5. REFERENCES

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PATCH
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
- https://api.frankfurter.dev/v2/rates
- https://frankfurter.dev/
- https://expressjs.com/en/guide/routing.html
