-- clean.sql (for resetting the database)
DROP TABLE IF EXISTS "Bid";
DROP TABLE IF EXISTS "Auction";
DROP TABLE IF EXISTS "Product";

-- Types and enums are automatically handled by Prisma migrations