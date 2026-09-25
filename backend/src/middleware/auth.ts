import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "./errorHandler.js";

export type AuthUser = { id: string; name: string; email: string; role: "OWNER" | "STAFF" };

declare global {
  namespace Express { interface Request { user?: AuthUser } }
}

function hashToken(token: string) {
  return crypto.createHmac("sha256", env.AUTH_SECRET).update(token).digest("hex");
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function passwordHash(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + derived;
}

export function passwordMatches(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
    if (!session || session.expiresAt < new Date() || !session.user.active) throw new AppError("Session expired or invalid", 401, "AUTH_INVALID");
    req.user = { id: session.user.id, name: session.user.name, email: session.user.email, role: session.user.role };
    next();
  } catch (error) { next(error); }
}

export function ownerOnly(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "OWNER") return next(new AppError("Owner access required", 403, "OWNER_REQUIRED"));
  next();
}

export function sessionTokenHash(token: string) {
  return hashToken(token);
}