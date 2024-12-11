-- seeds/03_bids.sql
-- Insert bids for Luxury Watch Auction
INSERT INTO "Bid" ("auctionId", "bidderId", amount, "timeStamp")
SELECT 
  a.id,
  101,
  16500,
  NOW() - INTERVAL '2 hours'
FROM "Auction" a
WHERE a.name = 'Luxury Watch Auction';

INSERT INTO "Bid" ("auctionId", "bidderId", amount, "timeStamp")
SELECT 
  a.id,
  102,
  17000,
  NOW() - INTERVAL '1 hour'
FROM "Auction" a
WHERE a.name = 'Luxury Watch Auction';

-- Insert bid for Classic Car Auction
INSERT INTO "Bid" ("auctionId", "bidderId", amount, "timeStamp")
SELECT 
  a.id,
  103,
  255000,
  NOW() - INTERVAL '30 minutes'
FROM "Auction" a
WHERE a.name = 'Classic Car Auction';

-- Additional sample bids
INSERT INTO "Bid" ("auctionId", "bidderId", amount, "timeStamp")
SELECT 
  a.id,
  104,
  17500,
  NOW() - INTERVAL '45 minutes'
FROM "Auction" a
WHERE a.name = 'Luxury Watch Auction';

INSERT INTO "Bid" ("auctionId", "bidderId", amount, "timeStamp")
SELECT 
  a.id,
  105,
  260000,
  NOW() - INTERVAL '15 minutes'
FROM "Auction" a
WHERE a.name = 'Classic Car Auction';

-- New bids for newer auctions
INSERT INTO "Bid" ("auctionId", "bidderId", amount, "timeStamp")
SELECT 
  a.id,
  101,
  125000,
  NOW() - INTERVAL '3 hours'
FROM "Auction" a
WHERE a.name = 'Premium Watch Auction';

INSERT INTO "Bid" ("auctionId", "bidderId", amount, "timeStamp")
SELECT 
  a.id,
  103,
  185000,
  NOW() - INTERVAL '2 hours'
FROM "Auction" a
WHERE a.name = 'Street Art Special';