import request from 'supertest';
import express from 'express';
import { getUserNotifications, markNotificationsRead, deleteNotification } from '../../backend/controllers/notificationController.js';
import Notification from '../../backend/config/models/Notification.js';

jest.mock('../../backend/config/db.js', () => {
  const mockRepo = {
    find: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };
  return {
    AppDataSource: {
      getRepository: () => mockRepo,
    },
  };
});

const app = express();
app.use(express.json());

// Inject mock routes for testing
app.get('/api/notifications', (req, res) => {
  // @ts-ignore
  req.user = { userId: 1 };
  getUserNotifications(req, res);
});

app.put('/api/notifications/read', (req, res) => {
    // @ts-ignore
  req.user = { userId: 1 };
  markNotificationsRead(req, res);
});

app.delete('/api/notifications/:id', (req, res) => {
    // @ts-ignore
  req.user = { userId: 1 };
  deleteNotification(req, res);
});

const mockData = [
  new Notification(),
  // Add more notifications as needed
];
const mockRepo = jest.mocked((await import('../../backend/config/db.js')).AppDataSource.getRepository(Notification));
const repo = await mockRepo;
repo.find.mockResolvedValue(mockData);
mockRepo.find.mockResolvedValue(mockData);

describe('Notification Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/notifications should return notifications', async () => {
   const mockData = [
     new Notification(),
   ];
    mockRepo.find.mockResolvedValue(mockData);

    const res = await request(app).get('/api/notifications');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockData);
    expect(mockRepo.find).toHaveBeenCalledWith({
      where: { user_id: 1 },
      order: { created_at: 'DESC' },
      take: 50,
    });
  });

  test('PUT /api/notifications/read should mark notifications as read', async () => {
    const executeMock = jest.fn().mockResolvedValue({ affected: 2 });
    mockRepo.createQueryBuilder.mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: executeMock,
    } as any);

    const res = await request(app)
      .put('/api/notifications/read')
      .send({ notificationIds: [1, 2] });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: '2 notifications marked as read.' });
    expect(executeMock).toHaveBeenCalled();
  });

  test('PUT /api/notifications/read should return 400 if no IDs', async () => {
    const res = await request(app).put('/api/notifications/read').send({ notificationIds: [] });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Notification IDs array is required');
  });

  test('DELETE /api/notifications/:id should delete notification', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

    const res = await request(app).delete('/api/notifications/123');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Notification deleted successfully');
    expect(mockRepo.delete).toHaveBeenCalledWith({ notification_id: '123', user_id: 1 });
  });

  test('DELETE /api/notifications/:id should return 404 if not found', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 0 , raw: {} });

    const res = await request(app).delete('/api/notifications/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Notification not found or not owned by user');
  });
});
