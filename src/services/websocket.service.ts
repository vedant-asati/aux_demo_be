import WebSocket, { WebSocketServer } from 'ws';
import { WebSocketClient, AuctionRooms, WebSocketMessage, AuthenticatedWebSocketClient, UserSocketMap } from '../types/websocket.types';
import { AuctionService } from './auction.service';
import { Auction, PrismaClient } from '@prisma/client';
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class WebSocketService {
    private static instance: WebSocketService | null = null;
    private wss!: WebSocketServer;
    private rooms: AuctionRooms = {};
    private userSockets: UserSocketMap = {};

    constructor(server: any) {
        if (WebSocketService.instance) {
            return WebSocketService.instance;
        }
        this.wss = new WebSocketServer({ server });
        this.initialize();
        this.scheduleAuctionNotifications();
        WebSocketService.instance = this;
    }

    // For new auction created
    public scheduleNewAuction(auction: Auction) {
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

    public broadcastToRoom(auctionId: number, message: WebSocketMessage, sender?: WebSocketClient) {
        const room = this.rooms[auctionId];
        if (room) {
            room.forEach(client => {
                console.log("Client in auctionroom: ", client.auctionId);
                if (client.readyState === WebSocket.OPEN && client !== sender) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    }

    private async handleBid(data: WebSocketMessage, ws: WebSocketClient) {
        if (!data.auctionId || !data.bidderId || !data.amount) {
            console.log(data);
            throw new Error('Invalid bid data');
        }

        const auction = await AuctionService.getAuctionWithBids(data.auctionId);
        if (!auction || auction.auctionEnded) {
            throw new Error('Auction not available for bidding');
        }

        const bid = await AuctionService.placeBid(data.auctionId, data.bidderId, data.amount);

        // Send bid confirmation to the bidder
        ws.send(JSON.stringify({
            type: 'BID_CONFIRMED',
            bid,
            message: `Your bid of ${data.amount} was placed successfully`
        }));

        // Broadcast to others based on bid type
        const broadcastMessage: WebSocketMessage = {
            type: 'NEW_BID',
            ...(auction.bidType === 'OPEN' ? { bid } : {})
        };

        this.broadcastToRoom(data.auctionId, broadcastMessage, ws);
        await this.checkAuctionEnd(data.auctionId);
    }

    private async checkAuctionEnd(auctionId: number) {
        console.log("Checking: ", auctionId);
        const auction = await AuctionService.getAuctionWithBids(auctionId);
        if (!auction || auction.auctionEnded) return;

        const now = new Date();
        // @DEV Need to handle both Seperately
        const timeEnded = auction.auctionEndTime && new Date(auction.auctionEndTime) <= now;
        const maxBidsReached = auction.maxBids && auction.bids.length >= auction.maxBids;

        if (timeEnded || maxBidsReached) {
            const result = await AuctionService.determineWinner(auctionId);
            if (!result?.winner) return;

            await AuctionService.endAuction(auctionId, result.winner.id);

            this.broadcastToRoom(auctionId, {
                type: 'AUCTION_END',
                auctionId,
                winner: result.winner,
                winningBid: result.winningBid!
            });
        }
        console.log("Checked: ", auctionId);
    }

    private async authenticateToken(token: string): Promise<{ userId: number; isAdmin: boolean }> {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: string };
            return {
                userId: decoded.id,
                isAdmin: decoded.role === 'ADMIN'
            };
        } catch (error) {
            throw new Error('Invalid authentication token');
        }
    }

    private handleExistingUserConnection(userId: number, newSocket: AuthenticatedWebSocketClient) {
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

    private joinRoom(socket: AuthenticatedWebSocketClient, auctionId: number) {
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
    private async scheduleAuctionNotifications() {
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

    private leaveRoom(socket: AuthenticatedWebSocketClient) {
        if (socket.auctionId && this.rooms[socket.auctionId]) {
            this.rooms[socket.auctionId].delete(socket);

            // Update user's room membership
            if (socket.userId && this.userSockets[socket.userId]) {
                this.userSockets[socket.userId].rooms.delete(socket.auctionId);
            }
        }
    }

    private initialize() {
        this.wss.on('connection', async (ws: AuthenticatedWebSocketClient, req: IncomingMessage) => {
            ws.clientId = uuidv4();
            const ip = req.socket.address();

            // Extract token from query string
            const url = new URL(req.url!, `http://${req.headers.host}`);
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

                ws.on('message', async (message: string) => {
                    try {
                        const data: WebSocketMessage = JSON.parse(message);
                        if (!data.auctionId) return;

                        switch (data.type) {
                            case 'JOIN_ROOM': {
                                this.joinRoom(ws, data.auctionId);
                                const auction = await AuctionService.getAuctionWithBids(data.auctionId);
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
                    } catch (error) {
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

            } catch (error) {
                ws.close(1008, 'Authentication failed');
            }
        });
    }
}