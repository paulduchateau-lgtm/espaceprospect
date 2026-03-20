CREATE TABLE `content_chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`source_url` text NOT NULL,
	`title` text NOT NULL,
	`product_type` text NOT NULL,
	`tns_relevance` text NOT NULL,
	`guarantees` text NOT NULL,
	`chunk_type` text NOT NULL,
	`token_estimate` integer NOT NULL,
	`embedding` F32_BLOB(1024),
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`prospect_id` text NOT NULL,
	`messages` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dashboard_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`prospect_id` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prospects` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`consent_given` integer DEFAULT 0 NOT NULL,
	`consent_at` integer
);
--> statement-breakpoint
CREATE TABLE `scrape_log` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`status_code` integer,
	`chunk_count` integer,
	`scraped_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scrape_log_url_unique` ON `scrape_log` (`url`);