/**
 * This file is used to define the schema for the database.
 *
 * After making changes to this file, run `npm run db:generate` to generate the migration file.
 * Then, by just using the app, the migration is lazily ensured at runtime.
 */
import { integer, sqliteTable, text, index } from "@deco/workers-runtime/drizzle";

export const todosTable = sqliteTable("todos", {
  id: integer("id").primaryKey(),
  title: text("title"),
  completed: integer("completed").default(0),
});

export const notebooksTable = sqliteTable("notebooks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(), // JSON stringified cells
  userId: text("user_id"),
  workspaceId: text("workspace_id"),
  isTemplate: integer("is_template").default(0),
  isPublic: integer("is_public").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull(),
  lastAccessedAt: integer("last_accessed_at", { mode: 'timestamp' }),
  tags: text("tags"), // JSON array
  description: text("description"),
}, (table) => ({
  userIdIndex: index("notebooks_user_id_idx").on(table.userId),
  workspaceIdIndex: index("notebooks_workspace_id_idx").on(table.workspaceId),
  createdAtIndex: index("notebooks_created_at_idx").on(table.createdAt),
}));
