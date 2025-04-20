// backend/tests/controllers/authController.test.ts

// Triple-slash directive to ensure Jest types are recognized
/// <reference types="jest" />

import { Request, Response } from 'express';
import { registerUser, loginUser, getMe, confirmRegistration } from '../controllers/authController.js'; // Using relative path from tests/ to src/
import { AppDataSource } from '../config/db.js';
import User from '../config/models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Needed for token generation logic simulation
import { sendConfirmationEmail } from '../utils/emailSender.js'; // Import the function to mock

// --- Mock Dependencies ---

// Mock TypeORM Repository methods
const mockSave = jest.fn();
const mockFindOneBy = jest.fn();
const mockFindOne = jest.fn(); // For getMe
const mockCreate = jest.fn(); // To mock repository.create

// Mock QueryBuilder methods
const mockQueryBuilderAddSelect = jest.fn().mockReturnThis();
const mockQueryBuilderWhere = jest.fn().mockReturnThis();
const mockQueryBuilderGetOne = jest.fn();
const mockQueryBuilder = {
    addSelect: mockQueryBuilderAddSelect,
    where: mockQueryBuilderWhere,
    getOne: mockQueryBuilderGetOne,
};

const mockUserRepository = {
    findOneBy: mockFindOneBy,
    save: mockSave,
    findOne: mockFindOne,
    create: mockCreate, // Mock create method
    createQueryBuilder: jest.fn(() => mockQueryBuilder), // Mock createQueryBuilder
};

// Mock AppDataSource.getRepository using alias (preferred) or corrected relative path
// Ensure alias '@/' is configured in jest.config.js and tsconfig.json
jest.mock('@/config/db', () => ({ // Using alias
    AppDataSource: {
        getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === User) {
                return mockUserRepository;
            }
            return {}; // Return empty mock for other potential entities
        }),
    },
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(),
}));

// Mock crypto for token generation (optional, can just check if save is called with a token)
jest.mock('crypto', () => ({
    randomBytes: jest.fn(() => ({ toString: jest.fn(() => 'mockConfirmationToken123') })),
}));

// Mock the email sender utility
jest.mock('@/utils/emailSender', () => ({
    sendConfirmationEmail: jest.fn(), // Mock the specific function
}));


