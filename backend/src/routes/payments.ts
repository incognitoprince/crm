import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import { ownerOnly } from "../middleware/auth.js";

const router = Router();
router.use(ownerOnly);

const methods = ["CASH", "CARD", "BANK_TRANSFER", "OTHER"] as const;
const paymentSchema = z.object({
  orderId: z.string().min(1),
  amountFils: z.number().int().positive(),
  method: z.enum(methods),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  receivedAt: z.string().datetime().optional(),
});

const paymentInclude = {
  order: {
    include: {
      customer: true,
      shop: true,
    },
  },
} as const;

router.get("/", asyncHandler(async (req, res) => {
  const orderId = typeof req.query.orderId === "string" ? req.query.orderId : undefined;
  const payments = await prisma.payment.findMany({
    where: orderId ? { orderId } : undefined,
    include: paymentInclude,
    orderBy: { receivedAt: "desc" },
    take: 200,
  });
  res.json({ data: payments });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = paymentSchema.parse(req.body);

  const payment = await prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    if (order.status === "CANCELLED") throw new AppError("Cannot record payment for a cancelled order", 400, "ORDER_CANCELLED");

    const nextPaid = order.paidAmountFils + input.amountFils;
    if (nextPaid > order.totalAmountFils) {
      throw new AppError("Payment would exceed the order balance", 400, "PAYMENT_EXCEEDS_BALANCE");
    }

    const created = await tx.payment.create({
      data: {
        orderId: order.id,
        amountFils: input.amountFils,
        method: input.method,
        reference: input.reference || null,
        notes: input.notes || null,
        receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
      },
      include: paymentInclude,
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        paidAmountFils: nextPaid,
        paymentStatus: nextPaid === order.totalAmountFils ? "PAID" : "PARTIAL",
      },
    });

    return created;
  });

  res.status(201).json({ data: payment });
}));

export { router as paymentsRouter };
