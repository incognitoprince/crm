import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const idSchema = z.string().trim().min(1).max(100);

const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().trim().max(250).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  shopId: idSchema.optional().nullable(),
});

router.get("/", asyncHandler(async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const customers = await prisma.customer.findMany({
    where: q ? { OR: [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { customerNo: { contains: q, mode: "insensitive" } },
    ] } : undefined,
    include: { shop: true, _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ data: customers });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      shop: true,
      measurements: { orderBy: { garment: "asc" } },
      orders: { include: { shop: true, sizeBreakdowns: { orderBy: { size: "asc" } }, referenceImages: { orderBy: { sortOrder: "asc" } } }, orderBy: { orderDate: "desc" }, take: 20 },
    },
  });
  if (!customer) throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
  if (req.user?.role !== "OWNER") {
    customer.orders = customer.orders.map(({ totalAmountFils: _total, paidAmountFils: _paid, paymentStatus: _status, ...safe }) => safe as typeof customer.orders[number]);
  }
  res.json({ data: customer });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = customerSchema.parse(req.body);
  if (input.shopId) {
    const shop = await prisma.shop.findUnique({ where: { id: input.shopId } });
    if (!shop) throw new AppError("Shop not found", 404, "SHOP_NOT_FOUND");
  }
  const count = await prisma.customer.count();
  const customer = await prisma.customer.create({
    data: {
      ...input,
      email: input.email || null,
      customerNo: "CUST-" + String(1001 + count).padStart(4, "0"),
    },
    include: { shop: true },
  });
  res.status(201).json({ data: customer });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const input = customerSchema.partial().parse(req.body);
  if (input.shopId) {
    const shop = await prisma.shop.findUnique({ where: { id: input.shopId } });
    if (!shop) throw new AppError("Shop not found", 404, "SHOP_NOT_FOUND");
  }
  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: { ...input, email: input.email === "" ? null : input.email },
    include: { shop: true },
  }).catch(() => null);
  if (!customer) throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
  res.json({ data: customer });
}));

export { router as customersRouter };
