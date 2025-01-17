"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const ws_1 = __importStar(require("ws"));
const auction_service_1 = require("./auction.service");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
class WebSocketService {
    static instance = null;
    wss;
    rooms = {};
    userSockets = {};
    constructor(server) {
        if (WebSocketService.instance) {
            return WebSocketService.instance;
        }
        this.wss = new ws_1.WebSocketServer({ server });
        this.initialize();
        this.scheduleAuctionNotifications();
        WebSocketService.instance = this;
    }
    // For new auction created
    scheduleNewAuction(auction) {
        const now = Date.now();
        const startDelay = new Date(auction.auctionStartTime).getTime() - now;
        const endDelay = auction.auctionEndTime ?
            new Date(auction.auctionEndTime).getTime() - now :
            null;
        // Schedule auction start notification
        if (startDelay > 0) {
            setTimeout(() => {
                this.broadcastToRoom(auction.id, {
                    type: 'AUCTION_START',
                    auctionId: auction.id,
                    message: `Auction ${auction.name} has started.`,
                    auction
                });
            }, startDelay);
        }
        // Schedule auction end check
        if (endDelay && endDelay > 0) {
            setTimeout(() => this.checkAuctionEnd(auction.id), endDelay);
        }
    }
    broadcastToRoom(auctionId, message, sender) {
        const room = this.rooms[auctionId];
        if (room) {
            room.forEach(client => {
                console.log("Client in auctionroom: ", client.auctionId);
                if (client.readyState === ws_1.default.OPEN && client !== sender) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    }
    async handleBid(data, ws) {
        if (!data.auctionId || !data.bidderId || !data.amount) {
            throw new Error('Invalid bid data');
        }
        const auction = await auction_service_1.AuctionService.getAuctionWithBids(data.auctionId);
        if (!auction || auction.auctionEnded) {
            throw new Error('Auction not available for bidding');
        }
        const bid = await auction_service_1.AuctionService.placeBid(data.auctionId, data.bidderId, data.amount);
        // Send bid confirmation to the bidder
        ws.send(JSON.stringify({
            type: 'BID_CONFIRMED',
            bid,
            message: `Your bid of ${data.amount} was placed successfully`
        }));
        // Broadcast to others based on bid type
        const broadcastMessage = {
            type: 'NEW_BID',
            ...(auction.bidType === 'OPEN' ? { bid } : {})
        };
        this.broadcastToRoom(data.auctionId, broadcastMessage, ws);
        await this.checkAuctionEnd(data.auctionId);
    }
    async checkAuctionEnd(auctionId) {
        console.log("Checking: ", auctionId);
        const auction = await auction_service_1.AuctionService.getAuctionWithBids(auctionId);
        if (!auction || auction.auctionEnded)
            return;
        const now = new Date();
        // @DEV Need to handle both Seperately
        const timeEnded = auction.auctionEndTime && new Date(auction.auctionEndTime) <= now;
        const maxBidsReached = auction.maxBids && auction.bids.length >= auction.maxBids;
        if (timeEnded || maxBidsReached) {
            const result = await auction_service_1.AuctionService.determineWinner(auctionId);
            if (!result?.winner)
                return;
            await auction_service_1.AuctionService.endAuction(auctionId, result.winner.id);
            this.broadcastToRoom(auctionId, {
                type: 'AUCTION_END',
                auctionId,
                winner: result.winner,
                winningBid: result.winningBid
            });
        }
        console.log("Checked: ", auctionId);
    }
    async authenticateToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            return {
                userId: decoded.id,
                isAdmin: decoded.role === 'ADMIN'
            };
        }
        catch (error) {
            throw new Error('Invalid authentication token');
        }
    }
    handleExistingUserConnection(userId, newSocket) {
        const existingUserSocket = this.userSockets[userId];
        if (existingUserSocket && !existingUserSocket.socket.isAdmin) {
            // Disconnect existing socket from all rooms
            existingUserSocket.rooms.forEach(roomId => {
                if (this.rooms[roomId]) {
                    this.rooms[roomId].delete(existingUserSocket.socket);
                }
            });
            // Send disconnect message to existing socket
            existingUserSocket.socket.send(JSON.stringify({
                type: 'DISCONNECTED',
                message: 'New connection established from another location'
            }));
            // Close existing socket
            existingUserSocket.socket.close();
        }
    }
    joinRoom(socket, auctionId) {
        if (!this.rooms[auctionId]) {
            this.rooms[auctionId] = new Set();
        }
        // Add socket to room
        this.rooms[auctionId].add(socket);
        socket.auctionId = auctionId;
        // Update user's room membership
        if (socket.userId) {
            if (!this.userSockets[socket.userId]) {
                this.userSockets[socket.userId] = {
                    socket,
                    rooms: new Set()
                };
            }
            this.userSockets[socket.userId].rooms.add(auctionId);
        }
    }
    // This is when server starts
    async scheduleAuctionNotifications() {
        const auctions = await prisma.auction.findMany({
            where: {
                auctionEnded: false,
                auctionStartTime: { gte: new Date() }
            }
        });
        auctions.forEach(auction => {
            const startDelay = new Date(auction.auctionStartTime).getTime() - Date.now();
            const endDelay = auction.auctionEndTime ?
                new Date(auction.auctionEndTime).getTime() - Date.now() :
                null;
            // Schedule auction start notification
            if (startDelay > 0) {
                setTimeout(() => {
                    this.broadcastToRoom(auction.id, {
                        type: 'AUCTION_START',
                        auctionId: auction.id,
                        message: `Auction ${auction.name} has started.`
                    });
                }, startDelay);
            }
            // Schedule auction end check
            if (endDelay && endDelay > 0) {
                setTimeout(() => this.checkAuctionEnd(auction.id), endDelay);
            }
        });
    }
    leaveRoom(socket) {
        if (socket.auctionId && this.rooms[socket.auctionId]) {
            this.rooms[socket.auctionId].delete(socket);
            // Update user's room membership
            if (socket.userId && this.userSockets[socket.userId]) {
                this.userSockets[socket.userId].rooms.delete(socket.auctionId);
            }
        }
    }
    initialize() {
        this.wss.on('connection', async (ws, req) => {
            ws.clientId = (0, uuid_1.v4)();
            const ip = req.socket.address();
            // Extract token from query string
            const url = new URL(req.url, `http://${req.headers.host}`);
            const token = url.searchParams.get('token');
            if (!token) {
                ws.close(1008, 'Missing authentication token');
                return;
            }
            try {
                // Authenticate user
                const { userId, isAdmin } = await this.authenticateToken(token);
                ws.userId = userId;
                ws.isAdmin = isAdmin;
                // Handle existing connection for the same user
                this.handleExistingUserConnection(userId, ws);
                // Update user socket mapping
                this.userSockets[userId] = {
                    socket: ws,
                    rooms: new Set()
                };
                console.log('New authenticated connection:', {
                    clientId: ws.clientId,
                    userId: ws.userId,
                    isAdmin: ws.isAdmin,
                    ip,
                    timestamp: new Date().toISOString(),
                });
                ws.on('message', async (message) => {
                    try {
                        const data = JSON.parse(message);
                        if (!data.auctionId)
                            return;
                        switch (data.type) {
                            case 'JOIN_ROOM': {
                                this.joinRoom(ws, data.auctionId);
                                const auction = await auction_service_1.AuctionService.getAuctionWithBids(data.auctionId);
                                ws.send(JSON.stringify({
                                    type: 'ROOM_JOINED',
                                    message: `Successfully joined auction ${data.auctionId}`,
                                    auction
                                }));
                                console.log("Room no ", data.auctionId, " joined by ws.");
                                break;
                            }
                            case 'BID': {
                                // Use authenticated userId for bidding
                                console.log("ws trying to place bid in Auction ", data.auctionId, ".");
                                await this.handleBid({
                                    ...data,
                                    bidderId: ws.userId,
                                    auctionId: ws.auctionId
                                }, ws);
                                console.log("Bid successfully placed by ws in Auction ", data.auctionId, ".");
                                break;
                            }
                            case 'LEAVE_ROOM': {
                                this.leaveRoom(ws);
                                ws.send(JSON.stringify({
                                    type: 'ROOM_LEFT',
                                    message: `Successfully left auction ${ws.auctionId}`
                                }));
                                console.log("Room no ", data.auctionId, " left by ws.");
                                break;
                            }
                        }
                    }
                    catch (error) {
                        ws.send(JSON.stringify({
                            type: 'ERROR',
                            message: error instanceof Error ? error.message : 'Unknown error'
                        }));
                    }
                });
                ws.on('close', () => {
                    this.leaveRoom(ws);
                    if (ws.userId) {
                        delete this.userSockets[ws.userId];
                    }
                    console.log('WebSocket disconnected:', {
                        clientId: ws.clientId,
                        userId: ws.userId,
                        ip,
                        timestamp: new Date().toISOString(),
                    });
                });
            }
            catch (error) {
                ws.close(1008, 'Authentication failed');
            }
        });
    }
}
exports.WebSocketService = WebSocketService;
//# sourceMappingURL=websocket.service.js.map