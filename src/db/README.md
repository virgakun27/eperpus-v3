# Panduan Integrasi Database Neon Tech & PostgreSQL
**Perpustakaan Digital SMAN 1 Lumbung (Smart RFID & QR Code)**

---

## 1. Konfigurasi Environment Variable (`.env`)
Salin berkas `.env.example` menjadi `.env` lalu masukkan connection string dari Neon Console:

```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

---

## 2. Struktur Tabel & Skema Relasional

| Nama Tabel | Deskripsi | Kunci Utama / Relasi |
| :--- | :--- | :--- |
| `classes` | Data rombel / kelas sekolah | `id` (PK) |
| `students` | Data siswa & akun login portal | `id` (PK), `nis` (Unique), `class_id` (FK ke `classes.id`) |
| `members` | Data kartu anggota & RFID perpustakaan | `id` (PK), `rfid_card` (Unique), `student_id` (FK) |
| `books` | Inventaris buku & katalog perpustakaan | `id` (PK), `isbn` (Unique) |
| `transactions`| Sirkulasi peminjaman & pengembalian buku | `id` (PK), `book_id` (FK), `member_id` (FK) |
| `users` | Akun operator / admin / guru / kepsek | `id` (PK), `username` (Unique) |
| `system_settings` | Konfigurasi sistem dinamis (JSONB) | `key` (PK) |

---

## 3. Eksekusi Skema SQL ke Neon Tech
Anda dapat langsung menjalankan berkas `schema.sql` di **SQL Editor** pada [Neon Console](https://console.neon.tech) atau melalui terminal `psql`:

```bash
psql "postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" -f schema.sql
```
