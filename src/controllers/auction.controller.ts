
// src/controllers/auction.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllAuctions = async (req: Request, res: Response) => {
    try {
        const auctions = await prisma.auction.findMany({
            include: {
                bids: {
                    orderBy: {
                        timeStamp: 'desc'
                    }
                },
                product: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const auctionsWithCurrentPrice = auctions.map(auction => {
            // @DEV handle as required
            const highestBid = auction.bids[0]?.amount || auction.reservePrice;
            return {
                ...auction,
                currentPrice: highestBid
            };
        });

        res.json(auctionsWithCurrentPrice);
    } catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error fetching auctions'
        });
    }
};

export const getAuctionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const auction = await prisma.auction.findUnique({
            where: { id: Number(id) },
            include: {
                bids: {
                    orderBy: {
                        timeStamp: 'desc'
                    }
                },
                product: true
            }
        });

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        const currentPrice = auction.bids[0]?.amount || auction.reservePrice;
        const auctionWithCurrentPrice = {
            ...auction,
            currentPrice
        };

        res.json(auctionWithCurrentPrice);
    } catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error fetching auction'
        });
    }
};

export const getActiveAuctions = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const activeAuctions = await prisma.auction.findMany({
            where: {
                auctionEnded: false,
                auctionStartTime: {
                    lte: now
                },
                OR: [
                    {
                        auctionEndTime: {
                            gt: now
                        }
                    },
                    {
                        auctionEndTime: null
                    }
                ]
            },
            include: {
                bids: {
                    orderBy: {
                        timeStamp: 'desc'
                    }
                },
                product: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const activeAuctionsWithPrice = activeAuctions.map(auction => {
            const highestBid = auction.bids[0]?.amount || auction.reservePrice;
            return {
                ...auction,
                currentPrice: highestBid
            };
        });

        res.json(activeAuctionsWithPrice);
    } catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error fetching active auctions'
        });
    }
};