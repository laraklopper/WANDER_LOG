// expenseData.js
/* The two enums an expense is stored with, and the list the parent budget's
categoryLimits keys are built from.

Kept here rather than typed into budgetSchema.js, because expenseRoutes.js has to
check a submission against exactly the same values before a document is built: a
category the schema would refuse is reported as a 400 with one clear message
instead of reaching Mongoose as a ValidationError. Two hand-maintained copies of
the same ten keys would only drift.

The client's own copy is EXPENSE_CATEGORIES and PAYMENT_METHODS in
data/financeData.js, which pairs each key with the label the form shows. The keys
themselves are what is stored, so those are the values the form submits. */

/* The ten expense categories, in the order the form lists them. These are also
the keys of categoryLimits on the parent budget, so an expense can always be
counted against a limit of its own category */
const EXPENSE_CATEGORIES = [
    'accommodation',
    'transport',
    'food',
    'activities',
    'shopping',
    'health',
    'visas',
    'insurance',
    'communication',
    'other',
];

/* How the money left the account. Stored in snake case, shown by the form in
upper case with the underscore as a space */
const PAYMENT_METHODS = [
    'cash',
    'credit_card',
    'debit_card',
    'crypto',
    'other',
];

module.exports = { EXPENSE_CATEGORIES, PAYMENT_METHODS };
