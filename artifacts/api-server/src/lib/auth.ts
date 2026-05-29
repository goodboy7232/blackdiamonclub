import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const _jwtSecretRaw = process.env.JWT_SECRET;
if (!_jwtSecretRaw) {
  console.warn("[auth] WARNING: JWT_SECRET is not set. Using an insecure ephemeral secret. Set JWT_SECRET in Replit Secrets before deploying.");
}
const JWT_SECRET: string = _jwtSecretRaw ?? randomBytes(32).toString("hex");
const JWT_EXPIRY = "7d";
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function parseToken(token: string): { userId: number } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (typeof payload.userId !== "number") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const parsed = parseToken(token);
  if (!parsed) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, parsed.userId)).limit(1);
  if (!users.length || users[0].isBanned) {
    res.status(401).json({ error: "User not found or banned" });
    return;
  }

  (req as any).userId = parsed.userId;
  (req as any).user = users[0];
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    const user = (req as any).user;
    if (!user?.isAdmin) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}
