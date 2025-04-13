// backend/tests/controllers/authController.test.ts

import { Request, Response } from 'express';
// Adjusted path: ../../src/controllers/... (no .js)
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
// Adjusted path: ../../src/config/... (no .js) - OR use alias like '@/config/db'
import { AppDataSource } from '../config/db.js';
// Adjusted path: ../../src/models/... (no .js) - OR use alias like '@/models/User'
import User from '../config/models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// --- Mock Dependencies ---

const mockSave = jest.fn();
const mockFindOneBy = jest.fn();
const mockUserRepository = {
    findOneBy: mockFindOneBy,
    save: mockSave,
    // Mock 'findOne' if getMe controller uses it instead of findOneBy
    findOne: jest.fn(),
};

// Mock AppDataSource.getRepository using alias (preferred) or corrected relative path
// Ensure alias '@/' is configured in jest.config.js and tsconfig.json
jest.mock('../config/db', () => ({ // Using alias
    AppDataSource: {
        getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === User) {
                return mockUserRepository;
            }
            // Return mock for other entities if needed by other controller functions being tested elsewhere
            return {};
        }),
    },
}));
// OR Using relative path:
// jest.mock('../../src/config/db', () => ({ // Adjusted relative path
//     AppDataSource: {
//         getRepository: jest.fn().mockImplementation((entity) => {
//             if (entity === User) {
//                 return mockUserRepository;
//             }
//             return {};
//         }),
//     },
// }));


// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

interface RequestWithUser extends Request {
  user: any;
}

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(), // Keep verify mock if testing middleware/protected routes
}));

