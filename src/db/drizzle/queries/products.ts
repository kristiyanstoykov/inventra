import { db } from '@/db/drizzle/db';
import {
  ProductTable,
  ProductCategory,
  ProductCategoryTable,
  ProductAttributeTable,
  AttributeTable,
} from '@/db/drizzle/schema';
import { or, eq, and, sql, desc, asc, inArray, like } from 'drizzle-orm';
import { AppError } from '@/lib/appError';
// import { logger } from '@/lib/logger';
import { empty } from '@/lib/empty';
import { ProductSchema } from '@/lib/schema/products';
import z from 'zod';
import { normalizeNumber } from '@/lib/utils';
import { logger } from '@/lib/logger';

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
  {
    key: 'deliveryPrice',
    label: 'Delivery Price',
    sortable: true,
    searchable: false,
  },
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
    // logger.logError(error, 'Repository: getAllProducts');
    return new AppError('Failed to fetch products');
  }
}

// Get a product by ID, including related category and attribute IDs
export async function getProductById(id: number) {
  try {
    // Fetch the product
    const result = await db.select().from(ProductTable).where(eq(ProductTable.id, id)).limit(1);

    if (empty(result)) {
      throw new AppError(`No product found with ID: ${id}`, 'NOT_FOUND');
    }

    const product = result[0];

    // Fetch related category IDs
    const categoryRows = await db
      .select({ categoryId: ProductCategory.categoryId })
      .from(ProductCategory)
      .where(eq(ProductCategory.productId, id));

    const categoryIds = categoryRows.map((row) => row.categoryId);

    // Fetch related attribute IDs
    const attributeRows = await db
      .select({ attributeId: ProductAttributeTable.attributeId })
      .from(ProductAttributeTable)
      .where(eq(ProductAttributeTable.productId, id));

    const attributeIds = attributeRows.map((row) => row.attributeId);

    return {
      ...product,
      categoryIds,
      attributeIds,
    };
  } catch (error) {
    // logger.logError(error, 'Repository: getProductById');
    return new AppError(
      error instanceof Error
        ? error.message
        : error instanceof AppError
        ? error.toString()
        : `Failed to fetch product with ID: ${id}`
    );
  }
}

export async function getProductsByIds(ids: number[]) {
  try {
    if (!ids?.length) {
      throw new AppError('No product IDs provided', 'BAD_REQUEST');
    }

    const [products, categoryRows, attributeRows] = await Promise.all([
      db.select().from(ProductTable).where(inArray(ProductTable.id, ids)),
      db
        .select({
          productId: ProductCategory.productId,
          categoryId: ProductCategory.categoryId,
        })
        .from(ProductCategory)
        .where(inArray(ProductCategory.productId, ids)),
      db
        .select({
          productId: ProductAttributeTable.productId,
          attributeId: ProductAttributeTable.attributeId,
        })
        .from(ProductAttributeTable)
        .where(inArray(ProductAttributeTable.productId, ids)),
    ]);

    if (empty(products)) {
      throw new AppError(`No products found for IDs: ${ids.join(', ')}`, 'NOT_FOUND');
    }

    // Build maps: productId -> [categoryIds] / [attributeIds]
    const catMap = new Map<number, number[]>();
    for (const { productId, categoryId } of categoryRows) {
      const arr = catMap.get(productId);
      if (arr) {
        if (!arr.includes(categoryId)) arr.push(categoryId);
      } else {
        catMap.set(productId, [categoryId]);
      }
    }

    const attrMap = new Map<number, number[]>();
    for (const { productId, attributeId } of attributeRows) {
      const arr = attrMap.get(productId);
      if (arr) {
        if (!arr.includes(attributeId)) arr.push(attributeId);
      } else {
        attrMap.set(productId, [attributeId]);
      }
    }

    // Return in the same order as the input `ids` (skip IDs that weren't found)
    const byId = new Map(products.map((p) => [p.id, p]));
    const result = ids
      .map((id) => {
        const p = byId.get(id);
        if (!p) return null;
        return {
          ...p,
          categoryIds: catMap.get(id) ?? [],
          attributeIds: attrMap.get(id) ?? [],
        };
      })
      .filter(Boolean);

    return result;
  } catch (error) {
    return new AppError(
      error instanceof Error
        ? error.message
        : error instanceof AppError
        ? error.toString()
        : 'Failed to fetch products by IDs'
    );
  }
}

