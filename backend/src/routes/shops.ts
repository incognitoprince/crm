import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const shopSchema = z.object({
  name: z.string().trim().min(2).max(100),
  area: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional().nullable(),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  arabicName: z.string().trim().max(200).optional().nullable(),
  englishName: z.string().trim().max(200).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  logoUrl: z.string().trim().url().optional().nullable(),
});

router.get("/", asyncHandler(async (_req, res) => {
  const shops = await prisma.shop.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { customers: true, orders: true } } },
  });
  res.json({ data: shops });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = shopSchema.parse(req.body);
  const shop = await prisma.shop.create({ data: input });
  res.status(201).json({ data: shop });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const input = shopSchema.partial().parse(req.body);
  const shop = await prisma.shop.update({ where: { id: req.params.id }, data: input }).catch(() => null);
  if (!shop) throw new AppError("Shop not found", 404, "SHOP_NOT_FOUND");
  res.json({ data: shop });
}));

export { router as shopsRouter };
