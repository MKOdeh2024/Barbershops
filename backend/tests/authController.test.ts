// backend/tests/controllers/authController.test.ts

// Triple-slash directive to ensure Jest types are recognized
/// <reference types="jest" />

import { Request, Response } from 'express';
// Import verifyEmailCode, remove confirmRegistration
import { registerUser, loginUser, getMe, verifyEmailCode } from '../../backend/controllers/authController.js';
import { AppDataSource } from '../../backend/config/db.js';
import User from '../../backend/config/models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// Remove crypto import
// import crypto from 'crypto';
// Import the NEW email sender function
import { sendConfirmationCodeEmail } from '../../backend/utils/emailSender.js';

// --- Mock Dependencies ---

const mockSave = jest.fn();
const mockFindOneBy = jest.fn();
const mockFindOne = jest.fn();
const mockCreate = jest.fn();

// Mock QueryBuilder methods needed for verifyEmailCode
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
    create: mockCreate,
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

// Mock AppDataSource
jest.mock('@/config/db', () => ({
    AppDataSource: {
        getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === User) {
                return mockUserRepository;
            }
            return {};
        }),
    },
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({ sign: jest.fn(), verify: jest.fn() }));

// Mock the NEW email sender utility
jest.mock('@/utils/emailSender', () => ({
    sendConfirmationCodeEmail: jest.fn(), // Mock the code sender
}));


