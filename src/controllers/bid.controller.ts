import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuctionService } from '../services/auction.service';

const prisma = new PrismaClient();

export const createBid = async (req: Request, res: Response) => {
  try {
    const { auctionId, bidderId, amount, user } = req.body;

    if (user.id !== bidderId && user.role !== 'ADMIN') throw new Error("Unauthorized.");
    const bid = await AuctionService.placeBid(auctionId, bidderId, amount);
    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};