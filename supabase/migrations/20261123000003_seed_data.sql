-- ====================================================================
-- SUPABASE MIGRATION: 20261123000003_seed_data.sql
-- Seed Data: 3 Categories, 10 Companies, 30 Products, 10 Parties, 2 Suppliers
-- ====================================================================

-- 1. SETTINGS
INSERT INTO public.settings (key, value) VALUES 
('business_profile', '{"name": "Al-Rehman Trading Co.", "address": "Plot 42, Main Wholesale Market, Karachi", "phone": "+92-300-1234567", "invoice_footer": "Thank you for your business. Terms: No returns on loose items."}'::jsonb),
('rules', '{"profit_basis": "LAST_PURCHASE", "reminder_before_days": 3, "reminder_time": "09:00", "invoice_prefix": "ORD-"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. AREAS
INSERT INTO public.areas (id, name) VALUES 
('11111111-0000-0000-0000-000000000001', 'Landhi'),
('11111111-0000-0000-0000-000000000002', 'Korangi'),
('11111111-0000-0000-0000-000000000003', 'Malir'),
('11111111-0000-0000-0000-000000000004', 'Saddar')
ON CONFLICT (name) DO NOTHING;

-- 3. CATEGORIES (3 Categories)
INSERT INTO public.categories (id, name) VALUES 
('22222222-0000-0000-0000-000000000001', 'Beverages'),
('22222222-0000-0000-0000-000000000002', 'Confectionery'),
('22222222-0000-0000-0000-000000000003', 'Paper')
ON CONFLICT (name) DO NOTHING;

-- 4. COMPANIES (10 Companies)
INSERT INTO public.companies (id, name) VALUES 
('33333333-0000-0000-0000-000000000001', 'PepsiCo'),
('33333333-0000-0000-0000-000000000002', 'Coca-Cola'),
('33333333-0000-0000-0000-000000000003', 'Mehran Bottlers (Pakola)'),
('33333333-0000-0000-0000-000000000004', 'Nestlé'),
('33333333-0000-0000-0000-000000000005', 'Hilal Confectionery'),
('33333333-0000-0000-0000-000000000006', 'Candyland / Ismail Industries'),
('33333333-0000-0000-0000-000000000007', 'English Biscuit Manufacturers (EBM)'),
('33333333-0000-0000-0000-000000000008', 'Century Paper & Board'),
('33333333-0000-0000-0000-000000000009', 'Rose Petal'),
('33333333-0000-0000-0000-000000000010', 'Tapal Tea')
ON CONFLICT (name) DO NOTHING;

-- 5. SUPPLIERS (2 Suppliers)
INSERT INTO public.suppliers (id, name, phone, company, address, opening_balance, current_balance) VALUES 
('44444444-0000-0000-0000-000000000001', 'Al-Madina Distributors', '+92-300-8888001', 'Beverages Wholesale Hub', 'Sector 15, Korangi Industrial Area', 0, 0),
('44444444-0000-0000-0000-000000000002', 'Premier Brands Agencies', '+92-300-8888002', 'FMCG Distribution Network', 'Wholesale Market, Saddar', 0, 0)
ON CONFLICT DO NOTHING;

-- 6. PRODUCTS (30 Products across the 3 categories)
INSERT INTO public.products (category_id, company_id, name, sku, flavour, pack_size, pieces_per_carton, sale_rate_carton, last_purchase_rate_carton, min_stock_pieces) VALUES
-- Beverages (12 products)
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Sting Red Energy', 'STING-RED-1.5L', 'Berry', '1.5L', 6, 1100.00, 1050.00, 30),
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Sting Red Energy 500ml', 'STING-RED-500ML', 'Berry', '500ml', 12, 1350.00, 1280.00, 60),
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Pepsi Regular 1.5L', 'PEPSI-REG-1.5L', 'Cola', '1.5L', 6, 1200.00, 1140.00, 36),
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Pepsi Regular 500ml', 'PEPSI-REG-500ML', 'Cola', '500ml', 12, 1400.00, 1320.00, 48),
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', '7Up Regular 1.5L', '7UP-REG-1.5L', 'Lemon Lime', '1.5L', 6, 1200.00, 1140.00, 30),
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Mountain Dew 1.5L', 'DEW-REG-1.5L', 'Citrus', '1.5L', 6, 1220.00, 1150.00, 24),
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'Coca-Cola 1.5L', 'COKE-REG-1.5L', 'Cola', '1.5L', 6, 1200.00, 1140.00, 36),
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'Sprite 1.5L', 'SPRITE-REG-1.5L', 'Lemon Lime', '1.5L', 6, 1200.00, 1140.00, 30),
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'Fanta Orange 1.5L', 'FANTA-ORG-1.5L', 'Orange', '1.5L', 6, 1200.00, 1140.00, 24),
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003', 'Pakola Ice Cream Soda 1.5L', 'PAKOLA-SODA-1.5L', 'Ice Cream Soda', '1.5L', 6, 1150.00, 1090.00, 30),
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', 'Nestle Fruita Vitals Mango 1L', 'NESTLE-MANGO-1L', 'Mango', '1L', 12, 2600.00, 2450.00, 24),
('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', 'Nestle Pure Life 1.5L', 'NESTLE-WATER-1.5L', 'Plain', '1.5L', 6, 600.00, 540.00, 48),

