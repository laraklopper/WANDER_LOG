// vatCalculator.js
/* SARS VAT maths (Value-Added Tax Act 89 of 1991), kept out of the route file so
/vat/calculate and /vat/save work the same figures out from the same inputs - a
saved record is always recomputed rather than trusting the figures the browser
sends.

VAT is NOT resolved from stored configuration the way income tax is. SARS
publishes it as a single flat rate rather than as a bracket table, so there is no
per-year VAT config to look up and the rate lives here as the one source of
truth. A future rate change (as nearly happened for 2025/2026) is a change to
SARS_VAT_RATE alone.

The calculation runs in one of two directions:

  EXCLUSIVE - the amount entered is the price BEFORE VAT, and VAT is added on
              top:            vat = net x rate,      gross = net + vat
  INCLUSIVE - the amount entered is the price AFTER VAT, and the VAT already in
              it is stripped back out:
                              net = gross / (1 + rate),  vat = gross - net

Dividing rather than taking 15% of the gross matters: 15% of an inclusive R115
is R17,25, but the VAT actually in it is R15. */

// The standard rate SARS levies VAT at, as a decimal
const SARS_VAT_RATE = 0.15;

/* The two directions a VAT calculation can run in. Exported so the route's
validation and the schema's enum cannot drift apart from the maths. */
const VAT_MODES = ['exclusive', 'inclusive'];

// Round a currency value to two decimals without accumulating float drift
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/*=============================
VAT CALCULATION
==============================*/
/* Works out the net, VAT and gross amounts for one item.

`isZeroRated` drops the rate to 0 rather than skipping the calculation, so a
zero-rated item still produces a full record: the net and gross are equal and
the VAT is nil, which is exactly what a zero-rated supply looks like on an
invoice. That is not the same as an exempt supply, which is outside the VAT net
altogether and is not modelled here. */
const calculateVat = ({ amount, mode = 'exclusive', isZeroRated = false }) => {
    // An unrecognised mode falls back to the commoner of the two rather than throwing
    const direction = VAT_MODES.includes(mode) ? mode : 'exclusive';
    const rate = isZeroRated ? 0 : SARS_VAT_RATE;

    let netAmount;
    let vatAmount;
    let grossAmount;

    if (direction === 'exclusive') {
        // The amount entered excludes VAT: add it on top
        netAmount = amount;
        vatAmount = netAmount * rate;
        grossAmount = netAmount + vatAmount;
    } else {
        /* The amount entered includes VAT: strip it back out. Guarded on a nil
        rate, which would otherwise divide by 1 for no reason and, on a
        zero-rated item, invite the wrong figure. */
        grossAmount = amount;
        netAmount = rate === 0 ? grossAmount : grossAmount / (1 + rate);
        vatAmount = grossAmount - netAmount;
    }

    return {
        mode: direction,
        isZeroRated: Boolean(isZeroRated),
        // The rate as a percentage, so the record says what it was worked out at
        ratePercent: round2(rate * 100),
        /* The figure the user actually typed, kept so the record can say which
        of the two amounts below was the input and which was derived */
        enteredAmount: round2(amount),
        netAmount: round2(netAmount),
        vatAmount: round2(vatAmount),
        grossAmount: round2(grossAmount),
    };
};

module.exports = {
    calculateVat,
    SARS_VAT_RATE,
    VAT_MODES,
};