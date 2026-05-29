import { db } from "@workspace/db";
import { platformConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function getConfig(key: string): Promise<string | null> {
  const rows = await db.select().from(platformConfigTable).where(eq(platformConfigTable.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function getMinDeposit(): Promise<number> {
  const v = await getConfig("min_deposit");
  return v ? parseFloat(v) : 10;
}

export async function getMinWithdrawal(): Promise<number> {
  const v = await getConfig("min_withdrawal");
  return v ? parseFloat(v) : 10;
}

export async function getDepositAddress(): Promise<string> {
  const v = await getConfig("deposit_address");
  return v ?? "TXvK9s2hWpL7nQdR3mBe8fC4jY6aZ5wM1";
}

export async function areGamesEnabled(): Promise<boolean> {
  const v = await getConfig("games_enabled");
  return v !== "false"; // default true
}

export async function isMaintenanceMode(): Promise<boolean> {
  const v = await getConfig("maintenance_mode");
  return v === "true"; // default false
}
