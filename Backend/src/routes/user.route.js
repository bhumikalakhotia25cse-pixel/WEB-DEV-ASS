import { Router } from 'express';
import { registerUser, loginUser, logoutUser } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', requireAuth, logoutUser);
export default router;
