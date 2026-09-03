# SCHEMAS/MODELS

Every collection in the application is defined by a Mongoose schema in [server/models/](../server/models/). This document is the reference for those schemas: the fields each one holds, the validation applied to them, and the virtuals, methods, middleware and indexes attached to them.

## TABLE OF CONTENTS

1. [REGISTERED MODELS](#registered-models)
2. [CONVENTIONS](#conventions)
3. [USER](#user)
4. [TRIP](#trip)
5. [ENTRY](#entry)
6. [BUDGET](#budget)
  - [6.1.EXPENSE](#expense)
7. [CURRENCY CONVERSION](#currency-conversion)
8. [VAT (VALUE ADDED TAX) SCHEMA](#vat-value-added-tax-schema)
9. [RELATIONSHIPS](#relationships)
10. [KNOWN DISCREPANCIES](#known-discrepancies)

## 1. REGISTERED MODELS

| Model name | Collection | File | Purpose |
|---|---|---|---|
| `User` | `users` | [userSchema.js](../server/models/userSchema.js) | Accounts, credentials and role |
| `Trip` | `trips` | [tripSchema.js](../server/models/tripSchema.js) | A single journey belonging to a user |
| `Entry` | `entries` | [entrySchema.js](../server/models/entrySchema.js) | Journal entries written against a trip |
| `Budget` | `budgets` | [budgetSchema.js](../server/models/budgetSchema.js) | One budget per trip, with expenses embedded |
| `currency` | `currencies` | [currConverterSchema.js](../server/models/currConverterSchema.js) | Saved currency conversions |
| `vat` | `vats` | [vatSchema.js](../server/models/vatSchema.js) | Saved VAT calculations |

## 2. CONVENTIONS

These apply to every schema below, so they are not repeated in each table.

- **`_id`** is created by MongoDB when the document is inserted, and is the primary key. Embedded subdocuments get one too.
- **`createdAt` / `updatedAt`** are added by `{ timestamps: true }`, which is set on all six schemas. Mongoose maintains them; application code never writes them.
- **Required** is `Auto` where MongoDB or Mongoose supplies the value, `Yes` where a write fails without it, and `No` where the field is optional.
- **`select: false`** keeps a field out of query results unless it is explicitly asked for with `.select('+field')`.
- **Currency codes** are ISO 4217 three-letter codes, validated against `apiCurrencies` in [currencies.js](../server/serverData/currencies.js) — an offline snapshot of the 165 codes Frankfurter supports, used only when the live provider is unreachable.
- **Money** is stored as `Number`, never as a string, and every amount field carries `min: 0`.

## 3. USER

Defined in [userSchema.js](../server/models/userSchema.js).

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `_id`| ObjectId | Auto | - | Primary Key | Created by mongoDB when added to database |
|`username`|String| Yes | - | unique, trim, 3-50 characters |Two accounts/userProfiles may never share a username, it identifies the user at login|
| `fullName.firstName` | String | Yes | — | trim, 2–50 chars | Nested object |
| `fullName.lastName` | String | Yes | — | trim, 2–50 chars | Nested object |
| `email` | String | Yes | — | unique, trim, lowercase, regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` | Login identifier; any country allowed |
| `dateOfBirth` | Date | Yes | — | Must be a valid date in the past | All users must be 18 or older |
| `address.line1` | String | Yes | — | trim, 2–100 chars | Street (nested object)|
| `address.line2` | String | No | — | trim, 2–100 chars | Complex/building/floor (nested object). An empty string from the form is normalised to `undefined` by a setter, so the length rules only apply once something has been typed |
| `address.city` | String | Yes | — | trim, 2–50 chars | City or town (nested object) |
| `address.province` | String | Yes | — | trim, 2–50 chars, enum: `provinceNames` | See [locations.js](../server/serverData/locations.js). `provinces` is a list of `{ code, name }` objects, so the enum is built from the names alone |
| `password` | String | Yes | — | 8–1024 chars, trim, `select: false` | Hashed in registration middleware and editPassword middleware (not used during dev). Length is checked against the plain text, because validation runs before the hashing hook |
|`confirmPassword`|String| Yes| - | `select: false` |Must match password. Never stored — the `pre('save')` hook clears it once validation has passed, so it exists only for the length of the request|
| `admin` | Boolean | No | `false` | users can only register as admin on registration | Role-based access control (RBAC) — optional; admin users must be 21 years or older |
| `profilePicture` | String | No | `null` | An empty string is stored as `null` by a setter | Optional, Cloudinary URL |
| `entries` | [ObjectId] (ref: `Entry`) | No | `[]` | — |References to the user's journal entries|
| `createdAt` | Date | Auto | — | `timestamps: true` | Registration date |
| `updatedAt` | Date | Auto | — | `timestamps: true` | Last profile change |

**Virtuals**

| Virtual | Returns | Notes |
|---|---|---|
| `fullNameString` | String | `firstName lastName`, trimmed. Guarded, because a user loaded with a field projection (such as the login lookup) may not have the nested `fullName` object at all |
| `userAddress` | String | The four address parts joined with `, `, empty parts dropped |

**Methods**

| Method | Returns | Notes |
|---|---|---|
| `comparePassword(candidate)` | `Promise<Boolean>` | bcrypt comparison against the stored hash. The document must have been loaded with `.select('+password')`, otherwise there is nothing to compare against and it resolves `false` |
| `toPublicJSON()` | Object | The single shape a user takes in an API response. Defined here rather than in each route so login, registration and the current-user endpoint all hand the React app the same object, and a new field only has to be added in one place |

**Middleware**

| Hook | Purpose |
|---|---|
| `pre('validate')` | Enforces the minimum age, which depends on the `admin` flag and so cannot be checked by a single field validator. `MIN_AGE` is `{ user: 18, admin: 21 }`, and the age is worked out in whole years so a birthday that has not yet occurred this year counts correctly. Running before validation means the error joins any other field errors in the same `ValidationError` |
| `pre('save')` | Clears `confirmPassword`, then hashes `password` with bcrypt at `SALT_ROUNDS = 12`. Guarded by `isModified('password')` so saving a user for any other reason — pushing a new journal entry, for example — does not hash the stored hash a second time |

Both hooks are written without a `next` callback: Mongoose 9 supports only the promise form for document middleware. A hook signals completion by returning and failure by throwing.

**Serialisation**

`select: false` keeps the password out of query results, but a document that was just created still holds it in memory. The `toJSON` transform is the second line of defence: it deletes `password` and `confirmPassword` whenever a user is serialised into a response, so a route cannot leak them by returning the document directly.

## 4. TRIP

Defined in [tripSchema.js](../server/models/tripSchema.js).

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `_id`| ObjectId | Auto | - | Primary Key | Created by mongoDB when added to database |
| `userId` | ObjectId (ref: `User`) | Yes | — | — | The owner of the trip |
| `username` | String | Yes | — | — | Denormalised copy of the owner's username, so a trip can be listed without a populate |
| `title` | String | Yes | — | trim, max 100 chars | What the user calls the trip |
| `purpose` | String | Yes | — | trim, enum: `Holiday`, `Business` | Business trips are the ones a VAT claim can be raised against |
| `destination.destinationType` | String | Yes | — | enum: `Domestic`, `International` | Nested object |
| `destination.destination` | String | Yes | — | trim, max 50 chars | City, town or region (nested object) |
| `destination.country` | String | No | — | trim | Intended for international trips. Not conditionally required by the schema — the form asks for it when `destinationType` is `International` |
| `date.startDate` | Date | Yes | — | — | Nested object |
| `date.endDate` | Date | Yes | — | Must be on or after `date.startDate` | Validator message: *End date must be after start date* |
| `status` | String | No | `upcoming` | enum: `upcoming`, `ongoing`, `completed` | Drives which list the trip appears in |
| `entryCount` | Number | No | `0` | min 0 | Maintained by the `Entry` post-save and post-delete hooks, not written directly |
| `createdAt` | Date | Auto | — | `timestamps: true` | |
| `updatedAt` | Date | Auto | — | `timestamps: true` | |

**Indexes**

| Index | Supports |
|---|---|
| `{ userId: 1, 'date.startDate': -1 }` | A user's trips listed newest first |
| `{ userId: 1, status: 1 }` | Filtering a user's trips by status |

`toJSON` and `toObject` are both set to include virtuals.

## 5. ENTRY

Defined in [entrySchema.js](../server/models/entrySchema.js).

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `_id`| ObjectId | Auto | - | Primary Key | Created by mongoDB when added to database |
| `trip` | String | Yes | — | — | Denormalised trip title, so an entry reads correctly without populating the trip |
| `tripId` | ObjectId (ref: `Trip`) | Yes | — | — | The trip the entry belongs to |
| `userId` | ObjectId (ref: `User`) | Yes | — | — | The author |
| `username` | String | Yes | — | — | Denormalised copy of the author's username |
| `title` | String | Yes | — | trim, max 150 chars | |
| `body` | String | Yes | — | max 2000 chars | Rich text HTML produced by the editor (TipTap/Quill). Must be sanitised before it is rendered — see [SECURITY.md](SECURITY.md) |
| `date` | Date | Yes | `Date.now` | — | The date the entry describes, which need not be the date it was written |
| `createdAt` | Date | Auto | — | `timestamps: true` | |
| `updatedAt` | Date | Auto | — | `timestamps: true` | |

**Planned fields**

`photos` is written but commented out, along with its `photoSchema` subdocument (`url`, `publicId`, `caption` — max 200 chars — and a validator capping an entry at 20 photos). It is left in place as the shape photo support will take once Cloudinary uploads are wired up for entries.

**Indexes**

| Index | Supports |
|---|---|
| `{ title: 'text', body: 'text', tags: 'text' }` | Full-text search across an entry |
| `{ tripId: 1, date: -1 }` | A trip's entries in reverse date order |

**Middleware**

| Hook | Purpose |
|---|---|
| `post('save')` | `$inc` the parent trip's `entryCount` by 1 |
| `post('findOneAndDelete')` | `$inc` the parent trip's `entryCount` by −1, guarded on a document actually having been deleted |

Because the counter is kept by `findOneAndDelete` rather than `deleteOne`/`deleteMany`, entries must be removed through `findOneAndDelete` for `entryCount` to stay correct.

## 6. BUDGET

Defined in [budgetSchema.js](../server/models/budgetSchema.js). One budget document per trip, with the trip's expenses embedded in it.

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `_id`| ObjectId | Auto | - | Primary Key | Created by mongoDB when added to database |
| `tripId` | ObjectId (ref: `Trip`) | Yes | — | unique | One budget document per trip |
| `userId` | ObjectId (ref: `User`) | Yes | — | — | The owner |
| `baseCurrency` | String | Yes | `ZAR` | uppercase, max 3 chars | The currency the budget and its totals are expressed in |
| `totalBudget` | Number | Yes | — | min 0 (*cannot be negative*) | The whole allowance for the trip |
| `dailyBudget` | Number | No | `null` | min 0 | Optional — auto-calculated from the trip's dates on save if it is not set |
| `expenses` | [`expenseSchema`] | No | `[]` | — | Embedded rather than referenced: expenses are only ever read through their budget |
| `categoryLimits.accommodation` | Number | No | `null` | — | Per-category spending cap; `null` means no cap |
| `categoryLimits.transport` | Number | No | `null` | — | |
| `categoryLimits.food` | Number | No | `null` | — | |
| `categoryLimits.activities` | Number | No | `null` | — | |
| `categoryLimits.shopping` | Number | No | `null` | — | |
| `categoryLimits.health` | Number | No | `null` | — | |
| `categoryLimits.visas` | Number | No | `null` | — | |
| `categoryLimits.insurance` | Number | No | `null` | — | |
| `categoryLimits.communication` | Number | No | `null` | — | |
| `categoryLimits.other` | Number | No | `null` | — | |
| `alerts.notifyAt80Percent` | Boolean | No | `true` | — | Warn once 80% of the budget has been spent |
| `alerts.notifyOnExceed` | Boolean | No | `true` | — | Warn once the budget has been exceeded |
| `createdAt` | Date | Auto | — | `timestamps: true` | |
| `updatedAt` | Date | Auto | — | `timestamps: true` | |

**Virtuals**

| Virtual | Returns | Notes |
|---|---|---|
| `totalSpent` | Number | Sum of every expense, using `convertedAmount` where one exists and falling back to `amount` |
| `remaining` | Number | `totalBudget − totalSpent`. Negative once the budget has been exceeded |
| `percentUsed` | String | `totalSpent / totalBudget × 100`, fixed to 2 decimals. Returned as a string by `toFixed` |
| `spendingByCategory` | Object | Category name → amount spent, built from the embedded expenses |

**Indexes**

| Index | Supports |
|---|---|
| `{ tripId: 1 }` | Loading a trip's budget |
| `{ userId: 1, createdAt: -1 }` | A user's budgets, newest first |

**Middleware**

| Hook | Purpose |
|---|---|
| `pre('save')` | Where `dailyBudget` has not been set, loads the trip and divides `totalBudget` by the number of days between `date.startDate` and `date.endDate`, rounded to 2 decimals. The day count is floored at 1, so a same-day trip does not divide by zero |

### 6.1. EXPENSE

Embedded in budget Schema. Not registered as its own model, so it has no collection of its own and is always written through its parent `Budget`.

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `_id`| ObjectId | Auto | - | Primary Key | Created by mongoDB when added to database |
| `username` | String | Yes | — | — | Denormalised copy of the owner's username |
| `title` | String | Yes | — | trim, max 100 chars | What the money was spent on |
| `amount` | Number | Yes | — | min 0 (*cannot be negative*) | The amount as it was paid, in `currency` |
| `currency` | String | Yes | `ZAR` | uppercase, enum: `apiCurrencies`, regex `^[A-Z]{3}$`, max 3 chars | ISO 4217 code, e.g. `ZAR`, `EUR`, `GBP` |
| `convertedAmount` | Number | No | `null` | — | `amount` converted into the budget's `baseCurrency`. `null` where the expense is already in the base currency, or where no rate has been applied yet |
| `category` | String | Yes | — | enum: `accommodation`, `transport`, `food`, `activities`, `shopping`, `health`, `visas`, `insurance`, `communication`, `other` | Matches the keys of `categoryLimits` on the parent budget |
| `date` | Date | Yes | `Date.now` | — | When the money was spent |
| `notes` | String | No | `''` | max 300 chars | |
| `paymentMethod` | String | No | `cash` | enum: `cash`, `credit_card`, `debit_card`, `crypto`, `other` | |
| `isPaid` | Boolean | No | `true` | — | `false` records a committed but unsettled cost, such as an unpaid deposit |

## 7. CURRENCY CONVERSION

Defined in [currConverterSchema.js](../server/models/currConverterSchema.js). A saved record of a conversion the user ran, registered as the model `currency`.

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `_id`| ObjectId | Auto | - | Primary Key | Created by mongoDB when added to database |
| `userId` | ObjectId (ref: `user`) | Yes | — | indexed | The user the saved conversion belongs to |
| `currency.baseCurrency` | String | Yes | — | trim, uppercase, enum: `apiCurrencies`, regex `^[A-Z]{3}$` | The currency converted **from** (nested object) |
| `currency.targetCurrency` | String | Yes | — | trim, uppercase, enum: `apiCurrencies`, regex `^[A-Z]{3}$` | The currency converted **to** (nested object) |
| `amount` | Number | Yes | — | min 0 (*cannot be negative*) | The amount entered, in the base currency |
| `rate` | Number | Yes | — | min 0 (*cannot be negative*) | The exchange rate used, expressed as target per base. Stored rather than fetched again, so the record reproduces exactly what the user saw |
| `createdAt` | Date | Auto | — | `timestamps: true` | When the conversion was run |
| `updatedAt` | Date | Auto | — | `timestamps: true` | |

**Virtuals**

| Virtual | Returns | Notes |
|---|---|---|
| `convertedAmount` | Number | `amount × rate`. Derived rather than stored, so it can never disagree with the two values it comes from |

## 8. VAT (VALUE ADDED TAX) SCHEMA

Defined in [vatSchema.js](../server/models/vatSchema.js). A saved record of a VAT calculation, registered as the model `vat`. The arithmetic itself lives in [vatCalculations.js](../server/util/vatCalculations.js) — see [CALCULATORS.md](CALCULATORS.md).

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `_id`| ObjectId | Auto | - | Primary Key | Created by mongoDB when added to database |
| `user`| ObjectId (ref: `user`) | Yes | -| indexed |The user the saved calculation belongs to. Stored as a reference rather than relying on a name, so a history lookup cannot return another user's calculations when two users share a name|
|`username`| String | Yes | - |-|Denormalised copy of the owner's username|
|`mode`| String | Yes | - | enum: `VAT_MODES` (`exclusive`, `inclusive`) |Which direction the calculation ran in. `exclusive` means the amount entered was the price before VAT and VAT was added on top; `inclusive` means it was the price after VAT and the VAT in it was stripped back out. The three amounts below are the same either way — this is what says which of them the user typed|
|`isZeroRated`| Boolean | No | `false`| - |Whether the item was flagged as zero-rated (0%) rather than levied at the standard rate. A zero-rated supply is still a taxable supply, which is why it is recorded as a rate of nil rather than as no calculation at all|
|`ratePercent`| Number |Yes|-| min-0 max-100 |The rate the VAT was worked out at, as a percentage: the SARS standard rate, or 0 for a zero-rated item. Stored rather than derived, so a record saved at 14% or 15% still reproduces itself after the rate changes|
|`netAmount`| Number | Yes| - | min-0 (*cannot be negative*)| The amount excluding VAT |
|`vatAmount`| Number |Yes|-| min-0 (*cannot be negative*)|The VAT portion itself, nil on a zero-rated item|
|`grossAmount`| Number |Yes|-| min-0 (*cannot be negative*)|The amount including VAT|
| `createdAt` | Date | Auto | — | `timestamps: true` | When the calculation was saved |
| `updatedAt` | Date | Auto | — | `timestamps: true` | |

**Virtuals**

| Virtual | Returns | Notes |
|---|---|---|
| `enteredAmount` | Number | The amount the user actually typed: `netAmount` on an exclusive calculation, `grossAmount` on an inclusive one. Derived rather than stored, because `mode` already says which of the two it was and storing it again would be a fourth amount that could disagree with the other three |
| `effectiveRate` | Number | `vatAmount / netAmount × 100` — the rate the calculation actually worked out to, which reconciles against `ratePercent` and is what makes a stored record checkable. A nil net amount returns 0 rather than dividing by zero |

## 9. RELATIONSHIPS

```
User 1 ──── * Trip                  Trip.userId  → User._id
User 1 ──── * Entry                 Entry.userId → User._id
User * ──── * Entry                 User.entries → [Entry._id]   (the same link, held on both sides)
Trip 1 ──── * Entry                 Entry.tripId → Trip._id      (Trip.entryCount kept by Entry hooks)
Trip 1 ──── 1 Budget                Budget.tripId → Trip._id     (unique)
Budget 1 ── * Expense               embedded, no collection of its own
User 1 ──── * currency              currency.userId → User._id
User 1 ──── * vat                   vat.user → User._id
```

Deletes are not cascaded by the schemas. Removing a trip leaves its entries and budget behind, and removing a user leaves everything referencing it behind, so the routes that delete are responsible for clearing the dependents.

Several models keep a denormalised `username` alongside their `userId`. It saves a populate on the read paths that only need a name, at the cost of going stale if a user renames themselves — so a username change has to be written through to `Trip`, `Entry`, `Budget.expenses` and `vat` as well.

## 10. KNOWN DISCREPANCIES

Points where the code does not yet match what the schemas above describe. Recorded here so the tables can be read as the intended shape.

| Where | Issue |
|---|---|
| [currConverterSchema.js:53](../server/models/currConverterSchema.js#L53) | The `convertedAmount` virtual is declared on `currencyConvertSchema`, a name that is never defined — the schema variable is `converterSchema`. Requiring the module throws a `ReferenceError` |
| [currConverterSchema.js:10](../server/models/currConverterSchema.js#L10), [vatSchema.js:12](../server/models/vatSchema.js#L12) | Both use `ref: 'user'`, but the model is registered as `User`. Mongoose model names are case-sensitive, so `populate()` on these fields will not resolve |
| [entrySchema.js:79](../server/models/entrySchema.js#L79) | The text index covers `tags`, but the schema has no `tags` field |
| [userSchema.js:59](../server/models/userSchema.js#L59) | `fullName.lastName` has `trim: 'true'` — the string, not the boolean. It is truthy, so trimming still happens, but the type is wrong |
| [budgetSchema.js:96](../server/models/budgetSchema.js#L96) | `baseCurrency` caps length at 3 but, unlike `expenseSchema.currency`, does not validate against `apiCurrencies` or the `^[A-Z]{3}$` pattern |
