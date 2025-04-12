// tests/controllers/serviceController.test.js
import request from 'supertest';
import express from 'express';
import { createService } from '../../backend/controllers/serviceController.js';
import { AppDataSource } from '../../backend/config/db.js';

jest.mock('../../backend/config/db.js', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const mockSave = jest.fn();
const mockServiceRepo = {
  save: mockSave,
};

(AppDataSource.getRepository as jest.Mock).mockReturnValue(mockServiceRepo);

const app = express();
app.use(express.json());
app.post('/api/services', createService);

describe('POST /api/services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new service and return 201', async () => {
    const newService = {
      name: 'Test Service',
      description: 'Service Description',
      price: 49.99,
      estimated_duration: 60,
      category: 'Cleaning',
    };

    const savedService = { ...newService, service_id: 1 };
    mockSave.mockResolvedValue(savedService);

    const response = await request(app)
      .post('/api/services')
      .send(newService);

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(savedService);
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining(newService));
  });

  it('should return 500 on database error', async () => {
    const newService = {
      name: 'Failing Service',
      description: 'Should fail',
      price: 20,
      estimated_duration: 30,
      category: 'Error',
    };

    mockSave.mockRejectedValue(new Error('Database failure'));

    const response = await request(app)
      .post('/api/services')
      .send(newService);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('message', 'Server Error creating service');
  });
});
