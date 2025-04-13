import request from 'supertest';
import 'jest';
import { jest } from '@jest/globals';
import express from 'express';
import * as adminController from '../../backend/controllers/adminController.js';
import { AppDataSource } from '../../backend/config/db.js';
import AdminSetting from '../../backend/config/models/AdminSetting.js';

// Mock Express App
const app = express();
app.use(express.json());
app.get('/api/admin/settings', adminController.getAllSettings);
app.put('/api/admin/settings', adminController.updateSettings);

// Mock repository and transaction
const mockFind = jest.fn();
const mockSave = jest.fn();
const mockFindOne = jest.fn();
const mockTransaction = jest.fn();

const mockRepository = {
  find: mockFind,
  save: mockSave,
  findOne: mockFindOne,
};

jest.mock('../../backend/config/db.js', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockRepository),
    transaction: jest.fn(),
  },
}));



describe('AdminController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/settings', () => {
    it('should return all settings as key-value pairs', async () => {
      const mockSettings = [
        { setting_key: 'site_name', setting_value: 'Test Site' },
        { setting_key: 'max_users', setting_value: '1000' },
      ];

      //(AppDataSource.getRepository(AdminSetting).find as jest.Mock).mockResolvedValue(mockSettings as never);
      mockFind.mockResolvedValue(mockSettings as never);


      const res = await request(app).get('/api/admin/settings');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        site_name: 'Test Site',
        max_users: '1000',
      });
      expect(AppDataSource.getRepository(AdminSetting).find).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if there is a server error', async () => {
      mockFind.mockRejectedValue(new Error('DB Error') as never);

      
      const res = await request(app).get('/api/admin/settings');

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: 'Server Error fetching settings' });
    });
  });

  describe('PUT /api/admin/settings', () => {
    it('should update multiple settings successfully', async () => {
      const updatePayload = {
        site_name: 'New Site',
        max_users: '2000',
      };

      (AppDataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        await callback(mockRepository); // Mock the repository
      });
      
      

      const res = await request(app).put('/api/admin/settings').send(updatePayload);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: 'Settings updated successfully' });
      expect(mockSave).toHaveBeenCalledTimes(2);
    });

    it('should return 500 if transaction fails', async () => {
      (AppDataSource.transaction as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('Transaction Error')));

      const res = await request(app).put('/api/admin/settings').send({
        site_name: 'Should Fail',
      });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: 'Server Error updating settings' });
    });
  });
});
