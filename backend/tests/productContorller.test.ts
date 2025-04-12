// tests/controllers/productController.test.js
import request from 'supertest';
import express from 'express';
import { createProduct } from '../../backend/controllers/productController.js';
import { AppDataSource } from '../../backend/config/db.js';

jest.mock('../../backend/config/db.js', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const mockSave = jest.fn();
const mockProductRepo = {
  save: mockSave,
};

(AppDataSource.getRepository as jest.Mock).mockReturnValue(mockProductRepo);

const app = express();
app.use(express.json());
app.post('/api/products', createProduct);

describe('POST /api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new product and return 201', async () => {
    const newProduct = {
      name: 'Test Product',
      description: 'Test description',
      price: 10.99,
      stock_quantity: 100,
      category: 'Test Category',
      image_url: 'http://example.com/image.jpg',
    };

    const savedProduct = { ...newProduct, product_id: 1 };
    mockSave.mockResolvedValue(savedProduct);

    const response = await request(app)
      .post('/api/products')
      .send(newProduct);

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(savedProduct);
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining(newProduct));
  });

  it('should return 500 on server error', async () => {
    const newProduct = {
      name: 'Fail Product',
      description: 'Should fail',
      price: 10.99,
      stock_quantity: 100,
      category: 'Error Category',
      image_url: 'http://example.com/error.jpg',
    };

    mockSave.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/api/products')
      .send(newProduct);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('message', 'Server Error creating product');
  });
});
