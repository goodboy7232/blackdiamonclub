import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, gameSessionsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, hashPassword, verifyPassword } from "../lib/auth.js";

const router = Router();

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
      recoveryQuestion: user.recoveryQuestion,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = (req as any).user;
    const { email, phone, currentPassword, newPassword } = req.body;

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ error: "Current password required to change password" });
        return;
      }
      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        res.status(400).json({ error: "Current password is incorrect" });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ error: "New password must be at least 6 characters" });
        return;
      }
      updates.passwordHash = await hashPassword(newPassword);
    }

    const [updated] = await db.update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, userId))
      .returning();

    res.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      phone: updated.phone,
      createdAt: updated.createdAt.toISOString(),
      recoveryQuestion: updated.recoveryQuestion,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/profile/stats", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const sessions = await db.select().from(gameSessionsTable)
      .where(eq(gameSessionsTable.userId, userId));

    const totalBets = sessions.length;
    const totalWins = sessions.filter(s => s.won).length;
    const totalLosses = totalBets - totalWins;
    const winRate = totalBets > 0 ? parseFloat(((totalWins / totalBets) * 100).toFixed(1)) : 0;
    const biggestWin = sessions.reduce((max, s) => Math.max(max, parseFloat(s.winAmount)), 0);

    const gameTypeCounts: Record<string, number> = {};
    sessions.forEach(s => {
      gameTypeCounts[s.gameType] = (gameTypeCounts[s.gameType] || 0) + 1;
    });
    const favoriteGame = Object.entries(gameTypeCounts).sort(([,a],[,b]) => b - a)[0]?.[0] || null;

    const txs = await db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.status, "approved")));
    const totalDeposited = txs.filter(t => t.type === "deposit").reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalWithdrawn = txs.filter(t => t.type === "withdrawal").reduce((s, t) => s + parseFloat(t.amount), 0);

    res.json({
      totalBets,
      totalWins,
      totalLosses,
      winRate,
      biggestWin,
      totalDeposited,
      totalWithdrawn,
      favoriteGame,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
