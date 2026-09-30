import React, { useState, useEffect, useRef } from 'react';
import { getBooks, getMembers, getTransactions, saveBooks, saveMembers, saveTransactions, initializeDatabase, getRolePermissions, saveRolePermissions, getKelas, saveKelas, getSiswa, saveSiswa } from './utils/initialData';
import { Book, Member, Transaction, UserRole, RolePermissions, KelasItem, SiswaItem } from './types/library';
import { api } from './utils/api';
import Dashboard from './components/Dashboard';
import Sirkulasi from './components/Sirkulasi';
import KatalogBuku from './components/KatalogBuku';
import ManajemenBuku from './components/ManajemenBuku';
import ManajemenPengguna from './components/ManajemenPengguna';
import Anggota from './components/Anggota';
import RiwayatPeminjaman from './components/RiwayatPeminjaman';
import BukuPinjaman from './components/BukuPinjaman';
import DataPeminjamBuku from './components/DataPeminjamBuku';
import DatabaseStudio from './components/DatabaseStudio';
import GlobalSearch from './components/GlobalSearch';
import LandingPage from './components/LandingPage';
import { Language, TRANSLATIONS } from './utils/translations';
import sound from './utils/audio';
import { 
  Radio, 
  BookOpen, 
  Users, 
  History, 
  LayoutDashboard, 
  Menu, 
  X,
  Sparkles,
  Info,
  Database,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Shield,
  Clock,
  School,
  LogOut,
  Code
} from 'lucide-react';

