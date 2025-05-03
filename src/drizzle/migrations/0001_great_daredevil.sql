CREATE TABLE `sessions` (
	`id` varchar(512) NOT NULL,
	`user_roles` enum('admin','user') NOT NULL DEFAULT 'user',
	`expires_at` datetime NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
