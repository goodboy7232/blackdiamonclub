import { Router } from "express";
import { db } from "@workspace/db";
import { gameSessionsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { debitDepositWallet, debitWithdrawalWallet, creditWithdrawalWallet, getOrCreateWallet } from "../lib/wallet.js";
import { determineWin, calculateMultiplier, generateFakeActivity, generateCrashPoint, generateTowerData, TOWER_MULTIPLIERS, generateNumberBlastData, calculateNumberBlastMultiplier } from "../lib/gameLogic.js";
import { areGamesEnabled, isMaintenanceMode } from "../lib/config.js";

const router = Router();

router.post("/games/bet", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { gameType, amount, prediction } = req.body;

    // Check platform settings before accepting bets
    const [gamesEnabled, maintenance] = await Promise.all([areGamesEnabled(), isMaintenanceMode()]);
    if (maintenance) {
      res.status(503).json({ error: "Platform is under maintenance. Please try again later." });
      return;
    }
    if (!gamesEnabled) {
      res.status(503).json({ error: "Games are currently disabled by the administrator." });
      return;
    }

    if (!gameType || !amount || amount <= 0) {
      res.status(400).json({ error: "Invalid bet parameters" });
      return;
    }

    const validGames = ["aviator", "slots777", "rocketrush", "coinflip", "spinsprint", "dicedash", "towerclimb", "luckywheel", "numberblast", "gemdrop"];
    if (!validGames.includes(gameType)) {
      res.status(400).json({ error: "Invalid game type" });
      return;
    }

    // Number Blast requires a valid numeric prediction in range 1-10
    if (gameType === "numberblast") {
      const guessRaw = prediction ? prediction.trim() : "";
      const guessNum = /^\d+$/.test(guessRaw) ? parseInt(guessRaw) : NaN;
      if (Number.isNaN(guessNum) || guessNum < 1 || guessNum > 10) {
        res.status(400).json({ error: "Number Blast requires a prediction between 1 and 10" });
        return;
      }
    }

    // Check total balance (deposit + withdrawal)
    const wallet = await getOrCreateWallet(userId);
    const total = parseFloat(wallet.depositBalance) + parseFloat(wallet.withdrawalBalance);
    if (total < amount) {
      res.status(400).json({ error: "Insufficient balance" });
      return;
    }

    // Deduct bet from deposit first, then withdrawal if needed
    const dep = parseFloat(wallet.depositBalance);
    if (dep >= amount) {
      await debitDepositWallet(userId, amount);
    } else {
      await debitDepositWallet(userId, dep);
      await debitWithdrawalWallet(userId, amount - dep);
    }

    // Coinflip = pure 50/50 skill game. Others = 30% RNG.
    let won: boolean;
    let multiplier: number;
    let winAmount: number;
    if (gameType === "coinflip") {
      const coin = Math.random() < 0.5 ? "heads" : "tails";
      const predicted = (prediction || "heads").toLowerCase().trim();
      won = coin === predicted;
      multiplier = won ? 1.9 : 0;
      winAmount = won ? amount * 1.9 : 0;
    } else {
      won = determineWin(); // 50% win probability
      multiplier = won ? calculateMultiplier(gameType, won) : 0;
      winAmount = won ? amount * multiplier : 0;
    }
    // Override rocketrush: 30% win, peak set to always match outcome
    if (gameType === "rocketrush") {
      const target = prediction ? parseFloat(prediction) : 3;
      if (won) {
        multiplier = target;
        winAmount = amount * target;
      }
    }
    // Tower Climb: multiplier deterministically tied to floor reached
    const towerData = gameType === "towerclimb" ? generateTowerData(won) : null;
    if (gameType === "towerclimb" && towerData) {
      const floorMult = TOWER_MULTIPLIERS[towerData.floors] ?? 1.5;
      multiplier = won ? floorMult : 0;
      winAmount = won ? amount * floorMult : 0;
    }
    // Number Blast: generate answer from player guess, compute multiplier by distance
    const numberBlastData = gameType === "numberblast" ? generateNumberBlastData(won, prediction ? parseInt(prediction) : null) : null;
    if (gameType === "numberblast" && numberBlastData) {
      const guess = parseInt(prediction!); // validated above
      const nbMult = calculateNumberBlastMultiplier(numberBlastData.answer, guess);
      won = nbMult > 0;
      multiplier = nbMult;
      winAmount = won ? amount * nbMult : 0;
    }
    const crashPoint = gameType === "aviator" ? generateCrashPoint(won) : null;

    // For aviator game, create an active session (cashout will settle it)
    if (gameType === "aviator") {
      const [session] = await db.insert(gameSessionsTable).values({
        userId,
        gameType,
        betAmount: amount.toString(),
        multiplier: multiplier.toString(),
        winAmount: winAmount.toFixed(6),
        won: false, // Will be settled on cashout
        crashPoint: crashPoint?.toFixed(4) || null,
        prediction: prediction || null,
        isActive: true,
      }).returning();

      const updatedWallet = await getOrCreateWallet(userId);
      res.json({
        sessionId: session.id,
        won: false,
        multiplier: 1.0,
        betAmount: amount,
        winAmount: 0,
        newDepositBalance: parseFloat(updatedWallet.depositBalance),
        newWithdrawalBalance: parseFloat(updatedWallet.withdrawalBalance),
        crashPoint: parseFloat(session.crashPoint || crashPoint!.toString()),
        message: "Aviator game started — cash out before it crashes!",
      });
      return;
    }

    // For non-aviator games, settle immediately
    const [session] = await db.insert(gameSessionsTable).values({
      userId,
      gameType,
      betAmount: amount.toString(),
      multiplier: multiplier.toFixed(4),
      winAmount: winAmount.toFixed(6),
      won,
      crashPoint: null,
      prediction: prediction || null,
      isActive: false,
      settledAt: new Date(),
    }).returning();

    // Store towerData as metadata on the session (extendable via prediction or future schema)
    const towerPayload = towerData ? { floors: towerData.floors } : null;

    // Record transactions
    await db.insert(transactionsTable).values({
      userId,
      type: "game_loss",
      amount: amount.toString(),
      status: "approved",
      gameType,
    });

    if (won) {
      await creditWithdrawalWallet(userId, winAmount);
      await db.insert(transactionsTable).values({
        userId,
        type: "game_win",
        amount: winAmount.toFixed(6),
        status: "approved",
        gameType,
      });
    }

    const updatedWallet = await getOrCreateWallet(userId);
    res.json({
      sessionId: session.id,
      won,
      multiplier: won ? multiplier : 0,
      betAmount: amount,
      winAmount: won ? winAmount : 0,
      newDepositBalance: parseFloat(updatedWallet.depositBalance),
      newWithdrawalBalance: parseFloat(updatedWallet.withdrawalBalance),
      crashPoint: null,
      message: won
        ? `You won! ${multiplier.toFixed(2)}x multiplier`
        : "Better luck next time!",
      ...(towerPayload ? { floors: towerPayload.floors } : {}),
      ...(numberBlastData ? { answer: numberBlastData.answer } : {}),
    });
  } catch (err: any) {
    if (err.message?.includes("Insufficient")) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/games/cashout", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { sessionId, currentMultiplier } = req.body;

    if (!sessionId || !currentMultiplier) {
      res.status(400).json({ error: "sessionId and currentMultiplier required" });
      return;
    }

    const sessions = await db.select().from(gameSessionsTable)
      .where(and(eq(gameSessionsTable.id, sessionId), eq(gameSessionsTable.userId, userId)))
      .limit(1);

    if (!sessions.length) {
      res.status(400).json({ error: "Game session not found" });
      return;
    }

    const session = sessions[0];
    if (!session.isActive) {
      res.status(400).json({ error: "Game already settled" });
      return;
    }

    const crashPoint = parseFloat(session.crashPoint || "1.0");
    // Win only when the player cashes out STRICTLY BEFORE the crash point
    const won = currentMultiplier < crashPoint;
    const betAmount = parseFloat(session.betAmount);
    const winAmount = won ? betAmount * currentMultiplier : 0;

    // Settle the session
    await db.update(gameSessionsTable)
      .set({
        won,
        multiplier: currentMultiplier.toString(),
        winAmount: winAmount.toFixed(6),
        isActive: false,
        settledAt: new Date(),
      })
      .where(eq(gameSessionsTable.id, sessionId));

    await db.insert(transactionsTable).values({
      userId,
      type: "game_loss",
      amount: betAmount.toString(),
      status: "approved",
      gameType: "aviator",
    });

    if (won) {
      await creditWithdrawalWallet(userId, winAmount);
      await db.insert(transactionsTable).values({
        userId,
        type: "game_win",
        amount: winAmount.toFixed(6),
        status: "approved",
        gameType: "aviator",
      });
    }

    const updatedWallet = await getOrCreateWallet(userId);
    res.json({
      sessionId,
      won,
      multiplier: won ? currentMultiplier : 0,
      betAmount,
      winAmount: won ? winAmount : 0,
      newDepositBalance: parseFloat(updatedWallet.depositBalance),
      newWithdrawalBalance: parseFloat(updatedWallet.withdrawalBalance),
      crashPoint,
      message: won
        ? `Cashed out at ${currentMultiplier.toFixed(2)}x! You won!`
        : `Crashed at ${crashPoint.toFixed(2)}x — too late!`,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/games/stats", async (req, res) => {
  try {
    const gameType = (req.query.gameType as string) || "aviator";
    const activity = generateFakeActivity(8);
    const bigWins = generateFakeActivity(5).map(a => ({ ...a, action: "won" as const, multiplier: parseFloat((2 + Math.random() * 10).toFixed(2)) }));

    res.json({
      gameType,
      activePlayers: Math.floor(50 + Math.random() * 200),
      recentActivity: activity,
      bigWins,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
