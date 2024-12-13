import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import * as productController from '../controllers/product.controller';

const router = Router();

// Public Routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected Routes
router.post('/', authMiddleware, adminMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, adminMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, productController.deleteProduct);

export default router;