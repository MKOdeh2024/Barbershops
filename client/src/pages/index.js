// src/pages/index.js
import Head from 'next/head';
import Layout from '@/components/Layout'; // Assuming a Layout component exists

export default function HomePage() {
  return (
    <Layout>
      <Head>
        <title>Barbershop Booking - Home</title>
        <meta name="description" content="Book your next haircut online!" />
        {/* Add PWA manifest link if applicable [cite: 1, 121] */}
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to Our Barbershop!</h1>
        {/* Add booking CTAs, barber lists, service highlights etc. */}
        <p className="text-center">Find available slots and book your appointment easily.</p>
        {/* Example: Link to booking page */}
        {/* <Link href="/bookings/new">Book Now</Link> */}
      </main>
    </Layout>
  );
}