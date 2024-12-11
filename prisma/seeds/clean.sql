-- clean.sql (for resetting the database)
DROP TABLE IF EXISTS "Bid";
DROP TABLE IF EXISTS "Auction";
DROP TABLE IF EXISTS "Product";
DROP TABLE IF EXISTS "User";

-- Types and enums are automatically handled by Prisma migrations