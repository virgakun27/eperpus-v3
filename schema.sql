-- ==============================================================================
-- DATABASE SCHEMA: SUPABASE POSTGRESQL (CLOUD INTEGRATION)
-- SISTEM PERPUSTAKAAN DIGITAL SMAN 1 LUMBUNG (SMART RFID & QR CODE)
-- ==============================================================================

-- 1. Enable Required Security & UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUM TYPES
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Guru', 'Siswa', 'Kepsek');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_status AS ENUM ('Aktif', 'Ditangguhkan', 'Nonaktif');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_type AS ENUM ('Siswa', 'Mahasiswa', 'Dosen', 'Staf', 'Umum');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE book_status AS ENUM ('Tersedia', 'Dipinjam', 'Hilang', 'Rusak');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('Berlangsung', 'Selesai', 'Terlambat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('L', 'P');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE grade_level AS ENUM ('X', 'XI', 'XII');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. TABLES DDL WITH INTEGRITY RULES
-- ==============================================================================

-- A. TABEL KELAS (CLASSES)
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade_level grade_level NOT NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2025/2026',
    homeroom_teacher VARCHAR(150) NOT NULL,
    student_count INT DEFAULT 0 CHECK (student_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- B. TABEL SISWA (STUDENTS) - PASSWORD TERHASHING DENGAN BCRYPT
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY,
    nis VARCHAR(50) UNIQUE NOT NULL,
    nisn VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    gender gender_type NOT NULL DEFAULT 'L',
    class_id VARCHAR(50) REFERENCES classes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    class_name VARCHAR(100) NOT NULL,
    rfid_card VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Kolom password terenkripsi bcrypt
    status member_status NOT NULL DEFAULT 'Aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- C. TABEL ANGGOTA PERPUSTAKAAN (MEMBERS)
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    status member_status NOT NULL DEFAULT 'Aktif',
    rfid_card VARCHAR(100) UNIQUE NOT NULL,
    type member_type NOT NULL DEFAULT 'Siswa',
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    max_books INT NOT NULL DEFAULT 3 CHECK (max_books > 0),
    active_loans_count INT NOT NULL DEFAULT 0 CHECK (active_loans_count >= 0),
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- D. TABEL BUKU (BOOKS)
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    isbn VARCHAR(50) UNIQUE NOT NULL,
    status book_status NOT NULL DEFAULT 'Tersedia',
    stock INT NOT NULL DEFAULT 1 CHECK (stock >= 0),
    available_stock INT NOT NULL DEFAULT 1 CHECK (available_stock >= 0),
    location VARCHAR(100) NOT NULL,
    cover_color VARCHAR(100) NOT NULL DEFAULT 'bg-amber-100 text-amber-900 border-amber-300',
    description TEXT,
    publish_year INT NOT NULL DEFAULT 2024,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_available_not_exceed_stock CHECK (available_stock <= stock)
);

