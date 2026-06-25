-- 1. Insert Skala Usaha
INSERT INTO business_scales (id, name, created_at, updated_at) VALUES 
(1, 'Mikro', NOW(), NOW()),
(2, 'Kecil', NOW(), NOW()),
(3, 'Menengah', NOW(), NOW()),
(4, 'Besar', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. Insert Jenis Bidang
INSERT INTO business_types (id, name, created_at, updated_at) VALUES 
(1, 'Makanan & Minuman', NOW(), NOW()),
(2, 'Kosmetik', NOW(), NOW()),
(3, 'Obat-obatan', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 3. Insert Jenis Produk
INSERT INTO product_categories (id, business_type_id, name, created_at, updated_at) VALUES 
(1, 1, 'Minuman Ringan', NOW(), NOW()),
(2, 1, 'Camilan', NOW(), NOW()),
(3, 2, 'Skincare', NOW(), NOW()),
(4, 2, 'Make Up', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 4. Insert Skema Penjualan
INSERT INTO sales_schemes (id, name, description, created_at, updated_at) VALUES 
(1, 'Direct Sale', 'Penjualan langsung ke klien', NOW(), NOW()),
(2, 'Partnership', 'Kerjasama pihak ketiga', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 5. Insert Harga Dasar (Sales Scheme Prices)
-- a. Harga Default Direct Sale (3.5 Juta) - Berlaku untuk semuanya jika tidak ada yang lebih spesifik
INSERT INTO sales_scheme_prices (sales_scheme_id, data_source, base_price, description, is_active, created_at, updated_at) 
VALUES (1, 'ORGANIK', 3500000, 'Harga Default Direct Sale', true, NOW(), NOW());

-- b. Harga Khusus Direct Sale untuk Kosmetik (8 Juta)
INSERT INTO sales_scheme_prices (sales_scheme_id, business_type_id, data_source, base_price, description, is_active, created_at, updated_at) 
VALUES (1, 2, 'ORGANIK', 8000000, 'Harga Khusus Bidang Kosmetik', true, NOW(), NOW());

-- c. Harga Khusus Direct Sale untuk Makanan & Minuman Skala Mikro (3 Juta)
INSERT INTO sales_scheme_prices (sales_scheme_id, business_type_id, business_scale_id, data_source, base_price, description, is_active, created_at, updated_at) 
VALUES (1, 1, 1, 'ORGANIK', 3000000, 'Promo Makanan Mikro', true, NOW(), NOW());

-- d. Harga Partnership Default (4 Juta)
INSERT INTO sales_scheme_prices (sales_scheme_id, data_source, base_price, description, is_active, created_at, updated_at) 
VALUES (2, 'MARKETING', 4000000, 'Harga Default Partnership', true, NOW(), NOW());

-- 6. Insert Komponen Biaya (Wilayah & Kriteria)
-- a. Biaya Registrasi Dasar (Mandatory, Semua Wilayah)
INSERT INTO billing_components (name, category, type, base_amount, is_mandatory, created_at, updated_at)
VALUES ('Biaya Registrasi', 'REGISTRASI', 'FIXED', 500000, true, NOW(), NOW());

-- b. Biaya LPH Dasar (Mandatory, Semua Wilayah)
INSERT INTO billing_components (name, category, type, base_amount, is_mandatory, created_at, updated_at)
VALUES ('Biaya LPH (Umum)', 'LPH', 'FIXED', 3000000, true, NOW(), NOW());

-- c. Biaya LPH Khusus DKI Jakarta (Mandatory, Asumsi ID DKI Jakarta = 31)
INSERT INTO billing_components (name, category, type, base_amount, is_mandatory, province_id, created_at, updated_at)
VALUES ('Biaya LPH (Khusus DKI Jakarta)', 'LPH', 'FIXED', 4500000, true, 31, NOW(), NOW());

-- d. Sertifikat BPJPH (Mandatory, Semua Wilayah)
INSERT INTO billing_components (name, category, type, base_amount, is_mandatory, created_at, updated_at)
VALUES ('Sertifikat BPJPH', 'BPJPH', 'FIXED', 1000000, true, NOW(), NOW());

-- e. Sidang MUI Khusus Kosmetik (Mandatory, Kosmetik ID = 2)
INSERT INTO billing_components (name, category, type, base_amount, is_mandatory, business_type_id, created_at, updated_at)
VALUES ('Biaya Sidang MUI (Kosmetik)', 'MUI', 'FIXED', 2000000, true, 2, NOW(), NOW());
