import { db } from '@/drizzle/db';
import { ProductCategoryTable, ProductCategory } from '@/drizzle/schema';
import { eq, sql, desc, asc, inArray } from 'drizzle-orm';
import { AppError } from '@/lib/appError';
import { logger } from '@/lib/logger';
import { empty } from '@/lib/empty';
import { transliterateBgToLatin } from '@/lib/transliterate';

export const columnMap = {
  id: ProductCategoryTable.id,
  name: ProductCategoryTable.name,
  slug: ProductCategoryTable.slug,
  createdAt: ProductCategoryTable.createdAt,
  updatedAt: ProductCategoryTable.updatedAt,
} as const;

type SortableCategoryColumn = keyof typeof columnMap;

export type paginatedCategoriesType = {
  productCount: number;
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

// Get all categories (optionally sorted, no pagination)
export async function getAllCategories(
  sortKey: SortableCategoryColumn = 'createdAt',
  sortDir: 'asc' | 'desc' = 'asc'
) {
  try {
    const column = columnMap[sortKey];
    const categories = await db
      .select()
      .from(ProductCategoryTable)
      .orderBy(sortDir === 'asc' ? asc(column) : desc(column));
    return categories;
  } catch (error) {
    logger.logError(error, 'Repository: getAllCategories');
    return new AppError('Failed to fetch categories');
  }
}

// Get paginated categories, each with productCount
export async function getPaginatedCategories(
  page: number = 1,
  pageSize: number = 10,
  sortKey?: string,
  sortDir: 'asc' | 'desc' = 'asc',
  search?: string
) {
  const validSortKey = (
    sortKey && sortKey in columnMap ? sortKey : 'createdAt'
  ) as SortableCategoryColumn;

  try {
    const offset = (page - 1) * pageSize;
    const column = columnMap[validSortKey];

    // Build case-insensitive search filter for all columns
    let whereClause: ReturnType<typeof sql> | undefined = undefined;
    if (search && search.trim() !== '') {
      const like = (
        col:
          | typeof ProductCategoryTable.id
          | typeof ProductCategoryTable.name
          | typeof ProductCategoryTable.slug
      ) => sql`LOWER(${col}) LIKE ${'%' + search.toLowerCase() + '%'}`;
      whereClause = sql`
        (${like(ProductCategoryTable.id)} OR
         ${like(ProductCategoryTable.name)} OR
         ${like(ProductCategoryTable.slug)})
      `;
    }

    // Fetch paginated categories with search
    const categories = await db
      .select()
      .from(ProductCategoryTable)
      .where(whereClause ? whereClause : undefined)
      .orderBy(sortDir === 'asc' ? asc(column) : desc(column))
      .limit(pageSize)
      .offset(offset);

    // Fetch product counts for these categories
    const categoryIds = categories.map((c) => c.id);
    let counts: { categoryId: number; count: number }[] = [];
    if (categoryIds.length > 0) {
      counts = await db
        .select({
          categoryId: ProductCategory.categoryId,
          count: sql<number>`COUNT(*)`,
        })
        .from(ProductCategory)
        .where(inArray(ProductCategory.categoryId, categoryIds))
        .groupBy(ProductCategory.categoryId);
    }
    const countMap = Object.fromEntries(counts.map((c) => [c.categoryId, c.count]));

    // Fetch total count for pagination (with search)
    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(ProductCategoryTable)
      .where(whereClause ? whereClause : undefined);

    const total = totalCountResult[0]?.count ?? 0;

    return {
      data: categories.map((cat) => ({
        ...cat,
        productCount: countMap[cat.id] ?? 0,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.logError(error, 'Repository: getPaginatedCategories');
    const message = error instanceof Error ? error.message : 'Failed to fetch paginated categories';
    return new AppError(`Failed to fetch paginated categories: ${message}`, 'FETCH_FAILED');
  }
}

// Create a new category
export async function createCategory(name: string) {
  try {
    const slug = transliterateBgToLatin(name)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 255);

    const [result] = await db.insert(ProductCategoryTable).values({ name, slug }).$returningId();

    return result?.id ?? null;
  } catch (error) {
    logger.logError(error, 'Repository: createCategory');
    return new AppError('Failed to create category');
  }
}

// Delete a category
export async function deleteCategory(id: number) {
  try {
    const existing = await db
      .select()
      .from(ProductCategoryTable)
      .where(eq(ProductCategoryTable.id, id))
      .limit(1);

    if (empty(existing)) {
      throw new Error(`Category with ID ${id} not found`);
    }

    const result = await db.delete(ProductCategoryTable).where(eq(ProductCategoryTable.id, id));

    if (empty(result)) {
      throw new Error(`Failed to delete category with ID ${id}`);
    }

    return true;
  } catch (error: unknown) {
    logger.logError(error, 'Repository: deleteCategory');
    return new AppError(
      error instanceof Error ? error.message : 'Failed to delete category',
      'DELETE_FAILED'
    );
  }
}

// Get a category by ID
export async function getCategoryById(id: number) {
  try {
    const result = await db
      .select()
      .from(ProductCategoryTable)
      .where(eq(ProductCategoryTable.id, id))
      .limit(1);

    return result[0] ?? null;
  } catch (error) {
    logger.logError(error, 'Repository: getCategoryById');
    return new AppError(`Failed to fetch category with ID: ${id}`);
  }
}

// Update a category by ID
export async function updateCategoryById(id: number, name: string, slug: string) {
  try {
    const newSlug = transliterateBgToLatin(slug)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 255);

    const result = await db
      .update(ProductCategoryTable)
      .set({ name, slug: newSlug, updatedAt: new Date() })
      .where(eq(ProductCategoryTable.id, id));

    if (result.affectedRows === 0) {
      throw new Error(`Category with ID ${id} not found or not updated`);
    }

    return id;
  } catch (error) {
    logger.logError(error, 'Repository: updateCategoryById');
    return new AppError(
      error instanceof Error ? error.message : 'Failed to update category',
      'UPDATE_FAILED'
    );
  }
}