// --- Test Suite ---
describe('Auth Controller', () => {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockStatus: jest.Mock;
    let mockJson: jest.Mock;
    let mockSend: jest.Mock; // Keep for potential error responses
    let mockRedirect: jest.Mock; // Keep for potential future use

    beforeEach(() => {
        jest.clearAllMocks();

        mockJson = jest.fn();
        mockSend = jest.fn();
        mockRedirect = jest.fn();
        mockStatus = jest.fn().mockImplementation(() => ({
            json: mockJson,
            send: mockSend,
        }));
        mockResponse = {
            status: mockStatus,
            json: mockJson,
            send: mockSend,
            redirect: mockRedirect,
        };

        // Reset repository mocks
        mockFindOneBy.mockReset();
        mockSave.mockReset();
        mockFindOne.mockReset();
        mockCreate.mockReset();
        mockQueryBuilderAddSelect.mockClear();
        mockQueryBuilderWhere.mockClear();
        mockQueryBuilderGetOne.mockClear();
        (mockUserRepository.createQueryBuilder as jest.Mock).mockClear();

        // Reset library mocks
        (bcrypt.hash as jest.Mock).mockReset();
        (bcrypt.compare as jest.Mock).mockReset();
        (jwt.sign as jest.Mock).mockReset();
        (jwt.verify as jest.Mock).mockReset();
        (sendConfirmationCodeEmail as jest.Mock).mockReset(); // Reset the new mock

        // Default mock request
        mockRequest = { body: {}, params: {}, headers: {}, user: undefined };
    });

    // --- Tests for registerUser (Updated for Code Flow) ---
    describe('registerUser', () => {
        beforeEach(() => {
            mockRequest.body = {
                first_name: 'Test', last_name: 'User',
                email: 'test@example.com', password: 'password123',
                phone_number: '1234567890', role: 'Client'
            };
            // Mock repository.create
            mockCreate.mockImplementation(userData => ({
                ...userData,
                password_hash: userData.password_hash, // Pass plain password for hook
                // Code/expiry are set within the controller now
                is_verified: false,
            }));
            // Mock save to return the saved entity with an ID
            mockSave.mockImplementation(userInstance => Promise.resolve({ ...userInstance, user_id: 1 }));
            // Mock email sending success by default
            (sendConfirmationCodeEmail as jest.Mock).mockResolvedValue(undefined);
        });

        test('should save user as unverified, generate code, send email, and return success message with email', async () => {
            mockFindOneBy.mockResolvedValue(null);

            await registerUser(mockRequest as Request, mockResponse as Response);

            expect(mockFindOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com', password_hash: 'password123' }));
            expect(mockSave).toHaveBeenCalledTimes(1);

            // Check that the object being saved has the code details set
            const savedUserData = mockSave.mock.calls[0][0];
            expect(savedUserData).toHaveProperty('confirmation_code');
            expect(savedUserData.confirmation_code).toMatch(/^\d{6}$/); // Check if it looks like a 6-digit code
            expect(savedUserData).toHaveProperty('confirmation_token_expires');
            expect(savedUserData.confirmation_token_expires).toBeInstanceOf(Date);
            // Check if expiry is roughly 10 mins in the future
            expect(savedUserData.confirmation_token_expires.getTime()).toBeGreaterThan(Date.now() + 9 * 60 * 1000);
            expect(savedUserData.confirmation_token_expires.getTime()).toBeLessThan(Date.now() + 11 * 60 * 1000);
            expect(savedUserData).toHaveProperty('is_verified', false);

            // Check email sending
            expect(sendConfirmationCodeEmail).toHaveBeenCalledTimes(1);
            expect(sendConfirmationCodeEmail).toHaveBeenCalledWith(
                'test@example.com', // to
                'Test', // name
                expect.stringMatching(/^\d{6}$/) // code (matches the generated code)
            );

            expect(jwt.sign).not.toHaveBeenCalled(); // No JWT token on register

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({
                message: 'Registration successful! Please check your email for a verification code.',
                email: 'test@example.com' // Expect email in response
            });
        });

        test('should return 400 if user exists but is not verified (code flow)', async () => {
            // Arrange: Simulate existing, unverified user
            mockFindOneBy.mockResolvedValue({ user_id: 2, email: 'test@example.com', is_verified: false });

            // Act
            await registerUser(mockRequest as Request, mockResponse as Response);

            // Assert: Check response and that no new user/email was processed
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Account exists but is not verified. Try verifying or contact support.' }); // Updated message
            expect(mockCreate).not.toHaveBeenCalled();
            expect(mockSave).not.toHaveBeenCalled();
            expect(sendConfirmationCodeEmail).not.toHaveBeenCalled();
        });

        test('should return 400 if user already exists and is verified', async () => {
             mockFindOneBy.mockResolvedValue({ user_id: 2, email: 'test@example.com', is_verified: true });
             await registerUser(mockRequest as Request, mockResponse as Response);
             expect(mockStatus).toHaveBeenCalledWith(400);
             expect(mockJson).toHaveBeenCalledWith({ message: 'User already exists with this email' });
             expect(mockSave).not.toHaveBeenCalled();
             expect(sendConfirmationCodeEmail).not.toHaveBeenCalled();
         });

        test('should return 500 if sending code email fails', async () => {
            mockFindOneBy.mockResolvedValue(null);
            const emailError = new Error('SMTP Error');
            (sendConfirmationCodeEmail as jest.Mock).mockRejectedValue(emailError);

            await registerUser(mockRequest as Request, mockResponse as Response);

            expect(mockSave).toHaveBeenCalledTimes(1); // User save attempt should still happen
            expect(sendConfirmationCodeEmail).toHaveBeenCalledTimes(1);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Registration succeeded but failed to send verification code. Please contact support.' });
        });

        // Other registerUser tests (DB error, validation error) remain similar conceptually
    });

    // --- Tests for verifyEmailCode (New) ---
    describe('verifyEmailCode', () => {
        beforeEach(() => {
            mockRequest.body = { email: 'test@example.com', code: '123456' };
        });

        test('should verify user successfully with valid code and email', async () => {
            // Arrange
            const futureDate = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 mins
            const mockUserFound = {
                user_id: 3, is_verified: false,
                confirmation_code: '123456',
                confirmation_token_expires: futureDate,
            };
            mockQueryBuilderGetOne.mockResolvedValue(mockUserFound); // Found via QueryBuilder
            mockSave.mockResolvedValue({ ...mockUserFound, is_verified: true, confirmation_code: null, confirmation_token_expires: null });

            // Act
            await verifyEmailCode(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(mockQueryBuilderAddSelect).toHaveBeenCalledWith(["user.confirmation_code", "user.confirmation_token_expires"]);
            expect(mockQueryBuilderWhere).toHaveBeenCalledWith("user.email = :email", { email: 'test@example.com' });
            expect(mockQueryBuilderGetOne).toHaveBeenCalledTimes(1);

            expect(mockSave).toHaveBeenCalledTimes(1);
            const savedArg = mockSave.mock.calls[0][0];
            expect(savedArg).toEqual(expect.objectContaining({
                user_id: 3, is_verified: true, confirmation_code: null, confirmation_token_expires: null,
            }));

            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Account verified successfully!' });
        });

        test('should return 400 if code format is invalid', async () => {
            mockRequest.body.code = '123'; // Invalid format
            await verifyEmailCode(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid code format. Must be 6 digits.' });
            expect(mockUserRepository.createQueryBuilder).not.toHaveBeenCalled();
        });

        test('should return 400 if user not found', async () => {
            mockQueryBuilderGetOne.mockResolvedValue(null); // User not found
            await verifyEmailCode(mockRequest as Request, mockResponse as Response);
            expect(mockQueryBuilderGetOne).toHaveBeenCalledTimes(1);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid email or verification code.' });
            expect(mockSave).not.toHaveBeenCalled();
        });

        test('should return 400 if user is already verified', async () => {
            const mockUserFound = { user_id: 3, is_verified: true }; // Already verified
            mockQueryBuilderGetOne.mockResolvedValue(mockUserFound);
            await verifyEmailCode(mockRequest as Request, mockResponse as Response);
            expect(mockQueryBuilderGetOne).toHaveBeenCalledTimes(1);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Account already verified.' });
            expect(mockSave).not.toHaveBeenCalled();
        });

        test('should return 400 if code is expired', async () => {
            const pastDate = new Date(Date.now() - 60000); // Expired 1 min ago
            const mockUserFound = { user_id: 3, is_verified: false, confirmation_code: '123456', confirmation_token_expires: pastDate };
            mockQueryBuilderGetOne.mockResolvedValue(mockUserFound);
            await verifyEmailCode(mockRequest as Request, mockResponse as Response);
            expect(mockQueryBuilderGetOne).toHaveBeenCalledTimes(1);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Verification code has expired or is invalid. Please request a new one.' });
            expect(mockSave).not.toHaveBeenCalled();
        });

        test('should return 400 if code does not match', async () => {
            const futureDate = new Date(Date.now() + 5 * 60 * 1000);
            const mockUserFound = { user_id: 3, is_verified: false, confirmation_code: '654321', confirmation_token_expires: futureDate }; // Different code stored
            mockQueryBuilderGetOne.mockResolvedValue(mockUserFound);
            await verifyEmailCode(mockRequest as Request, mockResponse as Response); // Sending '123456'
            expect(mockQueryBuilderGetOne).toHaveBeenCalledTimes(1);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid email or verification code.' });
            expect(mockSave).not.toHaveBeenCalled();
        });

        test('should return 400 if code or email missing in request', async () => {
            mockRequest.body = { email: 'test@example.com' }; // Missing code
            await verifyEmailCode(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Email and code are required.' });

            mockRequest.body = { code: '123456' }; // Missing email
            await verifyEmailCode(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Email and code are required.' });
        });

        test('should return 500 on database error during find', async () => {
            const dbError = new Error('DB Find Error');
            mockQueryBuilderGetOne.mockRejectedValue(dbError);
            await verifyEmailCode(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'An error occurred during account verification.' });
        });

        test('should return 500 on database error during save', async () => {
            const futureDate = new Date(Date.now() + 5 * 60 * 1000);
            const mockUserFound = { user_id: 3, is_verified: false, confirmation_code: '123456', confirmation_token_expires: futureDate };
            mockQueryBuilderGetOne.mockResolvedValue(mockUserFound);
            const dbSaveError = new Error('DB Save Error');
            mockSave.mockRejectedValue(dbSaveError); // Simulate save failing

            await verifyEmailCode(mockRequest as Request, mockResponse as Response);

            expect(mockSave).toHaveBeenCalledTimes(1); // Save was attempted
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'An error occurred during account verification.' });
        });
    });

    // --- Tests for loginUser (Updated Check) ---
    describe('loginUser', () => {
        // ... (tests remain the same, but the check for is_verified is now more relevant) ...
        test('should return 401 if user exists but is not verified', async () => {
            const mockUser = { is_verified: false, comparePassword: jest.fn() };
            mockFindOneBy.mockResolvedValue(mockUser);
            mockRequest.body = { email: 'unverified@example.com', password: 'password123' };
            await loginUser(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(401);
            // Match the exact message from the controller
            expect(mockJson).toHaveBeenCalledWith({ message: 'Account not verified. Please check your email or verify your account.' });
        });
         // ... other loginUser tests ...
    });

    // --- Tests for getMe (Unchanged) ---
    describe('getMe', () => {
        // ... (getMe tests remain the same) ...
    });

    // --- REMOVE describe block for confirmRegistration ---
    // describe('confirmRegistration', () => { ... }); // DELETE THIS BLOCK

});
