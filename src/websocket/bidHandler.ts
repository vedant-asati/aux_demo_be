import { WebSocket, WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';
import { WebSocketMessage } from '../types/auction.types';

const prisma = new PrismaClient();

export default function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', async (message: string) => {
      try {
        const data: WebSocketMessage = JSON.parse(message.toString());
        
        if (data.type === 'BID' && data.auctionId && data.bidderId && data.amount) {
          // Create new bid
          const bid = await prisma.bid.create({
            data: {
              auctionId: data.auctionId,
              bidderId: data.bidderId,
              amount: data.amount
            }
          });

          // Broadcast to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'NEW_BID',
                auctionId: data.auctionId,
                bid
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        ws.send(JSON.stringify({ 
          type: 'ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        }));
      }
    });
  });

  return wss;
}