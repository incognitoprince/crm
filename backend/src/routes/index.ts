import { Router } from "express";
import { healthRouter } from "./health.js";
import { authRouter } from "./auth.js";
import { customersRouter } from "./customers.js";
import { shopsRouter } from "./shops.js";
import { ordersRouter } from "./orders.js";
import { dashboardRouter } from "./dashboard.js";
import { measurementsRouter } from "./measurements.js";
import { mastersRouter } from "./masters.js";
import { designsRouter } from "./designs.js";
import { assignmentsRouter } from "./assignments.js";
import { garmentsRouter } from "./garments.js";
import { paymentsRouter } from "./payments.js";
import { billsRouter } from "./bills.js";
import { authenticate } from "../middleware/auth.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use(authenticate);

apiRouter.use("/customers", customersRouter);
apiRouter.use("/shops", shopsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/measurements", measurementsRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/masters", mastersRouter);
apiRouter.use("/designs", designsRouter);
apiRouter.use("/production", assignmentsRouter);
apiRouter.use("/garments", garmentsRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/bills", billsRouter);
