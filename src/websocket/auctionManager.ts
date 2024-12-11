
// // src/websocket/auctionManager.ts
// import { WebSocket } from 'ws';
// import { PrismaClient, AuctionType, WinningCondition } from '@prisma/client';
// import { WebSocketClient, AuctionRooms } from '../types/auction.types';

// const prisma = new PrismaClient();

// export class AuctionManager {
//   private static instance: AuctionManager;
//   private auctionTimers: Map<number, NodeJS.Timeout> = new Map();
//   private rooms: AuctionRooms = {};

//   private constructor() {
//     this.initializeActiveAuctions();
//   }

//   static getInstance(): AuctionManager {
//     if (!AuctionManager.instance) {
//       AuctionManager.instance = new AuctionManager();
//     }
//     return AuctionManager.instance;
//   }

//   private async initializeActiveAuctions() {
//     const activeAuctions = await prisma.auction.findMany({
//       where: {
//         auctionEnded: false,
//         auctionStartTime: {
//           lte: new Date()
//         },
//         auctionEndTime: {
//           gt: new Date()
//         }
//       }
//     });

//     activeAuctions.forEach(auction => {
//       if (auction.auctionEndTime) {
//         this.scheduleAuctionEnd(auction.id, auction.auctionEndTime);
//       }
//     });
//   }

//   async handleNewBid(auctionId: number, bidderId: number, amount: string): Promise<any> {
//     const auction = await prisma.auction.findUnique({
//       where: { id: auctionId },
//       include: {
//         bids: {
//           orderBy: {
//             amount: 'desc'
//           },
//           take: 1
//         }
//       }
//     });

//     if (!auction) throw new Error('Auction not found');
//     if (auction.auctionEnded) throw new Error('Auction has ended');

//     // Validate bid based on auction type
//     await this.validateBid(auction, amount);

//     const bid = await prisma.bid.create({
//       data: {
//         auctionId,
//         bidderId,
//         amount,
//         timeStamp: new Date()
//       }
//     });

//     // Handle auction-specific logic
//     await this.handleAuctionTypeSpecificLogic(auction, bid);

//     return bid;
//   }

//   private async validateBid(auction: any, amount: string) {
//     const bidAmount = new Decimal(amount);

//     switch (auction.auctionType) {
//       case 'ENGLISH':
//         if (auction.bids[0] && bidAmount.lte(auction.bids[0].amount)) {
//           throw new Error('Bid must be higher than current highest bid');
//         }
//         break;
//       case 'DUTCH':
//         if (bidAmount.gt(auction.currentPrice)) {
//           throw new Error('Bid must be equal to or less than current price');
//         }
//         break;
//       // Add other auction type validations
//     }

//     if (bidAmount.lt(auction.reservePrice)) {
//       throw new Error('Bid must be higher than reserve price');
//     }
//   }

//   private async handleAuctionTypeSpecificLogic(auction: any, newBid: any) {
//     switch (auction.auctionType) {
//       case 'DUTCH':
//         // For Dutch auctions, first valid bid wins
//         await this.endAuction(auction.id, newBid.bidderId);
//         break;
//       case 'THE_LAST_PLAY':
//         // Extend auction time if bid is placed near end
//         await this.handleLastPlayExtension(auction);
//         break;
//     }
//   }

//   private async handleLastPlayExtension(auction: any) {
//     const now = new Date();
//     const endTime = new Date(auction.auctionEndTime);
//     const timeLeft = endTime.getTime() - now.getTime();

//     if (timeLeft < 5 * 60 * 1000) { // Less than 5 minutes left
//       const newEndTime = new Date(now.getTime() + 5 * 60 * 1000);
//       await this.updateAuctionEndTime(auction.id, newEndTime);
//     }
//   }

//   async scheduleAuctionStart(auctionId: number, startTime: Date) {
//     const now = new Date();
//     const timeUntilStart = startTime.getTime() - now.getTime();

//     if (timeUntilStart <= 0) return;

//     setTimeout(async () => {
//       await this.startAuction(auctionId);
//     }, timeUntilStart);
//   }

//   private async startAuction(auctionId: number) {
//     const auction = await prisma.auction.findUnique({
//       where: { id: auctionId }
//     });

//     if (!auction || auction.auctionEnded) return;

//     this.broadcastAuctionStart(auctionId);

//     if (auction.auctionEndTime) {
//       this.scheduleAuctionEnd(auctionId, auction.auctionEndTime);
//     }
//   }

//   private async scheduleAuctionEnd(auctionId: number, endTime: Date) {
//     const now = new Date();
//     const timeUntilEnd = endTime.getTime() - now.getTime();

//     if (timeUntilEnd <= 0) {
//       await this.endAuction(auctionId);
//       return;
//     }

//     const timer = setTimeout(async () => {
//       await this.endAuction(auctionId);
//     }, timeUntilEnd);

//     this.auctionTimers.set(auctionId, timer);
//   }

//   private async endAuction(auctionId: number, forcedWinner?: number) {
//     const auction = await prisma.auction.findUnique({
//       where: { id: auctionId },
//       include: {
//         bids: true
//       }
//     });

//     if (!auction || auction.auctionEnded) return;

//     let winner = forcedWinner;
//     if (!winner) {
//       winner = await this.determineWinner(auction);
//     }

//     await prisma.auction.update({
//       where: { id: auctionId },
//       data: {
//         auctionEnded: true,
//         winner
//       }
//     });

