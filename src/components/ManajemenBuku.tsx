import React, { useState } from 'react';
import { Book } from '../types/library';
import { QRCodeGenerator } from './QRCodeGenerator';
import { 
  Search, 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  PlusCircle, 
  MinusCircle, 
  QrCode, 
  Download, 
  Database,
  Sliders,
  Check,
  AlertTriangle,
  HardDrive,
  Printer,
  CheckSquare,
  Square,
  Layers,
  Upload,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import sound from '../utils/audio';

interface ManajemenBukuProps {
  books: Book[];
  onAddBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
  isActionAllowed?: (actionId: string) => boolean;
}

const CATEGORIES = ['Fiksi / Drama', 'Sastra Sejarah', 'Pengembangan Diri / Filsafat', 'Novel Sejarah', 'Romansa Remaja', 'Sains & Sejarah', 'Teknologi', 'Lainnya'];

const COVER_COLORS = [
  { value: 'bg-amber-100 text-amber-900 border-amber-300', label: 'Cream Klasik' },
  { value: 'bg-amber-800 text-amber-50 border-amber-950', label: 'Cokelat Kayu' },
  { value: 'bg-teal-900 text-teal-50 border-teal-950', label: 'Biru Teal Tua' },
  { value: 'bg-rose-950 text-rose-100 border-rose-950', label: 'Merah Maroon' },
  { value: 'bg-sky-100 text-sky-900 border-sky-300', label: 'Biru Langit' },
  { value: 'bg-stone-800 text-stone-100 border-stone-900', label: 'Abu-Abu Arang' },
];

export const ManajemenBuku: React.FC<ManajemenBukuProps> = ({
  books,
  onAddBook,
  onEditBook,
  onDeleteBook,
  isActionAllowed,
}) => {
  const canEdit = isActionAllowed ? isActionAllowed('edit_buku') : true;
  const canDelete = isActionAllowed ? isActionAllowed('hapus_buku') : true;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // CSV Bulk Import State
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [csvParsedRows, setCsvParsedRows] = useState<{
    id: string;
    title: string;
    author: string;
    category: string;
    isbn: string;
    stock: number;
    location: string;
    publishYear: number;
    description: string;
    status: 'siap' | 'duplikat_isbn' | 'duplikat_id' | 'duplikat_judul';
    reason: string;
  }[]>([]);

  // Download CSV Template Helper
  const handleDownloadCsvTemplate = () => {
    sound.playTapConfirm();
    const headers = ['id', 'title', 'author', 'category', 'isbn', 'stock', 'location', 'publishYear', 'description'];
    const sampleRows = [
      ['B010', 'Laskar Pelangi', 'Andrea Hirata', 'Fiksi / Drama', '978-979-3062-79-2', '5', 'Rak A-02', '2005', 'Kisah perjuangan anak-anak Belitung'],
      ['B011', 'Bumi Manusia', 'Pramoedya Ananta Toer', 'Sastra Sejarah', '978-979-97312-3-4', '3', 'Rak B-01', '1980', 'Novel tetralogi buru'],
      ['B012', 'Fisika Dasar SMA XI', 'Prof. Supriyadi', 'Sains & Sejarah', '978-602-010-455-1', '10', 'Rak C-05', '2023', 'Buku teks pelajaran fisika']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Template_Impor_Buku_SMAN1Lumbung.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sound.playSuccessChime();
  };

  // Upload and Parse CSV with Redundancy Check
  const handleFileUploadCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        alert('Berkas CSV kosong atau tidak memiliki baris data!');
        return;
      }

      const rows = lines.slice(1); // skip header
      const parsedResults: any[] = [];

      rows.forEach((rowStr, idx) => {
        const cols = rowStr.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) return;

        const id = cols[0] || `B00${books.length + idx + 1}`;
        const title = cols[1] || 'Buku Tanpa Judul';
        const author = cols[2] || 'Penulis Umum';
        const category = cols[3] || 'Fiksi / Drama';
        const isbn = cols[4] || `978-602-${Math.floor(1000 + Math.random() * 9000)}`;
        const stock = parseInt(cols[5]) || 3;
        const location = cols[6] || 'Rak Utama';
        const publishYear = parseInt(cols[7]) || 2024;
        const description = cols[8] || 'Deskripsi buku dari impor CSV.';

        // Redundancy Checks against current books database
        let status: 'siap' | 'duplikat_isbn' | 'duplikat_id' | 'duplikat_judul' = 'siap';
        let reason = '✅ Baru (Siap Diimpor)';

        if (books.some(b => b.id.toLowerCase() === id.toLowerCase()) || parsedResults.some(p => p.id.toLowerCase() === id.toLowerCase())) {
          status = 'duplikat_id';
          reason = '⚠️ Redundan: ID Buku Sudah Ada';
        } else if (books.some(b => b.isbn.replace(/[^0-9]/g, '') === isbn.replace(/[^0-9]/g, '')) || parsedResults.some(p => p.isbn.replace(/[^0-9]/g, '') === isbn.replace(/[^0-9]/g, ''))) {
          status = 'duplikat_isbn';
          reason = '⚠️ Redundan: Nomor ISBN Sudah Ada';
        } else if (books.some(b => b.title.toLowerCase() === title.toLowerCase() && b.author.toLowerCase() === author.toLowerCase())) {
          status = 'duplikat_judul';
          reason = '⚠️ Redundan: Judul & Penulis Sudah Ada';
        }

        parsedResults.push({
          id,
          title,
          author,
          category,
          isbn,
          stock,
          location,
          publishYear,
          description,
          status,
          reason
        });
      });

      setCsvParsedRows(parsedResults);
      sound.playSuccessChime();
    };

    reader.readAsText(file);
  };

  // Execute Bulk Import
  const handleExecuteBulkImport = () => {
    const validRows = csvParsedRows.filter(r => r.status === 'siap');
    if (validRows.length === 0) {
      alert('Tidak ada baris data baru yang valid untuk diimpor. Semua baris terdeteksi redundan!');
      return;
    }

    const coverColors = [
      'bg-amber-100 text-amber-900 border-amber-300',
      'bg-teal-900 text-teal-50 border-teal-950',
      'bg-rose-950 text-rose-100 border-rose-950',
      'bg-sky-100 text-sky-900 border-sky-300'
    ];

    validRows.forEach((r, idx) => {
      const newBook: Book = {
        id: r.id,
        title: r.title,
        author: r.author,
        category: r.category,
        isbn: r.isbn,
        status: 'Tersedia',
        stock: r.stock,
        availableStock: r.stock,
        location: r.location,
        coverColor: coverColors[idx % coverColors.length],
        description: r.description,
        publishYear: r.publishYear
      };
      onAddBook(newBook);
    });

    sound.playSuccessChime();
    alert(`Berhasil mengimpor ${validRows.length} buku baru! Data redundan dilewati secara otomatis.`);
    setIsCsvImportModalOpen(false);
    setCsvParsedRows([]);
  };

  // Batch & Single QR Print State
  const [printTab, setPrintTab] = useState<'satuan' | 'massal'>('satuan');
  const [selectedBookIdsForBatch, setSelectedBookIdsForBatch] = useState<string[]>([]);
  const [batchCategoryFilter, setBatchCategoryFilter] = useState('Semua');

  const openQrCenterModal = (book?: Book) => {
    if (book) {
      setSelectedBook(book);
      setPrintTab('satuan');
    } else {
      setSelectedBook(books[0] || null);
      setPrintTab('massal');
    }
    // Pre-select all books for batch print
    setSelectedBookIdsForBatch(books.map(b => b.id));
    setIsDetailModalOpen(true);
  };

  const handleToggleSelectAllBatch = () => {
    sound.playTapConfirm();
    if (selectedBookIdsForBatch.length === books.length) {
      setSelectedBookIdsForBatch([]);
    } else {
      setSelectedBookIdsForBatch(books.map(b => b.id));
    }
  };

  const handleToggleBookBatch = (bookId: string) => {
    sound.playTapConfirm();
    setSelectedBookIdsForBatch(prev => 
      prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]
    );
  };

  // Single book sticker print
  const handlePrintSingleBook = (book: Book) => {
    sound.playTapConfirm();
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Label QR - ${book.title}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fff; }
            .sticker { border: 2px solid #0f172a; border-radius: 12px; padding: 16px; text-align: center; width: 240px; }
            .header { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; }
            .sku { background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; color: #0f172a; }
            .title { font-size: 13px; font-weight: bold; margin-top: 8px; margin-bottom: 4px; }
            .meta { font-size: 9px; color: #64748b; font-family: monospace; }
            .location { font-size: 10px; color: #0f766e; font-weight: bold; font-family: monospace; margin-top: 2px; }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="header">
              <span>SMAN 1 LUMBUNG</span>
              <span class="sku">${book.id}</span>
            </div>
            <div>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`BOOK:${book.id}:${book.isbn}`)}" width="130" height="130" />
            </div>
            <div class="title">${book.title}</div>
            <div class="meta">ISBN: ${book.isbn}</div>
            <div class="location">LOKASI RAK: ${book.location}</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); window.close(); }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Batch / Bulk sticker print
  const handlePrintBatchBooks = (booksToPrint: Book[]) => {
    if (booksToPrint.length === 0) {
      alert('Pilih minimal 1 buku untuk dicetak!');
      return;
    }
    sound.playTapConfirm();
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) return;

    const stickersHtml = booksToPrint.map(book => `
      <div class="sticker">
        <div class="header">
          <span>SMAN 1 LUMBUNG</span>
          <span class="sku">${book.id}</span>
        </div>
        <div class="qr-box">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`BOOK:${book.id}:${book.isbn}`)}" width="110" height="110" />
        </div>
        <div class="title">${book.title}</div>
        <div class="meta">ISBN: ${book.isbn}</div>
        <div class="location">RAK: ${book.location}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Massal QR Code Buku - Perpustakaan SMAN 1 Lumbung</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #000; }
            .page-header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
            .page-header h2 { margin: 0; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; }
            .page-header p { margin: 3px 0 0 0; font-size: 10px; color: #555; }
            
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            
            .sticker { border: 1.5px solid #000; border-radius: 8px; padding: 8px; text-align: center; background: #fff; page-break-inside: avoid; height: 175px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
            .header { font-size: 8px; font-weight: bold; font-family: monospace; color: #000; border-bottom: 1px solid #ccc; padding-bottom: 3px; display: flex; justify-content: space-between; align-items: center; }
            .sku { background: #eee; padding: 1px 3px; border-radius: 3px; }
            
            .qr-box { display: flex; justify-content: center; align-items: center; margin: 2px 0; }
            
            .title { font-size: 10px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .meta { font-size: 8px; font-family: monospace; color: #555; }
            .location { font-size: 8px; font-family: monospace; font-weight: bold; color: #0f766e; }

            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="page-header">
            <h2>PERPUSTAKAAN SMAN 1 LUMBUNG</h2>
            <p>Lembar Cetak Stiker Label QR Code Buku — Total: ${booksToPrint.length} Buku</p>
          </div>
          <div class="grid">
            ${stickersHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); window.close(); }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // 5 items per page for administrative list

  // Form State
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState('Fiksi / Drama');
  const [formIsbn, setFormIsbn] = useState('');
  const [formStock, setFormStock] = useState(1);
  const [formAvailableStock, setFormAvailableStock] = useState(1);
  const [formLocation, setFormLocation] = useState('');
  const [formCoverColor, setFormCoverColor] = useState(COVER_COLORS[0].value);
  const [formDescription, setFormDescription] = useState('');
  const [formPublishYear, setFormPublishYear] = useState(new Date().getFullYear());

  // Filter books
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery) ||
      book.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Semua' || book.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Reset pagination page on filter/search change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, books.length]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    const nextId = `B00${books.length + 1}`;
    setFormId(nextId);
    setFormTitle('');
    setFormAuthor('');
    setFormCategory('Fiksi / Drama');
    setFormIsbn('');
    setFormStock(1);
    setFormAvailableStock(1);
    setFormLocation('Rak A-1');
    setFormCoverColor(COVER_COLORS[0].value);
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
    setFormAvailableStock(book.availableStock);
    setFormLocation(book.location);
    setFormCoverColor(book.coverColor);
    setFormDescription(book.description || '');
    setFormPublishYear(book.publishYear);

    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formTitle.trim() || !formAuthor.trim()) {
      sound.playErrorBuzz();
      alert('Judul dan Penulis buku wajib diisi!');
      return;
    }

    if (formAvailableStock > formStock) {
      sound.playErrorBuzz();
      alert('Stok Tersedia tidak boleh melebihi Jumlah Stok Total!');
      return;
    }

    const bookData: Book = {
      id: formId,
      title: formTitle,
      author: formAuthor,
      category: formCategory,
      isbn: formIsbn || `ISBN-${Math.floor(Math.random() * 100000000000)}`,
      status: formAvailableStock > 0 ? 'Tersedia' : 'Dipinjam',
      stock: Number(formStock),
      availableStock: Number(formAvailableStock),
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

  // Inline stock adjustment handlers
  const handleQuickStockAdjust = (book: Book, direction: 'up' | 'down') => {
    let newStock = book.stock;
    let newAvailable = book.availableStock;

    if (direction === 'up') {
      newStock += 1;
      newAvailable += 1;
    } else {
      if (book.stock <= 1) return; // Prevent 0 stock
      newStock -= 1;
      newAvailable = Math.max(0, book.availableStock - 1);
    }

    const updatedBook: Book = {
      ...book,
      stock: newStock,
      availableStock: newAvailable,
      status: newAvailable > 0 ? 'Tersedia' : 'Dipinjam'
    };

    onEditBook(updatedBook);
    sound.playTapConfirm();
  };

  // Delete Book flow
  const handleDeleteRequest = (book: Book) => {
    setSelectedBook(book);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedBook) {
      // Check if book is currently borrowed
      const isCurrentlyBorrowed = selectedBook.availableStock < selectedBook.stock;
      if (isCurrentlyBorrowed) {
        sound.playErrorBuzz();
        alert(`Buku "${selectedBook.title}" tidak dapat dihapus karena sedang ada eksemplar yang dipinjam oleh anggota!`);
        setIsDeleteConfirmOpen(false);
        return;
      }

      onDeleteBook(selectedBook.id);
      sound.playSuccessChime();
      setIsDeleteConfirmOpen(false);
      setSelectedBook(null);
    }
  };

  // Export to CSV simulation
  const handleExportCSV = () => {
    sound.playSuccessChime();
    
    // Create CSV content
    const headers = 'ID,Judul,Penulis,Kategori,ISBN,Lokasi Rak,Stok Total,Stok Tersedia,Tahun Terbit\n';
    const rows = books.map(b => 
      `"${b.id}","${b.title.replace(/"/g, '""')}","${b.author.replace(/"/g, '""')}","${b.category}","${b.isbn}","${b.location}",${b.stock},${b.availableStock},${b.publishYear}`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'PustakaRFID_KatalogBuku.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Control Panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-teal-600" />
            Manajemen Basis Data Buku
          </h2>
          <p className="text-xs text-slate-400">
            Kelola inventaris fisik, kontrol stok, dan cetak lembar label identitas kode QR buku.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => openQrCenterModal()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 text-xs font-semibold text-teal-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="h-4 w-4 text-teal-600" />
            Cetak QR Code Satuan & Massal
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Ekspor .CSV
          </button>
          
          {canEdit ? (
            <>
              <button
                onClick={() => { sound.playTapConfirm(); setIsCsvImportModalOpen(true); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 text-xs font-semibold text-teal-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Upload className="h-4 w-4 text-teal-600" />
                Impor Massal .CSV
              </button>

              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Registrasi Buku Baru
              </button>
            </>
          ) : (
            <span className="text-slate-400 text-xs bg-slate-100 border border-slate-200 rounded-md px-3 py-2 font-medium italic">
              🔒 Hak tambah terkunci
            </span>
          )}
        </div>
      </div>

      {/* Database Search Filter Grid */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode, judul, penulis, ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedCategory('Semua')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'Semua' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua Kategori
          </button>
          {CATEGORIES.slice(0, 4).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Spreadsheet Administrative Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No.</th>
                <th className="py-3.5 px-4 w-20">ID Buku</th>
                <th className="py-3.5 px-4">Buku & Penulis</th>
                <th className="py-3.5 px-4">ISBN</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Lokasi Rak</th>
                <th className="py-3.5 px-4 text-center w-28">Stok (Tersedia/Total)</th>
                <th className="py-3.5 px-4 text-right w-28">Aksi Administrasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedBooks.map((book, index) => {
                const isOutOfStock = book.availableStock === 0;
                const isBorrowed = book.availableStock < book.stock;

                return (
                  <tr key={book.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Index Number */}
                    <td className="py-3 px-4 font-mono text-slate-400 text-center tabular-nums">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    {/* ID */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">
                      {book.id}
                    </td>

                    {/* Book & Author Lockup */}
                    <td className="py-3 px-4 max-w-[240px]">
                      <div className="flex items-center gap-3">
                        {/* tiny book spine thumbnail color */}
                        <div className={`w-4 h-6 shrink-0 rounded-xs border shadow-2xs ${book.coverColor}`}></div>
                        <div className="overflow-hidden">
                          <span className="font-bold text-slate-800 block truncate" title={book.title}>
                            {book.title}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {book.author}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* ISBN */}
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {book.isbn}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-500">
                      {book.category}
                    </td>

                    {/* Rack Location */}
                    <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {book.location}
                    </td>

                    {/* Stocks with adjustment buttons */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleQuickStockAdjust(book, 'down')}
                          disabled={!canEdit || book.stock <= 1}
                          className="p-0.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                          title={canEdit ? "Kurangi stok total" : "Izin edit diperlukan"}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                        
                        <span className="font-mono font-bold tracking-tight text-slate-800 text-xs w-12 text-center tabular-nums">
                          <span className={isOutOfStock ? 'text-rose-600' : 'text-emerald-600'}>{book.availableStock}</span>
                          <span className="text-slate-400">/</span>
                          <span>{book.stock}</span>
                        </span>

                        <button
                          onClick={() => handleQuickStockAdjust(book, 'up')}
                          disabled={!canEdit}
                          className="p-0.5 text-slate-400 hover:text-teal-600 disabled:opacity-30 cursor-pointer"
                          title={canEdit ? "Tambah stok total" : "Izin edit diperlukan"}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>

                    {/* Administrative Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setSelectedBook(book); setIsDetailModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                          title="Cetak Kode QR Buku"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(book)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Edit Detil Buku"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteRequest(book)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Buku"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBooks.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <Sliders className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-400">Tidak ada data buku yang sesuai dengan pencarian.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm text-xs">
          <span className="text-slate-500">
            Menampilkan <span className="font-semibold text-slate-800 font-mono">{(currentPage - 1) * itemsPerPage + 1}</span> sampai{' '}
            <span className="font-semibold text-slate-800 font-mono">{Math.min(currentPage * itemsPerPage, filteredBooks.length)}</span> dari{' '}
            <span className="font-semibold text-slate-800 font-mono">{filteredBooks.length}</span> record buku
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); sound.playTapConfirm(); }}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors"
            >
              Sebelumnya
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentPage(i + 1); sound.playTapConfirm(); }}
                className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                  currentPage === i + 1
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); sound.playTapConfirm(); }}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Tambah/Edit Buku */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Ubah Record Inventaris Buku' : 'Registrasi Buku & Label QR'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-5 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ID Buku (Pengenal Sistem)</label>
                <input
                  type="text"
                  value={formId}
                  disabled
                  className="w-full p-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Judul Buku *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bumi Manusia"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Penulis *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pramoedya Ananta Toer"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Kategori Sastra/Ilmu</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Kode ISBN</label>
                  <input
                    type="text"
                    placeholder="e.g. 978-979-..."
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tahun Publikasi</label>
                  <input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={formPublishYear}
                    onChange={(e) => setFormPublishYear(Number(e.target.value))}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Jumlah Stok Total</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formStock}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormStock(val);
                      // Auto-sync available stock on creation
                      if (!isEditing) setFormAvailableStock(val);
                    }}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Lokasi Penyimpanan Rak</label>
                  <input
                    type="text"
                    placeholder="e.g. Rak B-Sejarah 1"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {isEditing && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Stok Saat Ini Tersedia (di Rak)</label>
                  <input
                    type="number"
                    min="0"
                    max={formStock}
                    value={formAvailableStock}
                    onChange={(e) => setFormAvailableStock(Number(e.target.value))}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pilih Skema Warna Jaket</label>
                <div className="grid grid-cols-3 gap-2">
                  {COVER_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormCoverColor(color.value)}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${color.value} ${
                        formCoverColor === color.value 
                          ? 'ring-2 ring-teal-500 scale-[1.02] border-transparent' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sinopsis Ringkas</label>
                <textarea
                  rows={2}
                  placeholder="Isi ringkasan plot atau topik ilmu..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
                >
                  Simpan Record Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Center Cetak QR Code Buku (Satuan & Massal) */}
      {isDetailModalOpen && selectedBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <Printer className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Center Cetak Label QR Code Buku</h3>
                  <p className="text-[10px] text-slate-400">Pilih mode cetak satuan atau cetak massal lembar stiker A4</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { sound.playTapConfirm(); setPrintTab('satuan'); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  printTab === 'satuan'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="h-4 w-4" />
                Cetak Satuan
              </button>
              <button
                type="button"
                onClick={() => { sound.playTapConfirm(); setPrintTab('massal'); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  printTab === 'massal'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="h-4 w-4" />
                Cetak Massal ({selectedBookIdsForBatch.length} Buku)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {printTab === 'satuan' ? (
                /* TAB 1: CETAK SATUAN */
                <div className="space-y-5 text-center">
                  <div className="text-left space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Buku Katalog:</label>
                    <select
                      value={selectedBook.id}
                      onChange={(e) => {
                        const b = books.find(item => item.id === e.target.value);
                        if (b) setSelectedBook(b);
                      }}
                      className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      {books.map(b => (
                        <option key={b.id} value={b.id}>{b.id} — {b.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Single Sticker Preview */}
                  <div className="border border-slate-200 p-4 rounded-2xl bg-white space-y-3 shadow-md max-w-xs mx-auto text-left font-sans relative overflow-hidden">
                    <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                      <span className="text-[9px] font-mono font-extrabold text-teal-800 uppercase tracking-widest">SMAN 1 LUMBUNG</span>
                      <span className="text-[9px] bg-slate-100 text-slate-700 font-mono font-bold px-1.5 py-0.5 rounded">{selectedBook.id}</span>
                    </div>
                    
                    <div className="flex justify-center py-1">
                      <QRCodeGenerator 
                        value={`BOOK:${selectedBook.id}:${selectedBook.isbn}`} 
                        size={140} 
                        showDownloadButton={true}
                      />
                    </div>

                    <div className="space-y-0.5 text-center pt-1 border-t border-slate-100">
                      <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{selectedBook.title}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">ISBN: {selectedBook.isbn}</p>
                      <p className="text-[10px] text-teal-700 font-bold font-mono">Lokasi Rak: {selectedBook.location}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handlePrintSingleBook(selectedBook)}
                      className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Printer className="h-4 w-4" />
                      Cetak Label Satuan
                    </button>
                    <button
                      onClick={() => setIsDetailModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              ) : (
                /* TAB 2: CETAK MASSAL */
                <div className="space-y-4 text-left">
                  {/* Selection & Category Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={handleToggleSelectAllBatch}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                    >
                      {selectedBookIdsForBatch.length === books.length ? (
                        <CheckSquare className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                      {selectedBookIdsForBatch.length === books.length ? 'Batalkan Semua' : 'Pilih Semua Buku'}
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Kategori:</span>
                      <select
                        value={batchCategoryFilter}
                        onChange={(e) => setBatchCategoryFilter(e.target.value)}
                        className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-pointer"
                      >
                        <option value="Semua">Semua Kategori</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Checklist Grid */}
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-60 overflow-y-auto bg-slate-50/30 p-1">
                    {books
                      .filter(b => batchCategoryFilter === 'Semua' || b.category === batchCategoryFilter)
                      .map(b => {
                        const isChecked = selectedBookIdsForBatch.includes(b.id);
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleToggleBookBatch(b.id)}
                            className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                              isChecked ? 'bg-teal-50/70 border border-teal-200/60' : 'hover:bg-slate-100/80'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-teal-600 shrink-0" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-300 shrink-0" />
                              )}
                              <div className={`w-3.5 h-5 shrink-0 rounded border ${b.coverColor}`}></div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{b.title}</h5>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {b.id} · ISBN: {b.isbn}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded">
                              {b.location}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  <p className="text-[11px] text-slate-400 text-center leading-normal">
                    Menyiapkan lembar cetak stiker A4 berisi <strong>{selectedBookIdsForBatch.length} label QR Code</strong>.
                  </p>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      disabled={selectedBookIdsForBatch.length === 0}
                      onClick={() => {
                        const selectedList = books.filter(b => selectedBookIdsForBatch.includes(b.id));
                        handlePrintBatchBooks(selectedList);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Printer className="h-4 w-4" />
                      Cetak Massal ({selectedBookIdsForBatch.length} Label Stiker)
                    </button>
                    <button
                      onClick={() => setIsDetailModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: Delete Book */}
      {isDeleteConfirmOpen && selectedBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 animate-bounce" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold text-slate-900">Konfirmasi Hapus Buku</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Apakah Anda yakin ingin menghapus buku <span className="font-bold text-slate-800">"{selectedBook.title}"</span> dari database perpustakaan? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
              >
                Ya, Hapus Buku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Impor Massal Buku via CSV */}
      {isCsvImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Impor Massal Registrasi Buku Baru (.CSV)</h3>
                  <p className="text-[10px] text-slate-400">Unggah berkas CSV dan lakukan verifikasi redudansi data otomatis</p>
                </div>
              </div>
              <button
                onClick={() => setIsCsvImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Step 1: Template Download */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-teal-600" />
                    Unduh Template CSV Contoh
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Gunakan struktur kolom resmi: <code className="font-mono text-[10px] bg-slate-200 px-1 py-0.5 rounded">id, title, author, category, isbn, stock, location, publishYear, description</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white hover:bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 shrink-0 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Template .CSV
                </button>
              </div>

              {/* Step 2: File Upload Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Pilih Berkas CSV Untuk Diunggah:</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-6 text-center bg-slate-50/50 transition-all">
                  <Upload className="h-8 w-8 text-teal-600 mx-auto mb-2 animate-bounce-slow" />
                  <p className="text-xs font-semibold text-slate-700">Klik untuk memilih berkas .CSV dari komputer Anda</p>
                  <p className="text-[10px] text-slate-400 mt-1">Sistem akan langsung memeriksa redudansi ISBN, ID Buku, dan Judul secara otomatis</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUploadCsv}
                    className="mt-3 text-xs text-slate-500 cursor-pointer mx-auto block file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                </div>
              </div>

              {/* Step 3: Parsed Results & Redundancy Check Table */}
              {csvParsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Hasil Pemeriksaan Redudansi ({csvParsedRows.length} Baris)
                    </h4>
                    <div className="flex gap-2 text-[10px] font-mono font-bold">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        ✅ Siap: {csvParsedRows.filter(r => r.status === 'siap').length}
                      </span>
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        ⚠️ Redundan: {csvParsedRows.filter(r => r.status !== 'siap').length}
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/80 text-[10px] uppercase font-bold text-slate-500 font-mono sticky top-0">
                        <tr>
                          <th className="p-2.5">ID Buku</th>
                          <th className="p-2.5">Judul Buku & Penulis</th>
                          <th className="p-2.5">ISBN</th>
                          <th className="p-2.5">Status Redudansi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {csvParsedRows.map((r, idx) => (
                          <tr key={idx} className={r.status !== 'siap' ? 'bg-rose-50/20' : 'hover:bg-slate-50/50'}>
                            <td className="p-2.5 font-mono font-bold text-slate-700">{r.id}</td>
                            <td className="p-2.5">
                              <span className="font-bold text-slate-800 block line-clamp-1">{r.title}</span>
                              <span className="text-[10px] text-slate-400 block">{r.author}</span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-600">{r.isbn}</td>
                            <td className="p-2.5">
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                                r.status === 'siap' 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                                {r.reason}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsCsvImportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={csvParsedRows.filter(r => r.status === 'siap').length === 0}
                onClick={handleExecuteBulkImport}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Proses Impor ({csvParsedRows.filter(r => r.status === 'siap').length} Buku Baru)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default ManajemenBuku;
