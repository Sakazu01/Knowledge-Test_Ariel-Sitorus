const { z } = require("zod");

const email = z.string().trim().toLowerCase().pipe(z.email().max(255));

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  password: z
    .string()
    .min(8)
    .refine((value) => Buffer.byteLength(value) <= 72, "Password maksimal 72 byte"),
  gender: z.enum(["male", "female"]),
});

module.exports = { registerSchema };
