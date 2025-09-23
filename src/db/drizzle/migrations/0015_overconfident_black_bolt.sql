ALTER TABLE `order_items` ADD `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `sku` varchar(255);--> statement-breakpoint
ALTER TABLE `order_items` ADD `sn` varchar(255);--> statement-breakpoint
ALTER TABLE `order_items` ADD `created_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_type_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_sku_unique` UNIQUE(`sku`);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_payment_type_id_payment_types_id_fk` FOREIGN KEY (`payment_type_id`) REFERENCES `payment_types`(`id`) ON DELETE no action ON UPDATE no action;