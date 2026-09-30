import React, { useState, useEffect } from 'react';
import { UserRole, StaffRole, RolePermissions, UserAccount } from '../types/library';
import { getUsers, saveUsers } from '../utils/initialData';
import { api } from '../utils/api';
import sound from '../utils/audio';
import { 
  Search, 
  Plus, 
  X, 
  UserCheck, 
  Shield, 
  Mail, 
  UserX, 
  Trash2, 
  Edit2, 
  Sliders,
  CheckCircle,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Key,
  Info,
  CreditCard,
  Sparkles,
  Users
} from 'lucide-react';

const MENUS = [
  { id: 'dashboard', name: 'Dashboard Ringkasan' },
  { id: 'sirkulasi_peminjaman', name: 'Sirkulasi: Peminjaman Buku' },
  { id: 'sirkulasi_pengembalian', name: 'Sirkulasi: Pengembalian Buku' },
  { id: 'katalog', name: 'Katalog Buku & QR' },
  { id: 'manajemen_buku', name: 'Manajemen Buku (Admin)' },
  { id: 'anggota', name: 'Kelola Anggota' },
  { id: 'manajemen_pengguna', name: 'Kelola Pengguna (Pengelola)' },
  { id: 'riwayat', name: 'Riwayat Transaksi' },
];

const ACTIONS = [
  { id: 'edit_buku', name: 'Tambah/Edit Inventaris Buku' },
  { id: 'hapus_buku', name: 'Hapus Inventaris Buku' },
  { id: 'edit_anggota', name: 'Tambah/Edit Keanggotaan' },
  { id: 'proses_peminjaman', name: 'Proses Transaksi Keluar Buku (Borrow)' },
  { id: 'proses_pengembalian', name: 'Proses Transaksi Masuk Buku (Return)' },
  { id: 'unduh_laporan', name: 'Unduh Ekspor Laporan & Riwayat' },
];

const PENGELOLA_ROLES: StaffRole[] = ['Admin', 'Petugas Perpus', 'Guru', 'Kepsek'];
const ALL_RBAC_ROLES: UserRole[] = ['Admin', 'Petugas Perpus', 'Guru', 'Kepsek', 'Siswa'];

interface ManajemenPenggunaProps {
  rolePermissions: RolePermissions[];
  onUpdatePermissions: (newPerms: RolePermissions[]) => void;
}

