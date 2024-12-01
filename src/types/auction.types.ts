import { Auction, Bid, Product } from '@prisma/client';

export interface WebSocketMessage {
  type: 'BID' | 'NEW_BID' | 'ERROR';
  auctionId?: number;
  bidderId?: number;
  amount?: number;
  bid?: Bid;
  message?: string;
}