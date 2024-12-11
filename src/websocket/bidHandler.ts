import { WebSocket, WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';

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

  const broadcastToRoom = (auctionId: string, message: any, sender?: WebSocketClient) => {
    const room = rooms[auctionId];
    if (room) {
      room.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client !== sender) {
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
      // @DEV Fix this
      // const winner = auction.bids[0]?.bidderId;

      const winner = await prisma.user.findUnique({
        where: { id: Number(auction.bids[0]?.bidderId) },
        // include: {
        //   bids: {
        //     orderBy: {
        //       amount: 'desc'
        //     }
        //   }
        // }
      });

      await prisma.auction.update({
        where: { id: Number(auctionId) },
        data: {
          auctionEnded: true,
          // winner: winner
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

  const scheduleAuctionNotifications = async () => {
    const auctions = await prisma.auction.findMany({
      where: {
        auctionEnded: false,
        auctionStartTime: { lte: new Date() },
      },
      include: {
        bids: true
      }
    });

    auctions.forEach(auction => {
      const now = new Date();
      const startDelay = new Date(auction.auctionStartTime).getTime() - now.getTime();
      const endDelay = new Date(auction.auctionEndTime || now).getTime() - now.getTime();

      if (startDelay > 0) {
        setTimeout(() => {
          broadcastToRoom(auction.id.toString(), {
            type: 'AUCTION_START',
            auctionId: auction.id,
            message: `Auction ${auction.name} has started.`
          });
        }, startDelay);
      }

      if (endDelay > 0) {
        setTimeout(async () => {
          await checkAuctionEnd(auction.id.toString());
        }, endDelay);
      }
    });
  };

  wss.on('connection', (ws: WebSocketClient) => {
    console.log('New WebSocket connection');

    ws.on('message', async (message: string) => {
      try {
        const data: WebSocketMessage = JSON.parse(message);
        console.log("message: ", message);

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
              type: 'ROOM_JOINED',
              message: `Successfully joined auction ${auctionId}`,
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
            console.log("bid: ", bid);

            broadcastToRoom(data.auctionId, {
              type: 'NEW_BID',
              bid
            }, ws);

            // Send confirmation to the sender
            ws.send(JSON.stringify({
              type: 'BID_CONFIRMED',
              bid,
              message: `Your bid of ${data.amount} was placed successfully`
            }));

            // @DEV Not sure of usage
            await checkAuctionEnd(data.auctionId);
            break;
          }

          case 'LEAVE_ROOM': {
            if (ws.auctionId && rooms[ws.auctionId]) {
              rooms[ws.auctionId].delete(ws);
              ws.send(JSON.stringify({
                type: 'ROOM_LEFT',
                message: `Successfully left auction ${ws.auctionId}`
              }));
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

  scheduleAuctionNotifications();

  return wss;
}
