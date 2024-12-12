// src/routes/product.routes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();
const prisma = new PrismaClient();

// Define a type for the expected request body
interface UpdateProductDto {
  name?: string;
  description?: string;
  category?: string;
  price?: number | string;
  photoUrl?: string;
}

// First create a custom error class
class ProductDeletionError extends Error {
  constructor(message: string, public statusCode: number = 400) {
      super(message);
      this.name = 'ProductDeletionError';
  }
}

router.get('/', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
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
});

router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
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
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
      const productId = Number(req.params.id);
      const updateData: UpdateProductDto = req.body;

      // Only include fields that are actually provided in the request
      const updateFields: any = {};
      
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.category !== undefined) updateFields.category = updateData.category;
      if (updateData.photoUrl !== undefined) updateFields.photoUrl = updateData.photoUrl;
      if (updateData.price !== undefined) {
          updateFields.price = new Decimal(updateData.price.toString());
      }

      // Always update the updatedAt timestamp
      updateFields.updatedAt = new Date();

      const product = await prisma.product.update({
          where: { id: productId },
          data: updateFields
      });

      res.json(product);
  } catch (error) {
      next(error);
  }
});

// @DEV The product which is in other auctions cant be deleted
// Updated delete route
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
      const productId = Number(req.params.id);

      // Check if product exists in any auctions
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

      // If we get here, it's safe to delete
      await prisma.product.delete({
          where: { id: productId }
      });

      res.status(204).send();
  } catch (error) {
      next(error);
  }
});

export default router;