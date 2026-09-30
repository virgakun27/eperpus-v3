export interface Book {
  id: string; // ID Buku (e.g., B001)
  title: string; // Judul Buku
  author: string; // Penulis
  category: string; // Kategori
  isbn: string; // Nomor ISBN
  status: 'Tersedia' | 'Dipinjam' | 'Hilang';
  stock: number; // Jumlah stok total
  availableStock: number; // Jumlah stok yang saat ini ada di perpustakaan
  location: string; // Lokasi rak
  coverColor: string; // Styling untuk sampul buku
  description?: string;
  publishYear: number;
}

export interface Member {
  id: string; // ID Anggota (e.g., A001)
  name: string; // Nama Lengkap
  status: 'Aktif' | 'Ditangguhkan'; // Status Keanggotaan
  rfidCard: string; // RFID Card ID (e.g., RFID-MEM-A001)
  type: 'Siswa' | 'Mahasiswa' | 'Dosen' | 'Staf' | 'Umum';
  email: string;
  phone?: string;
  maxBooks: number; // Batas peminjaman maksimal (e.g. Mahasiswa 3, Dosen 5)
  activeLoansCount: number;
}

export interface KelasItem {
  id: string; // e.g. K001
  name: string; // e.g. X MIPA 1
  gradeLevel: 'X' | 'XI' | 'XII';
  academicYear: string; // e.g. 2025/2026
  homeroomTeacher: string; // e.g. Drs. H. Mulyana, M.Pd.
  studentCount?: number;
}

export interface SiswaItem {
  id: string; // e.g. S001
  nis: string; // Nomor Induk Siswa (e.g. 2026001)
  nisn?: string;
  name: string;
  gender: 'L' | 'P';
  kelasId: string; // ID Kelas e.g. K001
  kelasName: string; // e.g. X MIPA 1
  rfidCard: string; // e.g. RFID-SIS-2026001
  email?: string;
  phone?: string;
  username: string; // Username login portal
  password: string; // Password login portal
  status: 'Aktif' | 'Nonaktif' | 'Ditangguhkan';
  createdAt: string;
}

export interface Transaction {
  id: string; // ID Transaksi (e.g., TRX-1001)
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  borrowDate: string; // ISO Date String
  dueDate: string; // ISO Date String
  returnDate: string | null; // ISO Date String atau null
  status: 'Berlangsung' | 'Selesai' | 'Terlambat';
  fineAmount: number; // Denda denda keterlambatan (dalam Rupiah)
  notes?: string;
}

export interface ScannerState {
  isScanning: boolean;
  scannerMode: 'idle' | 'member_rfid' | 'book_rfid' | 'book_qr';
  scanResult: string | null;
  scannedType: 'member' | 'book' | null;
}

export type StaffRole = 'Admin' | 'Guru' | 'Petugas Perpus' | 'Kepsek';
export type UserRole = StaffRole | 'Siswa';

export interface UserAccount {
  id: string; // e.g. U001
  name: string;
  username: string;
  email?: string; // Optional
  password?: string; // Optional
  role: StaffRole | UserRole;
  rfidCard?: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
}

export interface RolePermissions {
  role: UserRole;
  allowedMenus: string[]; // List of tab IDs
  allowedActions: string[]; // List of action IDs
}

