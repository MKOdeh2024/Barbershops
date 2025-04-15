// src/components/barber/BarberCard.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Barber } from '@/services/barberService';
import Button from '../../components/Button';
import Card from '@/components/ui/Card'; // We can still use the Card component for base styles

interface BarberCardProps {
  barber: Barber;
  children?: React.ReactNode;
  // Optional className to pass down if needed
  className?: string;
}

const BarberCard: React.FC<BarberCardProps> = ({ barber, className = '' }) => {
  const barberName = `${barber.user?.first_name || ''} ${barber.user?.last_name || ''}`.trim();
  const profileLink = `/barbers/${barber.barber_id}`;

  return (
    // Add fixed width, inline-block display, and margin for spacing
    <div className={`inline-block align-top m-2 ${className}`}>
        <Card
            padding="none"
            // Apply specific dimensions here
            className="w-72 text-center hover:shadow-lg transition-shadow duration-200 flex flex-col h-full" // Added w-72, flex, h-full
        >
            <Link href={profileLink} className="block p-6 flex-grow"> {/* Make content area grow */}
                {/* Profile Picture */}
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 mx-auto mb-4 flex items-center justify-center text-gray-500 overflow-hidden border-2 border-white shadow-md">
                {barber.user?.profile_picture ? (
                    <Image
                        src={barber.user.profile_picture}
                        alt={barberName || 'Barber'}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        priority={false}
                    />
                ) : (
                    <span className="text-3xl font-medium text-indigo-700">
                    {barber.user?.first_name?.charAt(0).toUpperCase()}
                    {barber.user?.last_name?.charAt(0).toUpperCase()}
                    </span>
                )}
                </div>

                {/* Barber Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {barberName || 'Barber Profile'}
                </h3>

                {/* Specialization */}
                <p className="text-sm text-indigo-600 mb-4">
                {barber.specialization || 'Expert Grooming'}
                </p>
            </Link>

            {/* Action Button - Stays at the bottom due to flex layout */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 mt-auto"> {/* mt-auto pushes to bottom */}
                <Link href={`/book?barber=${barber.barber_id}`}>
                    <Button size="sm" variant="primary" fullWidth>
                        Book with {barber.user?.first_name || 'Me'}
                    </Button>
                </Link>
            </div>
        </Card>
    </div>
  );
};

export default BarberCard;