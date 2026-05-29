import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, walletsTable, platformConfigTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import {
  getOrCreateWallet,
  creditDepositWallet,
  debitWithdrawalWallet,
} from "../lib/wallet.js";
import { getMinDeposit, getMinWithdrawal, getDepositAddress } from "../lib/config.js";
import { verifyDepositScreenshot } from "../lib/aiDepositVerifier.js";

const router = Router();

// Simple QR code as base64 placeholder (small black square pattern)
function generateQRCodeBase64(): string {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAABBklEQVR4nO3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBuAABHgAAAABJRU5ErkJggg==";
}

router.get("/wallet", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const wallet = await getOrCreateWallet(userId);
    const deposit = parseFloat(wallet.depositBalance);
    const withdrawal = parseFloat(wallet.withdrawalBalance);
    res.json({
      userId: wallet.userId,
      depositBalance: deposit,
      withdrawalBalance: withdrawal,
      totalBalance: parseFloat((deposit + withdrawal).toFixed(2)),
      currency: "USDT",
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/wallet/deposit-address", requireAuth, async (_req, res) => {
  const [address, minDeposit] = await Promise.all([getDepositAddress(), getMinDeposit()]);
  const qrRow = await db.select().from(platformConfigTable).where(eq(platformConfigTable.key, "deposit_qr_code")).limit(1);
  const qrCode = qrRow[0]?.value || generateQRCodeBase64();
  res.json({
    address,
    network: "BEP20 (BSC)",
    currency: "USDT",
    qrCode,
    minDeposit,
  });
});

router.post("/wallet/deposit", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { amount, txHash, screenshotBase64 } = req.body;
    const MIN_DEPOSIT = await getMinDeposit();

    if (!amount || amount < MIN_DEPOSIT) {
      res.status(400).json({ error: `Minimum deposit is ${MIN_DEPOSIT} USDT` });
      return;
    }

    const screenshotProvided = !!screenshotBase64;

    const [tx] = await db.insert(transactionsTable).values({
      userId,
      type: "deposit",
      amount: amount.toString(),
      status: "pending",
      txHash: txHash || null,
      screenshotUrl: screenshotProvided ? screenshotBase64 : null,
    }).returning();

    // Respond immediately so the user isn't waiting for AI scan
    res.json({
      id: tx.id,
      userId: tx.userId,
      type: tx.type,
      amount: parseFloat(tx.amount),
      status: tx.status,
      txHash: tx.txHash,
      screenshotUrl: null,
      createdAt: tx.createdAt.toISOString(),
      gameType: null,
    });

    // Run AI verification in the background (after response sent)
    if (screenshotProvided) {
      setImmediate(() => runAIVerification(tx.id, userId, amount, screenshotBase64, tx.createdAt).catch(console.error));
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export async function runAIVerification(
  txId: number,
  userId: number,
  claimedAmount: number,
  screenshotBase64: string,
  submittedAt: Date
) {
  const platformAddress = await getDepositAddress();

  // Run AI scan first (no txHash available yet — done after scan)
  const { result, checks, passed: aiPassed, failReasons } = await verifyDepositScreenshot(
    screenshotBase64,
    claimedAmount,
    platformAddress,
    submittedAt,
    false // isDuplicate — we check after scan when txHash is known
  );

  // Now check for duplicate txHash in DB (using what AI extracted)
  let isDuplicate = false;
  if (result.detectedTxHash) {
    const existing = await db.select({ id: transactionsTable.id })
      .from(transactionsTable)
      .where(eq(transactionsTable.aiExtractedTxHash, result.detectedTxHash))
      .limit(1);
    if (existing.length > 0 && existing[0].id !== txId) {
      isDuplicate = true;
    }
  }

  const finalPassed = aiPassed && !isDuplicate;
  const finalChecks = { ...checks, checkDuplicate: !isDuplicate };
  if (isDuplicate) {
    failReasons.push(`Duplicate transaction — txHash ${result.detectedTxHash!.slice(0, 16)}... already processed`);
  }

  const now = new Date();

  if (finalPassed) {
    // Atomic conditional update: only approve if still pending (guard against concurrent admin action)
    const updated = await db.update(transactionsTable)
      .set({
        status: "approved",
        aiVerified: true,
        aiConfidence: result.confidence.toString(),
        aiExtractedAmount: result.detectedAmount?.toString() ?? null,
        aiExtractedAddress: result.detectedAddress,
        aiExtractedTxHash: result.detectedTxHash,
        aiExtractedAt: now,
        aiFailReason: null,
        aiCheckConfidence: finalChecks.checkConfidence,
        aiCheckAmount: finalChecks.checkAmount,
        aiCheckAddress: finalChecks.checkAddress,
        aiCheckTimestamp: finalChecks.checkTimestamp,
        aiCheckDuplicate: finalChecks.checkDuplicate,
        notes: `AI auto-approved (confidence ${(result.confidence * 100).toFixed(0)}%)`,
        updatedAt: now,
      })
      .where(and(eq(transactionsTable.id, txId), eq(transactionsTable.status, "pending")))
      .returning({ id: transactionsTable.id });

    // Only credit wallet if we actually changed the row (prevents double-credit)
    if (updated.length > 0) {
      await creditDepositWallet(userId, claimedAmount);
    }
  } else {
    // Flag for manual review — only if still pending (don't overwrite admin decision)
    await db.update(transactionsTable)
      .set({
        aiVerified: false,
        aiConfidence: result.confidence.toString(),
        aiExtractedAmount: result.detectedAmount?.toString() ?? null,
        aiExtractedAddress: result.detectedAddress,
        aiExtractedTxHash: result.detectedTxHash,
        aiExtractedAt: now,
        aiFailReason: failReasons.join(" | "),
        aiCheckConfidence: finalChecks.checkConfidence,
        aiCheckAmount: finalChecks.checkAmount,
        aiCheckAddress: finalChecks.checkAddress,
        aiCheckTimestamp: finalChecks.checkTimestamp,
        aiCheckDuplicate: finalChecks.checkDuplicate,
        updatedAt: now,
      })
      .where(and(eq(transactionsTable.id, txId), eq(transactionsTable.status, "pending")));
  }
}

router.post("/wallet/withdraw", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { amount, walletAddress } = req.body;
    const MIN_WITHDRAWAL = await getMinWithdrawal();

    if (!amount || !walletAddress) {
      res.status(400).json({ error: "Amount and wallet address required" });
      return;
    }
    if (amount < MIN_WITHDRAWAL) {
      res.status(400).json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL} USDT` });
      return;
    }

    const wallet = await getOrCreateWallet(userId);
    if (parseFloat(wallet.withdrawalBalance) < amount) {
      res.status(400).json({ error: "Insufficient withdrawal balance" });
      return;
    }

    await debitWithdrawalWallet(userId, amount);

    const [tx] = await db.insert(transactionsTable).values({
      userId,
      type: "withdrawal",
      amount: amount.toString(),
      status: "pending",
      walletAddress,
    }).returning();

    res.json({
      id: tx.id,
      userId: tx.userId,
      type: tx.type,
      amount: parseFloat(tx.amount),
      status: tx.status,
      txHash: null,
      screenshotUrl: null,
      createdAt: tx.createdAt.toISOString(),
      gameType: null,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/transactions", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string;

    const conditions = [eq(transactionsTable.userId, userId)];
    if (type) {
      conditions.push(eq(transactionsTable.type, type as any));
    }

    const txs = await db.select().from(transactionsTable)
      .where(and(...conditions))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limit)
      .offset(offset);
    res.json({
      transactions: txs.map(tx => ({
        id: tx.id,
        userId: tx.userId,
        type: tx.type,
        amount: parseFloat(tx.amount),
        status: tx.status,
        txHash: tx.txHash,
        screenshotUrl: tx.screenshotUrl,
        createdAt: tx.createdAt.toISOString(),
        gameType: tx.gameType,
        aiVerified: tx.aiVerified,
        aiConfidence: tx.aiConfidence ? parseFloat(tx.aiConfidence) : null,
        aiFailReason: tx.aiFailReason,
      })),
      total: txs.length,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
