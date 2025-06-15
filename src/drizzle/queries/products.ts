import { db } from '@/drizzle/db';
import { ProductTable, ProductCategory, ProductCategoryTable } from '@/drizzle/schema';
import { or, eq, sql, desc, asc, inArray, like } from 'drizzle-orm';
import { AppError } from '@/lib/appError';
import { logger } from '@/lib/logger';
import { empty } from '@/lib/empty';

export const columnMap = {
  id: ProductTable.id,
  name: ProductTable.name,
  sku: ProductTable.sku,
  sn: ProductTable.sn,
  price: ProductTable.price,
  salePrice: ProductTable.salePrice,
  deliveryPrice: ProductTable.deliveryPrice,
  quantity: ProductTable.quantity,
  createdAt: ProductTable.createdAt,
  updatedAt: ProductTable.updatedAt,
  brandId: ProductTable.brandId,
} as const;

export const columns: Column[] = [
  { key: 'id', label: '#', sortable: true, searchable: false },
  { key: 'name', label: 'Name', sortable: true, searchable: true },
  { key: 'sku', label: 'SKU', sortable: true, searchable: true },
  { key: 'sn', label: 'SN', sortable: true, searchable: true },
  { key: 'categories', label: 'Categories', searchable: false },
  { key: 'price', label: 'Price', sortable: true, searchable: false },
  { key: 'deliveryPrice', label: 'Delivery Price', sortable: true, searchable: false },
  { key: 'quantity', label: 'Quantity', sortable: true, searchable: false },
  { key: 'createdAt', label: 'Created on', sortable: true, searchable: false },
  { key: 'actions', label: 'Actions', searchable: false },
];

export type Column = {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
};

type SortableProductColumn = keyof typeof columnMap;

