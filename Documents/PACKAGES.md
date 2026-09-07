# PACKAGES

A package is a reusable unit of code published to a registry and pulled into a project rather than written by hand. This project is a **two-layer application** — [client](../client) and [server](../server) — and each layer has its own `package.json`, its own `node_modules` and its own dependency list. There is **no root `package.json`**, so there is no single install that covers both.

## TABLE OF CONTENTS

1. [NODE PACKAGE MANAGER (NPM)](#1-node-package-manager-npm)
   - [1.1. NPM COMMANDS](#11-npm-commands)
   - [1.2. INSTALLING THIS PROJECT](#12-installing-this-project)
2. [APPLICATION PACKAGES](#2-application-packages)
   - [2.1. SERVER-SIDE (BACK-END)](#21-server-side-back-end)
   - [2.2. CLIENT-SIDE (FRONT-END)](#22-client-side-front-end)
   - [2.3. NODE BUILT-IN MODULES](#23-node-built-in-modules)
3. [PROJECT SCRIPTS](#3-project-scripts)
   - [3.1. SERVER SCRIPTS](#31-server-scripts)
   - [3.2. CLIENT SCRIPTS](#32-client-scripts)
4. [KNOWN GAPS](#4-known-gaps)
5. [REFERENCES](#5-references)

- *View [GLOSSARY.md](../GLOSSARY.md) for terminology.*
- *View [API.md](API.md) for the routes the server-side packages serve.*
- *View [SECURITY.md](SECURITY.md) for how `bcrypt`, `jsonwebtoken`, `helmet` and `express-rate-limit` fit together.*

---

## 1. NODE PACKAGE MANAGER (NPM)

NPM (Node Package Manager) is the default package manager for Node.js. It is used to install, manage, and share JavaScript packages. Each layer of this application (client and server) has its own `package.json` file that lists its dependencies.

Three files matter per layer:

| **FILE** | **PURPOSE** |
|---|---|
| `package.json` | The declared dependency list, with a **version range** (`^6.0.0` means "6.x.x, but not 7") plus the project's scripts and metadata. Committed |
| `package-lock.json` | The **exact** version of every package and sub-package that was installed, so a fresh `npm install` reproduces the same tree. Committed |
| `node_modules/` | The installed packages themselves. Generated, never committed — it is gitignored in both [client/.gitignore](../client/.gitignore) and [server/.gitignore](../server/.gitignore) |

### 1.1. NPM COMMANDS

| **COMMAND** | **PURPOSE** |
|---|---|
| `npm init` | Initialises a new Node.js project and creates a package.json file interactively, which stores metadata and dependencies for the project. |
| `npm install` | Installs all the dependencies listed in the package.json file for your project. This command reads the package.json and installs the necessary packages in a folder called node_modules. |
| `npm install <package_name>` | Installs a specific package as a project dependency. For example, `npm install express` installs the Express framework. |
| `npm install <package_name> --save-dev` | Installs a package as a development dependency. Development dependencies are used during the development process but are not required in the production environment. The `--save-dev` flag saves the package in the devDependencies section of the package.json file. |
| `npm uninstall <package_name>` | Uninstalls a package from the project. |
| `npm update` | Updates all the packages in your project to their latest versions, respecting the version range specified in package.json. |
| `npm update <package_name>` | Updates a specific package to its latest version. |
| `npm outdated` | Checks for outdated packages in your project. |
| `npm audit` | Reports known security vulnerabilities in the installed tree. |
| `npm ls <package_name>` | Shows which version of a package is actually installed, and what pulled it in. |
| `npm run <script_name>` | Executes a script defined in the scripts section of the package.json file. Common scripts include start, test, and build. |
| `npm publish` | Publishes your package to the npm registry, making it available for others to install and use. |
| `npm search <package_name>` | Searches the npm registry for packages matching the given name. |
| `npm info <package_name>` | Displays detailed information about a package. |
| `npm test` | Tests a package. |
| `npm stop` | Stops a package. |
| `node -v` | Check if Node.js & npm are installed correctly (e.g. v20.11.0). |
| `npm -v` | Check the version of npm. |

### 1.2. INSTALLING THIS PROJECT

Because there is no root `package.json`, install is run **once per layer**, from the folder that owns the `package.json`:

```bash
cd server
npm install

cd ../client
npm install
```

The server also needs a `server/.env` before it will start. It is gitignored, so it does not arrive with a clone. `PORT`, `MONGODB_URI` and `CLIENT_URL` must be set by hand; `JWT_SECRET_KEY` is generated and written in automatically on first boot by [ensureJwtSecret.js](../server/config/ensureJwtSecret.js).

Then run both layers at once, in two terminals — the server on `:3001` and the client on `:3000`. The `proxy` field in [client/package.json](../client/package.json#L5) points the dev server's unmatched requests at the API, so the client can call `/auth/login` rather than a full URL.

---

## 2. APPLICATION PACKAGES

Every package below is a direct dependency — one this project asked for by name. The hundreds of others in `node_modules` are sub-dependencies pulled in on their behalf.

The **VERSION** column is the range declared in `package.json`. The installed tree currently matches every range exactly, so the resolved version is the range's floor in each case.

### 2.1. SERVER-SIDE (BACK-END)

Declared in [server/package.json](../server/package.json). All eleven are listed under `dependencies`; the server has **no `devDependencies`**.

| _PACKAGE_ | _CLI / TERMINAL_ | _PURPOSE_ | _VERSION_ |
|-----------|-----------------|-----------|-----------|
| `express` | `npm install express` | The web framework the whole API is built on — routing, middleware and `express.json()` body parsing. The app is created in [app.js](../server/app.js#L28) and every route file exports an `express.Router()` | `^5.2.1` |
| `mongoose` | `npm install mongoose` | ODM (Object Data Modelling) layer for MongoDB. Supplies the schemas, validators, `pre`/`post` hooks, `populate` and the query builder used by every model in [server/models](../server/models) — see [SCHEMAS.md](SCHEMAS.md) | `^9.9.4` |
| `dotenv` | `npm install dotenv` | Reads `server/.env` into `process.env`, so `PORT`, `MONGODB_URI`, `JWT_SECRET_KEY` and `CLIENT_URL` are configuration rather than hard-coded values. Called at the top of every module that reads one | `^17.4.2` |
| `bcrypt` | `npm install bcrypt` | Hashes a password at a cost factor of **12** in the `pre('save')` hook on [userSchema.js](../server/models/userSchema.js#L230), and compares a login attempt against the stored hash in [`comparePassword`](../server/models/userSchema.js#L237). The plain text password is never stored | `^6.0.0` |
| `jsonwebtoken` | `npm install jsonwebtoken` | Signs the `HS256` token issued on login and registration ([authRoutes.js](../server/routes/authRoutes.js#L46)), and verifies the `Bearer` token in [checkJwtToken](../server/routes/middleware.js#L40). Tokens expire after 12 hours | `^9.0.3` |
| `cors` | `npm install cors` | Cross-Origin Resource Sharing. The API and the React dev server run on different ports, which makes every request cross-origin and blocked by default. Configured in [app.js](../server/app.js#L45-L49) to allow only `CLIENT_URL`, and only the methods and headers the app actually sends | `^2.8.6` |
| `helmet` | `npm install helmet` | Sets a baseline of security response headers, including a Content Security Policy. Applied first in the middleware stack in [app.js](../server/app.js#L40), with `crossOriginResourcePolicy` relaxed to `cross-origin` so the client on another origin can still load served resources | `^8.3.0` |
| `express-rate-limit` | `npm install express-rate-limit` | Caps repeated requests per IP on the three routes where credentials could be guessed at: login (10 / 15 min) and registration (20 / hour) in [authRoutes.js](../server/routes/authRoutes.js#L7), and the password change (10 / 15 min) in [userRoutes.js](../server/routes/userRoutes.js#L7). Over-quota requests return `429`. Relies on `app.set('trust proxy', 1)` to read the real client IP behind a proxy | `^8.6.2` |
| `nodemon` | `npm install nodemon --save-dev` | Watches the server files and restarts `app.js` on every save, so the process does not have to be killed and restarted by hand. Sits behind `npm start` — a **development-only tool**, currently mis-filed under `dependencies` (see [4. KNOWN GAPS](#4-known-gaps)) | `^3.1.14` |
| `cloudinary` | `npm install cloudinary` | Intended host for uploaded profile pictures — `profilePicture` on [userSchema.js](../server/models/userSchema.js#L167) is documented as holding the Cloudinary URL. **Installed but never required**: no upload route exists and the field is written straight from the request body as a plain string | `^2.10.1` |
| `mongoose-autopopulate` | `npm install mongoose-autopopulate` | Mongoose plugin that populates a `ref` path on every query without an explicit `.populate()` call. **Installed but never required** — no schema registers the plugin or sets `autopopulate: true` | `^1.2.1` |

### 2.2. CLIENT-SIDE (FRONT-END)

Declared in [client/package.json](../client/package.json). All thirteen are listed under `dependencies` — the Create React App default, which does not separate out the testing packages.

| _PACKAGE_ | _CLI / TERMINAL_ | _PURPOSE_ | _VERSION_ |
|-----------|-----------------|-----------|-----------|
| `react` | `npm install react` | The UI library itself — components, JSX and the hooks this app leans on (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`) | `^19.2.8` |
| `react-dom` | `npm install react-dom` | Renders the React tree into the browser DOM. `createRoot` is imported from `react-dom/client` in [index.js](../client/src/index.js#L2) | `^19.2.8` |
| `react-scripts` | `npm install react-scripts` | Create React App's build toolchain — the dev server, the Webpack/Babel production build, the Jest test runner and the shared ESLint config. Owns all four scripts in [3.2](#32-client-scripts); nothing is configured by hand | `5.0.1` |
| `react-router-dom` | `npm install react-router-dom` | Client-side routing. `BrowserRouter` wraps the app in [index.js](../client/src/index.js#L7), `Routes`/`Route` declare the route table in [App.js](../client/src/App.js#L6), `NavLink` and `Link` navigate without a page reload, `useNavigate` redirects after login, and `Navigate` powers the guards in [protectedRoutes/](../client/src/protectedRoutes/) — see [CLIENT_SIDEROUTING.md](CLIENT_SIDEROUTING.md) | `^7.18.2` |
| `bootstrap` | `npm install bootstrap` | The CSS framework. `bootstrap.min.css` is imported once in [index.js](../client/src/index.js#L5), which makes the grid and the utility classes available to every stylesheet in [client/src/css](../client/src/css) | `^5.3.8` |
| `react-bootstrap` | `npm install react-bootstrap` | Bootstrap's components rebuilt as React components — `Container`, `Row`, `Col`, `Stack` and `Button` are the five this app uses. Imported one file at a time (`react-bootstrap/Button`) rather than from the package root, so the bundle only carries the components actually used | `^2.10.10` |
| `lucide-react` | `npm install lucide-react` | SVG icon set delivered as React components, so an icon takes props like any other component and inherits `currentColor`. Used for form field markers (`Asterisk`), validation states (`Bug`), password visibility (`Eye` / `EyeOff`), the calculator keypad (`Divide`, `Equal`) and list controls (`ArrowDownAZ`, `Search`, `Ban`) | `^1.34.0` |
| `mathjs` | `npm install mathjs` | Its `evaluate()` parses and computes the typed expression in [Calculator.js](../client/src/components/Calculator.js#L40), so the general calculator never has to call `eval()` on user input — see [CALCULATORS.md](CALCULATORS.md) | `^15.2.0` |
| `web-vitals` | `npm install web-vitals` | Measures Core Web Vitals (CLS, FID, FCP, LCP, TTFB). Wired up by CRA in [reportWebVitals.js](../client/src/reportWebVitals.js) and called with no callback in [index.js](../client/src/index.js#L21), so it is loaded but reports nothing | `^2.1.4` |
| `@testing-library/react` | `npm install @testing-library/react --save-dev` | Renders a component into a test DOM and queries it the way a user would — by role, label and text rather than by class or internal state. Used in [App.test.js](../client/src/App.test.js) | `^16.3.2` |
| `@testing-library/jest-dom` | `npm install @testing-library/jest-dom --save-dev` | Adds DOM-aware Jest matchers (`toBeInTheDocument`, `toBeDisabled`, `toHaveValue`). Loaded globally by [setupTests.js](../client/src/setupTests.js#L5), so no test file has to import it | `^6.9.1` |
| `@testing-library/dom` | `npm install @testing-library/dom --save-dev` | The framework-agnostic querying core that `@testing-library/react` is built on. A peer dependency, pinned here explicitly rather than left to be resolved | `^10.4.1` |
| `@testing-library/user-event` | `npm install @testing-library/user-event --save-dev` | Simulates real interaction — a click that fires the full sequence of `pointerdown`, `mousedown`, `focus`, `mouseup`, `click` — rather than dispatching one synthetic event. **Installed but not imported anywhere** | `^13.5.0` |

### 2.3. NODE BUILT-IN MODULES

Not packages — these ship with Node.js, so they appear in `require()` calls but never in `package.json`. All three are used by [ensureJwtSecret.js](../server/config/ensureJwtSecret.js).

| _MODULE_ | _PURPOSE_ |
|---|---|
| `crypto` | `crypto.randomBytes(64)` generates the 512-bit JWT signing key, so a development secret is cryptographically random rather than a typed-in string |
| `fs` | Reads and writes `server/.env` to persist that generated key, at file mode `0o600` so only the owner can read it |
| `path` | Builds the absolute path to `.env` from `process.cwd()`, so the lookup does not depend on which directory the process was started from |

---

## 3. PROJECT SCRIPTS

Scripts are run with `npm run <script_name>` from the directory that owns the `package.json`. `start` and `test` are special-cased by npm and may be run without `run`.

### 3.1. SERVER SCRIPTS

Defined in [server/package.json](../server/package.json#L6-L9).

| _SCRIPT_ | _COMMAND_ | _PURPOSE_ |
|---|---|---|
| `npm start` | `nodemon app.js` | Starts the Express server and restarts it automatically on file changes |
| `npm test` | `echo "Error: no test specified" && exit 1` | The npm placeholder, untouched. There are no server-side tests, and the non-zero exit means a CI step calling it would fail |

### 3.2. CLIENT SCRIPTS

Defined in [client/package.json](../client/package.json#L21-L26). All four delegate to `react-scripts`.

| _SCRIPT_ | _COMMAND_ | _PURPOSE_ |
|---|---|---|
| `npm start` | `react-scripts start` | Runs the dev server on `:3000` with hot reload, and proxies unmatched requests to the API on `:3001` |
| `npm run build` | `react-scripts build` | Produces the minified, hashed production bundle in [client/build](../client/build). Gitignored |
| `npm test` | `react-scripts test` | Runs Jest in watch mode, with [setupTests.js](../client/src/setupTests.js) loaded first |
| `npm run eject` | `react-scripts eject` | Copies CRA's hidden Webpack, Babel and Jest config into the project. **One-way and irreversible** — `react-scripts` stops managing the build and every config file becomes this project's to maintain |

---

## 4. KNOWN GAPS

Points where the dependency lists do not match what the code does. Recorded here so the tables above can be read as the intended shape.

| Where | Issue |
|---|---|
| [server/package.json:16](../server/package.json#L16) | `cloudinary` is installed but never required. [userSchema.js:167](../server/models/userSchema.js#L167) describes `profilePicture` as "the Cloudinary URL after upload", but no upload route exists — the field is written straight from the request body, so the client has to supply a URL it hosted elsewhere |
| [server/package.json:24](../server/package.json#L24) | `mongoose-autopopulate` is installed but never required, and no schema registers it as a plugin. Population is done explicitly where it is needed instead |
| [server/package.json:25](../server/package.json#L25) | `nodemon` is a development-only file watcher but sits under `dependencies`, so `npm install --production` would still pull it onto a production host |
| [server/package.json:5](../server/package.json#L5) | `"main": "index.js"` — there is no `index.js`. The entry point is [app.js](../server/app.js), which is what `npm start` actually runs, so the field is misleading |
| [server/package.json:4](../server/package.json#L4) | `description`, `keywords` and `author` are all still empty from `npm init` |
| [server/package.json:8](../server/package.json#L8) | `npm test` is the placeholder that exits `1`. The server has no test framework installed at all — the testing packages are all on the client |
| [client/package.json:10](../client/package.json#L10) | `@testing-library/user-event` is installed but imported nowhere. It is also two majors behind (`13.x` against `14.x`), where the API changed to async and requires `userEvent.setup()` |
| [client/src/App.test.js](../client/src/App.test.js) | The only test file is CRA's generated placeholder. Nothing in [components/](../client/src/components/) or [pages/](../client/src/pages/) is covered, despite four testing packages being installed |
| [client/src/reportWebVitals.js:3](../client/src/reportWebVitals.js#L3) | Calls the v2 API (`getCLS`, `getFID`, `getLCP`…), which `web-vitals` v3 renamed to `onCLS`, `onINP`, `onLCP`. Bumping the major would break this file silently — the import is inside a dynamic `import()` with no rejection handler |
| [client/package.json:18](../client/package.json#L18) | `react-scripts` is pinned at `5.0.1`. Create React App is no longer maintained, so the build toolchain will not receive fixes; the four scripts in [3.2](#32-client-scripts) all depend on it |
| Both layers | The client's testing packages sit under `dependencies` rather than `devDependencies` (the CRA default), so a production install carries them. `npm install --production` cannot be used to trim either layer as things stand |
| — | No root `package.json` and no workspace setup, so install and start are run twice, by hand, in the right order. Nothing records the required Node version — neither layer declares an `engines` field |

---

## 5. REFERENCES

- https://docs.npmjs.com/cli/v10/commands
- https://docs.npmjs.com/cli/v10/configuring-npm/package-json
- https://docs.npmjs.com/about-semantic-versioning
- https://expressjs.com/en/starter/installing.html
- https://mongoosejs.com/docs/guide.html
- https://www.npmjs.com/package/bcrypt
- https://github.com/auth0/node-jsonwebtoken
- https://helmetjs.github.io/
- https://express-rate-limit.mintlify.app/
- https://www.npmjs.com/package/cors
- https://www.npmjs.com/package/dotenv
- https://nodemon.io/
- https://react.dev/learn
- https://reactrouter.com/home
- https://react-bootstrap.netlify.app/docs/getting-started/introduction
- https://getbootstrap.com/docs/5.3/getting-started/introduction/
- https://lucide.dev/guide/packages/lucide-react
- https://mathjs.org/docs/expressions/parsing.html
- https://testing-library.com/docs/react-testing-library/intro/
- https://github.com/GoogleChrome/web-vitals
- https://create-react-app.dev/docs/available-scripts/
