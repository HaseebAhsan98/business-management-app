-- ====================================================================
-- SUPABASE MIGRATION: 20261123000001_initial_schema.sql
-- Business Management App (Wholesale & Distribution)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SEQUENCES
CREATE SEQUENCE IF NOT EXISTS customer_code_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS order_no_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS purchase_no_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS receipt_no_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS supplier_payment_no_seq START WITH 1 INCREMENT BY 1;

-- 3. USERS (Profiles linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) UNIQUE,
    username VARCHAR(50) UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'SALESMAN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    push_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);

-- 4. MASTER LOOKUP TABLES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    flavour VARCHAR(50),
    pack_size VARCHAR(50),
    pieces_per_carton INTEGER NOT NULL CHECK (pieces_per_carton > 0),
    sale_rate_carton NUMERIC(14, 2) NOT NULL CHECK (sale_rate_carton >= 0),
    last_purchase_rate_carton NUMERIC(14, 2) DEFAULT 0 CHECK (last_purchase_rate_carton >= 0),
    min_stock_pieces INTEGER NOT NULL DEFAULT 0 CHECK (min_stock_pieces >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- 6. PRODUCT RATE HISTORY
CREATE TABLE IF NOT EXISTS public.product_rate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    rate_type VARCHAR(20) NOT NULL CHECK (rate_type IN ('PURCHASE', 'SALE')),
    old_rate NUMERIC(14, 2) NOT NULL,
    new_rate NUMERIC(14, 2) NOT NULL,
    source VARCHAR(30) NOT NULL CHECK (source IN ('MANUAL', 'PURCHASE', 'BULK_UPDATE')),
    changed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_rate_history_product ON public.product_rate_history(product_id, changed_at DESC);

-- 7. CUSTOMERS (Parties)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    shop_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) UNIQUE,
    address TEXT,
    area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    opening_balance_remaining NUMERIC(14, 2) NOT NULL DEFAULT 0,
    credit_days_limit INTEGER NOT NULL DEFAULT 0 CHECK (credit_days_limit >= 0),
    default_profit_per_carton NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    merged_into_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_area ON public.customers(area_id);
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(party_code);
CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers(is_active);

