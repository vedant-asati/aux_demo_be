import { Auction, Bid, Product, AuctionType, BidType, WinningCondition } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import WebSocket from 'ws';

export interface WebSocketMessage {
    type: 'JOIN_ROOM' | 'LEAVE_ROOM' | 'BID' | 'NEW_BID' | 'ERROR' | 'ROOM_JOINED' | 'ROOM_LEFT' | 'AUCTION_START' | 'AUCTION_END';
    auctionId?: number;
    bidderId?: number;
    amount?: number;
    bid?: Bid;
    message?: string;
}

export interface WebSocketClient extends WebSocket {
    auctionId?: number;
}

export interface AuctionRooms {
    [key: string]: Set<WebSocketClient>;
}

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

export interface MinimalUser {
    id: number;
    name: string;
}

export interface UpdateProductDto {
    name?: string;
    description?: string;
    category?: string;
    price?: number | string;
    photoUrl?: string;
}