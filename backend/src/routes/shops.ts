import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => {
  const shops = await prisma.shop.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  res.json({ data: shops });
}));

export { router as shopsRouter };
