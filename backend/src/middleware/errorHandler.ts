import type { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger.js";
import { isProduction } from "../config/env.js";

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.path} was not found`,
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const error = err instanceof AppError ? err : null;
  const statusCode = error?.statusCode ?? 500;
  const code = error?.code ?? "INTERNAL_ERROR";
  const message = error?.message ?? "An unexpected error occurred";

  logger.error({ err }, "Unhandled API error");

  res.status(statusCode).json({
    code,
    message,
    ...(isProduction ? {} : { detail: err instanceof Error ? err.message : String(err) }),
  });
}
