import React, { ReactNode, useContext } from 'react';
import Link from 'next/link';
import Button from '../components/Button'; // Assuming Button component exists
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import Card from './ui/Card';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, token } = useContext(AuthContext); // Get user and logout function

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 text-white shadow-md">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold hover:text-gray-300">
            BarberShops
          </Link>
          <div className="space-x-4 flex items-center">
            <Link href="/#services" className="hover:text-gray-300">Services</Link>
            {/* Add other nav links (Barbers, Contact, etc.) */}

            {token ? (
              <>
                <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
                <span className="text-gray-400">({user?.first_name || 'User'})</span>
                <Button onClick={logout} variant="secondary" size="sm">Logout</Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                    <Button variant="primary" size="sm">Login</Button>
                </Link>
                 <Link href="/auth/register">
                    <Button variant="secondary" size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-700 text-white mt-auto">
        <div className="container mx-auto px-4 py-6 text-center">
          <p>&copy; {new Date().getFullYear()} Barbershop Booking. All rights reserved.</p>
          {/* Add footer links if needed */}
        </div>
      </footer>
    </div>
  );
};

export default Layout;