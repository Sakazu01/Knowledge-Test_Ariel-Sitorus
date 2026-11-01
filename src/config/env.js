require("dotenv/config");
const { z } = require("zod");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(3600),
  BCRYPT_ROUNDS: z.coerce.number().int().positive().default(12),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:", z.flattenError(result.error).fieldErrors);
  process.exit(1);
}

module.exports = result.data;
