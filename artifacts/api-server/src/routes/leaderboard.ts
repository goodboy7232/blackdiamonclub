import { Router } from "express";
import { generateFakeLeaderboard } from "../lib/gameLogic.js";

const router = Router();

router.get("/leaderboard", (_req, res) => {
  try {
    const limit = parseInt(_req.query.limit as string) || 20;
    const leaders = generateFakeLeaderboard(Math.min(limit, 30));
    res.json({
      leaders,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
