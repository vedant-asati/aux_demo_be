"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewAuction = exports.updateAuction = exports.deleteAuction = exports.getActiveAuctions = exports.getAuctionById = exports.getAllAuctions = void 0;
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const websocket_1 = require("../websocket");
const prisma = new client_1.PrismaClient();
// @DEV Migrate logic to Auction Service
const getAllAuctions = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error fetching auctions'
        });
    }
};
exports.getAllAuctions = getAllAuctions;
const getAuctionById = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error fetching auction'
        });
    }
};
exports.getAuctionById = getAuctionById;
const getActiveAuctions = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error fetching active auctions'
        });
    }
};
exports.getActiveAuctions = getActiveAuctions;
const deleteAuction = async (req, res, next) => {
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
    }
    catch (error) {
        console.error('Error deleting auction:', error);
        next(error);
    }
};
exports.deleteAuction = deleteAuction;
const updateAuction = async (req, res) => {
    try {
        const { id } = req.params;
        const auctionData = req.body;
        const updatedAuction = await prisma.$transaction(async (prisma) => {
            // 1. Update the product
            await prisma.product.update({
                where: { id: auctionData.productId },
                data: {
                    price: new library_1.Decimal(auctionData.product.price.toString()),
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
                    reservePrice: new library_1.Decimal(auctionData.reservePrice.toString()),
                    registrationFees: new library_1.Decimal(auctionData.registrationFees.toString()),
                    earnestMoneyRequired: auctionData.earnestMoneyRequired,
                    earnestMoneyDeposit: auctionData.earnestMoneyDeposit ?
                        new library_1.Decimal(auctionData.earnestMoneyDeposit.toString()) : null,
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
                            amount: new library_1.Decimal(bid.amount.toString()),
                            timeStamp: new Date(bid.timeStamp)
                        },
                        update: {
                            amount: new library_1.Decimal(bid.amount.toString()),
                            timeStamp: new Date(bid.timeStamp)
                        }
                    });
                }
            }
            return auction;
        });
        res.json(updatedAuction);
    }
    catch (error) {
        console.error('Error updating auction:', error);
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error updating auction'
        });
    }
};
exports.updateAuction = updateAuction;
const createNewAuction = async (req, res, next) => {
    try {
        const auctionData = req.body;
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
                reservePrice: new library_1.Decimal(auctionData.reservePrice.toString()),
                registrationFees: new library_1.Decimal(auctionData.registrationFees.toString()),
                earnestMoneyRequired: auctionData.earnestMoneyRequired,
                earnestMoneyDeposit: auctionData.earnestMoneyDeposit ?
                    new library_1.Decimal(auctionData.earnestMoneyDeposit.toString()) : null,
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
        console.log("Scheduling ws notif...");
        console.log(Date.now().toLocaleString());
        const wsService = (0, websocket_1.getWebSocketService)();
        // console.log("wsService: ", wsService);
        wsService.scheduleNewAuction(auction);
        console.log(Date.now().toLocaleString());
        console.log("Scheduled ws notif...");
        res.status(201).json(auction);
    }
    catch (error) {
        next(error);
    }
};
exports.createNewAuction = createNewAuction;
//# sourceMappingURL=auction.controller.js.map