-- 8. CUSTOMER PRICE RULES
CREATE TABLE IF NOT EXISTS public.customer_price_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('PROFIT_ON_COST', 'FIXED_RATE')),
    amount_per_carton NUMERIC(14, 2) NOT NULL CHECK (amount_per_carton >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_price_rules_lookup ON public.customer_price_rules(customer_id, product_id);

-- 9. SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    company VARCHAR(150),
    address TEXT,
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. PURCHASES & INVENTORY BATCHES
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_no VARCHAR(30) NOT NULL UNIQUE,
    purchase_type VARCHAR(20) NOT NULL CHECK (purchase_type IN ('NORMAL', 'OPENING')),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    supplier_bill_no VARCHAR(50),
    purchase_date DATE NOT NULL,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    paid NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (paid >= 0),
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    due_date DATE,
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED')),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty_pieces INTEGER NOT NULL CHECK (qty_pieces > 0),
    qty_remaining_pieces INTEGER NOT NULL CHECK (qty_remaining_pieces >= 0),
    unit_cost_per_piece NUMERIC(14, 4) NOT NULL CHECK (unit_cost_per_piece >= 0),
    rate_per_carton NUMERIC(14, 2) NOT NULL CHECK (rate_per_carton >= 0),
    line_total NUMERIC(14, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_qty_remaining CHECK (qty_remaining_pieces <= qty_pieces)
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_fifo ON public.purchase_items(product_id, created_at ASC) 
WHERE qty_remaining_pieces > 0;
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items(purchase_id);

-- 12. SALES ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(30) NOT NULL UNIQUE,
    order_date DATE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    salesman_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    updated_by UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING', 'DELIVERED', 'CANCELLED')),
    delivered_at TIMESTAMPTZ,
    payment_type VARCHAR(20) NOT NULL DEFAULT 'CREDIT' CHECK (payment_type IN ('CASH', 'CREDIT')),
    credit_days INTEGER NOT NULL DEFAULT 0 CHECK (credit_days >= 0),
    due_date DATE,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID')),
    total_cost NUMERIC(14, 2) DEFAULT 0,
    profit NUMERIC(14, 2) DEFAULT 0,
    override_reason TEXT,
    note TEXT,
    promise_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_date ON public.orders(customer_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_due_date_balance ON public.orders(due_date, balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_orders_salesman ON public.orders(salesman_id);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty_pieces INTEGER NOT NULL CHECK (qty_pieces > 0),
    entered_unit VARCHAR(10) NOT NULL CHECK (entered_unit IN ('CARTON', 'PIECE')),
    rate_per_piece NUMERIC(14, 4) NOT NULL CHECK (rate_per_piece >= 0),
    rate_per_carton NUMERIC(14, 2) NOT NULL CHECK (rate_per_carton >= 0),
    rate_source VARCHAR(30) NOT NULL CHECK (rate_source IN ('FIXED', 'PROFIT_ON_COST', 'DEFAULT_PROFIT', 'STANDARD', 'MANUAL')),
    cost_rate_per_piece NUMERIC(14, 4),
    line_total NUMERIC(14, 2) NOT NULL CHECK (line_total >= 0),
    cost_total NUMERIC(14, 2),
    line_profit NUMERIC(14, 2),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

CREATE TABLE IF NOT EXISTS public.order_item_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
    purchase_item_id UUID NOT NULL REFERENCES public.purchase_items(id) ON DELETE RESTRICT,
    qty_pieces INTEGER NOT NULL CHECK (qty_pieces > 0),
    unit_cost NUMERIC(14, 4) NOT NULL CHECK (unit_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_item_batches_item ON public.order_item_batches(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_batches_purchase_item ON public.order_item_batches(purchase_item_id);

-- 13. STOCK MOVEMENTS (Immutable Ledger)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN (
        'PURCHASE', 'OPENING', 'SALE', 'SALE_REVERSAL', 'ADJUSTMENT', 'PURCHASE_CANCEL'
    )),
    qty_pieces INTEGER NOT NULL,
    ref_type VARCHAR(30) NOT NULL,
    ref_id UUID NOT NULL,
    batch_id UUID REFERENCES public.purchase_items(id) ON DELETE RESTRICT,
    reason TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id, created_at DESC);

-- 14. CUSTOMER PAYMENTS & ALLOCATIONS
CREATE TABLE IF NOT EXISTS public.customer_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no VARCHAR(30) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    method VARCHAR(30) NOT NULL CHECK (method IN ('CASH', 'BANK', 'WALLET', 'CHEQUE')),
    payment_date DATE NOT NULL,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    balance_before NUMERIC(14, 2) NOT NULL,
    balance_after NUMERIC(14, 2) NOT NULL,
    note TEXT,
    received_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVERSED')),
    reversal_reason TEXT,
    reversed_at TIMESTAMPTZ,
    reversed_by UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_payments_customer ON public.customer_payments(customer_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_payments_status ON public.customer_payments(status);

CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.customer_payments(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    applied_to VARCHAR(30) NOT NULL CHECK (applied_to IN ('ORDER', 'OPENING_BALANCE')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON public.payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_order ON public.payment_allocations(order_id);

-- 15. SUPPLIER PAYMENTS
CREATE TABLE IF NOT EXISTS public.supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_no VARCHAR(30) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE RESTRICT,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    method VARCHAR(30) NOT NULL CHECK (method IN ('CASH', 'BANK', 'WALLET', 'CHEQUE')),
    payment_date DATE NOT NULL,
    note TEXT,
    paid_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVERSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON public.supplier_payments(supplier_id);

-- 16. AUDIT LOGS (Append-Only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);

-- 17. REMINDER NOTES
CREATE TABLE IF NOT EXISTS public.reminder_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    note TEXT NOT NULL,
    promise_date DATE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminder_notes_customer ON public.reminder_notes(customer_id);

-- 18. SALES RETURNS (Phase 2 schema readiness)
CREATE TABLE IF NOT EXISTS public.sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty_pieces INTEGER NOT NULL CHECK (qty_pieces > 0),
    return_type VARCHAR(20) NOT NULL CHECK (return_type IN ('RETURN', 'DAMAGED')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    reason TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
