'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const menuItems = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Clients', href: '/admin/clients' },
  { label: 'Warehouses', href: '/admin/warehouses' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-[hsl(var(--header-background))] p-4">
        <nav className="space-y-2">
          {menuItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-muted text-foreground'
                  : 'text-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* <header className="flex items-center justify-between border-b border-border bg-[hsl(var(--header-background))] px-6 py-4">
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </header> */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
