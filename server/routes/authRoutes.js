import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin/reset-password', authController.adminResetPassword);
router.get('/me', requireAuth, authController.me);
router.get('/users', authController.listUsers);

export default router;
