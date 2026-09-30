import { getDb, isDatabaseConfigured } from './neon.ts';

export async function initializeNeonDatabase() {
  if (!isDatabaseConfigured) {
    console.log('[Neon Database] DATABASE_URL is not configured with live credentials. Operating with fallback storage.');
    return { success: false, reason: 'NOT_CONFIGURED' };
  }

  const sql = getDb();
  if (!sql) return { success: false, reason: 'NO_CLIENT' };

  try {
    console.log('[Neon Database] Initializing PostgreSQL schema and tables...');

    // 1. Create Tables
    await sql`
      CREATE TABLE IF NOT EXISTS classes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        grade_level VARCHAR(10) NOT NULL,
        academic_year VARCHAR(20) NOT NULL DEFAULT '2025/2026',
        homeroom_teacher VARCHAR(150) NOT NULL,
        student_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(50) PRIMARY KEY,
        nis VARCHAR(50) UNIQUE NOT NULL,
        nisn VARCHAR(50),
        name VARCHAR(150) NOT NULL,
        gender VARCHAR(5) NOT NULL DEFAULT 'L',
        class_id VARCHAR(50) REFERENCES classes(id) ON DELETE SET NULL,
        class_name VARCHAR(100) NOT NULL,
        rfid_card VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150),
        phone VARCHAR(50),
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Aktif',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Aktif',
        rfid_card VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'Siswa',
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(50),
        max_books INT NOT NULL DEFAULT 3,
        active_loans_count INT NOT NULL DEFAULT 0,
        student_id VARCHAR(50) REFERENCES students(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS books (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(150) NOT NULL,
        category VARCHAR(100) NOT NULL,
        isbn VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Tersedia',
        stock INT NOT NULL DEFAULT 1,
        available_stock INT NOT NULL DEFAULT 1,
        location VARCHAR(100) NOT NULL,
        cover_color VARCHAR(100) NOT NULL DEFAULT 'bg-amber-100 text-amber-900 border-amber-300',
        description TEXT,
        publish_year INT NOT NULL DEFAULT 2024,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(100) PRIMARY KEY,
        book_id VARCHAR(50) NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
        book_title VARCHAR(255) NOT NULL,
        member_id VARCHAR(50) NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
        member_name VARCHAR(150) NOT NULL,
        borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE NOT NULL,
        return_date TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) NOT NULL DEFAULT 'Berlangsung',
        fine_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'Admin',
        status VARCHAR(20) NOT NULL DEFAULT 'Aktif',
        rfid_card VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS permissions (
        role VARCHAR(20) PRIMARY KEY,
        allowed_menus JSONB NOT NULL,
        allowed_actions JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Check and Seed Initial Data if empty
    const bookCountRes = await sql`SELECT count(*)::int as count FROM books;`;
    if (bookCountRes[0].count === 0) {
      console.log('[Neon Database] Seeding initial SMAN 1 Lumbung data into PostgreSQL...');

      // Seed Classes
      await sql`
        INSERT INTO classes (id, name, grade_level, academic_year, homeroom_teacher, student_count)
        VALUES 
          ('K001', 'X MIPA 1', 'X', '2025/2026', 'Drs. H. Mulyana, M.Pd.', 36),
          ('K002', 'X MIPA 2', 'X', '2025/2026', 'Dra. Hj. Nunung Rohayati', 35),
          ('K003', 'XI MIPA 1', 'XI', '2025/2026', 'Asep Saepuloh, S.Pd., M.M.', 34),
          ('K004', 'XII IPS 1', 'XII', '2025/2026', 'Cucun Hendayana, S.Pd.', 36)
        ON CONFLICT (id) DO NOTHING;
      `;

      // Seed Students
      await sql`
        INSERT INTO students (id, nis, nisn, name, gender, class_id, class_name, rfid_card, email, phone, username, password_hash, status)
        VALUES 
          ('S001', '2026001', '0081234561', 'Budi Santoso', 'L', 'K001', 'X MIPA 1', 'RFID-SIS-2026001', 'budi.santoso@sman1lumbung.sch.id', '081234567891', 'siswa', 'siswa123', 'Aktif'),
          ('S002', '2026002', '0081234562', 'Siti Rahmawati', 'P', 'K001', 'X MIPA 1', 'RFID-SIS-2026002', 'siti.rahmawati@sman1lumbung.sch.id', '081234567892', 'siti', 'siti123', 'Aktif'),
          ('S003', '2026003', '0081234563', 'Ahmad Hidayat', 'L', 'K003', 'XI MIPA 1', 'RFID-SIS-2026003', 'ahmad.hidayat@sman1lumbung.sch.id', '081234567893', 'ahmad', 'ahmad123', 'Aktif')
        ON CONFLICT (id) DO NOTHING;
      `;

      // Seed Members
      await sql`
        INSERT INTO members (id, name, status, rfid_card, type, email, phone, max_books, active_loans_count, student_id)
        VALUES 
          ('M001', 'Budi Santoso', 'Aktif', 'RFID-SIS-2026001', 'Siswa', 'budi.santoso@sman1lumbung.sch.id', '081234567891', 3, 2, 'S001'),
          ('M002', 'Siti Rahmawati', 'Aktif', 'RFID-SIS-2026002', 'Siswa', 'siti.rahmawati@sman1lumbung.sch.id', '081234567892', 3, 1, 'S002'),
          ('M003', 'Ahmad Hidayat', 'Aktif', 'RFID-SIS-2026003', 'Siswa', 'ahmad.hidayat@sman1lumbung.sch.id', '081234567893', 3, 1, 'S003'),
          ('M004', 'Drs. H. Mulyana, M.Pd.', 'Aktif', 'RFID-GUR-1975001', 'Dosen', 'mulyana@sman1lumbung.sch.id', '081322119988', 5, 0, NULL)
        ON CONFLICT (id) DO NOTHING;
      `;

      // Seed Books
      await sql`
        INSERT INTO books (id, title, author, category, isbn, status, stock, available_stock, location, cover_color, description, publish_year)
        VALUES 
          ('B001', 'Laskar Pelangi', 'Andrea Hirata', 'Fiksi / Drama', '978-979-3062-79-1', 'Tersedia', 3, 2, 'Rak A-Fiksi 1', 'bg-amber-100 text-amber-900 border-amber-300', 'Kisah perjuangan sepuluh anak di Belitung Timur.', 2005),
          ('B002', 'Bumi Manusia', 'Pramoedya Ananta Toer', 'Sastra Sejarah', '978-979-97312-3-5', 'Tersedia', 2, 2, 'Rak B-Sejarah 2', 'bg-amber-900 text-amber-100 border-amber-950', 'Mahakarya roman sejarah berlatar kebangkitan nasional Indonesia.', 1980),
          ('B003', 'Filosofi Teras', 'Henry Manampiring', 'Pengembangan Diri / Filsafat', '978-602-06-2180-7', 'Dipinjam', 2, 1, 'Rak C-Filsafat 1', 'bg-teal-900 text-teal-50 border-teal-950', 'Panduan praktis filsafat Stoisisme untuk mental tangguh.', 2018),
          ('B004', 'Pulang', 'Leila S. Chudori', 'Novel Sejarah', '978-979-91-0512-7', 'Tersedia', 1, 1, 'Rak B-Sejarah 1', 'bg-rose-950 text-rose-100 border-rose-950', 'Drama keluarga dan pengasingan politik.', 2012),
          ('B005', 'Dilan: Dia adalah Dilanku tahun 1990', 'Pidi Baiq', 'Romansa Remaja', '978-602-7870-86-4', 'Tersedia', 5, 4, 'Rak E-Populer 3', 'bg-sky-100 text-sky-900 border-sky-300', 'Roman remaja berlatar kota Bandung tahun 1990.', 2014),
          ('B006', 'Sapiens: Riwayat Singkat Umat Manusia', 'Yuval Noah Harari', 'Sains & Sejarah', '978-602-424-416-3', 'Tersedia', 4, 3, 'Rak E-Sains 1', 'bg-stone-800 text-stone-100 border-stone-900', 'Penjelajahan sejarah evolusi manusia dari zaman batu hingga modern.', 2011),
          ('B007', 'Fisika Dasar untuk SMA/MA Kelas X', 'Marthen Kanginan', 'Sains & Sejarah', '978-602-298-771-0', 'Tersedia', 10, 8, 'Rak S-Fisika 1', 'bg-teal-800 text-teal-50 border-teal-950', 'Buku panduan kurikulum fisika kelas X lengkap dengan praktikum.', 2022)
        ON CONFLICT (id) DO NOTHING;
      `;

      // Seed Users (Pengelola Sistem: Admin, Guru, Petugas Perpus, Kepsek)
      await sql`
        INSERT INTO users (id, name, username, email, password_hash, role, status, rfid_card)
        VALUES 
          ('U001', 'Administrator Perpustakaan', 'admin.super', 'admin@sman1lumbung.sch.id', 'admin123', 'Admin', 'Aktif', 'RFID-ADM-001'),
          ('U002', 'Drs. H. Mulyana, M.Pd.', 'guru', 'mulyana@sman1lumbung.sch.id', 'guru123', 'Guru', 'Aktif', 'RFID-GUR-1975001'),
          ('U003', 'Dewi Lestari, S.Pd.', 'petugas.perpus', 'dewi.perpus@sman1lumbung.sch.id', 'perpus123', 'Petugas Perpus', 'Aktif', 'RFID-STF-001'),
          ('U004', 'Dr. H. Suherman, M.Pd.', 'kepsek', 'kepsek@sman1lumbung.sch.id', 'kepsek123', 'Kepsek', 'Aktif', 'RFID-KEP-001')
        ON CONFLICT (id) DO NOTHING;
      `;

      // Seed Transactions
      await sql`
        INSERT INTO transactions (id, book_id, book_title, member_id, member_name, borrow_date, due_date, return_date, status, fine_amount, notes)
        VALUES 
          ('TRX-1001', 'B001', 'Laskar Pelangi', 'M001', 'Budi Santoso', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '2 days', NULL, 'Terlambat', 2000.00, 'Keterlambatan 2 hari kerja'),
          ('TRX-1002', 'B003', 'Filosofi Teras', 'M001', 'Budi Santoso', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', NULL, 'Berlangsung', 0.00, 'Peminjaman aktif'),
          ('TRX-1003', 'B002', 'Bumi Manusia', 'M002', 'Siti Rahmawati', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '3 days', NULL, 'Berlangsung', 0.00, 'Peminjaman aktif'),
          ('TRX-1004', 'B004', 'Pulang', 'M003', 'Ahmad Hidayat', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '5 days', 'Selesai', 0.00, 'Tepat waktu')
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    console.log('[Neon Database] Database tables and seed state verified successfully.');
    return { success: true };
  } catch (error) {
    console.error('[Neon Database] Error initializing PostgreSQL tables:', error);
    return { success: false, error };
  }
}
