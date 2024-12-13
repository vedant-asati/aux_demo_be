import { Router } from 'express';
import { createBid } from '../controllers/bid.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public Routes
router.get('/', (req, res) => {
    res.send(200);
});

// Protected Routes
router.post('/', authMiddleware, createBid);

export default router;