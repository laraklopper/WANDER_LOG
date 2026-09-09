// userRoutes.js
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const User = require('../models/userSchema');
/* Everything an account owns, required here so the delete below can clear up
after the user rather than leaving records behind with no account to reach them
through. The schemas do not cascade a delete of their own */
const Trip = require('../models/tripSchema');
const Entry = require('../models/entrySchema');
const Budget = require('../models/budgetSchema');
const Vat = require('../models/vatSchema');
const Conversion = require('../models/currConverterSchema');
const { checkJwtToken, checkAdmin, checkPassword } = require('./middleware');
const router = express.Router()

/* A password change has to be told the current password, which makes it a
guessing target in the same way the login endpoint is. The quota is per IP and
matches the one on /auth/login, so a stolen token cannot be used to work out the
password behind it */
const editPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,// 15 minute window
    max: 10,// 10 attempts per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    /* Only a failed attempt is a guess. Without this a user who changes their
    password legitimately spends part of the quota, and a household behind one
    IP could lock each other out of the endpoint */
    skipSuccessfulRequests: true,
    message: { message: 'Too many password change attempts, please try again in 15 minutes' },
});

/* Route to GET the currently logged in user.
This is the endpoint the React app calls after login, and on every reload, to
turn the stored token back into a user object.

checkJwtToken assigns the DECODED TOKEN to req.user, not a loaded account, so the
account is looked up here on the id signToken put in the payload. The document is
what carries toPublicJSON, which strips the password before the response. */
router.get('/me', checkJwtToken, async (req, res) => {
    try {
        const user = await User.findById(req.user?.userId).exec();

        /* Conditional rendering to check the user on the token still exists: a
        deleted account leaves a token that still verifies, and a 401 tells the
        client to end the session rather than reporting a server fault */
        if (!user) {
            console.warn('[WARN: userRoutes.js "/me"] No user found for id', req.user?.userId);
            return res.status(401).json({ message: 'Invalid token. Please login again.' });
        }

        return res.status(200).json(user.toPublicJSON());
    } catch (error) {
        console.error('[ERROR: userRoutes.js "/me"]:', error.message);//Log an error message in the console for debugging purposes
        return res.status(500).json({ message: 'Internal server Error' });
    }
});

/* Route to GET all users*/
router.get('/findUsers', checkJwtToken, async (req, res) => {
    try {
        const { username } = req.query;// Extract the username from the query parameters
        // If a username is provided, use it to filter users, otherwise return all users
        const query = username ? { username } : {};
        const users = await User.find(query); // Fetch users based on the query object

        /* The password is already excluded by select: false on the schema, and the
        toJSON transform strips it again, so the documents are safe to return */
        return res.status(200).json(users.map((user) => user.toPublicJSON()));// Send the list of users as the response
    }
    catch (error) {
        console.error('[ERROR: userRoutes.js "/findUsers"]:', error.message);//Log an error message in the console for debugging purpose
        return res.status(500).json(// Send 500(Internal server error) status code and error message in JSON response
            { message: 'Internal server Error' }
        );
    }
})

/*──────────────────────────── PATCH ROUTES ─────────────────────────────
    PATCH: Used to change part of an existing resource
 ─────────────────────────────────────────────────────────────────────────*/
