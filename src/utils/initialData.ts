import { Book, Member, Transaction, RolePermissions, UserAccount, KelasItem, SiswaItem } from '../types/library';

// Pre-seeded Role Permissions (RBAC Matrix)
export const INITIAL_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'Admin',
    allowedMenus: ['dashboard', 'sirkulasi_peminjaman', 'sirkulasi_pengembalian', 'katalog', 'manajemen_buku', 'data_peminjam_buku', 'anggota', 'manajemen_pengguna', 'riwayat'],
    allowedActions: ['edit_buku', 'hapus_buku', 'edit_anggota', 'proses_peminjaman', 'proses_pengembalian', 'unduh_laporan']
  },
  {
    role: 'Guru',
    allowedMenus: ['dashboard', 'katalog', 'data_peminjam_buku', 'riwayat'],
    allowedActions: ['unduh_laporan']
  },
  {
    role: 'Siswa',
    allowedMenus: ['dashboard', 'katalog', 'buku_pinjaman'],
    allowedActions: []
  },
  {
    role: 'Kepsek',
    allowedMenus: ['dashboard', 'katalog', 'data_peminjam_buku', 'riwayat'],
    allowedActions: ['unduh_laporan']
  }
];

// Pre-seeded Books catalog in Indonesian
const INITIAL_BOOKS: Book[] = [
  {
    id: 'B001',
    title: 'Laskar Pelangi',
    author: 'Andrea Hirata',
    category: 'Fiksi / Drama',
    isbn: '978-979-3062-79-1',
    status: 'Tersedia',
    stock: 3,
    availableStock: 2,
    location: 'Rak A-Fiksi 1',
    coverColor: 'bg-amber-100 text-amber-900 border-amber-300',
    publishYear: 2005,
    description: 'Kisah perjuangan sepuluh anak di Belitung Timur yang bersekolah di sebuah sekolah dasar sederhana berbekal cita-cita setinggi langit di tengah keterbatasan fasilitas.'
  },
  {
    id: 'B002',
    title: 'Bumi Manusia',
    author: 'Pramoedya Ananta Toer',
    category: 'Sastra Sejarah',
    isbn: '978-979-97312-3-5',
    status: 'Tersedia',
    stock: 2,
    availableStock: 2,
    location: 'Rak B-Sejarah 2',
    coverColor: 'bg-amber-900 text-amber-100 border-amber-950',
    publishYear: 1980,
    description: 'Mahakarya roman sejarah berlatar masa kebangkitan nasional Indonesia pada akhir abad ke-19, mengisahkan tokoh Minke dan pergulatan asmaranya dengan Annelies.'
  },
  {
    id: 'B003',
    title: 'Filosofi Teras',
    author: 'Henry Manampiring',
    category: 'Pengembangan Diri / Filsafat',
    isbn: '978-602-06-2180-7',
    status: 'Dipinjam',
    stock: 2,
    availableStock: 1,
    location: 'Rak C-Filsafat 1',
    coverColor: 'bg-teal-900 text-teal-50 border-teal-950',
    publishYear: 2018,
    description: 'Panduan praktis filsafat Yunani-Romawi kuno (Stoisisme) untuk mengatasi kecemasan mental, mengontrol emosi negatif, dan melatih kedamaian batin dalam kehidupan modern.'
  },
  {
    id: 'B004',
    title: 'Pulang',
    author: 'Leila S. Chudori',
    category: 'Novel Sejarah',
    isbn: '978-979-91-0512-7',
    status: 'Tersedia',
    stock: 1,
    availableStock: 1,
    location: 'Rak B-Sejarah 1',
    coverColor: 'bg-rose-950 text-rose-100 border-rose-950',
    publishYear: 2012,
    description: 'Drama keluarga, cinta, dan pengasingan politik berlatar peristiwa 1965 di Jakarta dan eksil politik Indonesia di Paris pasca-peristiwa tersebut.'
  },
  {
    id: 'B005',
    title: 'Dilan: Dia adalah Dilanku tahun 1990',
    author: 'Pidi Baiq',
    category: 'Romansa Remaja',
    isbn: '978-602-7870-86-4',
    status: 'Tersedia',
    stock: 5,
    availableStock: 4,
    location: 'Rak E-Populer 3',
    coverColor: 'bg-sky-100 text-sky-900 border-sky-300',
    publishYear: 2014,
    description: 'Roman remaja legendaris berlatar kota Bandung tahun 1990, menyajikan kisah asmara Milea dan Dilan, panglima tempur geng motor yang penuh kejutan manis.'
  },
  {
    id: 'B006',
    title: 'Sapiens: Sejarah Singkat Manusia',
    author: 'Yuval Noah Harari',
    category: 'Sains & Sejarah',
    isbn: '978-602-441-020-9',
    status: 'Tersedia',
    stock: 2,
    availableStock: 2,
    location: 'Rak D-Sains 4',
    coverColor: 'bg-stone-800 text-stone-100 border-stone-900',
    publishYear: 2011,
    description: 'Eksplorasi revolusioner tentang sejarah peradaban spesies Homo Sapiens sejak zaman purba hingga masa kecerdasan buatan masa depan.'
  }
];

