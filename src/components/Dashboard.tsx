import React from 'react';
import { Book, Member, Transaction } from '../types/library';
import { BookOpen, Users, ArrowUpRight, AlertCircle, Bookmark, CheckCircle2, QrCode, Radio } from 'lucide-react';

interface DashboardProps {
  books: Book[];
  members: Member[];
  transactions: Transaction[];
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  books,
  members,
  transactions,
  onNavigate,
}) => {
  // Calculate statistics
  const totalBooksCount = books.reduce((acc, b) => acc + b.stock, 0);
  const booksBorrowedCount = transactions.filter(t => t.status === 'Berlangsung' || t.status === 'Terlambat').length;
  const activeMembersCount = members.filter(m => m.status === 'Aktif').length;
  const overdueTransactions = transactions.filter(t => t.status === 'Terlambat');
  const totalFines = transactions.reduce((acc, t) => acc + t.fineAmount, 0);

  // Format currency
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get recent activities
  const recentActivities = [...transactions]
    .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight sm:text-4xl">
            Sistem Informasi <span className="text-teal-600 font-bold font-display">PustakaRFID</span>
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-500 leading-relaxed max-w-xl">
            Platform manajemen sirkulasi e-perpus cerdas yang menyatukan verifikasi identitas instan dengan kartu RFID Anggota dan pemindaian QR Code Buku secara real-time.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('sirkulasi')}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors cursor-pointer"
            >
              <Radio className="h-4 w-4 animate-pulse-soft" />
              Buka Terminal Sirkulasi (RFID & QR)
            </button>
            <button
              onClick={() => onNavigate('katalog')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              Katalog Buku & QR
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:block bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 via-teal-100/5 to-transparent rounded-r-2xl pointer-events-none"></div>
      </div>

      {/* Premium Analytics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Buku */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm hover:border-slate-300 transition-colors flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Koleksi Buku</span>
            <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {totalBooksCount}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span className="font-semibold text-teal-600 font-mono tabular-nums">{books.length}</span> Judul terdaftar
            </div>
          </div>
          <div className="rounded-lg p-2.5 bg-slate-50 text-slate-600">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        {/* Sedang Dipinjam */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm hover:border-slate-300 transition-colors flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sedang Dipinjam</span>
            <div className="text-3xl font-bold font-mono tracking-tight text-teal-600 tabular-nums">
              {booksBorrowedCount}
            </div>
            <div className="text-xs text-slate-500">
              Rasio sirkulasi: <span className="font-semibold font-mono tabular-nums">{totalBooksCount > 0 ? Math.round((booksBorrowedCount / totalBooksCount) * 100) : 0}%</span>
            </div>
          </div>
          <div className="rounded-lg p-2.5 bg-teal-50 text-teal-600">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>

        {/* Anggota Aktif */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm hover:border-slate-300 transition-colors flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Anggota Aktif</span>
            <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {activeMembersCount}
            </div>
            <div className="text-xs text-slate-500">
              Total terdaftar: <span className="font-semibold font-mono tabular-nums">{members.length}</span> orang
            </div>
          </div>
          <div className="rounded-lg p-2.5 bg-slate-50 text-slate-600">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Denda Keterlambatan */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm hover:border-slate-300 transition-colors flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Denda Tertunggak</span>
            <div className={`text-3xl font-bold font-mono tracking-tight tabular-nums ${totalFines > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {formatRupiah(totalFines)}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span className="font-semibold text-amber-600 font-mono tabular-nums">{overdueTransactions.length}</span> Buku terlambat
            </div>
          </div>
          <div className={`rounded-lg p-2.5 ${totalFines > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Two-Column Workspace Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Recent Activities */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Aktivitas Sirkulasi Terbaru</h2>
            <button
              onClick={() => onNavigate('riwayat')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400">Belum ada transaksi peminjaman hari ini.</div>
            ) : (
              recentActivities.map(activity => {
                const isOverdue = activity.status === 'Terlambat';
                const isReturned = activity.returnDate !== null;

                return (
                  <div key={activity.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${
                        isReturned
                          ? 'bg-emerald-50 text-emerald-600'
                          : isOverdue
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-teal-50 text-teal-600'
                      }`}>
                        {isReturned ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{activity.bookTitle}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                          <span className="font-semibold text-slate-600">{activity.memberName}</span>
                          <span>·</span>
                          <span className="font-mono">{activity.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                        isReturned
                          ? 'bg-emerald-50 text-emerald-700'
                          : isOverdue
                            ? 'bg-amber-50 text-amber-700 animate-pulse-soft'
                            : 'bg-teal-50 text-teal-700'
                      }`}>
                        {isReturned ? 'Kembali' : isOverdue ? 'Terlambat' : 'Dipinjam'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono tabular-nums">
                        {activity.borrowDate}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Quick RFID & QR Feature Highlight Panel */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h2 className="text-base font-bold tracking-tight">Integrasi Teknologi Pintar</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistem Perpustakaan Digital SMAN 1 Lumbung terintegrasi langsung dengan pemindai RFID & QR Code untuk otomasi sirkulasi dan presensi anggota.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-lg border border-slate-800">
                <div className="rounded-lg p-1.5 bg-teal-500/10 text-teal-400 shrink-0 mt-0.5">
                  <Radio className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-semibold text-white">Tap Kartu RFID Anggota</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Mengidentifikasi profil anggota, mengecek kuota peminjaman, serta status tunggakan denda kurang dari 1 detik.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-lg border border-slate-800">
                <div className="rounded-lg p-1.5 bg-teal-500/10 text-teal-400 shrink-0 mt-0.5">
                  <QrCode className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-semibold text-white">Scan QR Code Buku</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Lakukan pemindaian kode QR buku menggunakan kamera aktif atau panel virtual cerdas untuk memproses sirkulasi instan.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('sirkulasi')}
                className="w-full justify-center inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-teal-400 transition-colors cursor-pointer"
              >
                Buka Terminal Sirkulasi
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          
          <div className="absolute right-[-10px] bottom-[-20px] opacity-10 pointer-events-none">
            <Radio className="h-32 w-32 text-teal-400" />
          </div>
        </div>
      </div>

      {/* Featured Book Showcase List */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Buku Populer Saat Ini</h2>
          <button
            onClick={() => onNavigate('katalog')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
          >
            Lihat Katalog Lengkap
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {books.slice(0, 3).map(book => (
            <div key={book.id} className="flex gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-colors">
              <div className={`w-14 h-20 shrink-0 rounded-md border flex flex-col justify-between p-1.5 shadow-sm font-display ${book.coverColor}`}>
                <span className="text-[8px] font-mono leading-none font-semibold truncate uppercase">{book.id}</span>
                <span className="text-[9px] font-extrabold leading-tight tracking-tight line-clamp-3 uppercase">{book.title}</span>
                <div className="w-2.5 h-1 bg-current opacity-30 rounded-sm"></div>
              </div>
              <div className="flex flex-col justify-between py-0.5">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{book.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">by {book.author}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    book.availableStock > 0 
                      ? 'bg-teal-50 text-teal-700' 
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {book.availableStock > 0 ? `${book.availableStock} Tersedia` : 'Kosong'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{book.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
