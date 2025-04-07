import { useContext, useEffect } from 'react';
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, loading, token } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user/token, redirect to login
    if (!loading && !token) {
      router.replace('/auth/login?redirect=/dashboard'); // Redirect back after login
    }
  }, [loading, token, router]);

  // Show loading state or null while checking auth/redirecting
  if (loading || !token) {
    return (
        <div className="flex justify-center items-center h-screen">
            <p>Loading...</p> {/* Replace with a spinner component */}
        </div>
    );
  }

  // Render dashboard content only if authenticated
  return (
    <>
      <Head>
        <title>Dashboard - Barbershop Booking</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome, {user?.first_name || 'User'}!</h1>

        {/* TODO: Implement Dashboard Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">My Upcoming Bookings</h2>
                {/* Fetch and display upcoming bookings */}
                <p>(Upcoming bookings list here)</p>
            </div>
             <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">My Profile</h2>
                {/* Display user profile details, link to edit */}
                 <p>Email: {user?.email}</p>
                 <p>Role: {user?.role}</p>
                 {/* Add link to edit profile page */}
            </div>
             {/* Add other dashboard sections (Past Bookings, Manage Notifications, etc.) */}
        </div>

      </div>
    </>
  );
}