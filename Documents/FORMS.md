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
7. [TRIP FORM](#trip-form)
8. [ENTRY FORM](#entry-form)
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
| 7 | Trip | — | [TravelLog.js](../client/src/pages/TravelLog.js) | `POST /trips` (does not exist) | Not started |
| 8 | Entry | — | [Journal.js](../client/src/pages/Journal.js) | `POST /entries` (does not exist) | Not started |
| 9 | Budget | — | [Budget.js](../client/src/pages/Budget.js) | `POST /budgets` (does not exist) | Not started |
| 10 | Add expense | [AddExpenseForm.js](../client/src/components/AddExpenseForm.js) | [Budget.js](../client/src/pages/Budget.js) | `POST /budgets/:id/expenses` (does not exist) | Empty file |
| 11 | Currency converter | [CurrencyConverter.js](../client/src/components/CurrencyConverter.js) | [Budget.js](../client/src/pages/Budget.js) | `GET /api/convert`, `POST /api/save` | Built, no endpoints |
| 12 | VAT calculator | [VatCalculator.js](../client/src/components/VatCalculator.js) | [Budget.js](../client/src/pages/Budget.js) | `POST /vat/calculate`, `POST /vat/save` | Empty file |

Each of the four built forms edits a `User`. Nothing in the UI can yet create a trip, an entry, a budget or an expense, which is what the four unbuilt forms are for.

Of the endpoints above, only `/auth` and `/users` are mounted — see [app.js:60](../server/app.js#L60). The rest are covered in [KNOWN GAPS](#known-gaps).

## 2. SHARED CONVENTIONS

These hold for every form below, so they are not repeated in each section.

**Markup and styling**

- Each form is a single `<form>` with an `id` in the pattern `<name>-form`, and a heading block of `#formHeadingBlock` wrapping `#formHeading`.
- Shared form styling is in [FormSetup.css](../client/src/css/componentCss/FormSetup.css), imported alongside the form's own stylesheet. See section 1.4 of [STYLES.md](../client/src/css/STYLES.md).
- An input and its required marker sit in a `.input-div`. The marker is a red lucide `Asterisk`, and the legend below the fields explains it once.
- Layout is Bootstrap `Stack`, `Row` and `Col`. Fields are grouped into numbered stacks so a group can be moved without touching the inputs.
- Error text uses `.formErrorMessage` with a lucide `Bug` icon, help text uses `.infoText`, and a message that only assistive technology needs is `.visually-hidden`.

**Validation**

Validation is split three ways, and each rule belongs to exactly one of them:

| Layer | Handles | Example |
|---|---|---|
| Native HTML | `required`, `minLength`, `maxLength`, `type`, `min`, `max`, `step` | An empty username blocks submit before any handler runs |
| Component | Rules the browser cannot express: comparing two fields, age from a date, a stricter format than `type` accepts, an unchanged edit form | Passwords matching; the email pattern requiring a dot in the domain |
| Server | Rules that need the database or the schema enums | A username already taken; a province outside the enum |

- Field messages are revealed on `onBlur` through a `touched` state object, so an untouched empty form is not announced as being in error.
- The submit handler calls `markAllTouched()`, then checks the component-level rules in order and focuses the first field that fails.
- A rule the browser already covers is announced with `.visually-hidden` text; a rule it cannot cover is shown on screen as well.

**Submission**

- A `submitting` prop, owned by the page, disables the submit and clear buttons and drives `aria-busy`, so the form cannot double post.
- Server field errors arrive keyed by schema path (`address.province`, `fullName.firstName`) as `fieldErrors`, are rendered in one block, and mark the matching input `aria-invalid`.
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

[EditPasswordForm.js](../client/src/components/EditPasswordForm.js) → `PATCH /users/:id/editPassword` ([userRoutes.js:63](../server/routes/userRoutes.js#L63)). The only form that holds its own state and sends its own request rather than taking them from its page.

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `currentPassword` | `password` | Yes | — | Verified against the stored hash by the route |
| `newPassword` | `password` | Yes | min 8 chars, at least one special character | `isStrongPassword` regex |
| `confirmNewPassword` | `password` | Yes | Must equal `newPassword` | Never sent; it exists only to catch a typo |

- Both component rules return before `setLoading`, so a validation failure does not leave the button disabled.
- The user id comes from `currentUser.userId`: the API shapes a user with `toPublicJSON`, so `currentUser.id` is always undefined.
- Each field has its own show/hide toggle, and the three fields are cleared on success.

## 7. TRIP FORM

**Required, not started.** Nothing in the UI can create a trip, and a trip is the parent of every entry and every budget, so it blocks both. Belongs on [TravelLog.js](../client/src/pages/TravelLog.js) against the `Trip` schema (section 4 of [SCHEMAS.md](SCHEMAS.md)).

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `title` | `text` | Yes | max 100 chars | |
| `purpose` | `select` | Yes | enum: `Holiday`, `Business` | A VAT claim can only be raised against a business trip |
| `destination.destinationType` | `select` or radio | Yes | enum: `Domestic`, `International` | |
| `destination.destination` | `text` | Yes | max 50 chars | City, town or region |
| `destination.country` | `text` or `select` | Conditional | — | Asked for when `destinationType` is `International`. The schema does not require it, so the condition is the form's to enforce |
| `date.startDate` | `date` | Yes | — | |
| `date.endDate` | `date` | Yes | On or after `startDate` | Set `min` from `startDate`, and check the pair in the component |
| `status` | `select` | No | enum: `upcoming`, `ongoing`, `completed` | Defaults to `upcoming`; decides which list the trip appears in |

`userId`, `username` and `entryCount` are not form fields. The first two are taken from the session and the third is maintained by the `Entry` hooks.

An edit form over the same fields is needed as well, since `status` moves from `upcoming` to `completed` over a trip's life.

## 8. ENTRY FORM

**Required, not started.** [Journal.js](../client/src/pages/Journal.js) renders a header and a footer and nothing else. Against the `Entry` schema (section 5 of [SCHEMAS.md](SCHEMAS.md)).

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `tripId` | `select` | Yes | An existing trip of this user | Populated from the user's trips. The denormalised `trip` title is taken from the same choice |
| `title` | `text` | Yes | max 150 chars | |
| `body` | Rich text editor | Yes | max 2000 chars | TipTap or Quill. The output is HTML and must be sanitised before it is rendered — see [SECURITY.md](SECURITY.md) |
| `date` | `date` | Yes | Defaults to today | The date the entry describes, not the date it was written |

- The character limit applies to the editor's HTML output, so the counter has to measure what will be sent, not what is on screen.
- `photos` is commented out on the schema pending Cloudinary uploads. When it is enabled the form gains a file input, a caption per photo (max 200 chars) and a cap of 20.

## 9. BUDGET FORM

**Required, not started.** One budget per trip, so this form creates a budget where the selected trip has none and edits it thereafter. Against the `Budget` schema (section 6 of [SCHEMAS.md](SCHEMAS.md)).

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `tripId` | `select` | Yes | A trip without a budget | Unique on the schema, so an existing budget must open as an edit instead |
| `baseCurrency` | `select` | Yes | ISO 4217, defaults to `ZAR` | The currency the budget and its totals are expressed in |
| `totalBudget` | `number` | Yes | min 0, `step='0.01'` | |
| `dailyBudget` | `number` | No | min 0 | Left blank, the `pre('save')` hook divides the total by the trip's day count |
| `categoryLimits.*` | 10 × `number` | No | min 0 | One per expense category; blank means no cap |
| `alerts.notifyAt80Percent` | `checkbox` | No | Defaults to true | |
| `alerts.notifyOnExceed` | `checkbox` | No | Defaults to true | |

The ten category keys are `accommodation`, `transport`, `food`, `activities`, `shopping`, `health`, `visas`, `insurance`, `communication` and `other`. They match the `category` enum on an expense, so the two lists come from one shared constant rather than being typed twice.

## 10. ADD EXPENSE FORM

**Required, file is empty.** [AddExpenseForm.js](../client/src/components/AddExpenseForm.js) exists with no content, and [AddExpenseForm.css](../client/src/css/componentCss/AddExpenseForm.css) is already in place. An expense is embedded in its budget, so this form writes through the parent. Against section 6.1 of [SCHEMAS.md](SCHEMAS.md).

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `title` | `text` | Yes | max 100 chars | What the money was spent on |
| `amount` | `number` | Yes | min 0, `step='0.01'` | As paid, in `currency` |
| `currency` | `select` | Yes | ISO 4217, defaults to `ZAR` | Same options as the converter, from `GET /api/currencies` with the local fallback |
| `category` | `select` | Yes | enum, the ten keys above | Matches the parent's `categoryLimits` |
| `date` | `date` | Yes | Defaults to today | When the money was spent |
| `notes` | `textarea` | No | max 300 chars | |
| `paymentMethod` | `select` | No | enum: `cash`, `credit_card`, `debit_card`, `crypto`, `other` | Defaults to `cash` |
| `isPaid` | `checkbox` | No | Defaults to true | Unticked records a committed but unsettled cost, such as an unpaid deposit |

`convertedAmount` is not a form field. It is `amount` in the budget's `baseCurrency`, and is filled in from the conversion rate rather than typed.

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

**Required, file is empty.** [VatCalculator.js](../client/src/components/VatCalculator.js) has no content, and [Budget.js](../client/src/pages/Budget.js) already renders an empty `#vat-calculator-panal` behind its toggle. The arithmetic is done in [vatCalculations.js](../server/util/vatCalculations.js); against the `vat` schema (section 8 of [SCHEMAS.md](SCHEMAS.md)).

| Field | Control | Required | Constraints | Notes |
|---|---|---|---|---|
| `amount` | `number` | Yes | min 0, `step='0.01'` | The one amount the user types. `mode` says which of the three stored amounts it becomes |
| `mode` | radio or `select` | Yes | enum: `exclusive`, `inclusive` | `exclusive` adds VAT to a price before VAT; `inclusive` strips the VAT out of a price after VAT |
| `isZeroRated` | `checkbox` | No | Defaults to false | A zero-rated supply is taxable at nil, not untaxed |

- `ratePercent`, `netAmount`, `vatAmount` and `grossAmount` are results, not inputs. The rate is `SARS_VAT_RATE` (15%), or 0 when zero-rated, and is stored with the record so a calculation saved at one rate still reproduces itself after the rate changes.
- The results panel and the save-to-history button follow the converter: save what is on screen, disable after a success, and report the outcome through the button variant.

## 13. NOT FORMS

Listed so they are not mistaken for missing forms.

| Component | What it is |
|---|---|
| [Calculator.js](../client/src/components/Calculator.js) | A general number calculator, empty. It has a display and a keypad, not fields, and saves nothing. [ButtonGrid.js](../client/src/components/ButtonGrid.js) is its keypad, partly built |
| [ConversionsList.js](../client/src/components/ConversionsList.js) | The saved-conversions panel, a placeholder returning one `div`. A read-only table, though a delete control on each row would post to `DELETE /api/history/:id` |
| [Users.js](../client/src/pages/Users.js) | The admin page, a header and a footer. `GET /users/findUsers` takes no parameters, so a search or filter here would be client-side over the fetched list rather than a form submission |

## 14. KNOWN GAPS

Where the forms above do not line up with the API. Recorded so the tables can be read as the intended shape.

| Where | Issue |
|---|---|
| [app.js:60](../server/app.js#L60) | Only `/auth` and `/users` are mounted. Every other path in this document returns the 404 fallback |
| [calculatorRoutes.js](../server/routes/calculatorRoutes.js) | Empty. The four endpoints the converter calls — `GET /api/currencies`, `GET /api/convert`, `GET /api/history`, `POST /api/save` — have no implementation, so the built form cannot convert or save |
| [vatRoutes.js](../server/routes/vatRoutes.js) | Comments only, exporting nothing. Documents `POST /vat/calculate`, `POST /vat/save`, `GET /vat/history` and `DELETE /vat/history/:id` |
| [expenseRoutes.js](../server/routes/expenseRoutes.js) | Empty. No route creates a budget or an expense |
| — | No route file exists for trips or entries, so sections 7 and 8 have nothing to submit to |
| [Budget.js:32](../client/src/pages/Budget.js#L32) | The page fetches `http://localhost:3001` directly instead of using `API_BASE_URL` and `ENDPOINTS` from [config.js](../client/src/api/config.js), as do [Profile.js](../client/src/pages/Profile.js), [Login.js](../client/src/pages/Login.js), [Register.js](../client/src/pages/Register.js) and [EditPasswordForm.js](../client/src/components/EditPasswordForm.js). A deployed API would need every call changed rather than one variable |
| [config.js](../client/src/api/config.js) | `ENDPOINTS` covers only the six auth and user routes, so the converter, VAT, trip, entry and budget paths have nowhere central to be declared |
| [EditPasswordForm.js:39](../client/src/components/EditPasswordForm.js#L39) | Reports failures with `window.alert` and has no `aria-invalid`, no field-level messages and no `touched` state, unlike the other three built forms |
| [currencyFunc.js:8](../client/src/util/currencyFunc.js#L8), [currencyFunc.js:50](../client/src/util/currencyFunc.js#L50) | Both refer to a `CurrencyConvertForm.js` that does not exist. The converter's form and its result panel are one component |
