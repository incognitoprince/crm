import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { env, isProduction } from "../config/env.js";
import { AppError } from "./errorHandler.js";

export type AuthUser = { id: string; name: string; username: string; email?: string | null; role: "ADMIN" | "STAFF" };

export const SESSION_COOKIE = isProduction ? "__Host-tailoring-session" : "tailoring-session";

declare global {
  namespace Express { interface Request { user?: AuthUser } }
}

function hashToken(token: string) {
  return crypto.createHmac("sha256", env.AUTH_SECRET).update(token).digest("hex");
}

export function readCookie(req: Request, name: string) {
  const header = req.header("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return "";
}

function cookieOptions(maxAgeSeconds?: number) {
  const parts = [
    `${SESSION_COOKIE}=VALUE`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    ...(isProduction ? ["Secure"] : []),
  ];
  if (maxAgeSeconds !== undefined) parts.push(`Max-Age=${maxAgeSeconds}`);
  return parts;
}

export function setSessionCookie(res: Response, token: string, maxAgeSeconds?: number) {
  const parts = cookieOptions(maxAgeSeconds);
  parts[0] = `${SESSION_COOKIE}=${token}`;
  res.setHeader("Set-Cookie", parts.join("; "));
  res.setHeader("Cache-Control", "no-store");
}

export function clearSessionCookie(res: Response) {
  res.setHeader("Set-Cookie", cookieOptions(0).join("; ").replace("=VALUE", "="));
  res.setHeader("Clear-Site-Data", '"cache", "cookies", "storage"');
  res.setHeader("Cache-Control", "no-store");
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
  if (!salt || !expected || expected.length !== 128) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = readCookie(req, SESSION_COOKIE);
    if (!token) throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
    const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
    if (!session || session.expiresAt < new Date() || !session.user.active) {
      throw new AppError("Session expired or invalid", 401, "AUTH_INVALID");
    }
    req.user = {
      id: session.user.id,
      name: session.user.name,
      username: session.user.username ?? session.user.name,
      email: session.user.email,
      role: session.user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function verifySameOrigin(req: Request, _res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
  const origin = req.header("origin");
  if (!origin) return next();
  const allowed = env.CORS_ORIGIN.split(",").map(value => value.trim()).filter(Boolean);
  if (!allowed.includes(origin)) {
    return next(new AppError("Request origin is not allowed", 403, "ORIGIN_NOT_ALLOWED"));
  }
  next();
}

export function adminOnly(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") return next(new AppError("Admin access required", 403, "ADMIN_REQUIRED"));
  next();
}

export function sessionTokenHash(token: string) {
  return hashToken(token);
}
