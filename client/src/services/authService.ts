import api from '../utils/api'; // Import configured Axios instance

// Interfaces matching backend expected data and response structures
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegistrationData {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone_number?: string;
    role?: 'Client' | 'Co-Barber' | 'Admin'; // Optional role on registration?
}

// Define expected user structure after login/registration
export interface UserData {
    user_id: number | string; // Or number if your backend uses number IDs
    first_name: string;
    last_name: string;
    email: string;
    role: 'Client' | 'Co-Barber' | 'Admin';
    // Add other fields like phone_number, profile_picture if returned
}


// Define expected login response structure
interface LoginResponse extends UserData { // Extend UserData
    token: string;
}

// Define expected registration response structure (might just return user + token, or just success message)
interface RegisterResponse extends UserData {
    token: string; // Assuming register also returns token for auto-login
}

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
        const response = await api.post<LoginResponse>('/auth/login', credentials);
        return response.data;
    } catch (error) {
        console.error('Login API call failed:', error);
        throw error; // Re-throw to be handled by the component/context
    }
};

export const registerUser = async (data: RegistrationData): Promise<RegisterResponse> => {
     try {
        // Ensure role isn't sent unless intended and allowed by backend validation
        const payload: Partial<RegistrationData> = { ...data };
        // delete payload.role; // Example: Prevent sending role if it should default

        const response = await api.post<RegisterResponse>('/auth/register', payload);
        return response.data;
    } catch (error) {
        console.error('Register API call failed:', error);
        throw error;
    }
}

// Add functions for fetchUserProfile ('/auth/me'), logout (if backend endpoint exists), password reset etc.
export const fetchUserProfile = async (): Promise<UserData> => {
     try {
        const response = await api.get<UserData>('/auth/me'); // Assumes token is automatically added by interceptor/default header
        return response.data;
    } catch (error) {
        console.error('Fetch User Profile API call failed:', error);
        throw error;
    }
}