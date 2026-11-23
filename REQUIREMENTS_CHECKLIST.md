# Business Management Web Application — Requirements Checklist

| Req ID | Category | Requirement Description | SDD Ref | Status | Acceptance Test |
|---|---|---|---|---|---|
| **REQ-AUTH-01** | Auth | User login with phone number or username and password | §7.1 | Pending | Test 16 |
| **REQ-AUTH-02** | Auth | Lockout for 10 minutes after 5 consecutive failed login attempts | §7.1 | Pending | — |
| **REQ-AUTH-03** | Auth | "Remember me on this device" session persistence | §7.1 | Pending | — |
| **REQ-AUTH-04** | Auth | Post-login redirect: Dashboard for Owner/Manager, New Order for Salesman | §7.1 | Pending | — |
| **REQ-ROLE-01** | RBAC | Enforce three distinct roles: `OWNER`, `MANAGER`, `SALESMAN` | §4 | Pending | Test 16 |
| **REQ-ROLE-02** | RBAC | Owner/Manager have full access; Salesman has restricted sales-only access | §4 | Pending | Test 16 |
| **REQ-ROLE-03** | RBAC | Salesman cannot view purchase rate, cost rate, or profit anywhere (UI & API) | §4, §8.21 | Pending | Test 16 |
| **REQ-ROLE-04** | RBAC | Salesman sees final selling rate for a party, but not how it was calculated | §4 | Pending | Test 16 |
| **REQ-ROLE-05** | RBAC | Only Owner/Manager can add or edit products, rates, parties, and areas | §4, §7.7 | Pending | Test 17 |
| **REQ-ROLE-06** | RBAC | Only Owner can merge duplicate parties | §4, §7.7 | Pending | Test 19 |
| **REQ-ROLE-07** | RBAC | Salesman cannot view other salesmen's totals or orders | §4, §12 | Pending | Test 16 |
| **REQ-ROLE-08** | RBAC | Owner/Manager can enter an order on behalf of a chosen salesman | §4, §7.3 | Pending | Test 20 |
| **REQ-ROLE-09** | RBAC | Overriding credit days / overdue warning requires Owner/Manager with reason; blocked for Salesman | §4, §8.10 | Pending | Test 4, 24 |
| **REQ-DATA-01** | Master Data | Manage Areas (name, active status; Owner manages in Settings) | §7.7, §7.15 | Pending | Test 17 |
| **REQ-DATA-02** | Master Data | Manage Categories (Beverages, Paper, Confectionery, etc.) | §7.8, §7.15 | Pending | — |
| **REQ-DATA-03** | Master Data | Manage Companies / Brands (Pepsi, Coca-Cola, Slice, Tapal, etc.) | §7.8, §7.15 | Pending | — |
| **REQ-PROD-01** | Products | Product fields: Category, Name, SKU (unique, auto-suggested), Flavour, Company, Pack size, Pieces per carton, Purchase rate, Sale rate, Min stock, Active | §7.8, §10.1 | Pending | — |
| **REQ-PROD-02** | Products | Product rates: Changing rates never alters past orders; logged in `product_rate_history` | §7.8, §8.5 | Pending | Test 12 |
| **REQ-PROD-03** | Products | Bulk product upload via Excel with template download, error preview, and confirmation | §7.8 | Pending | Test 13 |
| **REQ-PROD-04** | Products | Bulk rate update by brand/category by percentage or fixed amount with preview | §7.8 | Pending | — |
| **REQ-PROD-05** | Products | Rate history chart and table showing purchase & sale rate trends over time | §7.8 | Pending | — |
| **REQ-CUST-01** | Customers | Party creation: Name, Shop Name, Area (required), Phone (optional, unique if present), Address, Credit days limit, Opening balance, Default profit per carton | §7.7 | Pending | Test 18, 25 |
| **REQ-CUST-02** | Customers | Party Code: Automatic, sequential, unique identifier (e.g. `P-0123`) | §7.7, §8.15 | Pending | — |
| **REQ-CUST-03** | Customers | Credit days limit: Number of days entered by user (0 = cash only; no credit amount limit) | §2 (A19), §8.10 | Pending | Test 4 |
| **REQ-CUST-04** | Customers | Duplicate protection: Check same area for similar names ("Is this the same party?") | §7.7 | Pending | Test 18 |
| **REQ-CUST-05** | Customers | Merge duplicate parties (Owner only): Consolidates orders, payments, balance, price rules; hides source | §7.7, §8.16 | Pending | Test 19 |
| **REQ-CUST-06** | Customers | Party price rules: Profit on cost (per carton) or Fixed rate per product | §7.7, §8.11 | Pending | Test 10 |
| **REQ-CUST-07** | Customers | Party price list: Printable and shareable via WhatsApp/PDF | §7.7 | Pending | — |
| **REQ-SUPP-01** | Suppliers | Supplier management: Name, phone, company, address, opening balance, notes | §7.11 | Pending | — |
| **REQ-SUPP-02** | Suppliers | Supplier ledger: Purchases (debit) and payments (credit) with running payable balance | §7.11 | Pending | — |
| **REQ-PURC-01** | Purchases | Purchase entry: Supplier, Bill no, Date, Line items (Product, Qty in cartons/pieces, Rate per carton) | §7.10 | Pending | — |
| **REQ-PURC-02** | Purchases | Each purchase item creates an independent inventory batch with its own unit cost | §7.10, §8.6 | Pending | Test 9 |
| **REQ-PURC-03** | Purchases | Show rate change indicator (UP/DOWN with amount and %) compared to previous purchase rate | §7.10 | Pending | — |
| **REQ-PURC-04** | Purchases | Automatically update product's `last_purchase_rate_carton` on purchase save | §7.10, §8.6 | Pending | Test 10 |
| **REQ-PURC-05** | Purchases | Partial/full payment recording at purchase entry (Paid now, method, balance to payable, due days) | §7.10 | Pending | — |
| **REQ-PURC-06** | Purchases | Opening stock entered as purchase of type `OPENING` (qty, rate, no supplier/payment, creates batch) | §7.10, §8.6 | Pending | Test 23 |
| **REQ-PURC-07** | Purchases | Bulk opening stock upload via Excel (SKU, quantity, rate) | §7.10 | Pending | — |
| **REQ-INVT-01** | Inventory | Stock calculation: On Hand (pieces & cartons), Reserved (pending orders), Available = On Hand - Reserved | §7.9, §8.2 | Pending | Test 2 |
| **REQ-INVT-02** | Inventory | Stock shortage prevention: Orders exceeding Available stock blocked for everyone | §2 (A5), §8.12 | Pending | Test 22 |
| **REQ-INVT-03** | Inventory | Stock deduction occurs ONLY when order status becomes `DELIVERED` | §2 (A3), §8.2 | Pending | Test 3 |
| **REQ-INVT-04** | Inventory | FIFO batch consumption: Delivered orders deduct stock from oldest batches with remaining quantity | §8.3, §9 | Pending | Test 9 |
| **REQ-INVT-05** | Inventory | Order-batch links: Store allocated batch IDs and quantities on order items for reversal | §8.3, §10.2 | Pending | Test 8, 26 |
| **REQ-INVT-06** | Inventory | Concurrency protection: Atomic row-level locking on stock batches to prevent double-selling | §12 | Pending | Test 21 |
| **REQ-INVT-07** | Inventory | Stock adjustments (Owner/Manager): Add/reduce with required reason, cost snapshot, movements log | §7.9 | Pending | — |
| **REQ-INVT-08** | Inventory | Stock movements audit trail: Every change (purchase, sale, reversal, adjustment) writes a row | §8.19, §10.2 | Pending | — |
| **REQ-ORDR-01** | Orders | Create order in under 1 minute: Date, Area dropdown -> Party dropdown | §7.3 | Pending | Test 1, 17 |
| **REQ-ORDR-02** | Orders | Party info bar: Shows balance owed, credit days allowed, overdue warning with oldest unpaid bill age | §7.3 | Pending | Test 24 |
| **REQ-ORDR-03** | Orders | Pricing waterfall: (1) Fixed rate -> (2) Cost + party product profit -> (3) Cost + default profit -> (4) Standard rate | §7.3, §8.11 | Pending | Test 10 |
| **REQ-ORDR-04** | Orders | Multi-line same product: Same product can appear on multiple lines with different quantities/rates | §2 (A15), §7.3 | Pending | Test 11 |
| **REQ-ORDR-05** | Orders | Unit handling: Cartons and pieces with automatic live rate and total conversion | §2 (A10), §7.3 | Pending | — |
| **REQ-ORDR-06** | Orders | Live profit calculation on line: Visible to Owner/Manager, strictly hidden from Salesman | §7.3, §8.21 | Pending | Test 16 |
| **REQ-ORDR-07** | Orders | Delivery & Payment sheet: Choose Pending or Delivered, Cash or Credit | §7.6 | Pending | Test 3, 4 |
| **REQ-ORDR-08** | Orders | Cash payment: Amount received, payment method. If partial, remainder converts to credit with credit days | §7.6 | Pending | — |
| **REQ-ORDR-09** | Orders | Credit payment: Credit days (default to party limit), calculated due date (delivery date + credit days) | §7.6, §8.8 | Pending | Test 4 |
| **REQ-ORDR-10** | Orders | Credit days warning: Writing days > party limit requires Owner/Manager reason; blocks Salesman | §7.6, §8.10 | Pending | Test 4 |
| **REQ-ORDR-11** | Orders | Cost & profit locking on delivery: Line cost locked at latest purchase rate (default) or FIFO | §8.4 | Pending | Test 9 |
| **REQ-ORDR-12** | Orders | Edit delivered order: Requires reason, reverses old stock movements/batches, reapplies new ones, updates balance | §7.5, §8.13 | Pending | Test 8 |
| **REQ-ORDR-13** | Orders | Cancel delivered order: Returns stock to original batches, reverses customer balance, marks unapplied credit | §7.5, §8.14 | Pending | Test 26 |
| **REQ-ORDR-14** | Orders | Invoice generation: Professional PDF invoice without sales tax / NTN, with WhatsApp share | §2 (A11), §7.5 | Pending | — |
| **REQ-PMNT-01** | Payments | Customer payment receipt: Party, amount, payment method, date/time, optional note | §7.12 | Pending | Test 5 |
| **REQ-PMNT-02** | Payments | Live balance feedback: Displays current balance and remaining balance as amount is typed | §7.12 | Pending | Test 7 |
| **REQ-PMNT-03** | Payments | Payment allocation waterfall: Opening balance is treated as oldest bill; allocates to oldest unpaid bills first | §7.12, §8.9 | Pending | Test 6, 7 |
| **REQ-PMNT-04** | Payments | Partial payments: Support multiple payments on same or different days; automatic status transition (Unpaid -> Partial -> Paid) | §7.12, §8.9 | Pending | Test 5, 7 |
| **REQ-PMNT-05** | Payments | Customer Ledger: Chronological entries of opening balance, orders (debit), payments (credit) with date, time, and running balance | §7.7, §8.7 | Pending | Test 7 |
| **REQ-PMNT-06** | Payments | Supplier payment recording with running balance update | §7.11, §7.12 | Pending | — |
| **REQ-PMNT-07** | Payments | Payment reversal (Owner/Manager): Requires reason, reverses bill allocations, audit logged | §7.12 | Pending | — |
| **REQ-RMND-01** | Reminders | Recovery tabs: Overdue, Due today, Due in next 3 days, Promised | §7.13 | Pending | Test 14 |
| **REQ-RMND-02** | Reminders | Party card metrics: Pending amount, unpaid bills count, oldest bill date, days overdue | §7.13 | Pending | Test 14 |
| **REQ-RMND-03** | Reminders | Actions: Call, WhatsApp (prefilled text), Receive Payment, Set promise date, Add note | §7.13 | Pending | Test 14, 25 |
| **REQ-RMND-04** | Reminders | Daily morning push notification (9:00 AM) to Owner/Manager with recovery summary | §7.13 | Pending | — |
| **REQ-DASH-01** | Dashboard | Summary cards: Today's sale, Month's sale, Month's profit, Total market credit, Overdue, Supplier payable, Cash received today, Stock value | §7.2 | Pending | Test 15 |
| **REQ-DASH-02** | Dashboard | Charts: Daily sales bar chart (clickable for orders), Monthly sales & profit (12 mo), Category breakdown | §7.2 | Pending | — |
| **REQ-DASH-03** | Dashboard | Top 10 lists: Products, Parties by sale, Parties by credit owed, Area-wise sales and credit | §7.2 | Pending | — |
| **REQ-DASH-04** | Dashboard | Operational alerts: Low-stock products, pending deliveries, overdue bills | §7.2 | Pending | — |
| **REQ-REPT-01** | Reports | Sales Report: Group by day, month, party, area, product, category, company, salesman | §7.14 | Pending | — |
| **REQ-REPT-02** | Reports | Profit Report: Sale, cost, profit, and margin %; toggleable cost basis (Latest Purchase vs FIFO) | §7.14, §8.4 | Pending | Test 9 |
| **REQ-REPT-03** | Reports | Receivables Aging Report: 0–7, 8–15, 16–30, >30 days buckets party-wise and area-wise | §7.7, §7.14 | Pending | — |
| **REQ-REPT-04** | Reports | Payables Report: Supplier-wise balances | §7.14 | Pending | — |
| **REQ-REPT-05** | Reports | Stock & Movements Report: Current stock, valuation, low-stock, movement history | §7.14 | Pending | — |
| **REQ-REPT-06** | Reports | Purchase Report: Purchases by date/supplier/product, tracking rate changes | §7.14 | Pending | — |
| **REQ-REPT-07** | Reports | Daybook / Cash Book: Daily cash and bank in/out transactions | §7.14 | Pending | — |
| **REQ-REPT-08** | Reports | Party Statement: Date-filtered ledger export to PDF/Excel | §7.14 | Pending | — |
| **REQ-REPT-09** | Reports | Rate History Report: Purchase and sale rate modifications per product | §7.14 | Pending | — |
| **REQ-SETT-01** | Settings | Business Profile: Business name, address, phone, logo upload for invoices | §7.15 | Pending | — |
| **REQ-SETT-02** | Settings | Rules: Profit basis (LAST_PURCHASE or FIFO), reminder notice days, reminder time, invoice prefix | §7.15 | Pending | — |
| **REQ-SETT-03** | Settings | User management: Add staff, assign role, activate/deactivate, password reset | §7.15 | Pending | — |
| **REQ-AUDT-01** | Audit Log | Immutable, append-only log of creates, edits, cancellations, deletions, rate changes, party merges | §7.16, §8 | Pending | Test 8, 19 |
| **REQ-GEN-01** | General | Sequential unique identifiers: `ORD-YYYY-NNNNNN`, `PUR-YYYY-NNNNNN`, `RCT-YYYY-NNNNNN` | §8.20 | Pending | — |
| **REQ-GEN-02** | General | Data safety: No hard deletes; soft deletion via `is_active` or status `CANCELLED` | §2 (A13), §8.18 | Pending | — |
| **REQ-GEN-03** | General | Timezone: All timestamps stored in UTC, rendered in `Asia/Karachi` with format `DD-MM-YYYY` | §2 (A9), §8.22 | Pending | — |
