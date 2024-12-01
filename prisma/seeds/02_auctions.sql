-- seeds/02_auctions.sql
INSERT INTO "Auction" (
  name, "auctionType", "creatorId", "productId", "createdAt", 
  "auctionStartTime", "winningCondition", "auctionEndTime", "maxBids",
  "bidType", "reservePrice", "registrationFees", "earnestMoneyRequired",
  "earnestMoneyDeposit", "registrations", "powerPlay", "auctionEnded"
)
SELECT 
  'Luxury Watch Auction',
  'ENGLISH'::"AuctionType",
  501,
  p.id,
  NOW(),
  NOW() + INTERVAL '1 day',
  'HIGHEST_BID'::"WinningCondition",
  NOW() + INTERVAL '7 days',
  50,
  'OPEN'::"BidType",
  15500,
  100,
  true,
  1000,
  0,
  false,
  false
FROM "Product" p
WHERE p.name LIKE '%Rolex%';

INSERT INTO "Auction" (
  name, "auctionType", "creatorId", "productId", "createdAt", 
  "auctionStartTime", "winningCondition", "auctionEndTime", "maxBids",
  "bidType", "reservePrice", "registrationFees", "earnestMoneyRequired",
  "earnestMoneyDeposit", "registrations", "powerPlay", "auctionEnded"
)
SELECT 
  'Classic Car Auction',
  'ENGLISH'::"AuctionType",
  502,
  p.id,
  NOW(),
  NOW() + INTERVAL '2 days',
  'HIGHEST_BID'::"WinningCondition",
  NOW() + INTERVAL '10 days',
  30,
  'SEALED'::"BidType",
  240000,
  500,
  true,
  5000,
  0,
  true,
  false
FROM "Product" p
WHERE p.name LIKE '%Mustang%';

INSERT INTO "Auction" (
  name, "auctionType", "creatorId", "productId", "createdAt", 
  "auctionStartTime", "winningCondition", "auctionEndTime", "maxBids",
  "bidType", "reservePrice", "registrationFees", "earnestMoneyRequired",
  "earnestMoneyDeposit", "registrations", "powerPlay", "auctionEnded"
)
SELECT 
  'Fine Art Auction',
  'VICKERY'::"AuctionType",
  503,
  p.id,
  NOW(),
  NOW() + INTERVAL '3 days',
  'HIGHEST_BID'::"WinningCondition",
  NOW() + INTERVAL '14 days',
  100,
  'SEALED'::"BidType",
  75000,
  250,
  true,
  2500,
  0,
  false,
  false
FROM "Product" p
WHERE p.name LIKE '%Warhol%';