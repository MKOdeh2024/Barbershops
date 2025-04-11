// src/components/Layout.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Layout from '../src/components/Layout'; // Adjust path
import { AuthContext, AuthProvider } from '../src/context/AuthContext'; // Import context
import { UserData } from '../src/services/authService'; // Import UserData type
import AuthContextType from '../src/context/AuthContext';
import { fireEvent } from '@testing-library/react';

// Mock Next.js Link component (optional, but good practice)
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode, href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

// Helper to render Layout with specific AuthContext value
const renderLayoutWithAuth = (authValue: Partial<AuthContextType>) => {
    return render(
        <AuthContext.Provider value={authValue}>
            <Layout>
                <div>Page Content</div> {/* Add dummy children */}
            </Layout>
        </AuthContext.Provider>
    );
};


describe('Layout Component (Header)', () => {

    test('renders login and sign up buttons when logged out', () => {
        const loggedOutState = {
            user: null,
            token: null,
            loading: false,
            logout: jest.fn(),
            login: jest.fn(),
        };
        renderLayoutWithAuth(loggedOutState);

        // Check for Login button/link
        expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
        // Check for Sign Up button/link
        expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();

        // Check that Dashboard/Logout are NOT present
        expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    });


    test('renders dashboard link and logout button when logged in', () => {
        const loggedInUser: UserData = { user_id: 1, first_name: 'Test', last_name: 'User', email: 'test@test.com', role: 'Client' };
        const loggedInState = {
            user: loggedInUser,
            token: 'fake-token-123',
            loading: false,
            logout: jest.fn(),
            login: jest.fn(),
        };
        renderLayoutWithAuth(loggedInState);

        // Check that Dashboard link is present
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
        // Check that Logout button is present
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
        // Check that user name is displayed (approximately)
        expect(screen.getByText(`(${loggedInUser.first_name})`)).toBeInTheDocument();


        // Check that Login/Sign Up are NOT present
        expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();
    });

     test('calls logout function when logout button is clicked', () => {
        const mockLogout = jest.fn();
        const loggedInUser: UserData = { user_id: 1, first_name: 'Test', last_name: 'User', email: 'test@test.com', role: 'Client' };
        const loggedInState = {
            user: loggedInUser,
            token: 'fake-token-123',
            loading: false,
            logout: mockLogout, // Use the mock function
            login: jest.fn(),
        };
        renderLayoutWithAuth(loggedInState);

        const logoutButton = screen.getByRole('button', { name: /logout/i });
        fireEvent.click(logoutButton);

        expect(mockLogout).toHaveBeenCalledTimes(1);
    });


});