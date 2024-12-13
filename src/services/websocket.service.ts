import WebSocket, { WebSocketServer } from 'ws';
import { WebSocketClient, AuctionRooms, WebSocketMessage } from '../types/websocket.types';
import { AuctionService } from './auction.service';
import { Auction, PrismaClient } from '@prisma/client';
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class WebSocketService {
    private static instance: WebSocketService | null = null;
    private wss!: WebSocketServer;
    private rooms: AuctionRooms = {};

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

    private broadcastToRoom(auctionId: number, message: WebSocketMessage, sender?: WebSocketClient) {
        const room = this.rooms[auctionId];
        if (room) {
            room.forEach(client => {
                // console.log("Client in auctionroom: ", client.auctionId);
                if (client.readyState === WebSocket.OPEN && client !== sender) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    }

    private async handleBid(data: WebSocketMessage, ws: WebSocketClient) {
        try {
            const auction = await AuctionService.getAuctionWithBids(data.auctionId!);
            const bid = await AuctionService.placeBid(data.auctionId!, data.bidderId!, data.amount!);

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

            this.broadcastToRoom(data.auctionId!, broadcastMessage, ws);
            await this.checkAuctionEnd(data.auctionId!);
        } catch (error) {
            throw error;
        }
    }

    private async checkAuctionEnd(auctionId: number) {
        // console.log("Checking: ", auctionId);
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
        // console.log("Checked: ", auctionId);
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

    private initialize() {
        this.wss.on('connection', (ws: WebSocketClient, req: IncomingMessage) => {
            // Custom type to uniquely identify ws client
            ws.clientId = uuidv4();
            const ip = req.socket.address();

            console.log('New connection:', {
                clientId: ws.clientId,
                ip,
                timestamp: new Date().toISOString(),
            });

            ws.on('message', async (message: string) => {
                try {
                    const data: WebSocketMessage = JSON.parse(message);
                    if (!data.auctionId) return;

                    switch (data.type) {
                        case 'JOIN_ROOM': {
                            if (!this.rooms[data.auctionId]) {
                                this.rooms[data.auctionId] = new Set();
                            }

                            ws.auctionId = data.auctionId;
                            this.rooms[data.auctionId].add(ws);

                            const auction = await AuctionService.getAuctionWithBids(data.auctionId);
                            ws.send(JSON.stringify({
                                type: 'ROOM_JOINED',
                                message: `Successfully joined auction ${data.auctionId}`,
                                auction
                            }));
                            break;
                        }

                        case 'BID': {
                            await this.handleBid(data, ws);
                            break;
                        }

                        case 'LEAVE_ROOM': {
                            if (ws.auctionId && this.rooms[ws.auctionId]) {
                                this.rooms[ws.auctionId].delete(ws);
                                ws.send(JSON.stringify({
                                    type: 'ROOM_LEFT',
                                    message: `Successfully left auction ${ws.auctionId}`
                                }));
                            }
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
                if (ws.auctionId && this.rooms[ws.auctionId]) {
                    this.rooms[ws.auctionId].delete(ws);
                }
                console.log('WebSocket disconnected:', {
                    clientId: ws.clientId,
                    ip,
                    timestamp: new Date().toISOString(),
                });
            });
        });
    }
}