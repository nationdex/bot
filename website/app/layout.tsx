// Root layout for the application
import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';

// Metadata for the application
export const metadata: Metadata = {
  title: 'Nationdex Admin Panel',
  icons: {
    icon: '/assets/nationdexlogo.png',
  },
  description: 'Admin panel for Nationdex bot management',
};

// Inter font for the application
const inter = Inter({ subsets: ['latin'], display: 'swap' });

// Root layout component
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
