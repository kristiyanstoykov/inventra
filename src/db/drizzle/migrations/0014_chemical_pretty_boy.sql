ALTER TABLE `payment_types` RENAME COLUMN `payment_types_enum` TO `name`;--> statement-breakpoint
ALTER TABLE `payment_types` DROP INDEX `payment_types_payment_types_enum_unique`;--> statement-breakpoint
ALTER TABLE `payment_types` ADD CONSTRAINT `payment_types_name_unique` UNIQUE(`name`);