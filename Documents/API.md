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
2. [THIRD PARTY APIS](#2-third-party-apis)
3. [REFERENCES](#3-references)

- *View [GLOSSARY.md](../GLOSSARY.md) for terminology.*
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

All routes that require authentication expect a Bearer <token> value in the Authorization header except the /auth login and registration routes 

### 1.1. AUTH

**Base path:** `/auth` — *No JWT required*.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | None | Validates credentials; returns a JWT token | 
| `POST` | `/auth/register` | None | Creates a new user account; returns a JWT token |

### 1.2. USERS

Base path: `/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /users/me | JWT | Returns the currently authenticated user's profile|
| GET | /users/findUsers | JWT | Returns all users|
| PATCH | /users/editUser/:id |JWT| Updates profile fields for the authenticated user |
| PATCH | /users/editPassword | JWT | Updates user password |
| DELETE | /users/deleteUser/:id | JWT | Deletes a user account |
### 1.3. TRIPS

Base path: `/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET ||JWT| List one trip|
| GET ||| Get all trips for currently authenticated user|
| POST ||| Add a new trip |
| PATCH||| |

### 1.4. ENTRIES


### 1.5. EXPENSES

- GET
    - FRTCH/LIST THE LOGGED IN (AUTHENTICATED) USER'S EXPENSES
    - FETCH A SINGLE EXPENSE 
- POST
    - ADD A NEW EXPENSE
- PATCH
    - EDIT A EXPENSE
- DELETE 
    - DELETE/REMOVE A USER EXPENSE


### 1.6. BUDGET

- GET 
    - FETCH SINGLE TRIP BUDGET
    - FETCH ALL TRIPBUDGETS FOR THE AUTHENTICATED 
- POST:
    - ADD A NEW TRIP BUDGET
        (A SINGLE TRIP CAN ONLY HAVE ONE BUDGET)
- PATCH :
    - EDIT A SINGLE TRIP BUDGET
- DELETE: 
    - DELETE A TRIP BUDGET

## 1.7. EXPORT

Base path: /export

- GET 
    - /export/trips
        - Export trips to .csv or .xlsx
    - /export/entries
        - Export entries to .csv or .xlsx
    - /export/expenses
        - Export expenses to .csv or .xlsx
    - /export/budget
        - Export trip budgets to .csv or .xlsx

## 1.8. VAT

- GET
    - /vat/history
        - Fetch the logged-in user's saved calculations
- POST: 
    - /vat/calculate
        - Work out the VAT on one amount (saves nothing)
    - /vat/save
        - Save a calculation to the logged-in user's history
- DELETE 
    - /history/:id
        - Remove one of the logged-in user's saved calculations
### 1.9 CURRENCY CONVERTER

- GET
    - /currency/calculations
       - Get the user's saved conversion calculations
- POST
    - /currency/calculations
        - Save a currency conversion
- DELETE
    - /currency/calculations/:id
        - Delete a saved conversion calculation

## 2 THIRD PARTY APIS

All third-party API keys are stored as environment variables and are never exposed to the browser. The backend acts as a proxy, making external requests server-side and returning only the relevant data to the client.

### 2.1 FRANKFUTER

    - POST :
        - currency/convert
            - RUN A CURRENCY CONVERSION VIA FRANKFUTER API

## 3. REFERENCES

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
- https://api.frankfurter.dev/v2/rates
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PATCH
- https://frankfurter.dev/