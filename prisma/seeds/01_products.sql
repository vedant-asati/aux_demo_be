-- seeds/01_products.sql
INSERT INTO "Product" (name, description, category, price, "photoUrl", "createdAt", "updatedAt") 
VALUES 
  ('Rolex X', '1960s Rolex',
  'Luxury Watches', 450, 'https://img.tatacliq.com/images/i20//658Wx734H/MP000000024000538_658Wx734H_202410081723151.jpeg', NOW(), NOW()),
  ('Ford Mustang', 'Rare classic car, fully restored. Candy Apple Red with black interior.', 'Classic Cars', 550, 'https://example.com/mustang.jpg', NOW(), NOW()),
  ('Original Andy Warhol Print', 'Signed silk-screen print from the Campbell''s Soup series.', 'Fine Art', 80, 'https://example.com/warhol.jpg', NOW(), NOW()),
  ('Patek Philippe Nautilus', 'Brand new Patek Philippe Nautilus 5711/1A-010', 'Luxury Watches', 120000, 'https://example.com/patek.jpg', NOW(), NOW()),
  ('BMW X7', 'BMW X7 Car', 'Classic Cars', 99000, 'https://chybmedia.s3.ap-south-1.amazonaws.com/models/cars/x7-18-145.png', NOW(), NOW());
