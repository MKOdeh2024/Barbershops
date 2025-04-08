import api from '../utils/api';

// Define the structure of a Barber object (especially the nested user info)
export interface Barber {
  barber_id: number | string;
  specialization: string;
  status: 'Active' | 'Inactive';
  user: { // Nested user details as returned by your API
    user_id: number | string;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
  };
  // Include availabilitySlots if they are returned directly with the barber
  // availabilitySlots?: AvailabilitySlot[];
}

// Define the structure of an Availability Slot object
export interface AvailabilitySlot {
    availability_id: number | string;
    barber_id: number | string;
    date: string; // YYYY-MM-DD
    available_from: string; // HH:MM:SS
    available_until: string; // HH:MM:SS
    is_available: boolean;
    reason?: string;
}

/**
 * Fetches all active barbers from the backend.
 */
export const getBarbers = async (): Promise<Barber[]> => {
  try {
    // Assuming the API returns only active barbers by default, or filter here/on backend
    const response = await api.get<Barber[]>('/barbers');
    return response.data;
  } catch (error) {
    console.error('Get Barbers API call failed:', error);
    throw error;
  }
};

/**
 * Fetches availability slots for a specific barber on a given date range.
 * @param barberId - The ID of the barber.
 * @param startDate - The start date in YYYY-MM-DD format.
 * @param endDate - The end date in YYYY-MM-DD format (optional, defaults to startDate).
 */
export const getBarberAvailability = async (barberId: number | string, startDate: string, endDate?: string): Promise<AvailabilitySlot[]> => {
    try {
        const params: { startDate: string; endDate?: string } = { startDate };
        if (endDate) {
            params.endDate = endDate;
        }
        const response = await api.get<AvailabilitySlot[]>(`/barbers/${barberId}/availability`, { params });
        // Filter for is_available true, although backend should ideally only return available ones
        return response.data.filter(slot => slot.is_available);
    } catch (error) {
        console.error(`Get Barber Availability API call failed for barber ${barberId}:`, error);
        throw error;
    }
};

// Add other barber-related API functions if needed (e.g., getBarberById)