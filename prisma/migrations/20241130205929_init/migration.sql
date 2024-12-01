-- CreateEnum
CREATE TYPE "BidType" AS ENUM ('OPEN', 'SEALED');

-- CreateEnum
CREATE TYPE "AuctionType" AS ENUM ('ENGLISH', 'VICKERY', 'THE_LAST_PLAY', 'HIGHEST_UNIQUE', 'LOWEST_UNIQUE', 'DUTCH');

-- CreateEnum
CREATE TYPE "WinningCondition" AS ENUM ('HIGHEST_BID', 'LOWEST_BID');

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auction" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "auctionType" "AuctionType" NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auctionStartTime" TIMESTAMP(3) NOT NULL,
    "winningCondition" "WinningCondition" NOT NULL,
    "auctionEndTime" TIMESTAMP(3),
    "maxBids" INTEGER,
    "bidType" "BidType" NOT NULL,
    "reservePrice" DECIMAL(65,30) NOT NULL,
    "registrationFees" DECIMAL(65,30) NOT NULL,
    "earnestMoneyRequired" BOOLEAN NOT NULL DEFAULT false,
    "earnestMoneyDeposit" DECIMAL(65,30),
    "registrations" INTEGER NOT NULL DEFAULT 0,
    "powerPlay" BOOLEAN NOT NULL DEFAULT false,
    "auctionEnded" BOOLEAN NOT NULL DEFAULT false,
    "winner" INTEGER,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" SERIAL NOT NULL,
    "auctionId" INTEGER NOT NULL,
    "bidderId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "timeStamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
