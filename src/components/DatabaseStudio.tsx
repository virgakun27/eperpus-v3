import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Copy, 
  Check, 
  Download, 
  Server, 
  Activity, 
  Layers, 
  KeyRound, 
  ShieldCheck, 
  FileCode2, 
  ExternalLink,
  BookOpen,
  Users,
  GraduationCap,
  School,
  ArrowRightLeft,
  UserCheck,
  Zap,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
  Shield,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { api } from '../utils/api';
import sound from '../utils/audio';

interface DatabaseStudioProps {
  onDataRefreshed?: () => void;
  onCancel?: () => void;
}

interface DatabaseMetrics {
  classes: number;
  students: number;
  members: number;
  books: number;
  transactions: number;
  users: number;
}

export default function DatabaseStudio({ onDataRefreshed, onCancel }: DatabaseStudioProps) {
  // Token Authorization State (Stored in DB, verified via secure backend proxy)
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem('ep_db_auth_session'));
  });
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [testing, setTesting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [copied, setCopied] = useState(false);

  // Status & Test Results
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
    databaseName?: string;
    postgresVersion?: string;
    serverTime?: string;
    provider?: string;
    tablesFound?: string[];
  } | null>(null);

  const [dbMetrics, setDbMetrics] = useState<DatabaseMetrics>({
    classes: 0,
    students: 0,
    members: 0,
    books: 0,
    transactions: 0,
    users: 0
  });

  const [dbState, setDbState] = useState<{
    configured: boolean;
    connected: boolean;
    provider?: string;
  }>({
    configured: false,
    connected: false
  });

  const [schemaSql, setSchemaSql] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'tester' | 'schema' | 'config'>('tester');

  // Add Log Helper
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Fetch initial database status and SQL
  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const [statusRes, sqlRes] = await Promise.all([
        api.getDatabaseStatus().catch(() => null),
        api.getSchemaSql().catch(() => null)
      ]);

      if (statusRes) {
        setDbState({
          configured: statusRes.configured,
          connected: statusRes.connected,
          provider: statusRes.provider || 'SUPABASE ONLINE'
        });
        if (statusRes.tables) {
          setDbMetrics(prev => ({
            ...prev,
            ...statusRes.tables
          }));
        }
      }

      if (sqlRes && sqlRes.sql) {
        setSchemaSql(sqlRes.sql);
      }
    } catch (err: any) {
      addLog(`Gagal memuat status database: ${err.message}`);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // 1. Test Database Connection
  const handleTestConnection = async () => {
    setTesting(true);
    addLog('Mengirim perintah PING & query verifikasi ke SUPABASE ONLINE...');
    try {
      const res = await api.testDatabaseConnection();
      setTestResult(res);
      if (res.success) {
        sound.playSuccessChime();
        addLog(`✅ Terhubung ke database: ${res.databaseName || 'Supabase'} (Latency: ${res.latencyMs}ms)`);
        if (res.tablesFound && res.tablesFound.length > 0) {
          addLog(`📊 Tabel aktif terdeteksi: ${res.tablesFound.join(', ')}`);
        }
        setDbState(prev => ({ ...prev, connected: true, configured: true }));
      } else {
        sound.playErrorBuzz();
        addLog(`⚠️ Perhatian: ${res.message}`);
      }
      fetchStatus();
    } catch (err: any) {
      sound.playErrorBuzz();
      setTestResult({
        success: false,
        message: err.message || 'Koneksi gagal.'
      });
      addLog(`❌ Error koneksi: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  // 2. Execute & Apply Schema SQL / Seed
  const handleExecuteSchema = async () => {
    setMigrating(true);
    addLog('🚀 Memulai sinkronisasi otomatis schema DDL & data seed ke Supabase...');
    addLog('🔒 Enkripsi Bcrypt: Meng-hash seluruh password pada data siswa dan pengguna sistem...');
    try {
      const res = await api.executeDatabaseSchema();
      if (res.success) {
        sound.playSuccessChime();
        addLog(`✨ ${res.message}`);
        addLog('Tabel classes, students, members, books, transactions, users siap digunakan dengan password hash!');
        await fetchStatus();
        if (onDataRefreshed) onDataRefreshed();
      } else {
        sound.playErrorBuzz();
        addLog(`❌ Migrasi gagal: ${res.message || 'Periksa koneksi database'}`);
        addLog('💡 Tips: Jika tabel belum dibuat di Supabase, silakan buka tab "Lihat & Terapkan Schema SQL" lalu jalankan di Supabase SQL Editor.');
      }
    } catch (err: any) {
      sound.playErrorBuzz();
      addLog(`❌ Kesalahan saat menjalankan migrasi: ${err.message}`);
    } finally {
      setMigrating(false);
    }
  };

  // Copy Schema SQL
  const handleCopySql = () => {
    if (!schemaSql) return;
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    sound.playTapConfirm();
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Schema SQL
  const handleDownloadSql = () => {
    if (!schemaSql) return;
    const blob = new Blob([schemaSql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sound.playSuccessChime();
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      sound.playErrorBuzz();
      setTokenError('Harap masukkan token keamanan!');
      return;
    }

    setIsVerifying(true);
    setTokenError('');

    try {
      const res = await api.verifySecurityToken('DB_STUDIO_ACCESS', tokenInput.trim());
      if (res && res.success) {
        sessionStorage.setItem('ep_db_auth_session', res.tokenSessionId || `SES_${Date.now()}`);
        setIsAuthorized(true);
        sound.playSuccessChime();
      } else {
        sound.playErrorBuzz();
        setTokenError(res?.error || 'Token Otorisasi Database tidak valid! Akses ditolak.');
      }
    } catch (err: any) {
      sound.playErrorBuzz();
      setTokenError(err.message || 'Gagal memverifikasi token ke server.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLockStudio = () => {
    sessionStorage.removeItem('ep_db_auth_session');
    setIsAuthorized(false);
    setTokenInput('');
    setTokenError('');
    sound.playTapConfirm();
  };

  // IF NOT AUTHORIZED: RENDER TOKEN CONFIRMATION GATE
  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto my-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200/90 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 text-white text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/10">
              <Shield className="w-7 h-7 animate-pulse-soft" />
            </div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              Otorisasi Keamanan Database
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Menu <strong>Uji Database & SQL</strong> dilindungi oleh token otorisasi khusus administrator.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleVerifyToken} className="p-6 space-y-5">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
              <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Silakan masukkan <strong>Token Otorisasi Database</strong> untuk membuka konsol pengujian koneksi, eksekusi schema DDL, dan inspeksi tabel.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Token Otorisasi *
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Masukkan Token"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    if (tokenError) setTokenError('');
                  }}
                  className="w-full px-4 py-2.5 pr-11 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono tracking-wider text-slate-800 uppercase"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
                  title={showToken ? 'Sembunyikan Token' : 'Tampilkan Token'}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tokenError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2 animate-in fade-in duration-150">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{tokenError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal & Kembali
                </button>
              )}
              <button
                type="submit"
                disabled={isVerifying}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.98] rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Konfirmasi & Buka Akses</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-900">Integrasi Database Supabase & Schema SQL</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  SUPABASE ONLINE
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Pusat manajemen database SUPABASE ONLINE, hashing password bcrypt, inisialisasi schema DDL, dan inspeksi data.
              </p>
            </div>
          </div>
        </div>

        {/* Global Connection Badge & Lock Action */}
        <div className="flex items-center gap-2.5">
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border ${
            dbState.connected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : dbState.configured
              ? 'bg-emerald-50/70 text-emerald-700 border-emerald-200'
              : 'bg-gray-100 text-gray-700 border-gray-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              dbState.connected ? 'bg-emerald-500 animate-pulse' : dbState.configured ? 'bg-emerald-500' : 'bg-gray-400'
            }`} />
            {dbState.connected 
              ? 'Supabase: Terhubung' 
              : dbState.configured
              ? 'Supabase: Terkonfigurasi'
              : 'Mode LocalStorage'}
          </div>

          <button
            onClick={fetchStatus}
            disabled={loadingStatus}
            title="Muat Ulang Status"
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleLockStudio}
            title="Kunci Kembali Akses Database"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Kunci Akses</span>
          </button>
        </div>
      </div>

      {/* Security Callout: Password Hashing Active */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
              <span>Keamanan Data Tingkat Tinggi: Bcrypt Password Hashing Aktif</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              Seluruh kolom <code className="font-mono font-semibold bg-emerald-100/80 px-1 py-0.5 rounded">password_hash</code> pada tabel <span className="font-semibold">users</span> dan <span className="font-semibold">students</span> dienkripsi dengan algoritma <b>Bcrypt (Salt factor 10)</b>. Tidak ada password plaintext yang tersimpan di database.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block text-xs font-mono font-bold bg-white text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md shrink-0">
          bcryptjs 2.4.3
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 space-x-4 bg-white px-4 rounded-xl shadow-xs">
        <button
          onClick={() => setActiveTab('tester')}
          className={`py-3.5 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'tester'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Activity className="w-4 h-4" />
          Uji Koneksi & Tabel Data
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`py-3.5 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'schema'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          Lihat & Terapkan Schema SQL
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`py-3.5 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'config'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Konfigurasi Supabase
        </button>
      </div>

      {/* TAB 1: TESTER & TABLE METRICS */}
      {activeTab === 'tester' && (
        <div className="space-y-6">
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Test Connection */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md">
                    @supabase/supabase-js
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Uji Koneksi Supabase</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Kirim query ping real-time ke Supabase PostgREST endpoint untuk menguji latensi dan status ketersediaan tabel.
                </p>

                {testResult && (
                  <div className={`p-4 rounded-lg text-sm mb-4 border ${
                    testResult.success 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <div className="font-semibold">{testResult.message}</div>
                        {testResult.success && (
                          <div className="text-xs opacity-90 space-y-0.5 font-mono pt-1">
                            <div>• Provider: <b>SUPABASE ONLINE</b></div>
                            <div>• Project ID: <b>{testResult.databaseName}</b></div>
                            <div>• Latency: <b>{testResult.latencyMs} ms</b></div>
                            <div>• Server Time: <b>{testResult.serverTime}</b></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menguji Koneksi Supabase...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Uji Koneksi Supabase Sekarang
                  </>
                )}
              </button>
            </div>

            {/* Card 2: Execute Schema */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-md">
                    Otomatisasi Schema & Seed
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Sinkronisasi Otomatis Data ke Supabase</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Sinkronisasikan data awal katalog buku, rombel kelas, siswa, anggota, dan pengguna sistem dengan hash password otomatis.
                </p>

                <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200 mb-4 space-y-1">
                  <div className="font-semibold text-gray-700">Fitur Otomatisasi:</div>
                  <div>✓ Hashing Password Bcrypt (Salt Factor 10)</div>
                  <div>✓ Seed Buku, Siswa, Kelas, & Anggota SMAN 1 Lumbung</div>
                  <div>✓ Kompatibel dengan Supabase PostgREST & RLS Policies</div>
                  <div>✓ Sinkronisasi multi-tabel otomatis</div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleExecuteSchema}
                  disabled={migrating}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {migrating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Menyinkronkan ke Supabase...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Sinkronkan Data & Hash Password ke Supabase
                    </>
                  )}
                </button>

                <a
                  href="https://supabase.com/dashboard/project/samnjusvxjuqsnnhjucj/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg border border-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  Buka Supabase SQL Editor (Jalankan DDL Tabel)
                </a>
              </div>
            </div>
          </div>

          {/* Table Metrics Inspector Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                Status & Jumlah Data Tabel SUPABASE ONLINE
              </h3>
              <span className="text-xs text-gray-500">Auto-synced via Supabase API</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Books */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between text-amber-600 mb-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-xs font-mono bg-amber-50 px-2 py-0.5 rounded text-amber-700">books</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{dbMetrics.books}</div>
                <div className="text-xs text-gray-500 mt-1">Katalog Buku</div>
              </div>

              {/* Members */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between text-indigo-600 mb-2">
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-mono bg-indigo-50 px-2 py-0.5 rounded text-indigo-700">members</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{dbMetrics.members}</div>
                <div className="text-xs text-gray-500 mt-1">Anggota Kartu</div>
              </div>

              {/* Students */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between text-blue-600 mb-2">
                  <GraduationCap className="w-5 h-5" />
                  <span className="text-xs font-mono bg-blue-50 px-2 py-0.5 rounded text-blue-700">students</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{dbMetrics.students}</div>
                <div className="text-xs text-gray-500 mt-1">Data Siswa (Hashed)</div>
              </div>

              {/* Classes */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between text-emerald-600 mb-2">
                  <School className="w-5 h-5" />
                  <span className="text-xs font-mono bg-emerald-50 px-2 py-0.5 rounded text-emerald-700">classes</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{dbMetrics.classes}</div>
                <div className="text-xs text-gray-500 mt-1">Rombel Kelas</div>
              </div>

              {/* Transactions */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between text-rose-600 mb-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  <span className="text-xs font-mono bg-rose-50 px-2 py-0.5 rounded text-rose-700">transactions</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{dbMetrics.transactions}</div>
                <div className="text-xs text-gray-500 mt-1">Sirkulasi & Denda</div>
              </div>

              {/* Users */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between text-purple-600 mb-2">
                  <UserCheck className="w-5 h-5" />
                  <span className="text-xs font-mono bg-purple-50 px-2 py-0.5 rounded text-purple-700">users</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{dbMetrics.users}</div>
                <div className="text-xs text-gray-500 mt-1">Akun RBAC (Hashed)</div>
              </div>
            </div>
          </div>

          {/* Real-time Activity Terminal / Logs */}
          <div className="bg-gray-900 rounded-xl p-4 text-gray-200 shadow-md">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Console Log / Execution Terminal</span>
              </div>
              <button 
                onClick={() => setLogs([])}
                className="text-xs text-gray-500 hover:text-gray-300 font-mono cursor-pointer"
              >
                Bersihkan Log
              </button>
            </div>
            <div className="font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto pr-2">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic">Belum ada aktivitas. Klik "Uji Koneksi Supabase Sekarang" atau "Sinkronkan Data & Hash Password" untuk memulai.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="leading-relaxed">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SQL SCHEMA VIEWER */}
      {activeTab === 'schema' && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-emerald-600" />
                Script DDL Schema PostgreSQL Supabase (schema.sql)
              </h3>
              <p className="text-xs text-gray-500">
                Dilengkapi RLS Policies, ENUM types, Constraints, Trigger Auto-Update, dan Password terenkripsi Bcrypt.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Tersalin!' : 'Salin DDL SQL'}
              </button>

              <button
                onClick={handleDownloadSql}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-gray-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh .sql
              </button>

              <a
                href="https://supabase.com/dashboard/project/samnjusvxjuqsnnhjucj/sql/new"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-emerald-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka Supabase SQL Editor
              </a>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <b>Langkah Penerapan di Supabase Dashboard:</b>
              <ol className="list-decimal list-inside mt-1 space-y-0.5">
                <li>Klik tombol <b>"Salin DDL SQL"</b> di atas.</li>
                <li>Klik tombol <b>"Buka Supabase SQL Editor"</b> (membuka tab baru di project <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">samnjusvxjuqsnnhjucj</code>).</li>
                <li>Tempel (Paste) script SQL, lalu klik tombol <b>Run</b> (Ctrl+Enter). Seluruh tabel dan RLS policies akan aktif seketika.</li>
              </ol>
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 bg-gray-950 text-gray-100 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed border border-gray-800 selection:bg-emerald-800">
              {schemaSql || '-- Memuat schema.sql...'}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIG & SUPABASE GUIDE */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              Detail Konfigurasi Supabase
            </h3>
            <p className="text-sm text-gray-500">
              Kredensial database Supabase yang terpasang pada aplikasi perpustakaan SMAN 1 Lumbung.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Project URL</div>
              <div className="font-mono text-xs text-emerald-700 bg-white p-2.5 rounded border border-gray-200 break-all select-all font-semibold">
                https://samnjusvxjuqsnnhjucj.supabase.co
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Publishable / Anon API Key</div>
              <div className="font-mono text-xs text-emerald-700 bg-white p-2.5 rounded border border-gray-200 break-all select-all font-semibold">
                sb_publishable_QRmr07AWqRIHJswHQ-tNBw_r0UOFXWo
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
            <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Ringkasan Keamanan & Skema Hashing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-emerald-900">
              <div className="p-3 bg-white rounded-lg border border-emerald-100 space-y-1">
                <div className="font-bold text-gray-900">1. Algoritma Hashing</div>
                <div>Bcrypt dengan Salt factor 10, standar industri NIST & OWASP untuk penyimpanan password aman.</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-emerald-100 space-y-1">
                <div className="font-bold text-gray-900">2. Row Level Security (RLS)</div>
                <div>Setiap tabel dilengkapi policy RLS untuk memastikan hak akses API terkontrol.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
