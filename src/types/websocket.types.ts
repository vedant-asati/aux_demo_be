import { WebSocket } from 'ws';
import { Auction, Bid, User } from '@prisma/client';

export interface WebSocketClient extends WebSocket {
  auctionId?: number;
  userId?: number;
  clientId?: string;
}

export interface AuctionRooms {
  [key: string]: Set<WebSocketClient>;
}

export type WebSocketMessageType = 
  | 'JOIN_ROOM' 
  | 'LEAVE_ROOM' 
  | 'BID' 
  | 'NEW_BID' 
  | 'BID_CONFIRMED'
  | 'AUCTION_START' 
  | 'AUCTION_END' 
  | 'ROOM_JOINED'
  | 'ROOM_LEFT'
  | 'ERROR';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  auctionId?: number;
  bidderId?: number;
  amount?: number;
  bid?: Bid;
  message?: string;
  auction?: Auction;
  winner?: User;
  winningBid?: Bid;
}

export interface AuthenticatedWebSocketClient extends WebSocketClient {
  userId?: number;
  isAdmin?: boolean;
}

export interface UserSocketMap {
  [userId: number]: {
      socket: AuthenticatedWebSocketClient;
      rooms: Set<number>;
  };
}