const bcrypt = require("bcryptjs");
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

module.exports = { register };
