import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createBid = async (req: Request, res: Response) => {
  try {
    const { auctionId, bidderId, amount } = req.body;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.auctionEnded) {
      return res.status(400).json({ message: 'Auction has ended' });
    }

    const bid = await prisma.bid.create({
      data: {
        auctionId,
        bidderId,
        amount
      }
    });

    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};