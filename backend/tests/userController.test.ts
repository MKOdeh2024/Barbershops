// tests/controllers/userController.test.js
import request from 'supertest';
import express from 'express';
import { getAllUsers, getUserById } from '../../backend/controllers/userController.js';
import { AppDataSource } from '../../backend/config/db.js';

jest.mock('../../backend/config/db.js', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockUserRepo = {
  find: mockFind,
  findOne: mockFindOne,
};

(AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);

const app = express();
app.use(express.json());
app.get('/api/users', getAllUsers);
app.get('/api/users/:id', getUserById);

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users (getAllUsers)', () => {
    it('should return a list of users', async () => {
      const users = [
        {
          user_id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          role: 'user',
          phone_number: '1234567890',
          created_at: new Date(),
        },
      ];

      mockFind.mockResolvedValue(users);

      const response = await request(app).get('/api/users');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(users);
      expect(mockFind).toHaveBeenCalledTimes(1);
    });

    it('should handle errors and return 500', async () => {
      mockFind.mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/users');

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Server Error fetching users');
    });
  });

  describe('GET /api/users/:id (getUserById)', () => {
    it('should return the user when found', async () => {
      const user = {
        user_id: '1',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        role: 'admin',
        phone_number: '0987654321',
        profile_picture: null,
        created_at: new Date(),
      };

      mockFindOne.mockResolvedValue(user);

      const response = await request(app).get('/api/users/1');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(user);
      expect(mockFindOne).toHaveBeenCalledWith({
        where: { user_id: '1' },
        select: expect.arrayContaining([
          'user_id',
          'first_name',
          'last_name',
          'email',
          'role',
          'phone_number',
          'profile_picture',
          'created_at',
        ]),
      });
    });

    it('should return 404 when user is not found', async () => {
      mockFindOne.mockResolvedValue(null);

      const response = await request(app).get('/api/users/999');

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 500 on error', async () => {
      mockFindOne.mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/users/1');

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Server Error fetching user');
    });
  });
});
