const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const toPublicUser = require("../utils/toPublicUser");

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(401, "Token tidak valid atau tidak ada", "UNAUTHORIZED");
  }

  return toPublicUser(user);
};

module.exports = { getProfile };