export default function App() {
  // Language & Login States
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('ep_lang') as Language) || 'ID';
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('ep_logged_in') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('ep_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isManajemenBukuOpen, setIsManajemenBukuOpen] = useState<boolean>(true);
  const [isKelolaAnggotaOpen, setIsKelolaAnggotaOpen] = useState<boolean>(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active Role and RBAC States
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const savedUser = localStorage.getItem('ep_current_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return parsed.role || 'Admin';
    }
    return 'Admin';
  });
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);

  // Core Database States
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kelas, setKelas] = useState<KelasItem[]>([]);
  const [siswa, setSiswa] = useState<SiswaItem[]>([]);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; provider?: string }>({ connected: false });

  // Load Initial Databases from API with localStorage fallback
  useEffect(() => {
    initializeDatabase();
    setBooks(getBooks());
    setMembers(getMembers());
    setTransactions(getTransactions());
    setRolePermissions(getRolePermissions());
    setKelas(getKelas());
    setSiswa(getSiswa());

    // Fetch live data from backend
    const syncFromBackend = async () => {
      try {
        const health = await api.checkHealth();
        if (health.database === 'connected') {
          setDbStatus({ connected: true, provider: health.provider });
          
          const [apiBooks, apiClasses, apiStudents, apiMembers, apiTransactions] = await Promise.all([
            api.getBooks().catch(() => null),
            api.getClasses().catch(() => null),
            api.getStudents().catch(() => null),
            api.getMembers().catch(() => null),
            api.getTransactions().catch(() => null)
          ]);

          if (apiBooks) { setBooks(apiBooks); saveBooks(apiBooks); }
          if (apiClasses) { setKelas(apiClasses); saveKelas(apiClasses); }
          if (apiStudents) { setSiswa(apiStudents); saveSiswa(apiStudents); }
          if (apiMembers) { setMembers(apiMembers); saveMembers(apiMembers); }
          if (apiTransactions) { setTransactions(apiTransactions); saveTransactions(apiTransactions); }
        } else {
          setDbStatus({ connected: false });
        }
      } catch (err) {
        console.warn('Backend sync standby, using local cache:', err);
      }
    };

    syncFromBackend();
  }, []);

  const handleUpdateKelas = (newKelas: KelasItem[]) => {
    setKelas(newKelas);
    saveKelas(newKelas);
  };

  const handleAddKelas = async (item: KelasItem) => {
    const updated = [item, ...kelas];
    handleUpdateKelas(updated);
    api.saveClass(item).catch(err => console.warn('API sync warning:', err));
  };

  const handleEditKelas = async (item: KelasItem) => {
    const updated = kelas.map(k => k.id === item.id ? item : k);
    handleUpdateKelas(updated);
    api.updateClass(item).catch(err => console.warn('API sync warning:', err));
  };

  const handleDeleteKelas = async (id: string) => {
    const updated = kelas.filter(k => k.id !== id);
    handleUpdateKelas(updated);
    api.deleteClass(id).catch(err => console.warn('API sync warning:', err));
  };

  const handleUpdateSiswa = (newSiswa: SiswaItem[]) => {
    setSiswa(newSiswa);
    saveSiswa(newSiswa);
    setMembers(getMembers()); // reload synced members so circulation terminal updates
  };

  const handleAddSiswa = async (item: SiswaItem) => {
    const updated = [item, ...siswa];
    handleUpdateSiswa(updated);
    api.saveStudent(item).catch(err => console.warn('API sync warning:', err));
  };

  const handleBulkAddSiswa = async (newItems: SiswaItem[]) => {
    const updated = [...newItems, ...siswa];
    handleUpdateSiswa(updated);
    for (const item of newItems) {
      api.saveStudent(item).catch(err => console.warn('API sync warning:', err));
    }
  };

  const handleEditSiswa = async (item: SiswaItem) => {
    const updated = siswa.map(s => s.id === item.id ? item : s);
    handleUpdateSiswa(updated);
    api.updateStudent(item).catch(err => console.warn('API sync warning:', err));
  };

  const handleDeleteSiswa = async (id: string) => {
    const updated = siswa.filter(s => s.id !== id);
    handleUpdateSiswa(updated);
    api.deleteStudent(id).catch(err => console.warn('API sync warning:', err));
  };

  const handleUpdatePermissions = (newPerms: RolePermissions[]) => {
    setRolePermissions(newPerms);
    saveRolePermissions(newPerms);
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setIsLoggedIn(true);
    localStorage.setItem('ep_logged_in', 'true');
    localStorage.setItem('ep_current_user', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole('Admin');
    setIsLoggedIn(false);
    localStorage.removeItem('ep_logged_in');
    localStorage.removeItem('ep_current_user');
    sessionStorage.removeItem('ep_db_auth_token');
    sound.playTapConfirm();
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('ep_lang', lang);
  };

  // Sync state modifications to storage & backend
  const handleUpdateBooks = (newBooks: Book[]) => {
    setBooks(newBooks);
    saveBooks(newBooks);
  };

  const handleUpdateMembers = (newMembers: Member[]) => {
    setMembers(newMembers);
    saveMembers(newMembers);
  };

  const handleUpdateTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    saveTransactions(newTransactions);
  };

  // Add Book
  const handleAddBook = async (newBook: Book) => {
    const updated = [newBook, ...books];
    handleUpdateBooks(updated);
    api.saveBook(newBook).catch(err => console.warn('API sync warning:', err));
  };

  // Edit Book
  const handleEditBook = async (updatedBook: Book) => {
    const updated = books.map(b => b.id === updatedBook.id ? updatedBook : b);
    handleUpdateBooks(updated);
    api.updateBook(updatedBook).catch(err => console.warn('API sync warning:', err));
  };

  // Delete Book
  const handleDeleteBook = async (bookId: string) => {
    const updated = books.filter(b => b.id !== bookId);
    handleUpdateBooks(updated);
    api.deleteBook(bookId).catch(err => console.warn('API sync warning:', err));
  };

  // Add Member
  const handleAddMember = async (newMember: Member) => {
    const updated = [newMember, ...members];
    handleUpdateMembers(updated);
    api.saveMember(newMember).catch(err => console.warn('API sync warning:', err));
  };

  // Toggle member suspended status
  const handleToggleMemberStatus = async (memberId: string) => {
    const updated = members.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          status: m.status === 'Aktif' ? ('Ditangguhkan' as const) : ('Aktif' as const),
        };
      }
      return m;
    });
    handleUpdateMembers(updated);
    api.toggleMemberStatus(memberId).catch(err => console.warn('API sync warning:', err));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    sound.playTapConfirm();
  };

  // Helper to check if menu/tab is allowed for current role
  const isMenuAllowed = (tabId: string) => {
    if (tabId === 'buku_pinjaman') {
      return currentRole === 'Siswa';
    }
    if (currentRole === 'Admin') return true;
    const permissions = rolePermissions.find(p => p.role === currentRole);
    return permissions?.allowedMenus.includes(tabId) ?? false;
  };

  // Helper to check if an action is allowed for current role
  const isActionAllowed = (actionId: string) => {
    if (currentRole === 'Admin') return true;
    const permissions = rolePermissions.find(p => p.role === currentRole);
    return permissions?.allowedActions.includes(actionId) ?? false;
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    sound.playTapConfirm();

    // Check if current activeTab is allowed under the new role
    if (role !== 'Admin') {
      const permissions = rolePermissions.find(p => p.role === role);
      if (permissions) {
        // Find which is active among the sub-menus
        const baseTab = activeTab.split('_')[0]; // handles sirkulasi_peminjaman / sirkulasi_pengembalian
        const isTabAllowed = permissions.allowedMenus.some(menuId => menuId.startsWith(baseTab) || menuId === activeTab);
        if (!isTabAllowed) {
          // Find first allowed menu
          const firstAllowed = permissions.allowedMenus[0] || 'dashboard';
          setActiveTab(firstAllowed);
        }
      }
    }
  };

  // Breadcrumbs text helper based on active tab
  const getBreadcrumbsText = () => {
    switch (activeTab) {
      case 'dashboard':
        return currentRole === 'Siswa' ? 'Portal Siswa / Katalog Buku Utama' : 'Dashboard / Ringkasan Operasional';
      case 'buku_pinjaman':
        return 'Portal Siswa / Buku Pinjaman Saya';
      case 'sirkulasi':
        return 'Sirkulasi / Terminal RFID & QR';
      case 'katalog':
        return 'Katalog Buku / Pengelolaan Barcode & Tag';
      case 'manajemen_buku':
        return 'Manajemen Buku / Data Inventaris';
      case 'data_peminjam_buku':
        return 'Manajemen Buku / Data Peminjam Buku';
      case 'manajemen_pengguna':
        return 'Sistem / Manajemen Pengguna';
      case 'sirkulasi_peminjaman':
        return 'Manajemen Buku / Peminjaman Buku';
      case 'sirkulasi_pengembalian':
        return 'Manajemen Buku / Pengembalian Buku';
      case 'anggota':
      case 'anggota_siswa':
        return 'Kelola Anggota / Data Siswa SMAN 1 Lumbung';
      case 'anggota_kelas':
        return 'Kelola Anggota / Data Kelas & Wali Kelas';
      case 'anggota_semua':
        return 'Kelola Anggota / Direktori Semua Anggota';
      case 'riwayat':
        return 'Laporan / Riwayat Transaksi Sirkulasi';
      case 'database':
      case 'uji_database':
        return 'Sistem / Uji Koneksi & Schema SQL PostgreSQL';
      default:
        return 'Portal Utama';
    }
  };

  if (!isLoggedIn) {
    return (
      <LandingPage 
        books={books}
        onLoginSuccess={handleLoginSuccess}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  const t = TRANSLATIONS[language];

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row relative">
      
      {/* ========================================================= */}
      {/* SIDEBAR NAVIGATION (LEFT SECTION - DESKTOP / DRAWER - MOBILE) */}
      {/* ========================================================= */}
      
      {/* Mobile Navbar Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-slate-900 text-white shadow-md z-40 shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-teal-400 animate-pulse-soft" />
          <span className="font-extrabold tracking-tight font-display text-base">PustakaRFID</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Main Sidebar Component */}
      <aside className={`
        fixed inset-y-0 left-0 bg-slate-950 text-slate-200 w-[275px] flex flex-col justify-between z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen border-r border-slate-800/80 shadow-2xl
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header Brand Lockup */}
        <div className="p-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/20 text-white shrink-0">
                <Radio className="h-5 w-5 animate-pulse-soft" />
              </div>
              <div className="min-w-0">
                <span className="text-base font-black font-display tracking-tight text-white block leading-tight truncate">
                  {t.brand}
                </span>
                <span className="text-[10px] font-bold text-teal-400 font-mono tracking-wider uppercase block truncate">
                  SMAN 1 LUMBUNG
                </span>
              </div>
            </div>
            {isMobileMenuOpen && (
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Nav Area with Autohide Scrollbar */}
        <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4 sidebar-scrollbar">
          <nav className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">{t.navOperasional}</span>
            
            {isMenuAllowed('dashboard') && (
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                {currentRole === 'Siswa' ? (
                  <>
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>Dashboard Katalog Utama</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <span>{t.navDashboard}</span>
                  </>
                )}
              </button>
            )}

            {currentRole === 'Siswa' && isMenuAllowed('buku_pinjaman') && (
              <button
                onClick={() => handleTabChange('buku_pinjaman')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'buku_pinjaman'
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 shrink-0 text-teal-400" />
                  <span>{t.navBukuPinjaman}</span>
                </div>
                <span className="bg-teal-400/15 text-teal-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider scale-95">Siswa</span>
              </button>
            )}

            {isMenuAllowed('sirkulasi_peminjaman') && (
              <button
                onClick={() => handleTabChange('sirkulasi_peminjaman')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'sirkulasi_peminjaman' || activeTab === 'sirkulasi'
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Radio className="h-4 w-4 shrink-0" />
                  <span>{t.navSirkulasi}</span>
                </div>
                <span className="bg-teal-400/15 text-teal-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider scale-95">RFID</span>
              </button>
            )}

            {(isMenuAllowed('katalog') || isMenuAllowed('manajemen_buku') || isMenuAllowed('anggota') || isMenuAllowed('manajemen_pengguna')) && (
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-5 pb-2">{t.navDataMaster}</span>
            )}

            {isMenuAllowed('katalog') && (
              <button
                onClick={() => handleTabChange('katalog')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'katalog'
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                {t.navKatalog}
              </button>
            )}

            {/* Collapsible Manajemen Buku with Sub-menus */}
            {(isMenuAllowed('manajemen_buku') || isMenuAllowed('sirkulasi_peminjaman') || isMenuAllowed('sirkulasi_pengembalian')) && (
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsManajemenBukuOpen(!isManajemenBukuOpen);
                    const firstAllowedSub = isMenuAllowed('manajemen_buku') 
                      ? 'manajemen_buku' 
                      : isMenuAllowed('sirkulasi_peminjaman') 
                        ? 'sirkulasi_peminjaman' 
                        : 'sirkulasi_pengembalian';
                    handleTabChange(firstAllowedSub);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'manajemen_buku' || activeTab === 'sirkulasi_peminjaman' || activeTab === 'sirkulasi_pengembalian'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 shrink-0" />
                    {t.navManajemenBuku}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="bg-slate-900 text-slate-400 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider scale-95">Admin</span>
                    {isManajemenBukuOpen ? <ChevronDown className="h-3.5 w-3.5 opacity-60" /> : <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                  </div>
                </button>

                {/* Sub-menus */}
                {isManajemenBukuOpen && (
                  <div className="pl-4 space-y-1 mt-1 border-l border-slate-800 ml-4.5">
                    {isMenuAllowed('manajemen_buku') && (
                      <button
                        onClick={() => handleTabChange('manajemen_buku')}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left ${
                          activeTab === 'manajemen_buku'
                            ? 'text-teal-400 bg-slate-800/45 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Database className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        {t.navDataInventaris}
                      </button>
                    )}
                    {isMenuAllowed('data_peminjam_buku') && (
                      <button
                        onClick={() => handleTabChange('data_peminjam_buku')}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left ${
                          activeTab === 'data_peminjam_buku'
                            ? 'text-teal-400 bg-slate-800/45 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Users className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        {t.navDataPeminjamBuku}
                      </button>
                    )}
                    {isMenuAllowed('sirkulasi_peminjaman') && (
                      <button
                        onClick={() => handleTabChange('sirkulasi_peminjaman')}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left ${
                          activeTab === 'sirkulasi_peminjaman'
                            ? 'text-teal-400 bg-slate-800/45 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        {t.navPeminjaman}
                      </button>
                    )}
                    {isMenuAllowed('sirkulasi_pengembalian') && (
                      <button
                        onClick={() => handleTabChange('sirkulasi_pengembalian')}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left ${
                          activeTab === 'sirkulasi_pengembalian'
                            ? 'text-teal-400 bg-slate-800/45 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        {t.navPengembalian}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Kelola Anggota with Sub-menus */}
            {isMenuAllowed('anggota') && (
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsKelolaAnggotaOpen(!isKelolaAnggotaOpen);
                    handleTabChange('anggota_siswa');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab.startsWith('anggota')
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 shrink-0" />
                    {t.navKelolaAnggota}
                  </div>
                  {isKelolaAnggotaOpen ? <ChevronDown className="h-3.5 w-3.5 opacity-60" /> : <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                </button>

                {/* Sub-menus */}
                {isKelolaAnggotaOpen && (
                  <div className="pl-4 space-y-1 mt-1 border-l border-slate-800 ml-4.5">
                    <button
                      onClick={() => handleTabChange('anggota_siswa')}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left ${
                        activeTab === 'anggota_siswa' || activeTab === 'anggota'
                          ? 'text-teal-400 bg-slate-800/45 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      {t.navDataSiswa}
                    </button>

                    <button
                      onClick={() => handleTabChange('anggota_kelas')}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left ${
                        activeTab === 'anggota_kelas'
                          ? 'text-teal-400 bg-slate-800/45 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <BookOpen className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      {t.navDataKelas}
                    </button>

                    <button
                      onClick={() => handleTabChange('anggota_semua')}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left ${
                        activeTab === 'anggota_semua'
                          ? 'text-teal-400 bg-slate-800/45 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      {t.navSemuaAnggota}
                    </button>
                  </div>
                )}
              </div>
            )}

            {isMenuAllowed('manajemen_pengguna') && (
              <button
                onClick={() => handleTabChange('manajemen_pengguna')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'manajemen_pengguna'
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 shrink-0" />
                  {t.navKelolaPengguna}
                </div>
                <span className="bg-purple-900/60 text-purple-200 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider scale-95">Sistem</span>
              </button>
            )}

            {isMenuAllowed('riwayat') && (
              <button
                onClick={() => handleTabChange('riwayat')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'riwayat'
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <History className="h-4 w-4 shrink-0" />
                {t.navRiwayat}
              </button>
            )}

            {/* Database & Schema SQL Tools */}
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-4 pb-1">Integrasi Database</span>
            <button
              onClick={() => handleTabChange('database')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Uji Database & SQL</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider scale-95 flex items-center gap-1 ${
                dbStatus.connected ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {dbStatus.connected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                {dbStatus.connected ? 'Supabase' : 'SQL'}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Creation Year & IT Attribution Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950 shrink-0">
          {/* Dedicated Creation Year & IT Creator Attribution Footer */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/90 rounded-xl p-3 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-400 shrink-0">
                  <School className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-extrabold text-slate-100 tracking-tight leading-tight truncate">
                    SMAN 1 Lumbung
                  </div>
                  <div className="text-[9px] text-slate-400 leading-tight truncate">
                    Sistem Perpustakaan Digital
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800/60 px-1.5 py-0.5 rounded shrink-0">
                2026
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 text-[9px]">Tahun Pembuatan:</span>
              <span className="font-bold text-slate-200 font-mono text-[10px]">2026</span>
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 text-[9px]">Pembuat:</span>
              <span className="font-bold text-teal-400 flex items-center gap-1 font-mono text-[10px]">
                <Code className="w-3 h-3 text-teal-400" /> IT SMAN 1 Lumbung
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay Backdrop for Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
        ></div>
      )}

      {/* ========================================================= */}
      {/* MAIN VIEWPORT CANVAS AREA (RIGHT SECTION) */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        
        {/* TOP BAR CONTRACT: Contextual breadcrumbs on left, Global Search in middle, actions/profile on right */}
        <header className="hidden md:flex items-center justify-between px-8 py-3 border-b border-slate-200/60 bg-white shrink-0 z-30 gap-4">
          <div className="text-xs font-bold tracking-wide text-slate-400 uppercase font-mono shrink-0">
            {getBreadcrumbsText()}
          </div>

          {/* Center Global Search Bar */}
          <div className="flex-1 max-w-md mx-auto">
            <GlobalSearch 
              books={books}
              siswa={siswa}
              members={members}
              transactions={transactions}
              onNavigate={(tab) => {
                setActiveTab(tab);
              }}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setActiveTab('database')}
              title="Klik untuk membuka Pengujian & Schema Database"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold font-mono transition-all cursor-pointer hover:shadow-xs ${
                dbStatus.connected 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
              <span>{dbStatus.connected ? 'SUPABASE ONLINE' : 'Supabase Ready'}</span>
            </button>

            {/* Profile Dropdown Component */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 rounded-xl px-3 py-1.5 transition-all cursor-pointer shadow-2xs group select-none"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {(currentUser?.name || 'A').slice(0, 1)}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 block leading-tight">
                    {currentUser?.name || 'Administrator'}
                  </span>
                  <span className="text-[10px] font-medium text-teal-700 block leading-tight">
                    {currentRole}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-teal-600' : 'group-hover:text-slate-600'}`} />
              </button>

              {/* Animated Floating Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 transform origin-top-right">
                  {/* Account Header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-teal-500/20">
                        {(currentUser?.name || 'A').slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {currentUser?.name || 'Administrator'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          @{currentUser?.username || 'admin'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-medium">Hak Akses:</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 font-mono">
                        {currentRole}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">Status Akun:</span>
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Aktif
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Keluar Aplikasi</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Scroll Body */}
        <div className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {activeTab === 'dashboard' && (
            currentRole === 'Siswa' ? (
              <KatalogBuku 
                books={books}
                onAddBook={handleAddBook}
                onEditBook={handleEditBook}
                isActionAllowed={isActionAllowed}
              />
            ) : (
              <Dashboard 
                books={books} 
                members={members} 
                transactions={transactions} 
                onNavigate={setActiveTab} 
              />
            )
          )}

          {activeTab === 'buku_pinjaman' && (
            <BukuPinjaman 
              transactions={transactions}
              books={books}
              currentMember={
                members.find(m => 
                  (currentUser?.name || '').toLowerCase().includes(m.name.toLowerCase()) ||
                  m.name.toLowerCase().includes((currentUser?.name || '').toLowerCase()) ||
                  m.id === currentUser?.id
                ) || members[0]
              }
              currentUsername={currentUser?.name}
            />
          )}

          {(activeTab === 'sirkulasi' || activeTab === 'sirkulasi_peminjaman' || activeTab === 'sirkulasi_pengembalian') && (
            <Sirkulasi 
              books={books} 
              members={members} 
              transactions={transactions}
              onUpdateBooks={handleUpdateBooks}
              onUpdateMembers={handleUpdateMembers}
              onUpdateTransactions={handleUpdateTransactions}
              forcedTab={activeTab === 'sirkulasi_pengembalian' ? 'pengembalian' : 'peminjaman'}
              isActionAllowed={isActionAllowed}
            />
          )}

          {activeTab === 'katalog' && (
            <KatalogBuku 
              books={books}
              onAddBook={handleAddBook}
              onEditBook={handleEditBook}
              isActionAllowed={isActionAllowed}
            />
          )}

          {activeTab === 'manajemen_buku' && (
            <ManajemenBuku 
              books={books}
              onAddBook={handleAddBook}
              onEditBook={handleEditBook}
              onDeleteBook={handleDeleteBook}
              isActionAllowed={isActionAllowed}
            />
          )}

          {activeTab === 'data_peminjam_buku' && (
            <DataPeminjamBuku 
              transactions={transactions}
              books={books}
              members={members}
            />
          )}

          {activeTab.startsWith('anggota') && (
            <Anggota 
              members={members}
              onAddMember={handleAddMember}
              onToggleMemberStatus={handleToggleMemberStatus}
              siswaList={siswa}
              kelasList={kelas}
              onAddSiswa={handleAddSiswa}
              onBulkAddSiswa={handleBulkAddSiswa}
              onEditSiswa={handleEditSiswa}
              onDeleteSiswa={handleDeleteSiswa}
              onAddKelas={handleAddKelas}
              onEditKelas={handleEditKelas}
              onDeleteKelas={handleDeleteKelas}
              forcedSubTab={activeTab === 'anggota_kelas' ? 'kelas' : activeTab === 'anggota_semua' ? 'semua' : 'siswa'}
              isActionAllowed={isActionAllowed}
            />
          )}

          {activeTab === 'manajemen_pengguna' && (
            <ManajemenPengguna 
              rolePermissions={rolePermissions}
              onUpdatePermissions={handleUpdatePermissions}
            />
          )}

          {activeTab === 'riwayat' && (
            <RiwayatPeminjaman 
              transactions={transactions}
              isActionAllowed={isActionAllowed}
            />
          )}

          {(activeTab === 'database' || activeTab === 'uji_database') && (
            <DatabaseStudio 
              onCancel={() => {
                setActiveTab('dashboard');
                sound.playTapConfirm();
              }}
              onDataRefreshed={async () => {
                try {
                  const [apiBooks, apiClasses, apiStudents, apiMembers, apiTransactions] = await Promise.all([
                    api.getBooks().catch(() => null),
                    api.getClasses().catch(() => null),
                    api.getStudents().catch(() => null),
                    api.getMembers().catch(() => null),
                    api.getTransactions().catch(() => null)
                  ]);
                  if (apiBooks) { setBooks(apiBooks); saveBooks(apiBooks); }
                  if (apiClasses) { setKelas(apiClasses); saveKelas(apiClasses); }
                  if (apiStudents) { setSiswa(apiStudents); saveSiswa(apiStudents); }
                  if (apiMembers) { setMembers(apiMembers); saveMembers(apiMembers); }
                  if (apiTransactions) { setTransactions(apiTransactions); saveTransactions(apiTransactions); }
                } catch (err) {
                  console.warn('Sync refreshed state error:', err);
                }
              }}
            />
          )}
        </div>
      </main>

    </div>
  );
}
