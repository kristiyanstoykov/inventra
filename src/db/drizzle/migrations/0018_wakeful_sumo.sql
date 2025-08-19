CREATE TABLE `options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`value` longtext NOT NULL,
	CONSTRAINT `options_id` PRIMARY KEY(`id`),
	CONSTRAINT `options_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('cancelled','failed','pending','completed') NOT NULL DEFAULT 'pending';