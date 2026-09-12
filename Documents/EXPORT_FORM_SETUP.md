# EXPORT FORMS SETUP

## TABLE OF CONTENTS

## 1. EXPORT ROUTES
**Base path:** `/export`. 

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/export/trips` | JWT | Export trips to `.csv` or `.xlsx` |
| `GET` | `/export/entries` | JWT |  Export journal entries to `.csv` or `.xlsx` |
| `GET` | `/export/expenses` | JWT | Export expenses to `.csv` or `.xlsx` |
| `GET` | `/export/budget` | JWT |Export trip budgets to `.csv` or `.xlsx` |
## 2. FILES

### 2.1. CLIENT-SIDE

| FILE | PURPOSE |
| -----|----|
|[ExportForm.js](../client/src/components/ExportForm.js) | Display a component used for all export functions/requests |
| [exportFunc.js](../client/src/util/exportFunc.js) | Displays client-side utility functions and arrays used for the form |

### 2.2. SERVER-SIDE

- [exportRoutes.js](../server/routes/exportRoutes.js) 

## 3. MIDDLEWARE

### 3.1. APPLICATION LEVEL MIDDLEWARE
### 3.2. THIRD PARTY MIDDLEWARE

## 4.