// src/pages/auth/LoginPage.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../src/pages/auth/login'; // Adjust path
import { AuthContext, AuthProvider } from '@/context/AuthContext'; // Import context
import { useRouter } from 'next/router'; // Import hook to mock

// --- Mock Next.js Router ---
// We only need the 'push' and 'replace' methods for this test
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
let mockRouterPush = jest.fn();
let mockRouterReplace = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
    push: mockRouterPush,
    replace: mockRouterReplace,
    query: {}, // Provide default query object
});

// --- Mock AuthContext ---
// We need to provide mock values for login, loading, token, etc.
let mockLogin = jest.fn();
const mockAuthProviderValue = {
    login: mockLogin,
    user: null,
    token: null,
    loading: false, // Start with loading false for initial render test
    logout: jest.fn(),
};

// Helper component to wrap LoginPage with necessary providers
const renderLoginPage = (authContextValue = mockAuthProviderValue) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      <LoginPage />
    </AuthContext.Provider>
  );
};


describe('LoginPage Component', () => {
    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
         // Reset mock return value for useRouter
         (useRouter as jest.Mock).mockReturnValue({
            push: mockRouterPush,
            replace: mockRouterReplace,
            query: {},
        });
    });

  test('renders login form elements correctly', () => {
    renderLoginPage();

    // Check for heading
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();

    // Check for input fields by placeholder (or label if visible)
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument(); // Use regex for exact match

    // Check for submit button
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    // Check for link to register page
    expect(screen.getByRole('link', { name: /sign up here/i })).toBeInTheDocument();
  });

  test('calls login function on form submit with correct credentials', async () => {
    // Make mockLogin resolve successfully
    mockLogin.mockResolvedValueOnce(undefined);
    renderLoginPage();

    // Simulate user input
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'password123' } });

    // Simulate form submission
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check if login function was called with the correct arguments
    // Use waitFor as login might be async
    await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // Check for redirection (push) after successful login
    await waitFor(() => {
       expect(mockRouterPush).toHaveBeenCalledTimes(1);
       expect(mockRouterPush).toHaveBeenCalledWith('/dashboard'); // Default redirect
    });
  });

  test('displays error message on failed login', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error log
  
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });
  
    renderLoginPage();
  
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
    const errorElement = await screen.findByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();
  
    consoleErrorSpy.mockRestore(); // Restore after test
  });
  

   test('shows loading state on button when submitting', async () => {
        // Make login take some time
        mockLogin.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 50)));
        renderLoginPage();

        fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        // Check if button text changes to loading state (or shows spinner)
        // Need to wait for state update
        expect(await screen.findByRole('button', { name: /processing.../i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /processing.../i })).toBeDisabled();

        // Wait for the login promise to resolve to avoid state update errors after test finishes
        await waitFor(() => expect(mockLogin).toHaveBeenCalled());
    });

});