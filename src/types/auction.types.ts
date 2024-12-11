import { Auction, Bid, Product } from '@prisma/client';

export interface WebSocketMessage {
  type: 'BID' | 'NEW_BID' | 'ERROR' | 'ROOM_JOINED' | 'ROOM_LEFT' | 'AUCTION_START' | 'AUCTION_END';
  auctionId?: number;
  bidderId?: number;
  amount?: number;
  bid?: Bid;
  message?: string;
}
// export interface UpdateAuctionDto {
//   id: number;
//   name: string;
//   auctionType: string;
//   creatorId: number;
//   productId: number;
//   createdAt: string;
//   auctionStartTime: string;
//   winningCondition: string;
//   auctionEndTime?: string | null;
//   maxBids?: number | null;
//   bidType: string;
//   reservePrice: string;
//   registrationFees: string;
//   earnestMoneyRequired: boolean;
//   earnestMoneyDeposit?: string | null;
//   registrations: number;
//   powerPlay: boolean;
//   auctionEnded: boolean;
//   winner?: number | null;
//   bids: {
//     id: number;
//     auctionId: number;
//     bidderId: number;
//     amount: string;
//     timeStamp: string;
//   }[];
//   product: {
//     id: number;
//     name: string;
//     description: string;
//     category: string;
//     price: string;
//     photoUrl: string;
//     createdAt: string;
//     updatedAt: string;
//   };
//   currentPrice: string;
// }

// Extended auction type with bids and product included
export interface AuctionWithBidsAndProduct extends Auction {
  bids: Bid[];
  product: Product;
}

// Auction update DTO for updates or notifications
export interface UpdateAuctionDto extends AuctionWithBidsAndProduct {
  currentPrice: string;
}

// User interface for minimal details
export interface MinimalUser {
  id: number;
  name: string;
}
