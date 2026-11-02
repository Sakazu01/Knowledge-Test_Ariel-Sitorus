const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const prisma = require("../src/config/prisma");
const env = require("../src/config/env");

const registerUrl = "/api/v1/auth/register";
const url = "/api/v1/auth/login";
const user = {
  name: "Ariel",
  email: "ariel@example.com",
  password: "rahasia123",
  gender: "male",
};

beforeEach(async () => {
  await prisma.user.deleteMany();
  await request(app).post(registerUrl).send(user);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/v1/auth/login", () => {
  it("T06: berhasil login dan mengembalikan token HS256 yang berisi id user", async () => {
    const res = await request(app).post(url).send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ tokenType: "Bearer", expiresIn: env.JWT_EXPIRES_IN_SECONDS });

    const dbUser = await prisma.user.findFirst();
    const payload = jwt.verify(res.body.data.token, env.JWT_SECRET, { algorithms: ["HS256"] });
    expect(payload.sub).toBe(dbUser.id);
    expect(payload.exp - payload.iat).toBe(env.JWT_EXPIRES_IN_SECONDS);
  });

  it("T06: login tetap berhasil walau email beda huruf besar dan ada spasi", async () => {
    const res = await request(app).post(url).send({ email: "  ARIEL@Example.com ", password: user.password });

    expect(res.status).toBe(200);
  });

  it.each([
    ["password salah", { email: "ariel@example.com", password: "salah-banget" }],
    ["email tidak terdaftar", { email: "nobody@example.com", password: "rahasia123" }],
  ])("T07: menolak %s dengan 401 dan pesan yang sama", async (_label, body) => {
    const res = await request(app).post(url).send(body);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
    expect(res.body.message).toBe("Email atau password salah");
  });

  it("T08: menolak body kosong dengan 400 dan menyebut email serta password", async () => {
    const res = await request(app).post(url).send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(["email", "password"]));
  });
});
