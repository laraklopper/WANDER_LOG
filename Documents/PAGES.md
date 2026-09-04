# PAGES

## TABLE OF CONTENTS

## 1. PUBLIC FRONTEND PAGES

### 1.1. LOGIN
Public landing page.
- LoginForm

- ROUTE: '/'
### 1.2. REGISTRATION
- registration form

- ROUTE: '/reg'
### 1.3. DASHBOARD
- ROUTE: '/dashboard'
- welcome message
- display username, fullName, profilePicture and email
[Dashboard.js](../client/src/pages/Dashboard.js)

### 1.4. TRAVEL LOG
- shows user entries list and user trip list
- allows user to edit trips and entries on the list 
- allows users to export trips and entri
[TravelLog.js](../client/src/pages/TravelLog.js)
- ROUTE: '/travelLog'
### 1.5. JOURNAL
- shows AddTrip and AddEntry form
- ROUTE: '/journal'
### 1.6. EXPENSES
- add user expense
- shows all user expenses
- delete user expense
- edit user expense

- ROUTE: '/exp'
[Expenses.js](../client/src/pages/Expenses.js)
### 1.7. BUDGET
- ExpensesList (users cannot delete or edit expenses on the page)
- displays vatCalculations list + conversions list
    - allows users to delete a calculation or conversion on from the list
- ROUTE: '/budget'

[Budget.js](../client/src/pages/Budget.js)
### 1.8. PROFILE
- display user profile
- allows users to edit profile or edit password

- ROUTE: '/profile'
[Profile.js](../client/src/pages/Profile.js)
### 1.9. USERS
Private Admin only route. Allows admin users to view all user details except profile picture and password. And allows admin users to delete non-admin users.

- ROUTE: '/users' 
[Users.js](../client/src/pages/Users.js)
## 2. FALLBACK ROUTE 
Displayed if an HTTP response 404 (Not Found) client error response is shown.
The server cannot find the requested resource. In the browser, this means the URL is not recognised. 
- ROUTE: (*)
## 3. PROTECTED ROUTES

### 3.1. PROTECTED USER ROUTE
Protected route after user login. Accessible to all loggedIn users
Provides logged in users to all private frontend pages

[ProtectedUserRoute](../client/src/protectedRoutes/ProtectedUserRoute.js)

### 3.2. PROTECTED ADMIN ROUTE

Protected admin-only route after login. Accessible only to admin users.
Provides loggedIn admin users access to the Users.js page.

[ProtectedAdminRoute](../client/src/protectedRoutes/ProtectedAdminRoute.js)




