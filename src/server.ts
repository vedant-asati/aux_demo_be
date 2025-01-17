import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import auctionRoutes from './routes/auction.routes';
import bidRoutes from './routes/bid.routes';
import productRoutes from './routes/product.routes';
import { errorHandler } from './middleware/error.middleware';
import setupWebSocket from './websocket';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001'; // Replace with your actual Vercel URL


// Security middleware
app.use(helmet());
app.use(cors());
// app.use(cors({
//   origin: [FRONTEND_URL, 'https://auctionx.loca.lt'], // Allow both Vercel and localtunnel URLs
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 500, // 500 requests per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false
 });
app.use(limiter);

// Routes
app.use('/auth', authRoutes);
app.use('/auctions', auctionRoutes);
app.use('/bids', bidRoutes);
app.use('/products', productRoutes);
app.use('/user', userRoutes);

// Error handling
app.use(errorHandler);

// WebSocket setup
setupWebSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
