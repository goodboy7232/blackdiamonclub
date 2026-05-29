import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  walletsTable,
  transactionsTable,
  gameSessionsTable,
  platformConfigTable,
} from "@workspace/db";
import { eq, desc, and, sql, inArray, or, ilike } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

// ─── Dashboard ──────────────────────────────────────────────────────────────

router.get("/admin/dashboard", requireAdmin, async (_req, res) => {
  try {
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
    const [activeGames] = await db.select({ count: sql<number>`count(*)::int` }).from(gameSessionsTable).where(eq(gameSessionsTable.isActive, true));
    const [totalDeposited] = await db.select({ sum: sql<string>`coalesce(sum(amount), 0)` }).from(transactionsTable).where(and(eq(transactionsTable.type, "deposit"), eq(transactionsTable.status, "approved")));
    const [totalWithdrawn] = await db.select({ sum: sql<string>`coalesce(sum(amount), 0)` }).from(transactionsTable).where(and(eq(transactionsTable.type, "withdrawal"), eq(transactionsTable.status, "approved")));
    const [totalWins] = await db.select({ sum: sql<string>`coalesce(sum(amount), 0)` }).from(transactionsTable).where(eq(transactionsTable.type, "game_win"));
    const [totalLosses] = await db.select({ sum: sql<string>`coalesce(sum(amount), 0)` }).from(transactionsTable).where(eq(transactionsTable.type, "game_loss"));
    const [pendingDeposits] = await db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable).where(and(eq(transactionsTable.type, "deposit"), eq(transactionsTable.status, "pending")));
    const [pendingWithdrawals] = await db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable).where(and(eq(transactionsTable.type, "withdrawal"), eq(transactionsTable.status, "pending")));

    const deposited = parseFloat(totalDeposited?.sum ?? "0");
    const withdrawn = parseFloat(totalWithdrawn?.sum ?? "0");
    const wins = parseFloat(totalWins?.sum ?? "0");
    const losses = parseFloat(totalLosses?.sum ?? "0");
    const platformRevenue = losses - wins;

    res.json({
      totalUsers: userCount?.count ?? 0,
      activeGameSessions: activeGames?.count ?? 0,
      totalDeposited: deposited,
      totalWithdrawn: withdrawn,
      platformRevenue,
      pendingDeposits: pendingDeposits?.count ?? 0,
      pendingWithdrawals: pendingWithdrawals?.count ?? 0,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Users ───────────────────────────────────────────────────────────────────

router.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = (req.query.search as string) || "";

    const searchCondition = search
      ? or(ilike(usersTable.username, `%${search}%`), ilike(usersTable.email, `%${search}%`))
      : undefined;

    const users = await db.select().from(usersTable)
      .where(searchCondition)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [countRow] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(searchCondition);

    const userIds = users.map(u => u.id);
    const wallets = userIds.length ? await db.select().from(walletsTable).where(inArray(walletsTable.userId, userIds)) : [];
    const walletMap = new Map(wallets.map(w => [w.userId, w]));

    res.json({
      users: users.map(u => {
        const w = walletMap.get(u.id);
        return {
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          isAdmin: u.isAdmin,
          isBanned: u.isBanned,
          createdAt: u.createdAt.toISOString(),
          depositBalance: parseFloat(w?.depositBalance ?? "0"),
          withdrawalBalance: parseFloat(w?.withdrawalBalance ?? "0"),
        };
      }),
      total: countRow?.count ?? 0,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id as string);
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!users.length) { res.status(404).json({ error: "User not found" }); return; }
    const u = users[0];

    const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId)).limit(1);
    const w = wallets[0];

    const [stats] = await db.select({
      totalBets: sql<number>`count(*)::int`,
      totalWins: sql<number>`coalesce(sum(case when won then 1 else 0 end), 0)::int`,
    }).from(gameSessionsTable).where(and(eq(gameSessionsTable.userId, userId), eq(gameSessionsTable.isActive, false)));

    const recentTx = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.userId, userId))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(10);

    res.json({
      id: u.id,
      username: u.username,
      email: u.email,
      phone: u.phone,
      isAdmin: u.isAdmin,
      isBanned: u.isBanned,
      createdAt: u.createdAt.toISOString(),
      depositBalance: parseFloat(w?.depositBalance ?? "0"),
      withdrawalBalance: parseFloat(w?.withdrawalBalance ?? "0"),
      totalBets: stats?.totalBets ?? 0,
      totalWins: stats?.totalWins ?? 0,
      recentTransactions: recentTx.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
        gameType: tx.gameType,
        walletAddress: tx.walletAddress,
        screenshotUrl: tx.screenshotUrl,
        txHash: tx.txHash,
      })),
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id as string);
    const { isBanned, depositBalance, withdrawalBalance } = req.body;

    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!users.length) { res.status(404).json({ error: "User not found" }); return; }

    if (typeof isBanned === "boolean") {
      await db.update(usersTable).set({ isBanned, updatedAt: new Date() }).where(eq(usersTable.id, userId));
    }

    if (typeof depositBalance === "number" || typeof withdrawalBalance === "number") {
      const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId)).limit(1);
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (typeof depositBalance === "number") updates.depositBalance = depositBalance.toFixed(6);
      if (typeof withdrawalBalance === "number") updates.withdrawalBalance = withdrawalBalance.toFixed(6);
      if (wallets.length) {
        await db.update(walletsTable).set(updates).where(eq(walletsTable.userId, userId));
      } else {
        await db.insert(walletsTable).values({ userId, ...updates });
      }
    }

    res.json({ message: "User updated" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Transactions ─────────────────────────────────────────────────────────────

router.get("/admin/transactions", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string;
    const status = req.query.status as string;

    const conditions: any[] = [];
    if (type) conditions.push(eq(transactionsTable.type, type as any));
    if (status) conditions.push(eq(transactionsTable.status, status as any));

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [countRow] = await db.select({ count: sql<number>`count(*)::int` })
      .from(transactionsTable)
      .where(whereClause);

    const txs = await db.select({
      tx: transactionsTable,
      username: usersTable.username,
    })
      .from(transactionsTable)
      .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      transactions: txs.map(({ tx, username }) => ({
        id: tx.id,
        userId: tx.userId,
        username: username ?? "unknown",
        type: tx.type,
        amount: parseFloat(tx.amount),
        status: tx.status,
        txHash: tx.txHash,
        // Don't return raw base64 in list — return a flag for presence
        hasScreenshot: !!tx.screenshotUrl,
        walletAddress: tx.walletAddress,
        notes: tx.notes,
        gameType: tx.gameType,
        createdAt: tx.createdAt.toISOString(),
        // AI verification data
        aiVerified: tx.aiVerified,
        aiConfidence: tx.aiConfidence ? parseFloat(tx.aiConfidence) : null,
        aiExtractedAmount: tx.aiExtractedAmount ? parseFloat(tx.aiExtractedAmount) : null,
        aiExtractedAddress: tx.aiExtractedAddress,
        aiExtractedTxHash: tx.aiExtractedTxHash,
        aiExtractedAt: tx.aiExtractedAt?.toISOString() ?? null,
        aiFailReason: tx.aiFailReason,
        aiCheckConfidence: tx.aiCheckConfidence,
        aiCheckAmount: tx.aiCheckAmount,
        aiCheckAddress: tx.aiCheckAddress,
        aiCheckTimestamp: tx.aiCheckTimestamp,
        aiCheckDuplicate: tx.aiCheckDuplicate,
      })),
      total: countRow?.count ?? 0,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/admin/transactions/:id", requireAdmin, async (req, res) => {
  try {
    const txId = parseInt(req.params.id as string);
    const { status, notes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "Status must be approved or rejected" });
      return;
    }

    const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.id, txId)).limit(1);
    if (!txs.length) { res.status(404).json({ error: "Transaction not found" }); return; }
    const tx = txs[0];

    // Allow admin to override any status (including AI auto-approved / AI flagged)
    // except: can't change already-manually-settled identical status (no-op protection)
    const previousStatus = tx.status;

    await db.update(transactionsTable)
      .set({ status, notes: notes ?? tx.notes ?? null, updatedAt: new Date() })
      .where(eq(transactionsTable.id, txId));

    const amount = parseFloat(tx.amount);

    // --- Wallet adjustments based on transition ---
    // pending → approved (deposit): credit deposit wallet
    if (previousStatus === "pending" && status === "approved" && tx.type === "deposit") {
      const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, tx.userId)).limit(1);
      const current = parseFloat(wallets[0]?.depositBalance ?? "0");
      await db.update(walletsTable)
        .set({ depositBalance: (current + amount).toFixed(6), updatedAt: new Date() })
        .where(eq(walletsTable.userId, tx.userId));
    }

    // pending → rejected (withdrawal): refund withdrawal balance
    if (previousStatus === "pending" && status === "rejected" && tx.type === "withdrawal") {
      const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, tx.userId)).limit(1);
      const current = parseFloat(wallets[0]?.withdrawalBalance ?? "0");
      await db.update(walletsTable)
        .set({ withdrawalBalance: (current + amount).toFixed(6), updatedAt: new Date() })
        .where(eq(walletsTable.userId, tx.userId));
    }

    // approved → rejected (admin overrides AI auto-approval on deposit): claw back credit
    if (previousStatus === "approved" && status === "rejected" && tx.type === "deposit") {
      const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, tx.userId)).limit(1);
      const current = parseFloat(wallets[0]?.depositBalance ?? "0");
      const newBalance = Math.max(0, current - amount);
      await db.update(walletsTable)
        .set({ depositBalance: newBalance.toFixed(6), updatedAt: new Date() })
        .where(eq(walletsTable.userId, tx.userId));
    }

    // rejected → approved (admin reverses a rejection on deposit): credit deposit wallet
    if (previousStatus === "rejected" && status === "approved" && tx.type === "deposit") {
      const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, tx.userId)).limit(1);
      const current = parseFloat(wallets[0]?.depositBalance ?? "0");
      await db.update(walletsTable)
        .set({ depositBalance: (current + amount).toFixed(6), updatedAt: new Date() })
        .where(eq(walletsTable.userId, tx.userId));
    }

    // approved → rejected (withdrawal already processed): no balance change needed
    // (funds already sent externally; rejection is just a status mark for record-keeping)

    // rejected → approved (reversal on withdrawal): debit withdrawal balance if sufficient
    if (previousStatus === "rejected" && status === "approved" && tx.type === "withdrawal") {
      const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, tx.userId)).limit(1);
      const current = parseFloat(wallets[0]?.withdrawalBalance ?? "0");
      const newBalance = Math.max(0, current - amount);
      await db.update(walletsTable)
        .set({ withdrawalBalance: newBalance.toFixed(6), updatedAt: new Date() })
        .where(eq(walletsTable.userId, tx.userId));
    }

    res.json({ message: `Transaction ${status}` });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Screenshot proof viewer — returns base64 data URI stored for a deposit
