import React from 'react';
import { WifiOff } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Offline – Pocket Score',
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6 py-8 text-center text-gray-800">
      <WifiOff className="w-16 h-16 text-gray-400 mb-4" />
      <h1 className="text-2xl font-semibold mb-2">You&rsquo;re offline</h1>
      <p className="mb-6 max-w-xs">
        It looks like you don&rsquo;t have an internet connection right now.
        Please reconnect and then refresh, or return to a page you&rsquo;ve already
        visited.
      </p>
      <Link
        href="/"
        className="inline-block rounded-full bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Back to Home
      </Link>
    </main>
  );
} 