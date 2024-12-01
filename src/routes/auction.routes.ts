
// src/routes/auction.routes.ts
import { Router } from 'express';
import * as auctionController from '../controllers/auction.controller';

const router = Router();

router.get('/', auctionController.getAllAuctions);
router.get('/active', auctionController.getActiveAuctions);
router.get('/:id', auctionController.getAuctionById);
router.post('/:id', auctionController.updateAuction);

export default router;