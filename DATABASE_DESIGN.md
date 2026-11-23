# Business Management Web Application — PostgreSQL Database Design (Supabase)

This document provides the complete PostgreSQL database schema, data types, constraints, foreign key relationships, indexes, stored procedures (RPCs), and Row Level Security (RLS) policies.

---

## 1. Schema Conventions & Rules

1. **Primary Keys**: UUID v4 generated via `gen_random_uuid()`.
2. **Monetary Values**: Stored as `NUMERIC(14, 2)` (never floating point).
3. **Per-Piece Unit Costs**: Stored as `NUMERIC(14, 4)` to eliminate rounding drift when dividing carton costs by carton quantities.
4. **Quantities**: Stored as `INTEGER` representing the base unit (pieces). Carton quantities are converted: `pieces = cartons * pieces_per_carton`.
5. **Timestamps**: `TIMESTAMPTZ` with default `CURRENT_TIMESTAMP`. Stored in UTC, converted to `Asia/Karachi` in the application tier.
6. **Soft Deletions**: No hard deletes on business entities (`is_active = FALSE` for master data, status `CANCELLED` for transactions).
7. **Referential Integrity**: Foreign keys enforce `ON DELETE RESTRICT` to protect historical audit records from accidental cascade deletions.

---

## 2. Master Data Tables

### 2.1 `users`
Managed alongside Supabase Auth (`auth.users`).
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE,
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

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_active ON public.users(is_active);
```

### 2.2 `categories`
```sql
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 `companies` (Brands)
```sql
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2.4 `areas`
```sql
CREATE TABLE public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2.5 `products`
```sql
CREATE TABLE public.products (
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

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_company ON public.products(company_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_active ON public.products(is_active);
```

### 2.6 `product_rate_history`
```sql
CREATE TABLE public.product_rate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    rate_type VARCHAR(20) NOT NULL CHECK (rate_type IN ('PURCHASE', 'SALE')),
    old_rate NUMERIC(14, 2) NOT NULL,
    new_rate NUMERIC(14, 2) NOT NULL,
    source VARCHAR(30) NOT NULL CHECK (source IN ('MANUAL', 'PURCHASE', 'BULK_UPDATE')),
    changed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_rate_history_product ON public.product_rate_history(product_id, changed_at DESC);
```

### 2.7 `customers` (Parties)
```sql
CREATE SEQUENCE customer_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.customers (
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

CREATE INDEX idx_customers_area ON public.customers(area_id);
CREATE INDEX idx_customers_code ON public.customers(party_code);
CREATE INDEX idx_customers_active ON public.customers(is_active);
```

### 2.8 `customer_price_rules`
```sql
CREATE TABLE public.customer_price_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('PROFIT_ON_COST', 'FIXED_RATE')),
    amount_per_carton NUMERIC(14, 2) NOT NULL CHECK (amount_per_carton >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (customer_id, product_id)
);

CREATE INDEX idx_customer_price_rules_lookup ON public.customer_price_rules(customer_id, product_id);
```

### 2.9 `suppliers`
```sql
CREATE TABLE public.suppliers (
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
```

