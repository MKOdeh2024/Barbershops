// src/pages/auth/register.tsx
import { useState, FormEvent } from 'react'; // Removed useContext, login
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from '@/components/Button';
import Input from '@/components/ui/Input';
import { registerUser } from '@/services/authService';
// Removed AuthContext import as we don't auto-login now

type UserRole = 'Client' | 'Co-Barber' | 'Admin';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Client');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Removed login from useContext
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const registrationData = {
          first_name: firstName, last_name: lastName,
          email: email, password: password,
          phone_number: phone || undefined,
          role: role,
      };
      // Call registration API
      const response = await registerUser(registrationData);

      // --- Redirect to verification page on success ---
      // Pass the email used for registration as a query parameter
      if (response.email) {
           router.push(`/auth/verify-email?email=${encodeURIComponent(response.email)}`);
      } else {
          // Fallback if email isn't returned (shouldn't happen with current backend)
          setError("Registration successful, but couldn't redirect to verification. Please check your email.");
      }
      // --- End Redirect Logic ---

    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check your details and try again.');
    } finally {
        setLoading(false);
    }
  };

  // --- Rest of the component (JSX) remains the same as before ---
  // Make sure the JSX includes the Role Selector dropdown
  return (
     <>
      <Head>
        <title>Sign Up - Barbershop Booking</title>
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-xl md:p-10">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
             <div className="space-y-4 rounded-md">
                 <Input id="firstName" label="First Name" type="text" autoComplete="given-name" required value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Enter first name" />
                 <Input id="lastName" label="Last Name" type="text" autoComplete="family-name" required value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Enter last name" />
                 <Input id="email" label="Email Address" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
                 <Input id="password" label="Password" type="password" autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Choose a password (min. 8 characters)" minLength={8} />
                 <Input id="phone" label="Phone Number (Optional)" type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Enter phone number" />
                 <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Registering as a</label>
                    <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} required className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white">
                        <option value="Client">Client</option>
                        <option value="Co-Barber">Co-Barber</option>
                        <option value="Admin">Admin (Barber)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Note: Role selection might require admin approval.</p>
                 </div>
             </div>
            {error && <div className="rounded-md bg-red-50 p-4"><p className="text-sm font-medium text-red-800">{error}</p></div>}
            <div>
              <Button type="submit" variant="primary" fullWidth disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>
           <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '} <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in here</Link>
          </p>
        </div>
      </div>
    </>
  );
}
