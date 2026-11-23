-- ====================================================================
-- GRANT ROLES PERMISSIONS (Supabase PostgreSQL)
-- ====================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Allow read access for authenticated and anon users on master tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_notes ENABLE ROW LEVEL SECURITY;

-- Permissive policies for service_role and authenticated users
CREATE POLICY "Allow all for service_role" ON public.categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.companies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.companies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.areas FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.areas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.areas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.customer_price_rules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.customer_price_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.customer_price_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.suppliers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.suppliers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.order_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.purchases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.purchases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.purchase_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.purchase_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.purchase_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.customer_payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.customer_payments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.customer_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service_role" ON public.payment_allocations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON public.payment_allocations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.payment_allocations FOR ALL TO authenticated USING (true) WITH CHECK (true);
