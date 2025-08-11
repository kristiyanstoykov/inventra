CREATE TABLE `payment_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payment_types_enum` enum('cash','card') NOT NULL,
	CONSTRAINT `payment_types_id` PRIMARY KEY(`id`)
);
