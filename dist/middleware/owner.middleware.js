"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownerMiddleware = void 0;
const auction_service_1 = require("../services/auction.service");
const ownerMiddleware = async (req, res, next) => {
    try {
        const { id: userId, role: userRole } = req.body.user;
        const { id } = req.params;
        const auctionData = await auction_service_1.AuctionService.getAuctionWithBids(Number(id));
        if (userId !== auctionData.creatorId && userRole !== 'ADMIN') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.ownerMiddleware = ownerMiddleware;
//# sourceMappingURL=owner.middleware.js.map