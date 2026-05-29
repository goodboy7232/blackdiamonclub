import { pgTable, serial, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const platformConfigTable = pgTable("platform_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlatformConfigSchema = createInsertSchema(platformConfigTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPlatformConfig = z.infer<typeof insertPlatformConfigSchema>;
export type PlatformConfig = typeof platformConfigTable.$inferSelect;
