CREATE TABLE `telemetry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trip_id` integer NOT NULL,
	`time` integer NOT NULL,
	`temp_mosfet` real,
	`temp_motor` real,
	`motor_current` real,
	`input_current` real,
	`duty_cycle` real,
	`tacho` integer,
	`rpm` real,
	`volts` real,
	`watt_hours` real,
	`error` integer,
	`lat` real,
	`long` real,
	`heading` real,
	`edited_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tripId` ON `telemetry` (`trip_id`);--> statement-breakpoint
CREATE INDEX `idx_time` ON `telemetry` (`time`);--> statement-breakpoint
CREATE INDEX `idx_telemetry_editedAt` ON `telemetry` (`edited_at`);