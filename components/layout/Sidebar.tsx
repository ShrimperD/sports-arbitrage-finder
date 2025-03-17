'use client';

import { Calculator, ChartBar, Search, Settings, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Calculator', icon: Calculator, href: '/calculator' },
  { name: 'Stats', icon: ChartBar, href: '/stats' },
  { name: 'Search', icon: Search, href: '/search' },
  { name: 'Live', icon: Zap, href: '/live' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-20 bg-background border-r">
      <nav className="h-full flex flex-col items-center py-4 gap-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "w-12 h-12 flex flex-col items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                pathname === item.href && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}