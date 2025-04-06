// backend/routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../routes/authMiddleware.js'; // Import protect middleware

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe); // Protect the 'me' route

export default router;