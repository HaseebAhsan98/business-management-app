# Business Management Web Application — Business Logic & Calculations

This document details the business logic, formulas, algorithms, and 22 business rules governing the wholesale/distribution application.

---

## 1. The 22 Core Business Rules (SDD §8)

1. **Order & Payment Status Lifecycle**:
   - Order delivery statuses: `PENDING`, `DELIVERED`, `CANCELLED`.
   - Order payment statuses: `UNPAID`, `PARTIAL`, `PAID` (derived automatically from balance).
2. **Stock Deduction & Reservation**:
   - Stock deduction occurs strictly upon transition to `DELIVERED`.
   - `PENDING` orders hold a reservation:
     $$\text{Available Stock} = \text{On Hand Stock} - \text{Reserved Stock}$$
3. **FIFO Stock Batch Tracking**:
   - Delivered items deduct quantity from the chronologically oldest active batches (`purchase_items`).
   - If the oldest batch has insufficient quantity, the allocation spans subsequent batches until satisfied.
   - Batch allocations are permanently recorded in `order_item_batches` to enable exact returns upon edit or cancellation.
4. **Cost and Profit Basis**:
   - Default basis: **Latest Purchase Rate** of the product at the exact moment the order is delivered:
     $$\text{Line Cost} = \text{Quantity} \times \left( \frac{\text{Latest Purchase Rate}}{\text{Pieces Per Carton}} \right)$$
     $$\text{Line Profit} = \text{Line Total} - \text{Line Cost}$$
   - Pending orders display provisional profit using current latest purchase rate.
   - On delivery, the rate is locked and stored. Subsequent purchases never modify past profit.
   - A global setting enables switching reports to **FIFO Real Batch Cost** basis.
5. **Rate Snapshot Integrity**:
   - Each order line stores the executed rate on that day. Future product price changes never alter old orders or bills.
6. **Purchase Batches & Opening Stock**:
   - Each purchase line creates an independent batch retaining its cost rate.
   - Opening stock is entered as a purchase of type `OPENING`, creating the initial batch and establishing the baseline purchase rate.
   - If a product has no purchase history, its standard sale rate is suggested; profit is marked "not known" (it cannot be sold without available stock).
7. **Customer Running Balance**:
   $$\text{Current Balance} = \text{Opening Balance} + \sum \text{Delivered Order Totals} - \sum \text{Payments Received} \pm \text{Adjustments}$$
   - Credit orders increase the balance upon delivery.
8. **Due Date Calculation**:
   $$\text{Due Date} = \text{Delivery Date} + \text{Credit Days}$$
   - A bill is overdue when $\text{Today} > \text{Due Date}$ and $\text{Balance} > 0$.
9. **Partial Payments & Opening Balance Priority**:
   - Customers can make multiple partial payments on any schedule (even multiple on the same day).
   - Payments without an explicitly selected bill allocate to the **opening balance first** (treated as the oldest debt), then to the oldest unpaid delivered bills.
   - Balance after payment:
     $$\text{Balance After} = \text{Balance Before} - \text{Payment Amount}$$
10. **Credit Days Limit & Overdue Warnings**:
    - Each party has an allowed credit duration (e.g. 15 days; 0 indicates cash-only). There is no credit amount ceiling.
    - Two warning scenarios:
      a. An order specifies credit days exceeding the party's limit.
      b. The party has any overdue unpaid bills ($\text{Today} > \text{Due Date}$).
    - **Enforcement**: Owner and Manager can proceed by entering an override reason; Salesman is strictly blocked.
11. **Customer Pricing Waterfall**:
    When a product is selected in an order, the suggested selling rate is determined in the following strict precedence:
    1. **Customer Fixed Rate**: `customer_price_rules` where `rule_type = 'FIXED_RATE'`.
    2. **Customer Product Profit on Cost**: $\text{Latest Purchase Rate} + \text{Rule Amount}$ (`rule_type = 'PROFIT_ON_COST'`).
    3. **Customer Default Profit on Cost**: $\text{Latest Purchase Rate} + \text{Customer Default Profit Per Carton}$.
    4. **Standard Product Sale Rate**: Product's `sale_rate_carton`.
    - User with appropriate permissions may manually overwrite the suggested rate on any order line.
