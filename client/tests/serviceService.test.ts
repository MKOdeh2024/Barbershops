// src/services/serviceService.test.ts
import { getServices, Service } from '../src/services/serviceService'; // Import function and type
import api from '@/utils/api'; // Import the axios instance to mock

// --- Mock the Axios instance ---
// We mock the resolved value for a successful GET request
// and the rejected value for a failed request.
jest.mock('@/utils/api', () => ({
    get: jest.fn(), // Mock the 'get' method
    // Mock other methods (post, put, delete) if needed for other service tests
}));

// --- Test Suite ---
describe('Service Service API Calls', () => {

    // Clear mocks before each test
    beforeEach(() => {
        // Reset mocks including their implementation/resolved values
       (api.get as jest.Mock).mockClear();
    });

    test('getServices successfully fetches services', async () => {
        // Arrange: Define mock data the API should return
        const mockServices: Service[] = [
            { service_id: 1, name: 'Haircut', description: 'A standard haircut', price: 30, estimated_duration: 30, category: 'Cuts' },
            { service_id: 2, name: 'Beard Trim', description: 'Shape up', price: 15, estimated_duration: 15, category: 'Beard' },
        ];
        // Configure the mock implementation for api.get
        (api.get as jest.Mock).mockResolvedValueOnce({ data: mockServices });

        // Act: Call the service function
        const services = await getServices();

        // Assert: Check results
        expect(services).toEqual(mockServices); // Check if the returned data matches mock data
        expect(api.get).toHaveBeenCalledTimes(1); // Check if api.get was called once
        expect(api.get).toHaveBeenCalledWith('/services'); // Check if it was called with the correct endpoint
    });


    test('getServices handles API errors', async () => {
        // Arrange: Configure the mock to reject with an error
        const errorMessage = 'Network Error';
        (api.get as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

        // Act & Assert: Call the function and expect it to throw an error
        // Use try/catch or .rejects matcher
        await expect(getServices()).rejects.toThrow(errorMessage);

         // Assert: Check if api.get was called
        expect(api.get).toHaveBeenCalledTimes(1);
        expect(api.get).toHaveBeenCalledWith('/services');
    });

});