import React, { useState, useEffect } from 'react';
import { Book } from '../types/library';
import { QRCodeGenerator } from './QRCodeGenerator';
import { 
  Search, 
  Plus, 
  X, 
  Edit, 
  QrCode, 
  Bookmark, 
  Layers, 
  Heart, 
  Star, 
  Sparkles, 
  Eye, 
  BookOpen, 
  Check, 
  MapPin, 
  Calendar,
  Hash
} from 'lucide-react';
import sound from '../utils/audio';

interface KatalogBukuProps {
  books: Book[];
  onAddBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  isActionAllowed?: (actionId: string) => boolean;
}

const CATEGORIES = [
  'Semua',
  '⭐ Favorit Saya',
  'Fiksi / Drama',
  'Sastra Sejarah',
  'Pengembangan Diri / Filsafat',
  'Novel Sejarah',
  'Romansa Remaja',
  'Sains & Sejarah',
  'Teknologi',
  'Lainnya'
];

const COVER_COLORS = [
  { value: 'bg-amber-100 text-amber-900 border-amber-300', label: 'Cream Klasik' },
  { value: 'bg-amber-800 text-amber-50 border-amber-950', label: 'Cokelat Kayu' },
  { value: 'bg-teal-900 text-teal-50 border-teal-950', label: 'Biru Teal Tua' },
  { value: 'bg-rose-950 text-rose-100 border-rose-950', label: 'Merah Maroon' },
  { value: 'bg-sky-100 text-sky-900 border-sky-300', label: 'Biru Langit' },
  { value: 'bg-stone-800 text-stone-100 border-stone-900', label: 'Abu-Abu Arang' },
];

