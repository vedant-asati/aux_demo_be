import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import auctionRoutes from './routes/auction.routes';
import bidRoutes from './routes/bid.routes';
import productRoutes from './routes/product.routes';
import { errorHandler } from './middleware/error.middleware';
import setupWebSocket from './websocket/bidHandler';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/auth', authRoutes);
app.use('/auctions', auctionRoutes);
app.use('/bids', bidRoutes);
app.use('/products', productRoutes);

// Error handling
app.use(errorHandler);

// WebSocket setup
setupWebSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
