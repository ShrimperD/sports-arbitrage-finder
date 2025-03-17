import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sports Betting Arbitrage Dashboard',
  description: 'Track and analyze sports betting arbitrage opportunities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Header />
        <Sidebar />
        <main className="min-h-screen pt-16 pl-20">
          <div className="max-w-[1600px] mx-auto p-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}