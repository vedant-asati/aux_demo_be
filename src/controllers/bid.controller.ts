import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuctionService } from '../services/auction.service';
import { getWebSocketService } from '../websocket';
import { WebSocketMessage } from '../types/websocket.types';

const prisma = new PrismaClient();

export const createBid = async (req: Request, res: Response) => {
  try {
    const { auctionId, amount, user } = req.body;

    const bid = await AuctionService.placeBid(auctionId, user.id, amount);
    const wsService = getWebSocketService();
    // console.log("wsService: ", wsService);

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });

    const broadcastMessage: WebSocketMessage = {
      type: 'NEW_BID',
      ...(auction!.bidType === 'OPEN' ? { bid } : {})
    };

    wsService.broadcastToRoom(auctionId, broadcastMessage);

    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};