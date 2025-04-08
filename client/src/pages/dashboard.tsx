// src/pages/dashboard.tsx
import { useContext, useEffect, useState } from 'react';
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import Link from 'next/link';
import Button from '../components/Button';
// Import API service functions when ready
// import { getMyUpcomingBookings } from '@/services/bookingService';

// Define a type for bookings (adjust based on your actual API response)
interface Booking {
    booking_id: number | string;
    booking_time: string; // Or Date object
    status: string;
    service: { name: string };
    barber: { user?: { first_name: string } }; // Nested optional chaining
}

export default function DashboardPage() {
  const { user, loading: authLoading, token } = useContext(AuthContext);
  const router = useRouter();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated after loading check
    if (!authLoading && !token) {
      router.replace('/auth/login?redirect=/dashboard');
    }
  }, [authLoading, token, router]);

  // Fetch upcoming bookings when authenticated
  useEffect(() => {
      if (token) { // Fetch only if token exists
          setIsLoadingBookings(true);
          setBookingError(null);
          // Replace with actual API call
          const fetchBookings = async () => {
                try {
                    // const data = await getMyUpcomingBookings(); // Your API function call
                    // setUpcomingBookings(data);

                    // --- Placeholder Data ---
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
                    setUpcomingBookings([
                         { booking_id: 101, booking_time: new Date(Date.now() + 86400000).toISOString(), status: 'Confirmed', service: { name: 'Classic Haircut' }, barber: { user: { first_name: 'John' } } },
                         { booking_id: 102, booking_time: new Date(Date.now() + 3 * 86400000).toISOString(), status: 'Confirmed', service: { name: 'Beard Trim' }, barber: { user: { first_name: 'Alex' } } },
                    ]);
                    // --- End Placeholder ---

                } catch (err: any) {
                    console.error("Failed to fetch bookings:", err);
                    setBookingError("Could not load your upcoming bookings.");
                } finally {
                    setIsLoadingBookings(false);
                }
          };
          fetchBookings();
      }
  }, [token]); // Re-fetch if token changes (e.g., after login)


  // Render loading state or nothing while checking auth/redirecting
  if (authLoading || !token) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            {/* Replace with a proper spinner component */}
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );
  }

  // Render dashboard content
  return (
    <>
      <Head>
        <title>Dashboard - Barbershop Booking</title>
      </Head>
      {/* Main dashboard container */}
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Welcome back, {user?.first_name || 'User'}!
            </h1>
            <p className="mt-1 text-md text-gray-600">Here's what's happening today.</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Upcoming Bookings Section (Span 2 columns on large screens) */}
          <section className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold leading-6 text-gray-900 mb-4">
                    Upcoming Appointments
                </h2>
                {isLoadingBookings && <p className="text-gray-500">Loading bookings...</p>}
                {bookingError && <p className="text-red-600">{bookingError}</p>}
                {!isLoadingBookings && !bookingError && (
                    upcomingBookings.length > 0 ? (
                        <ul role="list" className="divide-y divide-gray-200">
                            {upcomingBookings.map((booking) => (
                                <li key={booking.booking_id} className="flex py-4 justify-between items-center">
                                   <div>
                                     <p className="text-sm font-medium text-indigo-600">{booking.service.name}</p>
                                     <p className="text-sm text-gray-500">
                                        With {booking.barber?.user?.first_name || 'N/A'} on {' '}
                                        {new Date(booking.booking_time).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                        {' at '}
                                        {new Date(booking.booking_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                     </p>
                                     <p className="text-xs text-gray-400">Status: {booking.status}</p>
                                   </div>
                                   <div>
                                      <Link href={`/bookings/${booking.booking_id}`}> {/* Link to booking detail page */}
                                         <Button variant='secondary' size='sm'>Details</Button>
                                      </Link>
                                   </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-center text-gray-500 py-4">You have no upcoming appointments.</p>
                    )
                )}
                 <div className="mt-6 border-t border-gray-200 pt-4 text-center">
                     <Link href="/book"> {/* Link to booking page */}
                         <Button variant="primary">Book New Appointment</Button>
                     </Link>
                 </div>
              </div>
            </div>
          </section>

          {/* Profile Summary Section (Span 1 column) */}
          <section className="lg:col-span-1">
             <div className="overflow-hidden rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-semibold leading-6 text-gray-900 mb-4">
                    My Profile
                </h2>
                <div className="space-y-2 text-sm text-gray-700">
                    <p><span className="font-medium text-gray-900">Name:</span> {user?.first_name} {user?.last_name}</p>
                    <p><span className="font-medium text-gray-900">Email:</span> {user?.email}</p>
                    <p><span className="font-medium text-gray-900">Role:</span> {user?.role}</p>
                    {/* Add other profile details */}
                </div>
                <div className="mt-6 border-t border-gray-200 pt-4">
                     <Link href="/profile/edit"> {/* Link to edit profile page */}
                         <Button variant="secondary" fullWidth>Edit Profile</Button>
                     </Link>
                 </div>
            </div>

            {/* Optional: Quick Actions or Notifications Section */}
            {/* <div className="mt-6 overflow-hidden rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-semibold leading-6 text-gray-900 mb-4">
                    Notifications
                </h2>
                <p className="text-gray-500">(Notification list here)</p>
            </div> */}
          </section>

        </div>
      </div>
    </>
  );
}