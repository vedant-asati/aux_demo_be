// src/routes/auction.routes.ts
import { Router } from 'express';
import * as auctionController from '../controllers/auction.controller';
// import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = Router();
// const prisma = new PrismaClient();

// Public routes
router.get('/', auctionController.getAllAuctions);
router.get('/active', auctionController.getActiveAuctions);
router.get('/:id', auctionController.getAuctionById);

// Protected routes
router.post('/', authMiddleware, adminMiddleware, auctionController.createNewAuction);
router.put('/:id', authMiddleware, adminMiddleware, auctionController.updateAuction);
router.delete('/:id', authMiddleware, adminMiddleware, auctionController.deleteAuction);

export default router;