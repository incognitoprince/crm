import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const statuses = ["PENDING", "MEASUREMENT", "CUTTING", "STITCHING", "QUALITY_CHECK", "READY", "DELIVERED", "CANCELLED"] as const;
const garmentTypes = ["THOBE", "SHIRT", "TROUSER", "SUIT", "OTHER"] as const;
const upload = multer({
  dest: path.resolve(process.cwd(), "uploads"),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});

const idSchema = z.string().trim().min(1).max(100);

const orderSchema = z.object({
  customerId: idSchema,
  shopId: idSchema.nullable().optional(),
  garment: z.string().trim().min(2).max(80),
  description: z.string().trim().max(250).nullable().optional(),
  quantity: z.number().int().min(1).max(100000).default(1),
  totalAmountFils: z.number().int().min(0).max(100000000),
  paidAmountFils: z.number().int().min(0).max(100000000).default(0),
  deliveryDate: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  sizeBreakdowns: z.array(z.object({ size: z.string().trim().min(1).max(20), quantity: z.number().int().min(1).max(100000) })).max(20).default([]),
});

const includes = {
  customer: true,
  shop: true,
  garmentMaster: true,
  sizeBreakdowns: { orderBy: { size: "asc" as const } },
  referenceImages: { orderBy: { sortOrder: "asc" as const } },
  designs: {
    include: { design: true },
    orderBy: { createdAt: "asc" as const },
  },
};

router.get("/", asyncHandler(async (req, res) => {
  const rawStatus = typeof req.query.status === "string" ? req.query.status : undefined;
  const status = rawStatus ? z.enum(statuses).parse(rawStatus) : undefined;
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    include: includes,
    orderBy: { orderDate: "desc" },
    take: 100,
  });
  res.json({ data: orders });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: includes });
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

  const garment = await prisma.garment.findFirst({ where: { name: input.garment, active: true } });
  if (!garment) throw new AppError("Garment not found or inactive", 400, "GARMENT_NOT_FOUND");

  if (input.shopId) {
    const shop = await prisma.shop.findUnique({ where: { id: input.shopId } });
    if (!shop) throw new AppError("Shop not found", 404, "SHOP_NOT_FOUND");
  }

  const count = await prisma.order.count();
  const paymentStatus = input.paidAmountFils === 0 ? "UNPAID" : input.paidAmountFils === input.totalAmountFils ? "PAID" : "PARTIAL";
  const breakdownTotal = input.sizeBreakdowns.reduce((sum, item) => sum + item.quantity, 0);
  if (input.sizeBreakdowns.length && breakdownTotal !== input.quantity) {
    throw new AppError("Size quantities must equal total quantity", 400, "INVALID_SIZE_BREAKDOWN");
  }

  const order = await prisma.order.create({
    data: {
      customerId: input.customerId,
      shopId: input.shopId ?? null,
      garment: (garmentTypes as readonly string[]).includes(garment.name) ? garment.name as typeof garmentTypes[number] : "OTHER",
      garmentId: garment.id,
      description: input.description?.trim() || null,
      quantity: input.quantity,
      totalAmountFils: input.totalAmountFils,
      paidAmountFils: input.paidAmountFils,
      paymentStatus,
      deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
      notes: input.notes ?? null,
      orderNo: "ORD-" + new Date().getFullYear() + "-" + String(count + 1).padStart(3, "0"),
      sizeBreakdowns: { create: input.sizeBreakdowns },
    },
    include: includes,
  });
  res.status(201).json({ data: order });
}));

router.post("/:id/reference-images", upload.single("image"), asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  if (!req.file) throw new AppError("A JPG, PNG, or WEBP image is required", 400, "IMAGE_REQUIRED");
  const ext = path.extname(req.file.originalname).toLowerCase() || ".img";
  const finalName = crypto.randomUUID() + ext;
  const finalPath = path.resolve(process.cwd(), "uploads", finalName);
  await fs.rename(req.file.path, finalPath);
  const image = await prisma.orderReferenceImage.create({
    data: { orderId: order.id, fileName: req.file.originalname, storagePath: "/uploads/" + finalName, mimeType: req.file.mimetype },
  });
  res.status(201).json({ data: image });
}));

router.patch("/:id/status", asyncHandler(async (req, res) => {
  const input = z.object({ status: z.enum(statuses) }).parse(req.body);
  const order = await prisma.$transaction(async tx => {
    const updated = await tx.order.update({
      where: { id: req.params.id },
      data: { status: input.status },
      include: includes,
    });
    if (input.status === "DELIVERED" || input.status === "CANCELLED") {
      await tx.masterAssignment.updateMany({
        where: {
          completedAt: null,
          orderDesign: { orderId: updated.id },
        },
        data: { completedAt: new Date() },
      });
    }
    return updated;
  }).catch(() => null);
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  res.json({ data: order });
}));

export { router as ordersRouter };
