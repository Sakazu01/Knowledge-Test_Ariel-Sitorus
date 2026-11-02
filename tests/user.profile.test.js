const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const prisma = require("../src/config/prisma");
const env = require("../src/config/env");

const url = "/api/v1/users/me";
const user = {
  name: "Ariel",
  email: "ariel@example.com",
  password: "rahasia123",
  gender: "male",
};

let token;

beforeEach(async () => {
  await prisma.user.deleteMany();
  await request(app).post("/api/v1/auth/register").send(user);
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: user.email, password: user.password });
  token = res.body.data.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/v1/users/me", () => {
  it("T09: mengembalikan profil user pemilik token tanpa password", async () => {
    const res = await request(app).get(url).set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ name: "Ariel", email: "ariel@example.com", gender: "male" });
    expect(res.body.data).not.toHaveProperty("password");
  });

  it.each([
    ["tanpa header Authorization", () => undefined],
    ["skema bukan Bearer", () => `Basic ${token}`],
    ["token sampah", () => "Bearer abc.def.ghi"],
    ["tanda tangan salah", () => `Bearer ${jwt.sign({ sub: "x" }, "x".repeat(40), { algorithm: "HS256" })}`],
    ["token kedaluwarsa", () => `Bearer ${jwt.sign({ sub: "x" }, env.JWT_SECRET, { algorithm: "HS256", expiresIn: -10 })}`],
  ])("T10: menolak %s dengan 401", async (_label, makeHeader) => {
    const req = request(app).get(url);
    const header = makeHeader();
    const res = await (header ? req.set("Authorization", header) : req);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });

  it("T11: menolak token yang sah jika user-nya sudah dihapus", async () => {
    await prisma.user.deleteMany();

    const res = await request(app).get(url).set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });
});
