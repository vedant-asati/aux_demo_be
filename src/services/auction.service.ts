import { WinningCondition, BidType, Auction, Bid, User } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export class AuctionService {
    static async getAuctionWithBids(auctionId: number) {
        if (!auctionId || isNaN(auctionId)) {
            throw new Error('Invalid auction ID');
        }

        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: {
                bids: {
                    orderBy: { timeStamp: 'desc' }
                },
                product: true,
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!auction) {
            throw new Error('Auction not found');
        }

        // Hide bid amounts for sealed bid auctions if auction is still active
        if (auction.bidType === BidType.SEALED && !auction.auctionEnded) {
            auction.bids = auction.bids.map(bid => ({
                ...bid,
                amount: new Decimal(0)
            }));
        }

        return auction;
    }

    static async determineWinner(auctionId: number): Promise<{
        auction: Auction,
        winner: User | null,
        winningBid: Bid | null
    }> {
        if (!auctionId || isNaN(auctionId)) {
            throw new Error('Invalid auction ID');
        }

        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: {
                bids: true,
                product: true
            }
        });

        if (!auction) {
            throw new Error('Auction not found');
        }

        // if (!auction.auctionEnded) {
        //     throw new Error('Cannot determine winner - auction is still active');
        // }

        if (auction.bids.length === 0) {
            return { auction, winner: null, winningBid: null };
        }

        let winningBid: Bid | null = null;

        switch (auction.auctionType) {
            case 'ENGLISH':
                winningBid = await prisma.bid.findFirst({
                    where: { auctionId },
                    orderBy: { amount: 'desc' }
                });
                break;
            case 'VICKERY':
                winningBid = await prisma.bid.findFirst({
                    where: { auctionId },
                    orderBy: { amount: 'desc' }
                });
                break;

            case 'DUTCH':
                winningBid = await prisma.bid.findFirst({
                    where: { auctionId },
                    orderBy: { amount: 'asc' }
                });
                break;

            case 'HIGHEST_UNIQUE':
                // Find highest unique bid
                const uniqueBids = auction.bids.filter(bid =>
                    auction.bids.filter(b => b.amount.equals(bid.amount)).length === 1
                );
                if (uniqueBids.length > 0) {
                    winningBid = uniqueBids.reduce((highest: Bid | null, current: Bid) => {
                        if (!highest) return current;
                        return current.amount.gt(highest.amount) ? current : highest;
                    }, uniqueBids[0]);
                }
                break;

            case 'LOWEST_UNIQUE':
                // Find lowest unique bid
                const uniqueLowBids = auction.bids.filter(bid =>
                    auction.bids.filter(b => b.amount.equals(bid.amount)).length === 1
                );
                if (uniqueLowBids.length > 0) {
                    winningBid = uniqueLowBids.reduce((lowest: Bid | null, current: Bid) => {
                        if (!lowest) return current;
                        return current.amount.lt(lowest.amount) ? current : lowest;
                    }, uniqueLowBids[0]);
                }
                break;

            case 'THE_LAST_PLAY':
                // Last bid placed before auction end
                winningBid = await prisma.bid.findFirst({
                    where: { auctionId },
                    orderBy: { timeStamp: 'desc' }
                });
                break;

            default:
                throw new Error(`Unsupported auction type: ${auction.auctionType}`);
        }

        if (!winningBid) {
            return { auction, winner: null, winningBid: null };
        }

        // Special handling for Vickrey auction - winner pays second-highest price
        if (auction.auctionType === 'VICKERY') {
            const secondHighestBid = await prisma.bid.findFirst({
                where: {
                    auctionId,
                    NOT: {
                        id: winningBid.id
                    }
                },
                orderBy: { amount: 'desc' }
            });

            if (secondHighestBid) {
                winningBid = {
                    ...winningBid,
                    amount: secondHighestBid.amount // Winner pays second-highest price
                };
            }
        }

        const winner = await prisma.user.findUnique({
            where: { id: winningBid.bidderId }
        });

        if (!winner) {
            throw new Error('Winner not found in database');
        }

        return { auction, winner, winningBid };
    }

    static async endAuction(auctionId: number, winnerId: number) {
        if (!auctionId || isNaN(auctionId)) {
            throw new Error('Invalid auction ID');
        }

        if (!winnerId || isNaN(winnerId)) {
            throw new Error('Invalid winner ID');
        }

        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: { bids: true }
        });

        if (!auction) {
            throw new Error('Auction not found');
        }

        if (auction.auctionEnded) {
            throw new Error('Auction has already ended');
        }

        // Validate winner exists and participated in auction
        const winnerExists = await prisma.user.findUnique({
            where: { id: winnerId }
        });

        if (!winnerExists) {
            throw new Error('Winner not found');
        }

        const winnerBid = auction.bids.find(bid => bid.bidderId === winnerId);
        if (!winnerBid) {
            throw new Error('Winner did not participate in the auction');
        }

        // Check if auction can be ended
        const now = new Date();
        const canEndEarly = auction.maxBids && auction.bids.length >= auction.maxBids;
        const shouldEndByTime = auction.auctionEndTime && auction.auctionEndTime <= now;

        if (!canEndEarly && !shouldEndByTime) {
            throw new Error('Auction cannot be ended yet - neither time limit nor bid limit reached');
        }

        try {
            const updatedAuction = await prisma.$transaction(async (prisma) => {
                // Update auction status
                const ended = await prisma.auction.update({
                    where: { id: auctionId },
                    data: {
                        auctionEnded: true,
                        winnerId,
                        auctionEndTime: auction.auctionEndTime || now
                    },
                    include: {
                        winner: true,
                        product: true,
                        bids: {
                            include: {
                                bidder: true
                            }
                        }
                    }
                });

                // Additional actions could be added here:
                // - Notify winner
                // - Process payments
                // - Update inventory
                // - Generate auction report

                return ended;
            });

            return updatedAuction;
        } catch (error) {
            throw new Error('Failed to end auction. Please try again.');
        }
    }

    static async placeBid(auctionId: number, bidderId: number, amount: number): Promise<Bid> {
        // Get auction with existing bids
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: {
                bids: {
                    orderBy: { timeStamp: 'desc' }
                }
            }
        });

        // Basic validation checks
        if (!auction) {
            throw new Error('Auction not found');
        }

        if (auction.auctionEnded) {
            throw new Error('Auction has already ended');
        }

        const now = new Date();
        if (auction.auctionStartTime > now) {
            throw new Error('Auction has not started yet');
        }

        if (auction.auctionEndTime && auction.auctionEndTime < now) {
            throw new Error('Auction has expired');
        }

        // Check if max bids limit reached
        if (auction.maxBids && auction.bids.length >= auction.maxBids) {
            throw new Error('Maximum number of bids reached for this auction');
        }

        // Validate bid amount
        if (amount <= 0) {
            throw new Error('Bid amount must be greater than zero');
        }

        if (new Decimal(amount).lt(auction.reservePrice)) {
            throw new Error(`Bid amount must be at least ${auction.reservePrice}`);
        }

        // Get highest current bid
        const highestBid = auction.bids[0];

        // Validate based on auction type and bid type.
        // No validation for SEALED bids during the auction.
        if (auction.bidType === BidType.OPEN) {
            if (highestBid) {
                // For English auction, new bid must be higher than current highest
                if (auction.auctionType === 'ENGLISH' &&
                    new Decimal(amount).lte(highestBid.amount)) {
                    throw new Error(`Bid must be higher than current highest bid amount $${highestBid.amount}.`);
                }

                // For Dutch auction, new bid must be lower than current lowest
                if (auction.auctionType === 'DUTCH' &&
                    new Decimal(amount).gte(highestBid.amount)) {
                    throw new Error(`Bid must be lower than current lowest bid amount $${highestBid.amount}.`);
                }
            }
        }

        // Check for duplicate bids in unique bid auctions
        if (auction.auctionType === 'HIGHEST_UNIQUE' ||
            auction.auctionType === 'LOWEST_UNIQUE') {
            const duplicateBid = auction.bids.find(
                bid => new Decimal(bid.amount).eq(amount)
            );
            if (duplicateBid) {
                throw new Error('This bid amount has already been placed');
            }
        }

        // Check if user has already bid (if relevant)
        const userPreviousBid = auction.bids.find(bid => bid.bidderId === bidderId);
        if (userPreviousBid && auction.auctionType !== 'ENGLISH') {
            throw new Error('You have already placed a bid in this auction');
        }

        // Place the bid
        try {
            const bid = await prisma.bid.create({
                data: {
                    auctionId,
                    bidderId,
                    amount,
                    timeStamp: now
                }
            });

            // // For Vickrey auctions, immediately hide the bid amount from other users
            // if (auction.auctionType === 'VICKERY') {
            //     // Note: The actual bid amount is stored but should be hidden in the API response
            //     return {
            //         ...bid,
            //         amount: new Decimal(0) // Hide the actual amount
            //     };
            // }

            return bid;
        } catch (error) {
            throw new Error('Failed to place bid. Please try again.');
        }
    }
}