import pino from "pino";
import { env } from "../config/env.js";

const secretKeys = ["password", "token", "secret", "authorization", "jwt", "database_url"];

function redactBinding(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(input)) {
      if (secretKeys.some((part) => key.toLowerCase().includes(part))) {
        output[key] = "[redacted]";
      } else {
        output[key] = redactBinding(nested);
      }
    }
    return output;
  }
  return value;
}

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "DATABASE_URL",
      "JWT_SECRET",
    ],
    censor: "[redacted]",
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        }
      : undefined,
  hooks: {
    logMethod(inputArgs, method) {
      if (inputArgs.length > 0) {
        inputArgs[0] = redactBinding(inputArgs[0]);
      }
      return method.apply(this, inputArgs);
    },
  },
});