// Create a new product
export async function createProduct(data: z.infer<typeof ProductSchema>) {
  try {
    const attribute_ids = data.attributeIds || [];
    const category_ids = data.categoryIds || [];

    const product_data = {
      name: data.name,
      sku: data.sku || null,
      sn: data.sn || null,
      price: data.price.toString(),
      salePrice: data.salePrice ? data.salePrice.toString() : null,
      deliveryPrice: data.deliveryPrice.toString(),
      quantity: data.quantity.toString(),
      warranty: data.warranty,
      brandId: typeof data.brandId === 'number' && data.brandId > 0 ? data.brandId : null,
    };

    if (!empty( product_data.sku )) {
      const existingSku = await db
        .select()
        .from(ProductTable)
        .where(eq(ProductTable.sku, product_data.sku))
        .limit(1);

      if (!empty(existingSku)) {
        throw new AppError(`A product with SKU: ${product_data.sku} already exists`, 'DUPLICATE_SKU');
      }
    }

    if (!empty(product_data.sn)) {
      const existingSn = await db
        .select()
        .from(ProductTable)
        .where(eq(ProductTable.sn, product_data.sn))
        .limit(1);

      if (!empty(existingSn)) {
        throw new AppError(`A product with SN: ${product_data.sn} already exists`, 'DUPLICATE_SN');
      }
    }

    const [result] = await db.insert(ProductTable).values(product_data).$returningId();

    if (!result.id) {
      throw new Error('Failed to create product');
    }

    const errorMessages: string[] = [];

    if (!empty(category_ids) && Array.isArray(category_ids)) {
      const [resultCategory] = await db
        .insert(ProductCategory)
        .values(
          category_ids
            .filter((categoryId): categoryId is number => typeof categoryId === 'number')
            .map((categoryId) => ({
              productId: result.id,
              categoryId,
            }))
        )
        .$returningId();

      if (!resultCategory.id) {
        errorMessages.push('Product was created, but failed to associate categories with product');
      }
    }

    if (!empty(attribute_ids) && Array.isArray(attribute_ids)) {
      const [resultAttribute] = await db
        .insert(ProductAttributeTable)
        .values(
          attribute_ids
            .filter((attributeId): attributeId is number => typeof attributeId === 'number')
            .map((attributeId) => ({
              productId: result.id,
              attributeId,
            }))
        )
        .$returningId();

      if (!resultAttribute.id) {
        errorMessages.push(
          'Product was created, categories were inserted, but failed to associate attributes with product'
        );
      }
    }

    return {
      product_id: result.id,
      errorMessage: errorMessages.length ? errorMessages.join(' ') : null,
    };
  } catch (error: unknown) {
    console.log(error);
    logger.logError(error, 'Repository: createProduct');
    return new AppError(error instanceof Error ? error.message : 'Failed to create product');
  }
}

