const { z } = require("zod");
const ApiError = require("../utils/ApiError");

const notFound = (req, res, next) => {
  next(new ApiError(404, "Route tidak ditemukan", "ROUTE_NOT_FOUND"));
};

const toApiError = (err) => {
  if (err instanceof ApiError) return err;

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
    return new ApiError(400, "Validasi gagal", "VALIDATION_ERROR", errors);
  }

  if (err.type === "entity.parse.failed") {
    return new ApiError(400, "Body bukan JSON yang valid", "INVALID_JSON");
  }
  if (err.type === "entity.too.large") {
    return new ApiError(413, "Body terlalu besar", "PAYLOAD_TOO_LARGE");
  }

  return null;
};

const errorHandler = (err, req, res, next) => {
  const apiError = toApiError(err);

  if (!apiError) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server", code: "INTERNAL_ERROR" });
  }

  const body = { success: false, message: apiError.message, code: apiError.code };
  if (apiError.errors) body.errors = apiError.errors;
  res.status(apiError.statusCode).json(body);
};

module.exports = { notFound, errorHandler };
