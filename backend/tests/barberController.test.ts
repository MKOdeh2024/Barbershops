import { Request, Response } from 'express';
import { createBarber, getAllBarbers } from '../controllers/barberController.js';
import { AppDataSource } from '../config/db.js';
import Barber from '../config/models/Barber.js';
import User from '../config/models/User.js';
import Availability from '../config/models/Availability.js';

// Mock the repositories
const mockUserRepository = {
  findOneBy: jest.fn(),
};

const mockBarberRepository = {
  findOneBy: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};

const mockAvailabilityRepository = {
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
};

// Mock AppDataSource.getRepository to return the mocked repositories
jest.mock('../backend/config/db', () => ({
  AppDataSource: {
    getRepository: (model: any) => {
      if (model === User) return mockUserRepository;
      if (model === Barber) return mockBarberRepository;
      if (model === Availability) return mockAvailabilityRepository;
    },
  },
}));

describe('Barber Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('createBarber', () => {
    it('should create a new barber profile', async () => {
      req = {
        body: {
          user_id: 1,
          specialization: 'Haircut',
          status: 'Active',
        },
      };

      mockUserRepository.findOneBy.mockResolvedValue({ user_id: 1, role: 'Co-Barber' });
      mockBarberRepository.findOneBy.mockResolvedValue(null);
      mockBarberRepository.save.mockResolvedValue({
        barber_id: 1,
        user_id: 1,
        specialization: 'Haircut',
        status: 'Active',
      });

      await createBarber(req as Request, res as Response);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ user_id: 1, role: 'Co-Barber' });
      expect(mockBarberRepository.findOneBy).toHaveBeenCalledWith({ user_id: 1 });
      expect(mockBarberRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 1,
        specialization: 'Haircut',
        status: 'Active',
      }));
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        barber_id: 1,
        user_id: 1,
        specialization: 'Haircut',
        status: 'Active',
      });
    });

    it('should return 400 if user is not a Co-Barber', async () => {
      req = {
        body: {
          user_id: 2,
          specialization: 'Shaving',
        },
      };

      mockUserRepository.findOneBy.mockResolvedValue(null);

      await createBarber(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Valid Co-Barber User ID is required' });
    });

    it('should return 400 if barber profile already exists', async () => {
      req = {
        body: {
          user_id: 3,
          specialization: 'Styling',
        },
      };

      mockUserRepository.findOneBy.mockResolvedValue({ user_id: 3, role: 'Co-Barber' });
      mockBarberRepository.findOneBy.mockResolvedValue({ barber_id: 2 });

      await createBarber(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Barber profile already exists for this user' });
    });

    it('should return 500 on server error', async () => {
      req = {
        body: {
          user_id: 4,
          specialization: 'Coloring',
        },
      };

      mockUserRepository.findOneBy.mockRejectedValue(new Error('Database error'));

      await createBarber(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Server Error creating barber profile' });
    });
  });

  describe('getAllBarbers', () => {
    it('should return all active barbers with user details', async () => {
      req = {};

      const mockBarbers = [
        {
          barber_id: 1,
          specialization: 'Haircut',
          status: 'Active',
          user: {
            user_id: 1,
            first_name: 'John',
            last_name: 'Doe',
            profile_picture: 'profile.jpg',
          },
        },
      ];

      mockBarberRepository.find.mockResolvedValue(mockBarbers);

      await getAllBarbers(req as Request, res as Response);

      expect(mockBarberRepository.find).toHaveBeenCalledWith({
        where: { status: 'Active' },
        relations: ['user'],
        select: {
          barber_id: true,
          specialization: true,
          status: true,
          user: {
            user_id: true,
            first_name: true,
            last_name: true,
            profile_picture: true,
          },
        },
      });
      expect(jsonMock).toHaveBeenCalledWith(mockBarbers);
    });

    it('should return 500 on server error', async () => {
      req = {};

      mockBarberRepository.find.mockRejectedValue(new Error('Database error'));

      await getAllBarbers(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Server Error fetching barbers' });
    });
  });
});