// Pre-seeded Members in Indonesian
const INITIAL_MEMBERS: Member[] = [
  {
    id: 'A001',
    name: 'Budi Santoso',
    status: 'Aktif',
    rfidCard: 'RFID-MEM-A001',
    type: 'Mahasiswa',
    email: 'budi.santoso@mahasiswa.univ.ac.id',
    phone: '0812-3456-7890',
    maxBooks: 3,
    activeLoansCount: 1
  },
  {
    id: 'A002',
    name: 'Prof. Dr. Siti Rahmawati',
    status: 'Aktif',
    rfidCard: 'RFID-MEM-A002',
    type: 'Dosen',
    email: 'siti.rahma@dosen.univ.ac.id',
    phone: '0811-9876-5432',
    maxBooks: 5,
    activeLoansCount: 1
  },
  {
    id: 'A003',
    name: 'Ahmad Hidayat',
    status: 'Aktif',
    rfidCard: 'RFID-MEM-A003',
    type: 'Mahasiswa',
    email: 'ahmad.hidayat@mahasiswa.univ.ac.id',
    phone: '0813-2244-6688',
    maxBooks: 3,
    activeLoansCount: 0
  },
  {
    id: 'A004',
    name: 'Dewi Lestari',
    status: 'Ditangguhkan',
    rfidCard: 'RFID-MEM-A004',
    type: 'Mahasiswa',
    email: 'dewi.lestari@mahasiswa.univ.ac.id',
    phone: '0815-5555-7777',
    maxBooks: 3,
    activeLoansCount: 0
  }
];

// Pre-seeded Transactions
// Generates relative dates for demonstration (e.g. today, 3 days ago, 10 days ago (which is overdue!))
const getRelativeISOString = (daysOffset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-1001',
    bookId: 'B003', // Filosofi Teras (stok dipinjam)
    bookTitle: 'Filosofi Teras',
    memberId: 'A001', // Budi Santoso
    memberName: 'Budi Santoso',
    borrowDate: getRelativeISOString(-5), // 5 hari lalu
    dueDate: getRelativeISOString(2),     // 2 hari lagi
    returnDate: null,
    status: 'Berlangsung',
    fineAmount: 0,
    notes: 'Peminjaman via Mandiri Kiosk'
  },
  {
    id: 'TRX-1002',
    bookId: 'B005', // Dilan 1990
    bookTitle: 'Dilan: Dia adalah Dilanku tahun 1990',
    memberId: 'A002', // Siti Rahmawati
    memberName: 'Prof. Dr. Siti Rahmawati',
    borrowDate: getRelativeISOString(-12), // 12 hari lalu
    dueDate: getRelativeISOString(-5),    // Harus kembali 5 hari lalu -> Terlambat!
    returnDate: null,
    status: 'Terlambat',
    fineAmount: 5000, // Rp 1.000 per hari x 5 hari terlambat
    notes: 'Peminjaman Kelas Khusus'
  },
  {
    id: 'TRX-1003',
    bookId: 'B001', // Laskar Pelangi
    bookTitle: 'Laskar Pelangi',
    memberId: 'A003', // Ahmad Hidayat
    memberName: 'Ahmad Hidayat',
    borrowDate: getRelativeISOString(-10),
    dueDate: getRelativeISOString(-3),
    returnDate: getRelativeISOString(-3), // Sudah dikembalikan tepat waktu
    status: 'Selesai',
    fineAmount: 0,
    notes: 'Pengembalian via Smart RFID Desk'
  }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'U001',
    name: 'Admin Perpus',
    username: 'admin.super',
    email: 'admin.super@sman1lumbung.sch.id',
    role: 'Admin',
    password: 'admin123',
    status: 'Aktif',
    createdAt: '2026-01-15'
  },
  {
    id: 'U002',
    name: 'Dewi Lestari, S.Pd.',
    username: 'dewi.pustaka',
    email: 'dewi.l@sman1lumbung.sch.id',
    role: 'Guru',
    password: 'admin123',
    status: 'Aktif',
    createdAt: '2026-03-22'
  },
  {
    id: 'U003',
    name: 'Drs. H. Mulyana, M.Pd.',
    username: 'kepsek.utama',
    email: 'kepsek@sman1lumbung.sch.id',
    role: 'Kepsek',
    password: 'admin123',
    status: 'Aktif',
    createdAt: '2026-09-01'
  }
];

