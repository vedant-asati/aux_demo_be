import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = Router();

// router.post('/register', userController.registerUser);
// router.post('/login', userController.loginUser);
router.get('/profile', authMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers);
// Temporarily open
router.get('/:id', authMiddleware, userController.getUserById);
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUser);

export default router;