12. **Stock Shortage Blocking**:
    - An order line requesting more than Available Stock is rejected for all users:
      $$\text{Line Qty (pieces)} \le \text{Available Qty (pieces)}$$
    - No user (including Owner) can override stock shortage. Fresh stock must be added via purchase or opening stock.
13. **Order Editing Logic**:
    - Editing `PENDING` orders is unrestricted.
    - Editing `DELIVERED` orders requires an override reason. The system reverses prior FIFO batch deductions, returns stock, recalculates balances, applies new line items, executes fresh FIFO deductions, updates profit, and logs the change to `audit_logs`.
14. **Order Cancellation Logic**:
    - Cancelling a delivered order returns all stock to the exact batches recorded in `order_item_batches`, reverses the party balance, and marks any associated payments as unapplied customer credit.
15. **One Account Per Party**:
    - Parties are uniquely identified by `party_code` (e.g. `P-0123`).
    - Phone number is optional; if provided, it must be unique.
    - Multiple parties may share the same business name only if located in distinct areas.
16. **Party Merging (Owner Only)**:
    - Merging Account B into Account A consolidates all orders, payments, running balances, and price rules under Account A.
    - Account B is marked `is_active = FALSE`, `merged_into_id = Account A.id`, and hidden from order entry.
    - The operation is immutably logged in `audit_logs`.
17. **Salesman Ownership**:
    - Orders store both `salesman_id` (the rep credited for the sale) and `created_by` (the user entering the record).
    - When Owner/Manager enters a paper slip on behalf of a rep, `salesman_id` is set to the rep, properly attributing sales and commissions.
18. **No Hard Deletion**:
    - Deletions are forbidden. Inactive products/parties have `is_active = FALSE`. Cancelled transactions are marked `status = 'CANCELLED'`.
19. **Stock Movements Audit Trail**:
    - Every stock modification (purchase, sale delivery, edit reversal, cancellation, manual adjustment) logs an entry in `stock_movements`.
    - Physical stock on hand equals the net sum of `stock_movements.qty_pieces`.
20. **Sequential Identifiers**:
    - Orders: `ORD-YYYY-NNNNNN`
    - Purchases: `PUR-YYYY-NNNNNN`
    - Receipts: `RCT-YYYY-NNNNNN`
21. **Salesman Role Privacy**:
    - Salesman role cannot view purchase rates, product unit costs, profit margins, or totals belonging to other salesmen.
22. **Timezone & Currency**:
    - Currency: Pakistani Rupee (PKR / Rs).
    - Date format: `DD-MM-YYYY`.
    - Timestamps stored in UTC, converted and displayed in `Asia/Karachi`.

---

## 2. Mathematical Calculations & Algorithms

### 2.1 Carton vs Piece Calculations
Products have an integer configuration `pieces_per_carton` ($C_{pcs}$).
- If entered in Cartons ($Q_{ctn}$):
  $$\text{Quantity in Pieces } (Q_{pcs}) = Q_{ctn} \times C_{pcs}$$
  $$\text{Rate per Piece } (R_{pcs}) = \frac{R_{ctn}}{C_{pcs}}$$
  $$\text{Line Total} = Q_{ctn} \times R_{ctn} = Q_{pcs} \times R_{pcs}$$
- If entered in Pieces ($Q_{pcs}$):
  $$\text{Rate per Piece } (R_{pcs}) = \frac{R_{ctn}}{C_{pcs}}$$
  $$\text{Line Total} = Q_{pcs} \times R_{pcs}$$

### 2.2 Order Totals
$$\text{Subtotal} = \sum_{i=1}^{n} \text{Line Total}_i$$
$$\text{Total} = \text{Subtotal} - \text{Discount}$$
$$\text{Balance} = \text{Total} - \text{Amount Paid}$$

