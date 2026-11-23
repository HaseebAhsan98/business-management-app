# Business Management Web Application — Project Plan (M1–M7)

## 1. Project Overview & Architecture Alignment

This project is a high-performance, responsive web application for a wholesale and distribution business (beverages, confectionery, paper). 

### Source of Truth Hierarchy
1. **Master Prompt**: Governs the technology stack, architectural pattern, deployment, and framework guidelines.
2. **Software Design Document (SDD v1.4)**: Governs all business requirements, functional scope, financial formulas, inventory rules, roles/permissions, and acceptance tests.

### Technology Stack
- **Framework**: Next.js 14+ (App Router, React Server Components, Server Actions, Route Handlers)
- **Language**: TypeScript (Strict Mode)
- **Database & Backend**: Supabase PostgreSQL (UUID PKs, NUMERIC(14,2) for money, NUMERIC(14,4) for piece unit cost, integer base units for pieces, PostgreSQL functions/RPCs for transactions, RLS)
- **Authentication**: Supabase Auth (Username/phone + password, JWT sessions, server-side verification)
- **Storage**: Supabase Storage (business logos, document attachments)
- **UI Framework & Styling**: Tailwind CSS, shadcn/ui (Radix UI primitives), Lucide React icons
- **Form Management**: React Hook Form with Zod schema validation
- **Data Tables & Visualization**: TanStack Table v8, Recharts
- **Date & Export Utilities**: date-fns (Asia/Karachi timezone, DD-MM-YYYY format), jsPDF (invoices, statements), ExcelJS (bulk upload & reports export)

---

## 2. Milestone Roadmap & Deliverables

### Milestone 1 (M1) — Foundation & Core Infrastructure
- **Objective**: Establish the Next.js application, Supabase client/server setup, base database schema with migrations, authentication system with role-based access control, base layout, and navigation.
- **Database Migrations**:
  - Extensions (`uuid-ossp`, `pgcrypto`)
  - `users` table with roles (`OWNER`, `MANAGER`, `SALESMAN`), login attempt tracking (lock for 10 minutes after 5 failed attempts)
  - `settings` table with business profile, profit basis, reminder configs
  - `categories`, `companies`, `areas` master tables
  - Row Level Security (RLS) policies for foundation tables
- **Backend / Server Actions**:
  - Auth handlers (`login`, `logout`, `getSession`, password reset)
  - Role verification middleware (`verifyRole(['OWNER', 'MANAGER'])`)
  - System settings read/write actions
- **Frontend Components**:
  - Responsive App Shell (Sidebar for desktop, bottom navigation bar for mobile, header with user profile)
  - Login screen with username/phone, password, "Remember me", and lockout handling
  - Settings page (Owner only): Business profile, rules configuration
  - Basic dashboard placeholder
- **Verification Criteria**:
  - User can log in as Owner, Manager, or Salesman.
  - Salesman is redirected to New Order; Owner/Manager to Dashboard.
  - Route guards block unauthorized role access.

---

### Milestone 2 (M2) — Master Data Management
- **Objective**: Implement Areas, Categories, Companies, Products, Customers (Parties), Suppliers, and pricing configuration.
- **Database Migrations**:
  - `products` table (soft delete, `pieces_per_carton`, `last_purchase_rate_carton`, `sale_rate_carton`, `min_stock_pieces`)
  - `product_rate_history` table (audit trail for purchase/sale rate changes)
  - `customers` table (`party_code` unique sequence, `opening_balance`, `opening_balance_remaining`, `credit_days_limit`, `default_profit_per_carton`, `merged_into_id`)
  - `customer_price_rules` table (`PROFIT_ON_COST` or `FIXED_RATE` per product)
  - `suppliers` table (`opening_balance`, payable tracking)
- **Backend / Server Actions**:
  - CRUD for Products, Categories, Companies, Areas, Suppliers
  - Customer CRUD (Owner/Manager only; Salesman blocked)
  - Customer duplicate detection API (scans area for similar names)
  - Customer merge action (Owner only; consolidates balances, orders, price rules, audit logged)
  - Bulk product upload parser (ExcelJS) with validation preview and error reporting
  - Bulk rate update action (% or fixed amount modification by brand/category)
