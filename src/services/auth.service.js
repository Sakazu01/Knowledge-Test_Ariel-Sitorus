const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const toPublicUser = require("../utils/toPublicUser");

const register = async ({ name, email, password, gender }) => {
  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, gender },
    });
    return toPublicUser(user);
  } catch (err) {
    if (err.code === "P2002") {
      throw new ApiError(409, "Email sudah terdaftar", "EMAIL_ALREADY_EXISTS");
    }
    throw err;
  }
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  const isMatch = user ? await bcrypt.compare(password, user.password) : false;

  if (!isMatch) {
    throw new ApiError(401, "Email atau password salah", "INVALID_CREDENTIALS");
  }

  const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN_SECONDS,
  });

  return { token, tokenType: "Bearer", expiresIn: env.JWT_EXPIRES_IN_SECONDS };
};

module.exports = { register, login };
