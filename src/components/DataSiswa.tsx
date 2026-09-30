import React, { useState } from 'react';
import { SiswaItem, KelasItem } from '../types/library';
import { 
  Search, 
  Plus, 
  X, 
  UserCheck, 
  UserX, 
  Edit2, 
  Trash2, 
  CreditCard, 
  Key, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Radio, 
  QrCode, 
  AlertTriangle,
  GraduationCap,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Check,
  ArrowUpRight
} from 'lucide-react';
import sound from '../utils/audio';
import { downloadCsvTemplate, parseCsvContent, ParsedCsvRow } from '../utils/csvHelper';

interface DataSiswaProps {
  siswa: SiswaItem[];
  kelasList: KelasItem[];
  onAddSiswa: (newSiswa: SiswaItem) => void;
  onBulkAddSiswa?: (newSiswaList: SiswaItem[]) => void;
  onEditSiswa: (updatedSiswa: SiswaItem) => void;
  onDeleteSiswa: (siswaId: string) => void;
  onToggleStatus: (siswaId: string) => void;
  isActionAllowed?: (actionId: string) => boolean;
}

export const DataSiswa: React.FC<DataSiswaProps> = ({
  siswa,
  kelasList,
  onAddSiswa,
  onBulkAddSiswa,
  onEditSiswa,
  onDeleteSiswa,
  onToggleStatus,
  isActionAllowed,
}) => {
  const canEdit = isActionAllowed ? isActionAllowed('edit_anggota') : true;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('Semua');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaItem | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteConfirmOpen] = useState(false);

  // Bulk Upload States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0 to 100
  const [uploadStatusText, setUploadStatusText] = useState('Memulai validasi data...');

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [uploadReport, setUploadReport] = useState<{
    total: number;
    successCount: number;
    failedCount: number;
    errors: { row: number; nis: string; name: string; reason: string }[];
    addedItems: SiswaItem[];
  } | null>(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formNis, setFormNis] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formKelasId, setFormKelasId] = useState('');
  const [formRfid, setFormRfid] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif' | 'Ditangguhkan'>('Aktif');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10); // Default 10 data per page

  const filteredSiswa = siswa.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rfidCard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesKelas = selectedKelasFilter === 'Semua' || s.kelasName === selectedKelasFilter;

    return matchesSearch && matchesKelas;
  });

  const totalPages = Math.ceil(filteredSiswa.length / itemsPerPage);
  const paginatedSiswa = filteredSiswa.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    const nextId = `S${String(siswa.length + 1).padStart(3, '0')}`;
    const defaultNis = `2026${String(siswa.length + 1).padStart(3, '0')}`;
    const defaultKelas = kelasList.length > 0 ? kelasList[0] : { id: 'K001', name: 'X MIPA 1' };

    setFormId(nextId);
    setFormNis(defaultNis);
    setFormNisn('');
    setFormName('');
    setFormGender('L');
    setFormKelasId(defaultKelas.id);
    setFormRfid(`RFID-SIS-${defaultNis}`);
    setFormEmail('');
    setFormPhone('');
    setFormUsername(defaultNis);
    setFormPassword('123456');
    setFormStatus('Aktif');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (s: SiswaItem) => {
    setSelectedSiswa(s);
    setFormId(s.id);
    setFormNis(s.nis);
    setFormNisn(s.nisn || '');
    setFormName(s.name);
    setFormGender(s.gender);
    setFormKelasId(s.kelasId);
    setFormRfid(s.rfidCard);
    setFormEmail(s.email || '');
    setFormPhone(s.phone || '');
    setFormUsername(s.username);
    setFormPassword(s.password);
    setFormStatus(s.status);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formNis.trim() || !formUsername.trim()) {
      sound.playErrorBuzz();
      alert('NIS, Nama Lengkap, dan Username Wajib Diisi!');
      return;
    }

    const matchedKelas = kelasList.find(k => k.id === formKelasId);
    const kelasName = matchedKelas ? matchedKelas.name : 'X MIPA 1';

    const item: SiswaItem = {
      id: formId,
      nis: formNis,
      nisn: formNisn || undefined,
      name: formName,
      gender: formGender,
      kelasId: formKelasId,
      kelasName: kelasName,
      rfidCard: formRfid || `RFID-SIS-${formNis}`,
      email: formEmail || undefined,
      phone: formPhone || undefined,
      username: formUsername.toLowerCase().replace(/\s+/g, ''),
      password: formPassword || '123456',
      status: formStatus,
      createdAt: isEditing && selectedSiswa ? selectedSiswa.createdAt : new Date().toISOString().split('T')[0]
    };

    if (isEditing) {
      onEditSiswa(item);
    } else {
      onAddSiswa(item);
    }

    sound.playSuccessChime();
    setIsModalOpen(false);
  };

  const handleViewCard = (s: SiswaItem) => {
    setSelectedSiswa(s);
    setIsCardModalOpen(true);
  };

  const handleDeleteRequest = (s: SiswaItem) => {
    setSelectedSiswa(s);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedSiswa) {
      onDeleteSiswa(selectedSiswa.id);
      sound.playTapConfirm();
      setIsDeleteConfirmOpen(false);
      setSelectedSiswa(null);
    }
  };

  // Bulk Upload File Reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCsvContent(text);
      setParsedRows(parsed);
      sound.playTapConfirm();
    };
    reader.readAsText(file);
  };

  // Execute Bulk Upload with 5-Second Processing Delay
  const handleStartBulkUpload = async () => {
    if (parsedRows.length === 0) {
      sound.playErrorBuzz();
      alert('File CSV kosong atau tidak mengandung baris data siswa yang valid!');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatusText('Memulai validasi struktur file...');

    // 5-second smooth timer simulation (5000ms)
    const duration = 5000;
    const intervalTime = 100;
    const totalSteps = duration / intervalTime;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const percent = Math.min(100, Math.round((step / totalSteps) * 100));
      setUploadProgress(percent);

      if (percent < 25) {
        setUploadStatusText('Membaca kelengkapan kolom NIS, Nama & Rombel Kelas...');
      } else if (percent < 55) {
        setUploadStatusText('Melakukan uji validasi anti-duplikasi NIS, NISN & Username...');
      } else if (percent < 85) {
        setUploadStatusText('Mengalokasikan tag RFID & pendaftaran kredensial portal...');
      } else {
        setUploadStatusText('Finalisasi pendaftaran massal siswa SMAN 1 Lumbung...');
      }

      if (step >= totalSteps) {
        clearInterval(timer);
      }
    }, intervalTime);

    // Wait exactly 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Validation against existing database records
    const existingNisSet = new Set(siswa.map(s => s.nis.toLowerCase().trim()));
    const existingNisnSet = new Set(siswa.filter(s => s.nisn).map(s => s.nisn!.toLowerCase().trim()));
    const existingUsernameSet = new Set(siswa.map(s => s.username.toLowerCase().trim()));
    const existingRfidSet = new Set(siswa.map(s => s.rfidCard.toLowerCase().trim()));

    // Track intra-file duplicates
    const fileNisSet = new Set<string>();
    const fileUsernameSet = new Set<string>();
    const fileRfidSet = new Set<string>();

    const addedItems: SiswaItem[] = [];
    const errors: { row: number; nis: string; name: string; reason: string }[] = [];

    let successCount = 0;
    let failedCount = 0;

    parsedRows.forEach((row) => {
      const cleanNis = row.nis.toLowerCase().trim();
      const cleanNisn = row.nisn.toLowerCase().trim();
      const cleanUsername = (row.username || row.nis).toLowerCase().trim();
      const cleanRfid = (row.rfidCard || `RFID-SIS-${row.nis}`).toLowerCase().trim();

      // Check validations
      if (!row.nis) {
        failedCount++;
        errors.push({ row: row.rowIndex, nis: '-', name: row.name || '-', reason: 'Nomor Induk Siswa (NIS) tidak boleh kosong' });
        return;
      }

      if (!row.name) {
        failedCount++;
        errors.push({ row: row.rowIndex, nis: row.nis, name: '-', reason: 'Nama lengkap siswa tidak boleh kosong' });
        return;
      }

      if (existingNisSet.has(cleanNis)) {
        failedCount++;
        errors.push({ row: row.rowIndex, nis: row.nis, name: row.name, reason: `NIS "${row.nis}" sudah terdaftar di sistem` });
        return;
      }

      if (fileNisSet.has(cleanNis)) {
        failedCount++;
        errors.push({ row: row.rowIndex, nis: row.nis, name: row.name, reason: `NIS "${row.nis}" ganda/terulang dalam file upload` });
        return;
      }

      if (cleanNisn && existingNisnSet.has(cleanNisn)) {
        failedCount++;
        errors.push({ row: row.rowIndex, nis: row.nis, name: row.name, reason: `NISN "${row.nisn}" sudah terdaftar pada siswa lain` });
        return;
      }

      if (existingUsernameSet.has(cleanUsername) || fileUsernameSet.has(cleanUsername)) {
        failedCount++;
        errors.push({ row: row.rowIndex, nis: row.nis, name: row.name, reason: `Username portal "${row.username}" sudah digunakan` });
        return;
      }

      if (existingRfidSet.has(cleanRfid) || fileRfidSet.has(cleanRfid)) {
        failedCount++;
        errors.push({ row: row.rowIndex, nis: row.nis, name: row.name, reason: `RFID Tag "${row.rfidCard}" sudah terdaftar pada anggota lain` });
        return;
      }

      // Mark intra-file sets
      fileNisSet.add(cleanNis);
      fileUsernameSet.add(cleanUsername);
      if (cleanRfid) fileRfidSet.add(cleanRfid);

      // Match class
      const matchedKelas = kelasList.find(k => k.name.toLowerCase().trim() === row.kelasName.toLowerCase().trim());
      const kelasId = matchedKelas ? matchedKelas.id : (kelasList[0]?.id || 'K001');
      const kelasName = matchedKelas ? matchedKelas.name : (row.kelasName || 'X MIPA 1');

      const nextId = `S${String(siswa.length + successCount + 1).padStart(3, '0')}`;
      const newSiswa: SiswaItem = {
        id: nextId,
        nis: row.nis,
        nisn: row.nisn || undefined,
        name: row.name,
        gender: row.gender,
        kelasId: kelasId,
        kelasName: kelasName,
        rfidCard: row.rfidCard || `RFID-SIS-${row.nis}`,
        email: row.email || undefined,
        phone: row.phone || undefined,
        username: row.username || row.nis,
        password: row.password || '123456',
        status: 'Aktif',
        createdAt: new Date().toISOString().split('T')[0]
      };

      addedItems.push(newSiswa);
      successCount++;
    });

    // Save added items
    if (addedItems.length > 0) {
      if (onBulkAddSiswa) {
        onBulkAddSiswa(addedItems);
      } else {
        addedItems.forEach(item => onAddSiswa(item));
      }
    }

    setUploadReport({
      total: parsedRows.length,
      successCount,
      failedCount,
      errors,
      addedItems
    });

    setIsUploading(false);
    setIsBulkModalOpen(false);
    setSelectedFile(null);
    setParsedRows([]);
    setIsReportModalOpen(true);

    if (successCount > 0) {
      sound.playSuccessChime();
    } else {
      sound.playErrorBuzz();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header lockup */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-teal-600 animate-pulse-soft" />
            Data Siswa & Kredensial Akses Portal
          </h2>
          <p className="text-xs text-slate-400">
            Pendaftaran siswa SMAN 1 Lumbung, pembuatan akun login otomatis (role Siswa), dan penugasan kartu RFID perpustakaan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={downloadCsvTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 px-3 py-2 transition-colors cursor-pointer"
            title="Download Template Format CSV / Excel"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Download Template
          </button>

          {canEdit ? (
            <>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setParsedRows([]);
                  setIsBulkModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-xs font-semibold text-teal-800 px-3.5 py-2 transition-colors cursor-pointer"
              >
                <Upload className="h-4 w-4 text-teal-600" />
                Upload Massal (Bulk)
              </button>

              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white px-4 py-2 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Tambah Siswa Baru
              </button>
            </>
          ) : (
            <span className="text-slate-400 text-xs bg-slate-100 border border-slate-200 rounded-md px-3 py-2 italic font-medium">
              🔒 Hak kelola siswa dikunci
            </span>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari NIS, nama siswa, username, RFID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Filter Kelas:</span>
          <select
            value={selectedKelasFilter}
            onChange={(e) => setSelectedKelasFilter(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="Semua">Semua Kelas</option>
            {kelasList.map(k => (
              <option key={k.id} value={k.name}>{k.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Students */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No.</th>
                <th className="py-3.5 px-4">NIS / Identitas</th>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Kredensial Username</th>
                <th className="py-3.5 px-4 text-center">Kartu RFID</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right w-44">Aksi Administrasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedSiswa.map((s, index) => {
                const isInactive = s.status !== 'Aktif';

                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-center tabular-nums">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span className="font-bold text-slate-800 block">{s.nis}</span>
                      <span className="text-[10px] text-slate-400 block">{s.nisn ? `NISN: ${s.nisn}` : 'No NISN'}</span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 ${
                          s.gender === 'L' ? 'bg-sky-600' : 'bg-rose-500'
                        }`}>
                          {s.gender}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">{s.name}</span>
                          <span className="text-[10px] text-slate-400 block">{s.email || '-'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {s.kelasName}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      @{s.username}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap font-mono">
                      <span className="bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded text-[10px] font-bold">
                        {s.rfidCard}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isInactive ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewCard(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                          title="Cetak Kartu RFID"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>

                        {canEdit && (
                          <>
                            <button
                              onClick={() => openEditModal(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Edit Siswa & Password"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteRequest(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSiswa.length === 0 && (
          <div className="py-12 text-center space-y-2">
            <GraduationCap className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-400">Tidak ada data siswa yang cocok dengan pencarian.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-2xs text-xs">
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
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value={5}>5 data</option>
              <option value={10}>10 data</option>
              <option value={20}>20 data</option>
              <option value={50}>50 data</option>
              <option value={100}>100 data</option>
            </select>
          </div>
          <span className="text-slate-500">
            Menampilkan <span className="font-semibold text-slate-800 font-mono">{filteredSiswa.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> -{' '}
            <span className="font-semibold text-slate-800 font-mono">{Math.min(currentPage * itemsPerPage, filteredSiswa.length)}</span> dari{' '}
            <span className="font-semibold text-slate-800 font-mono">{filteredSiswa.length}</span> siswa terdaftar
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); sound.playTapConfirm(); }}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors"
            >
              Sebelumnya
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentPage(i + 1); sound.playTapConfirm(); }}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
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
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* BULK UPLOAD MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-teal-600" />
                Upload Massal Data Siswa (Bulk CSV)
              </h3>
              {!isUploading && (
                <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Instruction Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Panduan Format File:</span>
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Template CSV
                </button>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Pastikan file berformat <strong>.CSV</strong>. Kolom wajib: <code>NIS</code>, <code>Nama Lengkap</code>, dan <code>Kelas</code>. Sistem akan otomatis memvalidasi keandalan data dari risiko duplikasi NIS atau Username ganda.
              </p>
            </div>

            {/* File Selector & Drag Drop Box */}
            <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 transition-colors rounded-xl p-6 text-center space-y-3 bg-slate-50/50 relative">
              <input
                type="file"
                accept=".csv, .txt"
                onChange={handleFileChange}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileSpreadsheet className="h-10 w-10 text-teal-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Pilih atau Tarik File CSV ke Sini'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB — ${parsedRows.length} Baris Terdeteksi` : 'Ukuran maksimum 5 MB (.csv)'}
                </p>
              </div>
            </div>

            {/* File Preview List */}
            {parsedRows.length > 0 && !isUploading && (
              <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3 text-xs space-y-2">
                <div className="flex justify-between items-center text-teal-900 font-bold text-[11px]">
                  <span>Pratinjau Data ({parsedRows.length} Siswa):</span>
                  <span className="font-mono text-[10px] bg-teal-100 px-2 py-0.5 rounded">Siap Divalidasi</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] font-mono">
                  {parsedRows.slice(0, 4).map((r) => (
                    <div key={r.rowIndex} className="flex justify-between bg-white/80 p-1.5 rounded border border-teal-100">
                      <span className="font-bold text-slate-800">{r.nis} — {r.name}</span>
                      <span className="text-slate-500">{r.kelasName}</span>
                    </div>
                  ))}
                  {parsedRows.length > 4 && (
                    <p className="text-[10px] text-slate-500 italic text-center pt-1">
                      ...dan {parsedRows.length - 4} baris lainnya
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleStartBulkUpload}
                disabled={!selectedFile || parsedRows.length === 0 || isUploading}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Mulai Upload Massal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-SECOND LOADING ANIMATION MODAL */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-8 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
              <Loader2 className="h-8 w-8 text-teal-600 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Memproses Validasi & Import Data Siswa
              </h3>
              <p className="text-xs text-slate-500 font-mono animate-pulse">
                {uploadStatusText}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-150 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-slate-400">
                <span>0%</span>
                <span className="text-teal-600">{uploadProgress}%</span>
                <span>100%</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              ⚡ Harap tunggu 5 detik saat sistem menguji sanitasi file dan mencegah duplikasi NIS di database.
            </p>
          </div>
        </div>
      )}

      {/* RESULT REPORT NOTIFICATION MODAL */}
      {isReportModalOpen && uploadReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                Laporan Hasil Upload Massal Siswa
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Total Diproses</span>
                <span className="text-lg font-black text-slate-800 font-mono">{uploadReport.total}</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block font-mono">✅ Berhasil</span>
                <span className="text-lg font-black text-emerald-700 font-mono">{uploadReport.successCount}</span>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase block font-mono">❌ Gagal / Ditolak</span>
                <span className="text-lg font-black text-rose-700 font-mono">{uploadReport.failedCount}</span>
              </div>
            </div>

            {/* Error / Failure List */}
            {uploadReport.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Rincian Data yang Gagal / Ditolak Validasi ({uploadReport.errors.length}):
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-rose-100 bg-rose-50/50 p-2.5 rounded-xl text-xs font-mono">
                  {uploadReport.errors.map((err, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-lg border border-rose-200 text-rose-900 leading-normal text-[11px]">
                      <span className="font-bold text-rose-700">Baris {err.row} (NIS: {err.nis}):</span> {err.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Notification */}
            {uploadReport.successCount > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed font-medium">
                🎉 Sebanyak <strong>{uploadReport.successCount} data siswa baru</strong> berhasil didaftarkan dan mendapatkan akun portal & kartu RFID perpustakaan secara otomatis!
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Tutup & Lihat Data Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Siswa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Ubah Data & Kredensial Siswa' : 'Registrasi Siswa Baru SMAN 1 Lumbung'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">NIS (Nomor Induk Siswa) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026001"
                    value={formNis}
                    onChange={(e) => {
                      setFormNis(e.target.value);
                      if (!isEditing) {
                        setFormUsername(e.target.value);
                        setFormRfid(`RFID-SIS-${e.target.value}`);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">NISN (Opsional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 0081234567"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold uppercase mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Budi Santoso"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Rombel Kelas *</label>
                  <select
                    value={formKelasId}
                    onChange={(e) => setFormKelasId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    {kelasList.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Email Siswa (Opsional)</label>
                  <input
                    type="email"
                    placeholder="e.g. budi@sman1lumbung.sch.id"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">RFID Card Tag ID</label>
                  <input
                    type="text"
                    placeholder="e.g. RFID-SIS-2026001"
                    value={formRfid}
                    onChange={(e) => setFormRfid(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Key className="h-4 w-4 text-teal-600" />
                  Kredensial Login Portal Siswa
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Username Login *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026001"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kata Sandi / Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="123456"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full p-2 pr-8 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RFID Card Badge Modal */}
      {isCardModalOpen && selectedSiswa && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-teal-600" />
                Kartu RFID Perpustakaan Siswa
              </h3>
              <button onClick={() => setIsCardModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Smart card design */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-teal-400 uppercase tracking-widest font-extrabold block">SMAN 1 LUMBUNG</span>
                  <h4 className="text-xs font-bold text-white tracking-wide">KARTU PERPUSTAKAAN SISWA</h4>
                </div>
                <Radio className="h-4 w-4 text-teal-400 animate-pulse-soft" />
              </div>

              <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-slate-400">NIS: {selectedSiswa.nis}</span>
                  <span className="text-[9px] font-mono text-teal-400 font-bold">{selectedSiswa.kelasName}</span>
                </div>
                <div>
                  <span className="text-sm font-extrabold text-white block">{selectedSiswa.name}</span>
                  <span className="text-[10px] font-mono text-teal-400 block mt-0.5">{selectedSiswa.rfidCard}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Mencetak kartu RFID untuk siswa ${selectedSiswa.name}...`);
                setIsCardModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide shadow-md cursor-pointer"
            >
              Cetak Kartu RFID
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && selectedSiswa && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold text-slate-900">Hapus Data Siswa</h3>
              <p className="text-xs text-slate-400">
                Apakah Anda yakin ingin menghapus data siswa <span className="font-bold text-slate-800">"{selectedSiswa.name}"</span>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-sm cursor-pointer"
              >
                Ya, Hapus Siswa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DataSiswa;
