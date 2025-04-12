import { createBooking } from '../controllers/bookingController.js';
import { AppDataSource } from '../../backend/config/db.js';
import Booking from '../../backend/config/models/Booking.js';
import Service from '../../backend/config/models/Service.js';
import Availability from '../../backend/config/models/Availability.js';
import Barber from '../../backend/config/models/Barber.js';

jest.mock('../../backend/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    transaction: jest.fn(),
  },
}));

describe('createBooking', () => {
  let req: any;
  let res: any;
  let mockServiceRepo: any;
  let mockBarberRepo: any;
  let mockAvailabilityRepo: any;
  let mockBookingRepo: any;

  beforeEach(() => {
    req = {
      body: {
        barber_id: 1,
        service_id: 1,
        booking_time_str: new Date(Date.now() + 3600000).toISOString(), // 1 hour in the future
      },
      user: {
        userId: 1,
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockServiceRepo = {
      findOneBy: jest.fn(),
    };

    mockBarberRepo = {
      findOne: jest.fn(),
    };

    mockAvailabilityRepo = {
      find: jest.fn(),
    };

    mockBookingRepo = {
      find: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((model: any) => {
      if (model === Service) return mockServiceRepo;
      if (model === Barber) return mockBarberRepo;
      if (model === Availability) return mockAvailabilityRepo;
      if (model === Booking) return mockBookingRepo;
      return null;
    });

    (AppDataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
      return callback({
        save: jest.fn().mockImplementation(async (booking: any) => {
          return { ...booking, booking_id: 1 };
        }),
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a booking successfully', async () => {
    mockServiceRepo.findOneBy.mockResolvedValue({
      service_id: 1,
      name: 'Haircut',
      estimated_duration: 30,
      price: 50,
    });

    mockBarberRepo.findOne.mockResolvedValue({
      barber_id: 1,
      status: 'Active',
    });

    mockAvailabilityRepo.find.mockResolvedValue([
        {
          barber_id: 1,
          date: req.body.booking_time_str.split('T')[0],
          is_available: true,
          available_from: '09:00:00',
          available_until: '17:00:00',
        },
      ]);

    mockBookingRepo.find.mockResolvedValue([]);

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: req.user.userId,
        barber_id: req.body.barber_id,
        service_id: req.body.service_id,
        booking_time: new Date(req.body.booking_time_str),
        estimated_duration: 30,
        total_price: 50,
        status: 'Confirmed',
        payment_status: 'Pending',
        booking_id: 1,
      })
    );
  });

  it('should return 400 if required fields are missing', async () => {
    req.body = {};

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing required fields: barber_id, service_id, booking_time_str',
    });
  });

  it('should return 404 if service not found', async () => {
    mockServiceRepo.findOneBy.mockResolvedValue(null);

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: `Service with ID ${req.body.service_id} not found`,
    });
  });

  it('should return 404 if barber not found or inactive', async () => {
    mockServiceRepo.findOneBy.mockResolvedValue({
      service_id: 1,
      name: 'Haircut',
      estimated_duration: 30,
      price: 50,
    });

    mockBarberRepo.findOne.mockResolvedValue(null);

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: `Barber with ID ${req.body.barber_id} not found or is inactive.`,
    });
  });

  it('should return 409 if barber is not available', async () => {
    mockServiceRepo.findOneBy.mockResolvedValue({
      service_id: 1,
      name: 'Haircut',
      estimated_duration: 30,
      price: 50,
    });

    mockBarberRepo.findOne.mockResolvedValue({
      barber_id: 1,
      status: 'Active',
    });

    mockAvailabilityRepo.find.mockResolvedValue([]);

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message:
        'Barber is not available for the entire duration of the requested time slot on this date.',
    });
  });

it('should return 409 if there is a conflicting booking', async () => {
    mockServiceRepo.findOneBy.mockResolvedValue({
      service_id: 1,
      name: 'Haircut',
      estimated_duration: 30,
      price: 50,
    });
  
    mockBarberRepo.findOne.mockResolvedValue({
      barber_id: 1,
      status: 'Active',
    });

    mockAvailabilityRepo.find.mockResolvedValue([
      {
        barber_id: 1,
        date: req.body.booking_time_str.split('T')[0],
        is_available: true,
        available_from: '09:00:00',
        available_until: '17:00:00',
      },
    ]);

    mockBookingRepo.find.mockResolvedValue([
      {
        booking_id: 2,
        barber_id: 1,
        booking_time: new Date(req.body.booking_time_str),
        estimated_duration: 30,
        status: 'Confirmed'
      }
    ]);

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Barber already has a conflicting booking during this time slot.'
    });
  });
});