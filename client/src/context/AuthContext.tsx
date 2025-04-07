import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../utils/api'; // Your configured Axios instance
import { loginUser, LoginCredentials, UserData, registerUser, RegistrationData } from '../services/authService'; // API service functions

export default interface AuthContextType {
  user: UserData | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  // register: (userData: RegistrationData) => Promise<void>; // Optional: Handle register+login here
  logout: () => void;
  // Add other auth-related states or functions if needed (e.g., error state)
}

// Create the context with default undefined values initially
export const AuthContext = createContext<Partial<AuthContextType>>({}); // Use Partial initially

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Start loading on initial mount

  // Function to load token/user from storage on initial load
  const loadUserFromStorage = useCallback(() => {
    setLoading(true);
    try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            // Set Axios default header
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
    } catch (error) {
        console.error("Failed to load user from storage", error);
        // Clear potentially corrupted storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    } finally {
       setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); // Indicate loading state during login attempt
    try {
        const data = await loginUser({ email, password });
        if (data && data.token && data.user_id) { // Check for token and user data
            const userData = { // Construct UserData object
                 user_id: data.user_id,
                 first_name: data.first_name,
                 last_name: data.last_name, // Assuming last_name is returned
                 email: data.email,
                 role: data.role,
                 // Add other relevant fields returned by your login endpoint
            };
            setToken(data.token);
            setUser(userData);
            // Store in local storage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('authUser', JSON.stringify(userData));
            // Set Axios default header
            api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        } else {
             throw new Error("Login response missing token or user data.");
        }
    } catch (error) {
      console.error("Login error in AuthContext:", error);
      // Clear any potentially stale auth state on error
      setToken(null);
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      delete api.defaults.headers.common['Authorization'];
      throw error; // Re-throw error to be caught by the component
    } finally {
        setLoading(false); // Finish loading after attempt
    }
  }, []);


  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    delete api.defaults.headers.common['Authorization'];
    // Optional: Redirect to login page or homepage
    // window.location.href = '/auth/login'; // Simple redirect, Next Router preferred
  }, []);


  // Provide the context value
  const contextValue: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};