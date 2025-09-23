ALTER TABLE `invoices` ADD `file_name` varchar(36) DEFAULT UUID() NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_file_name_unique` UNIQUE(`file_name`);