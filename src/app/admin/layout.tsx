'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { MenuIcon, XIcon } from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Warehouses', href: '/admin/warehouses' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Stock', href: '/admin/stock' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Invites', href: '/admin/invites' },
  { label: 'Users', href: '/admin/users' },
  // { label: 'Settings', href: '/admin/settings' }, // maybe later
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-[hsl(var(--header-background))] p-4 transition-transform duration-200 md:static md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-6 flex items-center justify-between md:hidden">
          <h2 className="text-xl font-bold text-[hsl(28_95%_53%)]">Inventra</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-foreground hover:text-accent-foreground"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-2">
          {menuItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-aside-hover',
                pathname === href
                  ? 'bg-aside-hover text-foreground'
                  : 'text-foreground hover:bg-aside-hover hover:text-foreground'
              )}
              onClick={() => setIsSidebarOpen(false)} // close sidebar on mobile
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Overlay on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border bg-[hsl(var(--header-background))] px-6 py-4 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-foreground hover:text-accent-foreground"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
