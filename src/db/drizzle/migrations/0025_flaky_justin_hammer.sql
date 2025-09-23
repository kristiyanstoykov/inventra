ALTER TABLE `products` MODIFY COLUMN `updated_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `products` ADD `warranty` int DEFAULT 0;