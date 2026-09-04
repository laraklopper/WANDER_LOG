# FORMS

Every form in the application is a React component in [client/src/components/](../client/src/components/), rendered by the page that owns the request it sends. This document is the reference for those forms: the ones that exist, the ones the app still needs, the fields each one collects, and the endpoint each one writes to.

A form is listed here as **required** where a schema in [SCHEMAS.md](SCHEMAS.md) has no way of being written from the UI without it. The field tables mirror the schema constraints, because a form that does not enforce them only moves the error to a round trip.

## TABLE OF CONTENTS

1. [FORM INVENTORY](#form-inventory)
2. [SHARED CONVENTIONS](#shared-conventions)
3. [LOGIN FORM](#login-form)
4. [REGISTRATION FORM](#registration-form)
5. [EDIT USER FORM](#edit-user-form)
6. [EDIT PASSWORD FORM](#edit-password-form)
7. [ADD TRIP FORM](#add-trip-form)
8. [ADD ENTRY FORM](#add-entry-form)
9. [BUDGET FORM](#budget-form)
10. [ADD EXPENSE FORM](#add-expense-form)
11. [CURRENCY CONVERTER FORM](#currency-converter-form)
12. [VAT CALCULATOR FORM](#vat-calculator-form)
13. [NOT FORMS](#not-forms)
14. [KNOWN GAPS](#known-gaps)

## 1. FORM INVENTORY

| # | Form | Component | Rendered by | Writes to | Status |
|---|---|---|---|---|---|
| 3 | Login | [LoginForm.js](../client/src/components/LoginForm.js) | [Login.js](../client/src/pages/Login.js) | `POST /auth/login` | Built |
| 4 | Registration | [RegistrationForm.js](../client/src/components/RegistrationForm.js) | [Register.js](../client/src/pages/Register.js) | `POST /auth/register` | Built |
| 5 | Edit user | [EditUserForm.js](../client/src/components/EditUserForm.js) | [Profile.js](../client/src/pages/Profile.js) | `PATCH /users/:id/editUser` | Built |
| 6 | Edit password | [EditPasswordForm.js](../client/src/components/EditPasswordForm.js) | [Profile.js](../client/src/pages/Profile.js) | `PATCH /users/:id/editPassword` | Built |
| 7 | Add trip | [AddTripForm.js](../client/src/components/AddTripForm.js) | [Journal.js](../client/src/pages/Journal.js) | `POST /trip/addTrip` | Built |
| 8 | Add entry | [AddEntryForm.js](../client/src/components/AddEntryForm.js) | [Journal.js](../client/src/pages/Journal.js) | `POST /entry/addEntry` | Built |
| 9 | Budget | [BudgetForm.js](../client/src/components/BudgetForm.js) | — | `POST /expense/...` (does not exist) | Wireframe |
| 10 | Add expense | [AddExpenseForm.js](../client/src/components/AddExpenseForm.js) | [Expenses.js](../client/src/pages/Expenses.js) | `POST /expense/addExpense` | Built |
| 11 | Currency converter | [CurrencyConverter.js](../client/src/components/CurrencyConverter.js) | [Budget.js](../client/src/pages/Budget.js) | `GET /api/convert`, `POST /api/save` | Built, no endpoints |
| 12 | VAT calculator | [VatCalculator.js](../client/src/components/VatCalculator.js) | [Budget.js](../client/src/pages/Budget.js) | `POST /vat/calculate`, `POST /vat/save` | Built |

Eight of the ten forms are built and post to a route that exists. Two do not: the budget form is markup only and has nothing to submit to, and the currency converter is finished but calls a router that is never mounted.

The chain a trip sits at the top of is now writable end to end — a trip can be created, an entry filed against it, and, once its budget exists, an expense recorded against that. The missing link is the budget itself, which is why the add expense form's trip select is filled from the user's budgets rather than from their trips.

Of the endpoints above, `/auth`, `/users`, `/vat`, `/trip`, `/entry` and `/expense` are mounted — see [app.js:64](../server/app.js#L64). `/api` is not. Nothing here edits or deletes: every route file is create and read only so far. The rest is covered in [KNOWN GAPS](#known-gaps).

## 2. SHARED CONVENTIONS

These hold for every form below, so they are not repeated in each section.

**Markup and styling**

- Each form is a single `<form>` with an `id` in the pattern `<name>-form`, and a heading block of `#formHeadingBlock` wrapping `#formHeading`.
- Shared form styling is in [FormSetup.css](../client/src/css/componentCss/FormSetup.css), imported alongside the form's own stylesheet. See section 1.4 of [STYLES.md](../client/src/css/STYLES.md).
- An input and its required marker sit in a `.input-div`. The marker is a red lucide `Asterisk`, and the legend below the fields explains it once.
- Layout is Bootstrap `Stack`, `Row` and `Col`. Fields are grouped into numbered stacks so a group can be moved without touching the inputs.
- Error text uses `.formErrorMessage` with a lucide `Bug` icon, help text uses `.infoText`, and a message that only assistive technology needs is `.visually-hidden`.

**State ownership**

The four create forms — trip, entry, expense, and the budget form once it is written — follow one arrangement, so a change to any of them reads the same way:

- The page owns the form state, the request, the `submitting` flag and the `fieldErrors` the server returned. The component owns the validation, the `touched` state, the messages and the focus.
- The page passes its own empty shape in as `emptyForm`, so the clear button resets to exactly what the page initialised with rather than to a second copy that can drift. The component keeps a `BLANK_*` default for the case where the prop is not supplied.
- The owner is never a field. Each of these forms shows the username as a read-only input, because the API takes `userId` from the JWT and reads the username off the account; the input is there to confirm who the record is being logged for, not to be submitted.
- A select that is filled from the database — the entry form's trips, the expense form's budgets — is loaded by the page on mount. Until it has loaded there is nothing to choose, so the select is disabled and reports itself through `aria-busy`, and when the list comes back empty the form says so on screen and blocks submit, which a `required` attribute on an empty select cannot do.

**Validation**

Validation is split three ways, and each rule belongs to exactly one of them:

| Layer | Handles | Example |
|---|---|---|
| Native HTML | `required`, `minLength`, `maxLength`, `type`, `min`, `max`, `step` | An empty username blocks submit before any handler runs |
| Component | Rules the browser cannot express: comparing two fields, age from a date, a stricter format than `type` accepts, an unchanged edit form | Passwords matching; a trip's end date falling before its start date |
| Server | Rules that need the database or the schema enums | A username already taken; a trip that has no budget to add an expense to |

- Field messages are revealed on `onBlur` through a `touched` state object, so an untouched empty form is not announced as being in error.
- The submit handler calls `markAllTouched()`, then checks the component-level rules in order and focuses the first field that fails.
- A rule the browser already covers is announced with `.visually-hidden` text; a rule it cannot cover is shown on screen as well.
- The server checks the same rules again before it builds a document: each route has a `parse*Input` helper that normalises the body and returns the first problem as one plain 400 message, so a submission sent straight to the API is refused the same way the form would have refused it.

**Submission**

- A `submitting` prop, owned by the page, disables the submit and clear buttons and drives `aria-busy`, so the form cannot double post.
- Server field errors arrive keyed by schema path (`address.province`, `date.endDate`) as `fieldErrors`, are rendered in one block, and mark the matching input `aria-invalid`. They come from the `errors` object a route builds out of a Mongoose `ValidationError`.
- A `describedBy(...ids)` helper joins only the IDs currently rendered into one `aria-describedby`. The separator must be a space, or the reference resolves to nothing.
- A form sending `PATCH` carries no `method` attribute: a `<form>` element only accepts `GET` or `POST`, and the request is sent by `fetch` rather than by the browser.
- Every form has a clear or reset button, guarded by `window.confirm`. Create forms clear to the empty shape; edit forms reset to the saved record.

## 3. LOGIN FORM

[LoginForm.js](../client/src/components/LoginForm.js) → `POST /auth/login` ([authRoutes.js:60](../server/routes/authRoutes.js#L60)).

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `username` | `text` | Yes | — | `autoComplete='username'` |
| `password` | `password` / `text` | Yes | — | `autoComplete='current-password'`, so a password manager offers the saved password rather than treating the field as new |

- No length or format rules. The API answers a wrong username and a wrong password with the same 401, and a client-side rule would leak which of the two was wrong.
- The show/hide toggle flips `type` and reports state with `aria-pressed`, pointing at the input with `aria-controls`. `aria-expanded` is not used: it toggles the visibility of a value, not a region.
- On success [Login.js](../client/src/pages/Login.js) stores the token, sets `currentUser` from `user`, and clears the password out of React state.

## 4. REGISTRATION FORM

[RegistrationForm.js](../client/src/components/RegistrationForm.js) → `POST /auth/register` ([authRoutes.js:92](../server/routes/authRoutes.js#L92)). The empty shape is `EMPTY_FORM` in [Register.js](../client/src/pages/Register.js), mirrored as `BLANK_FORM` in the component for the clear button.

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `username` | `text` | Yes | 3–50 chars | Unique; a clash comes back as a 409 |
| `fullName.firstName` | `text` | Yes | 2–50 chars | |
| `fullName.lastName` | `text` | Yes | 2–50 chars | |
| `email` | `email` | Yes | max 254, regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` | Unique. `type='email'` accepts a dotless domain, so the pattern is checked in the component too |
| `dateOfBirth` | `date` | Yes | `max` = today | Age checked in the component: 18, or 21 when `admin` is ticked |
| `address.line1` | `textarea` | Yes | 2–100 chars | |
| `address.line2` | `textarea` | No | max 100 chars | Optional; a single character is rejected by the schema |
| `address.city` | `text` | Yes | 2–50 chars | |
| `address.province` | `select` | Yes | enum, from [locations.js](../client/src/data/locations.js) | Options mapped from `provinces` with `SELECT` as the placeholder |
| `admin` | `checkbox` | No | — | Raises the minimum age to 21 |
| `profilePicture` | `url` | No | — | Optional, full URL |
| `password` | `password` | Yes | 8–1024 chars | `autoComplete='new-password'` |
| `confirmPassword` | `password` | Yes | 8–1024 chars | Compared untrimmed, because the password is sent exactly as typed |

- Three rules are enforced in the component because the browser cannot: the age, the stricter email pattern, and the two passwords matching. Each sets a form-level error and focuses its own field.
- Nested paths are written on the `name` attribute (`fullName.firstName`, `address.city`), so one change handler updates either level of state.
- One show/hide button controls both password fields, listing both IDs in `aria-controls`.

## 5. EDIT USER FORM

[EditUserForm.js](../client/src/components/EditUserForm.js) → `PATCH /users/:id/editUser` ([userRoutes.js:147](../server/routes/userRoutes.js#L147)). The form opens filled in from the saved account, so the user only changes the field they came to change.

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `username` | `text` | No | 3–50 chars | Unique; a clash is a 409 |
| `fullName.firstName` | `text` | No | 2–50 chars | |
| `fullName.lastName` | `text` | No | 2–50 chars | |
| `email` | `email` | No | max 254, same regex as registration | Unique |
| `profilePicture` | `url` | No | max 2048 | Limited to `http:`/`https:` in the component, because `type='url'` also accepts `mailto:` and `javascript:`. Blank removes the picture |
| `address.line1` | `textarea` | No | 2–100 chars | |
| `address.line2` | `textarea` | No | max 100 chars | Optional, but one character is an error |
| `address.city` | `text` | No | 2–50 chars | |
| `address.province` | `select` | No | enum | Checked against `provinceNames`, reachable only if the select is edited by hand |

- No field carries `required`: this is a partial update, and blank fields are reported by the server through `fieldErrors`.
- The route reads only these five top-level keys, so `admin`, `password` and `entries` in the body cannot escalate the account or overwrite the hash.
- `savedValues` and `currentValues` are compared to block a submit that changes nothing, which would otherwise report a success the user cannot see.
- Reset restores the saved account rather than emptying the form.

## 6. EDIT PASSWORD FORM

[EditPasswordForm.js](../client/src/components/EditPasswordForm.js) → `PATCH /users/:id/editPassword` ([userRoutes.js:63](../server/routes/userRoutes.js#L63)). One of the two forms that hold their own state and send their own request rather than taking them from a page; the VAT calculator is the other.

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `currentPassword` | `password` | Yes | — | Verified against the stored hash by the route |
| `newPassword` | `password` | Yes | min 8 chars, at least one special character | `isStrongPassword` regex |
| `confirmNewPassword` | `password` | Yes | Must equal `newPassword` | Never sent; it exists only to catch a typo |

- Both component rules return before `setLoading`, so a validation failure does not leave the button disabled.
- The user id comes from `currentUser.userId`: the API shapes a user with `toPublicJSON`, so `currentUser.id` is always undefined.
- Each field has its own show/hide toggle, and the three fields are cleared on success.

## 7. ADD TRIP FORM

**Built.** [AddTripForm.js](../client/src/components/AddTripForm.js) → `POST /trip/addTrip` ([tripRoutes.js:180](../server/routes/tripRoutes.js#L180)), rendered by [Journal.js](../client/src/pages/Journal.js) behind the *Add Trip* toggle. The empty shape is `EMPTY_TRIP` in Journal.js, mirrored as `BLANK_TRIP` in the component. Against the `Trip` schema (section 4 of [SCHEMAS.md](SCHEMAS.md)).

A trip is the parent of every entry and every budget, so this is the form the rest of the chain waits on: nothing else can be filed until one exists.

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `username` | read-only `text` | — | — | Shows who the trip is being logged for. Not submitted: the route reads the username off the account |
| `title` | `text` | Yes | max 100 chars | |
| `purpose` | `select` | Yes | enum: `Holiday`, `Business` | The value submitted is the schema's spelling, the label is shown in upper case. A VAT claim can only be raised against a business trip |
| `destination.destinationType` | `select` | Yes | enum: `Domestic`, `International` | Changing it also clears the country, so one typed for an international trip is not sent with a domestic one |
| `destination.tripLocation` | `text` | Yes | max 50 chars | City, town or region |
| `destination.country` | `text` | Conditional | max 50 chars | Rendered, and required, only while the type is `International`. Journal.js sends `undefined` for a domestic trip, and the route leaves the field unset as well |
| `date.startDate` | `date` | Yes | — | |
| `date.endDate` | `date` | Yes | On or after `startDate` | `min` is set from `startDate`, the pair is compared in the component, and the schema's own validator checks it again |
| `status` | `select` | Yes | enum: `upcoming`, `ongoing`, `completed` | Required by the form, though the route defaults a missing status to `upcoming`. Decides which list the trip appears in |

- Two rules are checked in the component. The country, because the input is conditionally rendered and its `required` attribute is not on the page when the field was left behind by a change of type; and the date order, which the browser cannot compare. Each sets a form-level error and focuses its own field.
- `userId`, `username` and `entryCount` are not submitted. The first two are taken from the token and the account, and the third is maintained by the `Entry` hooks.
- On success the page clears the form, closes the panel and refetches the trips, so a trip created here is already in the add entry form's select without a reload.
- Still to build: an edit form over the same fields, since `status` moves from `upcoming` to `completed` over a trip's life. There is no `PATCH` route for a trip yet.

## 8. ADD ENTRY FORM

**Built.** [AddEntryForm.js](../client/src/components/AddEntryForm.js) → `POST /entry/addEntry` ([entryRoutes.js:119](../server/routes/entryRoutes.js#L119)), rendered by [Journal.js](../client/src/pages/Journal.js) behind the *Add Entry* toggle. The empty shape is `EMPTY_ENTRY` in Journal.js, mirrored as `BLANK_ENTRY` in the component. Against the `Entry` schema (section 5 of [SCHEMAS.md](SCHEMAS.md)).

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `username` | read-only `text` | — | — | Shows who the entry is being logged for. Not submitted |
| `tripId` | `select` | Yes | An existing trip of this user | Filled from `GET /trip/fetchTrips` ([tripRoutes.js:145](../server/routes/tripRoutes.js#L145)), loaded on mount. Only the id is sent: the route loads that trip, checks it belongs to the caller, and reads the denormalised `trip` title off the document |
| `title` | `text` | Yes | max 150 chars | |
| `body` | `textarea` | Yes | max 2000 chars | Plain text for now. The rich text editor is deferred, so there is no HTML to sanitise yet — see [SECURITY.md](SECURITY.md) |
| `date` | `date` | Yes | — | The date the entry describes, not the date it was written. Opens empty; it is not defaulted to today |

- An entry has to belong to a trip, so an account with none has nothing to file against. The select shows `NO TRIPS YET`, the form says so on screen, and submit is disabled — `submitting || loadingTrips || noTrips` — because a `required` attribute on a select with no options has nothing to catch.
- Every empty-field rule is repeated in the submit handler as well as being left to the browser, so a submission that gets past native validation is still reported on screen with the failing field focused.
- `photos` is commented out on the schema pending Cloudinary uploads. When it is enabled the form gains a file input, a caption per photo (max 200 chars) and a cap of 20.
- Still to build: an edit form, and `GET /entry/fetchEntries` so the journal can list what has been written.

## 9. BUDGET FORM

**Wireframe, not rendered.** [BudgetForm.js](../client/src/components/BudgetForm.js) is the markup, the ids and the layout only. Every input is uncontrolled — `defaultValue`, no `onChange` — submit is swallowed so the page cannot navigate, and no page imports the component. Against the `Budget` schema (section 6 of [SCHEMAS.md](SCHEMAS.md)).

There is nothing to submit to either: [expenseRoutes.js](../server/routes/expenseRoutes.js) has `/fetchBudgets` and `/addExpense` and no route that creates or edits a budget. This is the one break in the chain — a trip can be created and written about, but its budget cannot be set from the UI, so the add expense form has nothing to offer in its trip select.

One budget per trip, so the same form does both jobs: `mode` is `create` for a trip that has none and `edit` for one that has. The only field that behaves differently is `tripId`, which is disabled in edit mode because it is unique on the schema and a budget cannot be moved.

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `tripId` | `select` | Yes | A trip without a budget | Unique on the schema, so an existing budget must open as an edit instead. In create mode the page passes only the trips that have no budget |
| `baseCurrency` | `select` | Yes | ISO 4217, defaults to `ZAR` | The currency the budget and its totals are expressed in. Options and labels come from `FALLBACK_CURRENCIES` and `currencyOptionLabel` in [currencyFunc.js](../client/src/util/currencyFunc.js), the same as the converter's dropdowns |
| `totalBudget` | `number` | Yes | min 0, `step='0.01'` | |
| `dailyBudget` | `number` | No | min 0 | Left blank, the `pre('save')` hook divides the total by the trip's day count |
| `categoryLimits.*` | 10 × `number` | No | min 0 | One per expense category; blank means no cap |
| `alerts.notifyAt80Percent` | `checkbox` | No | Defaults to true | |
| `alerts.notifyOnExceed` | `checkbox` | No | Defaults to true | |

The ten category keys are read from `EXPENSE_CATEGORIES` in [financeData.js](../client/src/data/financeData.js) — `accommodation`, `transport`, `food`, `activities`, `shopping`, `health`, `visas`, `insurance`, `communication` and `other`. The add expense form's category select and [expenseData.js](../server/serverData/expenseData.js) on the server are built from the same ten keys, so the list is written once rather than three times.

Still to add:

- the form state, owned by the page, and one change handler for the nested `categoryLimits` and `alerts` paths;
- the `touched` state, the field messages and the component-level rules;
- a page to render it on, and the create and edit routes it posts to.

## 10. ADD EXPENSE FORM

**Built.** [AddExpenseForm.js](../client/src/components/AddExpenseForm.js) → `POST /expense/addExpense` ([expenseRoutes.js:310](../server/routes/expenseRoutes.js#L310)), rendered by [Expenses.js](../client/src/pages/Expenses.js) (route `/exp`) behind its `#add-exp-panal` toggle. The empty shape is `EMPTY_EXPENSE` in Expenses.js, mirrored as `BLANK_EXPENSE` in the component. Against section 6.1 of [SCHEMAS.md](SCHEMAS.md).

An expense is embedded in the budget of its trip rather than stored on its own, so the form writes through the parent: the route finds that budget by the trip and the account on the token, pushes the expense onto it and saves it, which is what runs the subdocument's validation and moves the budget's totals.

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `username` | read-only `text` | — | — | Shows who the expense is being logged for. Not submitted |
| `tripId` | `select` | Yes | A trip that already has a budget | Filled from `GET /expense/fetchBudgets` ([expenseRoutes.js:246](../server/routes/expenseRoutes.js#L246)), which returns `{ tripId, tripTitle, baseCurrency, totalBudget }` per budget. Trips without one are not offered: there would be nowhere to put the expense |
| `title` | `text` | Yes | max 100 chars | What the money was spent on |
| `amount` | `number` | Yes | `min='0.01'`, `step='0.01'`, must be greater than 0 | The input's `min` only holds the spinner; a typed value is checked in the component and again by `parseExpenseInput` |
| `currency` | `select` | Yes | ISO 4217, defaults to `ZAR` | Labelled `CODE - Name` by `currencyOptionLabel`. The page passes `FALLBACK_CURRENCIES`; it does not call `GET /api/currencies`, which is unreachable anyway |
| `category` | `select` | Yes | enum, the ten `EXPENSE_CATEGORIES` keys | The stored key is also the key of the matching limit on the parent budget |
| `paymentMethod` | `select` | Yes | enum: `cash`, `credit_card`, `debit_card`, `crypto`, `other` | From `PAYMENT_METHODS`, pre-filled with `cash`. Required by the form, though the route defaults a missing value |
| `date` | `date` | Yes | `max` = today, defaults to today | When the money was spent. `todayInputValue()` in [dateFunctions.js](../client/src/util/dateFunctions.js) builds it from the local date parts, so an early-morning entry is not dated yesterday |
| `notes` | `textarea` | No | max 300 chars | |
| `isPaid` | `checkbox` | No | Defaults to true | Unticked records a committed but unsettled cost, such as an unpaid deposit. Sent as `Boolean(...)` so an unticked box arrives as `false` rather than being dropped and defaulting back to true |

- `convertedAmount` is not a form field. The route works it out with `resolveConvertedAmount`, applying a live rate into the budget's `baseCurrency`, and stores `null` in the two cases the schema documents: the expense is already in that currency, or no rate could be read. The form says so under the currency select when the two differ, rather than asking for the figure.
- With no budgets the select shows `NO BUDGETS YET`, the form says so on screen and submit is disabled — the same arrangement as the entry form's no-trips case.
- Two rules are checked in the component because the browser cannot be relied on for them: the amount being greater than zero, and the date not being in the future. Both are checked again on the server.
- A Mongoose `ValidationError` on an embedded expense is keyed by position, for example `expenses.3.amount`. The route strips the index before it answers, so `fieldErrors` arrives keyed by the plain field names the inputs are named by.
- Still to build: the edit and delete routes, `GET /expense/fetchExpenses`, and [ExpensesList.js](../client/src/components/ExpensesList.js), which both this page and [Budget.js](../client/src/pages/Budget.js) already render as a placeholder.

## 11. CURRENCY CONVERTER FORM

[CurrencyConverter.js](../client/src/components/CurrencyConverter.js), rendered by [Budget.js](../client/src/pages/Budget.js) behind the *Show Currency Converter* toggle. Built, but the endpoints it calls do not exist — see [KNOWN GAPS](#known-gaps).

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `amount` | `number` | Yes | `min='0.01'`, `step='0.01'` | |
| `from` | `select` | Yes | ISO 4217 | Labelled `CODE - Name` by `currencyOptionLabel` |
| `to` | `select` | Yes | ISO 4217 | Same options |

- The empty shape is `EMPTY_CONVERT_FORM` in [currencyFunc.js](../client/src/util/currencyFunc.js). Options come from `GET /api/currencies`, falling back to `FALLBACK_CURRENCIES`, so an unreachable provider leaves a curated list rather than an empty dropdown.
- `method='GET'`: converting is a read, and it saves nothing on its own.
- The save button appears only once a result is on screen, and is disabled while saving and after a success so the same conversion cannot be written twice. It posts the figures from the result rather than from the inputs, which may have moved on.
- The button's Bootstrap variant reports the outcome — `success` when saved, `danger` on failure — so its colour is not left neutral once disabled.

## 12. VAT CALCULATOR FORM

**Built.** [VatCalculator.js](../client/src/components/VatCalculator.js), rendered by [Budget.js](../client/src/pages/Budget.js) behind its `#vat-calculator-panal` toggle. It takes no props: like the edit password form it holds its own state and sends its own two requests. The arithmetic is done in [vatCalculations.js](../server/util/vatCalculations.js), never in the browser, so what is on screen is worked out by the same code a saved record is built from; against the `vat` schema (section 8 of [SCHEMAS.md](SCHEMAS.md)).

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `amount` | `number` | Yes | min 0, `step='0.01'` | The one amount the user types. `mode` says which of the three stored amounts it becomes |
| `mode` | pair of buttons | Yes | enum: `exclusive`, `inclusive` | `exclusive` adds VAT to a price before VAT; `inclusive` strips the VAT out of a price after VAT |
| `isZeroRated` | `checkbox` | No | Defaults to false | A zero-rated supply is taxable at nil, not untaxed. Ticking it lists the common zero-rated categories |

- `ratePercent`, `netAmount`, `vatAmount` and `grossAmount` are results, not inputs. The rate is `SARS_VAT_RATE` (15%), or 0 when zero-rated, and is stored with the record so a calculation saved at one rate still reproduces itself after the rate changes.
- The results panel and the save-to-history button follow the converter: save what is on screen, disable after a success, and report the outcome through the button variant.
- `mode` is a pair of buttons rather than a `select`, so both directions are readable at once. The chosen one is marked by more than colour — an active class and `aria-pressed` — and a hint under them says which price the amount will be read as.
- Changing any of the three inputs clears the result, so a figure on screen is never left to be read against inputs that have moved on.
- Only the three inputs are posted to `/vat/save`. The server recalculates from them, so the stored amounts cannot be edited on the way to the database.

## 13. NOT FORMS

Listed so they are not mistaken for missing forms.

| Component | What it is |
|---|---|
| [Calculator.js](../client/src/components/Calculator.js) | A general number calculator, built. It has a display and a keypad, not fields, and saves nothing: the expression is evaluated in the browser by `mathjs`. [ButtonGrid.js](../client/src/components/ButtonGrid.js) is its keypad |
| [ExpensesList.js](../client/src/components/ExpensesList.js) | The expenses panel, a placeholder returning one `div`, rendered by both [Expenses.js](../client/src/pages/Expenses.js) and [Budget.js](../client/src/pages/Budget.js). A read-only table, though a delete control on each row would need a route that does not exist yet |
| [ConversionsList.js](../client/src/components/ConversionsList.js) | The saved-conversions panel, a placeholder returning one `div`. A read-only table, though a delete control on each row would post to `DELETE /api/history/:id` |
| [VatCalculationsList.js](../client/src/components/VatCalculationsList.js) | The saved VAT calculations panel, a placeholder returning one `div`. Its two requests are built and passed in from [Budget.js](../client/src/pages/Budget.js) as `fetchVatCalculations` and `deleteVatCalculation`; only the table itself is outstanding. Formatting helpers for the rows are already in [vatFunctions.js](../client/src/util/vatFunctions.js) |
| [Users.js](../client/src/pages/Users.js) | The admin page, a header and a footer. `GET /users/findUsers` takes no parameters, so a search or filter here would be client-side over the fetched list rather than a form submission |
| [TravelLog.js](../client/src/pages/TravelLog.js) | A header and a footer. It was to have carried the trip form, which now lives on [Journal.js](../client/src/pages/Journal.js) alongside the entry form; what this page shows instead has not been decided |

## 14. KNOWN GAPS

Where the forms above do not line up with the API. Recorded so the tables can be read as the intended shape.

| Where | Issue |
|---|---|
| [app.js:64](../server/app.js#L64) | `/api` is the one router that is never mounted, so every path the currency converter calls returns the 404 fallback |
| [apiRoutes.js](../server/routes/apiRoutes.js) | Written but not mounted, and it references an undefined `CurrencyConvert` where the import is named `Conversion`, and uses `mongoose` without importing it. The four endpoints the converter calls — `GET /api/currencies`, `GET /api/convert`, `GET /api/history`, `POST /api/save` — are therefore unreachable, so the built form cannot convert or save |
| [expenseRoutes.js](../server/routes/expenseRoutes.js) | Only `/fetchBudgets` and `/addExpense` are written. No route creates or edits a budget, which is why section 9 is a wireframe with nowhere to post; `/fetchExpenses`, `/updateExpense/:id` and `/delete/:id` are stubs, so nothing can list, edit or remove an expense once it is added |
| [tripRoutes.js](../server/routes/tripRoutes.js), [entryRoutes.js](../server/routes/entryRoutes.js) | Create and read only. Trips have `/fetchTrips` and `/addTrip`; entries have `/addEntry` and nothing else, so the journal cannot list what has been written, and neither a trip nor an entry can be edited or deleted from the UI |
| [BudgetForm.js](../client/src/components/BudgetForm.js) | Not imported by any page. Even once the routes exist it needs a page to be rendered on — the natural home is a budget panel on [Budget.js](../client/src/pages/Budget.js) or [Expenses.js](../client/src/pages/Expenses.js) |
| Every page | `http://localhost:3001` is written into each `fetch` call — [Journal.js:112](../client/src/pages/Journal.js#L112), [Expenses.js:95](../client/src/pages/Expenses.js#L95), [Budget.js:60](../client/src/pages/Budget.js#L60), [Profile.js](../client/src/pages/Profile.js), [Login.js](../client/src/pages/Login.js), [Register.js](../client/src/pages/Register.js), [EditPasswordForm.js](../client/src/components/EditPasswordForm.js) and [VatCalculator.js](../client/src/components/VatCalculator.js). `client/src/api/config.js`, which held `API_BASE_URL` and `ENDPOINTS`, has since been deleted, so there is no central declaration left at all: a deployed API would mean changing every call |
| [Expenses.js:69](../client/src/pages/Expenses.js#L69) | `currencyOptions` is initialised from `FALLBACK_CURRENCIES` and never refetched, so the add expense form always offers the offline snapshot. Harmless while `/api/currencies` is unreachable, but it is a `useState` with no setter rather than a deliberate fallback |
| [EditPasswordForm.js:39](../client/src/components/EditPasswordForm.js#L39) | Reports failures with `window.alert` and has no `aria-invalid`, no field-level messages and no `touched` state, unlike every other built form |
| [Journal.js:201](../client/src/pages/Journal.js#L201), [Expenses.js:186](../client/src/pages/Expenses.js#L186) | Success is reported with `window.alert` for the same reason the pattern persists elsewhere — there is no shared toast or status region yet |
| [currencyFunc.js:14](../client/src/util/currencyFunc.js#L14), [currencyFunc.js:56](../client/src/util/currencyFunc.js#L56) | Both refer to a `CurrencyConvertForm.js` that does not exist. The converter's form and its result panel are one component |