export const KatalogBuku: React.FC<KatalogBukuProps> = ({
  books,
  onAddBook,
  onEditBook,
  isActionAllowed,
}) => {
  const canEdit = isActionAllowed ? isActionAllowed('edit_buku') : true;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ep_favorite_books');
      return saved ? JSON.parse(saved) : ['B001', 'B003']; // pre-seed favorites
    } catch {
      return ['B001', 'B003'];
    }
  });

  useEffect(() => {
    localStorage.setItem('ep_favorite_books', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (bookId: string) => {
    setFavorites(prev => {
      const exists = prev.includes(bookId);
      const updated = exists ? prev.filter(id => id !== bookId) : [...prev, bookId];
      if (!exists) {
        sound.playSuccessChime();
      } else {
        sound.playTapConfirm();
      }
      return updated;
    });
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 8 books per page

  // Form State
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState('Fiksi / Drama');
  const [formIsbn, setFormIsbn] = useState('');
  const [formStock, setFormStock] = useState(1);
  const [formLocation, setFormLocation] = useState('');
  const [formCoverColor, setFormCoverColor] = useState(COVER_COLORS[0].value);
  const [formDescription, setFormDescription] = useState('');
  const [formPublishYear, setFormPublishYear] = useState(new Date().getFullYear());

  // Filter books
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === '⭐ Favorit Saya') {
      return matchesSearch && favorites.includes(book.id);
    }

    const matchesCategory = selectedCategory === 'Semua' || book.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    const nextId = `B${String(books.length + 1).padStart(3, '0')}`;
    setFormId(nextId);
    setFormTitle('');
    setFormAuthor('');
    setFormCategory('Fiksi / Drama');
    setFormIsbn(`978-602-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}-0`);
    setFormStock(3);
    setFormLocation('Rak A-Fiksi 1');
    setFormCoverColor(COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)].value);
    setFormDescription('');
    setFormPublishYear(new Date().getFullYear());
    setIsEditing(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setSelectedBook(book);
    setFormId(book.id);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormCategory(book.category);
    setFormIsbn(book.isbn);
    setFormStock(book.stock);
    setFormLocation(book.location || '');
    setFormCoverColor(book.coverColor || COVER_COLORS[0].value);
    setFormDescription(book.description || '');
    setFormPublishYear(book.publishYear || new Date().getFullYear());
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAuthor.trim()) {
      sound.playErrorBuzz();
      alert('Judul dan Penulis Buku Wajib Diisi!');
      return;
    }

    const bookData: Book = {
      id: formId,
      title: formTitle,
      author: formAuthor,
      category: formCategory,
      isbn: formIsbn || `978-602-${Math.floor(1000 + Math.random() * 9000)}-00-0`,
      status: Number(formStock) > 0 ? 'Tersedia' : 'Dipinjam',
      stock: Number(formStock),
      availableStock: isEditing 
        ? Math.min(Number(formStock), (selectedBook?.availableStock ?? Number(formStock)))
        : Number(formStock),
      location: formLocation || 'Rak Umum',
      coverColor: formCoverColor,
      description: formDescription,
      publishYear: Number(formPublishYear),
    };

    if (isEditing) {
      onEditBook(bookData);
    } else {
      onAddBook(bookData);
    }

    sound.playSuccessChime();
    setIsAddModalOpen(false);
  };

  const handleViewDetails = (book: Book) => {
    setSelectedBook(book);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-600 animate-pulse-soft" />
            Katalog Perpustakaan & Koleksi Buku Favorit
          </h2>
          <p className="text-xs text-slate-400">
            Jelajahi ketersediaan stok buku, simpan koleksi favorit Anda, dan dapatkan QR Code perpustakaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Tambah Buku Baru
            </button>
          )}
        </div>
      </div>

      {/* Search and Category Filter Tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul, penulis, ISBN, atau ID buku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
          <span>Total {filteredBooks.length} Buku Ditemukan</span>
        </div>
      </div>

      {/* Categories Animated Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        {CATEGORIES.map(cat => {
          const isFav = cat === '⭐ Favorit Saya';
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
                sound.playTapConfirm();
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 transform active:scale-95 ${
                isSelected
                  ? isFav
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-200 scale-105'
                    : 'bg-teal-600 text-white shadow-md shadow-teal-100 scale-105'
                  : isFav
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {isFav ? (
                <>
                  <Heart className={`h-3.5 w-3.5 ${isSelected ? 'fill-white' : 'fill-rose-500 text-rose-500'}`} />
                  <span>Favorit Saya ({favorites.length})</span>
                </>
              ) : (
                <span>{cat}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid of Books with Animated Jackets */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {paginatedBooks.map((book) => {
          const isFav = favorites.includes(book.id);

          return (
            <div
              key={book.id}
              onClick={() => handleViewDetails(book)}
              className="group bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xl hover:border-teal-300 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <div>
                {/* Book Jacket Visual Showcase */}
                <div className="relative aspect-3/4 w-full bg-gradient-to-b from-slate-100 to-slate-50 rounded-xl flex items-center justify-center p-4 border border-slate-100 mb-4 overflow-hidden group-hover:shadow-inner transition-all">
                  
                  {/* 3D Animated Book Jacket */}
                  <div className={`w-36 h-48 rounded-md border-2 shadow-lg flex flex-col justify-between p-3.5 select-none transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1 relative ${book.coverColor}`}>
                    
                    {/* Spine Gradient Effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/15 rounded-l-md"></div>

                    <div className="pl-1 flex justify-between items-center">
                      <span className="text-[10px] font-mono leading-none font-bold tracking-wider uppercase opacity-80">{book.id}</span>
                      <Sparkles className="h-3 w-3 opacity-60" />
                    </div>

                    <h3 className="text-sm font-extrabold font-display leading-tight tracking-tight line-clamp-4 uppercase pl-1">
                      {book.title}
                    </h3>

                    <div className="space-y-1 pl-1">
                      <div className="w-6 h-1 bg-current opacity-40 rounded-sm"></div>
                      <p className="text-[9px] font-medium leading-none line-clamp-1 opacity-75">by {book.author}</p>
                    </div>
                  </div>

                  {/* Favorite Heart Quick Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(book.id);
                    }}
                    className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 shadow-md hover:scale-110 transition-transform cursor-pointer z-10"
                    title={isFav ? "Hapus dari Favorit" : "Tambah ke Favorit"}
                  >
                    <Heart className={`h-4 w-4 ${isFav ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-400 hover:text-rose-500'}`} />
                  </button>

                  {/* Category Tag Overlay */}
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-slate-900/80 backdrop-blur-xs text-white rounded-md px-2 py-0.5 text-[9px] font-medium">
                      {book.category}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>ISBN: {book.isbn.slice(-8)}</span>
                    <span>Tahun {book.publishYear}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-teal-600 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1">Penulis: {book.author}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                    book.availableStock > 0 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {book.availableStock > 0 ? `${book.availableStock}/${book.stock} Tersedia` : 'Dipinjam Semua'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(book);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                      title="Edit Buku"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(book);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Lihat Detail & QR Code"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBooks.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <Heart className="h-10 w-10 text-rose-300 mx-auto animate-bounce" />
          <p className="text-sm font-bold text-slate-700">
            {selectedCategory === '⭐ Favorit Saya' ? 'Belum Ada Buku Favorit' : 'Buku Tidak Ditemukan'}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {selectedCategory === '⭐ Favorit Saya'
              ? 'Klik ikon hati ❤️ pada buku yang Anda sukai untuk menyimpannya di koleksi favorit ini!'
              : 'Coba ganti kata kunci pencarian atau kategori buku lain.'
            }
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm text-xs">
          <span className="text-slate-500">
            Menampilkan <span className="font-semibold text-slate-800 font-mono">{(currentPage - 1) * itemsPerPage + 1}</span> sampai{' '}
            <span className="font-semibold text-slate-800 font-mono">{Math.min(currentPage * itemsPerPage, filteredBooks.length)}</span> dari{' '}
            <span className="font-semibold text-slate-800 font-mono">{filteredBooks.length}</span> buku
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Modal Detail Buku & QR Code */}
      {isDetailModalOpen && selectedBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-teal-600" />
                Informasi Detail Buku & Identifikasi QR
              </h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Book Jacket & Favorite Button */}
              <div className="space-y-4 text-center">
                <div className={`w-full aspect-3/4 rounded-2xl border-2 shadow-xl flex flex-col justify-between p-4 relative ${selectedBook.coverColor}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono leading-none font-bold opacity-80">{selectedBook.id}</span>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(selectedBook.id)}
                      className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors cursor-pointer"
                    >
                      <Heart className={`h-4 w-4 ${favorites.includes(selectedBook.id) ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                    </button>
                  </div>

                  <h4 className="text-base font-black leading-tight uppercase tracking-tight">
                    {selectedBook.title}
                  </h4>

                  <div className="text-left space-y-0.5 opacity-90">
                    <p className="text-[10px] font-medium leading-none">by {selectedBook.author}</p>
                    <p className="text-[9px] font-mono opacity-70">Published {selectedBook.publishYear}</p>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col items-center gap-2">
                  <QRCodeGenerator value={`BOOK:${selectedBook.id}:${selectedBook.isbn}`} size={120} />
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                    QR SKU: {selectedBook.id}
                  </span>
                </div>
              </div>

              {/* Right Column: Book Metadata */}
              <div className="md:col-span-2 space-y-4 text-xs">
                <div>
                  <span className="bg-teal-50 text-teal-700 font-bold px-2.5 py-1 rounded-md text-[11px] inline-block mb-2 border border-teal-100">
                    {selectedBook.category}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                    {selectedBook.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Penulis: {selectedBook.author}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">ISBN</span>
                    <span className="font-bold font-mono">{selectedBook.isbn}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Lokasi Rak</span>
                    <span className="font-bold flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-teal-600" />
                      {selectedBook.location || 'Rak Utama'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Tahun Terbit</span>
                    <span className="font-bold font-mono">{selectedBook.publishYear}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Stok Tersedia</span>
                    <span className={`font-bold font-mono ${selectedBook.availableStock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {selectedBook.availableStock} dari {selectedBook.stock} eksemplar
                    </span>
                  </div>
                </div>

                {selectedBook.description && (
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 uppercase text-[10px]">Sinopsis / Deskripsi Buku:</span>
                    <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-[11px]">
                      {selectedBook.description}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(selectedBook.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      favorites.includes(selectedBook.id)
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${favorites.includes(selectedBook.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                    {favorites.includes(selectedBook.id) ? 'Favorit Dipilih' : 'Tambah ke Favorit'}
                  </button>

                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Book (Admin Only) */}
      {isAddModalOpen && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Ubah Data Buku Inventaris' : 'Tambah Buku Baru ke Katalog'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">ID Buku / SKU *</label>
                  <input
                    type="text"
                    required
                    readOnly={isEditing}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Kode ISBN *</label>
                  <input
                    type="text"
                    required
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold uppercase mb-1">Judul Lengkap Buku *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laskar Pelangi"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Nama Penulis *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Andrea Hirata"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Kategori Buku</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    {CATEGORIES.filter(c => c !== 'Semua' && c !== '⭐ Favorit Saya').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Jumlah Stok</label>
                  <input
                    type="number"
                    min="1"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    value={formPublishYear}
                    onChange={(e) => setFormPublishYear(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Lokasi Rak</label>
                  <input
                    type="text"
                    placeholder="Rak A-1"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold uppercase mb-1">Desain Jaket Cover</label>
                <div className="grid grid-cols-3 gap-2">
                  {COVER_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormCoverColor(c.value)}
                      className={`p-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${c.value} ${
                        formCoverColor === c.value ? 'ring-2 ring-teal-500 scale-105' : 'opacity-70'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold uppercase mb-1">Ringkasan / Sinopsis (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan deskripsi singkat isi buku..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default KatalogBuku;
