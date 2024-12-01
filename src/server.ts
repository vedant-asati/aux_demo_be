import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import bidRoutes from './routes/bid.routes';
import setupWebSocket from './websocket/bidHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/bids', bidRoutes);

// WebSocket setup
setupWebSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
