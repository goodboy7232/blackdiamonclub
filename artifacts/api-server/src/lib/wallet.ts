import { db } from "@workspace/db";
import { walletsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getOrCreateWallet(userId: number) {
  const existing = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId)).limit(1);
  if (existing.length) return existing[0];

  const created = await db.insert(walletsTable).values({ userId }).returning();
  return created[0];
}

export async function creditDepositWallet(userId: number, amount: number) {
  const wallet = await getOrCreateWallet(userId);
  const newBalance = (parseFloat(wallet.depositBalance) + amount).toFixed(6);
  const updated = await db.update(walletsTable)
    .set({ depositBalance: newBalance, updatedAt: new Date() })
    .where(eq(walletsTable.userId, userId))
    .returning();
  return updated[0];
}

export async function debitDepositWallet(userId: number, amount: number) {
  const wallet = await getOrCreateWallet(userId);
  const current = parseFloat(wallet.depositBalance);
  if (current < amount) throw new Error("Insufficient deposit balance");
  const newBalance = (current - amount).toFixed(6);
  const updated = await db.update(walletsTable)
    .set({ depositBalance: newBalance, updatedAt: new Date() })
    .where(eq(walletsTable.userId, userId))
    .returning();
  return updated[0];
}

export async function creditWithdrawalWallet(userId: number, amount: number) {
  const wallet = await getOrCreateWallet(userId);
  const newBalance = (parseFloat(wallet.withdrawalBalance) + amount).toFixed(6);
  const updated = await db.update(walletsTable)
    .set({ withdrawalBalance: newBalance, updatedAt: new Date() })
    .where(eq(walletsTable.userId, userId))
    .returning();
  return updated[0];
}

export async function debitWithdrawalWallet(userId: number, amount: number) {
  const wallet = await getOrCreateWallet(userId);
  const current = parseFloat(wallet.withdrawalBalance);
  if (current < amount) throw new Error("Insufficient withdrawal balance");
  const newBalance = (current - amount).toFixed(6);
  const updated = await db.update(walletsTable)
    .set({ withdrawalBalance: newBalance, updatedAt: new Date() })
    .where(eq(walletsTable.userId, userId))
    .returning();
  return updated[0];
}
