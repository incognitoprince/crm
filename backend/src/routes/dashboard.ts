import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/summary", asyncHandler(async (_req, res) => {
  const [customers, orders, pending, production, quality, ready, delivered, revenue, shops] = await Promise.all([
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: { in: ["MEASUREMENT", "CUTTING", "STITCHING"] } } }),
    prisma.order.count({ where: { status: "QUALITY_CHECK" } }),
    prisma.order.count({ where: { status: "READY" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.aggregate({ _sum: { totalAmountFils: true } }),
    prisma.shop.findMany({
      where: { active: true },
      include: { _count: { select: { customers: true, orders: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  res.json({
    data: {
      customers,
      orders,
      pending,
      production,
      quality,
      ready,
      delivered,
      revenueFils: revenue._sum.totalAmountFils ?? 0,
      shops: shops.map(shop => ({
        id: shop.id,
        name: shop.name,
        area: shop.area,
        customers: shop._count.customers,
        orders: shop._count.orders,
      })),
    },
  });
}));

export { router as dashboardRouter };
