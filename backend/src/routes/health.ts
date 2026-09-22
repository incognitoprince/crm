import { Router } from "express";
import { getHealth, getLive, getReady } from "../controllers/healthController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthRouter = Router();

healthRouter.get("/live", getLive);
healthRouter.get("/ready", asyncHandler(getReady));
healthRouter.get("/", asyncHandler(getHealth));
