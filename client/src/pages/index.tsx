import Head from 'next/head';
import React from 'react';
import Link from 'next/link'; // For navigation
import Button from '../components/Button'; // Example component
import SearchBar from '@/components/ui/SearchBar';
import BarberCard from '@/components/barber/BarberCard';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Welcome - Barbershop Booking</title>
        <meta name="description" content="Book your next appointment online." />
      </Head>
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Find & Book Your Barber</h1>
        <div>
        <SearchBar onSearch={function (searchTerm: string): void {
          throw new Error('Function not implemented.');
        } }></SearchBar>
        </div>
       
        <div>
        <BarberCard barber={{
          barber_id: 1,
          specialization: 'Haircut', // Add this property
          status: 'Active', // Add this property
          user: {
            first_name: 'John', last_name: 'Doe',
            user_id: '',
            profile_picture: null
          }
        }}>
          <h2 className="text-2xl font-semibold">Meet Our Barbers</h2>
          <p className="text-gray-500">Skilled professionals ready to serve you.</p>
        </BarberCard>

        <BarberCard barber={{barber_id : 2, specialization: 'Haircut', status: 'Active', user: {first_name: 'Mike', last_name: 'Smith', user_id: '', profile_picture: null}}}>
        </BarberCard>
        </div>
        

        <p className="text-lg text-gray-600 mb-8">
          Get the perfect cut at your convenience. Browse services, check availability, and book online.
        </p>
        <div className="space-x-4">
            <Link href="/#services"> {/* Link to services section or page */}
                <Button variant="primary">Our Services</Button>
            </Link>
             <Link href="/#book"> {/* Link to booking section or page */}
                <Button variant="secondary">Book Now</Button>
            </Link>
        </div>

        {/* Placeholder Sections */}
        <section id="services" className="mt-16">
            <h2 className="text-3xl font-semibold mb-6">Services We Offer</h2>
            {/* TODO: Fetch and display services (e.g., using a ServiceCard component) */}
            <p className="text-gray-500">(Service listing goes here)</p>
        </section>

         <section id="book" className="mt-16">
            <h2 className="text-3xl font-semibold mb-6">Ready for Your Next Cut?</h2>
             {/* TODO: Implement booking component/flow */}
            <p className="text-gray-500">(Booking interface goes here)</p>
        </section>
      </div>
    </>
  );
}