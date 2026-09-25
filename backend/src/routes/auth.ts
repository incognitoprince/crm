import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import { createSessionToken, passwordMatches, sessionTokenHash } from "../middleware/auth.js";

const router = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active || !passwordMatches(password, user.passwordHash)) {
    throw new AppError("Invalid email or password", 401, "LOGIN_FAILED");
  }
  const token = createSessionToken();
  await prisma.session.create({
    data: { tokenHash: sessionTokenHash(token), userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
  });
  res.json({ data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
}));

router.post("/logout", asyncHandler(async (req, res) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (token) await prisma.session.deleteMany({ where: { tokenHash: sessionTokenHash(token) } });
  res.status(204).send();
}));

router.get("/me", asyncHandler(async (req, res) => {
  res.json({ data: req.user });
}));

export { router as authRouter };