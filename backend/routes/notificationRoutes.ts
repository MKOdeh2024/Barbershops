// backend/routes/notificationRoutes.js
import express from 'express';
import {
    getUserNotifications,
    markNotificationsRead,
    deleteNotification
} from '../controllers/notificationController.js';
import { protect } from '../routes/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getUserNotifications); // Get user's notifications

router.put('/read', protect, markNotificationsRead); // Mark specific notifications as read
router.delete('/:id', protect, deleteNotification); // Delete a specific notification

export default router;