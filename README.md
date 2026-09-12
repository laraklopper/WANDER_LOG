# WANDER_LOG
The application is a comprehensive full-stack MERN STACK travel journal application.  written using `MERN` stack, a popular open-source, JavaScript-based, developer-friendly web stack. MERN stack uses `MongoDB` (a `NoSQL` database) to handle the database, `React.js` to create the front-end, `Express.js` to create the backend, and uses `Node.js` as the runtime environment.MERN Stack works by connecting the frontend, backend, and database to create a complete web application.

## TABLE OF CONTENTS

1. [HOW TO USE THE APPLICATION](#1-how-to-use-the-application)
2. [HOW TO RUN THE APPLICATION](#2-how-to-run-the-application)
3. [APPLICATION SECURITY](#3-application-security)
4. [APPLICATION FEATURES](#4-application-features)
5. [REFERENCES](#5-references)

*View [GLOSSARY.md](GLOSSARY.md) for terminology*

---

## 1. HOW TO USE THE APPLICATION

To use the application, users are required to register (sign up) and login. Registration is, however, controlled by age restrictions.

The `admin` boolean field on the User model provides `RBAC` to provide admin users with certain privileges. Admin users get a dedicated **Users** page listing every registered user.



| **AGE RESTRICTIONS** | |
|---|---|
| Regular users must be at least | 18 years old |
| Admin users must be at least | 21 years old |

## 2. HOW TO RUN THE APPLICATION

A `proxy server` is included in the front-end `package.json` to allow the front and back-end to run together. The application uses `nodemon` third-party middleware in the backend to allow the application to run in the command line interface (CLI) or terminal using `npm start`. The client and server folders must, however, be run separately.
The application is connected to the `MongoDB` database using mongoose third party middleware in the backend. The code uses `mongoose.connect()` to establish a connection with the MongoDB database.

The MongoDB connection URI is constructed using the database name and MongoDB cluster URL. These are stored in the `.env` file which stores sensitive information.

### 2.1. TERMINAL (`CLI`)

NPM (*Node Package Manager*) is the default package manager for Node.js.  

**Server** (`runs on port 3001 by default`):
```bash
 cd server
 npm start
```

**Client** (`runs on port 3000 by default`):
```bash
 cd client
 npm start
```

## 3. APPLICATION SECURITY

### 3.1. THIRD PARTY PACKAGES

### 3.2. SECURITY UTILITIES

### 3.3. PROTECTED CLIENT-SIDE (FRONT-END) ROUTES

## 4. APPLICATION FEATURES

## 5. REFERENCES

- https://www.w3schools.com/tags/ref_byfunc.asp