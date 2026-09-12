# SECURITY

#### **SECURITY GOALS**

- Protect user credentials (hashed + never stored as plaintext)
- Authenticate requests securely (JWT)
- Restrict access based on roles (RBAC: admin vs user)
- Reduce common web vulnerabilities (security headers, CORS rules)
- Keep secrets out of source control (dotenv)
- Enforce strong passwords at registration and password updates
- Limit API calls using express-rate-limit

|GOAL| METHOD||
|---|---|---|
| PASSWORD HASHING |  Hashed password before storage using `bcrypt` middleware (salt rounds: 10) | *plaintext passwords are however used during development* |
| STRONG PASSWORDS | Requirements for passwords | check password middleware |
|AUTHENTICATE ALL REQUESTS| JWT authentication | `All routes that require authentication expect a `Bearer <token>` value in the `Authorization` header except the `/auth` routes in [authRoutes.js](../server/routes/authRoutes.js)`|
| RESTRICT ACCESS BASED ON `RBAC` | Admin registration (based on age restrictions) |*provide admin users with certain privileges* |
| SECURE HTTP HEADERS |  Set secure HTTP response headers using `helmet.js` middleware | |
| SETUP CROSS-ORIGIN-RESOURCE-SHARING |Set `CORS` middleware which indicates which external domains are permitted to make requests to a server | *CORS must be configured in the Express backend to allow the React frontend to call the API*|
| ENVIROMENTAL VARIABLES| Use `dotenv` middleware to secure enviromental variables |*The `.env` file is never committed to source control (listed in `.gitignore`)*|
|RATE-LIMITING| Use rate-limiting middleware (`express-rate-limit` middleware) to limit API calls| *Prevent brute force*|

<!-- - Enforce strong passwords at registration and password updates -->
|
## TABLE OF CONTENTS
1. 
2

- *View [GLOSSARY.md](../GLOSSARY.md) for terminolgy*
## 1. OVERVIEW

The application implements an **in-depth** security strategy using:

- **Third-party packages**: Industry-standard libraries for authentication, hashing, and rate limiting
- **Custom middleware**: Application-specific validation and authorization logic
- **Security utilities**: Utility functions for secure configuration management
- **Protected routes**: protected front end routes for `RBAC`

## 2. THIRD PARTY PACKAGES

| _PACKAGE_ | _CLI / TERMINAL_ | _PURPOSE_ | _VERSION_ |
|-----------|-----------------|-----------|-----------|
| JsonWebToken | `npm install jsonwebtoken` | Signs and verifies JWT tokens for stateless authentication |9.0.3 |
| Bcrypt | `npm install bcrypt` | Hashes passwords before storage using bcrypt (salt rounds: 10) | 6.0.0 |
| Helmet | `npm install helmet` | Sets secure HTTP response headers to guard against common web attacks (XSS, clickjacking, MIME sniffing, etc.) | 8.2.0 |
| Express-Rate-Limit | `npm install express-rate-limit` | Limits repeated requests to API endpoints per IP | 8.5.2 |
| cors | `npm install cors` | Cross-Origin Resource Sharing middleware | 2.8.6 |
| dotenv | `npm install dotenv` | Loads environment variables from `.env` file | 17.4.2 |

### 2.1. JWT AUTHENTICATION
Signs and verifies JWT tokens for stateless authentication in the `Authorization: Bearer <token>` header

All routes that require authentication expect a `Bearer <token>` value in the `Authorization` header except the `/auth` routes in [authRoutes.js](../server/routes/authRoutes.js)`.

### 2.2. BCRYPT PASSWORD HASHING

Hashes passwords before storage using salt rounds.
*plaintext passwords are however used during development*
### 2.3. CORS CONFIGURATION
### 2.4. HELMET

Sets secure HTTP response headers to guard against common web attacks (XSS, clickjacking, MIME sniffing, etc.)
### 2.5. EXPRESS RATE LIMITING

Rate limiting controls how many requests a client can make in a certain time period.

### 2.6. ENVIROMENTAL VARIABLES

Stores all secrets and environment-specific config. 
*The `.env` file is never committed to source control (listed in `.gitignore`)*
## 3. CUSTOM MIDDLEWARE

#### checkJwtToken

#### hashPassword

#### checkPassword

Uses the regex `/^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/` to enforce:
- Minimum 8 characters
- At least one special character

#### `checkAge`

#### check admin

#### `generalRateLimiter`
Caps traffic at 100 requests per 15 minutes per IP using `express-rate-limit`. Returns `429` with a `retryAfter` value (minutes) when exceeded.
## 4. SECURITY UTILITIES

### 4.1. ENSURE JWT SECRET KEY-[ensureJwtKey](../server/config/ensureJwtSecret.js)



Called once at startup in [server/app.js](../server/app.js) before any other module loads. It guarantees `JWT_SECRET_KEY` is available:

## 4.2. PROTECTED FRONT-END ROUTES
## 6. REFERENCES

- https://nodejs.org/api/environment_variables.html#environment-variables
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
- https://www.geeksforgeeks.org/websites-apps/cross-origin-resource-sharing-cors/
- https://www.geeksforgeeks.org/node-js/node-js-securing-apps-with-helmet-js/
- https://www.npmjs.com/package/express-rate-limit