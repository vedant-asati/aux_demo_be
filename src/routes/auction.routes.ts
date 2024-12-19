import { Router } from 'express';
import * as auctionController from '../controllers/auction.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { ownerMiddleware } from '../middleware/owner.middleware';

const router = Router();

// Public routes
router.post('/', authMiddleware, auctionController.createNewAuction);


// Protected routes
router.get('/', auctionController.getAllAuctions);
// router.get('/', authMiddleware, adminMiddleware, auctionController.getAllAuctions);
router.get('/active', authMiddleware, adminMiddleware, auctionController.getActiveAuctions);

// @DEV Fix: Anyone can access for now
router.get('/:id', auctionController.getAuctionById);
router.put('/:id', authMiddleware, ownerMiddleware, auctionController.updateAuction);
router.delete('/:id', authMiddleware, ownerMiddleware, auctionController.deleteAuction);

export default router;