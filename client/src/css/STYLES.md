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
```
### 1.3. NAVIGATION BAR
### 1.4. FORMS

## 1.5. CALCULATOR/CURRENCY CONVERTER

## 1.6. DETAILS

## 1.7. BUTTONS
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

.open-sans-<uniquifier> {
  font-family: "Open Sans", sans-serif;
  font-optical-sizing: auto;
  font-weight: <weight>;
  font-style: normal;
  font-variation-settings:
    "wdth" 100;
}
```
#### Fira Sans: CSS classes
```css
.fira-sans-thin {
  font-family: "Fira Sans", sans-serif;
  font-weight: 100;
  font-style: normal;
}

.fira-sans-extralight {
  font-family: "Fira Sans", sans-serif;
  font-weight: 200;
  font-style: normal;
}

.fira-sans-light {
  font-family: "Fira Sans", sans-serif;
  font-weight: 300;
  font-style: normal;
}

.fira-sans-regular {
  font-family: "Fira Sans", sans-serif;
  font-weight: 400;
  font-style: normal;
}

.fira-sans-medium {
  font-family: "Fira Sans", sans-serif;
  font-weight: 500;
  font-style: normal;
}

.fira-sans-semibold {
  font-family: "Fira Sans", sans-serif;
  font-weight: 600;
  font-style: normal;
}

.fira-sans-bold {
  font-family: "Fira Sans", sans-serif;
  font-weight: 700;
  font-style: normal;
}

.fira-sans-extrabold {
  font-family: "Fira Sans", sans-serif;
  font-weight: 800;
  font-style: normal;
}

.fira-sans-black {
  font-family: "Fira Sans", sans-serif;
  font-weight: 900;
  font-style: normal;
}

.fira-sans-thin-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 100;
  font-style: italic;
}

.fira-sans-extralight-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 200;
  font-style: italic;
}

.fira-sans-light-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 300;
  font-style: italic;
}

.fira-sans-regular-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 400;
  font-style: italic;
}

.fira-sans-medium-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 500;
  font-style: italic;
}

.fira-sans-semibold-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 600;
  font-style: italic;
}

.fira-sans-bold-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 700;
  font-style: italic;
}

.fira-sans-extrabold-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 800;
  font-style: italic;
}

.fira-sans-black-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 900;
  font-style: italic;
}

```
#### Alkatra: CSS class for a variable style
```css

.alkatra-<uniquifier> {
  font-family: "Alkatra", system-ui;
  font-optical-sizing: auto;
  font-weight: <weight>;
  font-style: normal;
}
```

#### Fira Mono: CSS classes

```css
.fira-sans-thin {
  font-family: "Fira Sans", sans-serif;
  font-weight: 100;
  font-style: normal;
}

.fira-sans-extralight {
  font-family: "Fira Sans", sans-serif;
  font-weight: 200;
  font-style: normal;
}

.fira-sans-light {
  font-family: "Fira Sans", sans-serif;
  font-weight: 300;
  font-style: normal;
}

.fira-sans-regular {
  font-family: "Fira Sans", sans-serif;
  font-weight: 400;
  font-style: normal;
}

.fira-sans-medium {
  font-family: "Fira Sans", sans-serif;
  font-weight: 500;
  font-style: normal;
}

.fira-sans-semibold {
  font-family: "Fira Sans", sans-serif;
  font-weight: 600;
  font-style: normal;
}

.fira-sans-bold {
  font-family: "Fira Sans", sans-serif;
  font-weight: 700;
  font-style: normal;
}

.fira-sans-extrabold {
  font-family: "Fira Sans", sans-serif;
  font-weight: 800;
  font-style: normal;
}

.fira-sans-black {
  font-family: "Fira Sans", sans-serif;
  font-weight: 900;
  font-style: normal;
}

.fira-sans-thin-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 100;
  font-style: italic;
}

.fira-sans-extralight-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 200;
  font-style: italic;
}

.fira-sans-light-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 300;
  font-style: italic;
}

.fira-sans-regular-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 400;
  font-style: italic;
}

.fira-sans-medium-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 500;
  font-style: italic;
}

.fira-sans-semibold-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 600;
  font-style: italic;
}

.fira-sans-bold-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 700;
  font-style: italic;
}

.fira-sans-extrabold-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 800;
  font-style: italic;
}

.fira-sans-black-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 900;
  font-style: italic;
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
