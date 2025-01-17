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
  502,
  p.id,
  NOW(),
  NOW() + INTERVAL '5 minutes',
  'HIGHEST_BID'::"WinningCondition",
  NOW() + INTERVAL '17 days',
  20,
  'OPEN'::"BidType",
  150,
  10,
  true,
  100,
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
  NOW() + INTERVAL '2 hours',
  'HIGHEST_BID'::"WinningCondition",
  NOW() + INTERVAL '10 days',
  20,
  'SEALED'::"BidType",
  200,
  50,
  true,
  150,
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
  NOW() + INTERVAL '1 day',
  'HIGHEST_BID'::"WinningCondition",
  NOW() + INTERVAL '34 days',
  10,
  'SEALED'::"BidType",
  700,
  250,
  true,
  250,
  0,
  false,
  false
FROM "Product" p
WHERE p.name LIKE '%Warhol%';

-- New auctions
INSERT INTO "Auction" (
  name, "auctionType", "creatorId", "productId", "createdAt", 
  "auctionStartTime", "winningCondition", "auctionEndTime", "maxBids",
  "bidType", "reservePrice", "registrationFees", "earnestMoneyRequired",
  "earnestMoneyDeposit", "registrations", "powerPlay", "auctionEnded"
)
SELECT 
  'Premium Watch Auction',
  'DUTCH'::"AuctionType",
  502,
  p.id,
  NOW(),
  NOW() + INTERVAL '5 hours',
  'HIGHEST_BID'::"WinningCondition",
  NOW() + INTERVAL '25 days',
  75,
  'SEALED'::"BidType",
  300,
  100,
  true,
  100,
  0,
  true,
  false
FROM "Product" p
WHERE p.name LIKE '%Patek%';

INSERT INTO "Auction" (
  name, "auctionType", "creatorId", "productId", "createdAt", 
  "auctionStartTime", "winningCondition", "auctionEndTime", "maxBids",
  "bidType", "reservePrice", "registrationFees", "earnestMoneyRequired",
  "earnestMoneyDeposit", "registrations", "powerPlay", "auctionEnded"
)
SELECT 
  'Street Art Special',
  'THE_LAST_PLAY'::"AuctionType",
  503,
  p.id,
  NOW(),
  NOW() + INTERVAL '4 hours',
  'HIGHEST_BID'::"WinningCondition",
  NOW() + INTERVAL '22 days',
  200,
  'OPEN'::"BidType",
  380,
  150,
  true,
  100,
  0,
  false,
  false
FROM "Product" p
WHERE p.name LIKE '%Rolex%';