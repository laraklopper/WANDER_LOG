# SECURITY

#### **SECURITY GOALS**

- Protect user credentials (hashed + never stored as plaintext)
- Authenticate requests securely (JWT)
- Restrict access based on roles (RBAC: admin vs user)
- Reduce common web vulnerabilities (security headers, CORS rules)
- Keep secrets out of source control (dotenv)
- Enforce strong passwords at registration and password updates
- Limit API calls using express-rate-limit

<!-- - Enforce strong passwords at registration and password updates -->
|
## TABLE OF CONTENTS
1. [OVERVIEW](#1-overview)
2. [THIRD PARTY PACKAGES]
    - [2.1.JWT AUTHENTICATION](#21-jwt-authentication)
    - [2.2. BCRYPT PASSWORD HASHING](#22-bcrypt-password-hashing)
    - [2.3. CORS CONFIGURATION](#23-cors-configuration)
    - [2.4. SECURE HTTP RESPONSE HEADERS](#24-helmet)
    - [2.5. EXPRESS-RATE-LIMITING](#25-express-rate-limiting)
    - [2.6. ENVIROMENTAL VARIABLES](#26-enviromental-variables)
3. [CUSTOM MIDDLEWARE](#3-custom-middleware)
4. [SECURITY UTILITIES](#4-security-utilities)
    - [4.1. ENSURE JWT TOKEN](#41-ensure-jwt-secret-key-ensurejwtkey)
    - [4.2. PROTECTED FRONT END ROUTES](#42-protected-front-end-routes)
5. [REFERENCES](#5-references)

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
### 2.4. SECURE HTTP RESPONSE HEADERS

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

### 4.2. PROTECTED FRONT-END ROUTES

Client-side `RBAC` is enforced by two wrapper components that gate access to a route's content based on login and admin status. Each wrapper checks `currentUser` (set on login) before rendering its `children`; if the check fails, the user is redirected to `/` instead of seeing the protected page.

- [ProtectedUserRoute.js](../client/src/protectedRoutes/ProtectedUserRoute.js)


This component protects routes that require a user to be logged in, regardless of their role.

```js
//ProtectedUserRoute.js
import React from 'react' // Import the React module to use React functionalities
// Import React Router components
import {Navigate} from 'react-router-dom'

//ProtectedUserRoute.js
export default function ProtectedUserRoute({
  //PROPS PASSED FROM PARENT COMPONENT
  currentUser,
  children
}) {
  // If no user is logged in,
  // redirect to the home page.
  if (!currentUser) {
    return <Navigate to='/' />
  }
  // If a user is logged in,
  // render the protected content.
  return children
}
```

- [`ProtectedAdminRoute.js`](/client/src/protectedRoutes/ProtectedAdminRoute.js)

This component protects routes that should only be accessible by users who are logged in **AND** have administrator privileges.
```js
//ProtectedAdminRoute
import React from 'react'
import { Navigate } from 'react-router-dom'
//ProtectedAdminRoute
export default function ProtectedAdminRoute(
    {//PROPS PASSED FROM PARENT COMPONENT
        currentUser,
        children
    }
) {
 // If there is no logged-in user OR the user is not an admin,
  // redirect them to the home page.
    if (!currentUser || !currentUser.admin) {
        return <Navigate to='/'/>
    }
     // If the user exists and is an admin,
  // render the protected content (child component).
    return children
}

```
## 5. REFERENCES

- https://nodejs.org/api/environment_variables.html#environment-variables
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
- https://www.geeksforgeeks.org/websites-apps/cross-origin-resource-sharing-cors/
- https://www.geeksforgeeks.org/node-js/node-js-securing-apps-with-helmet-js/
- https://www.npmjs.com/package/express-rate-limit