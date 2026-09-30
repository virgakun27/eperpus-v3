import React, { useState } from 'react';
import { KelasItem } from '../types/library';
import { Search, Plus, X, GraduationCap, Edit2, Trash2, Users, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import sound from '../utils/audio';

interface DataKelasProps {
  kelas: KelasItem[];
  onAddKelas: (newKelas: KelasItem) => void;
  onEditKelas: (updatedKelas: KelasItem) => void;
  onDeleteKelas: (kelasId: string) => void;
  isActionAllowed?: (actionId: string) => boolean;
}

export const DataKelas: React.FC<DataKelasProps> = ({
  kelas,
  onAddKelas,
  onEditKelas,
  onDeleteKelas,
  isActionAllowed,
}) => {
  const canEdit = isActionAllowed ? isActionAllowed('edit_anggota') : true;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'Semua' | 'X' | 'XI' | 'XII'>('Semua');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<KelasItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteConfirmOpen] = useState(false);

  // Form states
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formGradeLevel, setFormGradeLevel] = useState<'X' | 'XI' | 'XII'>('X');
  const [formAcademicYear, setFormAcademicYear] = useState('2025/2026');
  const [formHomeroomTeacher, setFormHomeroomTeacher] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredKelas = kelas.filter(k => {
    const matchesSearch = 
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.homeroomTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.academicYear.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGrade = selectedGrade === 'Semua' || k.gradeLevel === selectedGrade;

    return matchesSearch && matchesGrade;
  });

  const totalPages = Math.ceil(filteredKelas.length / itemsPerPage);
  const paginatedKelas = filteredKelas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    const nextId = `K${String(kelas.length + 1).padStart(3, '0')}`;
    setFormId(nextId);
    setFormName('');
    setFormGradeLevel('X');
    setFormAcademicYear('2025/2026');
    setFormHomeroomTeacher('');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (k: KelasItem) => {
    setSelectedKelas(k);
    setFormId(k.id);
    setFormName(k.name);
    setFormGradeLevel(k.gradeLevel);
    setFormAcademicYear(k.academicYear);
    setFormHomeroomTeacher(k.homeroomTeacher);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formHomeroomTeacher.trim()) {
      sound.playErrorBuzz();
      alert('Nama Kelas dan Nama Wali Kelas wajib diisi!');
      return;
    }

    const item: KelasItem = {
      id: formId,
      name: formName,
      gradeLevel: formGradeLevel,
      academicYear: formAcademicYear,
      homeroomTeacher: formHomeroomTeacher,
      studentCount: isEditing && selectedKelas ? selectedKelas.studentCount : 0
    };

    if (isEditing) {
      onEditKelas(item);
    } else {
      onAddKelas(item);
    }

    sound.playSuccessChime();
    setIsModalOpen(false);
  };

  const handleDeleteRequest = (k: KelasItem) => {
    setSelectedKelas(k);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedKelas) {
      onDeleteKelas(selectedKelas.id);
      sound.playTapConfirm();
      setIsDeleteConfirmOpen(false);
      setSelectedKelas(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header lockup */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-teal-600 animate-pulse-soft" />
            Data Kelas & Wali Kelas SMAN 1 Lumbung
          </h2>
          <p className="text-xs text-slate-400">
            Kelola pembagian rombel, tingkat kelas, tahun pelajaran, serta penugasan wali kelas civitas sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit ? (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white px-4 py-2 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah Kelas Baru
            </button>
          ) : (
            <span className="text-slate-400 text-xs bg-slate-100 border border-slate-200 rounded-md px-3 py-2 italic font-medium">
              🔒 Hak tambah kelas dikunci
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelas, wali kelas, tahun ajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {(['Semua', 'X', 'XI', 'XII'] as const).map(grade => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                selectedGrade === grade ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {grade === 'Semua' ? 'Semua Tingkat' : `Kelas ${grade}`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedKelas.map((k) => (
          <div key={k.id} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 font-mono text-[10px] font-bold border border-teal-100 mb-1">
                    {k.academicYear}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{k.name}</h3>
                </div>
                <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-600">
                  Tingkat {k.gradeLevel}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 font-medium">Wali Kelas:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">{k.homeroomTeacher}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 font-medium">Jumlah Siswa:</span>
                  <span className="font-bold text-teal-600 font-mono">{k.studentCount || 0} Siswa</span>
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  onClick={() => openEditModal(k)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Edit Kelas"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteRequest(k)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Hapus Kelas"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredKelas.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center space-y-3">
          <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-400">Tidak ada data kelas yang sesuai pencarian.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm text-xs">
          <span className="text-slate-500">
            Menampilkan halaman <span className="font-semibold text-slate-800 font-mono">{currentPage}</span> dari{' '}
            <span className="font-semibold text-slate-800 font-mono">{totalPages}</span>
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

      {/* Modal Add/Edit Kelas */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Data Kelas' : 'Tambah Rombel Kelas Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">ID Kelas</label>
                  <input
                    type="text"
                    disabled
                    value={formId}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Tingkat Kelas *</label>
                  <select
                    value={formGradeLevel}
                    onChange={(e) => setFormGradeLevel(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold uppercase mb-1">Nama Rombel Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. X MIPA 1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold uppercase mb-1">Tahun Pelajaran *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2025/2026"
                  value={formAcademicYear}
                  onChange={(e) => setFormAcademicYear(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold uppercase mb-1">Nama Wali Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drs. H. Mulyana, M.Pd."
                  value={formHomeroomTeacher}
                  onChange={(e) => setFormHomeroomTeacher(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
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
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && selectedKelas && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold text-slate-900">Hapus Data Kelas</h3>
              <p className="text-xs text-slate-400">
                Apakah Anda yakin ingin menghapus rombel kelas <span className="font-bold text-slate-800">"{selectedKelas.name}"</span>?
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
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DataKelas;
