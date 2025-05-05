import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="container p-4 w-[var(--content-max-width-xl)]">
      <h1 className="text-4xl mb-8">Admin</h1>
      <Button asChild>
        <Link href="/">Home</Link>
      </Button>
    </div>
  );
}
