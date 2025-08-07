import { db } from '@/db/drizzle/db';
import { ProductBrandTable } from '@/db/drizzle/schema';
import { eq, sql, desc, asc } from 'drizzle-orm';
import { AppError } from '@/lib/appError';
import { logger } from '@/lib/logger';
import { empty } from '@/lib/empty';

export const columnMap = {
  id: ProductBrandTable.id,
  name: ProductBrandTable.name,
  value: ProductBrandTable.website,
  unit: ProductBrandTable.createdAt,
} as const;

export const columns = [
  { key: 'id', label: '#', sortable: true, searchable: true },
  { key: 'name', label: 'Name', sortable: true, searchable: true },
  { key: 'website', label: 'Website', sortable: true, searchable: true },
  { key: 'createdAt', label: 'Created At', sortable: true, searchable: true },
];

export type paginatedBrandsType = {
  id: number;
  name: string;
  website: string | null;
  createdAt: string | null;
};

type SortableBrandColumn = keyof typeof columnMap;

export async function getAllBrands(
  sortKey: SortableBrandColumn = 'id',
  sortDir: 'asc' | 'desc' = 'desc'
) {
  try {
    const column = columnMap[sortKey];
    const brands = await db
      .select()
      .from(ProductBrandTable)
      .orderBy(sortDir === 'asc' ? asc(column) : desc(column));
    return brands;
  } catch (error) {
    logger.logError(error, 'Repository: getAllBrands');
    return new AppError('Failed to fetch brands');
  }
}

export async function getAllBrandsForSelect(
  sortKey: SortableBrandColumn = 'id',
  sortDir: 'asc' | 'desc' = 'asc'
): Promise<{ id: number; name: string }[] | AppError> {
  try {
    const column = columnMap[sortKey];

    const brands = await db
      .select({
        id: ProductBrandTable.id,
        name: ProductBrandTable.name,
        website: ProductBrandTable.website,
        createdAt: ProductBrandTable.createdAt,
      })
      .from(ProductBrandTable)
      .orderBy(sortDir === 'asc' ? asc(column) : desc(column));

    // Map to only { id, name: "Name ValueUnit" }
    const formatted = brands.map((attr) => ({
      id: attr.id,
      name: `${attr.name}`,
    }));

    return formatted;
  } catch (error) {
    logger.logError(error, 'Repository: getAllBrandsForSelect');
    return new AppError('Failed to fetch brands');
  }
}

export async function getPaginatedBrands(
  page = 1,
  pageSize = 10,
  sortKey?: string,
  sortDir: 'asc' | 'desc' = 'asc',
  search?: string
) {
  const validSortKey = (
    sortKey && sortKey in columnMap ? sortKey : 'id'
  ) as SortableBrandColumn;

  try {
    const offset = (page - 1) * pageSize;
    const column = columnMap[validSortKey];

    const searchableColumns = columns
      .filter((col) => col.searchable)
      .map((col) => col.key)
      .filter((key): key is 'id' | 'name' | 'website' | 'createdAt' =>
        ['id', 'name', 'website', 'createdAt'].includes(key)
      );

    let whereClause: ReturnType<typeof sql> | undefined = undefined;
    if (search && search.trim() !== '') {
      const like = (
        col:
          | typeof ProductBrandTable.id
          | typeof ProductBrandTable.name
          | typeof ProductBrandTable.website
      ) => sql`LOWER(${col}) LIKE ${'%' + search.toLowerCase() + '%'}`;
      const orClauses = searchableColumns.map((key) => like(columnMap[key]));
      whereClause = sql`(${sql.join(orClauses, sql` OR `)})`;
    }

    const brands = await db
      .select()
      .from(ProductBrandTable)
      .where(whereClause ?? undefined)
      .orderBy(sortDir === 'asc' ? asc(column) : desc(column))
      .limit(pageSize)
      .offset(offset);

    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(ProductBrandTable)
      .where(whereClause ?? undefined);

    const total = totalCountResult[0]?.count ?? 0;

    return {
      data: brands,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.logError(error, 'Repository: getPaginatedBrands');
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch paginated brands';
    return new AppError(
      `Failed to fetch paginated brands: ${message}`,
      'FETCH_FAILED'
    );
  }
}

export async function createBrand(name: string, website: string) {
  try {
    const [result] = await db
      .insert(ProductBrandTable)
      .values({ name, website, createdAt: sql`CURRENT_TIMESTAMP()` })
      .$returningId();
    return result?.id ?? null;
  } catch (error) {
    logger.logError(error, 'Repository: createBrand');
    return new AppError('Failed to create brand');
  }
}

export async function deleteBrand(id: number) {
  try {
    const existing = await db
      .select()
      .from(ProductBrandTable)
      .where(eq(ProductBrandTable.id, id))
      .limit(1);

    if (empty(existing)) {
      throw new Error(`Brand with ID ${id} not found`);
    }

    const result = await db
      .delete(ProductBrandTable)
      .where(eq(ProductBrandTable.id, id));

    if (empty(result)) {
      throw new Error(`Failed to delete brand with ID ${id}`);
    }

    return true;
  } catch (error: unknown) {
    logger.logError(error, 'Repository: deleteBrand');
    return new AppError(
      error instanceof Error ? error.message : 'Failed to delete brand',
      'DELETE_FAILED'
    );
  }
}

export async function getBrandById(id: number) {
  try {
    const result = await db
      .select()
      .from(ProductBrandTable)
      .where(eq(ProductBrandTable.id, id))
      .limit(1);

    return result[0] ?? new AppError(`Brand with ID ${id} not found`, '404');
  } catch (error) {
    logger.logError(error, 'Repository: getBrandById');
    return new AppError(`Failed to fetch brand with ID: ${id}`);
  }
}

export async function updateBrandById(
  id: number,
  name: string,
  website: string,
  createdAt: Date
) {
  try {
    const result = await db
      .update(ProductBrandTable)
      .set({ name, website, createdAt })
      .where(eq(ProductBrandTable.id, id));

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (result.affectedRows === 0) {
      throw new Error(`Brand with ID ${id} not found or not updated`);
    }

    return id;
  } catch (error) {
    logger.logError(error, 'Repository: updateBrandById');
    return new AppError(
      error instanceof Error ? error.message : 'Failed to update brand',
      'UPDATE_FAILED'
    );
  }
}
