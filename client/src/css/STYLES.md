# STYLES

## TABLE OF CONTENTS

1. [HTML STYLING](#1-html-styling)
2. [BOOTSTRAP](#2-bootstrap)
3. [GOOGLE FONTS](#3-google-fonts)
4. [LUCIDE-REACT](#4-lucide-react)
5. [REFERENCES](#5-references)

## 1. HTML STYLING

General styling formats, not the default tags styling for all formats apply for all tags.

### 1.1. BODY/HTML/ROOT
```css
#html, #body{
      overflow: visible;
    margin: 0px 0px 0px 0px;
    padding: 0px 0px 0px 0px;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-color: #3D6110;
}
#root {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    overflow: visible;
    background-color: #3D6110;
    margin: 0px 0px;
    padding: 0px;
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
}
```
### 1.2. HEADER/FOOTER
```css
#main-header, #page-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin: 10px 0px 10px 0px;
    padding: 0px;
    background-color: #5F9B9E;
}
#footer{
  display: flex;
    flex-direction: column;
    margin: 0px;
    padding: 10px 0px 10px 0px;
    width: 100%;
    background-color: #5F9B9E;
}
```
### 1.3. SECTIONS
```css
#section1{
   width: 100%;
   background-color: #608021;
   height: 100%;
   display: flex;
   justify-content: center;
   align-items: center;
   margin: 10px 0px 10px 0px;
   padding: 0px;
}
#section2{
  display: flex;
   justify-content: center;
   align-items: center;
  background-color: #7BA428;
  width: 100%;
  margin: 10px 0px 10px 0px;
  padding: 0px;
}
#section3{
   display: flex;
   justify-content: center;
   align-items: center;
  background-color: #568A17;
  width: 100%;
  margin: 10px 0px 10px 0px;
  padding: 0px;
}
```
### 1.3. NAVIGATION BAR
```css
/* LINKS */
.link-item{
    width: 180px;
    display: flex;
    align-items: center;
   
}
/* unvisited link */
.refLink{
    display: flex;
    letter-spacing: 2px;
    align-items: center;
    width: 230px;
    font-family: "Fira Mono", monospace;
    margin: 0px;
    color: #000;
    padding: 0px;
    text-decoration: none;
    height: 40px;
    font-weight: 700;
    justify-content: center;
    border-radius: 5px;
    text-align: center;
    background-color: #E8F0F6;
    border: solid 2px #323A42;
}
/* mouse over link */
.refLink:hover{
    background-color: #606060;
    color: #E8F0F6;
    text-decoration: underline;
}
/* link being clicked */
.refLink:active{
    background-color: #1F2529;
    color: #E8F0F6;
    text-decoration: underline;
}
/* selected link: the page currently being viewed. The class is added by
NavLink, so the marker follows the route rather than the mouse - :active would
only last while the link is being clicked. Listed after :hover and :active so it
wins on equal specificity */
.refLink.active{
    background-color: #323A42;
    color: #E8F0F6;
    text-decoration: underline;
    border: solid 3px #000;
}
```
### 1.4. LINKS
Links not found in the NavigationBar
```css
```
### 1.4. FORMS
````css
/* Form panal */
#panal{
  background-color: #9E9E9E;
  margin
  padding
}
/* Form */

form{
background-color: #A8AEB3;
margin: 0px;
padding: 0px;
}

.form-input-details{
      background-color: #BFBFBF;
  width: 80%;
  margin: 0px;
padding: 0px;
}
/* FORM GROUPS */
.form-group{
    border: solid #323A42 2px;
    background: #D6D6D6;
    border-radius: 8px;
}
/* GENERAL TEXT FORMAT */

#formHeading{
  color: #000000;
  font-family: "Roboto Condensed", sans-serif;
  font-weight: 700;
}

.label{
 color: #000000;
    font-weight: 700;
    margin: 0px;
    padding: 0px;
    font-family: "Fira Mono", monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.infoText{
  text-transform: uppercase;
    color: #444;
    text-align: center;
    margin: 0px;
    padding: 10px 0px;
    font-family: "Open Sans", sans-serif;
}
#requiredIcon{
  color: #C22419;
  font-family: "Open Sans", sans-serif;
  margin: 0px;
  letter-spacing: 1px;
  padding: 0px;
}
````
### 1.5. CALCULATOR/CURRENCY CONVERTER
### 1.6. DETAILS

### 1.7. CLOCK
### 1.8. BUTTONS
```css
#button,
#submitBtn,
#toggleButton{
   display: flex;
    align-items: center;
    justify-content: center;
    width: 180px;
    height: 40px;
    font-family: "Fira Mono", monospace;
    font-weight: 700;
    text-transform: uppercase;
    color: #000;
    margin: 0px;
    padding: 0px;
    border: solid 2px #323A42;
}
#button:hover,
#submitBtn:hover,
#toggleEditPswdBtn:hover{
    color: #E8F0F6;
    background-color: #323A42;
}
/* ACTIVE */
/* THE OPEN FORM'S BUTTON: selected on the aria-expanded Profile.js already sets
from showEditProfileForm and showEditPswdForm, rather than on :active, which only
lasts while the mouse button is held down and so left the open form unmarked as
soon as the button was released. Reading the same attribute the screen reader
does keeps the two from disagreeing, and no second class is needed to carry it.
Compounded with the id so it outranks the .btn-light rules Bootstrap applies to
the same buttons. Marked by more than colour alone - the border thickens and the
label is underlined - so the open form is still visible to a user who cannot
tell the two backgrounds apart. The buttons are sized in border-box, so the
thicker border does not shift the row */
#editUserToggleBtn[aria-expanded="true"],
#editPswdToggleBtn[aria-expanded="true"]{
    background-color: #323A42;
    color: #E8F0F6;
    border: solid 3px #000;
    text-decoration: underline;
}
```
---
## 2. BOOTSTRAP

### 2.1. INSTALLATION

```bash
npm install react-bootstrap bootstrap
```
### 2.2. BOOTSTRAP BREAKPOINTS
```css
<!-- Breakpoints -->
root {
    --bs-breakpoint-xs: 0;
    --bs-breakpoint-sm: 576px;
    --bs-breakpoint-md: 768px;
    --bs-breakpoint-lg: 992px;
    --bs-breakpoint-xl: 1200px;
    --bs-breakpoint-xxl: 1400px;
}

```
### 2.3. BOOTSTRAP COLOURS
```css
<!-- colours -->
    --bs-primary: #0d6efd;
    --bs-secondary: #6c757d;
    --bs-success: #198754;
    --bs-info: #0dcaf0;
    --bs-warning: #ffc107;
    --bs-danger: #dc3545;
    --bs-light: #f8f9fa;
    --bs-dark: #212529;

```

## 3. GOOGLE FONTS

### 3.1. IMPORT

`index.html`
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alkatra:wght@400..700&family=Fira+Mono:wght@400;500;700&family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
```

### 3.2. FONTS CSS CODE
#### Open Sans: CSS class for a variable style
```css
/* <weight>: Use a value from 300 to 800
 <uniquifier>: Use a unique and descriptive class name */
.open-sans {
  font-family: "Open Sans", sans-serif;
  font-weight: <weight>;
  font-style: normal;
}
```
#### Fira Sans: CSS classes
```css
/* 100-900 */
.fira-sans{
  font-family: "Fira Sans", sans-serif;
  font-style: italic
}


```
#### Alkatra: CSS class for a variable style
```css
/* <weight>: Use a value from 400 to 700 
<uniquifier>: Use a unique and descriptive class name */
.alkatra{
  font-family: "Alkatra", system-ui;
  font-optical-sizing: auto;
  font-weight: <weight>;/* <weight>: Use a value from 400 to 700 */
  font-style: normal;
}
```

#### Fira Mono: CSS classes
- buttons and 
- labels 
- form input, select, text-area e
```css
/* weight: 400, 500, 700 */
.fireMono{
  font-family: "Fira Mono", monospace;
}

```

#### Noto Serif: CSS class for a variable style

- used for error messages
```css
/* fontWeight: Use a value from 100 to 900
<uniquifier>: Use a unique and descriptive class name*/
.notoSerif{
  font-family: "Noto Serif", serif;
  font-style: normal;
  font-weight: <weight>;/* Use a value from 100 to 900 */
}
```
---
## 4. LUCIDE REACT

Lucide provides a React component library for using icons in your applications. Each icon is available as a standalone component that renders an optimized inline SVG.

### 4.1. INSTALLATION

```bash
npm install lucide-react
```

### 4.2. USAGE

Lucide-react usage example

```js
import { FileUser } from 'lucide-react';

const App = () => {
  return (
    <FileUser />
  );
};

export default App;
```
---
## 5. REFERENCES

- https://react-bootstrap.netlify.app/
- https://lucide.dev/guide/react/
- https://fonts.google.com/
- https://color.adobe.com/create/color-wheel
- https://www.w3schools.com/colors/colors_groups.asp
- https://www.w3schools.com/tags/ref_byfunc.asp
- https://www.w3schools.com/css/css_link.asp
- https://www.w3schools.com/css/css3_buttons.asp