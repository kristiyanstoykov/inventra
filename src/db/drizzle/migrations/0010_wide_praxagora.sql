DROP TABLE `order_payment_types`;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `quantity` decimal(10,2) DEFAULT '0.00';