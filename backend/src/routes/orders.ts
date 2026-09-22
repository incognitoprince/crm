import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : undefined,
    include: { customer: true, shop: true },
    orderBy: { orderDate: "desc" },
    take: 100,
  });
  res.json({ data: orders });
}));

router.patch("/:id/status", asyncHandler(async (req, res) => {
  const input = z.object({
    status: z.enum(["PENDING", "MEASUREMENT", "CUTTING", "STITCHING", "QUALITY_CHECK", "READY", "DELIVERED", "CANCELLED"]),
  }).parse(req.body);
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: input.status },
    include: { customer: true, shop: true },
  }).catch(() => null);
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  res.json({ data: order });
}));

export { router as ordersRouter };