-- Confectionery (12 products)
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000005', 'Hilal Ding Dong Bubble Gum', 'HILAL-DINGDONG-BOX', 'Fruity', 'Box', 24, 960.00, 880.00, 48),
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000005', 'Hilal Fresh Up Spearmint', 'HILAL-FRESHUP-BOX', 'Spearmint', 'Box', 20, 1100.00, 1020.00, 40),
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000005', 'Hilal Cupcake Chocolate', 'HILAL-CUPCAKE-CHOC', 'Chocolate', 'Box', 12, 480.00, 420.00, 36),
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000006', 'Candyland Fantanty Toffee', 'CANDY-FANTANTY-BAG', 'Caramel', 'Bag', 10, 850.00, 780.00, 30),
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000006', 'Candyland Chili Mili Jelly', 'CANDY-CHILIMILI-BOX', 'Tamarind Chili', 'Box', 24, 720.00, 650.00, 48),
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000006', 'Novita Chocolate Wafers', 'CANDY-NOVITA-CHOC', 'Chocolate', 'Box', 12, 600.00, 540.00, 24),
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000007', 'Peek Freans Sooper Normal', 'EBM-SOOPER-NORM', 'Egg & Milk', 'Carton', 24, 1440.00, 1320.00, 48),
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000007', 'Peek Freans Rio Chocolate', 'EBM-RIO-CHOC', 'Chocolate', 'Carton', 24, 1560.00, 1440.00, 48),
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000007', 'Peek Freans Gluco Half-Roll', 'EBM-GLUCO-HALF', 'Wheat', 'Carton', 24, 1200.00, 1100.00, 36),
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000007', 'Peek Freans Saltish', 'EBM-SALTISH-REG', 'Salted', 'Carton', 24, 1320.00, 1220.00, 30),
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000010', 'Tapal Danedar 400g Pouch', 'TAPAL-DANEDAR-400G', 'Black Tea', '400g', 12, 7200.00, 6800.00, 24),
('22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000010', 'Tapal Tezdum 400g Pouch', 'TAPAL-TEZDUM-400G', 'Black Tea', '400g', 12, 6600.00, 6200.00, 24),

-- Paper (6 products)
('22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000009', 'Rose Petal Pop-up Tissue Box', 'ROSE-POPUP-BOX', 'White', 'Box', 24, 3120.00, 2880.00, 36),
('22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000009', 'Rose Petal Maxi Roll Single', 'ROSE-MAXIROLL', 'White', 'Roll', 12, 2880.00, 2640.00, 24),
('22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000009', 'Rose Petal Party Napkins 100s', 'ROSE-NAPKINS-100', 'White', 'Pack', 20, 2200.00, 2000.00, 30),
('22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000008', 'Century A4 Photocopy Paper 70gsm', 'CENTURY-A4-70GSM', 'White', 'Ream', 5, 4500.00, 4200.00, 15),
('22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000008', 'Century A4 Photocopy Paper 80gsm', 'CENTURY-A4-80GSM', 'White', 'Ream', 5, 5200.00, 4850.00, 15),
('22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000008', 'Century Thermal Cash Rolls 80mm', 'CENTURY-THERMAL-80', 'White', 'Box', 50, 4200.00, 3800.00, 25)
ON CONFLICT (sku) DO NOTHING;

-- 7. CUSTOMERS / PARTIES (10 Parties with codes P-0001 to P-0010)
INSERT INTO public.customers (party_code, name, shop_name, phone, address, area_id, opening_balance, opening_balance_remaining, credit_days_limit, default_profit_per_carton) VALUES
('P-0001', 'Iqbal Ahmed', 'Iqbal Karyana Store', '+92-301-1110001', 'Main Bazar, Landhi #3', '11111111-0000-0000-0000-000000000001', 10000.00, 10000.00, 15, 40.00),
('P-0002', 'Muhammad Bilal', 'Bilal Super Mart', '+92-301-1110002', 'Babar Market, Landhi #4', '11111111-0000-0000-0000-000000000001', 0.00, 0.00, 15, 10.00),
('P-0003', 'Tariq Mehmood', 'Tariq General Store', '+92-301-1110003', 'Chiragh Hotel Chowk, Landhi', '11111111-0000-0000-0000-000000000001', 5000.00, 5000.00, 10, 15.00),
('P-0004', 'Kashif Khan', 'Kashif Cold Corner', '+92-301-1110004', 'Sector 36-C, Korangi', '11111111-0000-0000-0000-000000000002', 0.00, 0.00, 7, 25.00),
('P-0005', 'Abdul Rauf', 'Madina Milk & Bakers', '+92-301-1110005', 'Sector 48-B, Korangi #2', '11111111-0000-0000-0000-000000000002', 15000.00, 15000.00, 14, 30.00),
('P-0006', 'Suleman Shah', 'Subhanallah Sweets & Bakers', '+92-301-1110006', 'Malir 15 Stop', '11111111-0000-0000-0000-000000000003', 0.00, 0.00, 21, 20.00),
('P-0007', 'Farhan Ali', 'Farhan Karyana Merchant', '+92-301-1110007', 'Kala Board, Malir', '11111111-0000-0000-0000-000000000003', 8500.00, 8500.00, 15, 35.00),
('P-0008', 'Rashid Minhas', 'Rashid Store', NULL, 'Bohri Bazar, Saddar', '11111111-0000-0000-0000-000000000004', 0.00, 0.00, 0, 50.00), -- Cash only, no phone
('P-0009', 'Naveed Akhtar', 'New Naveed Medical & General', '+92-301-1110009', 'Preedy Street, Saddar', '11111111-0000-0000-0000-000000000004', 0.00, 0.00, 30, 20.00),
('P-0010', 'Kamran Sheikh', 'Lucky Departmental Store', '+92-301-1110010', 'Regal Chowk, Saddar', '11111111-0000-0000-0000-000000000004', 25000.00, 25000.00, 15, 15.00)
ON CONFLICT (party_code) DO NOTHING;
