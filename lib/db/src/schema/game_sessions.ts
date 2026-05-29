import { pgTable, serial, integer, numeric, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const gameSessionsTable = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  gameType: text("game_type").notNull(),
  betAmount: numeric("bet_amount", { precision: 18, scale: 6 }).notNull(),
  multiplier: numeric("multiplier", { precision: 10, scale: 4 }).default("1").notNull(),
  winAmount: numeric("win_amount", { precision: 18, scale: 6 }).default("0").notNull(),
  won: boolean("won").default(false).notNull(),
  crashPoint: numeric("crash_point", { precision: 10, scale: 4 }),
  prediction: text("prediction"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  settledAt: timestamp("settled_at"),
});

export const insertGameSessionSchema = createInsertSchema(gameSessionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessionsTable.$inferSelect;
