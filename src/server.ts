// src/server.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import auctionRoutes from './routes/auction.routes';
import bidRoutes from './routes/bid.routes';
import { errorHandler } from './middleware/error.middleware';
import setupWebSocket from './websocket/bidHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auctions', auctionRoutes);
app.use('/bids', bidRoutes);

// Error handling
app.use(errorHandler);

// WebSocket setup
setupWebSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
