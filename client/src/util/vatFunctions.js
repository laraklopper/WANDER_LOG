// vatFunctions.js
//===========================================================================
// SAVED VAT CALCULATIONS (VatCalculations.js)
//===========================================================================
// Shown in place of any detail a record does not carry
export const NOT_AVAILABLE = 'NOT AVAILABLE'
/* Which direction a stored VAT calculation ran in. The schema stores the mode
the maths works in ('exclusive' or 'inclusive'), which says nothing on its own
about what was done, so these describe it as the calculator form offered it. */
const VAT_MODE_LABELS = {
    exclusive: 'VAT ADDED (EXCL. TO INCL.)',
    inclusive: 'VAT REMOVED (INCL. TO EXCL.)'
}

// Label a stored VAT mode, falling back to the raw value for an unknown one
export const toVatMode = (mode) =>
    VAT_MODE_LABELS[mode] || (mode ? String(mode).toUpperCase() : NOT_AVAILABLE)

/* The short label for the same mode, e.g. VAT ADDED. Used in the table, where
the full description is more than the column needs. */
export const toVatModeLabel = (mode) => {
    if (mode === 'exclusive') return 'VAT ADDED'
    if (mode === 'inclusive') return 'VAT REMOVED'
    return mode ? String(mode).toUpperCase() : NOT_AVAILABLE
}

/* The amount the user actually typed: the net amount where VAT was added on top
and the gross where it was stripped back out. Exposed as a virtual by the VAT
schema, so it arrives on the record; it is recomputed here only as a fallback. */
export const enteredAmountOf = (calculation) => {
    if (typeof calculation?.enteredAmount === 'number') return calculation.enteredAmount
    if (calculation?.mode === 'inclusive') {
        return typeof calculation.grossAmount === 'number' ? calculation.grossAmount : null
    }
    return typeof calculation?.netAmount === 'number' ? calculation.netAmount : null
}

/* How a stored calculation's rate is described. A zero-rated item is called out
by name rather than shown as a bare 0%, because a nil rate and an item that was
never rated look the same as a figure. */
export const toVatRate = (calculation) => {
    if (typeof calculation?.ratePercent !== 'number' || isNaN(calculation.ratePercent)) return NOT_AVAILABLE
    if (calculation.isZeroRated) return '0% (ZERO-RATED)'
    return `${calculation.ratePercent.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}%`
}
export const SARS_VAT_RATE = 0.15;
export const ZERO_RATED_CATEGORIES = [
  'Brown bread',
  'Maize meal',
  'Rice',
  'Vegetables',
  'Fruit',
  'Milk',
  'Eggs',
  'Vegetable oil',
  'Dried beans',
  'Lentils',
  'Paraffin',
  'Brown wheaten meal',
  'Pilchards/sardinella in tins',
];