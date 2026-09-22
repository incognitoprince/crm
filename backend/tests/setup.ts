process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??=
  "postgresql://tailoring:tailoring@127.0.0.1:5432/tailoring_crm?schema=public";
process.env.JWT_SECRET ??= "test-secret";
