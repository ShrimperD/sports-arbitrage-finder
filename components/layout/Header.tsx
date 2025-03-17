'use client';

import { Bell, Search, User } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b z-50 px-4">
      <div className="h-full flex items-center justify-between max-w-[1600px] mx-auto">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold">ArbitrageX</h1>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/sports" className="text-foreground/80 hover:text-foreground">Sports Betting</Link>
            <Link href="/fantasy" className="text-foreground/80 hover:text-foreground">Fantasy</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search events..."
              className="w-[300px] pl-9 pr-4 py-2 rounded-md bg-muted/50 border focus:outline-none focus:ring-2"
            />
          </div>
          <button className="p-2 hover:bg-muted rounded-full">
            <Bell className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded-full">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}