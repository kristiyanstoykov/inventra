ALTER TABLE `sessions` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `token_hash` varchar(512) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `ip` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `user_agent` text NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `created_at` datetime DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;