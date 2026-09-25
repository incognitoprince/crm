import { Router } from "express";
import { ownerOnly } from "../middleware/auth.js";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(ownerOnly);

const closedStatuses = { notIn: ["CANCELLED" as const] };
const activeOrderStatuses = { notIn: ["DELIVERED" as const, "CANCELLED" as const] };

router.get("/summary", asyncHandler(async (_req, res) => {
  const now = new Date();

  const [
    customers,
    orders,
    pending,
    measurement,
    cutting,
    stitching,
    production,
    quality,
    ready,
    delivered,
    cancelled,
    revenue,
    paid,
    outstandingTotals,
    delayed,
    shops,
    shopOrderTotals,
    shopStatusTotals,
    upcoming,
    pendingPayments,
    recentOrders,
    topDesigns,
  ] = await Promise.all([
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "MEASUREMENT" } }),
    prisma.order.count({ where: { status: "CUTTING" } }),
    prisma.order.count({ where: { status: "STITCHING" } }),
    prisma.order.count({ where: { status: { in: ["MEASUREMENT", "CUTTING", "STITCHING"] } } }),
    prisma.order.count({ where: { status: "QUALITY_CHECK" } }),
    prisma.order.count({ where: { status: "READY" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.aggregate({ where: { status: closedStatuses }, _sum: { totalAmountFils: true } }),
    prisma.order.aggregate({
      where: { status: closedStatuses },
      _sum: { paidAmountFils: true },
    }),
    prisma.order.aggregate({
      where: {
        status: closedStatuses,
        totalAmountFils: { gt: 0 },
      },
      _sum: { totalAmountFils: true, paidAmountFils: true },
    }),
    prisma.order.count({
      where: {
        deliveryDate: { lt: now },
        status: activeOrderStatuses,
      },
    }),
    prisma.shop.findMany({
      where: { active: true },
      include: { _count: { select: { customers: true, orders: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.order.groupBy({
      by: ["shopId"],
      where: { status: closedStatuses },
      _count: { _all: true },
      _sum: { totalAmountFils: true },
    }),
    prisma.order.groupBy({
      by: ["shopId", "status"],
      where: { status: closedStatuses },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: {
        deliveryDate: { gte: now },
        status: activeOrderStatuses,
      },
      include: { customer: true, shop: true, garmentMaster: true },
      orderBy: { deliveryDate: "asc" },
      take: 6,
    }),
    prisma.order.findMany({
      where: {
        status: closedStatuses,
        totalAmountFils: { gt: 0 },
      },
      include: { customer: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.order.findMany({
      include: { customer: true, shop: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.design.findMany({
      where: { active: true },
      include: { garmentMaster: true, _count: { select: { orderDesigns: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const shopTotals = new Map(shopOrderTotals.map(item => [
    item.shopId ?? "",
    {
      orders: item._count._all,
      revenueFils: item._sum.totalAmountFils ?? 0,
    },
  ]));

  const shopStatusMap = new Map(shopStatusTotals.map(item => [
    `${item.shopId ?? ""}:${item.status}`,
    item._count._all,
  ]));

  const topDesignRows = topDesigns
    .filter(design => design._count.orderDesigns > 0)
    .sort((a, b) => b._count.orderDesigns - a._count.orderDesigns)
    .slice(0, 6);

  const activity = recentOrders.map(order => ({
    id: order.id,
    type: order.createdAt.getTime() === order.updatedAt.getTime() ? "ORDER_CREATED" : "ORDER_UPDATED",
    orderId: order.id,
    orderNo: order.orderNo,
    customerName: order.customer.name,
    status: order.status,
    amountFils: order.totalAmountFils,
    paidAmountFils: order.paidAmountFils,
    timestamp: (order.createdAt.getTime() === order.updatedAt.getTime() ? order.createdAt : order.updatedAt).toISOString(),
  }));

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
      paidFils: paid._sum.paidAmountFils ?? 0,
      outstandingFils: Math.max(
        0,
        (outstandingTotals._sum.totalAmountFils ?? 0) - (outstandingTotals._sum.paidAmountFils ?? 0),
      ),
      delayed,
      shops: shops.map(shop => {
        const totals = shopTotals.get(shop.id);
        return {
          id: shop.id,
          name: shop.name,
          area: shop.area,
          customers: shop._count.customers,
          orders: totals?.orders ?? 0,
          completed: shopStatusMap.get(`${shop.id}:DELIVERED`) ?? 0,
          pending: shopStatusMap.get(`${shop.id}:PENDING`) ?? 0,
          inProgress: [
            "MEASUREMENT",
            "CUTTING",
            "STITCHING",
            "QUALITY_CHECK",
            "READY",
          ].reduce((total, status) => total + (shopStatusMap.get(`${shop.id}:${status}`) ?? 0), 0),
          revenueFils: totals?.revenueFils ?? 0,
        };
      }),
      orderStatus: {
        PENDING: pending,
        MEASUREMENT: measurement,
        CUTTING: cutting,
        STITCHING: stitching,
        QUALITY_CHECK: quality,
        READY: ready,
        DELIVERED: delivered,
        CANCELLED: cancelled,
      },
      upcomingDeliveries: upcoming.map(order => ({
        id: order.id,
        orderNo: order.orderNo,
        customerName: order.customer.name,
        garment: order.garmentMaster?.name ?? order.garment,
        deliveryDate: order.deliveryDate?.toISOString() ?? null,
        status: order.status,
      })),
      pendingPayments: pendingPayments
        .map(order => ({
          id: order.id,
          orderNo: order.orderNo,
          customerName: order.customer.name,
          totalAmountFils: order.totalAmountFils,
          paidAmountFils: order.paidAmountFils,
          outstandingFils: Math.max(0, order.totalAmountFils - order.paidAmountFils),
        }))
        .filter(order => order.outstandingFils > 0),
      activity,
      topDesigns: topDesignRows.map(design => ({
        id: design.id,
        designNo: design.designNo,
        name: design.name,
        imagePath: design.imagePath,
        garment: design.garmentMaster?.name ?? design.garment,
        orders: design._count.orderDesigns,
      })),
    },
  });
}));

export { router as dashboardRouter };
