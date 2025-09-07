CREATE TABLE `notebooks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`user_id` text,
	`workspace_id` text,
	`is_template` integer DEFAULT 0,
	`is_public` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_accessed_at` integer,
	`tags` text,
	`description` text
);
--> statement-breakpoint
CREATE INDEX `notebooks_user_id_idx` ON `notebooks` (`user_id`);--> statement-breakpoint
CREATE INDEX `notebooks_workspace_id_idx` ON `notebooks` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `notebooks_created_at_idx` ON `notebooks` (`created_at`);