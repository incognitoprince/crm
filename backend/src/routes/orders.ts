import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const statuses = ["PENDING", "MEASUREMENT", "CUTTING", "STITCHING", "QUALITY_CHECK", "READY", "DELIVERED", "CANCELLED"] as const;
const garments = ["THOBE", "SHIRT", "TROUSER", "SUIT", "OTHER"] as const;

const orderSchema = z.object({
  customerId: z.string().cuid(),
  shopId: z.string().cuid().nullable().optional(),
  garment: z.enum(garments),
  description: z.string().trim().min(2).max(250),
  quantity: z.number().int().min(1).max(100).default(1),
  totalAmountFils: z.number().int().min(0).max(100000000),
  paidAmountFils: z.number().int().min(0).max(100000000).default(0),
  deliveryDate: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

router.get("/", asyncHandler(async (req, res) => {
  const rawStatus = typeof req.query.status === "string" ? req.query.status : undefined;
  const status = rawStatus ? z.enum(statuses).parse(rawStatus) : undefined;
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    include: { customer: true, shop: true },
    orderBy: { orderDate: "desc" },
    take: 100,
  });
  res.json({ data: orders });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { customer: true, shop: true },
  });
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  res.json({ data: order });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = orderSchema.parse(req.body);
  if (input.paidAmountFils > input.totalAmountFils) {
    throw new AppError("Paid amount cannot exceed order value", 400, "INVALID_PAYMENT");
  }
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");

  const count = await prisma.order.count();
  const paymentStatus = input.paidAmountFils === 0 ? "UNPAID" : input.paidAmountFils === input.totalAmountFils ? "PAID" : "PARTIAL";
  const order = await prisma.order.create({
    data: {
      ...input,
      orderNo: "ORD-" + new Date().getFullYear() + "-" + String(count + 1).padStart(3, "0"),
      deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
      paymentStatus,
    },
    include: { customer: true, shop: true },
  });
  res.status(201).json({ data: order });
}));

router.patch("/:id/status", asyncHandler(async (req, res) => {
  const input = z.object({ status: z.enum(statuses) }).parse(req.body);
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: input.status },
    include: { customer: true, shop: true },
  }).catch(() => null);
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  res.json({ data: order });
}));

export { router as ordersRouter };