export async function updateProduct(id: number, data: z.infer<typeof ProductSchema>) {
  if (!id) {
    return new AppError('Product ID is required for update');
  }

  const productId = id;
  const attributeIds =
    data.attributeIds?.filter((id): id is number => typeof id === 'number') || [];
  const categoryIds = data.categoryIds?.filter((id): id is number => typeof id === 'number') || [];

  try {
    // 1. Update product main fields
    const product_data: Record<string, unknown> = {
      name: data.name,
      sku: data.sku || null,
      sn: data.sn || null,
      price: data.price.toString(),
      deliveryPrice: normalizeNumber(data.deliveryPrice),
      warranty: data.warranty,
      quantity: data.quantity,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    // only add brand_id if provided
    if (data.brandId || data.brandId !== 0) {
      product_data.brandId = data.brandId;
    }

    if (data.salePrice || data.salePrice !== 0) {
      product_data.salePrice = normalizeNumber(data.salePrice);
    }

    const result = await db
      .update(ProductTable)
      .set(product_data)
      .where(eq(ProductTable.id, productId));

    if (empty(result)) {
      throw new Error(`Failed to update product with ID: ${productId}`);
    }

    // 2. Sync categories
    const existingCategories = await db
      .select({ categoryId: ProductCategory.categoryId })
      .from(ProductCategory)
      .where(eq(ProductCategory.productId, productId));

    const existingCategoryIds = existingCategories.map((row) => row.categoryId);

    const categoriesToAdd = categoryIds.filter((id) => !existingCategoryIds.includes(id));
    const categoriesToRemove = existingCategoryIds.filter((id) => !categoryIds.includes(id));

    if (categoriesToRemove.length > 0) {
      await db
        .delete(ProductCategory)
        .where(
          and(
            eq(ProductCategory.productId, productId),
            inArray(ProductCategory.categoryId, categoriesToRemove)
          )
        );
    }

    if (categoriesToAdd.length > 0) {
      await db.insert(ProductCategory).values(
        categoriesToAdd.map((categoryId) => ({
          productId,
          categoryId,
        }))
      );
    }

    // 3. Sync attributes
    const existingAttributes = await db
      .select({ attributeId: ProductAttributeTable.attributeId })
      .from(ProductAttributeTable)
      .where(eq(ProductAttributeTable.productId, productId));

    const existingAttributeIds = existingAttributes.map((row) => row.attributeId);

    const attributesToAdd = attributeIds.filter((id) => !existingAttributeIds.includes(id));
    const attributesToRemove = existingAttributeIds.filter((id) => !attributeIds.includes(id));

    if (attributesToRemove.length > 0) {
      await db
        .delete(ProductAttributeTable)
        .where(
          and(
            eq(ProductAttributeTable.productId, productId),
            inArray(ProductAttributeTable.attributeId, attributesToRemove)
          )
        );
    }

    if (attributesToAdd.length > 0) {
      await db.insert(ProductAttributeTable).values(
        attributesToAdd.map((attributeId) => ({
          productId,
          attributeId,
        }))
      );
    }

    return { product_id: productId, message: 'Product updated successfully' };
  } catch (error: unknown) {
    // logger.logError(error, 'Repository: updateProduct');
    return new AppError(
      error instanceof Error ? error.message : 'Failed to update product',
      error instanceof AppError ? error.code : 'UPDATE_FAILED'
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

    // First, delete related pivot/meta records
    await db.delete(ProductAttributeTable).where(eq(ProductAttributeTable.productId, id));
    await db.delete(ProductCategory).where(eq(ProductCategory.productId, id));

    // Perform the delete operation
    const result = await db.delete(ProductTable).where(eq(ProductTable.id, id));

    if (empty(result)) {
      throw new Error(`Failed to delete product with ID: ${id}`);
    }

    return true; // Product deleted successfully
  } catch (error: unknown) {
    // logger.logError(error, 'Repository: deleteProduct');
    return new AppError(
      error.message ?? `Failed to delete product with ID: ${id}`,
      'DELETE_FAILED'
    );
  }
}

export async function getPaginatedProducts(
  page: number = 1,
  pageSize: number = 10,
  sortKey?: string,
  sortDir: 'asc' | 'desc' = 'desc',
  search?: string
) {
  const defaultSortDir: 'asc' | 'desc' = sortDir ?? 'desc';
  const validSortKey = (sortKey && sortKey in columnMap ? sortKey : 'id') as SortableProductColumn;

  const productsOrError = await getAllProductsWithCategoriesAndAttributes(
    page,
    pageSize,
    validSortKey,
    defaultSortDir,
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
    // logger.logError(error, 'Repository: getPaginatedProducts');
    return new AppError(`Failed to fetch paginated products: ${error}`, 'FETCH_FAILED');
  }
}

export async function getAllProductsWithCategoriesAndAttributes(
  page: number = 1,
  pageSize: number = 10,
  sortKey: SortableProductColumn | null = null,
  sortDir: 'desc' | 'asc' = 'desc',
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

    const categoriesByProductId = productCategories.reduce((acc, curr) => {
      if (!acc[curr.productId]) acc[curr.productId] = {};
      acc[curr.productId][curr.categoryId] = curr.categoryName;
      return acc;
    }, {} as Record<number, Record<number, string>>);

    // ---------- Attributes ----------
    let productAttributes: {
      productId: number;
      attributeId: number;
      attributeName: string;
      attributeValue: string;
      attributeUnit: string | null;
    }[] = [];

    if (productIds.length > 0) {
      productAttributes = await db
        .select({
          productId: ProductAttributeTable.productId,
          attributeId: AttributeTable.id,
          attributeName: AttributeTable.name,
          attributeValue: AttributeTable.value,
          attributeUnit: AttributeTable.unit,
        })
        .from(ProductAttributeTable)
        .innerJoin(AttributeTable, eq(ProductAttributeTable.attributeId, AttributeTable.id))
        .where(inArray(ProductAttributeTable.productId, productIds));
    }

    const attributesByProductId = productAttributes.reduce((acc, curr) => {
      if (!acc[curr.productId]) acc[curr.productId] = [];
      acc[curr.productId].push({
        id: curr.attributeId,
        name: curr.attributeName,
        value: curr.attributeValue,
        unit: curr.attributeUnit,
      });
      return acc;
    }, {} as Record<number, { id: number; name: string; value: string; unit: string | null }[]>);

    // ---------- Combine ----------
    return products.map((product) => ({
      ...product,
      categories: categoriesByProductId[product.id] || [],
      attributes: attributesByProductId[product.id] || [],
    }));
  } catch (error) {
    // logger.logError(error, 'Repository: getAllProductsWithCategories');
    return new AppError('Failed to fetch products with categories');
  }
}

export async function getProductsBySearch(search: string) {
  try {
    const loweredSerial = search.toLowerCase();

    // Fetch products with matching serial number or name and quantity > 0
    const products = await db
      .select()
      .from(ProductTable)
      .where(
        and(
          or(
            like(sql`LOWER(${ProductTable.sn})`, `%${loweredSerial}%`),
            like(sql`LOWER(${ProductTable.name})`, `%${loweredSerial}%`),
            like(sql`LOWER(${ProductTable.sku})`, `%${loweredSerial}%`)
          ),
          sql`${ProductTable.quantity} > 0`
        )
      );

    if (empty(products)) {
      return [];
    }

    const productIds = products.map((p) => p.id);

    // Fetch categories for these products
    const productCategories = await db
      .select({
        productId: ProductCategory.productId,
        categoryId: ProductCategoryTable.id,
        categoryName: ProductCategoryTable.name,
      })
      .from(ProductCategory)
      .innerJoin(ProductCategoryTable, eq(ProductCategory.categoryId, ProductCategoryTable.id))
      .where(inArray(ProductCategory.productId, productIds));

    const categoriesByProductId = productCategories.reduce((acc, curr) => {
      if (!acc[curr.productId]) acc[curr.productId] = {};
      acc[curr.productId][curr.categoryId] = curr.categoryName;
      return acc;
    }, {} as Record<number, Record<number, string>>);

    // Fetch attributes for these products
    const productAttributes = await db
      .select({
        productId: ProductAttributeTable.productId,
        attributeId: AttributeTable.id,
        attributeName: AttributeTable.name,
        attributeValue: AttributeTable.value,
        attributeUnit: AttributeTable.unit,
      })
      .from(ProductAttributeTable)
      .innerJoin(AttributeTable, eq(ProductAttributeTable.attributeId, AttributeTable.id))
      .where(inArray(ProductAttributeTable.productId, productIds));

    const attributesByProductId = productAttributes.reduce((acc, curr) => {
      if (!acc[curr.productId]) acc[curr.productId] = {};
      acc[curr.productId][curr.attributeId] = `${curr.attributeName}: ${curr.attributeValue} ${
        curr.attributeUnit || ''
      }`;
      return acc;
    }, {} as Record<number, Record<number, string>>);

    // Combine results
    return products.map((product) => ({
      ...product,
      categories: categoriesByProductId[product.id] || {},
      attributes: attributesByProductId[product.id] || {},
    }));
  } catch (error) {
    logger.logError(error, 'Repository: getOutOfStockProducts');
    const message =
      error instanceof Error ? error.message : 'Failed to fetch products by serial number';
    return new AppError(message);
  }
}

export async function getOutOfStockProducts() {
  try {
    const products = await db
      .select()
      .from(ProductTable)
      .where(sql`${ProductTable.quantity} = 0`);

    if (empty(products)) {
      return null;
    }

    // Combine results
    return products;
  } catch (error) {
    logger.logError(error, 'Repository: getOutOfStockProducts');
    const message =
      error instanceof Error ? error.message : 'Failed to fetch out of stock products';
    return new AppError(message);
  }
}

export async function getLowOnStockProducts(threshold: number) {
  try {
    const products = await db
      .select()
      .from(ProductTable)
      .where(and(sql`${ProductTable.quantity} > 0`, sql`${ProductTable.quantity} <= ${threshold}`));

    if (empty(products)) {
      return null;
    }

    // Combine results
    return products;
  } catch (error) {
    logger.logError(error, 'Repository: getLowOnStockProducts');
    const message =
      error instanceof Error ? error.message : 'Failed to fetch low on stock products';
    return new AppError(message);
  }
}
