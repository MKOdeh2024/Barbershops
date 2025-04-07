import axios from 'axios';

// Determine the base URL based on environment
// Use NEXT_PUBLIC_ prefix for environment variables accessible on the client-side
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Default to backend dev URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add interceptors for handling token refresh or global error handling
api.interceptors.request.use(
  (config) => {
    // Add auth token to headers if it exists (alternative to setting default header in context)
    // const token = localStorage.getItem('authToken');
    // if (token && config.headers) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Handle common errors globally if needed (e.g., 401 Unauthorized for logout)
    if (error.response?.status === 401) {
      console.log('Unauthorized access - 401 interceptor');
      // Could trigger logout action from AuthContext here, but might be complex
      // localStorage.removeItem('authToken');
      // localStorage.removeItem('authUser');
      // Consider redirecting to login
      // if (typeof window !== 'undefined') { // Ensure running on client-side
      //    window.location.href = '/auth/login';
      // }
    }
    // Important: Re-reject the error so it can be caught by the calling function/component
    return Promise.reject(error);
  }
);


export default api;