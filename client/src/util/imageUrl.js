// imageUrl.js
/* Turns a stored profilePicture value into something an <img src> can load.

The register and profile routes store an uploaded picture as a path such as
/uploads/profilePictures/1699-ab12.jpg rather than a full URL, so the value
keeps working if the API is later moved to another host or port. That path is
relative to the API, but an <img> resolves it against the page's own origin,
which in development is the React dev server on port 3000, so the API origin
has to be put back on the front here.

Older accounts, and the picture field on the edit form, can still hold a full
URL to a picture hosted elsewhere. Those are returned untouched */

// Same origin the fetch calls use. Set REACT_APP_API_URL to point at a deployed API
export const API_ORIGIN = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const profilePictureUrl = (value) => {
    const stored = String(value || '').trim();
    if (!stored) return '';// No picture set

    /* Anything already absolute, including a data: URI, is left as it is.
    Tested with a regex rather than startsWith so the scheme is matched at the
    very start of the string and case is ignored */
    if (/^(https?:|data:|blob:)/i.test(stored)) return stored;

    // A stored path always begins with a slash, but a missing one is tolerated
    return `${API_ORIGIN}${stored.startsWith('/') ? '' : '/'}${stored}`;
};
