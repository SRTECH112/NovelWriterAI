'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Home, BookOpen, FileText, List } from 'lucide-react';

export function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'New Book', path: '/new-book', icon: BookOpen },
  ];

  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-4 py-2 flex items-center gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => router.push(item.path)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
