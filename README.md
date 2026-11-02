# Auth Portal API

REST API autentikasi: daftar akun, login, dan melihat profil memakai token JWT. Jawaban Knowledge Test PT Widya Informasi Nusantara.

## Catatan untuk reviewer

Aplikasi ini adalah REST API autentikasi dengan fitur register, login, dan akses profil memakai token JWT. Dibuat dengan Node.js, Express, Prisma, dan PostgreSQL (dijalankan lewat Docker).

Cara menjalankan di lokal ada di bagian [Cara menjalankan](#cara-menjalankan) di bawah. Singkatnya: `npm install`, isi `.env`, `docker compose up -d`, `npx prisma migrate deploy`, lalu `npm run dev`. Server berjalan di `http://localhost:3000`.

Dokumentasi API (Swagger) ada di `http://localhost:3000/api/docs` setelah aplikasi berjalan. Alur mencobanya: register, login, klik **Authorize** lalu tempel `token`, kemudian panggil `GET /api/v1/users/me`.

Asumsi dan keputusan desain:

- Password ditambahkan ke data akun karena login membutuhkannya. Password disimpan sebagai hash bcrypt dan tidak pernah dikembalikan di response. Panjangnya dibatasi 8 karakter sampai 72 byte, karena bcrypt hanya membaca 72 byte pertama dan sisanya akan terpotong diam-diam.
- Email di-trim dan disimpan dalam huruf kecil, dan harus unik. Email yang sudah terdaftar menghasilkan 409. Pengecekan dilakukan lewat constraint unique database (error `P2002` diubah jadi 409), jadi aman walau ada dua request bersamaan.
- Memakai satu access token JWT (HS256, payload hanya id user) yang berlaku 1 jam. Refresh token dan endpoint logout tidak dibuat karena tidak diminta. Logout cukup dilakukan di client dengan membuang token.
- Pesan error login sama untuk email tidak terdaftar maupun password salah, agar email yang terdaftar tidak bisa ditebak.
- Token yang masih sah tetapi user-nya sudah dihapus ditolak dengan 401, karena token hanya membuktikan pernah diterbitkan.
- Struktur kode berlapis (route, middleware, controller, service) dengan satu penanganan error terpusat, dan field user yang dikembalikan dibatasi lewat whitelist. Validasi input memakai Zod. Ada 21 tes otomatis (Jest dan Supertest) yang memakai database terpisah.
- Tanpa kolom `updated_at` karena tidak ada fitur ubah data.

Terima kasih sudah me-review.

## Teknologi

Node.js, Express 5, PostgreSQL 16 (Docker), Prisma 7 (ORM), Zod (validasi), bcryptjs (hash password), jsonwebtoken (JWT), Jest + Supertest (tes).

## Cara menjalankan

Prasyarat: Node.js 20 ke atas, Docker, dan npm.

```bash
# 1. pasang dependency
npm install

# 2. siapkan konfigurasi
cp .env.example .env
# lalu isi JWT_SECRET dengan string acak minimal 32 karakter, misalnya:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. nyalakan PostgreSQL
docker compose up -d

# 4. buat tabel (client Prisma sudah dibuat otomatis saat npm install)
npx prisma migrate deploy

# 5. jalankan server (http://localhost:3000)
npm run dev
```

Untuk produksi gunakan `npm start`. Cek server hidup: `GET /health`.

Dokumentasi API interaktif (Swagger UI): <http://localhost:3000/api/docs>. Semua endpoint bisa dicoba dari sana. Untuk endpoint yang butuh login, panggil `POST /api/v1/auth/login`, salin `token`, klik **Authorize**, lalu tempel token.

### Konfigurasi (`.env`)

| Variabel | Keterangan | Default |
|---|---|---|
| `NODE_ENV` | `development`, `test`, atau `production` | `development` |
| `PORT` | Port server | `3000` |
| `DATABASE_URL` | Koneksi PostgreSQL | wajib |
| `JWT_SECRET` | Kunci penanda tangan token, minimal 32 karakter | wajib |
| `JWT_EXPIRES_IN_SECONDS` | Masa berlaku token (detik) | `3600` |
| `BCRYPT_ROUNDS` | Biaya hash password | `12` |

Server menolak menyala jika konfigurasi tidak valid.

## Endpoint

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/v1/auth/register` | tidak | Daftar akun baru |
| POST | `/api/v1/auth/login` | tidak | Login, mengembalikan token |
| GET | `/api/v1/users/me` | Bearer token | Profil user pemilik token |

### Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ariel","email":"ariel@example.com","password":"rahasia123","gender":"male"}'
```

201:

```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "id": "307c5ed4-9365-4085-ac95-0f381ec830b3",
    "name": "Ariel",
    "email": "ariel@example.com",
    "gender": "male",
    "createdAt": "2026-11-02T10:00:00.000Z"
  }
}
```

Aturan input: `name` 1 sampai 100 karakter, `email` format valid, `password` 8 karakter sampai 72 byte, `gender` adalah `male` atau `female`.

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ariel@example.com","password":"rahasia123"}'
```

200:

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": { "token": "<jwt>", "tokenType": "Bearer", "expiresIn": 3600 }
}
```

### Profil

```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <token dari login>"
```

200:

```json
{
  "success": true,
  "message": "Profil berhasil diambil",
  "data": {
    "id": "307c5ed4-9365-4085-ac95-0f381ec830b3",
    "name": "Ariel",
    "email": "ariel@example.com",
    "gender": "male",
    "createdAt": "2026-11-02T10:00:00.000Z"
  }
}
```

## Format error

Semua error memakai bentuk yang sama:

```json
{ "success": false, "message": "Email atau password salah", "code": "INVALID_CREDENTIALS" }
```

Error validasi menambah `errors: [{ "field": "email", "message": "..." }]`.

| Status | `code` | Penyebab |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Input tidak memenuhi aturan |
| 400 | `INVALID_JSON` | Body bukan JSON yang valid |
| 401 | `INVALID_CREDENTIALS` | Email tidak terdaftar atau password salah |
| 401 | `UNAUTHORIZED` | Token tidak ada, salah format, tidak valid, kedaluwarsa, atau user sudah dihapus |
| 404 | `ROUTE_NOT_FOUND` | Route tidak ada |
| 409 | `EMAIL_ALREADY_EXISTS` | Email sudah terdaftar |
| 413 | `PAYLOAD_TOO_LARGE` | Body lebih dari 10 KB |
| 500 | `INTERNAL_ERROR` | Kesalahan server (detail hanya di log) |

## Menjalankan tes

Tes memakai database terpisah agar data asli tidak tersentuh. Buat sekali:

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE auth_portal_test"
npm test
```

Tabel dibuat otomatis oleh `prisma migrate deploy` saat tes dimulai.

## Struktur

```
src/
  app.js            # susunan Express (tanpa listen, agar mudah dites)
  server.js         # titik masuk, memanggil listen
  config/           # env (divalidasi Zod) dan klien Prisma
  routes/           # URL ke controller
  middlewares/      # auth (JWT), validate (Zod), errorHandler
  controllers/      # tipis: ambil input, panggil service, balas JSON
  services/         # logika bisnis (tanpa req/res)
  validators/       # skema Zod
  docs/             # spesifikasi OpenAPI untuk Swagger UI
  utils/            # ApiError, toPublicUser
prisma/             # schema dan migrasi
tests/              # Jest + Supertest
```

Alur request: route, middleware, controller, service, Prisma, PostgreSQL. Controller tidak tahu soal database, service tidak tahu soal HTTP.
