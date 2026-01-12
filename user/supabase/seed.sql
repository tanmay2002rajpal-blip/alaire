-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data
TRUNCATE TABLE cart_items CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE product_variants CASCADE;
TRUNCATE TABLE product_options CASCADE;
TRUNCATE TABLE product_details CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE discount_codes CASCADE;
TRUNCATE TABLE blog_posts CASCADE;
TRUNCATE TABLE store_settings CASCADE;

-- Seed Categories
INSERT INTO categories (id, name, slug, description, display_order, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Men''s Clothing', 'mens-clothing', 'Stylish and comfortable clothing for men', 1, NOW(), NOW()),
(uuid_generate_v4(), 'Women''s Clothing', 'womens-clothing', 'Fashion-forward clothing for women', 2, NOW(), NOW()),
(uuid_generate_v4(), 'Accessories', 'accessories', 'Complete your look with our accessories', 3, NOW(), NOW()),
(uuid_generate_v4(), 'Footwear', 'footwear', 'Step out in style with our footwear collection', 4, NOW(), NOW()),
(uuid_generate_v4(), 'New Arrivals', 'new-arrivals', 'Check out our latest additions', 5, NOW(), NOW());

-- Store category IDs for reference
DO $$
DECLARE
    mens_id UUID;
    womens_id UUID;
    accessories_id UUID;
    footwear_id UUID;
    new_arrivals_id UUID;

    -- Product IDs
    oxford_id UUID;
    chinos_id UUID;
    dress_id UUID;
    blazer_id UUID;
    bag_id UUID;
    sneakers_id UUID;
    scarf_id UUID;
    overcoat_id UUID;

    -- Product Option IDs
    option_id UUID;

    -- Product Variant IDs
    variant_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO mens_id FROM categories WHERE slug = 'mens-clothing';
    SELECT id INTO womens_id FROM categories WHERE slug = 'womens-clothing';
    SELECT id INTO accessories_id FROM categories WHERE slug = 'accessories';
    SELECT id INTO footwear_id FROM categories WHERE slug = 'footwear';
    SELECT id INTO new_arrivals_id FROM categories WHERE slug = 'new-arrivals';

    -- Seed Products

    -- 1. Classic Oxford Shirt
    INSERT INTO products (id, name, slug, description, category_id, base_price, featured, created_at, updated_at)
    VALUES (uuid_generate_v4(), 'Classic Oxford Shirt', 'classic-oxford-shirt', 'A timeless wardrobe essential. Our Classic Oxford Shirt is crafted from premium cotton with a comfortable regular fit. Perfect for both casual and formal occasions.', mens_id, 2499, true, NOW(), NOW())
    RETURNING id INTO oxford_id;

    INSERT INTO product_details (id, product_id, tab_name, content, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), oxford_id, 'Details', 'Material: 100% Premium Cotton\nFit: Regular Fit\nCollar: Button-down collar\nSleeve: Full sleeves with button cuffs\nOccasion: Casual, Formal', 1, NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'Care', 'Machine wash cold with like colors\nDo not bleach\nTumble dry low\nIron on medium heat\nDry clean if needed', 2, NOW(), NOW());

    -- Oxford Shirt - Color Option
    INSERT INTO product_options (id, product_id, name, values, display_order, created_at, updated_at)
    VALUES (uuid_generate_v4(), oxford_id, 'Color', ARRAY['White', 'Blue', 'Black'], 1, NOW(), NOW())
    RETURNING id INTO option_id;

    -- Oxford Shirt - Size Option
    INSERT INTO product_options (id, product_id, name, values, display_order, created_at, updated_at)
    VALUES (uuid_generate_v4(), oxford_id, 'Size', ARRAY['S', 'M', 'L', 'XL'], 2, NOW(), NOW());

    -- Oxford Shirt - Variants
    INSERT INTO product_variants (id, product_id, sku, option_values, price, compare_at_price, stock_quantity, image_url, created_at, updated_at) VALUES
    (uuid_generate_v4(), oxford_id, 'OXF-WHT-S', '{"Color": "White", "Size": "S"}', 2499, NULL, 25, 'https://placehold.co/600x800?text=Oxford+Shirt+White', NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'OXF-WHT-M', '{"Color": "White", "Size": "M"}', 2499, NULL, 30, 'https://placehold.co/600x800?text=Oxford+Shirt+White', NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'OXF-WHT-L', '{"Color": "White", "Size": "L"}', 2499, NULL, 28, 'https://placehold.co/600x800?text=Oxford+Shirt+White', NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'OXF-WHT-XL', '{"Color": "White", "Size": "XL"}', 2499, NULL, 20, 'https://placehold.co/600x800?text=Oxford+Shirt+White', NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'OXF-BLU-S', '{"Color": "Blue", "Size": "S"}', 2499, 2999, 22, 'https://placehold.co/600x800?text=Oxford+Shirt+Blue', NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'OXF-BLU-M', '{"Color": "Blue", "Size": "M"}', 2499, 2999, 35, 'https://placehold.co/600x800?text=Oxford+Shirt+Blue', NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'OXF-BLU-L', '{"Color": "Blue", "Size": "L"}', 2499, 2999, 30, 'https://placehold.co/600x800?text=Oxford+Shirt+Blue', NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'OXF-BLU-XL', '{"Color": "Blue", "Size": "XL"}', 2499, 2999, 18, 'https://placehold.co/600x800?text=Oxford+Shirt+Blue', NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'OXF-BLK-S', '{"Color": "Black", "Size": "S"}', 2499, NULL, 20, 'https://placehold.co/600x800?text=Oxford+Shirt+Black', NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'OXF-BLK-M', '{"Color": "Black", "Size": "M"}', 2499, NULL, 32, 'https://placehold.co/600x800?text=Oxford+Shirt+Black', NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'OXF-BLK-L', '{"Color": "Black", "Size": "L"}', 2499, NULL, 28, 'https://placehold.co/600x800?text=Oxford+Shirt+Black', NOW(), NOW()),
    (uuid_generate_v4(), oxford_id, 'OXF-BLK-XL', '{"Color": "Black", "Size": "XL"}', 2499, NULL, 15, 'https://placehold.co/600x800?text=Oxford+Shirt+Black', NOW(), NOW());

    -- 2. Slim Fit Chinos
    INSERT INTO products (id, name, slug, description, category_id, base_price, featured, created_at, updated_at)
    VALUES (uuid_generate_v4(), 'Slim Fit Chinos', 'slim-fit-chinos', 'Modern slim fit chinos that combine style and comfort. Made from stretch cotton twill for all-day comfort and a sleek silhouette.', mens_id, 1999, false, NOW(), NOW())
    RETURNING id INTO chinos_id;

    INSERT INTO product_details (id, product_id, tab_name, content, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), chinos_id, 'Details', 'Material: 98% Cotton, 2% Elastane\nFit: Slim Fit\nRise: Mid-rise\nClosure: Zip fly with button\nPockets: Front slant pockets, back welt pockets', 1, NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'Care', 'Machine wash cold separately\nDo not bleach\nLine dry\nIron on low heat if needed\nDo not dry clean', 2, NOW(), NOW());

    INSERT INTO product_options (id, product_id, name, values, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), chinos_id, 'Color', ARRAY['Khaki', 'Navy', 'Olive'], 1, NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'Size', ARRAY['30', '32', '34', '36'], 2, NOW(), NOW());

    INSERT INTO product_variants (id, product_id, sku, option_values, price, compare_at_price, stock_quantity, image_url, created_at, updated_at) VALUES
    (uuid_generate_v4(), chinos_id, 'CHI-KHA-30', '{"Color": "Khaki", "Size": "30"}', 1999, NULL, 20, 'https://placehold.co/600x800?text=Chinos+Khaki', NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'CHI-KHA-32', '{"Color": "Khaki", "Size": "32"}', 1999, NULL, 28, 'https://placehold.co/600x800?text=Chinos+Khaki', NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'CHI-KHA-34', '{"Color": "Khaki", "Size": "34"}', 1999, NULL, 25, 'https://placehold.co/600x800?text=Chinos+Khaki', NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'CHI-KHA-36', '{"Color": "Khaki", "Size": "36"}', 1999, NULL, 18, 'https://placehold.co/600x800?text=Chinos+Khaki', NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'CHI-NAV-30', '{"Color": "Navy", "Size": "30"}', 1999, 2499, 22, 'https://placehold.co/600x800?text=Chinos+Navy', NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'CHI-NAV-32', '{"Color": "Navy", "Size": "32"}', 1999, 2499, 30, 'https://placehold.co/600x800?text=Chinos+Navy', NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'CHI-NAV-34', '{"Color": "Navy", "Size": "34"}', 1999, 2499, 26, 'https://placehold.co/600x800?text=Chinos+Navy', NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'CHI-NAV-36', '{"Color": "Navy", "Size": "36"}', 1999, 2499, 15, 'https://placehold.co/600x800?text=Chinos+Navy', NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'CHI-OLV-30', '{"Color": "Olive", "Size": "30"}', 1999, NULL, 18, 'https://placehold.co/600x800?text=Chinos+Olive', NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'CHI-OLV-32', '{"Color": "Olive", "Size": "32"}', 1999, NULL, 24, 'https://placehold.co/600x800?text=Chinos+Olive', NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'CHI-OLV-34', '{"Color": "Olive", "Size": "34"}', 1999, NULL, 20, 'https://placehold.co/600x800?text=Chinos+Olive', NOW(), NOW()),
    (uuid_generate_v4(), chinos_id, 'CHI-OLV-36', '{"Color": "Olive", "Size": "36"}', 1999, NULL, 12, 'https://placehold.co/600x800?text=Chinos+Olive', NOW(), NOW());

    -- 3. Floral Summer Dress
    INSERT INTO products (id, name, slug, description, category_id, base_price, featured, created_at, updated_at)
    VALUES (uuid_generate_v4(), 'Floral Summer Dress', 'floral-summer-dress', 'Embrace the season with our beautiful floral summer dress. Featuring a flattering A-line silhouette and vibrant floral prints perfect for warm weather.', womens_id, 3499, true, NOW(), NOW())
    RETURNING id INTO dress_id;

    INSERT INTO product_details (id, product_id, tab_name, content, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), dress_id, 'Details', 'Material: 100% Rayon\nFit: A-line silhouette\nLength: Midi length\nSleeve: Short sleeves\nPattern: Floral print\nClosure: Back zip', 1, NOW(), NOW()),
    (uuid_generate_v4(), dress_id, 'Care', 'Hand wash cold separately\nDo not bleach\nHang to dry in shade\nIron on low heat\nDry clean recommended', 2, NOW(), NOW());

    INSERT INTO product_options (id, product_id, name, values, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), dress_id, 'Color', ARRAY['Red', 'Blue'], 1, NOW(), NOW()),
    (uuid_generate_v4(), dress_id, 'Size', ARRAY['XS', 'S', 'M', 'L'], 2, NOW(), NOW());

    INSERT INTO product_variants (id, product_id, sku, option_values, price, compare_at_price, stock_quantity, image_url, created_at, updated_at) VALUES
    (uuid_generate_v4(), dress_id, 'DRS-RED-XS', '{"Color": "Red", "Size": "XS"}', 3499, 4499, 15, 'https://placehold.co/600x800?text=Floral+Dress+Red', NOW(), NOW()),
    (uuid_generate_v4(), dress_id, 'DRS-RED-S', '{"Color": "Red", "Size": "S"}', 3499, 4499, 22, 'https://placehold.co/600x800?text=Floral+Dress+Red', NOW(), NOW()),
    (uuid_generate_v4(), dress_id, 'DRS-RED-M', '{"Color": "Red", "Size": "M"}', 3499, 4499, 25, 'https://placehold.co/600x800?text=Floral+Dress+Red', NOW(), NOW()),
    (uuid_generate_v4(), dress_id, 'DRS-RED-L', '{"Color": "Red", "Size": "L"}', 3499, 4499, 18, 'https://placehold.co/600x800?text=Floral+Dress+Red', NOW(), NOW()),
    (uuid_generate_v4(), dress_id, 'DRS-BLU-XS', '{"Color": "Blue", "Size": "XS"}', 3499, NULL, 12, 'https://placehold.co/600x800?text=Floral+Dress+Blue', NOW(), NOW()),
    (uuid_generate_v4(), dress_id, 'DRS-BLU-S', '{"Color": "Blue", "Size": "S"}', 3499, NULL, 20, 'https://placehold.co/600x800?text=Floral+Dress+Blue', NOW(), NOW()),
    (uuid_generate_v4(), dress_id, 'DRS-BLU-M', '{"Color": "Blue", "Size": "M"}', 3499, NULL, 24, 'https://placehold.co/600x800?text=Floral+Dress+Blue', NOW(), NOW()),
    (uuid_generate_v4(), dress_id, 'DRS-BLU-L', '{"Color": "Blue", "Size": "L"}', 3499, NULL, 16, 'https://placehold.co/600x800?text=Floral+Dress+Blue', NOW(), NOW());

    -- 4. Linen Blazer
    INSERT INTO products (id, name, slug, description, category_id, base_price, featured, created_at, updated_at)
    VALUES (uuid_generate_v4(), 'Linen Blazer', 'linen-blazer', 'Elevate your smart-casual wardrobe with our premium linen blazer. Breathable and lightweight, perfect for transitional weather and layering.', mens_id, 5999, true, NOW(), NOW())
    RETURNING id INTO blazer_id;

    INSERT INTO product_details (id, product_id, tab_name, content, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), blazer_id, 'Details', 'Material: 100% Pure Linen\nFit: Regular fit\nLapel: Notch lapel\nClosure: Two-button closure\nPockets: Flap pockets, chest pocket\nLining: Half lined', 1, NOW(), NOW()),
    (uuid_generate_v4(), blazer_id, 'Care', 'Dry clean only\nDo not bleach\nIron on medium heat with steam\nStore on hanger\nProfessional cleaning recommended', 2, NOW(), NOW());

    INSERT INTO product_options (id, product_id, name, values, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), blazer_id, 'Color', ARRAY['Beige', 'Grey'], 1, NOW(), NOW()),
    (uuid_generate_v4(), blazer_id, 'Size', ARRAY['S', 'M', 'L', 'XL'], 2, NOW(), NOW());

    INSERT INTO product_variants (id, product_id, sku, option_values, price, compare_at_price, stock_quantity, image_url, created_at, updated_at) VALUES
    (uuid_generate_v4(), blazer_id, 'BLZ-BEI-S', '{"Color": "Beige", "Size": "S"}', 5999, 7999, 10, 'https://placehold.co/600x800?text=Linen+Blazer+Beige', NOW(), NOW()),
    (uuid_generate_v4(), blazer_id, 'BLZ-BEI-M', '{"Color": "Beige", "Size": "M"}', 5999, 7999, 15, 'https://placehold.co/600x800?text=Linen+Blazer+Beige', NOW(), NOW()),
    (uuid_generate_v4(), blazer_id, 'BLZ-BEI-L', '{"Color": "Beige", "Size": "L"}', 5999, 7999, 12, 'https://placehold.co/600x800?text=Linen+Blazer+Beige', NOW(), NOW()),
    (uuid_generate_v4(), blazer_id, 'BLZ-BEI-XL', '{"Color": "Beige", "Size": "XL"}', 5999, 7999, 8, 'https://placehold.co/600x800?text=Linen+Blazer+Beige', NOW(), NOW()),
    (uuid_generate_v4(), blazer_id, 'BLZ-GRY-S', '{"Color": "Grey", "Size": "S"}', 5999, NULL, 12, 'https://placehold.co/600x800?text=Linen+Blazer+Grey', NOW(), NOW()),
    (uuid_generate_v4(), blazer_id, 'BLZ-GRY-M', '{"Color": "Grey", "Size": "M"}', 5999, NULL, 18, 'https://placehold.co/600x800?text=Linen+Blazer+Grey', NOW(), NOW()),
    (uuid_generate_v4(), blazer_id, 'BLZ-GRY-L', '{"Color": "Grey", "Size": "L"}', 5999, NULL, 14, 'https://placehold.co/600x800?text=Linen+Blazer+Grey', NOW(), NOW()),
    (uuid_generate_v4(), blazer_id, 'BLZ-GRY-XL', '{"Color": "Grey", "Size": "XL"}', 5999, NULL, 10, 'https://placehold.co/600x800?text=Linen+Blazer+Grey', NOW(), NOW());

    -- 5. Leather Crossbody Bag
    INSERT INTO products (id, name, slug, description, category_id, base_price, featured, created_at, updated_at)
    VALUES (uuid_generate_v4(), 'Leather Crossbody Bag', 'leather-crossbody-bag', 'Versatile and stylish crossbody bag crafted from genuine leather. Features adjustable strap and multiple compartments for organized storage.', accessories_id, 2999, false, NOW(), NOW())
    RETURNING id INTO bag_id;

    INSERT INTO product_details (id, product_id, tab_name, content, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), bag_id, 'Details', 'Material: Genuine Leather\nClosure: Magnetic snap\nStrap: Adjustable crossbody strap\nCompartments: Main compartment, zip pocket, card slots\nDimensions: 9" x 7" x 3"', 1, NOW(), NOW()),
    (uuid_generate_v4(), bag_id, 'Care', 'Wipe clean with soft damp cloth\nDo not use harsh chemicals\nCondition leather every 3-6 months\nStore in dust bag when not in use\nKeep away from direct sunlight and heat', 2, NOW(), NOW());

    INSERT INTO product_options (id, product_id, name, values, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), bag_id, 'Color', ARRAY['Black', 'Tan', 'Brown'], 1, NOW(), NOW());

    INSERT INTO product_variants (id, product_id, sku, option_values, price, compare_at_price, stock_quantity, image_url, created_at, updated_at) VALUES
    (uuid_generate_v4(), bag_id, 'BAG-BLK', '{"Color": "Black"}', 2999, NULL, 35, 'https://placehold.co/600x800?text=Crossbody+Bag+Black', NOW(), NOW()),
    (uuid_generate_v4(), bag_id, 'BAG-TAN', '{"Color": "Tan"}', 2999, 3499, 28, 'https://placehold.co/600x800?text=Crossbody+Bag+Tan', NOW(), NOW()),
    (uuid_generate_v4(), bag_id, 'BAG-BRN', '{"Color": "Brown"}', 2999, NULL, 30, 'https://placehold.co/600x800?text=Crossbody+Bag+Brown', NOW(), NOW());

    -- 6. Canvas Sneakers
    INSERT INTO products (id, name, slug, description, category_id, base_price, featured, created_at, updated_at)
    VALUES (uuid_generate_v4(), 'Canvas Sneakers', 'canvas-sneakers', 'Classic canvas sneakers that never go out of style. Comfortable rubber sole and breathable canvas upper make these perfect for everyday wear.', footwear_id, 1799, true, NOW(), NOW())
    RETURNING id INTO sneakers_id;

    INSERT INTO product_details (id, product_id, tab_name, content, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), sneakers_id, 'Details', 'Material: Canvas upper, rubber sole\nClosure: Lace-up\nSole: Cushioned insole, textured outsole\nStyle: Low-top sneakers\nOccasion: Casual, everyday wear', 1, NOW(), NOW()),
    (uuid_generate_v4(), sneakers_id, 'Care', 'Remove loose dirt with soft brush\nSpot clean with mild soap and water\nAir dry at room temperature\nDo not machine wash\nDo not tumble dry', 2, NOW(), NOW());

    INSERT INTO product_options (id, product_id, name, values, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), sneakers_id, 'Color', ARRAY['White', 'Black'], 1, NOW(), NOW()),
    (uuid_generate_v4(), sneakers_id, 'Size', ARRAY['7', '8', '9', '10', '11'], 2, NOW(), NOW());

    INSERT INTO product_variants (id, product_id, sku, option_values, price, compare_at_price, stock_quantity, image_url, created_at, updated_at) VALUES
    (uuid_generate_v4(), sneakers_id, 'SNK-WHT-7', '{"Color": "White", "Size": "7"}', 1799, NULL, 20, 'https://placehold.co/600x800?text=Canvas+Sneakers+White', NOW(), NOW()),
    (uuid_generate_v4(), sneakers_id, 'SNK-WHT-8', '{"Color": "White", "Size": "8"}', 1799, NULL, 25, 'https://placehold.co/600x800?text=Canvas+Sneakers+White', NOW(), NOW()),
    (uuid_generate_v4(), sneakers_id, 'SNK-WHT-9', '{"Color": "White", "Size": "9"}', 1799, NULL, 30, 'https://placehold.co/600x800?text=Canvas+Sneakers+White', NOW(), NOW()),
    (uuid_generate_v4(), sneakers_id, 'SNK-WHT-10', '{"Color": "White", "Size": "10"}', 1799, NULL, 28, 'https://placehold.co/600x800?text=Canvas+Sneakers+White', NOW(), NOW()),
    (uuid_generate_v4(), sneakers_id, 'SNK-WHT-11', '{"Color": "White", "Size": "11"}', 1799, NULL, 18, 'https://placehold.co/600x800?text=Canvas+Sneakers+White', NOW(), NOW()),
    (uuid_generate_v4(), sneakers_id, 'SNK-BLK-7', '{"Color": "Black", "Size": "7"}', 1799, 2199, 22, 'https://placehold.co/600x800?text=Canvas+Sneakers+Black', NOW(), NOW()),
    (uuid_generate_v4(), sneakers_id, 'SNK-BLK-8', '{"Color": "Black", "Size": "8"}', 1799, 2199, 28, 'https://placehold.co/600x800?text=Canvas+Sneakers+Black', NOW(), NOW()),
    (uuid_generate_v4(), sneakers_id, 'SNK-BLK-9', '{"Color": "Black", "Size": "9"}', 1799, 2199, 32, 'https://placehold.co/600x800?text=Canvas+Sneakers+Black', NOW(), NOW()),
    (uuid_generate_v4(), sneakers_id, 'SNK-BLK-10', '{"Color": "Black", "Size": "10"}', 1799, 2199, 26, 'https://placehold.co/600x800?text=Canvas+Sneakers+Black', NOW(), NOW()),
    (uuid_generate_v4(), sneakers_id, 'SNK-BLK-11', '{"Color": "Black", "Size": "11"}', 1799, 2199, 15, 'https://placehold.co/600x800?text=Canvas+Sneakers+Black', NOW(), NOW());

    -- 7. Silk Scarf
    INSERT INTO products (id, name, slug, description, category_id, base_price, featured, created_at, updated_at)
    VALUES (uuid_generate_v4(), 'Silk Scarf', 'silk-scarf', 'Add a touch of elegance to any outfit with our luxurious silk scarf. Features beautiful multicolor patterns and soft, smooth texture.', accessories_id, 999, false, NOW(), NOW())
    RETURNING id INTO scarf_id;

    INSERT INTO product_details (id, product_id, tab_name, content, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), scarf_id, 'Details', 'Material: 100% Pure Silk\nDimensions: 35" x 35"\nPattern: Multicolor abstract prints\nEdge: Hand-rolled edges\nStyle: Versatile - wear as neck scarf, headband, or bag accessory', 1, NOW(), NOW()),
    (uuid_generate_v4(), scarf_id, 'Care', 'Hand wash in cold water with mild detergent\nDo not wring or twist\nHang to dry in shade\nIron on low heat while slightly damp\nDry clean recommended for best results', 2, NOW(), NOW());

    INSERT INTO product_options (id, product_id, name, values, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), scarf_id, 'Pattern', ARRAY['Floral Mix', 'Geometric Mix', 'Abstract Mix'], 1, NOW(), NOW());

    INSERT INTO product_variants (id, product_id, sku, option_values, price, compare_at_price, stock_quantity, image_url, created_at, updated_at) VALUES
    (uuid_generate_v4(), scarf_id, 'SCF-FLR', '{"Pattern": "Floral Mix"}', 999, 1299, 40, 'https://placehold.co/600x800?text=Silk+Scarf+Floral', NOW(), NOW()),
    (uuid_generate_v4(), scarf_id, 'SCF-GEO', '{"Pattern": "Geometric Mix"}', 999, NULL, 35, 'https://placehold.co/600x800?text=Silk+Scarf+Geometric', NOW(), NOW()),
    (uuid_generate_v4(), scarf_id, 'SCF-ABS', '{"Pattern": "Abstract Mix"}', 999, NULL, 38, 'https://placehold.co/600x800?text=Silk+Scarf+Abstract', NOW(), NOW());

    -- 8. Wool Overcoat
    INSERT INTO products (id, name, slug, description, category_id, base_price, featured, created_at, updated_at)
    VALUES (uuid_generate_v4(), 'Wool Overcoat', 'wool-overcoat', 'Stay warm and sophisticated with our premium wool overcoat. A timeless piece that combines classic tailoring with modern style. New arrival for the season!', new_arrivals_id, 8999, true, NOW(), NOW())
    RETURNING id INTO overcoat_id;

    INSERT INTO product_details (id, product_id, tab_name, content, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), overcoat_id, 'Details', 'Material: 80% Wool, 20% Polyester\nFit: Regular fit\nLength: Knee length\nClosure: Single-breasted with buttons\nPockets: Side pockets, inner pockets\nLining: Fully lined\nCollar: Notch collar', 1, NOW(), NOW()),
    (uuid_generate_v4(), overcoat_id, 'Care', 'Dry clean only\nDo not bleach\nDo not tumble dry\nIron on low heat if needed\nStore on padded hanger\nProfessional cleaning recommended', 2, NOW(), NOW());

    INSERT INTO product_options (id, product_id, name, values, display_order, created_at, updated_at) VALUES
    (uuid_generate_v4(), overcoat_id, 'Color', ARRAY['Charcoal', 'Camel'], 1, NOW(), NOW()),
    (uuid_generate_v4(), overcoat_id, 'Size', ARRAY['S', 'M', 'L', 'XL'], 2, NOW(), NOW());

    INSERT INTO product_variants (id, product_id, sku, option_values, price, compare_at_price, stock_quantity, image_url, created_at, updated_at) VALUES
    (uuid_generate_v4(), overcoat_id, 'OVC-CHR-S', '{"Color": "Charcoal", "Size": "S"}', 8999, 10999, 8, 'https://placehold.co/600x800?text=Wool+Overcoat+Charcoal', NOW(), NOW()),
    (uuid_generate_v4(), overcoat_id, 'OVC-CHR-M', '{"Color": "Charcoal", "Size": "M"}', 8999, 10999, 12, 'https://placehold.co/600x800?text=Wool+Overcoat+Charcoal', NOW(), NOW()),
    (uuid_generate_v4(), overcoat_id, 'OVC-CHR-L', '{"Color": "Charcoal", "Size": "L"}', 8999, 10999, 10, 'https://placehold.co/600x800?text=Wool+Overcoat+Charcoal', NOW(), NOW()),
    (uuid_generate_v4(), overcoat_id, 'OVC-CHR-XL', '{"Color": "Charcoal", "Size": "XL"}', 8999, 10999, 6, 'https://placehold.co/600x800?text=Wool+Overcoat+Charcoal', NOW(), NOW()),
    (uuid_generate_v4(), overcoat_id, 'OVC-CAM-S', '{"Color": "Camel", "Size": "S"}', 8999, NULL, 10, 'https://placehold.co/600x800?text=Wool+Overcoat+Camel', NOW(), NOW()),
    (uuid_generate_v4(), overcoat_id, 'OVC-CAM-M', '{"Color": "Camel", "Size": "M"}', 8999, NULL, 14, 'https://placehold.co/600x800?text=Wool+Overcoat+Camel', NOW(), NOW()),
    (uuid_generate_v4(), overcoat_id, 'OVC-CAM-L', '{"Color": "Camel", "Size": "L"}', 8999, NULL, 12, 'https://placehold.co/600x800?text=Wool+Overcoat+Camel', NOW(), NOW()),
    (uuid_generate_v4(), overcoat_id, 'OVC-CAM-XL', '{"Color": "Camel", "Size": "XL"}', 8999, NULL, 8, 'https://placehold.co/600x800?text=Wool+Overcoat+Camel', NOW(), NOW());

