import { Router } from 'express';
import {
  currentUser,
  login,
  logout,
  register,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/logout', logout);
router.get('/me', authenticate, currentUser);

export default router;