// --- Test Suite ---
describe('Auth Controller', () => {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockStatus: jest.Mock;
    let mockJson: jest.Mock;
    let mockSend: jest.Mock;
    let mockRedirect: jest.Mock;

    // Reset mocks and setup mock req/res before each test
    beforeEach(() => {
        jest.clearAllMocks();

        mockJson = jest.fn();
        mockSend = jest.fn(); // For confirmRegistration errors
        mockRedirect = jest.fn(); // For confirmRegistration success
        mockStatus = jest.fn().mockImplementation(() => ({
            json: mockJson,
            send: mockSend, // Attach send
        }));
        mockResponse = {
            status: mockStatus,
            json: mockJson,
            send: mockSend, // Attach send directly
            redirect: mockRedirect, // Attach redirect
        };

        // Reset repository mocks
        mockFindOneBy.mockReset();
        mockSave.mockReset();
        mockFindOne.mockReset();
        mockCreate.mockReset();
        // Reset query builder mocks
        mockQueryBuilderAddSelect.mockClear();
        mockQueryBuilderWhere.mockClear();
        mockQueryBuilderGetOne.mockClear();
        (mockUserRepository.createQueryBuilder as jest.Mock).mockClear();

        // Reset library mocks
        (bcrypt.hash as jest.Mock).mockReset();
        (bcrypt.compare as jest.Mock).mockReset();
        (jwt.sign as jest.Mock).mockReset();
        (jwt.verify as jest.Mock).mockReset();
        (crypto.randomBytes as jest.Mock).mockClear();
        (sendConfirmationEmail as jest.Mock).mockReset();


        // Default mock request (can be overridden in tests)
        mockRequest = {
            body: {},
            params: {},
            headers: {},
            user: undefined, // Clear user from potential previous tests
        };
    });

    // --- Tests for registerUser (Updated) ---
    describe('registerUser', () => {
        beforeEach(() => {
            mockRequest.body = {
                first_name: 'Test', last_name: 'User',
                email: 'test@example.com', password: 'password123',
                phone_number: '1234567890', role: 'Client'
            };
            // Mock repository.create to return an object that can be saved
            mockCreate.mockImplementation(userData => ({
                ...userData, // Spread the input data
                password_hash: userData.password_hash, // Keep the plain password temporarily
                // Simulate setting token details before save
                confirmation_token: 'mockConfirmationToken123',
                confirmation_token_expires: expect.any(Date), // Check if date is set
                is_verified: false,
            }));
            // Mock save to return the saved entity with an ID
            mockSave.mockImplementation(userInstance => Promise.resolve({ ...userInstance, user_id: 1 }));
            // Mock email sending success by default
            (sendConfirmationEmail as jest.Mock).mockResolvedValue(undefined);
        });

        test('should save user as unverified, generate token, send email, and return success message', async () => {
            // Arrange
            mockFindOneBy.mockResolvedValue(null); // User does not exist
            // bcrypt hash is now handled by BeforeInsert hook, so we don't mock/expect it here directly
            // We check the data passed to save includes the plain password for the hook

            // Act
            await registerUser(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockFindOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockCreate).toHaveBeenCalledWith({
                first_name: 'Test', last_name: 'User',
                email: 'test@example.com', password_hash: 'password123', // Pass plain password
                phone_number: '1234567890', role: 'Client',
                is_verified: false,
            });
            expect(mockSave).toHaveBeenCalledTimes(1);
            // Check that the object being saved has the token details set
            const savedUserData = mockSave.mock.calls[0][0];
            expect(savedUserData).toHaveProperty('confirmation_token', 'mockConfirmationToken123');
            expect(savedUserData).toHaveProperty('confirmation_token_expires');
            expect(savedUserData.confirmation_token_expires).toBeInstanceOf(Date);
            expect(savedUserData).toHaveProperty('is_verified', false);

            expect(crypto.randomBytes).toHaveBeenCalledWith(32); // Check token generation call

            expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
            expect(sendConfirmationEmail).toHaveBeenCalledWith(
                'test@example.com', // to
                'Test', // name
                expect.stringContaining('/api/auth/confirm/mockConfirmationToken123') // confirmationUrl
            );

            expect(jwt.sign).not.toHaveBeenCalled(); // No JWT token on register

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({
                message: 'Registration successful! Please check your email to confirm your account.',
            });
        });

        test('should return 400 if user already exists and is verified', async () => {
            mockFindOneBy.mockResolvedValue({ user_id: 2, email: 'test@example.com', is_verified: true });
            await registerUser(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'User already exists with this email' });
            expect(mockSave).not.toHaveBeenCalled();
            expect(sendConfirmationEmail).not.toHaveBeenCalled();
        });

        // Optional: Test for existing but unverified user (depends on desired logic)
        test('should return 400 if user exists but is not verified', async () => {
             mockFindOneBy.mockResolvedValue({ user_id: 2, email: 'test@example.com', is_verified: false });
             await registerUser(mockRequest as Request, mockResponse as Response);
             // Current logic returns 'User already exists'. Adjust if you want to resend email.
             expect(mockStatus).toHaveBeenCalledWith(400);
             expect(mockJson).toHaveBeenCalledWith({ message: 'User already exists with this email' });
             expect(mockSave).not.toHaveBeenCalled();
             expect(sendConfirmationEmail).not.toHaveBeenCalled();
        });


        test('should return 500 if saving user fails', async () => {
            mockFindOneBy.mockResolvedValue(null);
            const saveError = new Error('Database save failed');
            mockSave.mockRejectedValue(saveError);

            await registerUser(mockRequest as Request, mockResponse as Response);

            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(sendConfirmationEmail).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Server error during registration' });
        });

        test('should return 500 if sending email fails', async () => {
            mockFindOneBy.mockResolvedValue(null);
            const emailError = new Error('SMTP Connection Error');
            (sendConfirmationEmail as jest.Mock).mockRejectedValue(emailError);

            await registerUser(mockRequest as Request, mockResponse as Response);

            expect(mockSave).toHaveBeenCalledTimes(1); // User save should still succeed
            expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Registration succeeded but failed to send confirmation email. Please contact support.' });
        });

         test('should force role to Client even if Admin/Co-Barber is sent', async () => {
             mockRequest.body.role = 'Admin'; // Attempt to register as Admin
             mockFindOneBy.mockResolvedValue(null);

             await registerUser(mockRequest as Request, mockResponse as Response);

             expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ role: 'Client' })); // Check forced role
             expect(mockSave).toHaveBeenCalledTimes(1);
             expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
             expect(mockStatus).toHaveBeenCalledWith(201);
         });
    });

    // --- Tests for loginUser (Updated) ---
    describe('loginUser', () => {
        beforeEach(() => {
            mockRequest.body = { email: 'test@example.com', password: 'password123' };
        });

        test('should login successfully if user exists, password matches, and is verified', async () => {
            const mockUser = {
                user_id: 1, first_name: 'Test', last_name: 'User',
                email: 'test@example.com', role: 'Client',
                password_hash: 'hashedPassword123', is_verified: true, // User is verified
                comparePassword: jest.fn().mockResolvedValue(true) // Password matches
            };
            mockFindOneBy.mockResolvedValue(mockUser);
            (jwt.sign as jest.Mock).mockReturnValue('mockLoginToken');

            await loginUser(mockRequest as Request, mockResponse as Response);

            expect(mockFindOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
            expect(jwt.sign).toHaveBeenCalledTimes(1);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ token: 'mockLoginToken' }));
        });

        test('should return 401 if user exists but is not verified', async () => {
            const mockUser = {
                user_id: 1, email: 'test@example.com', role: 'Client',
                password_hash: 'hashedPassword123', is_verified: false, // User NOT verified
                comparePassword: jest.fn() // comparePassword shouldn't matter here
            };
            mockFindOneBy.mockResolvedValue(mockUser);

            await loginUser(mockRequest as Request, mockResponse as Response);

            expect(mockFindOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockUser.comparePassword).not.toHaveBeenCalled(); // Password check shouldn't happen
            expect(jwt.sign).not.toHaveBeenCalled(); // No token should be generated
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Account not verified. Please check your email for the confirmation link.' });
        });

        test('should return 401 if user exists and is verified, but password fails', async () => {
             const mockUser = {
                user_id: 1, email: 'test@example.com', role: 'Client',
                password_hash: 'hashedPassword123', is_verified: true, // User verified
                comparePassword: jest.fn().mockResolvedValue(false) // Password MISMATCH
            };
            mockFindOneBy.mockResolvedValue(mockUser);

            await loginUser(mockRequest as Request, mockResponse as Response);

            expect(mockFindOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid email or password' });
        });

        // Keep tests for user not found (returns 401 Invalid email/password)
        test('should return 401 if user not found', async () => {
            mockFindOneBy.mockResolvedValue(null);
            await loginUser(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid email or password' });
        });
    });

    // --- Tests for confirmRegistration (New) ---
    describe('confirmRegistration', () => {
        beforeEach(() => {
            mockRequest.params = { token: 'validMockToken123' };
            // Mock process.env for redirect URL
            process.env.FRONTEND_URL = 'http://localhost:3000';
        });

        test('should verify user, clear token, and redirect on valid token', async () => {
            // Arrange
            const futureDate = new Date(Date.now() + 60000); // Token expires in future
            const mockUserFound = {
                user_id: 3, is_verified: false,
                confirmation_token: 'validMockToken123',
                confirmation_token_expires: futureDate,
                // Include save method if it's on the instance, otherwise rely on repo mock
            };
            mockQueryBuilderGetOne.mockResolvedValue(mockUserFound); // Simulate query builder finding user
            mockSave.mockResolvedValue({ ...mockUserFound, is_verified: true, confirmation_token: null, confirmation_token_expires: null }); // Simulate successful save

            // Act
            await confirmRegistration(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(mockQueryBuilderAddSelect).toHaveBeenCalledWith(["user.confirmation_token", "user.confirmation_token_expires"]);
            expect(mockQueryBuilderWhere).toHaveBeenCalledWith("user.confirmation_token = :token", { token: 'validMockToken123' });
            expect(mockQueryBuilderGetOne).toHaveBeenCalledTimes(1);

            expect(mockSave).toHaveBeenCalledTimes(1);
            const savedArg = mockSave.mock.calls[0][0];
            expect(savedArg).toEqual(expect.objectContaining({
                user_id: 3,
                is_verified: true,
                confirmation_token: null,
                confirmation_token_expires: null,
            }));

            expect(mockRedirect).toHaveBeenCalledTimes(1);
            expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/auth/login?confirmed=true');
        });

        test('should return 400 if token is not found', async () => {
            // Arrange
            mockQueryBuilderGetOne.mockResolvedValue(null); // Simulate token not found

            // Act
            await confirmRegistration(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockQueryBuilderGetOne).toHaveBeenCalledTimes(1);
            expect(mockSave).not.toHaveBeenCalled();
            expect(mockRedirect).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockSend).toHaveBeenCalledWith('Invalid confirmation token.');
        });

        test('should return 400 if token is expired', async () => {
             // Arrange
            const pastDate = new Date(Date.now() - 60000); // Token expired
            const mockUserFound = {
                user_id: 4, is_verified: false,
                confirmation_token: 'validMockToken123',
                confirmation_token_expires: pastDate,
            };
            mockQueryBuilderGetOne.mockResolvedValue(mockUserFound);

            // Act
            await confirmRegistration(mockRequest as Request, mockResponse as Response);

             // Assert
            expect(mockQueryBuilderGetOne).toHaveBeenCalledTimes(1);
            expect(mockSave).not.toHaveBeenCalled();
            expect(mockRedirect).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockSend).toHaveBeenCalledWith('Confirmation token has expired.');
        });

         test('should return 400 if token is missing in params', async () => {
             // Arrange
            mockRequest.params = {}; // No token

             // Act
            await confirmRegistration(mockRequest as Request, mockResponse as Response);

             // Assert
            expect(mockUserRepository.createQueryBuilder).not.toHaveBeenCalled();
            expect(mockSave).not.toHaveBeenCalled();
            expect(mockRedirect).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockSend).toHaveBeenCalledWith('Confirmation token missing.');
        });

        test('should return 500 if database error occurs during find', async () => {
            // Arrange
            const dbError = new Error('DB Find Error');
            mockQueryBuilderGetOne.mockRejectedValue(dbError);

            // Act
            await confirmRegistration(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockQueryBuilderGetOne).toHaveBeenCalledTimes(1);
            expect(mockSave).not.toHaveBeenCalled();
            expect(mockRedirect).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalledWith('An error occurred during account confirmation.');
        });

         test('should return 500 if database error occurs during save', async () => {
             // Arrange
            const futureDate = new Date(Date.now() + 60000);
            const mockUserFound = { user_id: 3, is_verified: false, confirmation_token: 'validMockToken123', confirmation_token_expires: futureDate };
            mockQueryBuilderGetOne.mockResolvedValue(mockUserFound);
            const dbSaveError = new Error('DB Save Error');
            mockSave.mockRejectedValue(dbSaveError);

            // Act
            await confirmRegistration(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockQueryBuilderGetOne).toHaveBeenCalledTimes(1);
            expect(mockSave).toHaveBeenCalledTimes(1); // Save was attempted
            expect(mockRedirect).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalledWith('An error occurred during account confirmation.');
        });
    });

    // --- Tests for getMe (Unchanged from previous version) ---
    describe('getMe', () => {
        // ... (getMe tests remain the same as they assume successful login/verification) ...
         test('should return user details for authenticated user', async () => {
            const mockUserResult = { user_id: 5, first_name: 'Current', last_name: 'User', email: 'current@example.com', role: 'Client', phone_number: '555', profile_picture: null, is_verified: true, created_at: new Date() };
            mockRequest.user = { userId: 5, role: 'Client' }; // Correctly match property name from middleware
            (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUserResult);

            await getMe(mockRequest as Request, mockResponse as Response);

            expect(mockUserRepository.findOne).toHaveBeenCalledTimes(1);
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
                 where: { user_id: 5 },
                 // Updated select fields based on controller example
                 select: ['user_id', 'first_name', 'last_name', 'email', 'role', 'phone_number', 'profile_picture', 'is_verified', 'created_at']
             });
             expect(mockJson).toHaveBeenCalledWith(mockUserResult);
             expect(mockStatus).not.toHaveBeenCalled();
        });

        test('should return 401 if user is not attached to request', async () => {
            mockRequest.user = undefined;
            await getMe(mockRequest as Request, mockResponse as Response);
            expect(mockUserRepository.findOne).not.toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(401);
            // Match the specific error message from the controller
            expect(mockJson).toHaveBeenCalledWith({ message: 'Not authorized, user ID missing' });
        });

        test('should return 404 if user in token not found in DB', async () => {
            mockRequest.user = { userId: 99, role: 'Client' };
            (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);
            await getMe(mockRequest as Request, mockResponse as Response);
            expect(mockUserRepository.findOne).toHaveBeenCalledTimes(1);
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
        });
    });

});