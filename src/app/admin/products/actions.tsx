'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function searchAction(formData: FormData) {
  const requestHeaders = await headers();
  const search = formData.get('search') as string;
  const rawParams = formData.get('searchParams') as string | null;
  const shouldClear = formData.get('clear') === '1';

  const params = new URLSearchParams(rawParams || '');

  if (shouldClear) {
    // Clear all search-related parameters
    params.delete('search');
    params.delete('page');
    params.delete('sortKey');
    params.delete('sortDir');
  } else {
    if (search?.trim()) {
      params.set('search', search.trim());
      params.delete('page'); // Reset pagination
    } else {
      params.delete('search');
    }
  }

  // Get the current path from the headers (set by middleware)
  const currentPath = requestHeaders.get('x-current-path') ?? '';
  const url = params.toString() ? `${currentPath}?${params.toString()}` : currentPath;

  redirect(url);
}
