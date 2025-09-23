ALTER TABLE `invoices` DROP INDEX `invoices_file_name_unique`;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `file_name` varchar(36) NOT NULL;