- **Frontend Components**:
  - Product List & Form (filters by category, company, SKU, flavour, active, stock level)
  - Bulk product import dialog with Excel template download & error grid
  - Bulk rate update modal with preview
  - Party List & Form with Party Info drawer
  - Party Price Rules editor & Party Price List (printable/WhatsApp shareable)
  - Supplier List & Form
- **Verification Criteria**:
  - Owner/Manager can create/edit parties and products; Salesman cannot.
  - Duplicate detection alerts when similar party name exists in the same area.
  - Bulk upload imports 195/200 items if 5 rows have validation errors.

---

### Milestone 3 (M3) — Purchases & Inventory Management
- **Objective**: Manage inventory, opening stock, supplier purchases, stock movements log, stock adjustments, and low-stock tracking.
- **Database Migrations**:
  - `purchases` table (`NORMAL` or `OPENING`, supplier bill no, total, paid, balance, due date)
  - `purchase_items` (batches) table (`qty_pieces`, `qty_remaining_pieces`, `unit_cost_per_piece`, `line_total`)
  - `stock_movements` table (append-only ledger of all stock changes)
  - PostgreSQL trigger/function for updating product `last_purchase_rate_carton` and batch creation
- **Backend / Server Actions**:
  - Purchase entry transaction (creates purchase, batches, stock movements, updates supplier payable and last purchase rate)
  - Opening stock entry (manual form or Excel bulk upload)
  - Stock adjustment action (add/reduce with required reason and latest cost rate snapshot)
  - Inventory calculation queries (On Hand, Reserved, Available = On Hand - Reserved)
- **Frontend Components**:
  - Stock Overview screen (On Hand, Reserved, Available, Stock value, low-stock red badges)
  - Product Batch & Movement history drawer
  - New Purchase screen (calculates rate change UP/DOWN % and amount vs last cost)
  - Opening Stock entry modal & Excel upload
  - Stock Adjustment modal with reason dropdown
- **Verification Criteria**:
  - Adding opening stock or purchase creates a batch and updates `last_purchase_rate_carton`.
  - Stock movements ledger accurately matches current on-hand stock.

---

### Milestone 4 (M4) — Sales Orders & Delivery
- **Objective**: Implement order creation (< 1 min UX), pricing waterfall, stock reservation, FIFO batch deduction, delivery workflow, editing with reversal, and PDF invoices.
- **Database Migrations**:
  - `orders` table (`order_no`, status: `PENDING`, `DELIVERED`, `CANCELLED`, payment status: `UNPAID`, `PARTIAL`, `PAID`, `salesman_id`, `created_by`, profit snapshot)
  - `order_items` table (`rate_per_piece`, `cost_rate_per_piece`, `rate_source`, `line_total`, `line_profit`)
  - `order_item_batches` table (FIFO batch consumption links)
  - PostgreSQL RPC for atomic order delivery with FIFO allocation and row-level locking
  - PostgreSQL RPC for order edit and cancellation reversals
- **Backend / Server Actions**:
  - Order creation action (validates stock availability: Available = On Hand - Reserved; rejects if qty > available)
  - Customer pricing engine:
    1. Party fixed rate for product
    2. Latest purchase rate + party product profit
    3. Latest purchase rate + party default profit
    4. Product standard sale rate
    5. Manual rate override on line
  - Deliver Order action (runs FIFO allocation, locks stock, deducts remaining batch quantities, calculates profit, updates party balance)
  - Edit Order action (reverses previous stock deduction and balance, reapplies new items)
  - Cancel Order action (returns stock to original batches, reverses party balance)
  - PDF Invoice generator (clean layout, no sales tax / NTN, payment details, WhatsApp share link)
- **Frontend Components**:
  - Create Order screen (Area -> Party -> Category -> Product, party balance/overdue warning bar, multi-line same product support, carton/piece toggle)
  - Orders List (filters: date, party, delivery status, payment status, salesman)
  - Order Detail & History tab
  - Delivery Status & Payment Modal (cash received, payment method, credit days calculation)
  - Invoice preview & printable view
- **Verification Criteria**:
  - Order cannot be saved if qty > available stock (blocked for everyone).
  - Pending orders reserve stock without deducting batches.
  - On delivery, FIFO batches are deducted and profit is locked.
  - Salesman sees party rate only; purchase cost and profit are strictly hidden.

---

