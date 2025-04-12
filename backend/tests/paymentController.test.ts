// __tests__/paymentController.test.js
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { processPayment } from '../controllers/paymentController.js';

jest.mock('../backend/config/db.js', () => ({
  AppDataSource: {
    getRepository: jest.fn().mockImplementation((model) => mockRepositories[model.name]),
    transaction: jest.fn().mockImplementation(async (fn) => await fn(mockTransactionEntityManager)),
  },
}));

import Payment from '../config/models/Payment.js';
import Booking from '../config/models/Booking.js';

const mockRepositories : {[key : string] : any} = {
  [Payment.name]: {
    findOneBy: jest.fn(),
    save: jest.fn(),
  },
  [Booking.name]: {
    findOne: jest.fn(),
    save: jest.fn(),
  },
};

const mockTransactionEntityManager = {
  save: jest.fn(),
};

const app = express();
app.use(bodyParser.json());
app.post('/api/payments/process/:bookingId', (req, res) => {
    // @ts-ignore
  req.user = { userId: 1 }; // Mock authenticated user
  return processPayment(req, res);
});

describe('processPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process payment successfully for valid booking', async () => {
    const mockBooking = {
      booking_id: 123,
      user_id: 1,
      total_price: 200,
      payment_status: 'Pending',
      payment: null,
    };

    mockRepositories[Booking.name]!.findOne.mockResolvedValue(mockBooking);

    const response = await request(app)
      .post('/api/payments/process/123')
      .send({ paymentMethodDetails: { token: 'tok_test' } });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockTransactionEntityManager.save).toHaveBeenCalledTimes(2);
    expect(response.body.payment.payment_status).toBe('Completed');
  });

  it('should return 404 if booking not found or not owned by user', async () => {
    mockRepositories[Booking.name].findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/payments/process/999')
      .send({ paymentMethodDetails: { token: 'tok_invalid' } });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Booking not found or does not belong to user');
  });

  it('should return 400 if booking already paid', async () => {
    const mockBooking = {
      booking_id: 123,
      user_id: 1,
      total_price: 200,
      payment_status: 'Paid',
      payment: null,
    };

    mockRepositories[Booking.name].findOne.mockResolvedValue(mockBooking);

    const response = await request(app)
      .post('/api/payments/process/123')
      .send({ paymentMethodDetails: { token: 'tok_test' } });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Booking already paid');
  });
});