export const ManajemenPengguna: React.FC<ManajemenPenggunaProps> = ({
  rolePermissions,
  onUpdatePermissions,
}) => {
  // Load users from storage / API
  const [users, setUsers] = useState<UserAccount[]>(() => getUsers());
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'rbac'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('Semua');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10); // Default 10 data per page

  // Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formRole, setFormRole] = useState<StaffRole>('Petugas Perpus');
  const [formRfid, setFormRfid] = useState('');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  // Load from API on mount
  useEffect(() => {
    const fetchLiveUsers = async () => {
      try {
        const liveUsers = await api.getUsers();
        if (liveUsers && liveUsers.length > 0) {
          // Filter out any siswa if accidentally present in users table
          const pengelolaOnly = liveUsers.filter((u: any) => u.role !== 'Siswa');
          setUsers(pengelolaOnly);
          saveUsers(pengelolaOnly);
        }
      } catch (err) {
        console.warn('Fallback to local users:', err);
      }
    };
    fetchLiveUsers();
  }, []);

  const saveUsersToStorage = (updatedUsers: UserAccount[]) => {
    const pengelolaOnly = updatedUsers.filter(u => u.role !== 'Siswa');
    setUsers(pengelolaOnly);
    saveUsers(pengelolaOnly);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.rfidCard || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'Semua' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  // Reset pagination page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, users.length]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    const nextId = `U${String(users.length + 1).padStart(3, '0')}`;
    setFormId(nextId);
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('Petugas Perpus');
    setFormRfid(`RFID-STF-${String(users.length + 1).padStart(3, '0')}`);
    setFormStatus('Aktif');
    
    setIsEditing(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setSelectedUser(user);
    setFormId(user.id);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email || '');
    setFormPassword(user.password || '');
    setFormRole(user.role === 'Siswa' ? 'Petugas Perpus' : (user.role as StaffRole));
    setFormRfid(user.rfidCard || '');
    setFormStatus(user.status);

    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formName.trim() || !formUsername.trim()) {
      sound.playErrorBuzz();
      alert('Nama Lengkap dan Username pengelola wajib diisi!');
      return;
    }

    const userData: UserAccount = {
      id: formId,
      name: formName.trim(),
      username: formUsername.toLowerCase().replace(/\s+/g, ''),
      email: formEmail.trim() || undefined,
      password: formPassword || 'admin123',
      role: formRole,
      rfidCard: formRfid.trim() || undefined,
      status: formStatus,
      createdAt: isEditing && selectedUser ? selectedUser.createdAt : new Date().toISOString().split('T')[0]
    };

    let updatedList: UserAccount[];
    if (isEditing) {
      updatedList = users.map(u => u.id === userData.id ? userData : u);
      api.updateUser(userData).catch(err => console.warn('API sync warning:', err));
    } else {
      updatedList = [userData, ...users];
      api.saveUser(userData).catch(err => console.warn('API sync warning:', err));
    }

    sound.playSuccessChime();
    saveUsersToStorage(updatedList);
    setIsAddModalOpen(false);
  };

  const handleToggleStatus = (user: UserAccount) => {
    if (user.id === 'U001') {
      sound.playErrorBuzz();
      alert('Akses Ditolak: Anda tidak dapat menonaktifkan akun Super Admin utama!');
      return;
    }

    const nextStatus = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const updatedUser = { ...user, status: nextStatus as any };

    const updatedList = users.map(u => u.id === user.id ? updatedUser : u);
    saveUsersToStorage(updatedList);
    api.updateUser(updatedUser).catch(err => console.warn('API sync warning:', err));
    sound.playTapConfirm();
  };

  const handleDeleteRequest = (user: UserAccount) => {
    if (user.id === 'U001') {
      sound.playErrorBuzz();
      alert('Akses Ditolak: Akun Super Admin utama sistem tidak boleh dihapus!');
      return;
    }
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      const updatedList = users.filter(u => u.id !== selectedUser.id);
      saveUsersToStorage(updatedList);
      api.deleteUser(selectedUser.id).catch(err => console.warn('API sync warning:', err));
      sound.playSuccessChime();
      setIsDeleteConfirmOpen(false);
      setSelectedUser(null);
    }
  };

  // Toggle dynamic permissions inside our JSON RBAC matrix
  const handleToggleMenuPermission = (role: UserRole, menuId: string) => {
    if (role === 'Admin') return; // Admin has permanent access

    const updated = rolePermissions.map(rp => {
      if (rp.role === role) {
        const allowed = rp.allowedMenus.includes(menuId);
        return {
          ...rp,
          allowedMenus: allowed
            ? rp.allowedMenus.filter(id => id !== menuId)
            : [...rp.allowedMenus, menuId]
        };
      }
      return rp;
    });

    onUpdatePermissions(updated);
  };

  const handleToggleActionPermission = (role: UserRole, actionId: string) => {
    if (role === 'Admin') return; // Admin has permanent access

    const updated = rolePermissions.map(rp => {
      if (rp.role === role) {
        const allowed = rp.allowedActions.includes(actionId);
        return {
          ...rp,
          allowedActions: allowed
            ? rp.allowedActions.filter(id => id !== actionId)
            : [...rp.allowedActions, actionId]
        };
      }
      return rp;
    });

    onUpdatePermissions(updated);
  };

  return (
    <div className="space-y-5">
      
      {/* Editorial Title lockup */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-4.5 rounded-xl shadow-2xs">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-4.5 w-4.5 text-teal-600 animate-pulse-soft" />
            Kelola Pengguna Sistem (Khusus Pengelola)
          </h2>
          <p className="text-xs text-slate-500">
            Akun operasional staf, pustakawan, guru, dan kepala sekolah. Data siswa dikelola terpisah pada modul Data Siswa.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/70 shrink-0">
          <button
            onClick={() => {
              setActiveSubTab('users');
              sound.playTapConfirm();
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Daftar Pengelola
          </button>
          <button
            onClick={() => {
              setActiveSubTab('rbac');
              sound.playTapConfirm();
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'rbac'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Matriks Hak Akses (RBAC)
          </button>
        </div>
      </div>

      {/* CASE 1: OPERATOR LIST TAB */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Informational Banner */}
          <div className="bg-teal-50/70 border border-teal-200/70 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-teal-900">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-teal-600 shrink-0" />
              <span>
                <strong>Pemisahan Data Siswa & Pengelola:</strong> Menu ini hanya untuk akun pengelola (<strong>Admin, Petugas Perpus, Guru, Kepsek</strong>). Data dan kredensial login Siswa dikelola secara mandiri di menu <strong>Data Siswa (tabel students)</strong>.
              </span>
            </div>
          </div>

          {/* Database Search Filter Grid */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pengelola berdasarkan nama, username, email, RFID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg overflow-x-auto border border-slate-200/60">
                {['Semua', ...PENGELOLA_ROLES].map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      setSelectedRole(role);
                      sound.playTapConfirm();
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      selectedRole === role ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white px-3 py-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Pengelola
              </button>
            </div>
          </div>

          {/* Table grid */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3.5 w-10 text-center">No.</th>
                    <th className="py-2.5 px-3.5 w-20">ID Pengelola</th>
                    <th className="py-2.5 px-3.5">Nama Pengelola</th>
                    <th className="py-2.5 px-3.5">Username</th>
                    <th className="py-2.5 px-3.5">Peran / Role</th>
                    <th className="py-2.5 px-3.5">Kartu RFID</th>
                    <th className="py-2.5 px-3.5">Tgl Terdaftar</th>
                    <th className="py-2.5 px-3.5 text-center">Status</th>
                    <th className="py-2.5 px-3.5 text-right w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada data pengelola yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => {
                      const isInactive = user.status === 'Nonaktif';
                      const isSuperAdmin = user.role === 'Admin';

                      return (
                        <tr key={`${user.id}-${user.username}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                          {/* Index */}
                          <td className="py-2.5 px-3.5 font-mono text-slate-400 text-center tabular-nums text-[11px]">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>

                          {/* ID */}
                          <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-600 whitespace-nowrap text-xs">
                            {user.id}
                          </td>

                          {/* Name & email lockup */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200 text-xs shrink-0">
                                {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                              <div className="overflow-hidden">
                                <span className="font-bold text-slate-800 block truncate text-xs">{user.name}</span>
                                <span className="text-[10px] text-slate-400 block truncate">{user.email || `${user.username}@sman1lumbung.sch.id`}</span>
                              </div>
                            </div>
                          </td>

                          {/* Username */}
                          <td className="py-2.5 px-3.5 font-mono text-slate-600 whitespace-nowrap text-xs">
                            @{user.username}
                          </td>

                          {/* Role */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              user.role === 'Admin' 
                                ? 'bg-purple-50 text-purple-700 border border-purple-200/60' 
                                : user.role === 'Petugas Perpus'
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                                  : user.role === 'Guru'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}>
                              {user.role}
                            </span>
                          </td>

                          {/* RFID Card */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            {user.rfidCard ? (
                              <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {user.rfidCard}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">- Belum ada -</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-2.5 px-3.5 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                            {user.createdAt}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isInactive 
                                ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {user.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleToggleStatus(user)}
                                disabled={user.id === 'U001'}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  user.id === 'U001'
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : isInactive
                                      ? 'text-emerald-500 hover:bg-emerald-50'
                                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title={isInactive ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
                              >
                                {isInactive ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                              </button>

                              <button
                                onClick={() => openEditModal(user)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Pengelola"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteRequest(user)}
                                disabled={user.id === 'U001'}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  user.id === 'U001'
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title="Hapus Pengelola"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 border-t border-slate-100 text-xs bg-slate-50/50">
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
                    className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                  >
                    <option value={5}>5 data</option>
                    <option value={10}>10 data</option>
                    <option value={20}>20 data</option>
                    <option value={50}>50 data</option>
                    <option value={100}>100 data</option>
                  </select>
                </div>
                <span className="text-slate-500">
                  Menampilkan <span className="font-semibold text-slate-800 font-mono">{filteredUsers.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</span> -{' '}
                  <span className="font-semibold text-slate-800 font-mono">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> dari{' '}
                  <span className="font-semibold text-slate-800 font-mono">{filteredUsers.length}</span> pengelola
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCurrentPage(p => Math.max(1, p - 1));
                      sound.playTapConfirm();
                    }}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors shadow-2xs"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentPage(i + 1);
                        sound.playTapConfirm();
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                        currentPage === i + 1
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'border border-slate-200 text-slate-600 hover:bg-white bg-slate-50/50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                      sound.playTapConfirm();
                    }}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors shadow-2xs"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CASE 2: ACCESS MATRIX TAB (RBAC CONFIGURATOR) */}
      {activeSubTab === 'rbac' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 flex gap-2.5 text-xs leading-relaxed text-amber-900">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Konfigurator Hak Akses Dinamis:</span> Atur izin akses menu dan aksi untuk seluruh peran (<strong>Admin</strong>, <strong>Petugas Perpus</strong>, <strong>Guru</strong>, <strong>Kepsek</strong>, <strong>Siswa</strong>). Akun bertipe <strong>Admin</strong> memiliki otorisasi penuh secara mutlak.
            </div>
          </div>

          {/* MENUS AUTHORIZATION MATRIX */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden space-y-3 p-4">
            <div className="border-b pb-2 flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-400" />
              <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wide">1. Otorisasi Visibilitas Menu Utama</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-3">Nama Modul / Menu</th>
                    {ALL_RBAC_ROLES.map(role => (
                      <th key={role} className="py-2 px-3 text-center w-24">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {MENUS.map(menu => (
                    <tr key={menu.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {menu.name}
                        <span className="block text-[9px] font-mono text-slate-400 font-normal">ID: {menu.id}</span>
                      </td>
                      {ALL_RBAC_ROLES.map(role => {
                        const rp = rolePermissions.find(p => p.role === role);
                        const isAllowed = rp?.allowedMenus.includes(menu.id) || role === 'Admin';
                        const isAdmin = role === 'Admin';

                        return (
                          <td key={role} className="py-2.5 px-3 text-center">
                            <label className="inline-flex items-center justify-center p-1 cursor-pointer rounded-md hover:bg-slate-100/60">
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                disabled={isAdmin}
                                onChange={() => handleToggleMenuPermission(role, menu.id)}
                                className={`h-3.5 w-3.5 rounded border-slate-300 focus:ring-teal-500 ${
                                  isAdmin 
                                    ? 'text-slate-300 cursor-not-allowed opacity-60' 
                                    : 'text-teal-600 cursor-pointer'
                                }`}
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ACTIONS AUTHORIZATION MATRIX */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden space-y-3 p-4">
            <div className="border-b pb-2 flex items-center gap-2">
              <Key className="h-4 w-4 text-slate-400" />
              <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wide">2. Otorisasi Fungsi / Eksekusi Fitur</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-3">Kewenangan Fungsi</th>
                    {ALL_RBAC_ROLES.map(role => (
                      <th key={role} className="py-2 px-3 text-center w-24">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {ACTIONS.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {act.name}
                        <span className="block text-[9px] font-mono text-slate-400 font-normal">Action Key: {act.id}</span>
                      </td>
                      {ALL_RBAC_ROLES.map(role => {
                        const rp = rolePermissions.find(p => p.role === role);
                        const isAllowed = rp?.allowedActions.includes(act.id) || role === 'Admin';
                        const isAdmin = role === 'Admin';

                        return (
                          <td key={role} className="py-2.5 px-3 text-center">
                            <label className="inline-flex items-center justify-center p-1 cursor-pointer rounded-md hover:bg-slate-100/60">
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                disabled={isAdmin}
                                onChange={() => handleToggleActionPermission(role, act.id)}
                                className={`h-3.5 w-3.5 rounded border-slate-300 focus:ring-teal-500 ${
                                  isAdmin 
                                    ? 'text-slate-300 cursor-not-allowed opacity-60' 
                                    : 'text-teal-600 cursor-pointer'
                                }`}
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL: Tambah/Edit User Pengelola */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4.5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                {isEditing ? 'Ubah Data Pengelola' : 'Registrasi Pengelola Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-4.5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">ID Pengguna</label>
                  <input
                    type="text"
                    value={formId}
                    disabled
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Status Akun</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    disabled={formId === 'U001'}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Nama Lengkap Pengelola *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dewi Lestari, S.Pd."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Username Login *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                    <input
                      type="text"
                      required
                      placeholder="dewi.perpus"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Peran / Role Pengelola</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as StaffRole)}
                    disabled={formId === 'U001'}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer font-medium"
                  >
                    <option value="Petugas Perpus">📚 Petugas Perpus</option>
                    <option value="Guru">👨‍🏫 Guru</option>
                    <option value="Kepsek">🎓 Kepsek</option>
                    <option value="Admin">🔑 Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Nomor Kartu RFID Pengelola</label>
                <div className="relative">
                  <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. RFID-STF-001"
                    value={formRfid}
                    onChange={(e) => setFormRfid(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Email Resmi (Opsional)</label>
                  <input
                    type="email"
                    placeholder="e.g. dewi@sman1lumbung.sch.id"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Password / Kata Sandi</label>
                  <div className="relative">
                    <input
                      type={showFormPassword ? "text" : "password"}
                      placeholder="e.g. perpus123"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full px-3 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
                      title={showFormPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                    >
                      {showFormPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Daftarkan Pengelola'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus */}
      {isDeleteConfirmOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Hapus Akun Pengelola?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus akun pengelola <strong>{selectedUser.name}</strong> (@{selectedUser.username})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
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
export default ManajemenPengguna;