END $$;

-- Seed Discount Codes
INSERT INTO discount_codes (id, code, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, times_used, valid_from, valid_until, is_active, created_at, updated_at) VALUES
(uuid_generate_v4(), 'WELCOME10', 'percentage', 10, 999, NULL, 1000, 0, NOW(), NOW() + INTERVAL '90 days', true, NOW(), NOW()),
(uuid_generate_v4(), 'FLAT500', 'fixed', 500, 2999, NULL, 500, 0, NOW(), NOW() + INTERVAL '60 days', true, NOW(), NOW()),
(uuid_generate_v4(), 'SUMMER20', 'percentage', 20, 1499, 1000, 2000, 0, NOW(), NOW() + INTERVAL '120 days', true, NOW(), NOW());

-- Seed Blog Posts
INSERT INTO blog_posts (id, title, slug, excerpt, content, featured_image_url, published_at, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Summer Style Guide 2025', 'summer-style-guide-2025', 'Discover the hottest trends and timeless classics for this summer season. From breezy linens to vibrant prints, we have got you covered.',
'# Summer Style Guide 2025

Summer is here, and it is time to refresh your wardrobe with pieces that keep you cool and stylish. This season is all about comfort meeting elegance.

## Key Trends

1. **Breathable Fabrics**: Linen and cotton are your best friends
2. **Vibrant Colors**: Do not shy away from bold hues
3. **Floral Prints**: Always a summer staple
4. **Lightweight Layers**: Perfect for transitional moments

## Must-Have Pieces

- Classic Oxford Shirt in white or light blue
- Linen blazer for smart-casual occasions
- Floral summer dress for effortless style
- Canvas sneakers for comfortable daily wear

## Styling Tips

Mix and match these pieces to create versatile looks that take you from day to night. Remember, the key to summer style is staying comfortable while looking put-together.

Stay tuned for more style tips and new arrivals!',
'https://placehold.co/1200x600?text=Summer+Style+Guide', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

(uuid_generate_v4(), 'How to Build a Capsule Wardrobe', 'how-to-build-capsule-wardrobe', 'Learn the art of creating a versatile wardrobe with fewer, high-quality pieces that you will love wearing every day.',
'# How to Build a Capsule Wardrobe

A capsule wardrobe is a collection of essential, timeless pieces that can be mixed and matched to create numerous outfits. Here is how to build yours.

## Start with Basics

1. **Classic White Shirt**: Works for any occasion
2. **Well-Fitted Jeans or Chinos**: Versatile bottoms
3. **Neutral Blazer**: Instant polish
4. **Quality Footwear**: Invest in comfortable, classic styles

## Choose a Color Palette

Stick to 3-4 neutral colors and 1-2 accent colors. This makes mixing and matching effortless.

## Quality Over Quantity

Invest in well-made pieces that will last for years. Look for:
- Quality fabrics
- Solid construction
- Timeless designs
- Proper fit

## The 10-Piece Foundation

- 3 tops (shirts/blouses)
- 2 bottoms (pants/skirts)
- 2 dresses or suits
- 1 outerwear piece
- 1 pair of everyday shoes
- 1 accessory

## Seasonal Additions

Add 5-10 seasonal pieces each season to keep your wardrobe fresh without overwhelming it.

Building a capsule wardrobe takes time, but the result is a closet full of pieces you love and actually wear!',
'https://placehold.co/1200x600?text=Capsule+Wardrobe', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

(uuid_generate_v4(), 'Sustainable Fashion Tips', 'sustainable-fashion-tips', 'Small changes can make a big impact. Explore our guide to making more sustainable fashion choices without compromising on style.',
'# Sustainable Fashion Tips

Making sustainable fashion choices is easier than you think. Here are practical tips to reduce your fashion footprint.

## Buy Less, Choose Well

Quality over quantity is not just good for your wardrobe—it is good for the planet.

## Care for Your Clothes

Proper care extends the life of your garments:
- Wash in cold water
- Air dry when possible
- Store properly
- Repair instead of replace

## Choose Natural Fibers

Look for:
- Organic cotton
- Linen
- Wool
- Silk

These materials are biodegradable and often more sustainable than synthetics.

## Support Ethical Brands

Choose brands that:
- Pay fair wages
- Use sustainable materials
- Have transparent supply chains
- Minimize waste

## Second-Hand Shopping

Vintage and consignment stores are treasure troves of unique pieces with zero environmental impact.

## Recycle and Donate

When you are done with a garment, give it a second life through donation or textile recycling programs.

## Timeless Style

Invest in classic pieces that transcend trends. Our collection focuses on timeless designs that you will wear for years to come.

Every small choice adds up. Start your sustainable fashion journey today!',
'https://placehold.co/1200x600?text=Sustainable+Fashion', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');

-- Seed Store Settings
INSERT INTO store_settings (id, setting_key, setting_value, created_at, updated_at) VALUES
(uuid_generate_v4(), 'flat_shipping_rate', '99', NOW(), NOW()),
(uuid_generate_v4(), 'free_shipping_threshold', '1499', NOW(), NOW()),
(uuid_generate_v4(), 'instagram_username', '@storename', NOW(), NOW());

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Categories: 5';
    RAISE NOTICE 'Products: 8';
    RAISE NOTICE 'Discount Codes: 3';
    RAISE NOTICE 'Blog Posts: 3';
    RAISE NOTICE 'Store Settings: 3';
END $$;
