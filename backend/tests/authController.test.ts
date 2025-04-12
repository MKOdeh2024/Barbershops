// backend/tests/controllers/authController.test.ts

import { Request, Response } from 'express'; // Import Express types
import { registerUser } from '../controllers/authController.js'; // Adjust path as needed
import { AppDataSource } from '../config/db.js'; // Adjust path
import User from '../config/models/User.js'; // Adjust path
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// --- Mock Dependencies ---

// Mock TypeORM Repository methods
const mockSave = jest.fn();
const mockFindOneBy = jest.fn();
const mockUserRepository = {
    findOneBy: mockFindOneBy,
    save: mockSave,
    // Add mocks for other methods if needed by other controller functions
};
// Mock AppDataSource.getRepository to return our mock repository
jest.mock('../config/db', () => ({
    AppDataSource: {
        getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === User) {
                return mockUserRepository;
            }
            // Return mock for other entities if needed
            return {};
        }),
    },
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(), // Mock compare if testing login
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(), // Mock verify if testing protected routes/middleware
}));

// --- Test Suite ---
describe('Auth Controller - registerUser', () => {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockStatus: jest.Mock;
    let mockJson: jest.Mock;

    // Reset mocks and setup mock req/res before each test
    beforeEach(() => {
        jest.clearAllMocks(); // Clear all mock function calls and implementations

        // Setup mock request object
        mockRequest = {
            body: { // Default valid body
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                password: 'password123',
                phone_number: '1234567890'
            }
        };

        // Setup mock response object methods
        mockJson = jest.fn();
        mockStatus = jest.fn().mockImplementation(() => ({ // Make status() chainable with json()
            json: mockJson,
        }));
        mockResponse = {
            status: mockStatus,
            json: mockJson, // Also attach json directly in case status is not called
        };

        // Reset mock implementations for repository/libs for each test
        mockFindOneBy.mockReset();
        mockSave.mockReset();
        (bcrypt.hash as jest.Mock).mockReset();
        (jwt.sign as jest.Mock).mockReset();
    });

    test('should register a new user successfully', async () => {
        // Arrange
        mockFindOneBy.mockResolvedValue(null); // Simulate user does not exist
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123'); // Simulate hashing success
        const savedUser = { // Simulate the user object returned after save
            user_id: 1,
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            role: 'Client',
            password_hash: 'hashedPassword123' // Added for completeness, though not returned in response
        };
        // Make the mock User instance's save method resolve to the saved user
        // This requires mocking the User class constructor or its prototype's save method
        // Simpler approach: have the repository mock return the expected user data
         mockSave.mockImplementation(userInstance => Promise.resolve({ // Simulate save returning the saved entity
             ...userInstance,
             user_id: 1, // Assign an ID
             password_hash: 'hashedPassword123', // Reflect hashed password
             role: userInstance.role || 'Client' // Ensure role is set
         }));

        (jwt.sign as jest.Mock).mockReturnValue('mockFakeToken'); // Simulate signing success

        // Act
        await registerUser(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockFindOneBy).toHaveBeenCalledTimes(1);
        expect(mockFindOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(bcrypt.hash).toHaveBeenCalledTimes(1);
        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10); // Assuming salt rounds = 10
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(jwt.sign).toHaveBeenCalledTimes(1);
        expect(jwt.sign).toHaveBeenCalledWith(
            { userId: 1, role: 'Client' }, // Check payload
            process.env.JWT_SECRET,      // Check secret (ensure JWT_SECRET is set in test env or mock process.env)
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } // Check options
        );
        expect(mockStatus).toHaveBeenCalledWith(201); // Check status code
        expect(mockJson).toHaveBeenCalledWith({      // Check response body
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
        expect(mockFindOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(bcrypt.hash).not.toHaveBeenCalled(); // Ensure hashing was skipped
        expect(mockSave).not.toHaveBeenCalled(); // Ensure save was skipped
        expect(jwt.sign).not.toHaveBeenCalled(); // Ensure signing was skipped
        expect(mockStatus).toHaveBeenCalledWith(400); // Check status code
        expect(mockJson).toHaveBeenCalledWith({ message: 'User already exists' }); // Check error message
    });

    test('should return 500 if hashing fails', async () => {
        // Arrange
        mockFindOneBy.mockResolvedValue(null); // User does not exist
        const hashError = new Error('Hashing failed');
        (bcrypt.hash as jest.Mock).mockRejectedValue(hashError); // Simulate hashing failure

        // Act
        await registerUser(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockFindOneBy).toHaveBeenCalledTimes(1);
        expect(bcrypt.hash).toHaveBeenCalledTimes(1);
        expect(mockSave).not.toHaveBeenCalled();
        expect(jwt.sign).not.toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ message: 'Server error during registration' });
    });

     test('should return 500 if saving user fails', async () => {
        // Arrange
        mockFindOneBy.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
        const saveError = new Error('Database save failed');
        mockSave.mockRejectedValue(saveError); // Simulate save failure

        // Act
        await registerUser(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockFindOneBy).toHaveBeenCalledTimes(1);
        expect(bcrypt.hash).toHaveBeenCalledTimes(1);
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(jwt.sign).not.toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ message: 'Server error during registration' });
    });

    // Add tests for validation errors if validation logic was part of the controller
    // (though usually validation middleware is tested separately)
});

// Add similar describe blocks and tests for loginUser, etc.