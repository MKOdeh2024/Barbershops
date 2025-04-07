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
      const data = await registerUser(registrationData);
      // Automatically log in the user after successful registration
      if (login && data.token) {
          // Need email/password to log in via context, or adjust context to accept token directly
          await login(email, password); // Assumes login uses email/password
          router.push('/dashboard'); // Redirect after login
      } else {
          // Or redirect to login page if auto-login isn't implemented/desired
           router.push('/auth/login?registered=true');
      }

    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  return (
     <>
      <Head>
        <title>Sign Up - Barbershop Booking</title>
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
             {/* Input fields for first_name, last_name, email, password, phone_number */}
             {/* Similar structure to login form inputs */}
             <div>
                <label htmlFor="firstName">First Name</label>
                <input id="firstName" type="text" required value={firstName} onChange={e=>setFirstName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
             </div>
             <div>
                <label htmlFor="lastName">Last Name</label>
                <input id="lastName" type="text" required value={lastName} onChange={e=>setLastName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
             </div>
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
             </div>
              <div>
                <label htmlFor="password">Password (min 8 chars)</label>
                <input id="password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
             </div>
             <div>
                <label htmlFor="phone">Phone (Optional)</label>
                <input id="phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
             </div>

             {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Button type="submit" variant="primary" fullWidth disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </div>
          </form>
           <p className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}