// src/db/queries/options.ts
import { db } from '@/db/drizzle/db';
import { OptionsTable } from '@/db/drizzle/schema';
import { sql, eq, inArray } from 'drizzle-orm';
import { AppError } from '@/lib/appError';
import { logger } from '@/lib/logger';
import { empty } from '@/lib/empty';

/**
 * Normalize name/value just a bit: trim; keep original case for `name` (unique)
 * `value` is always stored as string per your requirement (logo URL too).
 */
const normalize = (name: string, value: unknown) => ({
  name: name.trim(),
  value: value == null ? '' : String(value),
});

export const FORM_OPTION_NAMES = [
  'companyName',
  'uic',
  'vatNumber',
  'email',
  'phone',
  'address',
  'city',
  'postalCode',
  'country',
  'representative',
  'notes',
  'logo', // Logo is stored as a url string
] as const;

type FormOptionName = (typeof FORM_OPTION_NAMES)[number];

export type FormOptionsRecord = Record<FormOptionName, string>;

/**
 * Returns a Record<FormOptionName, string> for the form.
 * Missing DB rows come back as empty strings.
 */
export async function getOptionsFormRecords(): Promise<FormOptionsRecord | AppError> {
  try {
    const rows = await db
      .select({ name: OptionsTable.name, value: OptionsTable.value })
      .from(OptionsTable)
      .where(inArray(OptionsTable.name, [...FORM_OPTION_NAMES]));

    // Seed defaults to empty strings
    const out: FormOptionsRecord = Object.fromEntries(
      FORM_OPTION_NAMES.map((k) => [k, ''])
    ) as FormOptionsRecord;

    for (const r of rows) {
      // value is longtext | null in schema → coerce to string
      out[r.name as FormOptionName] = r.value ?? '';
    }

    return out;
  } catch (error) {
    logger.logError(error, 'Repository: getOptionsFormRecords');
    const message = error instanceof Error ? error.message : 'Failed to fetch options for form';
    return new AppError(message, 'FETCH_FAILED');
  }
}

/**
 * Bulk upsert options in a single INSERT ... ON DUPLICATE KEY UPDATE.
 * Accepts either a Record<name, value> or an array of { name, value }.
 * Returns true on success, or AppError on failure.
 *
 * Notes:
 * - Uses VALUES() to apply the per-row incoming value during UPDATE.
 * - MySQL affectedRows semantics for bulk upserts:
 *   inserted → +1 each, updated (changed) → +2 each, matched (no change) → +0.
 *   We purposefully return just `true` since you can’t infer counts reliably from affectedRows.
 */
export async function updateOptionsBulk(
  data: Record<string, unknown> | Array<{ name: string; value: unknown }>
) {
  try {
    const rows = Array.isArray(data)
      ? data.map((d) => normalize(d.name, d.value))
      : Object.entries(data).map(([k, v]) => normalize(k, v));

    if (rows.length === 0) return true;

    await db
      .insert(OptionsTable)
      .values(rows)
      .onDuplicateKeyUpdate({
        // For each conflicted row, set value to the incoming row's value
        set: { value: sql`VALUES(${OptionsTable.value})` },
      });

    return true;
  } catch (error) {
    logger.logError(error, 'Repository: updateOptionsBulk');
    const message = error instanceof Error ? error.message : 'Failed to upsert options';
    return new AppError(message, 'BULK_UPDATE_FAILED');
  }
}

/**
 * Create a new option.
 * If it already exists, returns AppError with your message.
 * On success returns inserted option id (number) or null if driver doesn’t return it.
 */
export async function createOption(
  name: string,
  value: unknown,
  onExistsMessage: string = 'Option already exists'
) {
  const { name: n, value: v } = normalize(name, value);

  try {
    // Check existence first (you asked to error if exists)
    const existing = await db
      .select({ id: OptionsTable.id })
      .from(OptionsTable)
      .where(eq(OptionsTable.name, n))
      .limit(1);

    if (!empty(existing)) {
      return new AppError(onExistsMessage, 'ALREADY_EXISTS');
    }

    const [result] = await db.insert(OptionsTable).values({ name: n, value: v }).$returningId();
    return result?.id ?? null;
  } catch (error) {
    logger.logError(error, 'Repository: createOption');
    const message = error instanceof Error ? error.message : 'Failed to create option';
    return new AppError(message, 'CREATE_FAILED');
  }
}

/**
 * Get options by names.
 * - If `names` is a string → returns an array with 1 item (if found).
 * - If `names` is an array → returns array of matches (any order).
 * - If `names` is omitted/empty → returns ALL options.
 * Always returns `Array<{ name: string; value: string }>` or AppError.
 */
export async function getOptions(
  names?: string | string[]
): Promise<{ name: string; value: string | null }[] | AppError> {
  try {
    // Normalize input
    let list: string[] | undefined;
    if (typeof names === 'string') list = [names.trim()];
    else if (Array.isArray(names)) list = names.map((n) => n.trim()).filter(Boolean);

    let rows: { name: string; value: string | null }[] | { name: string; value: string | null }[] =
      [];

    if (!list || list.length === 0) {
      // All options
      rows = await db
        .select({ name: OptionsTable.name, value: OptionsTable.value })
        .from(OptionsTable);
    } else if (list.length === 1) {
      // Single name → still return array with 0 or 1 row
      rows = await db
        .select({ name: OptionsTable.name, value: OptionsTable.value })
        .from(OptionsTable)
        .where(eq(OptionsTable.name, list[0]));
    } else {
      // Multiple names
      rows = await db
        .select({ name: OptionsTable.name, value: OptionsTable.value })
        .from(OptionsTable)
        .where(inArray(OptionsTable.name, list));
    }

    return rows;
  } catch (error) {
    logger.logError(error, 'Repository: getOptions');
    const message = error instanceof Error ? error.message : 'Failed to fetch options';
    return new AppError(message, 'FETCH_FAILED');
  }
}
