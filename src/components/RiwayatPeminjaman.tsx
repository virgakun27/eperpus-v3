import React, { useState } from 'react';
import { Transaction } from '../types/library';
import { Search, History, CheckCircle2, Bookmark, AlertCircle, Download } from 'lucide-react';
import sound from '../utils/audio';

interface RiwayatPeminjamanProps {
  transactions: Transaction[];
  isActionAllowed?: (actionId: string) => boolean;
}

const STATUS_FILTERS = [
  { value: 'Semua', label: 'Semua Status' },
  { value: 'Berlangsung', label: 'Berlangsung' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Terlambat', label: 'Terlambat' },
];

export const RiwayatPeminjaman: React.FC<RiwayatPeminjamanProps> = ({ 
  transactions,
  isActionAllowed,
}) => {
  const canDownload = isActionAllowed ? isActionAllowed('unduh_laporan') : true;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10); // Default 10 data per page

  // Format currency
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.bookId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = activeFilter === 'Semua' || t.status === activeFilter;

    return matchesSearch && matchesStatus;
  });

  // Reset page on search or filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter, transactions.length]);

  // Sort descending by borrow date
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime();
  });

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV Export logic
  const handleExportCSV = () => {
    sound.playSuccessChime();

    const headers = 'ID Transaksi,ID Buku,Judul Buku,ID Anggota,Nama Anggota,Tanggal Pinjam,Batas Pengembalian,Tanggal Kembali,Nominal Denda,Status\n';
    const rows = sortedTransactions.map(t => 
      `"${t.id}","${t.bookId}","${t.bookTitle.replace(/"/g, '""')}","${t.memberId}","${t.memberName.replace(/"/g, '""')}","${t.borrowDate}","${t.dueDate}","${t.returnDate || '-'}",${t.fineAmount},"${t.status}"`
    ).join('\n');

    const totalDenda = sortedTransactions.reduce((acc, t) => acc + t.fineAmount, 0);
    const summary = `\n\nRingkasan Laporan:\nTotal Transaksi Terfilter,${sortedTransactions.length}\nTotal Denda Kolektif,Rp ${totalDenda}\nTanggal Cetak Laporan,${new Date().toISOString().split('T')[0]}\n`;

    const blob = new Blob([headers + rows + summary], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PustakaRFID_LaporanSirkulasi_${activeFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan ID, judul buku, nama anggota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeFilter === f.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Download button */}
          {canDownload ? (
            <button
              onClick={handleExportCSV}
              disabled={sortedTransactions.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              title="Unduh laporan sirkulasi terfilter"
            >
              <Download className="h-4 w-4 text-teal-600" />
              Unduh Laporan
            </button>
          ) : (
            <span className="text-slate-400 text-xs italic bg-slate-100 border border-slate-200 rounded-md px-3 py-2 font-medium">
              🔒 Unduh dikunci
            </span>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">ID Transaksi</th>
                <th className="py-3 px-4">Buku</th>
                <th className="py-3 px-4">Peminjam</th>
                <th className="py-3 px-4">Tgl Pinjam</th>
                <th className="py-3 px-4">Batas Kembali</th>
                <th className="py-3 px-4">Tgl Kembali</th>
                <th className="py-3 px-4 text-right">Denda</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedTransactions.map(t => {
                const isOverdue = t.status === 'Terlambat';
                const isReturned = t.status === 'Selesai';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* TRX ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">
                      {t.id}
                    </td>

                    {/* Book info */}
                    <td className="py-3.5 px-4 whitespace-nowrap max-w-[180px] truncate">
                      <div className="font-semibold text-slate-800 truncate" title={t.bookTitle}>
                        {t.bookTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {t.bookId}
                      </div>
                    </td>

                    {/* Member info */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{t.memberName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.memberId}</div>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {t.borrowDate}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {t.dueDate}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {t.returnDate ? (
                        <span className="text-emerald-600 font-medium">{t.returnDate}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Fine Amount */}
                    <td className={`py-3.5 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                      t.fineAmount > 0 ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      {t.fineAmount > 0 ? formatRupiah(t.fineAmount) : '-'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isReturned
                          ? 'bg-emerald-50 text-emerald-700'
                          : isOverdue
                            ? 'bg-amber-50 text-amber-700 animate-pulse-soft'
                            : 'bg-teal-50 text-teal-700'
                      }`}>
                        {isReturned ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            Kembali
                          </>
                        ) : isOverdue ? (
                          <>
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            Terlambat
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-3 w-3 shrink-0" />
                            Dipinjam
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedTransactions.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <History className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-400">Tidak ada riwayat transaksi sirkulasi.</p>
          </div>
        )}

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
              Menampilkan <span className="font-semibold text-slate-800 font-mono">{sortedTransactions.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</span> -{' '}
              <span className="font-semibold text-slate-800 font-mono">{Math.min(currentPage * itemsPerPage, sortedTransactions.length)}</span> dari{' '}
              <span className="font-semibold text-slate-800 font-mono">{sortedTransactions.length}</span> transaksi
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
export default RiwayatPeminjaman;
