import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from 'next';
import CompanySettingsForm from '@/components/settings/settings-form';
import { Suspense } from 'react';
import { getOptionsFormRecords } from '@/db/drizzle/queries/options';
import { AppError } from '@/lib/appError';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="container p-4 w-[var(--content-max-width-xl)]">
      <Suspense fallback={<LoadingSpinner className="absolute inset-0 m-auto loading-spinner" />}>
        <SuspendedPage />
      </Suspense>
    </div>
  );
}

async function SuspendedPage() {
  const options = await getOptionsFormRecords();

  if (options instanceof AppError) {
    return <div>Error loading settings</div>;
  }

  return (
    <div className="container p-4 w-[var(--content-max-width-xl)]">
      <Heading size="h2" as="h1" className="text-4xl mb-8">
        Settings
      </Heading>

      <Card>
        <CardContent className="flex-grow">
          {options instanceof AppError ? (
            <div>Error loading settings</div>
          ) : (
            <CompanySettingsForm options={options} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
