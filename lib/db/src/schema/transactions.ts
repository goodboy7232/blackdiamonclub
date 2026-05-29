import { pgTable, serial, integer, numeric, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit",
  "withdrawal",
  "game_win",
  "game_loss",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "approved",
  "rejected",
]);

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  txHash: text("tx_hash"),
  screenshotUrl: text("screenshot_url"),
  gameType: text("game_type"),
  walletAddress: text("wallet_address"),
  notes: text("notes"),
  // AI verification columns
  aiVerified: boolean("ai_verified"),
  aiConfidence: numeric("ai_confidence", { precision: 5, scale: 4 }),
  aiExtractedAmount: numeric("ai_extracted_amount", { precision: 18, scale: 6 }),
  aiExtractedAddress: text("ai_extracted_address"),
  aiExtractedTxHash: text("ai_extracted_tx_hash"),
  aiExtractedAt: timestamp("ai_extracted_at"),
  aiFailReason: text("ai_fail_reason"),
  // Per-check breakdown booleans
  aiCheckConfidence: boolean("ai_check_confidence"),
  aiCheckAmount: boolean("ai_check_amount"),
  aiCheckAddress: boolean("ai_check_address"),
  aiCheckTimestamp: boolean("ai_check_timestamp"),
  aiCheckDuplicate: boolean("ai_check_duplicate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
