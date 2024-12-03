// src/websocket/bidHandler.ts
import { WebSocket, WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';
import { parse } from 'url';

const prisma = new PrismaClient();

interface WebSocketClient extends WebSocket {
  auctionId?: string;
}

interface AuctionRooms {
  [key: string]: Set<WebSocketClient>;
}

interface WebSocketMessage {
  type: 'BID' | 'JOIN_ROOM' | 'LEAVE_ROOM';
  auctionId: string;
  bidderId?: number;
  amount?: string;
}

export default function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server });
  const rooms: AuctionRooms = {};

  const broadcastToRoom = (auctionId: string, message: any) => {
    const room = rooms[auctionId];
    if (room) {
      room.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  };

  const checkAuctionEnd = async (auctionId: string) => {
    const auction = await prisma.auction.findUnique({
      where: { id: Number(auctionId) },
      include: {
        bids: {
          orderBy: {
            amount: 'desc'
          }
        }
      }
    });

    if (!auction) return;

    const now = new Date();
    const bidCount = auction.bids.length;
    const timeEnded = auction.auctionEndTime && new Date(auction.auctionEndTime) <= now;
    const maxBidsReached = auction.maxBids && bidCount >= auction.maxBids;

    if ((timeEnded || maxBidsReached) && !auction.auctionEnded) {
      const winner = auction.bids[0]?.bidderId;

      await prisma.auction.update({
        where: { id: Number(auctionId) },
        data: {
          auctionEnded: true,
          winner
        }
      });

      broadcastToRoom(auctionId, {
        type: 'AUCTION_END',
        auctionId,
        winner,
        winningBid: auction.bids[0]
      });
    }
  };

  wss.on('connection', (ws: WebSocketClient, req) => {
    console.log('New WebSocket connection');

    ws.on('message', async (message: string) => {
      try {
        const data: WebSocketMessage = JSON.parse(message);
        console.log(message);

        switch (data.type) {
          case 'JOIN_ROOM': {
            const auctionId = data.auctionId;
            ws.auctionId = auctionId;

            if (!rooms[auctionId]) {
              rooms[auctionId] = new Set();
            }
            rooms[auctionId].add(ws);

            // Send current auction state
            const auction = await prisma.auction.findUnique({
              where: { id: Number(auctionId) },
              include: {
                bids: {
                  orderBy: {
                    timeStamp: 'desc'
                  }
                }
              }
            });

            ws.send(JSON.stringify({
              type: 'AUCTION_STATE',
              auction
            }));
            break;
          }

          case 'BID': {
            if (!data.auctionId || !data.bidderId || !data.amount) {
              throw new Error('Invalid bid data');
            }

            const auction = await prisma.auction.findUnique({
              where: { id: Number(data.auctionId) }
            });

            console.log("auction: ", auction);

            if (!auction || auction.auctionEnded) {
              throw new Error('Auction not available for bidding');
            }

            const bid = await prisma.bid.create({
              data: {
                auctionId: Number(data.auctionId),
                bidderId: data.bidderId,
                amount: data.amount,
                timeStamp: new Date()
              }
            });

            broadcastToRoom(data.auctionId, {
              type: 'NEW_BID',
              bid
            });

            await checkAuctionEnd(data.auctionId);
            break;
          }

          case 'LEAVE_ROOM': {
            if (ws.auctionId && rooms[ws.auctionId]) {
              rooms[ws.auctionId].delete(ws);
            }
            break;
          }
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });

    ws.on('close', () => {
      if (ws.auctionId && rooms[ws.auctionId]) {
        rooms[ws.auctionId].delete(ws);
      }
    });
  });

  return wss;
}