import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const id = z.string().trim().min(1).max(100);
const size = z.string().trim().min(1).max(20);

const assignmentSchema = z.object({
  masterId: id,
  size,
  quantity: z.number().int().min(1).max(100000),
  notes: z.string().trim().max(500).nullable().optional(),
});

const productionInclude = {
  design: true,
  assignments: { include: { master: { include: { shop: true } } }, orderBy: { createdAt: "asc" as const } },
};

router.get("/orders/:orderId", asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: {
      customer: true,
      shop: true,
      sizeBreakdowns: { orderBy: { size: "asc" } },
      designs: productionInclude,
    },
  });
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  res.json({ data: order });
}));

router.post("/orders/:orderId/designs", asyncHandler(async (req, res) => {
  const input = z.object({ designId: id, notes: z.string().trim().max(500).nullable().optional() }).parse(req.body);
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  const design = await prisma.design.findUnique({ where: { id: input.designId } });
  if (!design || !design.active) throw new AppError("Design not found or inactive", 404, "DESIGN_NOT_FOUND");
  if (design.garment !== order.garment) throw new AppError("Design garment must match the order garment", 400, "GARMENT_MISMATCH");
  const row = await prisma.orderDesign.create({
    data: { orderId: order.id, designId: design.id, notes: input.notes ?? null },
    include: productionInclude,
  }).catch(error => {
    if (error?.code === "P2002") throw new AppError("This design is already linked to the order", 409, "ORDER_DESIGN_EXISTS");
    throw error;
  });
  res.status(201).json({ data: row });
}));

router.post("/order-designs/:orderDesignId/assignments", asyncHandler(async (req, res) => {
  const input = assignmentSchema.parse(req.body);
  const od = await prisma.orderDesign.findUnique({
    where: { id: req.params.orderDesignId },
    include: { order: { include: { shop: true, sizeBreakdowns: true } } },
  });
  if (!od) throw new AppError("Order design not found", 404, "ORDER_DESIGN_NOT_FOUND");
  if (!od.order.shopId) throw new AppError("Assign a stitching shop to the order before assigning a master", 400, "ORDER_SHOP_REQUIRED");
  const master = await prisma.master.findUnique({ where: { id: input.masterId } });
  if (!master || !master.active) throw new AppError("Master not found or inactive", 404, "MASTER_NOT_FOUND");
  if (master.shopId !== od.order.shopId) throw new AppError("Master must belong to the order's stitching shop", 400, "MASTER_SHOP_MISMATCH");
  const breakdown = od.order.sizeBreakdowns.find(item => item.size.toUpperCase() === input.size.toUpperCase());
  if (!breakdown) throw new AppError("Selected size is not part of this order", 400, "SIZE_NOT_IN_ORDER");
  const assigned = await prisma.masterAssignment.aggregate({
    where: { orderDesignId: od.id, size: breakdown.size },
    _sum: { quantity: true },
  });
  const assignedQty = assigned._sum.quantity ?? 0;
  if (assignedQty + input.quantity > breakdown.quantity) {
    throw new AppError("Assignment exceeds size quantity. Remaining: " + (breakdown.quantity - assignedQty), 400, "ASSIGNMENT_EXCEEDS_QUANTITY");
  }
  const row = await prisma.masterAssignment.create({
    data: { orderDesignId: od.id, masterId: input.masterId, size: breakdown.size, quantity: input.quantity, notes: input.notes ?? null },
    include: { master: { include: { shop: true } } },
  });
  res.status(201).json({ data: row });
}));

router.patch("/assignments/:id", asyncHandler(async (req, res) => {
  const input = z.object({ masterId: id.optional(), quantity: z.number().int().min(1).max(100000).optional(), notes: z.string().trim().max(500).nullable().optional() }).parse(req.body);
  const current = await prisma.masterAssignment.findUnique({ where: { id: req.params.id }, include: { orderDesign: { include: { order: { include: { sizeBreakdowns: true } } } } } });
  if (!current) throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
  if (current.startedAt && input.masterId && input.masterId !== current.masterId) throw new AppError("Master cannot be changed after work has started", 400, "ASSIGNMENT_LOCKED");
  if (input.masterId) {
    const master = await prisma.master.findUnique({ where: { id: input.masterId } });
    if (!master || !master.active) throw new AppError("Master not found or inactive", 404, "MASTER_NOT_FOUND");
    if (master.shopId !== current.orderDesign.order.shopId) throw new AppError("Master must belong to the order's stitching shop", 400, "MASTER_SHOP_MISMATCH");
  }
  if (input.quantity !== undefined) {
    const total = current.orderDesign.order.sizeBreakdowns.find(s => s.size === current.size)?.quantity ?? 0;
    const other = await prisma.masterAssignment.aggregate({ where: { orderDesignId: current.orderDesignId, size: current.size, id: { not: current.id } }, _sum: { quantity: true } });
    if ((other._sum.quantity ?? 0) + input.quantity > total) throw new AppError("Assignment exceeds size quantity", 400, "ASSIGNMENT_EXCEEDS_QUANTITY");
  }
  const row = await prisma.masterAssignment.update({ where: { id: current.id }, data: input, include: { master: { include: { shop: true } } } });
  res.json({ data: row });
}));

router.patch("/assignments/:id/start", asyncHandler(async (req, res) => {
  const row = await prisma.masterAssignment.update({ where: { id: req.params.id }, data: { startedAt: new Date() }, include: { master: true } }).catch(() => null);
  if (!row) throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
  res.json({ data: row });
}));

router.delete("/assignments/:id", asyncHandler(async (req, res) => {
  const current = await prisma.masterAssignment.findUnique({ where: { id: req.params.id } });
  if (!current) throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
  if (current.startedAt) throw new AppError("Started assignments cannot be removed", 400, "ASSIGNMENT_LOCKED");
  await prisma.masterAssignment.delete({ where: { id: current.id } });
  res.status(204).send();
}));

export { router as assignmentsRouter };
