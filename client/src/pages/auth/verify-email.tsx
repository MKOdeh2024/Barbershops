// src/pages/auth/verify-email.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Button from '../../components/Button';
import Input from '@/components/ui/Input'; // Use reusable Input
import api from '@/utils/api'; // Import configured Axios instance

const VerifyEmailPage = () => {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState<string>(''); // Store email from query param
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get email from query parameter on mount
  useEffect(() => {
    if (router.isReady) {
      const emailFromQuery = router.query.email as string;
      if (emailFromQuery) {
        setEmail(emailFromQuery);
      } else {
        // Handle case where email is missing (e.g., redirect to register or show error)
        console.warn('Email parameter missing in URL for verification.');
        setError('Could not identify account to verify. Please register again.');
      }
    }
  }, [router.isReady, router.query]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !code || code.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      // Call the backend verification endpoint
      const response = await api.post('/auth/verify-code', { email, code });

      // Handle success
      setSuccessMessage(response.data.message || 'Account verified successfully!');
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/auth/login?verified=true'); // Add query param for success message on login page
      }, 2000); // 2-second delay

    } catch (err: any) {
      console.error("Verification failed:", err);
      setError(err.response?.data?.message || 'Verification failed. Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  // Optional: Add resend code functionality
  const handleResendCode = async () => {
      // TODO: Implement backend endpoint /api/auth/resend-code
      // This endpoint would find the user by email, generate a NEW code/expiry,
      // save it, and call sendConfirmationCodeEmail again.
      alert('Resend code functionality not yet implemented.');
  }

  return (
    <>
      <Head>
        <title>Verify Your Email - Barbershop Booking</title>
      </Head>
      {/* Outer container */}
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        {/* Verification Card */}
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-xl md:p-10">
          {/* Header */}
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent a 6-digit verification code to{' '}
              <strong className="font-medium text-gray-900">{email || 'your email address'}</strong>.
              Enter the code below to activate your account.
            </p>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Code Input */}
            <Input
              id="code"
              label="Verification Code"
              type="text" // Use text to allow leading zeros if needed, backend validates length/digits
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} // Allow only digits, max 6
              required
              maxLength={6}
              placeholder="Enter 6-digit code"
              error={error} // Display error message below input
              inputClassName="text-center tracking-[0.5em]" // Style for code input
              disabled={loading || !!successMessage} // Disable if loading or successful
            />

            {/* Success Message Display */}
            {successMessage && (
                <div className="rounded-md bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
            )}

            {/* Submit Button */}
            <div>
              <Button type="submit" variant="primary" fullWidth disabled={loading || !!successMessage || code.length !== 6}>
                {loading ? 'Verifying...' : 'Verify Account'}
              </Button>
            </div>
          </form>

          {/* Resend Code / Login Link */}
          <div className="mt-4 text-center text-sm text-gray-600">
            Didn't receive the code?{' '}
            <button type="button" onClick={handleResendCode} className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50" disabled={loading}>
                Resend Code
            </button>
             <span className="mx-1">|</span>
             <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyEmailPage;
