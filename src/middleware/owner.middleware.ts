import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service';

export const ownerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId, role: userRole } = req.body.user;
        const { id } = req.params;

        const auctionData = await AuctionService.getAuctionWithBids(Number(id));

        if (userId !== auctionData.creatorId && userRole !== 'ADMIN') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        next();
    } catch (error) {
        next(error);
    }
};