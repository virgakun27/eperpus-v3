import React, { useState, useEffect } from 'react';
import { Member, SiswaItem, KelasItem } from '../types/library';
import { Search, Plus, X, Users, CreditCard, Mail, Phone, ShieldAlert, Award, GraduationCap, BookOpen } from 'lucide-react';
import { DataSiswa } from './DataSiswa';
import { DataKelas } from './DataKelas';
import sound from '../utils/audio';

interface AnggotaProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onToggleMemberStatus: (memberId: string) => void;
  siswaList: SiswaItem[];
  kelasList: KelasItem[];
  onAddSiswa: (s: SiswaItem) => void;
  onBulkAddSiswa?: (newList: SiswaItem[]) => void;
  onEditSiswa: (s: SiswaItem) => void;
  onDeleteSiswa: (id: string) => void;
  onAddKelas: (k: KelasItem) => void;
  onEditKelas: (k: KelasItem) => void;
  onDeleteKelas: (id: string) => void;
  forcedSubTab?: 'siswa' | 'kelas' | 'semua';
  isActionAllowed?: (actionId: string) => boolean;
}

const MEMBER_TYPES = [
  { value: 'Siswa', max: 3, label: 'Siswa (Maks. 3 Buku)' },
  { value: 'Guru', max: 5, label: 'Guru / Dosen (Maks. 5 Buku)' },
  { value: 'Staf', max: 3, label: 'Staf (Maks. 3 Buku)' },
  { value: 'Umum', max: 2, label: 'Umum (Maks. 2 Buku)' },
];

