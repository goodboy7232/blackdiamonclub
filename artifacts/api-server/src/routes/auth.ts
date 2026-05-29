import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken, requireAuth } from "../lib/auth.js";
import { getOrCreateWallet } from "../lib/wallet.js";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { username, password, recoveryQuestion, recoveryAnswer } = req.body;

    if (!username || !password || !recoveryQuestion || !recoveryAnswer) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    if (username.length < 3) {
      res.status(400).json({ error: "Username must be at least 3 characters" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existing.length) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    const [user] = await db.insert(usersTable).values({
      username,
      passwordHash: await hashPassword(password),
      recoveryQuestion,
      recoveryAnswer: recoveryAnswer.toLowerCase().trim(),
    }).returning();

    await getOrCreateWallet(user.id);

    const token = generateToken(user.id);
    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt.toISOString() },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (!users.length) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const user = users[0];
    if (user.isBanned) {
      res.status(401).json({ error: "Account is banned" });
      return;
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt.toISOString() },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/recover", async (req, res) => {
  try {
    const { username, recoveryAnswer, newPassword } = req.body;
    if (!username || !recoveryAnswer || !newPassword) {
      res.status(400).json({ error: "All fields required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (!users.length) {
      res.status(400).json({ error: "User not found" });
      return;
    }
    const user = users[0];
    if (user.recoveryAnswer !== recoveryAnswer.toLowerCase().trim()) {
      res.status(400).json({ error: "Wrong recovery answer" });
      return;
    }

    await db.update(usersTable)
      .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
