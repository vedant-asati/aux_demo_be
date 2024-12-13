import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { UpdateProductDto } from '../types/product.types';
import { ProductDeletionError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        next(error);
    }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                auctions: true
            }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        next(error);
    }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await prisma.product.create({
            data: {
                ...req.body,
                price: new Decimal(req.body.price)
            }
        });
        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const productId = Number(req.params.id);
        const updateData: UpdateProductDto = req.body;

        const updateFields: any = {};
        
        if (updateData.description !== undefined) updateFields.description = updateData.description;
        if (updateData.name !== undefined) updateFields.name = updateData.name;
        if (updateData.category !== undefined) updateFields.category = updateData.category;
        if (updateData.photoUrl !== undefined) updateFields.photoUrl = updateData.photoUrl;
        if (updateData.price !== undefined) {
            updateFields.price = new Decimal(updateData.price.toString());
        }

        updateFields.updatedAt = new Date();

        const product = await prisma.product.update({
            where: { id: productId },
            data: updateFields
        });

        res.json(product);
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const productId = Number(req.params.id);
        
        const productWithAuctions = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                auctions: true
            }
        });

        if (!productWithAuctions) {
            throw new ProductDeletionError('Product not found', 404);
        }
        
        if (productWithAuctions.auctions.length > 0) {
            throw new ProductDeletionError(
                'Cannot delete product as it is associated with existing auctions. ' +
                `Product is used in ${productWithAuctions.auctions.length} auction(s).`,
                409
            );
        }

        await prisma.product.delete({
            where: { id: productId }
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};