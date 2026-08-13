/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  UserPlus, 
  Pencil, 
  Trash2, 
  Lock, 
  X, 
  Eye, 
  EyeOff, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';
import { User as UserType, UserRole, TrustSettings } from '../types';

interface UserManagementModuleProps {
  appUsers: UserType[];
  currentUser: UserType | null;
  onAddUser: (newUser: Omit<UserType, 'id' | 'isActive'> & { isActive: boolean }) => void;
  onEditUser: (updatedUser: UserType) => void;
  onDeleteUser: (id: string) => void;
  darkMode: boolean;
  trustSettings?: TrustSettings;
}

export default function UserManagementModule({
  appUsers,
  currentUser,
  onAddUser,
  onEditUser,
  onDeleteUser,
  darkMode,
  trustSettings
}: UserManagementModuleProps) {
  const currentTrust = (currentUser?.trustNameGuj || trustSettings?.trustNameGuj || '').trim();
  const rawFiltered = appUsers.filter(u => {
    const uTrust = (u.trustNameGuj || '').trim();
    return currentTrust ? uTrust === currentTrust : true;
  });

  // Deduplicate users per trust so there is strictly ONLY ONE user per username (e.g., only 1 admin)
  const filteredUsers = rawFiltered.reduce<UserType[]>((acc, u) => {
    const existingIdx = acc.findIndex(ex => ex.username.toLowerCase() === u.username.toLowerCase());
    if (existingIdx === -1) {
      acc.push(u);
    } else {
      // If the incoming user is vendor registered or custom, prioritize it over default
      if (u.isVendorRegistered || (!u.id.startsWith('usr1') && acc[existingIdx].id.startsWith('usr1'))) {
        acc[existingIdx] = u;
      }
    }
    return acc;
  }, []);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  // Form states (Add)
  const [addUsername, setAddUsername] = useState('');
  const [addNameGuj, setAddNameGuj] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('DataEntry');
  const [addPassword, setAddPassword] = useState('');
  const [addIsActive, setAddIsActive] = useState(true);
  const [addError, setAddError] = useState('');

  // Form states (Edit)
  const [editUsername, setEditUsername] = useState('');
  const [editNameGuj, setEditNameGuj] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('DataEntry');
  const [editPassword, setEditPassword] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState('');

  // Password visibility states per user
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const tableHeaderBg = darkMode ? 'bg-slate-800/60 text-slate-200' : 'bg-slate-50 text-slate-600';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const inputBg = darkMode ? 'bg-slate-850 border-slate-750 text-white placeholder-slate-500' : 'bg-white border-slate-250 text-slate-900 placeholder-slate-400';

  const roleLabels: Record<UserRole, string> = {
    Admin: 'પ્રશાસક (Administrator)',
    Accountant: 'નામું રાખનાર (Accountant)',
    DataEntry: 'ડેટા એન્ટ્રી ઓપરેટર (Data Entry)',
    ReadOnly: 'માત્ર વાંચવા માટે (Read Only)'
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900';
      case 'Accountant':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900';
      case 'DataEntry':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900';
      case 'ReadOnly':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleOpenAddModal = () => {
    setAddUsername('');
    setAddNameGuj('');
    setAddRole('DataEntry');
    setAddPassword('');
    setAddIsActive(true);
    setAddError('');
    setShowAddModal(true);
  };

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    const trimmedUsername = addUsername.trim().toLowerCase();
    const trimmedName = addNameGuj.trim();
    const trimmedPassword = addPassword.trim();

    if (!trimmedUsername || !trimmedName || !trimmedPassword) {
      setAddError('મહેરબાની કરીને તમામ વિગતો ભરો. (Please fill all fields.)');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      setAddError('વપરાશકર્તા આઈડી અંગ્રેજી અક્ષરો અને આંકડામાં જ હોવું જોઈએ. (Username must be alphanumeric.)');
      return;
    }

    // Check if duplicate username
    const exists = filteredUsers.some(u => u.username.toLowerCase() === trimmedUsername);
    if (exists) {
      setAddError('આ વપરાશકર્તા આઈડી પહેલેથી જ નોંધાયેલ છે. (Username already exists.)');
      return;
    }

    onAddUser({
      username: trimmedUsername,
      nameGuj: trimmedName,
      role: addRole,
      roleGuj: roleLabels[addRole],
      passwordHash: trimmedPassword,
      isActive: addIsActive,
      trustNameGuj: currentTrust
    });

    setShowAddModal(false);
  };

  const handleOpenEditModal = (user: UserType) => {
    setSelectedUser(user);
    setEditUsername(user.username);
    setEditNameGuj(user.nameGuj);
    setEditRole(user.role);
    setEditPassword(user.passwordHash);
    setEditIsActive(user.isActive);
    setEditError('');
    setShowEditModal(true);
  };

  const handleConfirmEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError('');

    const trimmedUsername = editUsername.trim().toLowerCase();
    const trimmedName = editNameGuj.trim();
    const trimmedPassword = editPassword.trim();

    if (!trimmedUsername || !trimmedName || !trimmedPassword) {
      setEditError('મહેરબાની કરીને તમામ વિગતો ભરો. (Please fill all fields.)');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      setEditError('વપરાશકર્તા આઈડી અંગ્રેજી અક્ષરો અને આંકડામાં જ હોવું જોઈએ. (Username must be alphanumeric.)');
      return;
    }

    // Check if duplicate username in other users
    const exists = filteredUsers.some(u => u.id !== selectedUser.id && u.username.toLowerCase() === trimmedUsername);
    if (exists) {
      setEditError('આ વપરાશકર્તા આઈડી પહેલેથી જ નોંધાયેલ છે. (Username already exists.)');
      return;
    }

    // Guard: Prevent logged in admin from changing their own role to non-admin or deactivating themselves
    if (currentUser && currentUser.id === selectedUser.id) {
      if (editRole !== 'Admin') {
        setEditError('તમે તમારી પોતાની ભૂમિકા (Role) પ્રશાસક (Admin) માંથી બદલી શકતા નથી.');
        return;
      }
      if (!editIsActive) {
        setEditError('તમે તમારું પોતાનું ખાતું નિષ્ક્રિય (Inactive) કરી શકતા નથી.');
        return;
      }
    }

    onEditUser({
      ...selectedUser,
      username: trimmedUsername,
      nameGuj: trimmedName,
      role: editRole,
      roleGuj: roleLabels[editRole],
      passwordHash: trimmedPassword,
      isActive: editIsActive,
      trustNameGuj: selectedUser.trustNameGuj || currentTrust
    });

    setShowEditModal(false);
  };

  const handleDeleteClick = (user: UserType) => {
    // Guard: Prevent deleting oneself
    if (currentUser && currentUser.id === user.id) {
      alert('⚠️ તમે તમારું પોતાનું ચાલુ લોગિન ખાતું રદ કરી શકતા નથી!');
      return;
    }

    // Guard: Prevent deleting the main master admin 'admin' username
    if (user.username === 'admin') {
      alert('⚠️ મુખ્ય પ્રશાસક (Master Admin: admin) ખાતું રદ કરી શકાશે નહીં!');
      return;
    }

    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> વપરાશકર્તા અને ભૂમિકા વ્યવસ્થાપન (Role Based Access Control)
          </h2>
          <p className={`text-xs ${textMuted}`}>ટ્રસ્ટના એકાઉન્ટન્ટ, ડેટા ઓપરેટર અને નિરીક્ષકોના લોગિન આઈડી, પાસવર્ડ અને એક્સેસ કંટ્રોલ મેનેજમેન્ટ.</p>
        </div>
        
        {currentUser?.role === 'Admin' && (
          <button
            id="btn-add-new-user"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" /> + નવો વપરાશકર્તા ઉમેરો (Add User)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table/List of Users */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
          <h3 className="font-bold text-sm text-indigo-600 flex items-center gap-1.5 border-b pb-2">
            <ShieldCheck className="w-4 h-4" /> તમામ રજિસ્ટર્ડ વપરાશકર્તાઓ (Users Directory)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b border-slate-100 dark:border-slate-800 font-bold ${tableHeaderBg}`}>
                  <th className="p-3">નામ (Name)</th>
                  <th className="p-3">યુઝર આઈડી (ID)</th>
                  <th className="p-3">ભૂમિકા (Access Role)</th>
                  <th className="p-3">પાસવર્ડ (Password)</th>
                  <th className="p-3 text-center">સ્થિતિ (Status)</th>
                  {currentUser?.role === 'Admin' && <th className="p-3 text-right">ક્રિયાઓ (Actions)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map(user => {
                  const isVisible = visiblePasswords[user.id] || false;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-all">
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-150">
                        {user.nameGuj}
                        {currentUser?.id === user.id && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-md text-[9px] font-medium border border-slate-200 dark:border-slate-700">
                            તમે (You)
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {user.username}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getRoleBadgeStyle(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-600 dark:text-slate-400">
                            {isVisible ? user.passwordHash : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                            title={isVisible ? 'પાસવર્ડ છુપાવો' : 'પાસવર્ડ બતાવો'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.isActive 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300'
                        }`}>
                          {user.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {user.isActive ? 'સક્રિય' : 'નિષ્ક્રિય'}
                        </span>
                      </td>
                      {currentUser?.role === 'Admin' && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(user)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-900 cursor-pointer"
                              title="સુધારો કરો (Edit User)"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={currentUser?.id === user.id || user.username === 'admin'}
                              onClick={() => handleDeleteClick(user)}
                              className={`p-1.5 rounded-lg border cursor-pointer ${
                                currentUser?.id === user.id || user.username === 'admin'
                                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 border-slate-200 dark:border-slate-700'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                              }`}
                              title="ખાતું રદ કરો (Delete User)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Permissions & Information Matrix */}
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
            <h3 className="font-bold text-sm text-indigo-600 flex items-center gap-1.5 border-b pb-2">
              <Shield className="w-4 h-4" /> એક્સેસ પરમિશન મેટ્રિક્સ (Access Permissions Matrix)
            </h3>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <div className="space-y-2">
                <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-1">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    🛡️ Admin (પ્રશાસક)
                  </span>
                  <p className="text-[11px]">
                    ટ્રસ્ટના તમામ મોડ્યુલ પર પૂર્ણ નિયંત્રણ. હિસાબો લખવા, સભ્યો/દસ્તાવેજો મેનેજ કરવા, સેટિંગ્સ બદલવા, બેકઅપ અને વપરાશકર્તા સંચાલન બધી પરવાનગીઓ ઉપલબ્ધ છે.
                  </p>
                </div>

                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-1">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    💼 Accountant (એકાઉન્ટન્ટ)
                  </span>
                  <p className="text-[11px]">
                    આવક રસીદ ઉમેરવી, ખર્ચ વાઉચર બનાવવું, બેંક ખાતા સુધારવા, બેલેન્સશીટ અને તમામ અહેવાલો જોવા. પરંતુ તે લાયસન્સ, સેટિંગ્સ, ડેટા રીસેટ કે યુઝર મેનેજમેન્ટ કરી શકશે નહીં.
                  </p>
                </div>

                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1">
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    ⌨️ DataEntry (ડેટા એન્ટ્રી)
                  </span>
                  <p className="text-[11px]">
                    આવક અને ખર્ચની માત્ર નવી એન્ટ્રી કરવી (બનાવવી). તે કોઈ પણ ભૂતકાળના રેકોર્ડને એડિટ/ડિલીટ કરી શકશે નહીં. હિસાબી પત્રકો કે સેટિંગ્સના પેજ દેખાશે નહીં.
                  </p>
                </div>

                <div className="p-3 bg-slate-500/5 rounded-xl border border-slate-500/10 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    👁️ ReadOnly (માત્ર નિરીક્ષક)
                  </span>
                  <p className="text-[11px]">
                    ડેશબોર્ડ, રિપોર્ટ અને હિસાબો ફક્ત જોઈ શકશે (Read-Only). કોઈ નવો ડેટા ઉમેરી, સુધારી કે કાઢી શકશે નહીં. માત્ર ઓડિટ અથવા મોનિટરિંગ માટે ઉપયોગી.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex gap-2 text-[10px] text-amber-800 dark:text-amber-300">
                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong>સુરક્ષા નિયમ:</strong> સુરક્ષા કારણોસર, જ્યારે પણ કોઈ યુઝર લોગિન કરશે, ત્યારે તેના દ્વારા કરાયેલ તમામ ક્રિયાઓ (જેમ કે રસીદ બનાવવી, રીસેટ કરવું) <strong>SQLite ઓડિટ ટ્રેલ લોગ</strong> માં આપોઆપ તેના યુઝરનેમ સાથે નોંધાય છે.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-2xl border ${cardBg} shadow-xl space-y-4 relative`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black">નવો વપરાશકર્તા ઉમેરો (Add New User)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmAdd} className="space-y-4 text-xs">
                {/* Full Name in Gujarati */}
                <div className="space-y-1.5">
                  <label className="block font-bold">પુરુ નામ (ગુજરાતીમાં) (Full Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="દા.ત. અશોકભાઈ જોશી (મંત્રી)"
                    value={addNameGuj}
                    onChange={(e) => setAddNameGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputBg}`}
                  />
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block font-bold">લોગિન વપરાશકર્તા આઈડી (ID - English only) *</label>
                  <input
                    type="text"
                    required
                    placeholder="દા.ત. ashok_joshi"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${inputBg}`}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block font-bold">ગુપ્ત પાસવર્ડ (Secure Password) *</label>
                  <input
                    type="text"
                    required
                    placeholder="લોગિન પાસવર્ડ લખો"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value.replace(/\s+/g, ''))}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${inputBg}`}
                  />
                </div>

                {/* Access Role */}
                <div className="space-y-1.5">
                  <label className="block font-bold">લોગિન ભૂમિકા (Access Privilege) *</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as UserRole)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputBg}`}
                  >
                    <option value="Admin">🛡️ Admin - પ્રશાસક (પૂર્ણ નિયંત્રણ)</option>
                    <option value="Accountant">💼 Accountant - એકાઉન્ટન્ટ (હિસાબ અને અહેવાલો)</option>
                    <option value="DataEntry">⌨️ DataEntry - ડેટા એન્ટ્રી ઓપરેટર (માત્ર નવી પાવતી/વાઉચર)</option>
                    <option value="ReadOnly">👁️ ReadOnly - નિરીક્ષક (માત્ર જોવા માટે)</option>
                  </select>
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <span className="font-bold text-slate-700 dark:text-slate-300">ખાતું સક્રિય રાખવું? (Is Active)</span>
                  <input
                    type="checkbox"
                    checked={addIsActive}
                    onChange={(e) => setAddIsActive(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </div>

                {addError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl font-bold border border-rose-200 dark:border-rose-900">
                    {addError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    રદ કરો (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                  >
                    ✓ સેવ કરો (Add User)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-2xl border ${cardBg} shadow-xl space-y-4 relative`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black">વપરાશકર્તા વિગત સુધારો (Edit User Details)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmEdit} className="space-y-4 text-xs">
                {/* Full Name in Gujarati */}
                <div className="space-y-1.5">
                  <label className="block font-bold">પુરુ નામ (ગુજરાતીમાં) (Full Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="દા.ત. અશોકભાઈ જોશી (મંત્રી)"
                    value={editNameGuj}
                    onChange={(e) => setEditNameGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputBg}`}
                  />
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block font-bold">લોગિન વપરાશકર્તા આઈડી (ID) *</label>
                  <input
                    type="text"
                    required
                    disabled={selectedUser.username === 'admin'}
                    placeholder="દા.ત. ashok_joshi"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono disabled:opacity-50 ${inputBg}`}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block font-bold">ગુપ્ત પાસવર્ડ (Secure Password) *</label>
                  <input
                    type="text"
                    required
                    placeholder="લોગિન પાસવર્ડ લખો"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value.replace(/\s+/g, ''))}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${inputBg}`}
                  />
                </div>

                {/* Access Role */}
                <div className="space-y-1.5">
                  <label className="block font-bold">લોગિન ભૂમિકા (Access Privilege) *</label>
                  <select
                    value={editRole}
                    disabled={currentUser?.id === selectedUser.id && currentUser?.role === 'Admin'}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${inputBg}`}
                  >
                    <option value="Admin">🛡️ Admin - પ્રશાસક (પૂર્ણ નિયંત્રણ)</option>
                    <option value="Accountant">💼 Accountant - એકાઉન્ટન્ટ (હિસાબ અને અહેવાલો)</option>
                    <option value="DataEntry">⌨️ DataEntry - ડેટા એન્ટ્રી ઓપરેટર (માત્ર નવી પાવતી/વાઉચર)</option>
                    <option value="ReadOnly">👁️ ReadOnly - નિરીક્ષક (માત્ર જોવા માટે)</option>
                  </select>
                  {currentUser?.id === selectedUser.id && currentUser?.role === 'Admin' && (
                    <span className="text-[10px] text-amber-600 block mt-1 font-bold">
                      ⚠️ સુરક્ષા માટે તમે તમારો પોતાનો પ્રશાસક હોદ્દો બદલી શકતા નથી.
                    </span>
                  )}
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <span className="font-bold text-slate-700 dark:text-slate-300">ખાતું સક્રિય રાખવું? (Is Active)</span>
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    disabled={currentUser?.id === selectedUser.id}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded disabled:opacity-50"
                  />
                </div>
                {currentUser?.id === selectedUser.id && (
                  <span className="text-[10px] text-amber-600 block mt-1 font-bold">
                    ⚠️ સુરક્ષા માટે તમે પોતાનું ચાલુ ખાતું નિષ્ક્રિય કરી શકતા નથી.
                  </span>
                )}

                {editError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl font-bold border border-rose-200 dark:border-rose-900">
                    {editError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    રદ કરો (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                  >
                    ✓ ફેરફાર સાચવો (Save Changes)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-2xl border ${cardBg} shadow-xl space-y-4 relative`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h3 className="text-sm font-black text-rose-600">વપરાશકર્તા રદ કરવાની ખાતરી (Delete User)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 py-2 text-xs">
                <p className="text-sm font-medium">
                  શું તમે ખરેખર વપરાશકર્તા <strong className="text-indigo-600 dark:text-indigo-400">"{userToDelete.nameGuj}"</strong> (યુઝર આઈડી: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">{userToDelete.username}</code>) નું લોગિન ખાતું કાયમ માટે રદ કરવા માંગો છો?
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  નોંધ: આ વપરાશકર્તા પછીથી સિસ્ટમમાં પ્રવેશ (Login) કરી શકશે નહીં. આ પ્રક્રિયા અપરિવર્તનીય (irreversible) છે.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
                >
                  રદ કરો (Cancel)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteUser(userToDelete.id);
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> હા, રદ કરો (Delete)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
