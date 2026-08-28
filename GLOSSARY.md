# GLOSSARY

| **ABBREVIATION** | **TERM** | **EXPLANATION** |
|-------| -------| -------|
|`API`| **APPLICATION PROGRAMMING INTERFACE** | A set of rules and endpoints that allow different software systems to communicate. In this app, the backend exposes a REST API that the React frontend calls to fetch and manage portfolio data. |
|`ARIA`| **ACCESSIBLE RICH INTERNET APPLICATIONS** | A W3C specification that adds semantic attributes to HTML elements so assistive technologies can interpret dynamic content correctly. |
|`AT`| **ASSISTIVE TECHNOLOGIES** | Software and hardware (e.g. screen readers, braille displays) that help users with disabilities access digital content. |
|`BLOB`| **BINARY LARGE OBJECT** | A data type used to store large binary data (images, files) in a database or cloud storage. |
|`BSON`| **BINARY JSON** | A binary-encoded serialisation format for JSON-like documents used natively by MongoDB. BSON supports additional data types not present in standard JSON, such as `Date` and `ObjectId`. MongoDB stores all documents internally as BSON and converts to/from JSON when communicating with application code. |
|`CLI`| **COMMAND LINE INTERFACE** | A text-based interface for interacting with software via typed commands. Used throughout this project with tools like `npm`, `node`, and `git`. |
|`CORS`| **CROSS-ORIGIN RESOURCE SHARING** | A browser security mechanism that controls which external domains are permitted to make requests to a server. Must be configured in the Express backend to allow the React frontend to call the API. |
|`CRUD`| **CREATE, READ, UPDATE, DELETE** | The four fundamental database operations. This app performs CRUD on portfolio holdings stored in MongoDB. |
|`CSP`| **CONTENT SECURITY POLICY** | An HTTP response header that instructs the browser which sources of content (scripts, styles, images) are permitted to load. Helps prevent XSS attacks. Applied in this application via the `helmet` package. |
|`CSS`| **CASCADING STYLE SHEETS** | The language used to describe the visual presentation of HTML documents. |
|`CSV`| **COMMA-SEPARATED VALUES** | A plain-text format for representing tabular data where values are separated by commas. Used in this application for exporting holdings, transactions, accounts, and watchlist data. |
|`DNS`| **DOMAIN NAME SYSTEM** | The internet's naming system that translates human-readable domain names into IP addresses. MongoDB Atlas connection strings use DNS SRV records via the `mongodb+srv://` scheme to automatically discover replica set members. |
|`DOM`| **DOCUMENT OBJECT MODEL** | The browser's in-memory tree representation of an HTML page. React manages the DOM efficiently through a virtual DOM. |
|`ETF`| **EXCHANGE-TRADED FUND** | A type of investment fund that holds a collection of assets (stocks, bonds, etc.) and is traded on a stock exchange like a regular share. Supported as a security type in the watchlist. |
|`HTML`| **HYPERTEXT MARKUP LANGUAGE** | The standard markup language for structuring content on the web. |
|`HTTP`| **HYPERTEXT TRANSFER PROTOCOL** | The protocol used to transfer data between a client and a server over the web. |
|`HTTPS`| **HYPERTEXT TRANSFER PROTOCOL SECURE** | The encrypted version of HTTP, using TLS to protect data in transit. Required for production deployments. |
|`IANA`| **INTERNET ASSIGNED NUMBERS AUTHORITY** | The organisation responsible for maintaining global internet standards, including the official timezone database. IANA timezone identifiers (e.g. `Africa/Johannesburg`) are used in user preferences. |
|`IP`| **INTERNET PROTOCOL** | The fundamental communication protocol that routes data across networks. Each device is assigned an IP address. In this app, IP addresses are used by the rate limiters to track and restrict repeated requests from individual clients. |
|`ISA`| **INDIVIDUAL SAVINGS ACCOUNT** | A tax-efficient investment account type available in the United Kingdom, where returns on investments are sheltered from income and capital gains tax. Supported as an account type in this application. |
|`ISO`| **INTERNATIONAL ORGANIZATION FOR STANDARDIZATION** | An international standards body. ISO 4217 defines the 3-letter currency codes (e.g. `ZAR`, `USD`) used in this application's account and preference settings. |
|`JPEG`| **JOINT PHOTOGRAPHIC EXPERTS GROUP**||
|`JS`| **JAVASCRIPT** | The programming language of the web, used here for both the React frontend and the Node.js/Express backend. |
|`JSON`| **JAVASCRIPT OBJECT NOTATION** | A lightweight, human-readable data format used to exchange data between the frontend and backend API. |
|`JSX`| **JAVASCRIPT XML** | A React syntax extension that lets you write HTML-like markup inside JavaScript files. |
|`JWT`| **JSON WEB TOKEN** | A compact, signed token used to securely transmit authentication information between client and server without storing session state. |
|`MERN`| **MONGODB, EXPRESS.JS, REACT, NODE.JS** | The full-stack JavaScript architecture this application is built on. |
|`MIME`| **MULTIPURPOSE INTERNET MAIL EXTENSIONS** | A standard that extends the format of email and web content to support text in character sets other than ASCII, as well as attachments such as images and files. On the web, MIME types (e.g. `image/jpeg`, `image/png`) describe the nature and format of a document or file. Used in this application to validate uploaded profile pictures via MIME type checking before storing them on Cloudinary. |
|`MVC`| **MODEL VIEW CONTROLLER** | An architectural pattern that separates an application into three layers: data (Model), UI (View), and business logic (Controller). |
|`MVP`| **MVP**  ||
|`NoSQL`| **NOT ONLY SQL / NON-RELATIONAL DATABASE** | A class of database that stores data in formats other than the traditional relational (tabular) model. MongoDB, used in this application, is a document-oriented NoSQL database that stores records as JSON-like BSON documents. |
|`NPM`| **NODE PACKAGE MANAGER** | The default package manager for Node.js, used to install and manage project dependencies. |
|`ODM`| **OBJECT DOCUMENT MAPPER** | A library (Mongoose in this project) that maps JavaScript objects to MongoDB documents, providing schema validation and query helpers. |
|`PNG`| **JOINT PHOTOGRAPHIC EXPERTS GROUP**|  |
|`RBAC`| **ROLE BASED ACCESS CONTROL** | A security model that restricts system access based on a user's assigned role. In this application, the `admin` boolean field on the User model controls whether a user can access admin-only routes and actions. Regular users have standard access; admin users have elevated privileges. |
|`REGEX`| **REGULAR EXPRESSION** | A sequence of characters that defines a search or match pattern. Used in this application to validate email format and enforce password strength requirements. |
|`RFC`| **REQUEST FOR COMMENTS** | A formal document published by the IETF (Internet Engineering Task Force) that defines internet standards and protocols. In this application, RFC 6585 defines the `429 Too Many Requests` HTTP status code returned by rate limiters when a client exceeds its allowed request quota. |
|`REST (API)`| **REPRESENTATIONAL STATE TRANSFER** | An architectural style for APIs that uses standard HTTP methods (GET, POST, PUT, DELETE) and stateless communication. |
|`RWD`| **RESPONSIVE WEB DESIGN** | A design approach that ensures a web application looks and works correctly across different screen sizes and devices. |
|`SHA`| **SECURE HASH ALGORITHM** | A family of cryptographic hash functions standardised by NIST. This application uses SHA-256 to hash password reset tokens before persisting them in the database, ensuring the raw token is never stored and cannot be recovered if the database is compromised. |
|`SMTP`| **SIMPLE MAIL TRANSFER PROTOCOL** | The standard protocol for sending email across networks. In this application, the `nodemailer` package uses an SMTP connection to Gmail to deliver password reset emails to users. |
|`SPA`| **SINGLE PAGE APPLICATION** | A web app that loads a single HTML page and dynamically updates content without full page reloads. React enables this pattern. |
|`SRV`| **SERVICE RECORD** | A type of DNS record that specifies the hostname and port of a network service. MongoDB Atlas uses SRV records via the `mongodb+srv://` scheme to provide automatic discovery of replica set members without hardcoding IP addresses. |
|`SVG`| **SCALABLE VECTOR GRAPHIC** | An XML-based vector image format that scales without loss of quality at any resolution. Used in this application for icons and chart elements rendered by Recharts. |
|`TLS`| **TRANSPORT LAYER SECURITY** | A cryptographic protocol that secures communication over a network by encrypting data in transit. The foundation of HTTPS. |
|`UI`| **USER INTERFACE** | The visual layer of an application — everything the user sees and interacts with. |
|`URI`| **UNIFORM RESOURCE IDENTIFIER** | A string that uniquely identifies a resource. A URL is a specific type of URI that includes a network location. |
|`URL`| **UNIFORM RESOURCE LOCATOR** | The full web address used to locate a specific resource, e.g. `http://localhost:5000/api/stocks`. |
|`UX`| **USER EXPERIENCE** | The overall quality of a user's interaction with an application, encompassing usability, accessibility, and satisfaction. |
|`W3C`| **WORLD WIDE WEB CONSORTIUM** | The international standards body that develops and maintains core web technology specifications, including HTML, CSS, ARIA, and WCAG. |
|`WAI`| **WEB ACCESSIBILITY INITIATIVE** | A W3C programme that develops standards and guidelines (including WCAG and ARIA) to make the web accessible to people with disabilities. |
|`WCAG`| **WEB CONTENT ACCESSIBILITY GUIDELINES** | A set of W3C guidelines that define how to make web content accessible to people with disabilities. WCAG 2.1 (AA) is the widely adopted standard. |
|`XLSX`| **EXCEL OPEN XML SPREADSHEET** | The file format used by Microsoft Excel for storing spreadsheet data. Supported alongside CSV for exporting holdings, accounts, transactions, and watchlist data. |
|`XML`| **EXTENSIBLE MARKUP LANGUAGE** | A markup language that defines rules for encoding documents in a format that is both human-readable and machine-readable. Several technologies used in this application are XML-based: SVG uses XML for vector graphics, and JSX borrows XML-like syntax for writing React component markup. |
|`XSS`| **CROSS SITE SCRIPTING** | A security vulnerability where an attacker injects malicious scripts into web pages viewed by other users. Prevented by sanitising user input and using Content Security Policy headers. |
