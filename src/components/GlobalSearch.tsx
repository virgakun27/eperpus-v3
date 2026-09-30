import React, { useState, useEffect, useRef } from 'react';
import { Book, Member, Transaction, SiswaItem } from '../types/library';
import { 
  Search, 
  BookOpen, 
  Users, 
  GraduationCap, 
  History, 
  X, 
  ArrowRight, 
  Sparkles, 
  CreditCard, 
  Tag, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Command
} from 'lucide-react';
import sound from '../utils/audio';

interface GlobalSearchProps {
  books: Book[];
  siswa: SiswaItem[];
  members: Member[];
  transactions: Transaction[];
  onNavigate: (tab: string, filterOrItemId?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  books,
  siswa,
  members,
  transactions,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'semua' | 'buku' | 'siswa' | 'transaksi'>('semua');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K or '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        if (!isOpen) {
          setTimeout(() => inputRef.current?.focus(), 50);
          sound.playTapConfirm();
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const cleanQuery = query.trim().toLowerCase();

  // Search in Books
  const matchedBooks = cleanQuery
    ? books.filter(b => 
        b.title.toLowerCase().includes(cleanQuery) ||
        b.author.toLowerCase().includes(cleanQuery) ||
        b.id.toLowerCase().includes(cleanQuery) ||
        (b.isbn && b.isbn.toLowerCase().includes(cleanQuery)) ||
        (b.category && b.category.toLowerCase().includes(cleanQuery)) ||
        (b.location && b.location.toLowerCase().includes(cleanQuery))
      ).slice(0, 5)
    : [];

  // Search in Students & Members
  const matchedStudents = cleanQuery
    ? siswa.filter(s =>
        s.name.toLowerCase().includes(cleanQuery) ||
        s.nis.toLowerCase().includes(cleanQuery) ||
        (s.nisn && s.nisn.toLowerCase().includes(cleanQuery)) ||
        s.id.toLowerCase().includes(cleanQuery) ||
        s.kelasName.toLowerCase().includes(cleanQuery) ||
        (s.rfidCard && s.rfidCard.toLowerCase().includes(cleanQuery)) ||
        (s.email && s.email.toLowerCase().includes(cleanQuery))
      ).slice(0, 5)
    : [];

  // Search in Transactions
  const matchedTransactions = cleanQuery
    ? transactions.filter(t =>
        t.id.toLowerCase().includes(cleanQuery) ||
        t.bookTitle.toLowerCase().includes(cleanQuery) ||
        t.memberName.toLowerCase().includes(cleanQuery) ||
        t.memberId.toLowerCase().includes(cleanQuery) ||
        t.bookId.toLowerCase().includes(cleanQuery) ||
        t.status.toLowerCase().includes(cleanQuery)
      ).slice(0, 5)
    : [];

  const totalResults = matchedBooks.length + matchedStudents.length + matchedTransactions.length;

  const handleSelectItem = (tab: string, itemId?: string) => {
    setIsOpen(false);
    setQuery('');
    sound.playSuccessChime();
    onNavigate(tab, itemId);
  };

  return (
    <div className="relative flex-1 max-w-md w-full" ref={containerRef}>
      {/* Top Search Input Bar */}
      <div 
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="relative flex items-center w-full cursor-text"
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder="Cari buku, siswa, RFID, transaksi..."
          className="w-full pl-9 pr-14 py-1.5 text-xs bg-slate-100 hover:bg-slate-100/90 focus:bg-white border border-slate-200/80 focus:border-teal-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 placeholder:text-slate-400 transition-all shadow-2xs"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-slate-400 bg-white border border-slate-200/90 rounded px-1.5 py-0.5 shadow-2xs">
              <Command className="h-2.5 w-2.5" />K
            </span>
          )}
        </div>
      </div>