export const INITIAL_KELAS: KelasItem[] = [
  { id: 'K001', name: 'X MIPA 1', gradeLevel: 'X', academicYear: '2025/2026', homeroomTeacher: 'Drs. H. Mulyana, M.Pd.', studentCount: 32 },
  { id: 'K002', name: 'X IPS 2', gradeLevel: 'X', academicYear: '2025/2026', homeroomTeacher: 'Dewi Lestari, S.Pd.', studentCount: 30 },
  { id: 'K003', name: 'XI MIPA 1', gradeLevel: 'XI', academicYear: '2025/2026', homeroomTeacher: 'Ahmad Hidayat, S.Si.', studentCount: 34 },
  { id: 'K004', name: 'XII MIPA 3', gradeLevel: 'XII', academicYear: '2025/2026', homeroomTeacher: 'Dr. Hj. Nurhayati, M.Si.', studentCount: 28 },
];

export const INITIAL_SISWA: SiswaItem[] = [
  {
    id: 'S001',
    nis: '2026001',
    nisn: '0081234567',
    name: 'Budi Santoso',
    gender: 'L',
    kelasId: 'K001',
    kelasName: 'X MIPA 1',
    rfidCard: 'RFID-MEM-A001',
    email: 'budi.santoso@sman1lumbung.sch.id',
    phone: '0812-3456-7890',
    username: 'budi.sirkulasi',
    password: 'admin123',
    status: 'Aktif',
    createdAt: '2026-01-15'
  },
  {
    id: 'S002',
    nis: '2026002',
    nisn: '0087654321',
    name: 'Siti Aminah',
    gender: 'P',
    kelasId: 'K001',
    kelasName: 'X MIPA 1',
    rfidCard: 'RFID-SIS-2026002',
    email: 'siti.aminah@sman1lumbung.sch.id',
    phone: '0813-9876-5432',
    username: '2026002',
    password: '123456',
    status: 'Aktif',
    createdAt: '2026-02-10'
  },
  {
    id: 'S003',
    nis: '2026003',
    nisn: '0089988776',
    name: 'Rizky Ramadhan',
    gender: 'L',
    kelasId: 'K003',
    kelasName: 'XI MIPA 1',
    rfidCard: 'RFID-SIS-2026003',
    email: 'rizky.r@sman1lumbung.sch.id',
    phone: '0815-1122-3344',
    username: 'rizky.ramadhan',
    password: '123456',
    status: 'Aktif',
    createdAt: '2026-03-01'
  }
];