### Milestone 5 (M5) — Payments, Ledgers & Reminders
- **Objective**: Implement customer payment collections, payment allocation waterfall (oldest bill + opening balance first), customer ledger, supplier payments and ledger, and recovery reminders.
- **Database Migrations**:
  - `customer_payments` table (`receipt_no`, `balance_before`, `balance_after`, `status`: `ACTIVE`, `REVERSED`)
  - `payment_allocations` table (`applied_to`: `ORDER` or `OPENING_BALANCE`, `amount`)
  - `supplier_payments` table
  - `reminder_notes` table (`promise_date`, `note`)
  - PostgreSQL RPC for automatic payment allocation across unpaid debts
- **Backend / Server Actions**:
  - Customer Payment action (calculates live balance after payment, allocates to opening balance first, then oldest unpaid bills)
  - Payment Reversal action (Owner/Manager only with reason; recalculates bill balances, audit logged)
  - Supplier Payment action (reduces supplier payable, updates supplier ledger)
  - Customer & Supplier ledger queries (running balance after every transaction with date and time)
  - Reminder query engine (tabs: Overdue, Due today, Due in 3 days, Promised)
  - Promise date setter & note logger
- **Frontend Components**:
  - Receive Payment screen (shows current balance, live balance after amount typed, bill allocation breakdown)
  - Customer Ledger view (Tabs: Ledger, Orders, Payments, Price List; running balance; statement PDF/WhatsApp export)
  - Supplier Ledger & Pay Supplier dialog
  - Reminders (Recoveries) screen (cards with days overdue, pending bills count, WhatsApp deep link, call button, promise date modal)
- **Verification Criteria**:
  - Payments correctly reduce opening balance first, then oldest unpaid orders.
  - Ledger maintains an accurate, chronologically ordered running balance.
  - Promised date moves party from Overdue to Promised tab.

---

### Milestone 6 (M6) — Dashboard, Reports & Audit Log
- **Objective**: Implement Owner/Manager business intelligence dashboard, Salesman limited view, comprehensive financial/inventory reports, daybook, and immutable audit logs.
- **Database Migrations**:
  - `audit_logs` table (append-only, immutable, JSON diffs of changes)
  - Report aggregate views / optimized queries
- **Backend / Server Actions**:
  - Dashboard analytics engine (today's sales, month's sales, month's profit, total market credit, overdue amount, supplier payable, stock value)
  - Daily & monthly sales chart data endpoints
  - Reports generator:
    - Sales Report (group by day, month, party, area, product, category, salesman)
    - Profit Report (toggleable: Latest Purchase Rate vs FIFO batch cost)
    - Receivables Aging Report (0–7, 8–15, 16–30, >30 days)
    - Payables Report
    - Stock & Movement Report
    - Purchase Report with rate change history
    - Daybook / Cash Book (all cash/bank in and out)
    - Rate History per product
  - Audit log query engine with filters
- **Frontend Components**:
  - Executive Dashboard (summary cards, Recharts daily/monthly sale bar charts, category donut/pie chart, top 10 tables, operational alerts)
  - Salesman Dashboard (restricted to own sales volume, zero profit/cost data)
  - Dedicated Reports views with date range picker, filters, totals row, ExcelJS export & jsPDF print
  - Audit Log viewer (collapsible JSON diffs, user filter, date filter)
- **Verification Criteria**:
  - Dashboard totals match the exact sum of ledgers and orders for matching dates.
  - Salesman sees no profit, cost, or other salesmen's metrics.
  - Profit report correctly reflects the selected cost basis (Latest Purchase Rate vs FIFO).

---

### Milestone 7 (M7) — Final Quality Assurance, Security & Launch Readiness
- **Objective**: Execute all 27 Acceptance Tests from SDD v1.4, test responsive mobile/tablet/desktop layouts, conduct security/concurrency stress tests, prepare seed data, and finalize deployment documentation.
- **Deliverables**:
  - Automated integration test suite covering FIFO, stock blocking, payment allocation, and pricing waterfall
  - Concurrency test verifying row-level locks prevent double-selling the last stock unit
  - Seed script generating 3 categories, 10 companies, 30 products, 10 parties, 2 suppliers, and initial stock
  - Production `.env.example` and deployment guide for Vercel + Supabase
  - System user manual & role cheat-sheet
