CREATE TABLE `attributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`unit` varchar(64),
	CONSTRAINT `attributes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_meta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`meta_key` varchar(255) NOT NULL,
	`meta_value` text,
	CONSTRAINT `product_meta_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `sku` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `product_attributes` ADD `attribute_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `sn` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `sale_price` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `delivery_price` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `quantity` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `products` ADD `updated_at` datetime DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_sku_unique` UNIQUE(`sku`);--> statement-breakpoint
ALTER TABLE `product_meta` ADD CONSTRAINT `product_meta_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_attributes` ADD CONSTRAINT `product_attributes_attribute_id_attributes_id_fk` FOREIGN KEY (`attribute_id`) REFERENCES `attributes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_attributes` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `product_attributes` DROP COLUMN `value`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `is_service`;