router.get("/admin/transactions/:id/screenshot", requireAdmin, async (req, res) => {
  try {
    const txId = parseInt(req.params.id as string);
    const txs = await db.select({ screenshotUrl: transactionsTable.screenshotUrl })
      .from(transactionsTable).where(eq(transactionsTable.id, txId)).limit(1);
    if (!txs.length || !txs[0].screenshotUrl) {
      res.status(404).json({ error: "No screenshot for this transaction" });
      return;
    }
    res.json({ screenshot: txs[0].screenshotUrl });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Re-run AI verification on a deposit (useful for stuck pending deposits)
router.post("/admin/transactions/:id/rescan", requireAdmin, async (req, res) => {
  try {
    const txId = parseInt(req.params.id as string);
    const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.id, txId)).limit(1);
    if (!txs.length) { res.status(404).json({ error: "Transaction not found" }); return; }
    const tx = txs[0];
    if (tx.type !== "deposit" || !tx.screenshotUrl) {
      res.status(400).json({ error: "Only deposits with a screenshot can be rescanned" });
      return;
    }

    const { runAIVerification } = await import("../routes/wallet.js");
    // Run the same AI verification function again
    await runAIVerification(tx.id, tx.userId, parseFloat(tx.amount), tx.screenshotUrl, tx.createdAt);

    // Return updated AI status
    const [updated] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, txId)).limit(1);
    res.json({
      message: "Rescan complete",
      aiVerified: updated?.aiVerified ?? null,
      aiFailReason: updated?.aiFailReason ?? null,
      status: updated?.status,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Games ────────────────────────────────────────────────────────────────────

router.get("/admin/games", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const gameType = req.query.gameType as string;

    const conditions: any[] = [];
    if (gameType) conditions.push(eq(gameSessionsTable.gameType, gameType));
    const gamesWhereClause = conditions.length ? and(...conditions) : undefined;

    const [gamesCountRow] = await db.select({ count: sql<number>`count(*)::int` })
      .from(gameSessionsTable)
      .where(gamesWhereClause);

    const sessions = await db.select({
      session: gameSessionsTable,
      username: usersTable.username,
    })
      .from(gameSessionsTable)
      .leftJoin(usersTable, eq(gameSessionsTable.userId, usersTable.id))
      .where(gamesWhereClause)
      .orderBy(desc(gameSessionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Per-game profit summary
    const gameProfits = await db.select({
      gameType: gameSessionsTable.gameType,
      totalBets: sql<number>`count(*)::int`,
      totalWins: sql<number>`coalesce(sum(case when won then 1 else 0 end), 0)::int`,
      totalBetAmount: sql<string>`coalesce(sum(bet_amount), 0)`,
      totalWinAmount: sql<string>`coalesce(sum(win_amount), 0)`,
    })
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.isActive, false))
      .groupBy(gameSessionsTable.gameType);

    res.json({
      sessions: sessions.map(({ session: s, username }) => ({
        id: s.id,
        userId: s.userId,
        username: username ?? "unknown",
        gameType: s.gameType,
        betAmount: parseFloat(s.betAmount),
        multiplier: parseFloat(s.multiplier),
        winAmount: parseFloat(s.winAmount),
        won: s.won,
        isActive: s.isActive,
        crashPoint: s.crashPoint ? parseFloat(s.crashPoint) : null,
        createdAt: s.createdAt.toISOString(),
        settledAt: s.settledAt?.toISOString() ?? null,
      })),
      gameProfits: gameProfits.map(g => ({
        gameType: g.gameType,
        totalBets: g.totalBets,
        totalWins: g.totalWins,
        totalBetAmount: parseFloat(g.totalBetAmount),
        totalWinAmount: parseFloat(g.totalWinAmount),
        profit: parseFloat(g.totalBetAmount) - parseFloat(g.totalWinAmount),
      })),
      total: gamesCountRow?.count ?? 0,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Platform Settings ────────────────────────────────────────────────────────

router.get("/admin/settings", requireAdmin, async (_req, res) => {
  try {
    const configs = await db.select().from(platformConfigTable);
    const map: Record<string, string> = {};
    for (const c of configs) map[c.key] = c.value;

    res.json({
      minDeposit: parseFloat(map["min_deposit"] ?? "10"),
      minWithdrawal: parseFloat(map["min_withdrawal"] ?? "10"),
      gamesEnabled: map["games_enabled"] !== "false",
      maintenanceMode: map["maintenance_mode"] === "true",
      depositAddress: map["deposit_address"] ?? "TXvK9s2hWpL7nQdR3mBe8fC4jY6aZ5wM1",
      depositQrCode: map["deposit_qr_code"] ?? "",
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/admin/settings", requireAdmin, async (req, res) => {
  try {
    const { minDeposit, minWithdrawal, gamesEnabled, maintenanceMode, depositAddress } = req.body;

    const upsert = async (key: string, value: string) => {
      const existing = await db.select().from(platformConfigTable).where(eq(platformConfigTable.key, key)).limit(1);
      if (existing.length) {
        await db.update(platformConfigTable).set({ value, updatedAt: new Date() }).where(eq(platformConfigTable.key, key));
      } else {
        await db.insert(platformConfigTable).values({ key, value });
      }
    };

    const { depositQrCode } = req.body;
    if (minDeposit !== undefined) await upsert("min_deposit", String(minDeposit));
    if (minWithdrawal !== undefined) await upsert("min_withdrawal", String(minWithdrawal));
    if (gamesEnabled !== undefined) await upsert("games_enabled", String(gamesEnabled));
    if (maintenanceMode !== undefined) await upsert("maintenance_mode", String(maintenanceMode));
    if (depositAddress !== undefined) await upsert("deposit_address", String(depositAddress));
    if (depositQrCode !== undefined) await upsert("deposit_qr_code", String(depositQrCode));

    res.json({ message: "Settings updated" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Admin login (checks isAdmin flag) ───────────────────────────────────────
// Reuses the main /auth/login but this endpoint also returns isAdmin for the UI

router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }

    const { hashPassword: _, verifyPassword, generateToken } = await import("../lib/auth.js");
    const users = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (!users.length) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const user = users[0];
    if (!user.isAdmin) {
      res.status(403).json({ error: "Not an admin account" });
      return;
    }
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.default.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id);
    res.json({ token, username: user.username });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
