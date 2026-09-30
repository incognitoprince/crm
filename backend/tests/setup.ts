process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??=
  "postgresql://tailoring:tailoring@127.0.0.1:5432/tailoring_crm?schema=public";
process.env.AUTH_SECRET ??= "test-auth-secret-012345678901234567890123";
process.env.CORS_ORIGIN ??= "http://localhost:3000";
