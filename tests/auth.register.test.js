const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

const url = "/api/v1/auth/register";
const validBody = {
  name: "Ariel",
  email: "ariel@example.com",
  password: "rahasia123",
  gender: "male",
};

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/v1/auth/register", () => {
  it("T01: berhasil mendaftar dan tidak mengembalikan password", async () => {
    const res = await request(app).post(url).send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ name: "Ariel", email: "ariel@example.com", gender: "male" });
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data).not.toHaveProperty("password");
  });

  it.each([
    ["nama kosong", { name: "   " }, "name"],
    ["email salah format", { email: "bukan-email" }, "email"],
    ["password pendek", { password: "1234567" }, "password"],
    ["gender di luar enum", { gender: "lain" }, "gender"],
  ])("T02: menolak %s dengan 400", async (_label, override, field) => {
    const res = await request(app)
      .post(url)
      .send({ ...validBody, ...override });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.errors.map((e) => e.field)).toContain(field);
  });

  it("T03: menolak email yang sudah terdaftar dengan 409, walau beda huruf besar", async () => {
    await request(app).post(url).send(validBody);
    const res = await request(app)
      .post(url)
      .send({ ...validBody, email: "ARIEL@Example.com" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("T04: menyimpan email dalam huruf kecil dan nama tanpa spasi tepi", async () => {
    await request(app)
      .post(url)
      .send({ ...validBody, name: "  Ariel  ", email: "Ariel@Mail.COM" });

    const user = await prisma.user.findFirst();
    expect(user.email).toBe("ariel@mail.com");
    expect(user.name).toBe("Ariel");
  });

  it("T05: menyimpan password sebagai hash bcrypt, bukan teks asli", async () => {
    await request(app).post(url).send(validBody);

    const user = await prisma.user.findFirst();
    expect(user.password).not.toBe(validBody.password);
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  it("T14: menolak password lebih dari 72 byte", async () => {
    const res = await request(app)
      .post(url)
      .send({ ...validBody, password: "😀".repeat(19) });

    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toContain("password");
  });
});