// --- Test Suite ---
describe('Auth Controller', () => {
    

    let mockRequest: RequestWithUser;
    let mockResponse: Partial<Response>;
    let mockStatus: jest.Mock;
    let mockJson: jest.Mock;

    // Reset mocks and setup mock req/res before each test
    beforeEach(() => {
        jest.clearAllMocks(); // Clear all mock function calls and implementations

        mockJson = jest.fn();
        mockStatus = jest.fn().mockImplementation(() => ({ // Make status() chainable with json()
            json: mockJson,
            send: jest.fn() // Add send if needed for some error handlers
        }));
        mockResponse = {
            status: mockStatus,
            json: mockJson,
        };

        // Reset repository mocks
        mockFindOneBy.mockReset();
        mockSave.mockReset();
        (mockUserRepository.findOne as jest.Mock).mockReset(); // Reset findOne if mocked
        (bcrypt.hash as jest.Mock).mockReset();
        (bcrypt.compare as jest.Mock).mockReset();
        (jwt.sign as jest.Mock).mockReset();
        (jwt.verify as jest.Mock).mockReset();

        // Default mock request (can be overridden in tests)
        
        mockRequest = {
            body: {},
            params: {},
            headers: {},
            user: { user_id: 5, role: 'Client' }
        } as RequestWithUser;
    });

    // --- Tests for registerUser ---
    describe('registerUser', () => {
        beforeEach(() => {
            // Setup common request body for registration
            mockRequest.body = {
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                password: 'password123',
                phone_number: '1234567890'
            };
        });

        test('should register a new user successfully', async () => {
            // Arrange
            mockFindOneBy.mockResolvedValue(null); // User does not exist
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
            const savedUser = { user_id: 1, first_name: 'Test', email: 'test@example.com', role: 'Client' };
            mockSave.mockImplementation(userInstance => Promise.resolve({ ...userInstance, user_id: 1, password_hash: 'hashedPassword123', role: userInstance.role || 'Client' }));
            (jwt.sign as jest.Mock).mockReturnValue('mockFakeToken');

            // Act
            await registerUser(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockFindOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 1, role: 'Client' },
                process.env.JWT_SECRET, // Ensure JWT_SECRET is available in test env
                { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
            );
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({
                user_id: 1,
                first_name: 'Test',
                email: 'test@example.com',
                role: 'Client',
                token: 'mockFakeToken',
            });
        });

        test('should return 400 if user already exists', async () => {
             // Arrange
            mockFindOneBy.mockResolvedValue({ user_id: 2, email: 'test@example.com' }); // Simulate user exists

            // Act
            await registerUser(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockFindOneBy).toHaveBeenCalledTimes(1);
            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(mockSave).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'User already exists' });
        });

        test('should return 500 if hashing fails', async () => {
            // Arrange
            mockFindOneBy.mockResolvedValue(null);
            const hashError = new Error('Hashing failed');
            (bcrypt.hash as jest.Mock).mockRejectedValue(hashError);

            // Act
            await registerUser(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Server error during registration' });
        });

        // Add more tests for other scenarios (e.g., database save error)...
    });

    // --- Tests for loginUser ---
    describe('loginUser', () => {
         beforeEach(() => {
            // Setup common request body for login
            mockRequest.body = {
                email: 'test@example.com',
                password: 'password123',
            };
        });

        test('should login user successfully with correct credentials', async () => {
            // Arrange
            const mockUser = {
                user_id: 1,
                first_name: 'Test',
                email: 'test@example.com',
                role: 'Client',
                password_hash: 'hashedPassword123',
                // Mock the comparePassword method if it's on the User instance
                comparePassword: jest.fn().mockResolvedValue(true)
            };
            mockFindOneBy.mockResolvedValue(mockUser); // User found
             // If comparePassword is NOT on the instance, mock bcrypt.compare directly:
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('mockLoginToken');

            // Act
            await loginUser(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockFindOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
            // If comparePassword is on instance:
            expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
            // OR if using bcrypt directly:
            // expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 1, role: 'Client' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
            );
            // Status defaults to 200 for json response if not set otherwise
            expect(mockJson).toHaveBeenCalledWith({
                user_id: 1,
                first_name: 'Test',
                email: 'test@example.com',
                role: 'Client',
                token: 'mockLoginToken',
            });
             expect(mockStatus).not.toHaveBeenCalled(); // Status isn't explicitly set for 200 json response

        });

        test('should return 401 if user not found', async () => {
            // Arrange
            mockFindOneBy.mockResolvedValue(null); // User not found

            // Act
            await loginUser(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockFindOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid email or password' });
        });

        test('should return 401 if password comparison fails', async () => {
            // Arrange
             const mockUser = {
                user_id: 1,
                password_hash: 'hashedPassword123',
                comparePassword: jest.fn().mockResolvedValue(false) // Password doesn't match
            };
            mockFindOneBy.mockResolvedValue(mockUser);
            // OR if using bcrypt directly:
            // (bcrypt.compare as jest.Mock).mockResolvedValue(false);

             // Act
            await loginUser(mockRequest as Request, mockResponse as Response);

             // Assert
            expect(mockFindOneBy).toHaveBeenCalledTimes(1);
            // expect(bcrypt.compare).toHaveBeenCalledTimes(1); // OR expect mockUser.comparePassword
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid email or password' });
        });

         // Add tests for server errors during login...
    });

     // --- Tests for getMe ---
    describe('getMe', () => {
        test('should return user details for authenticated user', async () => {
            // Arrange
             const mockUserResult = { user_id: 5, first_name: 'Current', last_name: 'User', email: 'current@example.com', role: 'Client', phone_number: '555', profile_picture: null };
            // Simulate middleware adding user to request
            mockRequest.user = { user_id: 5, role: 'Client' }; // Add user from protect middleware
             // Mock the repository's findOne method used by getMe
            (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUserResult);

            // Act
            await getMe(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockUserRepository.findOne).toHaveBeenCalledTimes(1);
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
                 where: { user_id: 5 },
                 select: ['user_id', 'first_name', 'last_name', 'email', 'role', 'phone_number', 'profile_picture']
             });
             expect(mockJson).toHaveBeenCalledWith(mockUserResult); // Should return the found user details
             expect(mockStatus).not.toHaveBeenCalled(); // 200 OK is default for json

        });

         test('should return 401 if user is not attached to request (middleware failure)', async () => {
            // Arrange
            mockRequest.user = undefined; // Simulate middleware failed to attach user

             // Act
            await getMe(mockRequest as Request, mockResponse as Response);

             // Assert
            expect(mockUserRepository.findOne).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Not authorized, no user ID found' });

         });

        test('should return 404 if user found in token but not in database', async () => {
             // Arrange
            mockRequest.user = { user_id: 99, role: 'Client' };
             // Simulate user not found in DB despite being in token
            (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);

             // Act
            await getMe(mockRequest as Request, mockResponse as Response);

             // Assert
            expect(mockUserRepository.findOne).toHaveBeenCalledTimes(1);
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { user_id: 99 }, select: expect.any(Array) });
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
        });

         // Add test for server error during findOne...
    });

});