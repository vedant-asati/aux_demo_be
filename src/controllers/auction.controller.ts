
// src/controllers/auction.controller.ts
import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Auction, Bid, Product } from '@prisma/client';
import type { UpdateAuctionDto } from '../types/auction.types';
// import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

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

export const updateAuction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const auctionData: UpdateAuctionDto = req.body;

        // Start a transaction to ensure data consistency
        const updatedAuction = await prisma.$transaction(async (prisma) => {
            // 1. Update the product
            await prisma.product.update({
                where: { id: auctionData.product.id },
                data: {
                    // name: auctionData.product.name,
                    // description: auctionData.product.description,
                    // category: auctionData.product.category,
                    price: auctionData.product.price,
                    // photoUrl: auctionData.product.photoUrl,
                    updatedAt: new Date(auctionData.product.updatedAt)
                }
            });

            // 2. Update the auction
            const auction = await prisma.auction.update({
                where: { id: Number(id) },
                data: {
                    // name: auctionData.name,
                    // auctionType: auctionData.auctionType as any, // Cast to enum type
                    // creatorId: auctionData.creatorId,
                    // auctionStartTime: new Date(auctionData.auctionStartTime),
                    // winningCondition: auctionData.winningCondition as any, // Cast to enum type
                    // auctionEndTime: auctionData.auctionEndTime ? new Date(auctionData.auctionEndTime) : null,
                    // maxBids: auctionData.maxBids,
                    // bidType: auctionData.bidType as any, // Cast to enum type
                    // reservePrice: auctionData.reservePrice,
                    // registrationFees: auctionData.registrationFees,
                    // earnestMoneyRequired: auctionData.earnestMoneyRequired,
                    // earnestMoneyDeposit: auctionData.earnestMoneyDeposit,
                    // registrations: auctionData.registrations,
                    // powerPlay: auctionData.powerPlay,
                    auctionEnded: auctionData.auctionEnded,
                    winnerId: auctionData.winnerId
                },
                include: {
                    bids: true,
                    product: true
                }
            });

            // 3. Sync bids
            // First, get all existing bid IDs
            const existingBids = await prisma.bid.findMany({
                where: { auctionId: Number(id) },
                select: { id: true }
            });
            const existingBidIds = existingBids.map(bid => bid.id);

            // @DEV Redundant - Not required

            // Find bids to delete (bids that exist in DB but not in incoming data)
            const incomingBidIds = auctionData.bids.map(bid => bid.id);
            const bidsToDelete = existingBidIds.filter(id => !incomingBidIds.includes(id));

            // Delete removed bids
            if (bidsToDelete.length > 0) {
                await prisma.bid.deleteMany({
                    where: { id: { in: bidsToDelete } }
                });
            }

            // Update or create bids
            for (const bid of auctionData.bids) {
                await prisma.bid.upsert({
                    where: { id: bid.id },
                    create: {
                        id: bid.id,
                        auctionId: Number(id),
                        bidderId: bid.bidderId,
                        amount: bid.amount,
                        timeStamp: new Date(bid.timeStamp)
                    },
                    update: {
                        bidderId: bid.bidderId,
                        amount: bid.amount,
                        timeStamp: new Date(bid.timeStamp)
                    }
                });
            }

            return auction;
        });

        res.json(updatedAuction);
    } catch (error) {
        console.error('Error updating auction:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error updating auction'
        });
    }
};

export const createNewAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const auctionData: UpdateAuctionDto = req.body;
        const auction = await prisma.auction.create({
            // data: {
            //     ...req.body,
            //     creatorId: req.user.id, // Added by auth middleware
            //     productId: Number(req.body.productId),
            //     auctionStartTime: new Date(req.body.auctionStartTime),
            //     auctionEndTime: req.body.auctionEndTime ? new Date(req.body.auctionEndTime) : null,
            //     reservePrice: new Decimal(req.body.reservePrice),
            //     registrationFees: new Decimal(req.body.registrationFees),
            //     earnestMoneyDeposit: req.body.earnestMoneyDeposit ? new Decimal(req.body.earnestMoneyDeposit) : null
            // },
            // include: {
            //     product: true
            // }
            data: {
                ...req.body,
                // name: auctionData.name,
                // auctionType: auctionData.auctionType as any, // Cast to enum type
                creatorId: req.body.user.id, // Added by auth middleware
                // creatorId: auctionData.creatorId,
                // auctionStartTime: new Date(auctionData.auctionStartTime),
                // winningCondition: auctionData.winningCondition as any, // Cast to enum type
                // auctionEndTime: auctionData.auctionEndTime ? new Date(auctionData.auctionEndTime) : null,
                // maxBids: auctionData.maxBids,
                // bidType: auctionData.bidType as any, // Cast to enum type
                // reservePrice: auctionData.reservePrice,
                // registrationFees: auctionData.registrationFees,
                // earnestMoneyRequired: auctionData.earnestMoneyRequired,
                // earnestMoneyDeposit: auctionData.earnestMoneyDeposit,
                // registrations: auctionData.registrations,
                // powerPlay: auctionData.powerPlay,
                // auctionEnded: auctionData.auctionEnded,
                // winner: auctionData.winner,
                // bids:auctionData.bids
            },
            include: {
                bids: true,
                product: true
            }
        });
        res.status(201).json(auction);
    } catch (error) {
        next(error);
    }
}

export const deleteAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.auction.delete({
            where: { id: Number(req.params.id) }
        });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}