### 2.3 Delivery FIFO Allocation Algorithm
```
Input: Order Item (product_id, qty_pieces_needed)
Let remaining_needed = qty_pieces_needed

Batches = Query active purchase_items for product_id 
          WHERE qty_remaining_pieces > 0 
          ORDER BY purchase_date ASC, created_at ASC

FOR EACH batch IN Batches:
    IF remaining_needed == 0 THEN BREAK
    
    take = MIN(remaining_needed, batch.qty_remaining_pieces)
    batch.qty_remaining_pieces -= take
    
    INSERT INTO order_item_batches (order_item_id, purchase_item_id, qty_pieces, unit_cost)
    VALUES (order_item.id, batch.id, take, batch.unit_cost_per_piece)
    
    INSERT INTO stock_movements (product_id, movement_type='SALE', qty_pieces=-take, batch_id=batch.id)
    
    remaining_needed -= take

IF remaining_needed > 0 THEN
    ROLLBACK TRANSACTION (Error: Insufficient stock)
```

### 2.4 Customer Payment Allocation Waterfall Algorithm
```
Input: Customer Payment (customer_id, payment_amount)
Let unallocated = payment_amount

-- 1. Opening Balance
Customer = Query customer WHERE id = customer_id
IF Customer.opening_balance_remaining > 0 THEN
    apply = MIN(unallocated, Customer.opening_balance_remaining)
    Customer.opening_balance_remaining -= apply
    INSERT INTO payment_allocations (payment_id, applied_to='OPENING_BALANCE', amount=apply)
    unallocated -= apply

-- 2. Delivered Orders Chronologically
IF unallocated > 0 THEN
    Orders = Query orders WHERE customer_id = customer_id 
             AND delivery_status = 'DELIVERED' 
             AND balance > 0 
             ORDER BY order_date ASC, created_at ASC
             
    FOR EACH order IN Orders:
        IF unallocated == 0 THEN BREAK
        
        apply = MIN(unallocated, order.balance)
        order.amount_paid += apply
        order.balance -= apply
        order.payment_status = (order.balance == 0) ? 'PAID' : 'PARTIAL'
        
        INSERT INTO payment_allocations (payment_id, order_id=order.id, applied_to='ORDER', amount=apply)
        unallocated -= apply
```

### 2.5 Worked Example Verification (SDD §9)
- **Product**: Sting Red 1.5L
- **Step 1**: Purchase 1: 100 ctn @ Rs 1,000 $\rightarrow$ Stock: 100 ctn (Batch B1: 100 @ 1,000)
- **Step 2**: Purchase 2: 50 ctn @ Rs 1,050 $\rightarrow$ Stock: 150 ctn (B1: 100 @ 1,000; B2: 50 @ 1,050)
- **Step 3**: Order delivered: 120 ctn @ Rs 1,200 (Total: Rs 144,000)
  - FIFO allocation: 100 from B1 (B1 remaining: 0); 20 from B2 (B2 remaining: 30)
  - Remaining stock: 30 ctn
- **Step 4**: Profit Calculation:
  - **Default Basis (Latest Purchase Rate = 1,050)**:
    $$\text{Cost} = 120 \times 1,050 = \text{Rs } 126,000$$
    $$\text{Profit} = 144,000 - 126,000 = \text{Rs } 18,000$$
  - **FIFO Basis**:
    $$\text{Cost} = (100 \times 1,000) + (20 \times 1,050) = 100,000 + 21,000 = \text{Rs } 121,000$$
    $$\text{Profit} = 144,000 - 121,000 = \text{Rs } 23,000$$
- **Step 5**: Purchase 3: 40 ctn @ Rs 980 $\rightarrow$ Stock: 70 ctn (B2: 30 @ 1,050; B3: 40 @ 980)
- **Step 6**: Order delivered: 50 ctn
  - FIFO allocation: 30 from B2; 20 from B3 (B3 remaining: 20)
  - Remaining stock: 20 ctn
  - Latest purchase rate is now 980:
    - Default cost: $50 \times 980 = \text{Rs } 49,000$
    - FIFO cost: $(30 \times 1,050) + (20 \times 980) = 31,500 + 19,600 = \text{Rs } 51,100$
