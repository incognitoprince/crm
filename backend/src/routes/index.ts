import { Router } from "express";
import { healthRouter } from "./health.js";
import { customersRouter } from "./customers.js";
import { shopsRouter } from "./shops.js";
import { ordersRouter } from "./orders.js";
import { dashboardRouter } from "./dashboard.js";
import { measurementsRouter } from "./measurements.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/customers", customersRouter);
apiRouter.use("/shops", shopsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/measurements", measurementsRouter);
apiRouter.use("/dashboard", dashboardRouter);
