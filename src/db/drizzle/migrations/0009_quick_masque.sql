CREATE TABLE `order_payment_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` enum('cash','card') NOT NULL,
	CONSTRAINT `order_payment_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `product_attributes` DROP FOREIGN KEY `product_attributes_product_id_products_id_fk`;
--> statement-breakpoint
ALTER TABLE `product_attributes` DROP FOREIGN KEY `product_attributes_attribute_id_attributes_id_fk`;
--> statement-breakpoint
ALTER TABLE `products_categories` DROP FOREIGN KEY `products_categories_product_id_products_id_fk`;
--> statement-breakpoint
ALTER TABLE `products_categories` DROP FOREIGN KEY `products_categories_category_id_product_cat_id_fk`;
--> statement-breakpoint
ALTER TABLE `product_meta` DROP FOREIGN KEY `product_meta_product_id_products_id_fk`;
--> statement-breakpoint
ALTER TABLE `attributes` MODIFY COLUMN `value` decimal(12,4) NOT NULL;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `quantity` int;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `quantity` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updated_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `product_attributes` ADD CONSTRAINT `product_attributes_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_attributes` ADD CONSTRAINT `product_attributes_attribute_id_attributes_id_fk` FOREIGN KEY (`attribute_id`) REFERENCES `attributes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products_categories` ADD CONSTRAINT `products_categories_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products_categories` ADD CONSTRAINT `products_categories_category_id_product_cat_id_fk` FOREIGN KEY (`category_id`) REFERENCES `product_cat`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_meta` ADD CONSTRAINT `product_meta_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;