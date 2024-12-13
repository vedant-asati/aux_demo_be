import { Auction, Bid, Product, AuctionType, BidType, WinningCondition } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Base auction update DTO
export interface UpdateAuctionDto {
    id: number;
    name: string;
    auctionType: AuctionType;
    creatorId: number;
    productId: number;
    auctionStartTime: Date | string;
    winningCondition: WinningCondition;
    auctionEndTime?: Date | string | null;
    maxBids?: number | null;
    bidType: BidType;
    reservePrice: number | string | Decimal;
    registrationFees: number | string | Decimal;
    earnestMoneyRequired: boolean;
    earnestMoneyDeposit?: number | string | Decimal | null;
    registrations: number;
    powerPlay: boolean;
    auctionEnded: boolean;
    winnerId?: number | null;
    bids: {
        id: number;
        auctionId: number;
        bidderId: number;
        amount: number | string | Decimal;
        timeStamp: Date | string;
    }[];
    product: {
        id: number;
        price: number | string | Decimal;
        updatedAt: Date | string;
    };
    currentPrice?: number | string | Decimal;
}

export interface AuctionWithBidsAndProduct extends Auction {
    bids: Bid[];
    product: Product;
}