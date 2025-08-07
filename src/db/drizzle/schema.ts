import { sql } from 'drizzle-orm';
import {
  mysqlTable,
  datetime,
  mysqlEnum,
  int,
  text,
  varchar,
  boolean,
  decimal,
} from 'drizzle-orm/mysql-core';

/** ========== Enums ========== **/
export const userRoles = ['admin', 'user', 'customer'] as const;
export type UserRole = (typeof userRoles)[number];
export function userRoleEnum() {
  return mysqlEnum('user_roles', userRoles);
}

/** ========== Users ========== **/
export const UserTable = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  salt: varchar('salt', { length: 255 }),
  password: text('password'),
  role: userRoleEnum().notNull().default('user'),
  isCompany: boolean('is_company').notNull().default(false),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  companyName: varchar('company_name', { length: 255 }),
  bulstat: varchar('bulstat', { length: 64 }),
  vatNumber: varchar('vat_number', { length: 64 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

/** ========== Sessions ========== **/
export const SessionTable = mysqlTable('sessions', {
  id: int('id').autoincrement().primaryKey().notNull(),
  tokenHash: varchar('token_hash', { length: 512 }).notNull(),
  userId: int('user_id')
    .notNull()
    .references(() => UserTable.id),
  role: userRoleEnum().notNull().default('user'),
  ip: varchar('ip', { length: 64 }),
  userAgent: text('user_agent'),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Roles table
export const RoleTable = mysqlTable('roles', {
  id: int('id').autoincrement().primaryKey().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
});

// Pivot: User_Roles
export const UserRoleTable = mysqlTable('user_roles', {
  id: int('id').autoincrement().primaryKey().notNull(),
  userId: int('user_id')
    .notNull()
    .references(() => UserTable.id),
  roleId: int('role_id')
    .notNull()
    .references(() => RoleTable.id),
  warehouseId: int('warehouse_id').references(() => WarehouseTable.id), // optional for global roles
});

// Capabilities table
export const CapabilityTable = mysqlTable('capabilities', {
  id: int('id').autoincrement().primaryKey().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
});

// Pivot: Role_Capabilities
export const RoleCapabilityTable = mysqlTable('role_capabilities', {
  id: int('id').autoincrement().primaryKey().notNull(),
  roleId: int('role_id')
    .notNull()
    .references(() => RoleTable.id),
  capabilityId: int('capability_id')
    .notNull()
    .references(() => CapabilityTable.id),
});

/** ========== Warehouses ========== **/
export const WarehouseTable = mysqlTable('warehouses', {
  id: int('id').autoincrement().primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }),
  createdBy: int('created_by').references(() => UserTable.id),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** ========== Products ========== **/
export const ProductTable = mysqlTable('products', {
  id: int('id').autoincrement().primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 255 }).unique(),
  sn: varchar('sn', { length: 255 }), // serial number
  price: decimal('price', { precision: 10, scale: 2 })
    .notNull()
    .default('0.00'),
  salePrice: decimal('sale_price', { precision: 10, scale: 2 }),
  deliveryPrice: decimal('delivery_price', { precision: 10, scale: 2 }),
  quantity: int('quantity').default(0),
  brandId: int('brand_id').references(() => ProductBrandTable.id),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

/** ========== Attributes ========== **/
export const AttributeTable = mysqlTable('attributes', {
  id: int('id').autoincrement().primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  value: decimal('value', { precision: 12, scale: 4 }).notNull(),
  unit: varchar('unit', { length: 64 }),
});

/** ========== Product_Attributes (Pivot Table) ========== **/
export const ProductAttributeTable = mysqlTable('product_attributes', {
  id: int('id').autoincrement().primaryKey().notNull(),
  productId: int('product_id')
    .notNull()
    .references(() => ProductTable.id, { onDelete: 'cascade' }),
  attributeId: int('attribute_id')
    .notNull()
    .references(() => AttributeTable.id, { onDelete: 'cascade' }),
});

/** ========== Product_Meta ========== **/
export const ProductMetaTable = mysqlTable('product_meta', {
  id: int('id').autoincrement().primaryKey().notNull(),
  productId: int('product_id')
    .notNull()
    .references(() => ProductTable.id, { onDelete: 'cascade' }),
  metaKey: varchar('meta_key', { length: 255 }).notNull(),
  metaValue: text('meta_value'),
});

/** ========== ProductBrandTable ========== **/
export const ProductBrandTable = mysqlTable('product_brands', {
  id: int('id').autoincrement().primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: varchar('logo_url', { length: 512 }),
  website: varchar('website', { length: 255 }),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

/** ========== ProductCategoryTable ========== **/
export const ProductCategoryTable = mysqlTable('product_cat', {
  id: int('id').autoincrement().primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

/** ========== product_category pivot ========== **/
export const ProductCategory = mysqlTable('products_categories', {
  id: int('id').autoincrement().primaryKey().notNull(),
  productId: int('product_id')
    .notNull()
    .references(() => ProductTable.id, { onDelete: 'cascade' }),
  categoryId: int('category_id')
    .notNull()
    .references(() => ProductCategoryTable.id, { onDelete: 'cascade' }),
});

/** ========== Stock ========== **/
export const StockTable = mysqlTable('stock', {
  id: int('id').autoincrement().primaryKey().notNull(),
  productId: int('product_id')
    .notNull()
    .references(() => ProductTable.id),
  warehouseId: int('warehouse_id')
    .notNull()
    .references(() => WarehouseTable.id),
  quantity: int('quantity').notNull().default(0),
});

/** ========== Orders ========== **/
export const OrderTable = mysqlTable('orders', {
  id: int('id').autoincrement().primaryKey().notNull(),
  warehouseId: int('warehouse_id')
    .notNull()
    .references(() => WarehouseTable.id),
  clientId: int('client_id').references(() => UserTable.id),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** ========== Order Items ========== **/
export const OrderItemTable = mysqlTable('order_items', {
  id: int('id').autoincrement().primaryKey().notNull(),
  orderId: int('order_id')
    .notNull()
    .references(() => OrderTable.id),
  productId: int('product_id')
    .notNull()
    .references(() => ProductTable.id),
  quantity: int('quantity').notNull().default(1),
  price: decimal('price', { precision: 10, scale: 2 })
    .notNull()
    .default('0.00'),
});

/** ========== Invites ========== **/
export const InviteTable = mysqlTable('invites', {
  id: int('id').autoincrement().primaryKey().notNull(),
  warehouseId: int('warehouse_id')
    .notNull()
    .references(() => WarehouseTable.id),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  accepted: boolean('accepted').notNull().default(false),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const schema = {
  users: UserTable,
  sessions: SessionTable,
  roles: RoleTable,
  userRoles: UserRoleTable,
  capabilities: CapabilityTable,
  roleCapabilities: RoleCapabilityTable,
  warehouses: WarehouseTable,
  products: ProductTable,
  productAttributes: ProductAttributeTable,
  productBrands: ProductBrandTable,
  productCategories: ProductCategoryTable,
  productCategory: ProductCategory,
  productMeta: ProductMetaTable,
  stock: StockTable,
  orders: OrderTable,
  orderItems: OrderItemTable,
  invites: InviteTable,
};
