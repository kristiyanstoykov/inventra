ALTER TABLE `order_items` DROP INDEX `order_items_sku_unique`;--> statement-breakpoint
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_order_id_orders_id_fk`;
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `client_id` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `client_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `orders` ADD `updated_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE cascade;