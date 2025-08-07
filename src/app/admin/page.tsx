import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function AdminPage() {
  return (
    <div className="container p-4 w-[var(--content-max-width-xl)]">
      <Heading size={'h2'} as={'h1'} className="text-4xl mb-8">
        Dashboard
      </Heading>
      <Button className="mb-4">
        <Link href="/">Go back to Home</Link>
      </Button>
    </div>
  );
}
