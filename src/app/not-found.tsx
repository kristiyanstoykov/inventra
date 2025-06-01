import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-primary">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="mb-6 text-muted-foreground">
          Sorry, the page you are looking for does not exist or you do not have admin access.
        </p>
        <Link href="/admin">
          <Button>Go to Admin Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
