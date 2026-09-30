import React, { useState } from 'react';
import { Transaction, Book, Member } from '../types/library';
import { 
  BookOpen, 
  Search, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Bookmark, 
  ArrowRight,
  Sparkles,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface BukuPinjamanProps {
  transactions: Transaction[];
  books: Book[];
  currentMember?: Member | null;
  currentUsername?: string;
}

export const BukuPinjaman: React.FC<BukuPinjamanProps> = ({
  transactions,
  books,
  currentMember,
  currentUsername,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'semua' | 'aktif' | 'selesai'>('semua');

  // Filter student's loans (matches student name or ID)
  const studentTransactions = transactions.filter(t => {
    if (currentMember) {
      return (
        t.memberId === currentMember.id || 
        t.memberName.toLowerCase().includes(currentMember.name.toLowerCase()) ||
        currentMember.name.toLowerCase().includes(t.memberName.toLowerCase())
      );
    }
    if (currentUsername) {
      return (
        t.memberName.toLowerCase().includes(currentUsername.toLowerCase()) ||
        currentUsername.toLowerCase().includes(t.memberName.toLowerCase())
      );
    }
    return true;
  });

  const filtered = studentTransactions.filter(t => {
    const matchesSearch = 
      t.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.memberName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'aktif') {
      return matchesSearch && (t.status === 'Berlangsung' || t.status === 'Terlambat');
    }
    if (activeFilter === 'selesai') {
      return matchesSearch && t.status === 'Selesai';
    }
    return matchesSearch;
  });

  // Calculate overdue days helper
  const calculateOverdueDays = (dueDateStr: string, returnDateStr: string | null) => {
    const today = returnDateStr ? new Date(returnDateStr) : new Date();
    const dueDate = new Date(dueDateStr);
    
    // Set hours to zero for clean day comparison
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Format date and time display
  const formatDateTime = (dateStr: string | null, timePreset: string = '08:30 WIB') => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return `${dateStr}, ${timePreset}`;
      const formattedDate = d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      return `${formattedDate}, ${timePreset}`;
    } catch {
      return `${dateStr}, ${timePreset}`;
    }
  };

  const activeLoansCount = studentTransactions.filter(t => t.status === 'Berlangsung' || t.status === 'Terlambat').length;
  const overdueCount = studentTransactions.filter(t => t.status === 'Terlambat').length;
  const completedCount = studentTransactions.filter(t => t.status === 'Selesai').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Lockup */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-600 animate-pulse-soft" />
            Daftar Buku Pinjaman Saya — SMAN 1 Lumbung
          </h2>
          <p className="text-xs text-slate-400">
            Pantau status peminjaman, tanggal & jam batas kembali, serta riwayat pengembalian buku perpustakaan Anda.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-teal-50 border border-teal-100 text-teal-800 rounded-lg text-xs font-bold flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-teal-600" />
            {currentMember ? currentMember.name : 'Portal Akses Siswa'}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Pinjaman Aktif</span>
            <Clock className="h-4 w-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{activeLoansCount} Buku</p>
          <p className="text-[10px] text-slate-400">Sedang dalam masa peminjaman</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Buku Terlambat</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono">{overdueCount} Buku</p>
          <p className="text-[10px] text-rose-500 font-medium">Melebihi batas waktu pengembalian</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Selesai Dikembalikan</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">{completedCount} Buku</p>
          <p className="text-[10px] text-emerald-600 font-medium">Riwayat transaksi tuntas</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul buku, ID transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0 text-xs">
          <button
            onClick={() => setActiveFilter('semua')}
            className={`px-3 py-1.5 font-bold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'semua' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua ({studentTransactions.length})
          </button>
          <button
            onClick={() => setActiveFilter('aktif')}
            className={`px-3 py-1.5 font-bold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'aktif' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dipinjam ({activeLoansCount})
          </button>
          <button
            onClick={() => setActiveFilter('selesai')}
            className={`px-3 py-1.5 font-bold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'selesai' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Selesai ({completedCount})
          </button>
        </div>
      </div>

      {/* List of Borrowed Books Cards */}
      <div className="space-y-4">
        {filtered.map((trx, idx) => {
          const matchedBook = books.find(b => b.id === trx.bookId || b.title.toLowerCase() === trx.bookTitle.toLowerCase());
          const overdueDays = calculateOverdueDays(trx.dueDate, trx.returnDate);
          const isOverdue = trx.status === 'Terlambat' || overdueDays > 0;
          const isCompleted = trx.status === 'Selesai';

          return (
            <div
              key={trx.id}
              className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all hover:shadow-md space-y-4 ${
                isOverdue
                  ? 'border-rose-200 bg-rose-50/20'
                  : isCompleted
                  ? 'border-emerald-200/80 bg-emerald-50/10'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-14 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner shrink-0 ${
                    matchedBook ? matchedBook.coverColor : 'bg-teal-100 text-teal-900 border border-teal-200'
                  }`}>
                    <BookOpen className="h-6 w-6 opacity-80" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {trx.id}
                      </span>
                      {matchedBook && (
                        <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded">
                          {matchedBook.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{trx.bookTitle}</h3>
                    <p className="text-xs text-slate-400">
                      Penulis: <span className="font-semibold text-slate-600">{matchedBook?.author || 'Penulis Perpustakaan'}</span>
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0 flex items-center">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      Sudah Dikembalikan
                    </span>
                  ) : isOverdue ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold animate-pulse">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                      Terlambat {overdueDays} Hari
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                      <Clock className="h-4 w-4 text-teal-600" />
                      Sedang Dipinjam
                    </span>
                  )}
                </div>
              </div>

              {/* Date & Time Log Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
                {/* 1. Tanggal & Jam Peminjaman */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                    <Calendar className="h-3.5 w-3.5 text-teal-600" />
                    Tanggal & Jam Peminjaman:
                  </div>
                  <p className="font-bold text-slate-800 font-mono text-xs">
                    {formatDateTime(trx.borrowDate, '08:30 WIB')}
                  </p>
                </div>

                {/* 2. Tanggal & Jam Batas Kembali / Pengembalian */}
                <div className={`p-3 rounded-xl border space-y-1 ${
                  isOverdue ? 'bg-rose-50 border-rose-200' : 'bg-slate-50/80 border-slate-100'
                }`}>
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    {isCompleted ? 'Tanggal & Jam Pengembalian:' : 'Batas Jam & Tanggal Kembali:'}
                  </div>
                  <p className={`font-bold font-mono text-xs ${isOverdue ? 'text-rose-700' : 'text-slate-800'}`}>
                    {isCompleted 
                      ? formatDateTime(trx.returnDate, '11:15 WIB')
                      : formatDateTime(trx.dueDate, '15:00 WIB')
                    }
                  </p>
                </div>

                {/* 3. Keterangan Keterlambatan & Denda */}
                <div className={`p-3 rounded-xl border space-y-1 ${
                  isOverdue 
                    ? 'bg-rose-100/60 border-rose-300 text-rose-900' 
                    : isCompleted 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-teal-50 border-teal-200 text-teal-900'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    {isOverdue ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    ) : (
                      <Info className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    )}
                    Keterangan Keterlambatan:
                  </div>

                  {isOverdue ? (
                    <div>
                      <span className="font-extrabold text-rose-700 block">
                        ⚠️ Terlambat {overdueDays} Hari
                      </span>
                      <span className="text-[10px] text-rose-600 block mt-0.5 font-mono">
                        Denda Keterlambatan: Rp {(overdueDays * 1000).toLocaleString('id-ID')} (Rp 1.000 / hari)
                      </span>
                    </div>
                  ) : isCompleted ? (
                    <div>
                      <span className="font-bold text-emerald-700 block">
                        ✅ Pengembalian Selesai (Buku Ada di Perpustakaan)
                      </span>
                      <span className="text-[10px] text-emerald-600 block mt-0.5 font-mono">
                        {trx.fineAmount > 0 ? `Denda Lunas: Rp ${trx.fineAmount.toLocaleString('id-ID')}` : 'Bebas Denda / Tepat Waktu'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-teal-700 block">
                        ⏳ Dalam Masa Peminjaman Wajar
                      </span>
                      <span className="text-[10px] text-teal-600 block mt-0.5">
                        Harap kembalikan buku sebelum batas waktu untuk menghindari denda.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada riwayat pinjaman buku yang ditemukan.</p>
            <p className="text-xs text-slate-400">Jelajahi Katalog Buku untuk memilih buku favorit Anda!</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default BukuPinjaman;
