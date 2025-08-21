ALTER TABLE `invoices` ADD `file_url` varchar(255);--> statement-breakpoint
ALTER TABLE `invoices` DROP COLUMN `invoice_number`;