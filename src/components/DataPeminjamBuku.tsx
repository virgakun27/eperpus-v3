import React, { useState } from 'react';
import { Transaction, Book, Member } from '../types/library';
import { 
  Users, 
  Search, 
  Download, 
  Clock, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Calendar, 
  FileText,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';
import sound from '../utils/audio';

interface DataPeminjamBukuProps {
  transactions: Transaction[];
  books: Book[];
  members: Member[];
}

export const DataPeminjamBuku: React.FC<DataPeminjamBukuProps> = ({
  transactions,
  books,
  members,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'semua' | 'aktif' | 'terlambat' | 'selesai'>('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10); // Default 10 data per page as requested

  // Calculate overdue days helper
  const calculateOverdueDays = (dueDateStr: string, returnDateStr: string | null) => {
    const today = returnDateStr ? new Date(returnDateStr) : new Date();
    const dueDate = new Date(dueDateStr);
    
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Format date and time
  const formatDateTime = (dateStr: string | null, defaultTimeStr: string = '08:30 WIB') => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return `${dateStr}, ${defaultTimeStr}`;
      const formattedDate = d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      return `${formattedDate}, ${defaultTimeStr}`;
    } catch {
      return `${dateStr}, ${defaultTimeStr}`;
    }
  };

  // Filter transactions
  const filtered = transactions.filter(trx => {
    const matchedMember = members.find(m => m.id === trx.memberId || m.name.toLowerCase() === trx.memberName.toLowerCase());
    
    const searchTarget = `
      ${trx.memberName} 
      ${trx.memberId} 
      ${trx.bookTitle} 
      ${trx.bookId} 
      ${trx.id} 
      ${matchedMember?.email || ''} 
      ${matchedMember?.phone || ''}
      ${matchedMember?.type || ''}
    `.toLowerCase();

    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());

    const overdueDays = calculateOverdueDays(trx.dueDate, trx.returnDate);
    const isOverdue = trx.status === 'Terlambat' || (trx.status === 'Berlangsung' && overdueDays > 0);

    if (activeFilter === 'aktif') {
      return matchesSearch && trx.status === 'Berlangsung';
    }
    if (activeFilter === 'terlambat') {
      return matchesSearch && isOverdue;
    }
    if (activeFilter === 'selesai') {
      return matchesSearch && trx.status === 'Selesai';
    }
    return matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const totalBorrowers = new Set(transactions.map(t => t.memberId)).size;
  const activeLoans = transactions.filter(t => t.status === 'Berlangsung' || t.status === 'Terlambat');
  const overdueLoans = transactions.filter(t => {
    const days = calculateOverdueDays(t.dueDate, t.returnDate);
    return t.status === 'Terlambat' || (t.status === 'Berlangsung' && days > 0);
  });
  const totalFines = transactions.reduce((acc, curr) => acc + (curr.fineAmount || 0), 0);

  // Export CSV
  const handleExportCSV = () => {
    sound.playTapConfirm();
    const headers = ['ID Transaksi', 'ID Anggota', 'Nama Peminjam', 'Role', 'Judul Buku', 'ID Buku', 'Tgl Pinjam', 'Jam Pinjam', 'Batas Kembali', 'Tgl Kembali', 'Status', 'Terlambat (Hari)', 'Denda (Rp)'];
    
    const rows = filtered.map(t => {
      const days = calculateOverdueDays(t.dueDate, t.returnDate);
      const matchedMember = members.find(m => m.id === t.memberId);
      return [
        t.id,
        t.memberId,
        `"${t.memberName}"`,
        `"${matchedMember?.type || 'Siswa'}"`,
        `"${t.bookTitle}"`,
        t.bookId,
        t.borrowDate,
        '08:30 WIB',
        t.dueDate,
        t.returnDate || '-',
        t.status,
        days,
        t.fineAmount || (days * 1000)
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Peminjam_Buku_SMAN1Lumbung_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sound.playSuccessChime();
  };

  return (
    <div className="space-y-6">
      {/* Header Lockup */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Data Peminjam Buku — Perpustakaan SMAN 1 Lumbung
          </h2>
          <p className="text-xs text-slate-400">
            Daftar lengkap identitas peminjam, buku yang dipinjam, tanggal & jam transaksi, serta status keterlambatan.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <Download className="h-4 w-4 text-teal-600" />
          Ekspor Data Peminjam .CSV
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Total Peminjam Unik</span>
            <Users className="h-4 w-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalBorrowers} Siswa/Guru</p>
          <p className="text-[10px] text-slate-400">Tercatat dalam basis data</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Buku Sedang Dipinjam</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-600 font-mono">{activeLoans.length} Transaksi</p>
          <p className="text-[10px] text-slate-400">Masih berada di tangan peminjam</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Peminjam Terlambat</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono">{overdueLoans.length} Orang</p>
          <p className="text-[10px] text-rose-500 font-medium">Melebihi batas jam & tanggal</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Total Akumulasi Denda</span>
            <FileText className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">Rp {totalFines.toLocaleString('id-ID')}</p>
          <p className="text-[10px] text-emerald-600 font-medium">Denda keterlambatan buku</p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama peminjam, ID anggota, judul buku..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0 text-xs">
          <button
            onClick={() => { setActiveFilter('semua'); setCurrentPage(1); }}
            className={`px-3 py-1.5 font-bold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'semua' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua ({transactions.length})
          </button>
          <button
            onClick={() => { setActiveFilter('aktif'); setCurrentPage(1); }}
            className={`px-3 py-1.5 font-bold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'aktif' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Aktif Dipinjam ({activeLoans.length})
          </button>
          <button
            onClick={() => { setActiveFilter('terlambat'); setCurrentPage(1); }}
            className={`px-3 py-1.5 font-bold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'terlambat' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Terlambat ({overdueLoans.length})
          </button>
          <button
            onClick={() => { setActiveFilter('selesai'); setCurrentPage(1); }}
            className={`px-3 py-1.5 font-bold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'selesai' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dikembalikan ({transactions.length - activeLoans.length})
          </button>
        </div>
      </div>

      {/* Borrowers Spreadsheet Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No.</th>
                <th className="py-3.5 px-4">Data Peminjam</th>
                <th className="py-3.5 px-4">Buku yang Dipinjam</th>
                <th className="py-3.5 px-4">Tanggal & Jam Peminjaman</th>
                <th className="py-3.5 px-4">Batas & Tanggal Kembali</th>
                <th className="py-3.5 px-4 text-center">Status & Terlambat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginated.map((trx, idx) => {
                const matchedMember = members.find(m => m.id === trx.memberId || m.name.toLowerCase() === trx.memberName.toLowerCase());
                const matchedBook = books.find(b => b.id === trx.bookId || b.title.toLowerCase() === trx.bookTitle.toLowerCase());
                const overdueDays = calculateOverdueDays(trx.dueDate, trx.returnDate);
                const isOverdue = trx.status === 'Terlambat' || overdueDays > 0;
                const isCompleted = trx.status === 'Selesai';

                return (
                  <tr key={trx.id} className={`hover:bg-slate-50/80 transition-colors ${isOverdue ? 'bg-rose-50/20' : ''}`}>
                    {/* Index */}
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-center tabular-nums">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>

                    {/* Borrower Info */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">{trx.memberName}</span>
                          <span className="font-mono text-[9px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.5 rounded border border-teal-100">
                            {trx.memberId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3 text-slate-400" />
                            {matchedMember?.type || 'Siswa'}
                          </span>
                          {matchedMember?.phone && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1 font-mono text-[10px]">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {matchedMember.phone}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Book Info */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block truncate" title={trx.bookTitle}>
                          {trx.bookTitle}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <span>SKU: {trx.bookId}</span>
                          <span>·</span>
                          <span className="text-teal-600 font-semibold">{matchedBook?.location || 'Rak Utama'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Borrow Date & Time */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <div className="text-slate-800 font-semibold">
                        {formatDateTime(trx.borrowDate, '08:30 WIB')}
                      </div>
                    </td>

                    {/* Return Date / Due Date & Time */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <div className={isOverdue ? 'text-rose-700 font-bold' : 'text-slate-800 font-semibold'}>
                        {isCompleted 
                          ? formatDateTime(trx.returnDate, '11:15 WIB')
                          : formatDateTime(trx.dueDate, '15:00 WIB')
                        }
                      </div>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        {isCompleted ? 'Dikembalikan pada' : 'Batas waktu pengembalian'}
                      </span>
                    </td>

                    {/* Status & Overdue Calculation */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Selesai Dikembalikan
                        </span>
                      ) : isOverdue ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-200 animate-pulse">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                            Terlambat {overdueDays} Hari
                          </span>
                          <span className="block text-[9px] font-mono text-rose-600 font-bold">
                            Denda: Rp {(overdueDays * 1000).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                          Dipinjam (Aktif)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">Tidak ada data peminjam buku yang cocok.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 border-t border-slate-100 text-xs bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium text-xs">Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                  sound.playTapConfirm();
                }}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
              >
                <option value={5}>5 data</option>
                <option value={10}>10 data</option>
                <option value={20}>20 data</option>
                <option value={50}>50 data</option>
                <option value={100}>100 data</option>
              </select>
            </div>
            <span className="text-slate-500">
              Menampilkan <span className="font-semibold text-slate-800 font-mono">{filtered.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</span> -{' '}
              <span className="font-semibold text-slate-800 font-mono">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> dari{' '}
              <span className="font-semibold text-slate-800 font-mono">{filtered.length}</span> peminjam
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  sound.playTapConfirm();
                }}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors shadow-2xs"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentPage(i + 1);
                    sound.playTapConfirm();
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    currentPage === i + 1
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-white bg-slate-50/50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  sound.playTapConfirm();
                }}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors shadow-2xs"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DataPeminjamBuku;
