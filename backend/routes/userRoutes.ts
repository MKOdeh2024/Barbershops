// backend/routes/userRoutes.js
import express from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, admin } from '../routes/authMiddleware.js'; // Import middlewares

const router = express.Router();

router.route('/')
    .get(protect, admin, getAllUsers); // Only Admin can get all users

router.route('/:id')
    .get(protect, getUserById)      // Protected, needs logic in controller for self/admin access
    .put(protect, updateUser)        // Protected, needs logic in controller for self/admin access
    .delete(protect, admin, deleteUser); // Only Admin can delete

export default router;