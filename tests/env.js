process.env.NODE_ENV = "test";
process.env.BCRYPT_ROUNDS = "4";
process.env.JWT_SECRET ||= "test-secret-test-secret-test-secret-0123";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:5436/auth_portal_test";