      {/* Spotlight Dropdown Modal */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Category Filter Tabs */}
          {cleanQuery && (
            <div className="flex items-center gap-1 p-2 bg-slate-50/70 border-b border-slate-100 text-[11px] overflow-x-auto">
              <button
                onClick={() => setActiveCategory('semua')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === 'semua'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({totalResults})
              </button>
              <button
                onClick={() => setActiveCategory('buku')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'buku'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                Buku ({matchedBooks.length})
              </button>
              <button
                onClick={() => setActiveCategory('siswa')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'siswa'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                Siswa ({matchedStudents.length})
              </button>
              <button
                onClick={() => setActiveCategory('transaksi')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'transaksi'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3 h-3" />
                Transaksi ({matchedTransactions.length})
              </button>
            </div>
          )}

          {/* Results Container */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-1.5">
            
            {!cleanQuery ? (
              <div className="p-5 text-center space-y-2">
                <Search className="w-6 h-6 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-700">Pencarian Cepat Seluruh Sistem</div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Ketik judul buku, pengarang, nama siswa, NIS, nomor RFID, atau ID transaksi.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-1.5 text-[10px]">
                  <button 
                    onClick={() => setQuery('Laskar Pelangi')}
                    className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors cursor-pointer"
                  >
                    📖 Laskar Pelangi
                  </button>
                  <button 
                    onClick={() => setQuery('Budi')}
                    className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors cursor-pointer"
                  >
                    🎓 Budi Santoso
                  </button>
                  <button 
                    onClick={() => setQuery('TRX')}
                    className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors cursor-pointer"
                  >
                    📋 Transaksi
                  </button>
                </div>
              </div>
            ) : totalResults === 0 ? (
              <div className="p-6 text-center space-y-1.5">
                <div className="text-xs font-bold text-slate-700">Tidak ada hasil ditemukan</div>
                <p className="text-[11px] text-slate-400">
                  Tidak ditemukan data buku, siswa, atau transaksi dengan kata kunci "{query}".
                </p>
              </div>
            ) : (
              <>
                {/* 1. SEKSI BUKU */}
                {(activeCategory === 'semua' || activeCategory === 'buku') && matchedBooks.length > 0 && (
                  <div className="p-1.5 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-teal-600" />
                        Koleksi Buku ({matchedBooks.length})
                      </span>
                      <button 
                        onClick={() => handleSelectItem('katalog')} 
                        className="text-teal-600 hover:underline cursor-pointer lowercase font-medium"
                      >
                        lihat semua katalog →
                      </button>
                    </div>

                    {matchedBooks.map(book => (
                      <button
                        key={book.id}
                        onClick={() => handleSelectItem('katalog', book.id)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-10 rounded-md border flex flex-col justify-between p-1 shrink-0 ${book.coverColor || 'bg-slate-100 border-slate-300'}`}>
                            <span className="text-[4px] font-mono leading-none">{book.id}</span>
                            <span className="text-[5px] font-black line-clamp-2 uppercase leading-tight">{book.title}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                              {book.title}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                              <span>{book.author}</span>
                              <span>·</span>
                              <span className="font-mono">{book.id}</span>
                              <span>·</span>
                              <span className="text-slate-500 font-medium">{book.location || 'Rak Utama'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            book.status === 'Tersedia' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          }`}>
                            {book.status}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. SEKSI SISWA & ANGGOTA */}
                {(activeCategory === 'semua' || activeCategory === 'siswa') && matchedStudents.length > 0 && (
                  <div className="p-1.5 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-3 h-3 text-teal-600" />
                        Data Siswa ({matchedStudents.length})
                      </span>
                      <button 
                        onClick={() => handleSelectItem('anggota_siswa')} 
                        className="text-teal-600 hover:underline cursor-pointer lowercase font-medium"
                      >
                        buka data siswa →
                      </button>
                    </div>

                    {matchedStudents.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectItem('anggota_siswa', s.id)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60 font-bold text-xs flex items-center justify-center shrink-0">
                            {s.name.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                              {s.name}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate font-mono">
                              <span className="text-teal-700 font-semibold">{s.kelasName}</span>
                              <span>·</span>
                              <span>NIS: {s.nis}</span>
                              {s.rfidCard && (
                                <>
                                  <span>·</span>
                                  <span>{s.rfidCard}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {s.status}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* 3. SEKSI TRANSAKSI SIRKULASI */}
                {(activeCategory === 'semua' || activeCategory === 'transaksi') && matchedTransactions.length > 0 && (
                  <div className="p-1.5 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <History className="w-3 h-3 text-teal-600" />
                        Riwayat Transaksi ({matchedTransactions.length})
                      </span>
                      <button 
                        onClick={() => handleSelectItem('riwayat')} 
                        className="text-teal-600 hover:underline cursor-pointer lowercase font-medium"
                      >
                        buka semua riwayat →
                      </button>
                    </div>

                    {matchedTransactions.map(tx => (
                      <button
                        key={tx.id}
                        onClick={() => handleSelectItem('data_peminjam_buku', tx.id)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            tx.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.status === 'Terlambat'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            <History className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                              {tx.bookTitle}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                              <span className="text-slate-700 font-semibold">{tx.memberName}</span>
                              <span>·</span>
                              <span className="font-mono">{tx.id}</span>
                              <span>·</span>
                              <span className="font-mono">{tx.borrowDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            tx.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-700'
                              : tx.status === 'Terlambat'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-blue-50 text-blue-700'
                          }`}>
                            {tx.status}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>

          {/* Footer Shortcuts Info */}
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Tekan <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">ESC</kbd> untuk menutup</span>
            <span>Global Spotlight Search</span>
          </div>

        </div>
      )}
    </div>
  );
};
export default GlobalSearch;
