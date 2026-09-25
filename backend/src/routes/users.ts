import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import { ownerOnly, passwordHash } from "../middleware/auth.js";

const router = Router();
router.use(ownerOnly);
const publicSelect = { id: true, name: true, email: true, role: true, active: true, createdAt: true } as const;

router.get("/", asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({ select: publicSelect, orderBy: { createdAt: "asc" } });
  res.json({ data: users });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    role: z.enum(["OWNER", "STAFF"]).default("STAFF"),
  }).parse(req.body);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email.toLowerCase(), passwordHash: passwordHash(input.password), role: input.role },
    select: publicSelect,
  }).catch(error => {
    if (error?.code === "P2002") throw new AppError("Email already exists", 409, "USER_EXISTS");
    throw error;
  });
  res.status(201).json({ data: user });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    active: z.boolean().optional(),
    password: z.string().min(8).max(100).optional(),
  }).parse(req.body);
  const data: { name?: string; active?: boolean; passwordHash?: string } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.active !== undefined) data.active = input.active;
  if (input.password) data.passwordHash = passwordHash(input.password);
  const user = await prisma.user.update({ where: { id: req.params.id }, data, select: publicSelect }).catch(() => null);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  res.json({ data: user });
}));

export { router as usersRouter };