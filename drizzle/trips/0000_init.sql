CREATE TABLE `trips` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(512) NOT NULL,
	`type` integer NOT NULL,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`ended_at` integer,
	`edited_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_trips_editedAt` ON `trips` (`edited_at`);