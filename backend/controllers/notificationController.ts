// backend/controllers/notificationController.js
import { AppDataSource } from '../config/db.js';
import Notification from '../config/models/Notification.js';

const notificationRepository = AppDataSource.getRepository(Notification);

// @desc    Get notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = async (req, res) => {
  const userId = req.user?.userId;
  try {
    const notifications = await notificationRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 50 // Limit number of notifications fetched
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching notifications' });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/read
// @access  Private
export const markNotificationsRead = async (req, res) => {
  const userId = req.user?.userId;
  const { notificationIds } = req.body; // Expecting an array of IDs

  try {
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({ message: 'Notification IDs array is required' });
    }

    const result = await notificationRepository
        .createQueryBuilder()
        .update(Notification)
        .set({ status: () => 'Read' })
        .where("user_id = :userId AND notification_id IN (:...ids)", { userId, ids: notificationIds })
        .execute();

    res.json({ message: `${result.affected} notifications marked as read.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating notifications' });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
    const userId = req.user?.userId;
    const notificationId = req.params.id;

    try {
        const result = await notificationRepository.delete({ notification_id: notificationId, user_id: userId });

        if (result.affected === 0) {
            return res.status(404).json({ message: 'Notification not found or not owned by user' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting notification' });
    }
};