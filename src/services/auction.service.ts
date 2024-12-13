import { WinningCondition } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuctionService {
    static async getAuctionWithBids(auctionId: number) {
        return prisma.auction.findUnique({
            where: { id: auctionId },
            include: {
                bids: {
                    orderBy: { timeStamp: 'desc' }
                }
            }
        });
    }

    static async determineWinner(auctionId: number) {
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: {
                bids: true
            }
        });

        if (!auction || auction.bids.length === 0) return null;

        // Get winning bid based on winning condition
        const winningBid = auction.winningCondition === WinningCondition.HIGHEST_BID
            ? await prisma.bid.findFirst({
                where: { auctionId },
                orderBy: { amount: 'desc' },
            })
            : await prisma.bid.findFirst({
                where: { auctionId },
                orderBy: { amount: 'asc' },
            });

        if (!winningBid) return null;

        const winner = await prisma.user.findUnique({
            where: { id: winningBid.bidderId }
        });

        return { auction, winner, winningBid };
    }

    static async endAuction(auctionId: number, winnerId: number) {
        return prisma.auction.update({
            where: { id: auctionId },
            data: {
                auctionEnded: true,
                winnerId
            }
        });
    }

    static async placeBid(auctionId: number, bidderId: number, amount: number) {
        return prisma.bid.create({
            data: {
                auctionId,
                bidderId,
                amount,
                timeStamp: new Date()
            }
        });
    }
}