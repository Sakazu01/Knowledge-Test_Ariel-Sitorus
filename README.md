# Auth Portal API

REST API sederhana untuk autentikasi: daftar akun, login, dan melihat profil sendiri memakai token JWT. Dibuat sebagai jawaban Knowledge Test PT Widya Informasi Nusantara.

## Catatan untuk reviewer

Aplikasi ini punya tiga fitur: register, login, dan akses profil lewat token JWT. Dibuat dengan Node.js, Express, Prisma, dan PostgreSQL (dijalankan lewat Docker).

Langkah menjalankannya ada di bagian [Menjalankan aplikasi](#menjalankan-aplikasi) di bawah, dan semua endpoint bisa dicoba langsung di Swagger (`http://localhost:3000/api/docs`) setelah aplikasi berjalan.

Beberapa asumsi dan keputusan yang saya ambil:

- **Password ditambahkan ke data akun**, karena login membutuhkannya. Password disimpan sebagai hash bcrypt dan tidak pernah dikembalikan di response. Panjangnya dibatasi 8 karakter sampai 72 byte, karena bcrypt hanya membaca 72 byte pertama dan sisanya akan terpotong diam-diam.
- **Email disimpan dalam huruf kecil dan harus unik.** Email yang sudah terdaftar menghasilkan 409. Pengecekan dilakukan lewat constraint unique di database (error `P2002` diubah jadi 409), jadi tetap aman walau ada dua request yang masuk bersamaan.
- **Satu access token JWT** (HS256, payload hanya id user) yang berlaku 1 jam. Refresh token dan endpoint logout tidak dibuat karena tidak diminta. Logout cukup dilakukan di sisi client dengan membuang token.
- **Pesan error login sama** untuk email yang tidak terdaftar maupun password yang salah, supaya email yang terdaftar tidak bisa ditebak.
- **Token yang masih sah tetapi user-nya sudah dihapus** ditolak dengan 401, karena token hanya membuktikan bahwa ia pernah diterbitkan.
- **Kode berlapis**: route, middleware, controller, service. Penanganan error terpusat di satu tempat, dan field user yang dikembalikan dibatasi lewat whitelist. Validasi input memakai Zod.
- **21 tes otomatis** (Jest dan Supertest) yang berjalan di database terpisah.
- Tidak ada kolom `updated_at`, karena memang tidak ada fitur ubah data.

Terima kasih sudah me-review.

## Teknologi

Node.js, Express 5, PostgreSQL 16 (Docker), Prisma 7 (ORM), Zod (validasi), bcryptjs (hash password), jsonwebtoken (JWT), Swagger UI (dokumentasi API), Jest dan Supertest (tes).

## Menjalankan aplikasi

### Yang perlu disiapkan

- Node.js versi 20 atau lebih baru
- Docker (Docker Desktop di Windows atau macOS), dalam keadaan menyala
- npm (ikut terpasang bersama Node.js)

### Langkah-langkah

**1. Unduh proyek dan pasang dependency**

```bash
git clone https://github.com/Sakazu01/Knowledge-Test_Ariel-Sitorus.git
cd Knowledge-Test_Ariel-Sitorus
npm install
```

Saat `npm install`, client Prisma ikut dibuat otomatis, jadi tidak ada langkah tambahan untuk itu.

**2. Siapkan file konfigurasi**

```bash
cp .env.example .env
```

Di Windows CMD, pakai `copy .env.example .env`. Di PowerShell, perintah `cp` di atas bisa dipakai.

Buka `.env`, lalu isi `JWT_SECRET` dengan string acak minimal 32 karakter. Cara cepat membuatnya:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Salin hasilnya ke `JWT_SECRET=` di `.env`. Isi lain di `.env.example` sudah cocok dengan Docker Compose, jadi tidak perlu diubah.

**3. Nyalakan database PostgreSQL**

```bash
docker compose up -d
```

Ini menjalankan PostgreSQL di port `5436` (sengaja bukan 5432 agar tidak bentrok dengan Postgres lain yang mungkin sudah ada di komputer).

**4. Buat tabel**

```bash
npx prisma migrate deploy
```

**5. Jalankan server**

```bash
npm run dev
```

Kalau berhasil, terminal menampilkan `Server running on port 3000`. Untuk memastikan, buka <http://localhost:3000/health>: harus muncul `{"success":true,"message":"OK"}`.

Untuk mode produksi, pakai `npm start` (tanpa auto-restart).

### Konfigurasi (`.env`)

| Variabel | Keterangan | Bawaan |
|---|---|---|
| `NODE_ENV` | `development`, `test`, atau `production` | `development` |
| `PORT` | Port server | `3000` |
| `DATABASE_URL` | Alamat koneksi PostgreSQL | wajib diisi |
| `JWT_SECRET` | Kunci penanda tangan token, minimal 32 karakter | wajib diisi |
| `JWT_EXPIRES_IN_SECONDS` | Masa berlaku token dalam detik | `3600` |
| `BCRYPT_ROUNDS` | Tingkat kerja hash password | `12` |

Server menolak menyala jika konfigurasi tidak valid, dan pesan di terminal menyebut variabel mana yang bermasalah.

## Mencoba API

### Lewat Swagger UI

Buka <http://localhost:3000/api/docs>, lalu:

1. Buka `POST /auth/register`, klik **Try it out**, lalu **Execute**.
2. Buka `POST /auth/login`, eksekusi, dan salin nilai `token` dari respons.
3. Klik tombol **Authorize** di kanan atas, tempel token (tanpa kata `Bearer`), lalu **Authorize**.
4. Buka `GET /users/me`, **Try it out**, **Execute**: profilmu muncul.

### Lewat curl

Register:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ariel","email":"ariel@example.com","password":"rahasia123","gender":"male"}'
```

Login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ariel@example.com","password":"rahasia123"}'
```

Profil (ganti `<token>` dengan token dari login):

```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <token>"
```

Catatan untuk pengguna Windows CMD: tanda `\` di akhir baris tidak berlaku, tulis perintahnya dalam satu baris. Tanda kutip tunggal pada `-d '...'` juga sebaiknya diganti dengan kutip ganda yang di-escape, atau gunakan PowerShell atau Git Bash.

## Menjalankan tes

Tes memakai database terpisah (`auth_portal_test`) agar data aslimu tidak tersentuh. Database itu dibuat sekali saja:

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE auth_portal_test"
```

Setelah itu:

```bash
npm test
```

Tabel di database tes dibuat otomatis oleh tes itu sendiri. Hasil yang diharapkan: `Tests: 21 passed, 21 total`. File `.env` tidak diperlukan untuk menjalankan tes.

## Kalau ada masalah

| Gejala | Penyebab dan solusi |
|---|---|
| `Can't reach database server at localhost:5436` | Docker belum menyala atau container belum jalan. Nyalakan Docker Desktop, lalu `docker compose up -d`. |
| `port is already allocated` saat `docker compose up` | Port 5436 dipakai program lain. Ganti angka `5436` di `docker-compose.yml` dan di `DATABASE_URL` pada `.env` (dan `TEST_DATABASE_URL` kalau dipakai) ke port bebas. |
| Server langsung berhenti dengan pesan konfigurasi | Ada variabel `.env` yang kosong atau tidak valid, biasanya `JWT_SECRET` kurang dari 32 karakter. Pesan di terminal menyebutkannya. |
| `EADDRINUSE: address already in use :::3000` | Port 3000 dipakai program lain. Ubah `PORT` di `.env`. |
| `Cannot find module '.prisma/client'` | Client Prisma belum dibuat. Jalankan `npx prisma generate`. |
| Ingin mengulang database dari nol | `docker compose down -v` (menghapus semua data), lalu ulangi langkah 3 dan 4. |

## Referensi endpoint

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/v1/auth/register` | tidak | Daftar akun baru |
| POST | `/api/v1/auth/login` | tidak | Login, mengembalikan token |
| GET | `/api/v1/users/me` | Bearer token | Profil user pemilik token |

Aturan input register: `name` 1 sampai 100 karakter, `email` berformat valid, `password` 8 karakter sampai 72 byte, dan `gender` berisi `male` atau `female`. Login hanya butuh `email` dan `password`.

Contoh respons register (201):

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

Contoh respons login (200):

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": { "token": "<jwt>", "tokenType": "Bearer", "expiresIn": 3600 }
}
```

Respons profil (200) berbentuk sama dengan `data` pada register, dibungkus `success` dan `message`.

### Format error

Semua error memakai bentuk yang sama:

```json
{ "success": false, "message": "Email atau password salah", "code": "INVALID_CREDENTIALS" }
```

Error validasi menambahkan daftar `errors`, misalnya `[{ "field": "email", "message": "..." }]`.

| Status | `code` | Penyebab |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Input tidak memenuhi aturan |
| 400 | `INVALID_JSON` | Body bukan JSON yang valid |
| 401 | `INVALID_CREDENTIALS` | Email tidak terdaftar atau password salah |
| 401 | `UNAUTHORIZED` | Token tidak ada, salah format, tidak valid, kedaluwarsa, atau user sudah dihapus |
| 404 | `ROUTE_NOT_FOUND` | Route tidak ada |
| 409 | `EMAIL_ALREADY_EXISTS` | Email sudah terdaftar |
| 413 | `PAYLOAD_TOO_LARGE` | Body lebih dari 10 KB |
| 500 | `INTERNAL_ERROR` | Kesalahan di server (detailnya hanya ada di log) |

## Struktur proyek

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

Alur sebuah request: route, middleware, controller, service, Prisma, PostgreSQL. Controller tidak tahu soal database, dan service tidak tahu soal HTTP.