/* Route to PATCH the password of one account.
The path is the same shape as /:id/editUser below, which is the one the React
app calls, so both edit requests from the profile page address a user the same way.

checkPassword runs before the handler and already reads newPassword, so a weak
password is rejected as a 400 before the database is touched. It is also placed
before the limiter, so a password the form should have caught does not spend an
attempt from the guessing quota */
router.patch('/:id/editPassword', checkJwtToken, checkPassword, editPasswordLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body || {};

        /* checkJwtToken assigns the decoded token, not a loaded account, so the
        id comes from the payload that signToken put there */
        const requesterId = req.user?.userId;

        // Conditional rendering to check that the current password was sent
        if (!currentPassword) {
            return res.status(400).json({ message: 'Current password is required' });
        }

        /* Checked before the lookup, otherwise a malformed id reaches Mongoose as
        a CastError and is reported as a 500 instead of a 400 */
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        /* An account may only change its own password. Without this any logged in
        user could aim the route at another id, and the token would still pass.
        Admins are not exempt: they have no need to change a password through this
        endpoint, and allowing it would turn the admin flag into a way to take over
        an account */
        if (String(requesterId) !== String(id)) {
            console.warn(`[WARN: userRoutes.js "/:id/editPassword"] ${requesterId} tried to change the password of ${id}`);
            return res.status(403).json({ message: 'You may only change your own password' });
        }

        // select('+password') is needed because the field is select: false
        const user = await User.findById(id).select('+password');

        //Conditional rendering to check that the account still exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        /* The current password is confirmed even though the token is already
        valid, so that a token taken from a shared machine is not enough on its own
        to lock the owner out of their account */
        if (!(await user.comparePassword(currentPassword))) {
            console.warn(`[WARN: userRoutes.js "/:id/editPassword"] Incorrect current password for ${user.username}`);
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Nothing to do, and saying so is clearer than reporting a success that changed nothing
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from the current password' });
        }

        /* Both fields are set because confirmPassword is required by the schema and
        its validator compares it against password. The pre('save') hook then clears
        confirmPassword and replaces password with a bcrypt hash */
        user.password = newPassword;
        user.confirmPassword = newPassword;

        await user.save();

        console.info(`[SUCCESS: userRoutes.js "/:id/editPassword"] ${user.username} changed their password`);
        return res.status(200).json({
            message: 'Password updated successfully',
            user: user.toPublicJSON(),
        });
    } catch (error) {
        /* The length rules on the password field are checked against the plain text
        value, so a value checkPassword let through can still fail here */
        if (error.name === 'ValidationError') {
            const errors = Object.fromEntries(
                Object.entries(error.errors).map(([field, err]) => [field, err.message])
            );
            console.error('[ERROR: userRoutes.js "/:id/editPassword"] Validation failed:', errors);
            return res.status(400).json({ message: 'Password update failed', errors });
        }

        console.error('[ERROR: userRoutes.js "/:id/editPassword"]:', error.message);//Log an error message in the console for debugging purposes
        return res.status(500).json({ message: 'Internal server Error' });
    }
});

/* Route to PATCH the profile details of one account.
Only the five fields the edit form owns are read from the body. Everything else
is ignored, so adding "admin": true, "password" or "entries" to the JSON cannot
escalate the account or overwrite the stored hash */
router.patch('/:id/editUser', checkJwtToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, fullName, email, address, profilePicture } = req.body || {};

        /* checkJwtToken assigns the decoded token, not a loaded account, so the
        id comes from the payload that signToken put there */
        const requesterId = req.user?.userId;

        /* Checked before the lookup, otherwise a malformed id reaches Mongoose as
        a CastError and is reported as a 500 instead of a 400 */
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        /* An account may only edit its own profile. Without this any logged in
        user could aim the route at another id, and the token would still pass.
        Admins are not exempt, for the same reason as on the password route */
        if (String(requesterId) !== String(id)) {
            console.warn(`[WARN: userRoutes.js "/:id/editUser"] ${requesterId} tried to edit the profile of ${id}`);
            return res.status(403).json({ message: 'You may only edit your own profile' });
        }

        // password and confirmPassword are select: false, so neither is loaded here
        const user = await User.findById(id);

        //Conditional rendering to check that the account still exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        /* Normalised the same way the schema stores them, so the comparison below
        does not report a clash between a value and its own untrimmed form */
        const newUsername = username == null ? undefined : String(username).trim();
        const newEmail = email == null ? undefined : String(email).trim().toLowerCase();

        /* username and email are unique. Only the ones actually being changed are
        looked up, so a user resubmitting their own details does not clash with
        their own record */
        const clashes = [];
        if (newUsername && newUsername !== user.username) clashes.push({ username: newUsername });
        if (newEmail && newEmail !== user.email) clashes.push({ email: newEmail });

        if (clashes.length > 0) {
            /* $or, not an implicit AND: an account clashes if EITHER field is
            already taken. _id is excluded so the user's own record never matches */
            const existingUser = await User.findOne({ _id: { $ne: id }, $or: clashes });

            if (existingUser) {
                // Named precisely so the form can tell the user which field to change
                const takenField = existingUser.username === newUsername ? 'Username' : 'Email';
                console.warn(`[WARN: userRoutes.js "/:id/editUser"] ${takenField} already registered`);
                return res.status(409).json({ message: `${takenField} is already registered` });
            }
        }

        /* Each field is applied only when the client sent it, so this stays a
        PATCH: a body carrying one field leaves the other four alone */
        if (newUsername !== undefined) user.username = newUsername;
        if (newEmail !== undefined) user.email = newEmail;

        if (fullName && typeof fullName === 'object') {
            if (fullName.firstName !== undefined) user.fullName.firstName = fullName.firstName;
            if (fullName.lastName !== undefined) user.fullName.lastName = fullName.lastName;
        }

        if (address && typeof address === 'object') {
            /* Listed rather than looped over Object.keys(address), so a key that is
            not part of the address cannot be written onto the document */
            for (const field of ['line1', 'line2', 'city', 'province']) {
                if (address[field] !== undefined) user.address[field] = address[field];
            }
        }

        /* Clearing the picture is a real edit, and the form sends null to do it,
        so an absent key is the only value that means "leave this one alone" */
        if (profilePicture !== undefined) user.profilePicture = profilePicture;

        /* Saying nothing changed is clearer than reporting a success the user
        cannot see. The setters on the schema have already run by this point, so a
        blank line2 resubmitted as '' is correctly counted as unchanged */
        if (!user.isModified()) {
            return res.status(400).json({ message: 'No changes to save' });
        }

        /* save() rather than findByIdAndUpdate, so the schema validators and the
        setters on profilePicture and address.line2 both run */
        await user.save();

        console.info(`[SUCCESS: userRoutes.js "/:id/editUser"] ${user.username} updated their profile`);
        return res.status(200).json({
            message: 'Profile updated successfully',
            user: user.toPublicJSON(),
        });
    } catch (error) {
        /* Mongoose collects every failed field rule into one ValidationError.
        They are returned as a 400 with a field keyed object so the edit form can
        show each message next to the input that caused it */
        if (error.name === 'ValidationError') {
            const errors = Object.fromEntries(
                Object.entries(error.errors).map(([field, err]) => [field, err.message])
            );
            console.error('[ERROR: userRoutes.js "/:id/editUser"] Validation failed:', errors);
            return res.status(400).json({ message: 'Profile update failed, please check the highlighted fields', errors });
        }

        /* Duplicate key error from the unique indexes on username and email.
        Reachable when two requests claim the same details at the same time,
        after the findOne check above has already passed for both */
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'Account';
            console.error(`[ERROR: userRoutes.js "/:id/editUser"] Duplicate ${field}`);
            return res.status(409).json({ message: `That ${field} is already registered` });
        }

        console.error('[ERROR: userRoutes.js "/:id/editUser"]:', error.message);//Log an error message in the console for debugging purposes
        return res.status(500).json({ message: 'Internal server Error' });
    }
});

