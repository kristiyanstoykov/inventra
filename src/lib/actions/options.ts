'use server';

import { updateOptionsBulk } from '@/db/drizzle/queries/options';
import { AppError } from '../appError';
import { optionsSchema } from '../schema/options';
import { saveLocalFile } from '../storage/local';

export async function uploadLogo(file: File): Promise<string> {
  const { url } = await saveLocalFile(file, 'img'); // returns /media/img/<file>
  return url;
}

export async function updateOptionsBulkAction(fd: FormData) {
  try {
    const raw = {
      companyName: String(fd.get('companyName') ?? ''),
      uic: String(fd.get('uic') ?? ''),
      vatNumber: String(fd.get('vatNumber') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      address: String(fd.get('address') ?? ''),
      city: String(fd.get('city') ?? ''),
      postalCode: String(fd.get('postalCode') ?? ''),
      country: String(fd.get('country') ?? ''),
      representative: String(fd.get('representative') ?? ''),
      notes: String(fd.get('notes') ?? ''),
      logo: String(fd.get('logo') ?? ''), // existing URL (can be empty)
    };

    const maybeFile = fd.get('logoObj');
    const logoObj = maybeFile instanceof File && maybeFile.size > 0 ? maybeFile : null;

    // Validate on server (logoObj optional)
    const parsed = optionsSchema.safeParse({ ...raw, logoObj });
    if (!parsed.success) {
      return new AppError('Validation failed', 'VALIDATION_FAILED');
    }

    // Upload if a new file is provided; else keep existing URL
    let finalLogoUrl = raw.logo;
    if (logoObj) {
      finalLogoUrl = await uploadLogo(logoObj);
    }

    console.log('data', { ...raw, finalLogoUrl });

    // Persist (DB key "logo" stores URL)
    return await updateOptionsBulk({
      companyName: parsed.data.companyName,
      uic: parsed.data.uic,
      vatNumber: parsed.data.vatNumber,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      city: parsed.data.city,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
      representative: parsed.data.representative,
      notes: parsed.data.notes ?? '',
      logo: finalLogoUrl,
    });
  } catch (err) {
    return new AppError(
      err instanceof Error ? err.message : 'Failed to update options',
      'UPDATE_FAILED'
    );
  }
}
