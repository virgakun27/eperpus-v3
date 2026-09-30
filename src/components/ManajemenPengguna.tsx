import React, { useState, useEffect } from 'react';
import { UserRole, RolePermissions, UserAccount } from '../types/library';
import { getUsers, saveUsers } from '../utils/initialData';
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
  Info
} from 'lucide-react';

const MENUS = [
  { id: 'dashboard', name: 'Dashboard Ringkasan' },
  { id: 'sirkulasi_peminjaman', name: 'Sirkulasi: Peminjaman Buku' },
  { id: 'sirkulasi_pengembalian', name: 'Sirkulasi: Pengembalian Buku' },
  { id: 'katalog', name: 'Katalog Buku & QR' },
  { id: 'manajemen_buku', name: 'Manajemen Buku (Admin)' },
  { id: 'anggota', name: 'Kelola Anggota' },
  { id: 'manajemen_pengguna', name: 'Kelola Pengguna (Sistem)' },
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

const ROLES: UserRole[] = ['Admin', 'Guru', 'Siswa', 'Kepsek'];

interface ManajemenPenggunaProps {
  rolePermissions: RolePermissions[];
  onUpdatePermissions: (newPerms: RolePermissions[]) => void;
}

export const ManajemenPengguna: React.FC<ManajemenPenggunaProps> = ({
  rolePermissions,
  onUpdatePermissions,
}) => {
  // Load users from storage
  const [users, setUsers] = useState<UserAccount[]>(() => getUsers());

  const saveUsersToStorage = (updatedUsers: UserAccount[]) => {
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
  };

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
  const itemsPerPage = 5;

  // Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formRole, setFormRole] = useState<UserRole>('Siswa');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    setFormRole('Siswa');
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
    setFormRole(user.role);
    setFormStatus(user.status);

    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formName.trim() || !formUsername.trim()) {
      alert('Nama dan Username wajib diisi!');
      return;
    }

    const userData: UserAccount = {
      id: formId,
      name: formName,
      username: formUsername.toLowerCase().replace(/\s+/g, ''),
      email: formEmail || undefined,
      password: formPassword || 'admin123',
      role: formRole,
      status: formStatus,
      createdAt: isEditing && selectedUser ? selectedUser.createdAt : new Date().toISOString().split('T')[0]
    };

    let updatedList: UserAccount[];
    if (isEditing) {
      updatedList = users.map(u => u.id === userData.id ? userData : u);
    } else {
      updatedList = [userData, ...users];
    }

    saveUsersToStorage(updatedList);
    setIsAddModalOpen(false);
  };

  const handleToggleStatus = (user: UserAccount) => {
    if (user.id === 'U001') {
      alert('Akses Ditolak: Anda tidak dapat menonaktifkan akun Super Admin utama!');
      return;
    }

    const updatedList = users.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          status: u.status === 'Aktif' ? ('Nonaktif' as const) : ('Aktif' as const)
        };
      }
      return u;
    });
    saveUsersToStorage(updatedList);
  };

  const handleDeleteRequest = (user: UserAccount) => {
    if (user.id === 'U001') {
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
    <div className="space-y-6">
      
      {/* Editorial Title lockup */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600 animate-pulse-soft" />
            Keamanan Sistem & Hak Akses Pengguna
          </h2>
          <p className="text-xs text-slate-400">
            Kelola identitas operator Kiosk, registrasi admin, serta konfigurasikan matrik otorisasi peran (RBAC).
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Daftar Operator
          </button>
          <button
            onClick={() => setActiveSubTab('rbac')}
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
        <div className="space-y-6">
          <div className="bg-teal-50 border border-teal-100/80 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-teal-800">
            <div className="flex items-center gap-2.5">
              <Info className="h-4.5 w-4.5 text-teal-600 shrink-0" />
              <span>
                <strong>Pengelolaan Akun Siswa:</strong> Akun login & kata sandi siswa dikelola langsung melalui menu <strong className="text-teal-900 font-extrabold underline">Kelola Anggota → Data Siswa</strong> untuk mempermudah integrasi rombel kelas.
              </span>
            </div>
          </div>

          {/* Database Search Filter Grid */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari operator berdasarkan nama, username, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
                {['Semua', 'Admin', 'Guru', 'Siswa', 'Kepsek'].map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      selectedRole === role ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white px-3.5 py-2 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="h-4.5 w-4.5" />
                Tambah Operator
              </button>
            </div>
          </div>

          {/* Table grid */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">No.</th>
                    <th className="py-3.5 px-4 w-24">ID Operator</th>
                    <th className="py-3.5 px-4">Nama Lengkap</th>
                    <th className="py-3.5 px-4">Username</th>
                    <th className="py-3.5 px-4">Peran (Role)</th>
                    <th className="py-3.5 px-4">Tanggal Gabung</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right w-44">Aksi Administrasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedUsers.map((user, index) => {
                    const isInactive = user.status === 'Nonaktif';
                    const isSuperAdmin = user.role === 'Admin';

                    return (
                      <tr key={`${user.id}-${user.username}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                        {/* Index */}
                        <td className="py-3 px-4 font-mono text-slate-400 text-center tabular-nums">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>

                        {/* ID */}
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">
                          {user.id}
                        </td>

                        {/* Name & email lockup */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 text-xs shrink-0">
                              {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div className="overflow-hidden">
                              <span className="font-bold text-slate-800 block truncate">{user.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          @{user.username}
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            user.role === 'Admin' 
                              ? 'bg-purple-50 text-purple-700 border border-purple-100/50' 
                              : user.role === 'Guru'
                                ? 'bg-blue-50 text-blue-700 border border-blue-100/50'
                                : user.role === 'Kepsek'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100/50'
                                  : 'bg-teal-50 text-teal-700 border border-teal-100/50'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {user.createdAt}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isInactive 
                              ? 'bg-rose-50 text-rose-700' 
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {user.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={user.id === 'U001'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                user.id === 'U001'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : isInactive
                                    ? 'text-emerald-500 hover:bg-emerald-50'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={isInactive ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
                            >
                              {isInactive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            </button>

                            <button
                              onClick={() => openEditModal(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Edit User"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteRequest(user)}
                              disabled={user.id === 'U001'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                user.id === 'U001'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title="Hapus User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="py-16 text-center space-y-3">
                <Sliders className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-400">Tidak ada operator yang sesuai pencarian.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm text-xs">
              <span className="text-slate-500">
                Menampilkan <span className="font-semibold text-slate-800 font-mono">{(currentPage - 1) * itemsPerPage + 1}</span> sampai{' '}
                <span className="font-semibold text-slate-800 font-mono">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> dari{' '}
                <span className="font-semibold text-slate-800 font-mono">{filteredUsers.length}</span> operator terdaftar
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer font-semibold transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CASE 2: ACCESS MATRIX TAB (RBAC CONFIGURATOR) */}
      {activeSubTab === 'rbac' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-amber-800">
            <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Konfigurator Hak Akses Dinamis:</span> Berikan atau cabut izin akses menu dan tombol fungsional secara real-time untuk 4 kelompok peran civitas sekolah (**Admin**, **Guru**, **Siswa**, **Kepsek**). Akun bertipe **Admin** memiliki otorisasi penuh mutlak yang terkunci secara permanen demi keamanan administrasi.
            </div>
          </div>

          {/* MENUS AUTHORIZATION MATRIX */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
            <div className="border-b pb-2 flex items-center gap-2">
              <Eye className="h-4.5 w-4.5 text-slate-400" />
              <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wide">1. Otorisasi Visibilitas Menu Utama</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Nama Modul / Menu</th>
                    {ROLES.map(role => (
                      <th key={role} className="py-2.5 px-4 text-center w-28">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {MENUS.map(menu => (
                    <tr key={menu.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {menu.name}
                        <span className="block text-[9px] font-mono text-slate-400 font-normal">ID: {menu.id}</span>
                      </td>
                      {ROLES.map(role => {
                        const rp = rolePermissions.find(p => p.role === role);
                        const isAllowed = rp?.allowedMenus.includes(menu.id) || role === 'Admin';
                        const isAdmin = role === 'Admin';

                        return (
                          <td key={role} className="py-3 px-4 text-center">
                            <label className="inline-flex items-center justify-center p-1.5 cursor-pointer rounded-lg hover:bg-slate-100/50">
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                disabled={isAdmin}
                                onChange={() => handleToggleMenuPermission(role, menu.id)}
                                className={`h-4 w-4 rounded border-slate-300 focus:ring-teal-500 ${
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
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
            <div className="border-b pb-2 flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-slate-400" />
              <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wide">2. Otorisasi Fungsi / Eksekusi Fitur</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Kewenangan Fungsi</th>
                    {ROLES.map(role => (
                      <th key={role} className="py-2.5 px-4 text-center w-28">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {ACTIONS.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {act.name}
                        <span className="block text-[9px] font-mono text-slate-400 font-normal">Action Key: {act.id}</span>
                      </td>
                      {ROLES.map(role => {
                        const rp = rolePermissions.find(p => p.role === role);
                        const isAllowed = rp?.allowedActions.includes(act.id) || role === 'Admin';
                        const isAdmin = role === 'Admin';

                        return (
                          <td key={role} className="py-3 px-4 text-center">
                            <label className="inline-flex items-center justify-center p-1.5 cursor-pointer rounded-lg hover:bg-slate-100/50">
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                disabled={isAdmin}
                                onChange={() => handleToggleActionPermission(role, act.id)}
                                className={`h-4 w-4 rounded border-slate-300 focus:ring-teal-500 ${
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

      {/* MODAL: Tambah/Edit User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Ubah Record Pengguna' : 'Registrasi Operator Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ID Operator</label>
                  <input
                    type="text"
                    value={formId}
                    disabled
                    className="w-full p-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status Akun</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    disabled={formId === 'U001'}
                    className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Budi Santoso"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Username *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                    <input
                      type="text"
                      required
                      placeholder="budi.sirkulasi"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full pl-6 pr-2.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Peran Operator</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    disabled={formId === 'U001'}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="Siswa">🎒 Siswa</option>
                    <option value="Guru">👨‍🏫 Guru</option>
                    <option value="Kepsek">🎓 Kepsek</option>
                    <option value="Admin">🔑 Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Resmi (Opsional)</label>
                  <input
                    type="email"
                    placeholder="e.g. budi@pustaka.univ.ac.id"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password Baru / Kata Sandi</label>
                  <div className="relative">
                    <input
                      type={showFormPassword ? "text" : "password"}
                      placeholder="e.g. admin123"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full p-2.5 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md cursor-pointer"
                      title={showFormPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                    >
                      {showFormPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
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
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: Delete User */}
      {isDeleteConfirmOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 animate-bounce" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold text-slate-900">Konfirmasi Hapus Akun</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Apakah Anda yakin ingin menghapus akun operator <span className="font-bold text-slate-800">"{selectedUser.name}"</span>? Akun ini tidak akan bisa digunakan lagi untuk mengakses sistem sirkulasi.
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
                Ya, Hapus Operator
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default ManajemenPengguna;