export const Anggota: React.FC<AnggotaProps> = ({
  members,
  onAddMember,
  onToggleMemberStatus,
  siswaList,
  kelasList,
  onAddSiswa,
  onBulkAddSiswa,
  onEditSiswa,
  onDeleteSiswa,
  onAddKelas,
  onEditKelas,
  onDeleteKelas,
  forcedSubTab,
  isActionAllowed,
}) => {
  const canEdit = isActionAllowed ? isActionAllowed('edit_anggota') : true;
  const [activeSubTab, setActiveSubTab] = useState<'siswa' | 'kelas' | 'semua'>(forcedSubTab || 'siswa');

  useEffect(() => {
    if (forcedSubTab) {
      setActiveSubTab(forcedSubTab);
    }
  }, [forcedSubTab]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // 5 items per page for high density member list

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Mahasiswa');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // Filter members
  const filteredMembers = members.filter(m => {
    return (
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.rfidCard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Reset page when search or data size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, members.length]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formEmail.trim()) {
      sound.playErrorBuzz();
      alert('Nama Lengkap dan Email wajib diisi!');
      return;
    }

    const nextId = `A00${members.length + 1}`;
    const selectedTypeConfig = MEMBER_TYPES.find(t => t.value === formType);
    
    const newMember: Member = {
      id: nextId,
      name: formName,
      status: 'Aktif',
      rfidCard: `RFID-MEM-${nextId}`,
      type: formType as any,
      email: formEmail,
      phone: formPhone || undefined,
      maxBooks: selectedTypeConfig ? selectedTypeConfig.max : 3,
      activeLoansCount: 0
    };

    onAddMember(newMember);
    sound.playSuccessChime();
    setIsAddModalOpen(false);
    
    // reset form
    setFormName('');
    setFormType('Mahasiswa');
    setFormEmail('');
    setFormPhone('');
  };

  const handleViewCard = (member: Member) => {
    setSelectedMember(member);
    setIsCardModalOpen(true);
  };

  const handleToggleStatus = (member: Member) => {
    onToggleMemberStatus(member.id);
    sound.playTapConfirm();
  };

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600 animate-pulse-soft" />
            Manajemen Keanggotaan & Data Sekolah
          </h2>
          <p className="text-xs text-slate-400">
            Kelola data siswa, rombel kelas, serta direktori seluruh anggota perpustakaan SMAN 1 Lumbung.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveSubTab('siswa')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'siswa'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="h-4 w-4 text-teal-600" />
            Data Siswa
          </button>

          <button
            onClick={() => setActiveSubTab('kelas')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'kelas'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4 text-blue-600" />
            Data Kelas
          </button>

          <button
            onClick={() => setActiveSubTab('semua')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'semua'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="h-4 w-4 text-purple-600" />
            Semua Anggota
          </button>
        </div>
      </div>

      {activeSubTab === 'siswa' && (
        <DataSiswa
          siswa={siswaList}
          kelasList={kelasList}
          onAddSiswa={onAddSiswa}
          onBulkAddSiswa={onBulkAddSiswa}
          onEditSiswa={onEditSiswa}
          onDeleteSiswa={onDeleteSiswa}
          onToggleStatus={(id) => {}}
          isActionAllowed={isActionAllowed}
        />
      )}

      {activeSubTab === 'kelas' && (
        <DataKelas
          kelas={kelasList}
          onAddKelas={onAddKelas}
          onEditKelas={onEditKelas}
          onDeleteKelas={onDeleteKelas}
          isActionAllowed={isActionAllowed}
        />
      )}

      {activeSubTab === 'semua' && (
        <div className="space-y-6">
          {/* Search and Action Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari anggota berdasarkan nama, ID, email, RFID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {canEdit ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Tambah Anggota Baru
            </button>
          ) : (
            <span className="text-slate-400 text-xs bg-slate-100 border border-slate-200 rounded-md px-3 py-2 font-medium italic">
              🔒 Hak tambah anggota dikunci
            </span>
          )}
        </div>
      </div>

      {/* Data Table of Members */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No.</th>
                <th className="py-3.5 px-4 w-24">ID Anggota</th>
                <th className="py-3.5 px-4">Nama & Email</th>
                <th className="py-3.5 px-4">Tipe</th>
                <th className="py-3.5 px-4 text-center">RFID Card ID</th>
                <th className="py-3.5 px-4">Telepon</th>
                <th className="py-3.5 px-4 text-center">Pinjaman (Aktif/Maks)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right w-52">Aksi Administrasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedMembers.map((member, index) => {
                const isSuspended = member.status === 'Ditangguhkan';
                
                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Index Number */}
                    <td className="py-3 px-4 font-mono text-slate-400 text-center tabular-nums">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    {/* Member ID */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">
                      {member.id}
                    </td>

                    {/* Name & Email block */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 text-xs shrink-0">
                          {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-bold text-slate-800 block truncate">{member.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{member.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Member Type */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-medium">
                      {member.type}
                    </td>

                    {/* RFID Card ID badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold tracking-wider text-teal-800 bg-teal-50 border border-teal-100/50 rounded px-1.5 py-0.5 uppercase">
                        {member.rfidCard}
                      </span>
                    </td>

                    {/* Phone Number */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {member.phone || '-'}
                    </td>

                    {/* Active loans ratio with small progress gauge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center gap-1 w-24">
                        <span className="font-mono font-bold tracking-tight text-slate-700">
                          {member.activeLoansCount} / {member.maxBooks}
                        </span>
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              member.activeLoansCount >= member.maxBooks 
                                ? 'bg-amber-500' 
                                : 'bg-teal-600'
                            }`}
                            style={{ width: `${(member.activeLoansCount / member.maxBooks) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isSuspended 
                          ? 'bg-rose-50 text-rose-700 animate-pulse-soft' 
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {member.status}
                      </span>
                    </td>

                     {/* Administrative Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit ? (
                          <button
                            onClick={() => handleToggleStatus(member)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                              isSuspended
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                            }`}
                            title={isSuspended ? 'Aktifkan Kembali Anggota' : 'Tangguhkan Keanggotaan'}
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {isSuspended ? 'Aktifkan' : 'Freeze'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic select-none">
                            🔒 Terkunci
                          </span>
                        )}

                        <button
                          onClick={() => handleViewCard(member)}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 text-[10px] font-bold text-teal-700 transition-colors cursor-pointer"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Kartu RFID
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <Users className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-400">Tidak ada anggota yang ditemukan.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
            >
              Daftarkan Anggota Baru Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm text-xs">
          <span className="text-slate-500">
            Menampilkan <span className="font-semibold text-slate-800 font-mono">{(currentPage - 1) * itemsPerPage + 1}</span> sampai{' '}
            <span className="font-semibold text-slate-800 font-mono">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> dari{' '}
            <span className="font-semibold text-slate-800 font-mono">{filteredMembers.length}</span> anggota terdaftar
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

      {/* MODAL: Tambah Anggota */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Registrasi Anggota Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Budi Santoso"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipe Anggota & Limit</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                >
                  {MEMBER_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Civitas *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. budi@univ.ac.id"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nomor Telepon</label>
                <input
                  type="tel"
                  placeholder="e.g. 0812-..."
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] text-slate-400 leading-normal">
                Sistem akan secara otomatis menyinkronkan kartu RFID Anggota baru dengan kode unik <span className="font-mono font-semibold text-slate-600 bg-white border border-slate-200 rounded px-1">RFID-MEM-A[Nomor]</span> setelah pendaftaran berhasil.
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
                  Daftarkan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Virtual RFID Smart Card Showcase */}
      {isCardModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-bold text-slate-800">Cetak Kartu RFID Anggota</span>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-center">
              {/* Virtual Smart Card Container */}
              <div className="relative aspect-[1.586/1] w-full rounded-2xl bg-gradient-to-tr from-slate-900 via-teal-950 to-slate-900 text-slate-100 shadow-xl border border-slate-800 text-left p-5 overflow-hidden flex flex-col justify-between">
                {/* Header elements */}
                <div className="flex justify-between items-start z-10">
                  <div className="space-y-0.5">
                    <span className="block text-[9px] font-extrabold tracking-widest text-teal-400 uppercase">KARTU ANGGOTA</span>
                    <span className="block text-xs font-black font-display tracking-tight text-white">PUSTAKA DIGITAL</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1 py-0.5 rounded tracking-wide">RFID</span>
                    <div className="w-6 h-4 bg-amber-400/85 rounded-sm border border-amber-300 shadow-sm relative overflow-hidden flex flex-col justify-between p-0.5 opacity-90 shrink-0">
                      <div className="grid grid-cols-3 gap-0.5 h-full w-full opacity-60">
                        <div className="border border-slate-950/20"></div>
                        <div className="border border-slate-950/20 bg-amber-500"></div>
                        <div className="border border-slate-950/20"></div>
                        <div className="border border-slate-950/20 bg-amber-500"></div>
                        <div className="border border-slate-950/20"></div>
                        <div className="border border-slate-950/20 bg-amber-500"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile detail */}
                <div className="space-y-1.5 z-10">
                  <h4 className="text-sm font-bold text-white tracking-wide line-clamp-1">{selectedMember.name}</h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                    <div>
                      <span className="block text-[8px] text-slate-400 font-sans uppercase">TIPE / ID</span>
                      <span className="font-semibold">{selectedMember.type} / {selectedMember.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] text-slate-400 font-sans uppercase">RFID CODE</span>
                      <span className="font-semibold text-teal-400 tracking-wider">{selectedMember.rfidCard}</span>
                    </div>
                  </div>
                </div>

                {/* Card Background Watermark Graphics */}
                <div className="absolute right-[-20px] bottom-[-20px] opacity-15 pointer-events-none scale-125">
                  <Users className="h-40 w-40 text-teal-400" />
                </div>
                
                {/* Antenna lines simulation watermark */}
                <div className="absolute inset-0 border border-dashed border-teal-500/5 rounded-2xl pointer-events-none m-2"></div>
              </div>

              {/* Instructions and Meta */}
              <div className="space-y-2 text-left bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <div className="flex gap-2 items-start">
                  <Award className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-normal">
                    Kartu ini memiliki chip RFID pintar pasif nirkabel terenkripsi. Pada modul sirkulasi, Anda dapat mengklik tombol "Simulate RFID" untuk langsung mengisi identitas Budi atau Dosen Siti dalam formulir transaksi.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsCardModalOpen(false)}
                  className="w-full justify-center inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
export default Anggota;