//     this.broadcastAuctionEnd(auctionId, winner);
//     this.auctionTimers.delete(auctionId);
//   }

//   private async determineWinner(auction: any): Promise<number | undefined> {
//     let winningBid;

//     switch (auction.auctionType) {
//       case 'VICKERY':
//         // Second highest bid wins
//         const sortedBids = auction.bids.sort((a: any, b: any) => 
//           new Decimal(b.amount).minus(new Decimal(a.amount)).toNumber()
//         );
//         winningBid = sortedBids[1] || sortedBids[0];
//         break;
//       case 'HIGHEST_UNIQUE':
//         winningBid = this.findUniqueWinningBid(auction.bids, true);
//         break;
//       case 'LOWEST_UNIQUE':
//         winningBid = this.findUniqueWinningBid(auction.bids, false);
//         break;
//       default:
//         // Default to highest bid
//         winningBid = auction.bids.reduce((highest: any, current: any) =>
//           new Decimal(current.amount).gt(new Decimal(highest.amount)) ? current : highest
//         , auction.bids[0]);
//     }

//     return winningBid?.bidderId;
//   }

//   private findUniqueWinningBid(bids: any[], highest: boolean) {
//     // Group bids by amount
//     const bidGroups = bids.reduce((groups: any, bid: any) => {
//       const amount = bid.amount.toString();
//       groups[amount] = groups[amount] || [];
//       groups[amount].push(bid);
//       return groups;
//     }, {});

//     // Filter for unique bids
//     const uniqueBids = Object.entries(bidGroups)
//       .filter(([_, bids]: any) => bids.length === 1)
//       .map(([amount, bids]: any) => ({
//         amount: new Decimal(amount),
//         bid: bids[0]
//       }));

//     if (uniqueBids.length === 0) return null;

//     // Sort by amount (highest or lowest)
//     uniqueBids.sort((a, b) => 
//       highest ? 
//         b.amount.minus(a.amount).toNumber() : 
//         a.amount.minus(b.amount).toNumber()
//     );

//     return uniqueBids[0].bid;
//   }

//   broadcastToRoom(auctionId: number, message: any, excludeClient?: WebSocketClient) {
//     const room = this.rooms[auctionId];
//     if (room) {
//       room.forEach(client => {
//         if (client.readyState === WebSocket.OPEN && client !== excludeClient) {
//           client.send(JSON.stringify(message));
//         }
//       });
//     }
//   }

//   private broadcastAuctionStart(auctionId: number) {
//     this.broadcastToRoom(auctionId, {
//       type: 'AUCTION_START',
//       auctionId
//     });
//   }

//   private broadcastAuctionEnd(auctionId: number, winner?: number) {
//     this.broadcastToRoom(auctionId, {
//       type: 'AUCTION_END',
//       auctionId,
//       winner
//     });
//   }

//   addClientToRoom(auctionId: number, client: WebSocketClient) {
//     if (!this.rooms[auctionId]) {
//       this.rooms[auctionId] = new Set();
//     }
//     this.rooms[auctionId].add(client);
//   }

//   removeClientFromRoom(auctionId: number, client: WebSocketClient) {
//     if (this.rooms[auctionId]) {
//       this.rooms[auctionId].delete(client);
//     }
//   }
// }

// // // src/websocket/auctionManager.ts
// // import { WebSocket } from 'ws';
// // import { PrismaClient } from '@prisma/client';

// // const prisma = new PrismaClient();

// // export class AuctionManager {
// //   private static instance: AuctionManager;
// //   private auctionTimers: Map<number, NodeJS.Timeout> = new Map();

// //   private constructor() {}

// //   static getInstance(): AuctionManager {
// //     if (!AuctionManager.instance) {
// //       AuctionManager.instance = new AuctionManager();
// //     }
// //     return AuctionManager.instance;
// //   }

// //   async startAuction(auctionId: number, endTime: Date, broadcastFn: (message: any) => void) {
// //     const now = new Date();
// //     const timeUntilEnd = endTime.getTime() - now.getTime();

// //     if (timeUntilEnd <= 0) {
// //       await this.endAuction(auctionId, broadcastFn);
// //       return;
// //     }

// //     const timer = setTimeout(async () => {
// //       await this.endAuction(auctionId, broadcastFn);
// //     }, timeUntilEnd);

// //     this.auctionTimers.set(auctionId, timer);
// //   }

// //   private async endAuction(auctionId: number, broadcastFn: (message: any) => void) {
// //     const auction = await prisma.auction.findUnique({
// //       where: { id: auctionId },
// //       include: {
// //         bids: {
// //           orderBy: {
// //             amount: auction.winningCondition === 'HIGHEST_BID' ? 'desc' : 'asc'
// //           },
// //           take: 1
// //         }
// //       }
// //     });

// //     if (!auction || auction.auctionEnded) return;

// //     const winner = auction.bids[0]?.bidderId;

// //     await prisma.auction.update({
// //       where: { id: auctionId },
// //       data: {
// //         auctionEnded: true,
// //         winner
// //       }
// //     });

// //     broadcastFn({
// //       type: 'AUCTION_END',
// //       auctionId,
// //       winner,
// //       winningBid: auction.bids[0]
// //     });

// //     this.auctionTimers.delete(auctionId);
// //   }

// //   stopAuction(auctionId: number) {
// //     const timer = this.auctionTimers.get(auctionId);
// //     if (timer) {
// //       clearTimeout(timer);
// //       this.auctionTimers.delete(auctionId);
// //     }
// //   }
// // }
