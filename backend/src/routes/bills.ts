import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const router = Router();

const invoiceInclude = {
  order: {
    include: {
      customer: true,
      shop: true,
      payments: { orderBy: { receivedAt: "asc" } },
    },
  },
} as const;

router.get("/", asyncHandler(async (_req, res) => {
  const invoices = await prisma.invoice.findMany({
    include: invoiceInclude,
    orderBy: { issuedAt: "desc" },
    take: 200,
  });
  res.json({ data: invoices });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: invoiceInclude,
  });
  if (!invoice) throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
  res.json({ data: invoice });
}));

router.post("/", asyncHandler(async (req, res) => {
  const orderId = typeof req.body?.orderId === "string" ? req.body.orderId : "";
  if (!orderId) throw new AppError("Order is required", 400, "ORDER_REQUIRED");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { invoice: true },
  });
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  if (order.status === "CANCELLED") throw new AppError("Cannot create a bill for a cancelled order", 400, "ORDER_CANCELLED");

  if (order.invoice) {
    const existing = await prisma.invoice.findUnique({ where: { id: order.invoice.id }, include: invoiceInclude });
    return res.status(200).json({ data: existing, existing: true });
  }

  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo: `INV-${year}-${String(count + 1).padStart(4, "0")}`,
      orderId: order.id,
    },
    include: invoiceInclude,
  });

  res.status(201).json({ data: invoice, existing: false });
}));

export { router as billsRouter };
