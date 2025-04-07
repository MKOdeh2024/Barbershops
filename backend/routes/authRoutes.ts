// backend/routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../routes/authMiddleware.js';
// Import validation rules and handler
import { registerValidationRules, loginValidationRules, handleValidationErrors } from '../validators/authValidator.js';

const router = express.Router();

// Apply validation rules before the controller function, then the error handler
router.post(
    '/register',
    registerValidationRules(), // Apply rules
    handleValidationErrors,   // Handle potential errors
    registerUser             // Proceed to controller if valid
);

router.post(
    '/login',
    loginValidationRules(),   // Apply rules
    handleValidationErrors,   // Handle potential errors
    loginUser                // Proceed to controller if valid
);

router.get('/me', protect, getMe); // Protect the 'me' route

export default router;