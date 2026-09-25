import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_NAME: z.string().default("tailoring-crm"),
  APP_VERSION: z.string().default("0.1.0"),
  LOG_LEVEL: z.string().default("info"),
  CORS_ORIGIN: z.string().min(1).refine(value => value !== "*", "CORS_ORIGIN must list explicit trusted origins"),
  DATABASE_URL: z.string().min(1),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_SECRET: z.string().min(32),
  ADMIN_USERNAME: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/),
  ADMIN_PASSWORD: z.string().min(12).max(200),
  SEED_DEMO_DATA: z.enum(["true", "false"]).default("false"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment configuration: ${issues.join("; ")}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
