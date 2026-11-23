-- ====================================================================
-- SUPABASE COMPLETE STORED PROCEDURES & PERMISSIONS
-- Run this in Supabase SQL Editor
-- ====================================================================

-- 1. EXTENSIONS & SEQUENCES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SEQUENCE IF NOT EXISTS customer_code_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS order_no_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS purchase_no_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS receipt_no_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS supplier_payment_no_seq START WITH 1 INCREMENT BY 1;

-- 2. STORED PROCEDURES / RPCS

-- A. STOCK AVAILABILITY FUNCTION
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
    SELECT COALESCE(SUM(pi.qty_remaining_pieces), 0)
    INTO v_on_hand
    FROM public.purchase_items pi
    JOIN public.purchases p ON pi.purchase_id = p.id
    WHERE pi.product_id = p_product_id AND p.status = 'ACTIVE';

    SELECT COALESCE(SUM(oi.qty_pieces), 0)
    INTO v_reserved
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE oi.product_id = p_product_id AND o.delivery_status = 'PENDING';

    RETURN QUERY SELECT v_on_hand, v_reserved, (v_on_hand - v_reserved);
END;
$$;

-- B. FIFO DELIVERY EXECUTION RPC
CREATE OR REPLACE FUNCTION public.execute_order_delivery(
    p_order_id UUID,
    p_user_id UUID
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_batch RECORD;
    v_needed INTEGER;
    v_take INTEGER;
    v_order_cost_total NUMERIC(14,2) := 0;
    v_profit_basis VARCHAR(30) := 'LAST_PURCHASE';
BEGIN
    SELECT * INTO v_order 
    FROM public.orders 
    WHERE id = p_order_id 
    FOR UPDATE;

    IF v_order.delivery_status = 'DELIVERED' THEN
        RAISE EXCEPTION 'Order % is already marked as DELIVERED', v_order.order_no;
    END IF;

    SELECT value->>'profit_basis' INTO v_profit_basis 
    FROM public.settings 
    WHERE key = 'rules';
    
    IF v_profit_basis IS NULL THEN
        v_profit_basis := 'LAST_PURCHASE';
    END IF;

    FOR v_item IN 
        SELECT oi.id, oi.product_id, oi.qty_pieces, oi.line_total, p.pieces_per_carton, p.last_purchase_rate_carton
        FROM public.order_items oi
        JOIN public.products p ON oi.product_id = p.id
        WHERE oi.order_id = p_order_id
        ORDER BY oi.sort_order ASC, oi.created_at ASC
    LOOP
        v_needed := v_item.qty_pieces;

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

            UPDATE public.purchase_items
            SET qty_remaining_pieces = qty_remaining_pieces - v_take
            WHERE id = v_batch.id;

            INSERT INTO public.order_item_batches (
                order_item_id, purchase_item_id, qty_pieces, unit_cost
            ) VALUES (
                v_item.id, v_batch.id, v_take, v_batch.unit_cost_per_piece
            );

            INSERT INTO public.stock_movements (
                product_id, movement_type, qty_pieces, ref_type, ref_id, batch_id, created_by
            ) VALUES (
                v_item.product_id, 'SALE', -v_take, 'ORDER', p_order_id, v_batch.id, p_user_id
            );

            v_needed := v_needed - v_take;
        END LOOP;

        IF v_needed > 0 THEN
            RAISE EXCEPTION 'Stock shortage: unable to fulfill % pieces for product ID %', v_needed, v_item.product_id;
        END IF;

        DECLARE
            v_item_cost NUMERIC(14,2);
            v_cost_rate NUMERIC(14,4);
        BEGIN
            IF v_profit_basis = 'FIFO' THEN
                SELECT COALESCE(SUM(qty_pieces * unit_cost), 0)
                INTO v_item_cost
                FROM public.order_item_batches
                WHERE order_item_id = v_item.id;

                v_cost_rate := ROUND(v_item_cost / v_item.qty_pieces, 4);
            ELSE
                v_cost_rate := (v_item.last_purchase_rate_carton / v_item.pieces_per_carton);
                v_item_cost := ROUND(v_item.qty_pieces * v_cost_rate, 2);
            END IF;

            UPDATE public.order_items
            SET cost_rate_per_piece = v_cost_rate,
                cost_total = v_item_cost,
                line_profit = (line_total - v_item_cost)
            WHERE id = v_item.id;

            v_order_cost_total := v_order_cost_total + v_item_cost;
        END;
    END LOOP;

    UPDATE public.orders
    SET delivery_status = 'DELIVERED',
        delivered_at = CURRENT_TIMESTAMP,
        total_cost = v_order_cost_total,
        profit = (total - v_order_cost_total),
        balance = CASE WHEN payment_type = 'CREDIT' THEN (total - amount_paid) ELSE 0 END,
        updated_by = p_user_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_order_id;

    INSERT INTO public.audit_logs (
        user_id, action, table_name, record_id, new_values, created_at
    ) VALUES (
        p_user_id, 'DELIVER_ORDER', 'orders', p_order_id, 
        jsonb_build_object('order_no', v_order.order_no, 'status', 'DELIVERED', 'profit', (v_order.total - v_order_cost_total)),
        CURRENT_TIMESTAMP
    );
END;
$$;

-- C. REVERSE ORDER DELIVERY RPC
CREATE OR REPLACE FUNCTION public.reverse_order_delivery(
    p_order_id UUID,
    p_user_id UUID,
    p_reason TEXT
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_order RECORD;
    v_alloc RECORD;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

    IF v_order.delivery_status != 'DELIVERED' THEN
        RETURN;
    END IF;

    FOR v_alloc IN 
        SELECT oib.purchase_item_id, oib.qty_pieces, oi.product_id
        FROM public.order_item_batches oib
        JOIN public.order_items oi ON oib.order_item_id = oi.id
        WHERE oi.order_id = p_order_id
    LOOP
        UPDATE public.purchase_items
        SET qty_remaining_pieces = qty_remaining_pieces + v_alloc.qty_pieces
        WHERE id = v_alloc.purchase_item_id;

        INSERT INTO public.stock_movements (
            product_id, movement_type, qty_pieces, ref_type, ref_id, batch_id, reason, created_by
        ) VALUES (
            v_alloc.product_id, 'SALE_REVERSAL', v_alloc.qty_pieces, 'ORDER', p_order_id, v_alloc.purchase_item_id, p_reason, p_user_id
        );
    END LOOP;

    DELETE FROM public.order_item_batches
    WHERE order_item_id IN (SELECT id FROM public.order_items WHERE order_id = p_order_id);

    UPDATE public.orders
    SET delivery_status = 'CANCELLED',
        total_cost = 0,
        profit = 0,
        balance = 0,
        updated_by = p_user_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_order_id;

    INSERT INTO public.audit_logs (
        user_id, action, table_name, record_id, old_values, new_values, reason, created_at
    ) VALUES (
        p_user_id, 'CANCEL_ORDER', 'orders', p_order_id,
        jsonb_build_object('order_no', v_order.order_no, 'delivery_status', 'DELIVERED'),
        jsonb_build_object('order_no', v_order.order_no, 'delivery_status', 'CANCELLED'),
        p_reason, CURRENT_TIMESTAMP
    );
END;
$$;

-- D. CUSTOMER PAYMENT ALLOCATION WATERFALL RPC
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

-- E. DUPLICATE CUSTOMER CHECK RPC
CREATE OR REPLACE FUNCTION public.check_duplicate_customer(
    p_name TEXT,
    p_area_id UUID
) RETURNS TABLE (
    id UUID,
    party_code VARCHAR(20),
    name VARCHAR(150),
    shop_name VARCHAR(150),
    phone VARCHAR(30)
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.party_code, c.name, c.shop_name, c.phone
    FROM public.customers c
    WHERE c.area_id = p_area_id 
      AND c.is_active = TRUE
      AND (
          LOWER(c.name) ILIKE '%' || LOWER(TRIM(p_name)) || '%' OR
          LOWER(TRIM(p_name)) ILIKE '%' || LOWER(c.name) || '%'
      );
END;
$$;

-- F. MERGE CUSTOMERS RPC
CREATE OR REPLACE FUNCTION public.merge_customers(
    p_keep_customer_id UUID,
    p_merge_customer_id UUID,
    p_user_id UUID
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_keep RECORD;
    v_merge RECORD;
BEGIN
    SELECT * INTO v_keep FROM public.customers WHERE id = p_keep_customer_id FOR UPDATE;
    SELECT * INTO v_merge FROM public.customers WHERE id = p_merge_customer_id FOR UPDATE;

    IF v_keep.id IS NULL OR v_merge.id IS NULL THEN
        RAISE EXCEPTION 'Both accounts must exist to merge';
    END IF;

    UPDATE public.customers
    SET opening_balance = opening_balance + v_merge.opening_balance,
        opening_balance_remaining = opening_balance_remaining + v_merge.opening_balance_remaining,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_keep_customer_id;

    UPDATE public.orders
    SET customer_id = p_keep_customer_id,
        updated_by = p_user_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = p_merge_customer_id;

    UPDATE public.customer_payments
    SET customer_id = p_keep_customer_id
    WHERE customer_id = p_merge_customer_id;

    UPDATE public.customer_price_rules
    SET customer_id = p_keep_customer_id
    WHERE customer_id = p_merge_customer_id
      AND product_id NOT IN (
          SELECT product_id FROM public.customer_price_rules WHERE customer_id = p_keep_customer_id
      );

    DELETE FROM public.customer_price_rules WHERE customer_id = p_merge_customer_id;

    UPDATE public.customers
    SET is_active = FALSE,
        merged_into_id = p_keep_customer_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_merge_customer_id;

    INSERT INTO public.audit_logs (
        user_id, action, table_name, record_id, old_values, new_values, reason, created_at
    ) VALUES (
        p_user_id, 'MERGE_CUSTOMERS', 'customers', p_keep_customer_id,
        jsonb_build_object('merged_account_id', p_merge_customer_id, 'merged_code', v_merge.party_code),
        jsonb_build_object('surviving_account_id', p_keep_customer_id, 'surviving_code', v_keep.party_code),
        'Merged customer accounts', CURRENT_TIMESTAMP
    );
END;
$$;

-- 3. PERMISSIONS & ROLES GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Disable RLS for unrestricted database access by service_role and authenticated clients
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_price_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_item_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supplier_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reminder_notes DISABLE ROW LEVEL SECURITY;
