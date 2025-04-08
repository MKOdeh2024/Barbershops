import api from '../utils/api';

// Define the expected structure of a Service object from the API
export interface Service {
  service_id: number | string;
  name: string;
  description: string;
  price: string | number; // Price might be string or number from backend
  estimated_duration: number; // In minutes
  category: string;
  // Add other fields if returned by the API
}

/**
 * Fetches all available services from the backend.
 */
export const getServices = async (): Promise<Service[]> => {
  try {
    const response = await api.get<Service[]>('/services');
    // Optional: Add basic validation or transformation of response data here
    return response.data;
  } catch (error) {
    console.error('Get Services API call failed:', error);
    // Consider throwing a more specific error or returning a default value/error object
    throw error; // Re-throw to be handled by the calling component
  }
};

// Add other service-related API functions if needed (e.g., getServiceById)