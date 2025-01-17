"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBid = void 0;
const client_1 = require("@prisma/client");
const auction_service_1 = require("../services/auction.service");
const websocket_1 = require("../websocket");
const prisma = new client_1.PrismaClient();
const createBid = async (req, res) => {
    try {
        const { auctionId, amount, user } = req.body;
        const bid = await auction_service_1.AuctionService.placeBid(auctionId, user.id, amount);
        const wsService = (0, websocket_1.getWebSocketService)();
        // console.log("wsService: ", wsService);
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId }
        });
        const broadcastMessage = {
            type: 'NEW_BID',
            ...(auction.bidType === 'OPEN' ? { bid } : {})
        };
        wsService.broadcastToRoom(auctionId, broadcastMessage);
        res.status(201).json(bid);
    }
    catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createBid = createBid;
//# sourceMappingURL=bid.controller.js.map