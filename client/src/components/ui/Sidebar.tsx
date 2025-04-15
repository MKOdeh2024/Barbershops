// src/components/ui/Sidebar.tsx
import React, { ReactNode } from 'react';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void; // Function to close the sidebar (especially on mobile)
  children?: ReactNode; // Allow custom content or navigation links
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, children }) => {
  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 z-30 bg-gray-900 bg-opacity-50 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
          {/* Header / Logo Area */}
          <div className="mb-6 flex items-center justify-between">
             <Link href="/" className="text-2xl font-semibold text-white">
                BarberApp
             </Link>
             {/* Close button for mobile */}
             <button
                onClick={onClose}
                className="text-gray-400 hover:text-white lg:hidden"
                aria-label="Close sidebar"
             >
                 <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
             </button>
          </div>

          {/* Navigation Links or Custom Content */}
          {children ? (
            children
          ) : (
            // Default Placeholder Navigation
            <nav className="space-y-2">
              <Link href="/dashboard" className="flex items-center rounded-lg p-2 text-base font-normal text-gray-300 hover:bg-gray-700 hover:text-white">
                {/* Add Icon Here */}
                <span className="ml-3">Dashboard</span>
              </Link>
              <Link href="/bookings" className="flex items-center rounded-lg p-2 text-base font-normal text-gray-300 hover:bg-gray-700 hover:text-white">
                {/* Add Icon Here */}
                <span className="ml-3">Bookings</span>
              </Link>
              <Link href="/profile" className="flex items-center rounded-lg p-2 text-base font-normal text-gray-300 hover:bg-gray-700 hover:text-white">
                {/* Add Icon Here */}
                <span className="ml-3">Profile</span>
              </Link>
              {/* Add more links (e.g., Admin links based on user role) */}
            </nav>
          )}

          {/* Optional: Footer section in sidebar */}
          {/* <div className="mt-auto pt-4 border-t border-gray-700"> ... </div> */}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;