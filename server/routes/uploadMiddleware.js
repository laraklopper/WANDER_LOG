// uploadMiddleware.js
/* Multer setup for the profile picture upload.
Kept in its own module because it owns a folder on disk and a set of file
rules, rather than the request checks the rest of middleware.js does */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

/* Uploads live outside the code folders so nothing here is ever treated as a
module. app.js serves this same folder as static files, which is how the
browser later fetches the saved picture */
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const PROFILE_PICTURE_DIR = path.join(UPLOAD_ROOT, 'profilePictures');

/* Multer will not create the destination itself: if the folder is missing
every upload fails with ENOENT, so it is made once at import time */
fs.mkdirSync(PROFILE_PICTURE_DIR, { recursive: true });

// The largest picture accepted, in bytes
const MAX_FILE_SIZE = 2 * 1024 * 1024;// 2MB

/* Only these types are stored. The map is keyed by MIME type so the extension
written to disk is chosen here, from a fixed list, and never taken from the
name the browser sent */
const ALLOWED_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
};

// Human readable version of the list above, used in the error messages
const ALLOWED_LABEL = 'JPG, PNG, WEBP or GIF';

/* Files are written to disk rather than held in memory, so a large upload is
never buffered into the process and the saved file survives a restart */
const storage = multer.diskStorage({
    // Where the file is written
    destination: (req, file, cb) => cb(null, PROFILE_PICTURE_DIR),
    /* The stored name is generated, not taken from file.originalname, which is
    attacker controlled and could contain path segments such as ../ */
    filename: (req, file, cb) => {
        const extension = ALLOWED_TYPES[file.mimetype] || '';
        const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
        cb(null, uniqueName);
    },
});

/* Runs before the file is written, so a rejected type is never stored.
cb(null, false) would drop the file silently, so an error is passed instead
and reported to the user as a 400 by handleUploadError below */
const fileFilter = (req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
        console.warn(`[WARN: uploadMiddleware.js] Rejected file type: ${file.mimetype}`);
        return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'profilePicture'));
    }
    return cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    /* fileSize is enforced while the stream is read, so an oversized upload is
    aborted part way instead of being written in full and then checked */
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

/* Accepts one optional file from the input named profilePicture.
Any text fields sent alongside it end up in req.body as strings, and the file
itself in req.file. Must run before any middleware that reads req.body,
because nothing parses a multipart body until this has */
const uploadProfilePicture = upload.single('profilePicture');

/* Multer reports its own failures through next(error), which would otherwise
reach the handler in app.js and be returned as a generic 500. Wrapping it here
turns those into a 400 carrying both a message and a field keyed errors object,
the same shape the register and edit routes use for a Mongoose
ValidationError, so either form can show it against the file input */
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        const message =
            error.code === 'LIMIT_FILE_SIZE'
                ? 'Profile picture must be 2MB or smaller'
                : `Profile picture must be an image file (${ALLOWED_LABEL})`;

        console.error(`[ERROR: uploadMiddleware.js] Upload failed (${error.code}): ${message}`);
        return res.status(400).json({
            message,
            errors: { profilePicture: message },
        });
    }
    return next(error);// Anything that is not an upload problem is passed along untouched
};

/* Turns the saved file into the value stored on the user document.
A path is returned rather than a full URL so the stored value keeps working if
the API is later moved to another host or port */
const profilePicturePath = (file) =>
    file ? `/uploads/profilePictures/${file.filename}` : null;

/* Multer writes the file to disk before any of the checks further down the
chain run, so a registration rejected for an unrelated reason, such as a taken
username, would leave a picture on disk belonging to no account.

Listening on the response rather than cleaning up in each failure branch means
one hook covers every one of them, including the rate limiter and the age and
password middleware, which return without the route ever being reached */
const discardUploadOnFailure = (req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode < 400 || !req.file) return;
        fs.promises.unlink(req.file.path).catch((error) =>
            console.warn(`[WARN: uploadMiddleware.js] Could not remove ${req.file.filename}: ${error.message}`)
        );
    });
    return next();
};

/* Deletes the file a profilePicture value points at, used when a picture is
replaced or removed so old uploads do not pile up in the folder.

Only a value this module itself produced is acted on: anything else, such as an
account whose picture is a link to another site, is left alone. The name is
then checked on its own with path.basename, so a stored value containing path
segments could not reach a file outside the uploads folder */
const removeStoredPicture = (storedValue) => {
    const value = String(storedValue || '');
    const prefix = '/uploads/profilePictures/';

    if (!value.startsWith(prefix)) return;// A remote URL, or no picture at all

    const fileName = path.basename(value.slice(prefix.length));
    if (!fileName || fileName === '.' || fileName === '..') return;

    /* A missing file is not worth reporting: it only means the picture was
    already gone, which is the state this function is trying to reach */
    fs.promises.unlink(path.join(PROFILE_PICTURE_DIR, fileName)).catch((error) => {
        if (error.code === 'ENOENT') return;
        console.warn(`[WARN: uploadMiddleware.js] Could not remove ${fileName}: ${error.message}`);
    });
};

//EXPORT
module.exports = {
    UPLOAD_ROOT,
    uploadProfilePicture,
    handleUploadError,
    profilePicturePath,
    discardUploadOnFailure,
    removeStoredPicture,
};
