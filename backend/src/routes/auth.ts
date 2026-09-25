import { Router } from "express";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import { authenticate, clearSessionCookie, createSessionToken, passwordMatches, readCookie, sessionTokenHash, setSessionCookie, SESSION_COOKIE } from "../middleware/auth.js";
import { logger } from "../config/logger.js";

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { code: "LOGIN_RATE_LIMITED", message: "Too many failed login attempts. Try again later." },
});
const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
  rememberMe: z.boolean().default(false),
});

router.post("/login", loginLimiter, asyncHandler(async (req, res) => {
  const { username, password, rememberMe } = loginSchema.parse(req.body);
  const normalizedUsername = username.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { username: normalizedUsername } });

  if (!user || !user.active || !passwordMatches(password, user.passwordHash)) {
    logger.warn({ username: normalizedUsername, ip: req.ip }, "Authentication failed");
    throw new AppError("Invalid username or password", 401, "LOGIN_FAILED");
  }

  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  const token = createSessionToken();
  const maxAgeSeconds = rememberMe ? 60 * 60 * 24 * 30 : undefined;
  await prisma.session.create({
    data: {
      tokenHash: sessionTokenHash(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * (rememberMe ? 24 * 30 : 8)),
    },
  });

  setSessionCookie(res, token, maxAgeSeconds);
  logger.info({ userId: user.id, username: user.username, role: user.role, ip: req.ip }, "Authentication succeeded");
  res.json({ data: { user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role } } });
}));

router.post("/logout", authenticate, asyncHandler(async (req, res) => {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) await prisma.session.deleteMany({ where: { tokenHash: sessionTokenHash(token) } });
  clearSessionCookie(res);
  logger.info({ userId: req.user?.id, username: req.user?.username, ip: req.ip }, "Session ended");
  res.status(204).send();
}));

router.get("/me", authenticate, asyncHandler(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ data: req.user });
}));

export { router as authRouter };
