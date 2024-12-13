import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { UpdateAuctionDto } from '../types/auction.types';
import { Decimal } from '@prisma/client/runtime/library';

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

export const deleteAuction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Use a transaction to ensure all related records are deleted
        await prisma.$transaction(async (prisma) => {
            // First delete all bids associated with this auction
            await prisma.bid.deleteMany({
                where: {
                    auctionId: Number(id)
                }
            });

            // Then delete the auction itself
            await prisma.auction.delete({
                where: {
                    id: Number(id)
                }
            });
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting auction:', error);
        next(error);
    }
};

export const updateAuction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const auctionData: UpdateAuctionDto = req.body;

        const updatedAuction = await prisma.$transaction(async (prisma) => {
            // 1. Update the product
            await prisma.product.update({
                where: { id: auctionData.productId },
                data: {
                    price: new Decimal(auctionData.product.price.toString()),
                    updatedAt: new Date()
                }
            });

            // 2. Update the auction
            const auction = await prisma.auction.update({
                where: { id: Number(id) },
                data: {
                    name: auctionData.name,
                    auctionType: auctionData.auctionType,
                    auctionStartTime: new Date(auctionData.auctionStartTime),
                    auctionEndTime: auctionData.auctionEndTime ? new Date(auctionData.auctionEndTime) : null,
                    winningCondition: auctionData.winningCondition,
                    maxBids: auctionData.maxBids,
                    bidType: auctionData.bidType,
                    reservePrice: new Decimal(auctionData.reservePrice.toString()),
                    registrationFees: new Decimal(auctionData.registrationFees.toString()),
                    earnestMoneyRequired: auctionData.earnestMoneyRequired,
                    earnestMoneyDeposit: auctionData.earnestMoneyDeposit ?
                        new Decimal(auctionData.earnestMoneyDeposit.toString()) : null,
                    registrations: auctionData.registrations,
                    powerPlay: auctionData.powerPlay,
                    auctionEnded: auctionData.auctionEnded,
                    winnerId: auctionData.winnerId
                },
                include: {
                    bids: true,
                    product: true,
                    winner: true,
                    creator: true
                }
            });

            // 3. Handle bids
            if (auctionData.bids) {
                for (const bid of auctionData.bids) {
                    await prisma.bid.upsert({
                        where: { id: bid.id },
                        create: {
                            id: bid.id,
                            auctionId: Number(id),
                            bidderId: bid.bidderId,
                            amount: new Decimal(bid.amount.toString()),
                            timeStamp: new Date(bid.timeStamp)
                        },
                        update: {
                            amount: new Decimal(bid.amount.toString()),
                            timeStamp: new Date(bid.timeStamp)
                        }
                    });
                }
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
            data: {
                name: auctionData.name,
                auctionType: auctionData.auctionType,
                creatorId: req.body.user?.id, // Assuming user is set by auth middleware
                productId: auctionData.productId,
                auctionStartTime: new Date(auctionData.auctionStartTime),
                winningCondition: auctionData.winningCondition,
                auctionEndTime: auctionData.auctionEndTime ? new Date(auctionData.auctionEndTime) : null,
                maxBids: auctionData.maxBids,
                bidType: auctionData.bidType,
                reservePrice: new Decimal(auctionData.reservePrice.toString()),
                registrationFees: new Decimal(auctionData.registrationFees.toString()),
                earnestMoneyRequired: auctionData.earnestMoneyRequired,
                earnestMoneyDeposit: auctionData.earnestMoneyDeposit ?
                    new Decimal(auctionData.earnestMoneyDeposit.toString()) : null,
                registrations: 0, // Start with 0 registrations
                powerPlay: auctionData.powerPlay ?? false,
                auctionEnded: false // New auctions start as not ended
            },
            include: {
                bids: true,
                product: true,
                creator: true
            }
        });

        // Schedule notifications for the new auction
        // console.log("Scheduling ws notif...");
        // console.log(Date.now().toLocaleString());
        // const wsService = getWebSocketService();
        // console.log("wsService: ", wsService);
        // wsService.scheduleNewAuction(auction);
        // console.log(Date.now().toLocaleString());
        // console.log("Scheduled ws notif...");

        res.status(201).json(auction);
    } catch (error) {
        next(error);
    }
};