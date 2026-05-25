import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Nationdex Admin Panel',
  icons: {
    icon: '/assets/nationdexlogo.png',
  },
  description: 'Admin panel for Nationdex bot management',
};

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