/*──────────────────────────── DELETE ROUTES ───────────────────────────────────
    DELETE: Used to remove an item from the database
 ────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE A USER
=======================================*/
/* users/:id/deleteUser - Removes one account and everything filed against it.

Admin only, so the path is the same shape as the two PATCH routes above but the
rule behind it is the opposite: those let an account act on itself alone, while
this lets an admin act on another account and never on their own. checkAdmin
loads the acting account rather than reading the admin flag off the token, so a
demoted admin cannot keep using a token that still claims the rights.

Two accounts are refused outright, matching what the users page tells the admin:

- the acting admin's own account, which would end the session that is deleting
  it and leave the app holding a token for a user that no longer exists
- any other admin, so the last admin cannot be removed and no admin can be
  locked out of the system by another

Nothing an account owns outlives it: the schemas do not cascade a delete, so a
user removed on their own would leave trips, journal entries, budgets and saved
calculations stored against an id that no longer resolves to anybody. All of it
is cleared here, and the account itself goes last, so a failure part way through
leaves the user in place to be deleted again rather than leaving orphaned
records with no account to reach them through. */
router.delete('/:id/deleteUser', checkJwtToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Loaded by checkAdmin, so the acting account does not have to be fetched again
        const requester = req.adminUser;

        /* Checked before the lookup, otherwise a malformed id reaches Mongoose as
        a CastError and is reported as a 500 instead of a 400 */
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.warn('[WARN: userRoutes.js "/:id/deleteUser"] Invalid user id', id);// Log a warning message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'That user id is not valid' });// Respond with a 400 (Bad Request) status code
        }

        /* An admin may not delete their own account. Checked before the lookup,
        because the answer does not depend on the stored document, and refused
        rather than allowed so the request cannot end the session carrying it */
        if (String(requester._id) === String(id)) {
            console.warn(`[WARN: userRoutes.js "/:id/deleteUser"] ${requester.username} tried to delete their own account`);// Log a warning message in the console for debugging purposes
            return res.status(403).json({ success: false, message: 'You cannot delete your own account' });// Respond with a 403 (Forbidden) status code
        }

        // password and confirmPassword are select: false, so neither is loaded here
        const user = await User.findById(id).exec();

        //Conditional rendering to check that the account exists
        if (!user) {
            console.warn('[WARN: userRoutes.js "/:id/deleteUser"] No user found for id', id);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'That user could not be found' });// Respond with a 404 (Not Found) status code
        }

        /* Admin accounts are not removable through this route, which is what the
        users list reports on the table footer. Read off the stored document
        rather than anything the client sent, so the flag cannot be talked around */
        if (user.admin) {
            console.warn(`[WARN: userRoutes.js "/:id/deleteUser"] ${requester.username} tried to delete the admin account ${user.username}`);// Log a warning message in the console for debugging purposes
            return res.status(403).json({ success: false, message: 'Admin users cannot be removed' });// Respond with a 403 (Forbidden) status code
        }

        /* Read before anything is removed, because an expense is a sub-document
        of its trip's budget rather than a model of its own: once the budgets are
        gone there is nothing left to count the expenses from */
        const budgets = await Budget.find({ userId: user._id }).select('expenses').lean().exec();
        const expenseCount = budgets.reduce((total, budget) => total + (budget.expenses?.length ?? 0), 0);

        /* Requested together because none of them needs another's answer, and
        each filtered on the owner so only this account's records are touched.
        The two calculation histories store the owner as `user` rather than as
        `userId`, the field name their own schemas use */
        const [removedEntries, removedBudgets, removedTrips, removedVat, removedConversions] = await Promise.all([
            Entry.deleteMany({ userId: user._id }).exec(),
            Budget.deleteMany({ userId: user._id }).exec(),
            Trip.deleteMany({ userId: user._id }).exec(),
            Vat.deleteMany({ user: user._id }).exec(),
            Conversion.deleteMany({ user: user._id }).exec(),
        ]);

        const entryCount = removedEntries?.deletedCount ?? 0;
        const budgetCount = removedBudgets?.deletedCount ?? 0;
        const tripCount = removedTrips?.deletedCount ?? 0;
        const vatCount = removedVat?.deletedCount ?? 0;
        const conversionCount = removedConversions?.deletedCount ?? 0;

        /* What went with the account, listed for the message below. Each is left
        out when there was none of it, so an account that registered and never
        used the app is reported as the account on its own */
        const alsoRemoved = [
            tripCount ? `${tripCount} trip${tripCount === 1 ? '' : 's'}` : null,
            entryCount ? `${entryCount} journal ${entryCount === 1 ? 'entry' : 'entries'}` : null,
            budgetCount ? `${budgetCount} budget${budgetCount === 1 ? '' : 's'}` : null,
            expenseCount ? `${expenseCount} expense${expenseCount === 1 ? '' : 's'}` : null,
            vatCount ? `${vatCount} saved VAT calculation${vatCount === 1 ? '' : 's'}` : null,
            conversionCount ? `${conversionCount} saved conversion${conversionCount === 1 ? '' : 's'}` : null,
        ].filter(Boolean);

        /* Deleted last, so the account is only gone once everything stored
        against it is. A failure above leaves the user listed and the delete can
        be run again, which is recoverable in a way an orphaned record is not */
        await User.findByIdAndDelete(user._id).exec();

        console.info(`[SUCCESS: userRoutes.js "/:id/deleteUser"] ${requester.username} deleted ${user.username} with ${tripCount} trip(s), ${entryCount} entry(s), ${budgetCount} budget(s), ${expenseCount} expense(s), ${vatCount} VAT calculation(s) and ${conversionCount} conversion(s)`);// Log a success message in the console for debugging purposes
        return res.status(200).json({
            success: true,
            /* Names what went with the account rather than reporting the user
            alone, because the records removed with it are not on screen and the
            admin has no other way of seeing what the delete reached */
            message: alsoRemoved.length
                ? `${user.username} was deleted successfully, along with ${alsoRemoved.join(', ')}.`
                : `${user.username} was deleted successfully.`,
            /* Returned so the client can drop the row and close any panel open
            on this user without waiting on a refetch to learn which one went */
            userId: id,
            username: user.username,
            removedTrips: tripCount,
            removedEntries: entryCount,
            removedBudgets: budgetCount,
            removedExpenses: expenseCount,
            removedVatCalculations: vatCount,
            removedConversions: conversionCount,
        });// Respond with a 200 (OK) status code and what was removed
    } catch (error) {
        console.error('[ERROR: userRoutes.js "/:id/deleteUser"]:', error.message);//Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal server Error' });// Respond with a 500 (Internal Server Error) status code
    }
});

module.exports = router
