ALTER TABLE `invoices` MODIFY COLUMN `file_name` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `quantity` decimal(10,2) DEFAULT '';--> statement-breakpoint
ALTER TABLE `roles` MODIFY COLUMN `name` enum('admin','user','customer') NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `warranty` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `roles` ADD CONSTRAINT `roles_name_unique` UNIQUE(`name`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `user_roles`;