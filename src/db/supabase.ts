import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { hashPassword } from '../utils/password.js';

dotenv.config();

// Supabase Credentials
export const SUPABASE_URL = 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  'https://samnjusvxjuqsnnhjucj.supabase.co';

export const SUPABASE_KEY = 
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  process.env.SUPABASE_PUBLISHABLE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  'sb_publishable_QRmr07AWqRIHJswHQ-tNBw_r0UOFXWo';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_KEY && 
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('your-project')
);

// Create Client
let _supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!_supabaseClient) {
    _supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return _supabaseClient;
}

export const supabase = getSupabase();

/**
 * Ping Supabase to test connectivity and measure latency
 */
export async function testSupabasePing(): Promise<{
  success: boolean;
  latencyMs: number;
  message: string;
  url: string;
  projectRef: string;
  tablesFound?: string[];
  tablesPending?: boolean;
  error?: string;
}> {
  const startTime = Date.now();
  const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

  if (!isSupabaseConfigured) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Supabase URL atau Publishable Key belum dikonfigurasi.',
      url: SUPABASE_URL,
      projectRef
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Gagal menginisialisasi Supabase client.',
      url: SUPABASE_URL,
      projectRef
    };
  }

  try {
    // Ping Supabase PostgREST via client
    const { data, error, status } = await client.from('books').select('*').limit(1);
    const latencyMs = Date.now() - startTime;

    // Check if table missing in schema cache (PGRST205) - this confirms Supabase connection is 100% active and credentials are valid!
    if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache') || status === 404)) {
      return {
        success: true,
        latencyMs,
        message: `Terhubung ke Supabase (${projectRef}) dengan latensi ${latencyMs}ms. Tabel belum dibuat di schema cache Supabase. Jalankan script schema.sql di Supabase SQL Editor.`,
        url: SUPABASE_URL,
        projectRef,
        tablesPending: true,
        tablesFound: []
      };
    }

    if (!error) {
      // Check other tables
      const tablesToCheck = ['classes', 'students', 'members', 'books', 'transactions', 'users'];
      const availableTables: string[] = ['books'];

      for (const t of tablesToCheck) {
        if (t === 'books') continue;
        try {
          const check = await client.from(t).select('id').limit(1);
          if (!check.error) {
            availableTables.push(t);
          }
        } catch {
          // ignore
        }
      }

      return {
        success: true,
        latencyMs,
        message: `Terhubung penuh ke Supabase (${projectRef})! Ditemukan ${availableTables.length} tabel aktif.`,
        url: SUPABASE_URL,
        projectRef,
        tablesPending: false,
        tablesFound: availableTables
      };
    }

    return {
      success: false,
      latencyMs,
      message: `Supabase Error: ${error.message}`,
      url: SUPABASE_URL,
      projectRef,
      error: error.message
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      latencyMs,
      message: 'Gagal terhubung ke host Supabase.',
      url: SUPABASE_URL,
      projectRef,
      error: err.message
    };
  }
}

/**
 * Automatically sync initial seed data to Supabase (with bcrypt password hashing)
 */
