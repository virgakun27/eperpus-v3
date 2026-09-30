import React, { useState, useEffect, useRef } from 'react';
import { Book, Member, Transaction } from '../types/library';
import { Html5QrcodeScanner } from 'html5-qrcode';
import sound from '../utils/audio';
import { api } from '../utils/api';
import { QRCodeGenerator } from './QRCodeGenerator';
import { 
  Radio, 
  QrCode, 
  UserCheck, 
  Plus, 
  Trash2, 
  CheckCircle, 
  FileText, 
  Camera, 
  AlertTriangle, 
  CreditCard,
  ShoppingBag,
  ArrowRight,
  Info,
  RotateCcw
} from 'lucide-react';

interface SirkulasiProps {
  books: Book[];
  members: Member[];
  transactions: Transaction[];
  onUpdateBooks: (books: Book[]) => void;
  onUpdateMembers: (members: Member[]) => void;
  onUpdateTransactions: (transactions: Transaction[]) => void;
  forcedTab?: 'peminjaman' | 'pengembalian';
  isActionAllowed?: (actionId: string) => boolean;
}

export const Sirkulasi: React.FC<SirkulasiProps> = ({
  books,
  members,
  transactions,
  onUpdateBooks,
  onUpdateMembers,
  onUpdateTransactions,
  forcedTab,
  isActionAllowed,
}) => {
  const canBorrow = isActionAllowed ? isActionAllowed('proses_peminjaman') : true;
  const canReturn = isActionAllowed ? isActionAllowed('proses_pengembalian') : true;
  // Navigation tabs for circulation type
  const [activeTab, setActiveTab] = useState<'peminjaman' | 'pengembalian'>('peminjaman');

  // Synchronize with parent forced tab if provided
  useEffect(() => {
    if (forcedTab) {
      setActiveTab(forcedTab);
      // Clean session upon switching tabs
      setActiveMember(null);
      setBorrowBasket([]);
      setReturnBook(null);
      setActiveReturnTx(null);
      setLastReceipt(null);
      setHardwareFeedback({ 
        type: 'idle', 
        message: forcedTab === 'peminjaman' 
          ? 'Tempelkan kartu RFID Anggota untuk memulai peminjaman' 
          : 'Pindai QR Code Buku untuk memproses pengembalian' 
      });
    }
  }, [forcedTab]);

  // --- BORROW FLOW STATES ---
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [borrowBasket, setBorrowBasket] = useState<Book[]>([]);
  const [lastReceipt, setLastReceipt] = useState<{
    type: 'borrow' | 'return';
    id: string;
    date: string;
    dueDate?: string;
    member: Member;
    items: Book[];
    finesPaid?: number;
  } | null>(null);

  // --- RETURN FLOW STATES ---
  const [returnBook, setReturnBook] = useState<Book | null>(null);
  const [activeReturnTx, setActiveReturnTx] = useState<Transaction | null>(null);

  // --- HARDWARE SIMULATION STATES ---
  const [rfidActive, setRfidActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [hardwareFeedback, setHardwareFeedback] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: 'Tempelkan kartu RFID Anggota atau arahkan kode QR Buku ke kamera' });

  // References for live camera scanner
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerId = "camera-qr-reader-viewport";

  // Trigger brief green flash on hardware simulation on success scan
  const triggerHardwareFeedback = (type: 'success' | 'error', message: string) => {
    setRfidActive(true);
    setHardwareFeedback({ type, message });
    setTimeout(() => {
      setRfidActive(false);
    }, 1500);
  };

  // --- SYSTEM LOGIC: RFID Member Card Tapped ---
  const handleMemberRFIDTap = (rfidCardId: string) => {
    const foundMember = members.find(m => m.rfidCard === rfidCardId);
    
    if (!foundMember) {
      sound.playErrorBuzz();
      triggerHardwareFeedback('error', `Kartu RFID '${rfidCardId}' tidak dikenali!`);
      return;
    }

    if (foundMember.status === 'Ditangguhkan') {
      sound.playErrorBuzz();
      triggerHardwareFeedback('error', `Akses ditolak: Keanggotaan ${foundMember.name} dibekukan!`);
      alert(`Keanggotaan ${foundMember.name} sedang ditangguhkan (suspended). Selesaikan masalah administrasi terlebih dahulu.`);
      return;
    }

    // Success tap
    sound.playTapConfirm();
    setActiveMember(foundMember);
    setLastReceipt(null); // clear receipt
    triggerHardwareFeedback('success', `Kartu Anggota Terdeteksi: ${foundMember.name}`);
  };

  // --- SYSTEM LOGIC: Book QR Scanned ---
  const handleBookScan = (bookIdentifier: string) => {
    // Look up by book ID
    const foundBook = books.find(b => b.id === bookIdentifier);

    if (!foundBook) {
      sound.playErrorBuzz();
      triggerHardwareFeedback('error', `Kode buku '${bookIdentifier}' tidak terdaftar!`);
      return;
    }

    // Play crisp beep sound
    sound.playScanBeep();

    if (activeTab === 'peminjaman') {
      processBorrowScan(foundBook);
    } else {
      processReturnScan(foundBook);
    }
  };

  // Sub-process: Add scanned book to borrow list
  const processBorrowScan = (book: Book) => {
    if (!activeMember) {
      sound.playErrorBuzz();
      triggerHardwareFeedback('error', 'Silakan tempelkan kartu RFID Anggota terlebih dahulu!');
      alert('Pindai kartu RFID anggota sebelum memindai buku.');
      return;
    }

    // Check if book is already in the basket
    if (borrowBasket.some(b => b.id === book.id)) {
      sound.playErrorBuzz();
      triggerHardwareFeedback('error', `Buku '${book.title}' sudah ada di daftar pinjam.`);
      return;
    }

    // Check if book stock is depleted
    if (book.availableStock <= 0) {
      sound.playErrorBuzz();
      triggerHardwareFeedback('error', `Stok buku '${book.title}' sedang kosong.`);
      alert(`Gagal: Stok buku '${book.title}' saat ini tidak tersedia di perpustakaan.`);
      return;
    }

    // Check member checkout limit
    const currentTotalCount = activeMember.activeLoansCount + borrowBasket.length;
    if (currentTotalCount >= activeMember.maxBooks) {
      sound.playErrorBuzz();
      triggerHardwareFeedback('error', 'Limit peminjaman anggota tercapai!');
      alert(`Anggota ${activeMember.name} memiliki limit maksimal ${activeMember.maxBooks} buku. Tidak dapat menambah buku lagi.`);
      return;
    }

    // All good: add to basket
    setBorrowBasket(prev => [...prev, book]);
    triggerHardwareFeedback('success', `Buku ditambahkan: ${book.title}`);
  };

  // Sub-process: Match active loans to return a book
  const processReturnScan = (book: Book) => {
    // Find active loan transaction for this book
    const activeTx = transactions.find(t => t.bookId === book.id && t.status !== 'Selesai');

    if (!activeTx) {
      sound.playErrorBuzz();
      // If book is available, it might not be checked out
      if (book.availableStock === book.stock) {
        triggerHardwareFeedback('error', `Buku '${book.title}' sudah berada di rak.`);
        alert(`Buku '${book.title}' berstatus TERSEDIA di sistem. Tidak ada catatan peminjaman aktif.`);
      } else {
        triggerHardwareFeedback('error', `Buku '${book.title}' tidak memiliki transaksi aktif.`);
      }
      setReturnBook(null);
      setActiveReturnTx(null);
      return;
    }

    // Found active loan!
    setReturnBook(book);
    setActiveReturnTx(activeTx);
    triggerHardwareFeedback('success', `Deteksi peminjaman aktif: ${book.title}`);
  };

  // Remove a book from borrow list
  const handleRemoveFromBasket = (bookId: string) => {
    setBorrowBasket(prev => prev.filter(b => b.id !== bookId));
    sound.playTapConfirm();
  };

  // Clear current borrow/checkout session
  const handleClearSession = () => {
    setActiveMember(null);
    setBorrowBasket([]);
    setLastReceipt(null);
    setReturnBook(null);
    setActiveReturnTx(null);
    setHardwareFeedback({ type: 'idle', message: 'Sirkulasi direset. Silakan lakukan tap kartu RFID' });
    sound.playTapConfirm();
  };

  // --- CONFIRM TRANSACTIONS ---
  
  // 1. Submit checkout / borrow transaction
  const handleConfirmBorrow = () => {
    if (!activeMember || borrowBasket.length === 0) return;

    const today = new Date();
    const borrowDateStr = today.toISOString().split('T')[0];
    
    // Calculate 4 business days excluding weekends (Saturday=6, Sunday=0)
    const addBusinessDays = (startDate: Date, days: number = 4): Date => {
      const result = new Date(startDate);
      let added = 0;
      while (added < days) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          added++;
        }
      }
      return result;
    };

    const dueDate = addBusinessDays(today, 4);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const newTransactions: Transaction[] = [...transactions];
    const updatedBooks = [...books];

    // Log transaction for each book
    borrowBasket.forEach((book, idx) => {
      const txId = `TRX-${Date.now() + idx}`;
      
      // Add transaction record
      newTransactions.push({
        id: txId,
        bookId: book.id,
        bookTitle: book.title,
        memberId: activeMember.id,
        memberName: activeMember.name,
        borrowDate: borrowDateStr,
        dueDate: dueDateStr,
        returnDate: null,
        status: 'Berlangsung',
        fineAmount: 0,
        notes: 'Peminjaman RFID Desk'
      });

      // Decrement available stock
      const bookIdx = updatedBooks.findIndex(b => b.id === book.id);
      if (bookIdx !== -1) {
        updatedBooks[bookIdx] = {
          ...updatedBooks[bookIdx],
          availableStock: updatedBooks[bookIdx].availableStock - 1,
          status: updatedBooks[bookIdx].availableStock - 1 === 0 ? 'Dipinjam' : 'Tersedia'
        };
      }
    });

    // Update member loans count
    const updatedMembers = [...members];
    const memberIdx = updatedMembers.findIndex(m => m.id === activeMember.id);
    if (memberIdx !== -1) {
      updatedMembers[memberIdx] = {
        ...updatedMembers[memberIdx],
        activeLoansCount: updatedMembers[memberIdx].activeLoansCount + borrowBasket.length
      };
    }

    // Save to global states & local storage
    onUpdateTransactions(newTransactions);
    onUpdateBooks(updatedBooks);
    onUpdateMembers(updatedMembers);

    // Sync to PostgreSQL backend
    const itemsToInsert = borrowBasket.map((book, idx) => ({
      id: `TRX-${Date.now() + idx}`,
      bookId: book.id,
      bookTitle: book.title,
      memberId: activeMember.id,
      memberName: activeMember.name,
      borrowDate: borrowDateStr,
      dueDate: dueDateStr,
      returnDate: null,
      status: 'Berlangsung' as const,
      fineAmount: 0,
      notes: 'Peminjaman RFID / Manual Desk'
    }));
    api.borrowBooks(itemsToInsert, activeMember.id).catch(err => console.warn('API loan sync warning:', err));

    // Play beautiful success chime
    sound.playSuccessChime();

    // Print printable checkout receipt
    setLastReceipt({
      type: 'borrow',
      id: `RC-B-${Math.floor(Math.random() * 90000) + 10000}`,
      date: borrowDateStr,
      dueDate: dueDateStr,
      member: activeMember,
      items: [...borrowBasket],
    });

    // Reset workflow
    setActiveMember(null);
    setBorrowBasket([]);
    triggerHardwareFeedback('success', 'Transaksi Peminjaman Berhasil Dicatat!');
  };

  // 2. Submit return transaction
  const handleConfirmReturn = () => {
    if (!returnBook || !activeReturnTx) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const borrowerId = activeReturnTx.memberId;
    const borrower = members.find(m => m.id === borrowerId);

    if (!borrower) return;

    // Update transactions status to Completed
    const updatedTransactions = transactions.map(t => {
      if (t.id === activeReturnTx.id) {
        return {
          ...t,
          status: 'Selesai' as const,
          returnDate: todayStr,
        };
      }
      return t;
    });

    // Increment book available stock
    const updatedBooks = books.map(b => {
      if (b.id === returnBook.id) {
        return {
          ...b,
          availableStock: Math.min(b.stock, b.availableStock + 1),
          status: 'Tersedia' as const
        };
      }
      return b;
    });

    // Decrement member's active loans
    const updatedMembers = members.map(m => {
      if (m.id === borrowerId) {
        return {
          ...m,
          activeLoansCount: Math.max(0, m.activeLoansCount - 1)
        };
      }
      return m;
    });

    // Save databases
    onUpdateTransactions(updatedTransactions);
    onUpdateBooks(updatedBooks);
    onUpdateMembers(updatedMembers);

    // Sync to PostgreSQL backend
    api.returnBook({
      transactionId: activeReturnTx.id,
      bookId: returnBook.id,
      memberId: borrowerId,
      returnDate: todayStr,
      fineAmount: activeReturnTx.fineAmount,
      notes: 'Pengembalian Selesai (Sirkulasi Desk)'
    }).catch(err => console.warn('API return sync warning:', err));

    // Play chime
    sound.playSuccessChime();

    // Generate return receipt
    setLastReceipt({
      type: 'return',
      id: `RC-R-${Math.floor(Math.random() * 90000) + 10000}`,
      date: todayStr,
      member: borrower,
      items: [returnBook],
      finesPaid: activeReturnTx.fineAmount
    });

    // Reset return states
    setReturnBook(null);
    setActiveReturnTx(null);
    triggerHardwareFeedback('success', 'Pengembalian Buku Berhasil Diproses!');
  };

  // --- LIVE WEB CAMERA SCANNER MANAGEMENT ---
  const handleToggleCamera = () => {
    if (cameraActive) {
      stopCameraScanner();
    } else {
      startCameraScanner();
    }
  };

  const startCameraScanner = () => {
    setCameraActive(true);
    // Give DOM a microsecond to render the #camera-qr-reader-viewport element
    setTimeout(() => {
      try {
        qrScannerRef.current = new Html5QrcodeScanner(
          scannerId,
          { 
            fps: 10, 
            qrbox: { width: 200, height: 200 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
          },
          /* verbose= */ false
        );

        qrScannerRef.current.render(
          (decodedText) => {
            // Found barcode/QR code text!
            // Clean scan string and process
            const cleanedText = decodedText.trim();
            handleBookScan(cleanedText);
          },
          (errorMessage) => {
            // Low-noise error catcher for scanner pollings
          }
        );
      } catch (err) {
        console.error("Gagal inisialisasi modul kamera:", err);
        setCameraActive(false);
        alert("Modul kamera tidak dapat diakses atau diblokir oleh peramban/izin perangkat. Silakan gunakan pemindai barcode eksternal atau input kode buku secara langsung.");
      }
    }, 100);
  };

  const stopCameraScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.clear()
        .then(() => {
          qrScannerRef.current = null;
          setCameraActive(false);
        })
        .catch(err => {
          console.error("Gagal membersihkan kamera scanner:", err);
          setCameraActive(false);
        });
    } else {
      setCameraActive(false);
    }
  };

  // Cleanup camera scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch(e => console.warn(e));
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Tab Selectors (Segmented Control Buttons) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-sm border border-slate-200/50">
        <button
          onClick={() => { setActiveTab('peminjaman'); handleClearSession(); }}
          className={`flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
            activeTab === 'peminjaman'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Radio className="h-3.5 w-3.5 inline mr-1.5 animate-pulse-soft" />
          Peminjaman Baru
        </button>
        <button
          onClick={() => { setActiveTab('pengembalian'); handleClearSession(); }}
          className={`flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
            activeTab === 'pengembalian'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5 inline mr-1.5" />
          Pengembalian Buku
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: ACTIVE TRANSACTION FORM & STATUS (7 COLS) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-xl shadow-sm p-5 space-y-6 min-h-[500px] flex flex-col justify-between">
          
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {activeTab === 'peminjaman' ? 'Formulir Peminjaman Buku' : 'Formulir Pengembalian Buku'}
              </h2>
              {(activeMember || returnBook || lastReceipt) && (
                <button
                  onClick={handleClearSession}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* CASE 1: BORROW MODE */}
            {activeTab === 'peminjaman' && (
              <div className="space-y-6">
                
                {/* STEP 1: Member Info Display */}
                {!activeMember ? (
                  <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center space-y-4 bg-slate-50/50">
                    <div className="mx-auto w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center animate-pulse-soft">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-700">Identifikasi Anggota (Peminjaman Manual / RFID)</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                        Tempelkan kartu RFID atau pilih anggota peminjam secara manual dari daftar di bawah.
                      </p>
                    </div>

                    {/* Manual Member Selector */}
                    <div className="pt-2 max-w-sm mx-auto text-left space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Anggota Peminjam (Manual):</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            const selectedM = members.find(m => m.id === e.target.value);
                            if (selectedM) handleMemberRFIDTap(selectedM.rfidCard);
                          }
                        }}
                        defaultValue=""
                        className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                      >
                        <option value="" disabled>-- Pilih Siswa / Guru Peminjam --</option>
                        {members.filter(m => m.status === 'Aktif').map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.type} - {m.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                        {activeMember.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">{activeMember.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-teal-700 font-medium">
                          <span>{activeMember.type}</span>
                          <span>·</span>
                          <span className="font-mono">{activeMember.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Limit Buku</span>
                        <span className="block text-sm font-mono font-bold text-teal-900">
                          {activeMember.activeLoansCount + borrowBasket.length} / {activeMember.maxBooks}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSession}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-white border border-rose-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Ganti Peminjam
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Scanned Items / Shopping Basket & Manual Book Selector */}
                {activeMember && (
                  <div className="space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Buku yang Akan Dipinjam ({borrowBasket.length})
                      </h3>
                      <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        ⏱️ Durasi Pinjam: Maksimal 4 Hari Kerja (Sabtu-Minggu Libur)
                      </span>
                    </div>

                    {/* Manual Book Selector Input */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Buku Manual Untuk Ditambahkan:</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBookScan(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                        className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                      >
                        <option value="" disabled>-- Cari / Pilih Buku Dari Katalog --</option>
                        {books.filter(b => b.availableStock > 0).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.id} — {b.title} (Stok: {b.availableStock} | Rak: {b.location})
                          </option>
                        ))}
                      </select>
                    </div>

                    {borrowBasket.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center space-y-1.5 bg-slate-50/30">
                        <ShoppingBag className="h-5 w-5 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-400">Belum ada buku dipindai. Silakan pindai QR atau tag RFID buku.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-100 bg-slate-50/30 rounded-xl overflow-hidden p-1.5">
                        {borrowBasket.map(book => (
                          <div key={book.id} className="p-3 flex items-center justify-between gap-3 bg-white rounded-lg shadow-2xs border border-slate-100/60 mb-1 last:mb-0">
                            <div className="flex items-center gap-3">
                              {/* mini book cover */}
                              <div className={`w-9 h-12 rounded border flex flex-col justify-between p-1 shrink-0 font-display ${book.coverColor}`}>
                                <span className="text-[5px] font-mono leading-none font-bold opacity-80">{book.id}</span>
                                <span className="text-[6px] font-black leading-tight truncate uppercase">{book.title}</span>
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{book.title}</h5>
                                <p className="text-[10px] text-slate-400 font-mono">ID: {book.id} · {book.location}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFromBasket(book.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Batal pilih"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CASE 2: RETURN MODE */}
            {activeTab === 'pengembalian' && (
              <div className="space-y-6">
                {!returnBook ? (
                  <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3 bg-slate-50/50">
                    <div className="mx-auto w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center animate-pulse-soft">
                      <RotateCcw className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-700">Verifikasi Buku</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                        Pindai kode QR buku atau tempelkan sampul RFID buku pada reader terminal untuk memverifikasi detail peminjaman.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Return book detail */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex gap-4">
                      <div className={`w-14 h-20 shrink-0 rounded-md border flex flex-col justify-between p-1.5 shadow-sm font-display ${returnBook.coverColor}`}>
                        <span className="text-[8px] font-mono leading-none font-bold opacity-80">{returnBook.id}</span>
                        <span className="text-[9px] font-extrabold leading-tight line-clamp-3 uppercase">{returnBook.title}</span>
                        <div className="w-2 h-0.5 bg-current opacity-30 rounded-sm"></div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="inline-block text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono">
                          KEMBALI: DIPINJAM
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{returnBook.title}</h4>
                        <p className="text-xs text-slate-400 font-mono">
                          ISBN: {returnBook.isbn} · Lokasi Rak: {returnBook.location}
                        </p>
                      </div>
                    </div>

                    {/* Borrower info from TRX */}
                    {activeReturnTx && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                          Detail Peminjam
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="block text-slate-400 text-[10px] uppercase">Nama Anggota</span>
                            <span className="font-bold text-slate-800">{activeReturnTx.memberName}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">{activeReturnTx.memberId}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[10px] uppercase">Tanggal Pinjam</span>
                            <span className="font-bold font-mono text-slate-700">{activeReturnTx.borrowDate}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[10px] uppercase">Batas Kembali</span>
                            <span className="font-bold font-mono text-slate-700">{activeReturnTx.dueDate}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[10px] uppercase">Denda Keterlambatan</span>
                            <span className={`font-bold font-mono ${activeReturnTx.fineAmount > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600'}`}>
                              {activeReturnTx.fineAmount > 0 
                                ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(activeReturnTx.fineAmount)
                                : 'Rp 0 (Tepat Waktu)'
                              }
                            </span>
                          </div>
                        </div>

                        {activeReturnTx.fineAmount > 0 && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-amber-800 leading-normal">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Buku Terlambat Dikembalikan!</span> Denda dihitung otomatis berdasarkan skema Rp 1.000 per hari keterlambatan. Pastikan pembayaran diselesaikan.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* LAST TRANSACTION RECEIPT (PRINT PREVIEW) */}
            {lastReceipt && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 font-mono text-xs text-slate-700 max-w-sm mx-auto shadow-xs border-dashed relative">
                <div className="text-center space-y-1 pb-3 border-b border-slate-300">
                  <h3 className="font-black text-slate-900 tracking-tight text-sm">PUSTAKA DIGITAL</h3>
                  <p className="text-[10px] text-slate-400 leading-none">Smart RFID & QR Desk Terminal</p>
                  <p className="text-[9px] text-slate-400">Telkom University, Bandung</p>
                </div>

                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>No. Resi:</span>
                    <span className="font-bold">{lastReceipt.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{lastReceipt.date}</span>
                  </div>
                  {lastReceipt.dueDate && (
                    <div className="flex justify-between">
                      <span>Batas Kembali:</span>
                      <span className="font-bold text-teal-700">{lastReceipt.dueDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Anggota:</span>
                    <span>{lastReceipt.member.name} ({lastReceipt.member.id})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipe:</span>
                    <span>{lastReceipt.member.type}</span>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-300 my-2"></div>

                <div className="space-y-2">
                  <span className="font-bold block text-[10px] text-slate-400 uppercase">DAFTAR BUKU:</span>
                  {lastReceipt.items.map((item, idx) => (
                    <div key={item.id} className="flex justify-between text-[11px] items-start">
                      <span className="max-w-[200px] truncate">{idx + 1}. {item.title}</span>
                      <span className="font-bold shrink-0">({item.id})</span>
                    </div>
                  ))}
                </div>

                <div className="border-b border-dashed border-slate-300 my-2"></div>

                <div className="text-center space-y-1">
                  <span className="inline-block bg-teal-600 text-white font-bold rounded px-2.5 py-0.5 text-[10px] uppercase tracking-wider">
                    {lastReceipt.type === 'borrow' ? 'PEMINJAMAN BERHASIL' : 'PENGEMBALIAN BERHASIL'}
                  </span>
                  {lastReceipt.finesPaid !== undefined && lastReceipt.finesPaid > 0 && (
                    <p className="text-[10px] text-rose-600 font-bold">
                      Denda Dibayar: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(lastReceipt.finesPaid)}
                    </p>
                  )}
                  <p className="text-[9px] text-slate-400 leading-normal pt-2">
                    {lastReceipt.type === 'borrow' 
                      ? 'Harap kembalikan buku tepat waktu demi kenyamanan bersama. Terima kasih!'
                      : 'Buku berhasil dikembalikan ke dalam stok perpustakaan. Sampai jumpa kembali!'
                    }
                  </p>
                </div>
                
                {/* Decorative cut lines */}
                <div className="absolute top-0 inset-x-0 h-1 flex justify-between overflow-hidden opacity-15">
                  {Array(20).fill(0).map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-slate-900 rotate-45 transform origin-top-left -translate-y-1"></div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons at base of left column */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            {activeTab === 'peminjaman' && activeMember && borrowBasket.length > 0 && (
              canBorrow ? (
                <button
                  onClick={handleConfirmBorrow}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  Konfirmasi Peminjaman
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed border border-slate-300"
                >
                  🔒 Konfirmasi Peminjaman (Hak Akses Terkunci)
                </button>
              )
            )}

            {activeTab === 'pengembalian' && returnBook && activeReturnTx && (
              canReturn ? (
                <button
                  onClick={handleConfirmReturn}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  Konfirmasi Pengembalian
                  <CheckCircle className="h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed border border-slate-300"
                >
                  🔒 Konfirmasi Pengembalian (Hak Akses Terkunci)
                </button>
              )
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: HARDWARE TERMINAL SIMULATOR SANDBOX (5 COLS) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* HARDWARE DEVICE PANEL */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-lg border-2 border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-teal-400 animate-pulse-soft" />
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-white">Smart RFID & QR Reader Terminal</h2>
              </div>
              <span className="font-mono text-[9px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded tracking-wide uppercase">
                DEVICE: ACTIVE
              </span>
            </div>

            {/* PHYSICAL DECK: Simulated Camera Viewport / RFID Antenna area */}
            <div className="space-y-4">
              
              {/* Camera Scanner Screen */}
              <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex flex-col items-center justify-center">
                {cameraActive ? (
                  /* The real HTML5-QRCode scanner rendering element */
                  <div id={scannerId} className="w-full h-full text-slate-900 bg-white"></div>
                ) : (
                  /* Beautiful procedural skeuomorphic scan overlay */
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    {/* Laser line effect */}
                    <div className="absolute left-0 right-0 h-0.5 bg-rose-500/80 shadow-[0_0_10px_#ef4444] animate-scan pointer-events-none"></div>
                    
                    <QrCode className="h-10 w-10 text-slate-700" />
                    <p className="text-[11px] text-slate-500 font-mono mt-2 tracking-wider">CAMERA FEED INACTIVE</p>
                  </div>
                )}

                {/* Status HUD overlay */}
                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/70 backdrop-blur-md border border-slate-800 rounded p-2 text-[10px] font-mono flex items-center justify-between">
                  <span className="text-slate-400">Scanner Mode: <span className="text-teal-400 uppercase font-bold">{activeTab}</span></span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse-soft' : 'bg-slate-600'}`}></span>
                    <span className="text-slate-500 text-[9px]">WEBCAM</span>
                  </div>
                </div>
              </div>

              {/* RFID Card tapping deck visualizer */}
              <div className="relative border-2 border-dashed border-slate-800 bg-slate-950/40 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 min-h-[110px] transition-all overflow-hidden">
                <div className={`absolute inset-0 bg-teal-500/5 transition-opacity ${rfidActive ? 'opacity-100' : 'opacity-0'}`}></div>
                
                {/* Physical sensor ring graphic */}
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                  rfidActive 
                    ? 'border-teal-400 bg-teal-500/10 scale-105 shadow-[0_0_15px_rgba(20,184,166,0.3)]' 
                    : 'border-slate-800'
                }`}>
                  <Radio className={`h-5 w-5 ${rfidActive ? 'text-teal-400 animate-pulse' : 'text-slate-600'}`} />
                </div>
                
                <span className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">RFID Member Card Reader</span>

                {/* Antenna circular sweep watermarks */}
                <div className="absolute w-36 h-36 rounded-full border border-teal-500/5 animate-antenna-glow pointer-events-none"></div>
              </div>

              {/* LIVE WEBCAM SCAN TOGGLE */}
              <div>
                <button
                  onClick={handleToggleCamera}
                  className={`w-full justify-center inline-flex items-center gap-2 rounded-lg py-2.5 text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                    cameraActive 
                      ? 'bg-rose-600 text-white hover:bg-rose-700' 
                      : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  {cameraActive ? 'Matikan Kamera Webcam' : 'Aktifkan Kamera Scan QR (Real)'}
                </button>
              </div>

              {/* Hardware Diagnostic Screen HUD */}
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/80 font-mono text-[10px] space-y-1">
                <span className="text-slate-500 block uppercase tracking-wide">Output Konsol Terminal:</span>
                <p className={`font-bold ${
                  hardwareFeedback.type === 'success' 
                    ? 'text-emerald-400' 
                    : hardwareFeedback.type === 'error'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                }`}>
                  &gt; {hardwareFeedback.message}
                </p>
              </div>

            </div>
          </div>

          {/* ========================================================= */}
          {/* VIRTUAL RFID & QR TEST BENCH (CLICKS SIMULATE HARDWARE TAPS) */}
          {/* ========================================================= */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Terminal Poin Cepat Anggota & Buku</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                Pilih kartu anggota atau katalog buku di bawah untuk memproses peminjaman/pengembalian secara cepat di terminal.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Virtual Member Cards Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                  Pilih Kartu RFID Anggota (Tap):
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {members.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleMemberRFIDTap(m.rfidCard)}
                      disabled={m.status === 'Ditangguhkan'}
                      className={`p-2.5 rounded-lg border text-left transition-all text-xs flex flex-col justify-between h-20 shadow-2xs group relative overflow-hidden ${
                        m.status === 'Ditangguhkan'
                          ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                          : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800 cursor-pointer hover:border-slate-700 hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[8px] font-mono tracking-wider text-teal-400 uppercase font-semibold leading-none">RFID MEM</span>
                        <span className="w-4 h-2.5 bg-amber-400/80 rounded-xs border border-amber-300 opacity-60"></span>
                      </div>
                      <div className="z-10">
                        <h5 className="font-bold line-clamp-1 leading-none">{m.name}</h5>
                        <span className="text-[9px] text-slate-400 font-mono">{m.rfidCard}</span>
                      </div>
                      
                      {/* circular design badge */}
                      <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">
                        <CreditCard className="h-10 w-10 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Virtual Books QR Grid */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <QrCode className="h-3.5 w-3.5 text-slate-400" />
                  Katalog Buku Cepat (Scan QR):
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {books.map(b => {
                    const isBookBorrowedInBasket = borrowBasket.some(basketItem => basketItem.id === b.id);
                    
                    return (
                      <button
                        key={b.id}
                        onClick={() => handleBookScan(b.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all text-xs flex items-center gap-2.5 shadow-2xs group hover:scale-[1.01] hover:border-slate-300 cursor-pointer bg-slate-50/60 border-slate-200/80 ${
                          isBookBorrowedInBasket ? 'ring-1 ring-teal-500 ring-offset-1 bg-teal-50/30' : ''
                        }`}
                      >
                        {/* mini mock book cover */}
                        <div className={`w-7 h-10 shrink-0 rounded border flex flex-col justify-between p-0.5 shadow-2xs font-display ${b.coverColor}`}>
                          <span className="text-[4px] font-mono leading-none opacity-80">{b.id}</span>
                          <span className="text-[5px] font-black leading-tight line-clamp-2 uppercase">{b.title}</span>
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          <h5 className="font-bold text-slate-800 line-clamp-1 group-hover:text-teal-600 transition-colors leading-tight">
                            {b.title}
                          </h5>
                          <span className="block text-[9px] font-mono text-slate-400 truncate uppercase">
                            ID: {b.id}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
export default Sirkulasi;
