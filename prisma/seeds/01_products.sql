-- seeds/01_products.sql
INSERT INTO "Product" (name, description, category, price, "photoUrl", "createdAt", "updatedAt") 
VALUES 
  ('Vintage Rolex Submariner', '1960s Rolex Submariner in excellent condition. Original parts with box and papers.', 'Luxury Watches', 15000, 'https://img.tatacliq.com/images/i20//658Wx734H/MP000000024000538_658Wx734H_202410081723151.jpeg', NOW(), NOW()),
  ('1969 Ford Mustang Boss 429', 'Rare classic car, fully restored. Candy Apple Red with black interior.', 'Classic Cars', 250000, 'https://example.com/mustang.jpg', NOW(), NOW()),
  ('Original Andy Warhol Print', 'Signed silk-screen print from the Campbell''s Soup series.', 'Fine Art', 80000, 'https://example.com/warhol.jpg', NOW(), NOW());
