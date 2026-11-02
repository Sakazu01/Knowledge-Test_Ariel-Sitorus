const errorResponse = (description, code, message) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: { success: false, message, code },
    },
  },
});

const validationError = {
  description: "Input tidak valid",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ValidationError" },
      example: {
        success: false,
        message: "Validasi gagal",
        code: "VALIDATION_ERROR",
        errors: [{ field: "email", message: "Invalid email address" }],
      },
    },
  },
};

const unauthorized = errorResponse(
  "Token tidak ada, salah format, tidak valid, kedaluwarsa, atau user sudah dihapus",
  "UNAUTHORIZED",
  "Token tidak valid atau tidak ada",
);

const jsonBody = (schema) => ({
  required: true,
  content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } },
});

const ok = (description, dataRef, message) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: message },
          data: { $ref: `#/components/schemas/${dataRef}` },
        },
      },
    },
  },
});

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Auth Portal API",
    version: "1.0.0",
    description:
      "REST API autentikasi: register, login, dan profil dengan token JWT (HS256, berlaku 1 jam).\n\n" +
      "Cara mencoba endpoint yang butuh login: panggil **POST /auth/login**, salin `token` dari respons, " +
      "klik tombol **Authorize** di kanan atas, lalu tempel token (tanpa kata `Bearer`).",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Auth", description: "Daftar akun dan login" },
    { name: "Users", description: "Data user yang sedang login" },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Daftar akun baru",
        requestBody: jsonBody("RegisterInput"),
        responses: {
          201: ok("Akun berhasil dibuat", "User", "Registrasi berhasil"),
          400: validationError,
          409: errorResponse("Email sudah terdaftar", "EMAIL_ALREADY_EXISTS", "Email sudah terdaftar"),
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login dan dapatkan token",
        requestBody: jsonBody("LoginInput"),
        responses: {
          200: ok("Login berhasil", "TokenResult", "Login berhasil"),
          400: validationError,
          401: errorResponse(
            "Email tidak terdaftar atau password salah (pesan sengaja sama)",
            "INVALID_CREDENTIALS",
            "Email atau password salah",
          ),
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Profil user pemilik token",
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok("Profil user", "User", "Profil berhasil diambil"),
          401: unauthorized,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      RegisterInput: {
        type: "object",
        required: ["name", "email", "password", "gender"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100, example: "Ariel" },
          email: { type: "string", format: "email", maxLength: 255, example: "ariel@example.com" },
          password: {
            type: "string",
            minLength: 8,
            description: "Minimal 8 karakter, maksimal 72 byte",
            example: "rahasia123",
          },
          gender: { type: "string", enum: ["male", "female"], example: "male" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "ariel@example.com" },
          password: { type: "string", example: "rahasia123" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "307c5ed4-9365-4085-ac95-0f381ec830b3" },
          name: { type: "string", example: "Ariel" },
          email: { type: "string", format: "email", example: "ariel@example.com" },
          gender: { type: "string", enum: ["male", "female"], example: "male" },
          createdAt: { type: "string", format: "date-time", example: "2026-11-02T10:00:00.000Z" },
        },
      },
      TokenResult: {
        type: "object",
        properties: {
          token: { type: "string", description: "JWT HS256" },
          tokenType: { type: "string", example: "Bearer" },
          expiresIn: { type: "integer", description: "Masa berlaku dalam detik", example: 3600 },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          code: { type: "string" },
        },
      },
      ValidationError: {
        allOf: [
          { $ref: "#/components/schemas/Error" },
          {
            type: "object",
            properties: {
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: { field: { type: "string" }, message: { type: "string" } },
                },
              },
            },
          },
        ],
      },
    },
  },
};
