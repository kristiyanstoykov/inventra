ALTER TABLE `sessions` MODIFY COLUMN `user_agent` text;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `expires_at` datetime NOT NULL;