-- E. TABEL TRANSAKSI SIRKULASI (TRANSACTIONS)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(100) PRIMARY KEY,
    book_id VARCHAR(50) NOT NULL REFERENCES books(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    book_title VARCHAR(255) NOT NULL,
    member_id VARCHAR(50) NOT NULL REFERENCES members(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    member_name VARCHAR(150) NOT NULL,
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE,
    status transaction_status NOT NULL DEFAULT 'Berlangsung',
    fine_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (fine_amount >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- F. TABEL PENGGUNA SISTEM / RBAC (USERS) - PASSWORD TERHASHING DENGAN BCRYPT
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150),
    password_hash VARCHAR(255) NOT NULL, -- Kolom password terenkripsi bcrypt
    role user_role NOT NULL DEFAULT 'Admin',
    status member_status NOT NULL DEFAULT 'Aktif',
    rfid_card VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- G. TABEL TOKEN KEAMANAN SISTEM (SECURITY TOKENS)
CREATE TABLE IF NOT EXISTS security_tokens (
    id VARCHAR(50) PRIMARY KEY,
    token_key VARCHAR(100) UNIQUE NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);

CREATE INDEX IF NOT EXISTS idx_members_rfid ON members(rfid_card);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_type ON members(type);
CREATE INDEX IF NOT EXISTS idx_members_student_id ON members(student_id);

CREATE INDEX IF NOT EXISTS idx_students_rfid ON students(rfid_card);
CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);

CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON transactions(book_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_borrow_date ON transactions(borrow_date);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_rfid ON users(rfid_card);

-- ==============================================================================
-- 5. FUNCTION & TRIGGER: AUTO UPDATE TIMESTAMP
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_classes_timestamp ON classes;
CREATE TRIGGER trigger_update_classes_timestamp
BEFORE UPDATE ON classes
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_students_timestamp ON students;
CREATE TRIGGER trigger_update_students_timestamp
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_members_timestamp ON members;
CREATE TRIGGER trigger_update_members_timestamp
BEFORE UPDATE ON members
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_books_timestamp ON books;
CREATE TRIGGER trigger_update_books_timestamp
BEFORE UPDATE ON books
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_transactions_timestamp ON transactions;
CREATE TRIGGER trigger_update_transactions_timestamp
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_users_timestamp ON users;
CREATE TRIGGER trigger_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- ==============================================================================
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public access for anon/authenticated API client
DROP POLICY IF EXISTS "Public access on classes" ON classes;
CREATE POLICY "Public access on classes" ON classes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on students" ON students;
CREATE POLICY "Public access on students" ON students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on members" ON members;
CREATE POLICY "Public access on members" ON members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on books" ON books;
CREATE POLICY "Public access on books" ON books FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on transactions" ON transactions;
CREATE POLICY "Public access on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on users" ON users;
CREATE POLICY "Public access on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 7. INITIAL SEED DATA WITH BCRYPT HASHED PASSWORDS
-- ==============================================================================

-- Data Kelas
INSERT INTO classes (id, name, grade_level, academic_year, homeroom_teacher, student_count)
VALUES 
    ('K001', 'X MIPA 1', 'X', '2025/2026', 'Drs. H. Mulyana, M.Pd.', 36),
    ('K002', 'X MIPA 2', 'X', '2025/2026', 'Dra. Hj. Nunung Rohayati', 35),
    ('K003', 'XI MIPA 1', 'XI', '2025/2026', 'Asep Saepuloh, S.Pd., M.M.', 34),
    ('K004', 'XII IPS 1', 'XII', '2025/2026', 'Cucun Hendayana, S.Pd.', 36)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    homeroom_teacher = EXCLUDED.homeroom_teacher;

-- Data Siswa (Password ter-hash: 'siswa123' => $2b$10$MUpKwel.EWj6zTVVhgxSleLUAhQQQ.2grcaxEsPtZzlWM/S2Dmcn2)
INSERT INTO students (id, nis, nisn, name, gender, class_id, class_name, rfid_card, email, phone, username, password_hash, status)
VALUES 
    ('S001', '2026001', '0081234561', 'Budi Santoso', 'L', 'K001', 'X MIPA 1', 'RFID-SIS-2026001', 'budi.santoso@sman1lumbung.sch.id', '081234567891', 'siswa', '$2b$10$MUpKwel.EWj6zTVVhgxSleLUAhQQQ.2grcaxEsPtZzlWM/S2Dmcn2', 'Aktif'),
    ('S002', '2026002', '0081234562', 'Siti Rahmawati', 'P', 'K001', 'X MIPA 1', 'RFID-SIS-2026002', 'siti.rahmawati@sman1lumbung.sch.id', '081234567892', 'siti', crypt('siti123', gen_salt('bf')), 'Aktif'),
    ('S003', '2026003', '0081234563', 'Ahmad Hidayat', 'L', 'K003', 'XI MIPA 1', 'RFID-SIS-2026003', 'ahmad.hidayat@sman1lumbung.sch.id', '081234567893', 'ahmad', crypt('ahmad123', gen_salt('bf')), 'Aktif')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash;

-- Data Anggota
INSERT INTO members (id, name, status, rfid_card, type, email, phone, max_books, active_loans_count, student_id)
VALUES 
    ('M001', 'Budi Santoso', 'Aktif', 'RFID-SIS-2026001', 'Siswa', 'budi.santoso@sman1lumbung.sch.id', '081234567891', 3, 2, 'S001'),
    ('M002', 'Siti Rahmawati', 'Aktif', 'RFID-SIS-2026002', 'Siswa', 'siti.rahmawati@sman1lumbung.sch.id', '081234567892', 3, 1, 'S002'),
    ('M003', 'Ahmad Hidayat', 'Aktif', 'RFID-SIS-2026003', 'Siswa', 'ahmad.hidayat@sman1lumbung.sch.id', '081234567893', 3, 1, 'S003'),
    ('M004', 'Drs. H. Mulyana, M.Pd.', 'Aktif', 'RFID-GUR-1975001', 'Dosen', 'mulyana@sman1lumbung.sch.id', '081322119988', 5, 0, NULL)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status;

-- Data Buku Katalog
INSERT INTO books (id, title, author, category, isbn, status, stock, available_stock, location, cover_color, description, publish_year)
VALUES 
    ('B001', 'Laskar Pelangi', 'Andrea Hirata', 'Fiksi / Drama', '978-979-3062-79-1', 'Tersedia', 5, 3, 'Rak A-Fiksi 1', 'bg-amber-100 text-amber-900 border-amber-300', 'Kisah perjuangan sepuluh anak di Belitung Timur.', 2005),
    ('B002', 'Bumi Manusia', 'Pramoedya Ananta Toer', 'Sastra Sejarah', '978-979-97312-3-5', 'Tersedia', 4, 3, 'Rak B-Sejarah 2', 'bg-amber-900 text-amber-100 border-amber-950', 'Mahakarya roman sejarah berlatar kebangkitan nasional Indonesia.', 1980),
    ('B003', 'Filosofi Teras', 'Henry Manampiring', 'Pengembangan Diri / Filsafat', '978-602-06-2180-7', 'Dipinjam', 2, 1, 'Rak C-Filsafat 1', 'bg-teal-900 text-teal-50 border-teal-950', 'Panduan praktis filsafat Stoisisme untuk mental tangguh.', 2018),
    ('B004', 'Pulang', 'Leila S. Chudori', 'Novel Sejarah', '978-979-91-0512-7', 'Tersedia', 1, 1, 'Rak B-Sejarah 1', 'bg-rose-950 text-rose-100 border-rose-950', 'Drama keluarga dan pengasingan politik.', 2012),
    ('B005', 'Dilan: Dia adalah Dilanku tahun 1990', 'Pidi Baiq', 'Romansa Remaja', '978-602-7870-86-4', 'Tersedia', 5, 4, 'Rak E-Populer 3', 'bg-sky-100 text-sky-900 border-sky-300', 'Roman remaja berlatar kota Bandung tahun 1990.', 2014),
    ('B006', 'Sapiens: Riwayat Singkat Umat Manusia', 'Yuval Noah Harari', 'Sains & Sejarah', '978-602-424-416-3', 'Tersedia', 4, 3, 'Rak E-Sains 1', 'bg-stone-800 text-stone-100 border-stone-900', 'Penjelajahan sejarah evolusi manusia dari zaman batu hingga modern.', 2011),
    ('B007', 'Fisika Dasar untuk SMA/MA Kelas X', 'Marthen Kanginan', 'Sains & Sejarah', '978-602-298-771-0', 'Tersedia', 10, 8, 'Rak S-Fisika 1', 'bg-teal-800 text-teal-50 border-teal-950', 'Buku panduan kurikulum fisika kelas X lengkap dengan praktikum.', 2022)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    stock = EXCLUDED.stock,
    available_stock = EXCLUDED.available_stock;

-- Data Pengguna Sistem (Staf/Manajemen Perpustakaan: Admin, Guru, Kepsek)
INSERT INTO users (id, name, username, email, password_hash, role, status, rfid_card)
VALUES 
    ('U001', 'Administrator Perpustakaan', 'admin.super', 'admin@sman1lumbung.sch.id', '$2b$10$cxBHgsrPC/FRYvg0xnZJfO22ByOYtdgzPVUKCQvDGr.kae3tq6f6i', 'Admin', 'Aktif', 'RFID-ADM-001'),
    ('U002', 'Drs. H. Mulyana, M.Pd.', 'guru', 'mulyana@sman1lumbung.sch.id', '$2b$10$aZh7zfK1t4sTKMKc39GYLOEKuLAkQiFeUUZwfsAecqye71JRX5lsa', 'Guru', 'Aktif', 'RFID-GUR-1975001'),
    ('U003', 'Dr. H. Suherman, M.Pd.', 'kepsek', 'kepsek@sman1lumbung.sch.id', '$2b$10$eSEMChxeEZ6wTz8I3bW5AO0IJz8.DOV.ntWCMAeAEQ/I6Yu.6zGKG', 'Kepsek', 'Aktif', 'RFID-KEP-001')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash;

-- Data Token Keamanan Sistem (Tersimpan di Database)
INSERT INTO security_tokens (id, token_key, token_hash, description, is_active)
VALUES 
    ('SEC_TOK_001', 'DB_STUDIO_ACCESS', '$2b$10$64Z/1z6Vq4D3K2tX6iV0O.gM0J0c8S2f5r.c7gV8z0Y1u.H3mK7i.', 'Token otorisasi akses modul Uji Database & Schema SQL', TRUE)
ON CONFLICT (token_key) DO UPDATE SET
    token_hash = EXCLUDED.token_hash,
    is_active = EXCLUDED.is_active;

-- Data Transaksi Sirkulasi
INSERT INTO transactions (id, book_id, book_title, member_id, member_name, borrow_date, due_date, return_date, status, fine_amount, notes)
VALUES 
    ('TRX-1001', 'B001', 'Laskar Pelangi', 'M001', 'Budi Santoso', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '2 days', NULL, 'Terlambat', 2000.00, 'Keterlambatan 2 hari kerja'),
    ('TRX-1002', 'B003', 'Filosofi Teras', 'M001', 'Budi Santoso', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', NULL, 'Berlangsung', 0.00, 'Peminjaman aktif'),
    ('TRX-1003', 'B002', 'Bumi Manusia', 'M002', 'Siti Rahmawati', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '3 days', NULL, 'Berlangsung', 0.00, 'Peminjaman aktif'),
    ('TRX-1004', 'B004', 'Pulang', 'M003', 'Ahmad Hidayat', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '5 days', 'Selesai', 0.00, 'Tepat waktu')
ON CONFLICT (id) DO NOTHING;
