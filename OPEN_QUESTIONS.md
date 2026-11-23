# Business Management Web Application — Open Questions

This document notes items where business specifications require clarification or where edge cases need confirmation.

---

### 1. Excess Payment on a Specific Bill
- **Context**: In SDD §7.12, the user can either leave the bill selection blank (system allocates to opening balance first, then chronologically to oldest unpaid bills) or select a specific bill.
- **Scenario**: If a user selects a specific bill with an outstanding balance of Rs 5,000, but enters a payment of Rs 8,000.
- **Question**: Should the excess Rs 3,000 automatically spill over into the next oldest unpaid bill (or opening balance), or should the form restrict the input amount to a maximum of the selected bill's balance (requiring a general payment for bulk amounts)?
- **Proposed Default**: Cap payment entry to the selected bill's balance when a specific bill is chosen. If the user wishes to pay more, they leave the bill selection blank to allow the automated chronological waterfall to allocate across multiple bills.

---

### 2. Unapplied Credit from Cancelled Delivered Orders
- **Context**: In SDD §8.14, cancelling a delivered order reverses the party balance, returns stock to original batches, and marks prior payments for that order as "unapplied credit on the party account".
- **Scenario**: A customer later orders new goods on credit.
- **Question**: Should unapplied credit automatically reduce the balance of the next delivered order, or should it sit as a credit entry on the ledger until manually applied through a credit adjustment/payment allocation action?
- **Proposed Default**: Unapplied credits reduce the party's total net balance immediately on the ledger. When a new order is delivered or payment allocated, unapplied credits can be applied in the payment allocation waterfall.

---

### 3. Fractional Piece Rate Rounding Display
- **Context**: Per SDD §6, money is stored as `NUMERIC(14,2)` and per-piece cost as `NUMERIC(14,4)`. A carton of 12 pieces costing Rs 1,000 has a piece cost of Rs 83.3333.
- **Scenario**: When selling loose pieces (e.g., 5 pieces of a 12-piece carton), $5 \times 83.3333 = 416.6665$.
- **Question**: Should the individual piece rate shown on the UI and invoice be rounded to 2 decimal places (e.g. Rs 83.33), with line total calculated as $5 \times 83.33 = 416.65$, or calculated using high precision and rounded at the line total level?
- **Proposed Default**: Display rates rounded to 2 decimal places for user clarity (`Rs 83.33`), and compute line total as $\text{Round}(Q_{pcs} \times R_{pcs}, 2)$ to ensure that $\text{Qty} \times \text{Displayed Rate} = \text{Line Total}$ matches customer invoice expectations.
