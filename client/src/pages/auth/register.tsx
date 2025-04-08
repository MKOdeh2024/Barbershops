// src/pages/auth/register.tsx
import { useState, FormEvent, useContext } from 'react';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from '../../components/Button';
import { registerUser } from '../../services/authService'; // Import API call function
import { AuthContext } from '../../context/AuthContext';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(''); // Optional
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext); // Use login after registration
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const registrationData = {
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password,
          phone_number: phone || undefined // Send undefined if empty
      };
      await registerUser(registrationData); // Await the registration call

      // Automatically try to log in the user after successful registration
      if (login) {
          try {
            await login(email, password); // Assumes login uses email/password
            router.push('/dashboard'); // Redirect after successful auto-login
          } catch (loginErr: any) {
             console.error("Auto-login after registration failed:", loginErr);
             // Redirect to login page with a success message if auto-login fails
             router.push('/auth/login?registered=true');
          }
      } else {
          // Fallback: redirect to login page if login context function isn't available
           router.push('/auth/login?registered=true');
      }

    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check your details and try again.');
    } finally {
        setLoading(false);
    }
  };

  return (
     <>
      <Head>
        <title>Sign Up - Barbershop Booking</title>
      </Head>
       {/* Outer container for centering */}
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        {/* Registration Card */}
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-xl md:p-10">
           {/* Header */}
          <div>
             {/* Optional: Add Logo here */}
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
             {/* Input Fields Container */}
             <div className="space-y-4 rounded-md shadow-sm">
                 {/* First Name */}
                 <div>
                    <label htmlFor="firstName" className="sr-only">First Name</label>
                    <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={firstName}
                        onChange={e=>setFirstName(e.target.value)}
                        className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        placeholder="First Name"
                    />
                 </div>
                 {/* Last Name */}
                 <div>
                    <label htmlFor="lastName" className="sr-only">Last Name</label>
                    <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        required value={lastName}
                        onChange={e=>setLastName(e.target.value)}
                        className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        placeholder="Last Name"
                    />
                 </div>
                {/* Email */}
                  <div>
                    <label htmlFor="email" className="sr-only">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required value={email}
                        onChange={e=>setEmail(e.target.value)}
                        className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        placeholder="Email address"
                    />
                 </div>
                 {/* Password */}
                  <div>
                    <label htmlFor="password" className="sr-only">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={e=>setPassword(e.target.value)}
                        className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        placeholder="Password (min. 8 characters)"
                        minLength={8} // Basic HTML validation
                    />
                 </div>
                 {/* Phone Number (Optional) */}
                 <div>
                    <label htmlFor="phone" className="sr-only">Phone Number (Optional)</label>
                    <input
                        id="phone"
                        name="phone"
                        type="tel" // Use 'tel' type for mobile keyboards
                        autoComplete="tel"
                        value={phone}
                        onChange={e=>setPhone(e.target.value)}
                        className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        placeholder="Phone Number (Optional)"
                    />
                 </div>
             </div>

            {/* Error Message Display */}
            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <div>
              <Button type="submit" variant="primary" fullWidth disabled={loading}>
                {loading ? (
                     <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                    </span>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </form>

           {/* Link to Login Page */}
           <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}