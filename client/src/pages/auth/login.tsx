// src/pages/auth/login.tsx
import React, { useState, FormEvent, useContext, useEffect } from 'react'; // Added useEffect
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from '@/components/Button';
import Input from '@/components/ui/Input'; // Use Input component
import { AuthContext } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // State for success message
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const router = useRouter();

  // Check for query params on mount
  useEffect(() => {
      if (router.isReady) {
          if (router.query.verified === 'true' || router.query.confirmed === 'true') { // Check for params from verification flow
              setSuccessMessage('Account verified successfully! Please log in.');
              // Optional: Remove the query param from URL without reloading
              const { verified, confirmed, ...restQuery } = router.query;
              router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
          }
          if (router.query.registered === 'true') {
              setSuccessMessage('Registration successful! Please check your email to verify your account.');
              const { registered, ...restQuery } = router.query;
              router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
          }
      }
  }, [router.isReady, router.query, router]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null); // Clear success message on new attempt
    setLoading(true);
    try {
      if (!login) throw new Error("Login function not available");
      await login(email, password);
      const redirectPath = router.query.redirect as string || '/dashboard';
      router.push(redirectPath);
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Barbershop Booking</title>
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-xl md:p-10">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Sign in to your account
            </h2>
          </div>

          {/* Success Message Display */}
          {successMessage && (
              <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4 rounded-md"> {/* Use Input component */}
              <Input
                id="email"
                label="Email Address"
                labelClassName="sr-only" // Hide label visually
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
              />
              <Input
                id="password"
                label="Password"
                labelClassName="sr-only"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            {/* Error Message Display */}
            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
            )}

            <div>
              <Button type="submit" variant="primary" fullWidth disabled={loading}>
                {loading ? 'Logging in...' : 'Sign in'}
              </Button>
            </div>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
