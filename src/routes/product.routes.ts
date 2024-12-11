// src/routes/product.routes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();
const prisma = new PrismaClient();

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
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        ...req.body,
        price: new Decimal(req.body.price)
      }
    });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    await prisma.product.delete({
      where: { id: Number(req.params.id) }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;