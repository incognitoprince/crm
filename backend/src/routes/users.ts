import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import { adminOnly, passwordHash } from "../middleware/auth.js";

const router = Router();
router.use(adminOnly);
const publicSelect = { id: true, name: true, username: true, email: true, role: true, active: true, createdAt: true } as const;

router.get("/", asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({ select: publicSelect, orderBy: { createdAt: "asc" } });
  res.json({ data: users });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(2).max(100),
    username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/),
    password: z.string().min(8).max(100),
    role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
  }).parse(req.body);
  const user = await prisma.user.create({ data: { name: input.name, username: input.username.toLowerCase(), passwordHash: passwordHash(input.password), role: input.role }, select: publicSelect }).catch(error => {
    if (error?.code === "P2002") throw new AppError("Username already exists", 409, "USER_EXISTS");
    throw error;
  });
  res.status(201).json({ data: user });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const input = z.object({ name: z.string().trim().min(2).max(100).optional(), role: z.enum(["ADMIN", "STAFF"]).optional(), active: z.boolean().optional(), password: z.string().min(8).max(100).optional() }).parse(req.body);
  if (req.params.id === req.user?.id && (input.active === false || input.role === "STAFF")) throw new AppError("You cannot remove your own admin access or deactivate your own account", 400, "SELF_ACCESS_CHANGE");
  const data: { name?: string; role?: "ADMIN" | "STAFF"; active?: boolean; passwordHash?: string } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.role !== undefined) data.role = input.role;
  if (input.active !== undefined) data.active = input.active;
  if (input.password) data.passwordHash = passwordHash(input.password);
  const user = await prisma.user.update({ where: { id: req.params.id }, data, select: publicSelect }).catch(() => null);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  res.json({ data: user });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  if (req.params.id === req.user?.id) throw new AppError("You cannot delete your own account", 400, "SELF_DELETE");
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  if (target.role === "ADMIN" && await prisma.user.count({ where: { role: "ADMIN", active: true } }) <= 1) throw new AppError("At least one active admin account must remain", 400, "LAST_ADMIN");
  await prisma.user.delete({ where: { id: target.id } });
  res.status(204).send();
}));
export { router as usersRouter };
