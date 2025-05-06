CREATE TABLE `product_brands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`logo_url` varchar(512),
	`website` varchar(255),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `product_brands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`category_id` int NOT NULL,
	CONSTRAINT `products_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_cat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `product_cat_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `clients`;--> statement-breakpoint
ALTER TABLE `orders` DROP FOREIGN KEY `orders_client_id_clients_id_fk`;
--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `sku` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `brand_id` int;--> statement-breakpoint
ALTER TABLE `products_categories` ADD CONSTRAINT `products_categories_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products_categories` ADD CONSTRAINT `products_categories_category_id_product_cat_id_fk` FOREIGN KEY (`category_id`) REFERENCES `product_cat`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_client_id_users_id_fk` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_brand_id_product_brands_id_fk` FOREIGN KEY (`brand_id`) REFERENCES `product_brands`(`id`) ON DELETE no action ON UPDATE no action;