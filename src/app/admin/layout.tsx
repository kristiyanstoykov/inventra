'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { MenuIcon, XIcon } from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Warehouses', href: '/admin/warehouses' },
  {
    label: 'Products',
    href: '/admin/products',
    subItems: [
      { label: 'All Products', href: '/admin/products' },
      { label: 'New Product', href: '/admin/products/new' },
      { label: 'Categories', href: '/admin/products/categories' },
    ],
  },
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
          {menuItems.map(({ label, href, subItems }) => {
            const isActive =
              (!subItems && pathname === href) ||
              (subItems && (pathname === href || pathname.startsWith(`${href}/`)));
            const showSubmenu = isActive;

            return (
              <div key={href} className="group relative">
                <Link
                  href={href}
                  className={cn(
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-aside-hover text-foreground font-bold'
                      : 'text-foreground hover:bg-aside-hover'
                  )}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {label}
                </Link>

                {subItems && (
                  <div
                    className={cn(
                      'ml-4 mt-1 space-y-1 transition-opacity',
                      'group-hover:block',
                      showSubmenu ? 'block' : 'hidden'
                    )}
                  >
                    {subItems.map(({ label: subLabel, href: subHref }) => {
                      const isSubActive = pathname === subHref;
                      return (
                        <Link
                          key={subHref}
                          href={subHref}
                          className={cn(
                            'block rounded-md px-3 py-1 text-sm',
                            isSubActive
                              ? 'font-bold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          {subLabel}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
