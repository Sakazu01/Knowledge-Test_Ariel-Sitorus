const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  const [scheme, token] = (header ?? "").split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Token tidak valid atau tidak ada", "UNAUTHORIZED");
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    req.userId = payload.sub;
    next();
  } catch {
    throw new ApiError(401, "Token tidak valid atau tidak ada", "UNAUTHORIZED");
  }
};

module.exports = auth;
