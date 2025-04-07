import '@/styles/globals.css';
import React from 'react'; // Import global styles
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext'; // Import Auth Provider
import Layout from '../components/Layout'; // Import Layout component

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider> {/* Wrap application with Auth Provider */}
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        {/* Add links for PWA manifest, icons etc. here if implementing PWA */}
        <title>Barbershop Booking</title> {/* Default Title */}
      </Head>
      <Layout> {/* Apply layout to all pages */}
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}