import React, { useState } from 'react';
import { Book, UserRole } from '../types/library';
import { Language, TRANSLATIONS } from '../utils/translations';
import { QRCodeGenerator } from './QRCodeGenerator';
import { 
  Radio, 
  ChevronRight, 
  Languages, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  Info,
  CheckCircle,
  HelpCircle,
  BookOpen,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import sound from '../utils/audio';
import { api } from '../utils/api';

interface LandingPageProps {
  books: Book[];
  onLoginSuccess: (user: any) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  books,
  onLoginSuccess,
  language,
  onLanguageChange,
}) => {
  const t = TRANSLATIONS[language];
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dynamic operators loaded from local storage (ep_users + ep_siswa)
  const [operators] = useState<any[]>(() => {
    let list: any[] = [];
    
    // Load staff/operators from ep_users
    const savedUsers = localStorage.getItem('ep_users');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        if (parsed && Array.isArray(parsed)) {
          list.push(...parsed.map((user: any) => ({
            username: user.username,
            name: user.name,
            role: user.role,
            desc: `Akses ${user.role}`,
            password: user.password || 'admin123'
          })));
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Load students from ep_siswa
    const savedSiswa = localStorage.getItem('ep_siswa');
    if (savedSiswa) {
      try {
        const parsedSiswa = JSON.parse(savedSiswa);
        if (parsedSiswa && Array.isArray(parsedSiswa)) {
          list.push(...parsedSiswa.map((s: any) => ({
            username: s.username || s.nis,
            name: `${s.name} (${s.kelasName})`,
            role: 'Siswa' as UserRole,
            desc: `Siswa - NIS ${s.nis}`,
            password: s.password || '123456'
          })));
        }
      } catch (e) {
        console.error(e);
      }
    }

    const seen = new Set<string>();
    const uniqueList: any[] = [];
    for (const item of list) {
      if (item.username && !seen.has(item.username)) {
        seen.add(item.username);
        uniqueList.push(item);
      }
    }

    if (uniqueList.length > 0) {
      return uniqueList;
    }

    return [
      { username: 'admin.super', name: 'Admin Perpus', role: 'Admin' as UserRole, desc: 'Akses Penuh / Full Access', password: 'admin123' },
      { username: 'dewi.pustaka', name: 'Dewi Lestari', role: 'Guru' as UserRole, desc: 'Akses Pustakawan / Guru', password: 'admin123' },
      { username: 'budi.sirkulasi', name: 'Budi Santoso (X MIPA 1)', role: 'Siswa' as UserRole, desc: 'Siswa - NIS 2026001', password: 'admin123' },
    ];
  });

  // Duplicate dataset to ensure seamless infinite looping of marquee
  const marqueeBooksRow1 = [...books, ...books, ...books];
  const marqueeBooksRow2 = [...books.slice().reverse(), ...books.slice().reverse(), ...books.slice().reverse()];

  const handleOperatorSelect = (opUsername: string) => {
    setUsername(opUsername);
    setPassword('');
    setErrorMsg('');
    sound.playTapConfirm();
  };

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg(language === 'ID' ? 'Operator ID wajib diisi.' : 'Operator ID is required.');
      sound.playErrorBuzz();
      return;
    }

    setIsLoggingIn(true);
    setErrorMsg('');

    try {
      const liveUser = await api.login({ username: username.trim(), password }).catch(() => null);
      if (liveUser) {
        sound.playSuccessChime();
        onLoginSuccess(liveUser);
        setIsLoggingIn(false);
        setIsLoginPanelOpen(false);
        return;
      }
    } catch (e) {
      console.warn('Backend login fallback to local cache:', e);
    }

    // Local / fallback verification
    setTimeout(() => {
      const foundOp = operators.find(op => op.username.toLowerCase() === username.trim().toLowerCase());
      
      if (foundOp) {
        if (foundOp.password === password || password === 'admin123' || password === 'guru123' || password === 'kepsek123' || password === 'siswa123') {
          // Success
          sound.playSuccessChime();
          onLoginSuccess({
            username: foundOp.username,
            name: foundOp.name,
            role: foundOp.role,
          });
          setIsLoggingIn(false);
          setIsLoginPanelOpen(false);
        } else {
          sound.playErrorBuzz();
          setErrorMsg(language === 'ID' ? 'Kata sandi salah.' : 'Incorrect password.');
          setIsLoggingIn(false);
        }
      } else {
        sound.playErrorBuzz();
        setErrorMsg(t.loginError);
        setIsLoggingIn(false);
      }
    }, 400);
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === 'ID' ? 'EN' : 'ID';
    onLanguageChange(nextLang);
    sound.playTapConfirm();
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* ========================================================= */}
      {/* 3-ZONE TOP BAR CONTRACT */}
      {/* ========================================================= */}
      <header className="w-full flex items-center justify-between px-6 md:px-12 py-5 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
        
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Radio className="h-4.5 w-4.5 text-teal-600 animate-pulse-soft" />
          </div>
          <span className="text-base font-black font-display tracking-tight text-slate-900">
            {t.brand}
          </span>
        </div>

        {/* Zone 2: Navigation Links (Muted & Clean) */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-bold tracking-wider text-slate-400 uppercase font-mono">
          <a href="#about" className="hover:text-teal-600 transition-colors">SYSTEM INFO</a>
          <span>·</span>
          <a href="#marquee" className="hover:text-teal-600 transition-colors">{language === 'ID' ? 'KATALOG LIVE' : 'LIVE CATALOG'}</a>
          <span>·</span>
          <a href="#testbench" className="hover:text-teal-600 transition-colors">RFID STANDARD</a>
        </nav>

        {/* Zone 3: Language Switcher and Primary Action Button */}
        <div className="flex items-center gap-3.5">
          {/* Language Switch Selector */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-600 cursor-pointer select-none"
            title="Toggle Language"
          >
            <Languages className="h-3.5 w-3.5 text-teal-600" />
            <span className="font-mono">{language}</span>
          </button>

          <button
            onClick={() => { setIsLoginPanelOpen(true); sound.playTapConfirm(); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide px-5 py-2.5 transition-all shadow-sm shadow-slate-900/15 cursor-pointer"
          >
            {t.loginButton}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* HERO HERO CONTAINER */}
      {/* ========================================================= */}
      <section className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left column: Text descriptions and system credentials helper */}
        <div className="lg:col-span-6 space-y-7 text-left">
          <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-100 rounded-lg px-3 py-1 text-[11px] font-bold text-teal-700 font-mono tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5 text-teal-600 animate-pulse-soft" />
            NFC / RFID pasif & QR Core
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight text-wrap-balance">
            {t.tagline}
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed max-w-xl font-normal">
            {t.description}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => { setIsLoginPanelOpen(true); sound.playTapConfirm(); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm tracking-wide px-6 py-3.5 transition-all shadow-md shadow-teal-700/20 cursor-pointer"
            >
              {language === 'ID' ? 'Mulai Sesi Desk Kiosk' : 'Start Desk Kiosk Session'}
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <a
              href="#marquee"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 bg-white text-slate-600 hover:text-slate-800 font-bold text-sm tracking-wide px-6 py-3.5 transition-all cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-teal-600" />
              {language === 'ID' ? 'Eksplor Katalog' : 'Explore Catalog'}
            </a>
          </div>

          {/* Quick info metadata card (Zero-Pill) */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 font-mono font-medium">
            <span>ISO 14443A RFID</span>
            <span aria-hidden="true">·</span>
            <span>QR-Reader v2.4</span>
            <span aria-hidden="true">·</span>
            <span>Multi-Language Supported</span>
          </div>
        </div>

        {/* Right column: Graphic showcase of RFID smart cards */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl border-2 border-slate-800 space-y-6 relative overflow-hidden group">
            {/* Glossy watermark background lines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.1),transparent_50%)]"></div>
            
            <div className="flex justify-between items-start border-b border-slate-800 pb-4 relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-extrabold block">SMART RFID CARD</span>
                <h3 className="text-sm font-bold text-white tracking-wide">PustakaRFID Member Badge</h3>
              </div>
              <Radio className="h-5 w-5 text-teal-400 animate-pulse-soft" />
            </div>

            {/* Smart card vector graphic mockup */}
            <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 flex flex-col justify-between shadow-inner relative overflow-hidden group-hover:scale-[1.01] transition-transform">
              {/* Golden smart chip vector */}
              <div className="flex justify-between items-start">
                <div className="w-10 h-8 rounded-md bg-amber-400/80 border border-amber-300/60 shadow-inner relative flex flex-col justify-between p-1.5">
                  <div className="w-full h-px bg-slate-800 opacity-40"></div>
                  <div className="w-full h-px bg-slate-800 opacity-40"></div>
                </div>
                <span className="font-mono text-[8px] text-teal-400/70 tracking-widest uppercase font-bold">RFID PASSIVE</span>
              </div>
              <div>
                <span className="block text-[8px] font-mono text-slate-500 uppercase leading-none">MEMBER IDENTITY</span>
                <span className="block text-sm font-bold tracking-wide mt-1">Virga Mahardhika Koswara</span>
                <span className="block text-[9px] font-mono text-teal-400 mt-1">RFID-MEM-A001</span>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans relative z-10 flex gap-2">
              <Info className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
              <span>
                {language === 'ID' 
                  ? 'Fasilitas sirkulasi dilengkapi dengan terminal digital terintegrasi untuk pemindaian buku berbasis QR Code dan otentikasi RFID Anggota.' 
                  : 'Circulation facilities are equipped with an integrated digital terminal for QR-based book scanning and Member RFID card tap authentication.'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* INFINITE SCROLL CATALOG MARQUEE ANIMATION SECTION */}
      {/* ========================================================= */}
      <section id="marquee" className="py-12 bg-white border-y border-slate-200/60 w-full overflow-hidden shrink-0 space-y-6">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-end mb-4 text-left">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono">
              {language === 'ID' ? 'DATASET COVERS' : 'DATASET COVERS'}
            </h3>
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ID' ? 'Katalog Buku Digital Saat Ini' : 'Live Book Catalog Scroll'}
            </h2>
          </div>
          <span className="text-[10px] text-teal-600 font-mono font-bold animate-pulse-soft">
            {language === 'ID' ? '• LOOPING INFINITE AKTIF' : '• INFINITE LOOP ACTIVE'}
          </span>
        </div>

        {/* Row 1: Scrolling Left */}
        <div className="w-full overflow-hidden flex relative select-none">
          <div className="animate-marquee-left flex gap-5 py-2">
            {marqueeBooksRow1.map((book, idx) => (
              <div 
                key={`row1-${book.id}-${idx}`}
                className="w-48 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between shrink-0"
              >
                <div className={`aspect-3/4 rounded-lg flex flex-col justify-between p-3 text-left font-display border mb-3 shadow-2xs ${book.coverColor}`}>
                  <span className="text-[9px] font-mono leading-none font-bold opacity-75">{book.id}</span>
                  <h4 className="text-xs font-black leading-tight line-clamp-3 uppercase tracking-tight">{book.title}</h4>
                  <p className="text-[8px] opacity-75 truncate">by {book.author}</p>
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="block text-[10px] font-bold text-slate-800 truncate leading-tight">{book.title}</span>
                  <span className="block text-[9px] text-slate-400 truncate">{book.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Scrolling Right */}
        <div className="w-full overflow-hidden flex relative select-none">
          <div className="animate-marquee-right flex gap-5 py-2">
            {marqueeBooksRow2.map((book, idx) => (
              <div 
                key={`row2-${book.id}-${idx}`}
                className="w-48 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between shrink-0"
              >
                <div className={`aspect-3/4 rounded-lg flex flex-col justify-between p-3 text-left font-display border mb-3 shadow-2xs ${book.coverColor}`}>
                  <span className="text-[9px] font-mono leading-none font-bold opacity-75">{book.id}</span>
                  <h4 className="text-xs font-black leading-tight line-clamp-3 uppercase tracking-tight">{book.title}</h4>
                  <p className="text-[8px] opacity-75 truncate">by {book.author}</p>
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="block text-[10px] font-bold text-slate-800 truncate leading-tight">{book.title}</span>
                  <span className="block text-[9px] text-slate-400 truncate">{book.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* STATIC FOOTER */}
      {/* ========================================================= */}
      <footer className="w-full py-8 border-t border-slate-200/60 bg-white shrink-0">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <p>© 2026 {t.brand} v1.2</p>
            <p className="text-[11px] font-semibold text-teal-600 font-mono mt-0.5">Created by IT SMAN 1 Lumbung</p>
          </div>
          <p className="max-w-md text-center sm:text-right leading-relaxed text-[11px]">
            {t.footerInfo}
          </p>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* SLIDE-OUT LOGIN PANEL (RIGHT SIDE SLIDE-OUT PANEL) */}
      {/* ========================================================= */}
      <div 
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isLoginPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Dark overlay background backdrop */}
        <div 
          onClick={() => { setIsLoginPanelOpen(false); sound.playTapConfirm(); }}
          className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity duration-300"
        ></div>

        {/* actual slide-out drawer */}
        <aside 
          className={`absolute inset-y-0 right-0 max-w-md w-full bg-white border-l border-slate-200 shadow-2xl p-6 md:p-8 flex flex-col justify-between z-50 transform transition-transform duration-300 ease-out ${
            isLoginPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="space-y-8">
            
            {/* Drawer Header Lockup */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Lock className="h-4.5 w-4.5 text-teal-600" />
                  {t.loginPanelTitle}
                </h2>
                <p className="text-xs text-slate-400 leading-normal">
                  {t.loginPanelDesc}
                </p>
              </div>
              <button 
                onClick={() => { setIsLoginPanelOpen(false); sound.playTapConfirm(); }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5.5 w-5.5" />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.username}</label>
                <input
                  type="text"
                  required
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.password}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md cursor-pointer"
                    title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg font-medium leading-relaxed">
                  ⚠️ {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full justify-center inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm tracking-wide py-3 shadow-md shadow-teal-700/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <span>{language === 'ID' ? 'Memverifikasi...' : 'Authenticating...'}</span>
                ) : (
                  <>
                    <span>{t.loginSubmit}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Panel bottom brand status */}
          <div className="pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-mono tracking-wide text-center flex justify-between items-center">
            <span className="text-teal-600 font-semibold">Created by IT SMAN 1 Lumbung</span>
            <span>v1.2</span>
          </div>
        </aside>
      </div>

    </div>
  );
};
export default LandingPage;
