import { db } from '@/drizzle/db';
import { AttributeTable } from '@/drizzle/schema';
import { eq, sql, desc, asc } from 'drizzle-orm';
import { AppError } from '@/lib/appError';
import { logger } from '@/lib/logger';
import { empty } from '@/lib/empty';

export const columnMap = {
  id: AttributeTable.id,
  name: AttributeTable.name,
  value: AttributeTable.value,
  unit: AttributeTable.unit,
} as const;

export const columns = [
  { key: 'id', label: '#', sortable: true, searchable: true },
  { key: 'name', label: 'Name', sortable: true, searchable: true },
  { key: 'value', label: 'Value', sortable: true, searchable: true },
  { key: 'unit', label: 'Unit', sortable: true, searchable: true },
  { key: 'actions', label: 'Actions', searchable: false },
];

export type paginatedAttributesType = {
  id: number;
  name: string;
  value: string | null;
  unit: string | null;
};

type SortableAttributeColumn = keyof typeof columnMap;

export async function getAllAttributes(
  sortKey: SortableAttributeColumn = 'id',
  sortDir: 'asc' | 'desc' = 'asc'
) {
  try {
    const column = columnMap[sortKey];
    const attributes = await db
      .select()
      .from(AttributeTable)
      .orderBy(sortDir === 'asc' ? asc(column) : desc(column));
    return attributes;
  } catch (error) {
    logger.logError(error, 'Repository: getAllAttributes');
    return new AppError('Failed to fetch attributes');
  }
}

export async function getPaginatedAttributes(
  page = 1,
  pageSize = 10,
  sortKey?: string,
  sortDir: 'asc' | 'desc' = 'asc',
  search?: string
) {
  const validSortKey = (
    sortKey && sortKey in columnMap ? sortKey : 'id'
  ) as SortableAttributeColumn;

  try {
    const offset = (page - 1) * pageSize;
    const column = columnMap[validSortKey];

    const searchableColumns = columns
      .filter((col) => col.searchable)
      .map((col) => col.key)
      .filter((key): key is 'id' | 'name' | 'value' | 'unit' =>
        ['id', 'name', 'value', 'unit'].includes(key)
      );

    let whereClause: ReturnType<typeof sql> | undefined = undefined;
    if (search && search.trim() !== '') {
      const like = (
        col:
          | typeof AttributeTable.id
          | typeof AttributeTable.name
          | typeof AttributeTable.value
          | typeof AttributeTable.unit
      ) => sql`LOWER(${col}) LIKE ${'%' + search.toLowerCase() + '%'}`;
      const orClauses = searchableColumns.map((key) => like(columnMap[key]));
      whereClause = sql`(${sql.join(orClauses, sql` OR `)})`;
    }

    const attributes = await db
      .select()
      .from(AttributeTable)
      .where(whereClause ?? undefined)
      .orderBy(sortDir === 'asc' ? asc(column) : desc(column))
      .limit(pageSize)
      .offset(offset);

    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(AttributeTable)
      .where(whereClause ?? undefined);

    const total = totalCountResult[0]?.count ?? 0;

    return {
      data: attributes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.logError(error, 'Repository: getPaginatedAttributes');
    const message = error instanceof Error ? error.message : 'Failed to fetch paginated attributes';
    return new AppError(`Failed to fetch paginated attributes: ${message}`, 'FETCH_FAILED');
  }
}

export async function createAttribute(name: string, value: string, unit?: string) {
  try {
    const [result] = await db.insert(AttributeTable).values({ name, value, unit }).$returningId();
    return result?.id ?? null;
  } catch (error) {
    logger.logError(error, 'Repository: createAttribute');
    return new AppError('Failed to create attribute');
  }
}

export async function deleteAttribute(id: number) {
  try {
    const existing = await db
      .select()
      .from(AttributeTable)
      .where(eq(AttributeTable.id, id))
      .limit(1);

    if (empty(existing)) {
      throw new Error(`Attribute with ID ${id} not found`);
    }

    const result = await db.delete(AttributeTable).where(eq(AttributeTable.id, id));

    if (empty(result)) {
      throw new Error(`Failed to delete attribute with ID ${id}`);
    }

    return true;
  } catch (error: unknown) {
    logger.logError(error, 'Repository: deleteAttribute');
    return new AppError(
      error instanceof Error ? error.message : 'Failed to delete attribute',
      'DELETE_FAILED'
    );
  }
}

export async function getAttributeById(id: number) {
  try {
    const result = await db.select().from(AttributeTable).where(eq(AttributeTable.id, id)).limit(1);

    return result[0] ?? null;
  } catch (error) {
    logger.logError(error, 'Repository: getAttributeById');
    return new AppError(`Failed to fetch attribute with ID: ${id}`);
  }
}

export async function updateAttributeById(id: number, name: string, value: string, unit?: string) {
  try {
    const result = await db
      .update(AttributeTable)
      .set({ name, value, unit })
      .where(eq(AttributeTable.id, id));

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (result.affectedRows === 0) {
      throw new Error(`Attribute with ID ${id} not found or not updated`);
    }

    return id;
  } catch (error) {
    logger.logError(error, 'Repository: updateAttributeById');
    return new AppError(
      error instanceof Error ? error.message : 'Failed to update attribute',
      'UPDATE_FAILED'
    );
  }
}