### 2.10 `settings`
```sql
CREATE TABLE public.settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Transactional Tables

### 3.1 `purchases`
```sql
CREATE SEQUENCE purchase_no_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.purchases (
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

CREATE INDEX idx_purchases_supplier ON public.purchases(supplier_id);
CREATE INDEX idx_purchases_date ON public.purchases(purchase_date);
CREATE INDEX idx_purchases_status ON public.purchases(status);
```

### 3.2 `purchase_items` (Inventory Batches)
```sql
CREATE TABLE public.purchase_items (
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

CREATE INDEX idx_purchase_items_fifo ON public.purchase_items(product_id, created_at ASC) 
WHERE qty_remaining_pieces > 0;
CREATE INDEX idx_purchase_items_purchase ON public.purchase_items(purchase_id);
```

### 3.3 `orders`
```sql
CREATE SEQUENCE order_no_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.orders (
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

CREATE INDEX idx_orders_customer_date ON public.orders(customer_id, order_date DESC);
CREATE INDEX idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_due_date_balance ON public.orders(due_date, balance) WHERE balance > 0;
CREATE INDEX idx_orders_salesman ON public.orders(salesman_id);
```

### 3.4 `order_items`
```sql
CREATE TABLE public.order_items (
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

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);
```

### 3.5 `order_item_batches` (FIFO Traceability)
```sql
CREATE TABLE public.order_item_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
    purchase_item_id UUID NOT NULL REFERENCES public.purchase_items(id) ON DELETE RESTRICT,
    qty_pieces INTEGER NOT NULL CHECK (qty_pieces > 0),
    unit_cost NUMERIC(14, 4) NOT NULL CHECK (unit_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_item_batches_item ON public.order_item_batches(order_item_id);
CREATE INDEX idx_order_item_batches_purchase_item ON public.order_item_batches(purchase_item_id);
```

### 3.6 `stock_movements` (Immutable Stock Audit Ledger)
```sql
CREATE TABLE public.stock_movements (
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

CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id, created_at DESC);
```

### 3.7 `customer_payments`
```sql
CREATE SEQUENCE receipt_no_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.customer_payments (
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

CREATE INDEX idx_customer_payments_customer ON public.customer_payments(customer_id, payment_date DESC);
CREATE INDEX idx_customer_payments_status ON public.customer_payments(status);
```

### 3.8 `payment_allocations`
```sql
CREATE TABLE public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.customer_payments(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    applied_to VARCHAR(30) NOT NULL CHECK (applied_to IN ('ORDER', 'OPENING_BALANCE')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_allocations_payment ON public.payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_order ON public.payment_allocations(order_id);
```

### 3.9 `supplier_payments`
```sql
CREATE SEQUENCE supplier_payment_no_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.supplier_payments (
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

CREATE INDEX idx_supplier_payments_supplier ON public.supplier_payments(supplier_id);
```

### 3.10 `audit_logs` (Append-Only)
```sql
CREATE TABLE public.audit_logs (
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

CREATE INDEX idx_audit_logs_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
```

### 3.11 `reminder_notes`
```sql
CREATE TABLE public.reminder_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    note TEXT NOT NULL,
    promise_date DATE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminder_notes_customer ON public.reminder_notes(customer_id);
```

---

## 4. Key Database Stored Procedures (RPCs)

### 4.1 Stock Availability RPC (`get_product_stock_availability`)
```sql
CREATE OR REPLACE FUNCTION public.get_product_stock_availability(p_product_id UUID)
RETURNS TABLE (
    on_hand_pieces INTEGER,
    reserved_pieces INTEGER,
    available_pieces INTEGER
) LANGUAGE plpgsql AS $$
DECLARE
    v_on_hand INTEGER := 0;
    v_reserved INTEGER := 0;
BEGIN
    -- Sum of remaining pieces in active batches
    SELECT COALESCE(SUM(qty_remaining_pieces), 0)
    INTO v_on_hand
    FROM public.purchase_items
    WHERE product_id = p_product_id;

    -- Sum of pieces in PENDING orders
    SELECT COALESCE(SUM(oi.qty_pieces), 0)
    INTO v_reserved
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE oi.product_id = p_product_id AND o.delivery_status = 'PENDING';

    RETURN QUERY SELECT v_on_hand, v_reserved, (v_on_hand - v_reserved);
END;
$$;
```

### 4.2 FIFO Delivery RPC (`execute_order_delivery`)
Performs row-level locking on batches, deducts FIFO quantities, records `order_item_batches`, captures cost snapshot, and writes to `stock_movements`.
```sql
CREATE OR REPLACE FUNCTION public.execute_order_delivery(
    p_order_id UUID,
    p_user_id UUID
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_item RECORD;
    v_batch RECORD;
    v_needed INTEGER;
    v_take INTEGER;
    v_cost_total NUMERIC(14,2) := 0;
    v_order_cost_total NUMERIC(14,2) := 0;
    v_last_purchase_rate NUMERIC(14,2);
    v_customer_id UUID;
    v_order_total NUMERIC(14,2);
    v_payment_type VARCHAR(20);
BEGIN
    SELECT customer_id, total, payment_type 
    INTO v_customer_id, v_order_total, v_payment_type
    FROM public.orders WHERE id = p_order_id FOR UPDATE;

    FOR v_item IN 
        SELECT oi.id, oi.product_id, oi.qty_pieces, oi.line_total, p.pieces_per_carton, p.last_purchase_rate_carton
        FROM public.order_items oi
        JOIN public.products p ON oi.product_id = p.id
        WHERE oi.order_id = p_order_id
    LOOP
        v_needed := v_item.qty_pieces;
        v_cost_total := 0;
        v_last_purchase_rate := v_item.last_purchase_rate_carton;

        -- Iterate oldest batches for product with FOR UPDATE row lock
        FOR v_batch IN 
            SELECT pi.id, pi.qty_remaining_pieces, pi.unit_cost_per_piece
            FROM public.purchase_items pi
            JOIN public.purchases pur ON pi.purchase_id = pur.id
            WHERE pi.product_id = v_item.product_id 
              AND pi.qty_remaining_pieces > 0
              AND pur.status = 'ACTIVE'
            ORDER BY pur.purchase_date ASC, pi.created_at ASC
            FOR UPDATE OF pi
        LOOP
            IF v_needed <= 0 THEN
                EXIT;
            END IF;

            v_take := LEAST(v_needed, v_batch.qty_remaining_pieces);

            -- Deduct from batch
            UPDATE public.purchase_items
            SET qty_remaining_pieces = qty_remaining_pieces - v_take
            WHERE id = v_batch.id;

            -- Record batch allocation
            INSERT INTO public.order_item_batches (
                order_item_id, purchase_item_id, qty_pieces, unit_cost
            ) VALUES (
                v_item.id, v_batch.id, v_take, v_batch.unit_cost_per_piece
            );

            -- Record stock movement
            INSERT INTO public.stock_movements (
                product_id, movement_type, qty_pieces, ref_type, ref_id, batch_id, created_by
            ) VALUES (
                v_item.product_id, 'SALE', -v_take, 'ORDER', p_order_id, v_batch.id, p_user_id
            );

            v_cost_total := v_cost_total + (v_take * v_batch.unit_cost_per_piece);
            v_needed := v_needed - v_take;
        END LOOP;

        IF v_needed > 0 THEN
            RAISE EXCEPTION 'Insufficient stock in batches for product %', v_item.product_id;
        END IF;

        -- Default profit calculation basis: Latest Purchase Rate
        -- Cost per piece from latest purchase rate
        DECLARE
            v_latest_cost_per_piece NUMERIC(14,4) := (v_last_purchase_rate / v_item.pieces_per_carton);
            v_item_cost NUMERIC(14,2) := ROUND(v_item.qty_pieces * v_latest_cost_per_piece, 2);
            v_item_profit NUMERIC(14,2) := v_item.line_total - v_item_cost;
        BEGIN
            UPDATE public.order_items
            SET cost_rate_per_piece = v_latest_cost_per_piece,
                cost_total = v_item_cost,
                line_profit = v_item_profit
            WHERE id = v_item.id;

            v_order_cost_total := v_order_cost_total + v_item_cost;
        END;
    END LOOP;

    -- Update order status and profit
    UPDATE public.orders
    SET delivery_status = 'DELIVERED',
        delivered_at = CURRENT_TIMESTAMP,
        total_cost = v_order_cost_total,
        profit = (total - v_order_cost_total),
        updated_by = p_user_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_order_id;
END;
$$;
```

### 4.3 Payment Allocation RPC (`allocate_customer_payment`)
Allocates payment to opening balance first, then chronologically to oldest unpaid bills.
```sql
CREATE OR REPLACE FUNCTION public.allocate_customer_payment(
    p_payment_id UUID,
    p_customer_id UUID,
    p_amount NUMERIC(14, 2)
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_unallocated NUMERIC(14, 2) := p_amount;
    v_cust RECORD;
    v_order RECORD;
    v_apply NUMERIC(14, 2);
BEGIN
    SELECT opening_balance_remaining 
    INTO v_cust
    FROM public.customers
    WHERE id = p_customer_id
    FOR UPDATE;

    -- Step 1: Apply to remaining opening balance first
    IF v_cust.opening_balance_remaining > 0 THEN
        v_apply := LEAST(v_unallocated, v_cust.opening_balance_remaining);
        
        INSERT INTO public.payment_allocations (
            payment_id, order_id, applied_to, amount
        ) VALUES (
            p_payment_id, NULL, 'OPENING_BALANCE', v_apply
        );

        UPDATE public.customers
        SET opening_balance_remaining = opening_balance_remaining - v_apply,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_customer_id;

        v_unallocated := v_unallocated - v_apply;
    END IF;

    -- Step 2: Apply to oldest unpaid delivered orders
    IF v_unallocated > 0 THEN
        FOR v_order IN 
            SELECT id, balance 
            FROM public.orders
            WHERE customer_id = p_customer_id 
              AND delivery_status = 'DELIVERED'
              AND balance > 0
            ORDER BY order_date ASC, created_at ASC
            FOR UPDATE
        LOOP
            IF v_unallocated <= 0 THEN
                EXIT;
            END IF;

            v_apply := LEAST(v_unallocated, v_order.balance);

            INSERT INTO public.payment_allocations (
                payment_id, order_id, applied_to, amount
            ) VALUES (
                p_payment_id, v_order.id, 'ORDER', v_apply
            );

            UPDATE public.orders
            SET amount_paid = amount_paid + v_apply,
                balance = balance - v_apply,
                payment_status = CASE 
                    WHEN (balance - v_apply) = 0 THEN 'PAID' 
                    ELSE 'PARTIAL' 
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_order.id;

            v_unallocated := v_unallocated - v_apply;
        END LOOP;
    END IF;
END;
$$;
```

---

## 5. Row-Level Security (RLS) Policies

1. **Purchases & Suppliers**:
   - `SELECT`, `INSERT`, `UPDATE`: Allowed only for `OWNER` and `MANAGER`. Salesman has no access.
2. **Products & Master Data**:
   - `SELECT`: Allowed for all authenticated users.
   - `INSERT`, `UPDATE`: Allowed only for `OWNER` and `MANAGER`.
3. **Orders**:
   - `SELECT`: `OWNER` and `MANAGER` see all orders. `SALESMAN` sees only orders where `salesman_id = auth.uid()`.
   - `INSERT`: Allowed for all roles.
   - `UPDATE`: `SALESMAN` can update only own `PENDING` orders. `OWNER`/`MANAGER` can update all orders.
4. **Order Items & Profit**:
   - API endpoints dynamically strip `cost_rate_per_piece`, `cost_total`, and `line_profit` when the requesting user has role `SALESMAN`.