export type paginatedProductsType = {
  categories: Record<number, string>;
  id: number;
  name: string;
  sku: string | null;
  sn: string | null;
  price: string;
  salePrice: string | null;
  deliveryPrice: string | null;
  quantity: number | null;
  brandId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

// Get all products with optional sorting and pagination
export async function getAllProducts(
  page: number = 1,
  pageSize: number = 10,
  sortKey: SortableProductColumn | null = null,
  sortDir: 'asc' | 'desc' = 'asc'
) {
  try {
    const offset = (page - 1) * pageSize;

    const query = db.select().from(ProductTable).limit(pageSize).offset(offset);

    if (sortKey) {
      const column = columnMap[sortKey];
      query.orderBy(sortDir === 'asc' ? asc(column) : desc(column));
    }

    const results = await query;
    return results;
  } catch (error) {
    logger.logError(error, 'Repository: getAllProducts');
    return new AppError('Failed to fetch products');
  }
}

// Get a product by ID
export async function getProductById(id: number) {
  try {
    return await db.select().from(ProductTable).where(eq(ProductTable.id, id)).limit(1);
  } catch (error) {
    logger.logError(error, 'Repository: getProductById');
    return new AppError(`Failed to fetch product with ID: ${id}`);
  }
}

// Create a new product
export async function createProduct(data: typeof ProductTable.$inferInsert) {
  try {
    const [result] = await db.insert(ProductTable).values(data).$returningId();
    return result.id;
  } catch (error) {
    logger.logError(error, 'Repository: createProduct');
    return new AppError('Failed to create product');
  }
}

// Update a product
export async function updateProduct(id: number, data: Partial<typeof ProductTable.$inferInsert>) {
  try {
    // Fetch the product first to ensure it exists
    const existingProduct = await db
      .select()
      .from(ProductTable)
      .where(eq(ProductTable.id, id))
      .limit(1);

    if (existingProduct.length === 0) {
      throw new Error(`No product found with ID: ${id}`);
    }

    // Perform the update operation
    await db.update(ProductTable).set(data).where(eq(ProductTable.id, id));

    // Retrieve the updated product
    const updatedProduct = await db
      .select()
      .from(ProductTable)
      .where(eq(ProductTable.id, id))
      .limit(1);

    if (empty(updatedProduct)) {
      throw new Error(`Failed to fetch updated product with ID: ${id}`);
    }

    // Check if the updated product matches the provided data
    const isUpdateSuccessful = Object.entries(data).every(
      ([key, value]) => updatedProduct[0][key as keyof (typeof updatedProduct)[0]] === value
    );

    if (!isUpdateSuccessful) {
      throw new Error(`Update failed for product with ID: ${id}`);
    }

    return updatedProduct[0]; // Return the updated product
  } catch (error: unknown) {
    logger.logError(error, 'Repository: updateProduct');
    return new AppError(
      error instanceof Error ? error.message : `Failed to update product with ID: ${id}`,
      'UPDATE_FAILED'
    );
  }
}

// Delete a product
export async function deleteProduct(id: number) {
  try {
    // Check if the product exists before attempting to delete
    const existingProduct = await db
      .select()
      .from(ProductTable)
      .where(eq(ProductTable.id, id))
      .limit(1);

    if (existingProduct.length === 0) {
      throw new Error(`No product found with ID: ${id}`);
    }

    // Perform the delete operation
    const result = await db.delete(ProductTable).where(eq(ProductTable.id, id));

    if (empty(result)) {
      throw new Error(`Failed to delete product with ID: ${id}`);
    }

    return true; // Product deleted successfully
  } catch (error: unknown) {
    logger.logError(error, 'Repository: deleteProduct');
    return new AppError(
      error instanceof Error ? error.message : `Failed to delete product with ID: ${id}`,
      'DELETE_FAILED'
    );
  }
}

export async function getPaginatedProducts(
  page: number = 1,
  pageSize: number = 10,
  sortKey?: string,
  sortDir: 'asc' | 'desc' = 'asc',
  search?: string
) {
  const validSortKey = (
    sortKey && sortKey in columnMap ? sortKey : null
  ) as SortableProductColumn | null;

  const productsOrError = await getAllProductsWithCategories(
    page,
    pageSize,
    validSortKey,
    sortDir,
    search
  );

  if (productsOrError instanceof AppError) {
    return productsOrError;
  }

  try {
    const baseCountQuery = db.select({ count: sql<number>`COUNT(*)` }).from(ProductTable);

    if (!empty(search)) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      // Get all searchable columns from the columns array and map to columnMap keys
      const searchableKeys = columns
        .filter((col) => col.searchable)
        .map((col) => col.key)
        .filter((key): key is SortableProductColumn => key in columnMap);

      baseCountQuery.where(
        or(...searchableKeys.map((key) => like(sql`LOWER(${columnMap[key]})`, loweredSearch)))
      );
    }

    const [{ count }] = await baseCountQuery;

    return {
      data: productsOrError,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  } catch (error: unknown) {
    logger.logError(error, 'Repository: getPaginatedProducts');
    return new AppError(`Failed to fetch paginated products: ${error}`, 'FETCH_FAILED');
  }
}

export async function getAllProductsWithCategories(
  page: number = 1,
  pageSize: number = 10,
  sortKey: SortableProductColumn | null = null,
  sortDir: 'asc' | 'desc' = 'asc',
  search?: string
) {
  try {
    const offset = (page - 1) * pageSize;
    const query = db.select().from(ProductTable).limit(pageSize).offset(offset);

    if (search) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      query.where(
        or(
          like(sql`LOWER(${ProductTable.name})`, loweredSearch),
          like(sql`LOWER(${ProductTable.sku})`, loweredSearch),
          like(sql`LOWER(${ProductTable.sn})`, loweredSearch)
        )
      );
    }

    if (sortKey) {
      const column = columnMap[sortKey];
      query.orderBy(sortDir === 'asc' ? asc(column) : desc(column));
    }

    const products = await query;
    const productIds = products.map((p) => p.id);

    let productCategories: {
      productId: number;
      categoryId: number;
      categoryName: string;
    }[] = [];

    if (productIds.length > 0) {
      productCategories = await db
        .select({
          productId: ProductCategory.productId,
          categoryId: ProductCategoryTable.id,
          categoryName: ProductCategoryTable.name,
        })
        .from(ProductCategory)
        .innerJoin(ProductCategoryTable, eq(ProductCategory.categoryId, ProductCategoryTable.id))
        .where(inArray(ProductCategory.productId, productIds));
    }

    const categoriesByProductId = productCategories.reduce(
      (acc, curr) => {
        if (!acc[curr.productId]) acc[curr.productId] = {};
        acc[curr.productId][curr.categoryId] = curr.categoryName;
        return acc;
      },
      {} as Record<number, Record<number, string>>
    );

    return products.map((product) => ({
      ...product,
      categories: categoriesByProductId[product.id] || {},
    }));
  } catch (error) {
    logger.logError(error, 'Repository: getAllProductsWithCategories');
    return new AppError('Failed to fetch products with categories');
  }
}