export async function seedSupabaseData(): Promise<{
  success: boolean;
  message: string;
  results: Record<string, { inserted: number; error?: string }>;
}> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase client tidak aktif.',
      results: {}
    };
  }

  const results: Record<string, { inserted: number; error?: string }> = {};

  try {
    // 1. Classes
    const initialClasses = [
      { id: 'K001', name: 'X MIPA 1', grade_level: 'X', academic_year: '2025/2026', homeroom_teacher: 'Drs. H. Mulyana, M.Pd.', student_count: 36 },
      { id: 'K002', name: 'X MIPA 2', grade_level: 'X', academic_year: '2025/2026', homeroom_teacher: 'Dra. Hj. Nunung Rohayati', student_count: 35 },
      { id: 'K003', name: 'XI MIPA 1', grade_level: 'XI', academic_year: '2025/2026', homeroom_teacher: 'Asep Saepuloh, S.Pd., M.M.', student_count: 34 },
      { id: 'K004', name: 'XII IPS 1', grade_level: 'XII', academic_year: '2025/2026', homeroom_teacher: 'Cucun Hendayana, S.Pd.', student_count: 36 }
    ];
    const { error: clsErr } = await client.from('classes').upsert(initialClasses, { onConflict: 'id' });
    results.classes = { inserted: clsErr ? 0 : initialClasses.length, error: clsErr?.message };

    // 2. Students (with bcrypt password hashing)
    const initialStudents = [
      { id: 'S001', nis: '2026001', nisn: '0081234561', name: 'Budi Santoso', gender: 'L', class_id: 'K001', class_name: 'X MIPA 1', rfid_card: 'RFID-SIS-2026001', email: 'budi.santoso@sman1lumbung.sch.id', phone: '081234567891', username: 'siswa', password_hash: hashPassword('siswa123'), status: 'Aktif' },
      { id: 'S002', nis: '2026002', nisn: '0081234562', name: 'Siti Rahmawati', gender: 'P', class_id: 'K001', class_name: 'X MIPA 1', rfid_card: 'RFID-SIS-2026002', email: 'siti.rahmawati@sman1lumbung.sch.id', phone: '081234567892', username: 'siti', password_hash: hashPassword('siti123'), status: 'Aktif' },
      { id: 'S003', nis: '2026003', nisn: '0081234563', name: 'Ahmad Hidayat', gender: 'L', class_id: 'K003', class_name: 'XI MIPA 1', rfid_card: 'RFID-SIS-2026003', email: 'ahmad.hidayat@sman1lumbung.sch.id', phone: '081234567893', username: 'ahmad', password_hash: hashPassword('ahmad123'), status: 'Aktif' }
    ];
    const { error: stdErr } = await client.from('students').upsert(initialStudents, { onConflict: 'id' });
    results.students = { inserted: stdErr ? 0 : initialStudents.length, error: stdErr?.message };

    // 3. Members
    const initialMembers = [
      { id: 'M001', name: 'Budi Santoso', status: 'Aktif', rfid_card: 'RFID-SIS-2026001', type: 'Siswa', email: 'budi.santoso@sman1lumbung.sch.id', phone: '081234567891', max_books: 3, active_loans_count: 2, student_id: 'S001' },
      { id: 'M002', name: 'Siti Rahmawati', status: 'Aktif', rfid_card: 'RFID-SIS-2026002', type: 'Siswa', email: 'siti.rahmawati@sman1lumbung.sch.id', phone: '081234567892', max_books: 3, active_loans_count: 1, student_id: 'S002' },
      { id: 'M003', name: 'Ahmad Hidayat', status: 'Aktif', rfid_card: 'RFID-SIS-2026003', type: 'Siswa', email: 'ahmad.hidayat@sman1lumbung.sch.id', phone: '081234567893', max_books: 3, active_loans_count: 1, student_id: 'S003' },
      { id: 'M004', name: 'Drs. H. Mulyana, M.Pd.', status: 'Aktif', rfid_card: 'RFID-GUR-1975001', type: 'Dosen', email: 'mulyana@sman1lumbung.sch.id', phone: '081322119988', max_books: 5, active_loans_count: 0, student_id: null }
    ];
    const { error: memErr } = await client.from('members').upsert(initialMembers, { onConflict: 'id' });
    results.members = { inserted: memErr ? 0 : initialMembers.length, error: memErr?.message };

    // 4. Books
    const initialBooks = [
      { id: 'B001', title: 'Laskar Pelangi', author: 'Andrea Hirata', category: 'Fiksi / Drama', isbn: '978-979-3062-79-1', status: 'Tersedia', stock: 5, available_stock: 3, location: 'Rak A-Fiksi 1', cover_color: 'bg-amber-100 text-amber-900 border-amber-300', description: 'Kisah perjuangan sepuluh anak di Belitung Timur.', publish_year: 2005 },
      { id: 'B002', title: 'Bumi Manusia', author: 'Pramoedya Ananta Toer', category: 'Sastra Sejarah', isbn: '978-979-97312-3-5', status: 'Tersedia', stock: 4, available_stock: 3, location: 'Rak B-Sejarah 2', cover_color: 'bg-amber-900 text-amber-100 border-amber-950', description: 'Mahakarya roman sejarah berlatar kebangkitan nasional Indonesia.', publish_year: 1980 },
      { id: 'B003', title: 'Filosofi Teras', author: 'Henry Manampiring', category: 'Pengembangan Diri / Filsafat', isbn: '978-602-06-2180-7', status: 'Dipinjam', stock: 2, available_stock: 1, location: 'Rak C-Filsafat 1', cover_color: 'bg-teal-900 text-teal-50 border-teal-950', description: 'Panduan praktis filsafat Stoisisme untuk mental tangguh.', publish_year: 2018 },
      { id: 'B004', title: 'Pulang', author: 'Leila S. Chudori', category: 'Novel Sejarah', isbn: '978-979-91-0512-7', status: 'Tersedia', stock: 1, available_stock: 1, location: 'Rak B-Sejarah 1', cover_color: 'bg-rose-950 text-rose-100 border-rose-950', description: 'Drama keluarga dan pengasingan politik.', publish_year: 2012 },
      { id: 'B005', title: 'Dilan: Dia adalah Dilanku tahun 1990', author: 'Pidi Baiq', category: 'Romansa Remaja', isbn: '978-602-7870-86-4', status: 'Tersedia', stock: 5, available_stock: 4, location: 'Rak E-Populer 3', cover_color: 'bg-sky-100 text-sky-900 border-sky-300', description: 'Roman remaja berlatar kota Bandung tahun 1990.', publish_year: 2014 },
      { id: 'B006', title: 'Sapiens: Riwayat Singkat Umat Manusia', author: 'Yuval Noah Harari', category: 'Sains & Sejarah', isbn: '978-602-424-416-3', status: 'Tersedia', stock: 4, available_stock: 3, location: 'Rak E-Sains 1', cover_color: 'bg-stone-800 text-stone-100 border-stone-900', description: 'Penjelajahan sejarah evolusi manusia dari zaman batu hingga modern.', publish_year: 2011 },
      { id: 'B007', title: 'Fisika Dasar untuk SMA/MA Kelas X', author: 'Marthen Kanginan', category: 'Sains & Sejarah', isbn: '978-602-298-771-0', status: 'Tersedia', stock: 10, available_stock: 8, location: 'Rak S-Fisika 1', cover_color: 'bg-teal-800 text-teal-50 border-teal-950', description: 'Buku panduan kurikulum fisika kelas X lengkap dengan praktikum.', publish_year: 2022 }
    ];
    const { error: bksErr } = await client.from('books').upsert(initialBooks, { onConflict: 'id' });
    results.books = { inserted: bksErr ? 0 : initialBooks.length, error: bksErr?.message };

    // 5. Users (with bcrypt password hashing)
    const initialUsers = [
      { id: 'U001', name: 'Administrator Perpustakaan', username: 'admin.super', email: 'admin@sman1lumbung.sch.id', password_hash: hashPassword('admin123'), role: 'Admin', status: 'Aktif', rfid_card: 'RFID-ADM-001' },
      { id: 'U002', name: 'Drs. H. Mulyana, M.Pd.', username: 'guru', email: 'mulyana@sman1lumbung.sch.id', password_hash: hashPassword('guru123'), role: 'Guru', status: 'Aktif', rfid_card: 'RFID-GUR-1975001' },
      { id: 'U003', name: 'Dr. H. Suherman, M.Pd.', username: 'kepsek', email: 'kepsek@sman1lumbung.sch.id', password_hash: hashPassword('kepsek123'), role: 'Kepsek', status: 'Aktif', rfid_card: 'RFID-KEP-001' },
      { id: 'U004', name: 'Budi Santoso', username: 'siswa', email: 'budi.santoso@sman1lumbung.sch.id', password_hash: hashPassword('siswa123'), role: 'Siswa', status: 'Aktif', rfid_card: 'RFID-SIS-2026001' }
    ];
    const { error: usrErr } = await client.from('users').upsert(initialUsers, { onConflict: 'id' });
    results.users = { inserted: usrErr ? 0 : initialUsers.length, error: usrErr?.message };

    const hasErrors = Object.values(results).some(r => !!r.error);

    return {
      success: !hasErrors,
      message: hasErrors 
        ? 'Beberapa tabel belum ada di Supabase. Silakan jalankan script schema.sql terlebih dahulu di Supabase SQL Editor.'
        : 'Data awal berhasil disinkronkan ke Supabase dengan enkripsi hash password bcrypt!',
      results
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menyinkronkan data ke Supabase',
      results
    };
  }
}