export const initializeDatabase = () => {
  if (!localStorage.getItem('ep_books')) {
    localStorage.setItem('ep_books', JSON.stringify(INITIAL_BOOKS));
  }
  if (!localStorage.getItem('ep_members')) {
    localStorage.setItem('ep_members', JSON.stringify(INITIAL_MEMBERS));
  }
  if (!localStorage.getItem('ep_transactions')) {
    localStorage.setItem('ep_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
  }
  if (!localStorage.getItem('ep_role_permissions')) {
    localStorage.setItem('ep_role_permissions', JSON.stringify(INITIAL_ROLE_PERMISSIONS));
  }
  if (!localStorage.getItem('ep_users')) {
    localStorage.setItem('ep_users', JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem('ep_kelas')) {
    localStorage.setItem('ep_kelas', JSON.stringify(INITIAL_KELAS));
  }
  if (!localStorage.getItem('ep_siswa')) {
    localStorage.setItem('ep_siswa', JSON.stringify(INITIAL_SISWA));
  }
};

export const getKelas = (): KelasItem[] => {
  initializeDatabase();
  return JSON.parse(localStorage.getItem('ep_kelas') || '[]');
};

export const saveKelas = (kelas: KelasItem[]) => {
  localStorage.setItem('ep_kelas', JSON.stringify(kelas));
};

export const getSiswa = (): SiswaItem[] => {
  initializeDatabase();
  return JSON.parse(localStorage.getItem('ep_siswa') || '[]');
};

export const saveSiswa = (siswaList: SiswaItem[]) => {
  localStorage.setItem('ep_siswa', JSON.stringify(siswaList));
  
  // Sync students to ep_members so RFID scanning and loans work in circulation desk
  const currentMembers: Member[] = JSON.parse(localStorage.getItem('ep_members') || '[]');
  const nonSiswaMembers = currentMembers.filter(m => m.type !== 'Siswa' && !m.id.startsWith('SIS-'));
  
  const studentMembers: Member[] = siswaList.map(s => ({
    id: `SIS-${s.id}`,
    name: `${s.name} (${s.kelasName})`,
    status: s.status === 'Aktif' ? 'Aktif' : 'Ditangguhkan',
    rfidCard: s.rfidCard,
    type: 'Siswa',
    email: s.email || `${s.username}@sman1lumbung.sch.id`,
    phone: s.phone,
    maxBooks: 3,
    activeLoansCount: 0
  }));
  
  localStorage.setItem('ep_members', JSON.stringify([...nonSiswaMembers, ...studentMembers]));
};

export const getUsers = (): UserAccount[] => {
  initializeDatabase();
  return JSON.parse(localStorage.getItem('ep_users') || '[]');
};

export const saveUsers = (users: UserAccount[]) => {
  localStorage.setItem('ep_users', JSON.stringify(users));
};

export const getRolePermissions = (): RolePermissions[] => {
  initializeDatabase();
  return JSON.parse(localStorage.getItem('ep_role_permissions') || '[]');
};

export const saveRolePermissions = (perms: RolePermissions[]) => {
  localStorage.setItem('ep_role_permissions', JSON.stringify(perms));
};

export const getBooks = (): Book[] => {
  initializeDatabase();
  return JSON.parse(localStorage.getItem('ep_books') || '[]');
};

export const saveBooks = (books: Book[]) => {
  localStorage.setItem('ep_books', JSON.stringify(books));
};

export const getMembers = (): Member[] => {
  initializeDatabase();
  return JSON.parse(localStorage.getItem('ep_members') || '[]');
};

export const saveMembers = (members: Member[]) => {
  localStorage.setItem('ep_members', JSON.stringify(members));
};

export const getTransactions = (): Transaction[] => {
  initializeDatabase();
  const transactions: Transaction[] = JSON.parse(localStorage.getItem('ep_transactions') || '[]');
  
  // Dynamic overdue calculation upon loading transactions
  const todayStr = new Date().toISOString().split('T')[0];
  const updatedTransactions = transactions.map(t => {
    if (t.status !== 'Selesai' && !t.returnDate) {
      const dueTime = new Date(t.dueDate).getTime();
      const todayTime = new Date(todayStr).getTime();
      if (todayTime > dueTime) {
        const diffDays = Math.ceil((todayTime - dueTime) / (1000 * 60 * 60 * 24));
        return {
          ...t,
          status: 'Terlambat' as const,
          fineAmount: diffDays * 1000 // Rp 1.000 per hari terlambat
        };
      }
    }
    return t;
  });
  
  localStorage.setItem('ep_transactions', JSON.stringify(updatedTransactions));
  return updatedTransactions;
};

export const saveTransactions = (transactions: Transaction[]) => {
  localStorage.setItem('ep_transactions', JSON.stringify(transactions));
};
