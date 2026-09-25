import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import { ownerOnly } from "../middleware/auth.js";

const router = Router();
router.use(ownerOnly);
const upload = multer({ dest: path.resolve(process.cwd(), "uploads"), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, ["image/jpeg","image/png","image/webp"].includes(file.mimetype)) });

const lineSchema = z.object({
  orderId: z.string().optional().nullable(),
  description: z.string().trim().min(1).max(300),
  quantity: z.coerce.number().int().positive(),
  unitPriceFils: z.coerce.number().int().nonnegative(),
});

const billSchema = z.object({
  invoiceNo: z.string().trim().max(80).optional().nullable(),
  issuedAt: z.string().datetime().optional().nullable(),
  shopId: z.string().min(1),
  customerId: z.string().min(1),
  subject: z.string().trim().max(300).optional().nullable(),
  modelNo: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  lines: z.array(lineSchema).min(1),
});

const include = {
  shop: true,
  customer: true,
  lines: { include: { order: { include: { customer: true, shop: true, sizeBreakdowns: true } } }, orderBy: { createdAt: "asc" } },
  order: { include: { customer: true, shop: true, payments: { orderBy: { receivedAt: "asc" } }, sizeBreakdowns: true } },
} as const;

router.get("/", asyncHandler(async (_req, res) => {
  const invoices = await prisma.invoice.findMany({ include, orderBy: { issuedAt: "desc" }, take: 200 });
  res.json({ data: invoices });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include });
  if (!invoice) throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
  res.json({ data: invoice });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = billSchema.parse(req.body);
  const shop = await prisma.shop.findUnique({ where: { id: input.shopId } });
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!shop || !shop.active) throw new AppError("Shop not found or inactive", 400, "SHOP_NOT_FOUND");
  if (!customer) throw new AppError("Customer not found", 400, "CUSTOMER_NOT_FOUND");

  const orderIds = [...new Set(input.lines.map(line => line.orderId).filter(Boolean) as string[])];
  const orders = orderIds.length ? await prisma.order.findMany({ where: { id: { in: orderIds } }, include: { sizeBreakdowns: true } }) : [];
  if (orders.length !== orderIds.length) throw new AppError("One or more selected orders were not found", 400, "ORDER_NOT_FOUND");
  if (orders.some(order => order.customerId !== customer.id)) throw new AppError("Invoice lines must belong to the selected customer", 400, "CUSTOMER_MISMATCH");
  if (orders.some(order => order.status === "CANCELLED")) throw new AppError("Cancelled orders cannot be billed", 400, "ORDER_CANCELLED");

  const totalFils = input.lines.reduce((sum, line) => sum + line.quantity * line.unitPriceFils, 0);
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo: input.invoiceNo?.trim() || `INV-${year}-${String(count + 1).padStart(4, "0")}`,
      issuedAt: input.issuedAt ? new Date(input.issuedAt) : new Date(),
      shopId: shop.id,
      customerId: customer.id,
      orderId: orderIds[0] ?? null,
      subject: input.subject ?? null,
      modelNo: input.modelNo ?? null,
      notes: input.notes ?? null,
      totalFils,
      lines: { create: input.lines.map(line => ({ orderId: line.orderId ?? null, description: line.description, quantity: line.quantity, unitPriceFils: line.unitPriceFils, totalFils: line.quantity * line.unitPriceFils, orderDate: orders.find(order => order.id === line.orderId)?.orderDate ?? null })) },
    },
    include,
  });
  res.status(201).json({ data: invoice });
}));

router.post("/:id/model-image", upload.single("image"), asyncHandler(async (req, res) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!invoice) throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
  if (!req.file) throw new AppError("A JPG, PNG, or WEBP image is required", 400, "IMAGE_REQUIRED");
  const ext = path.extname(req.file.originalname).toLowerCase() || ".img";
  const finalName = "invoice-model-" + crypto.randomUUID() + ext;
  const finalPath = path.resolve(process.cwd(), "uploads", finalName);
  await fs.rename(req.file.path, finalPath);
  const updated = await prisma.invoice.update({ where: { id: invoice.id }, data: { modelImagePath: "/uploads/" + finalName }, include });
  res.status(201).json({ data: updated });
}));

export { router as billsRouter };
