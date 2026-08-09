/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Award, Plus, Layers, Database, RefreshCw, Server, CheckCircle2, AlertTriangle, LogOut, ShieldCheck, Edit2, Trash2, Power, X } from 'lucide-react';
import { TrustLicense } from '../types';

interface SuperAdminPanelProps {
  licenses: TrustLicense[];
  onAddLicense: (
    lic: Omit<TrustLicense, 'id' | 'status'>,
    newUser?: { username: string; passwordHash: string; nameGuj: string }
  ) => void;
  onRenewLicense: (id: string) => void;
  onEditLicense: (lic: TrustLicense) => void;
  onDeleteLicense: (id: string) => void;
  onToggleDeactivate: (id: string) => void;
  onLogoutSuperAdmin?: () => void;
  darkMode: boolean;
}

export default function SuperAdminPanel({
  licenses,
  onAddLicense,
  onRenewLicense,
  onEditLicense,
  onDeleteLicense,
  onToggleDeactivate,
  onLogoutSuperAdmin,
  darkMode
}: SuperAdminPanelProps) {
  const [trustNameGuj, setTrustNameGuj] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [expiryYears, setExpiryYears] = useState('1');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Edit modal state
  const [editingLicense, setEditingLicense] = useState<TrustLicense | null>(null);
  const [deletingLicense, setDeletingLicense] = useState<TrustLicense | null>(null);

  // Generator helper
  const [generatedKey, setGeneratedKey] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; pass: string } | null>(null);

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let segments = [];
    for (let i = 0; i < 4; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    return `GUJ-TRST-${segments.join('-')}`;
  };

  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trustNameGuj || !registeredEmail) {
      alert('મહેરબાની કરીને ટ્રસ્ટનું નામ અને ઇમેઇલ દાખલ કરો.');
      return;
    }

    const cleanUser = adminUsername.trim() || 'admin';
    const cleanPass = adminPassword.trim() || 'admin123';

    const newKey = generateRandomKey();
    const actDate = new Date().toISOString().split('T')[0];
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + parseInt(expiryYears));
    const expDate = exp.toISOString().split('T')[0];

    onAddLicense(
      {
        trustNameGuj,
        licenseKey: newKey,
        registeredEmail,
        registeredPhone: registeredPhone || '9825012345',
        activationDate: actDate,
        expiryDate: expDate,
        version: 'v4.2.0'
      },
      {
        username: cleanUser,
        passwordHash: cleanPass,
        nameGuj: `${trustNameGuj} (પ્રશાસક)`
      }
    );

    setGeneratedKey(newKey);
    setCreatedCredentials({ username: cleanUser, pass: cleanPass });
    setTrustNameGuj('');
    setRegisteredEmail('');
    setRegisteredPhone('');
    alert(`લાયસન્સ અને લોગિન આઈડી (${cleanUser}) સફળતાપૂર્વક રજીસ્ટર થઈ ગયા છે!`);
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Super Admin Title */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] bg-indigo-600 text-white rounded-full uppercase font-bold tracking-wider">
              સિક્યોર સુપર એડમિન લાયસન્સિંગ કંટ્રોલ (Vendor Control)
            </span>
            <span className="px-2.5 py-1 text-[10px] bg-emerald-600 text-white rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> સક્રિય સેશન (Super Admin Active)
            </span>
          </div>
          <h2 className="text-xl font-black text-indigo-700 mt-2">વેન્ડર લાયસન્સ અને સબ્સ્ક્રિપ્શન મેનેજર (Super Admin Panel)</h2>
          <p className="text-xs text-slate-500 mt-1">નવા ગ્રાહક ટ્રસ્ટ બનાવો, સોફ્ટવેર લાયસન્સ કી જનરેટ કરો, મેન્ટેનન્સ પ્લાન અને રીમોટ અપડેટ્સ મેનેજ કરો.</p>
        </div>
        {onLogoutSuperAdmin && (
          <button
            type="button"
            onClick={onLogoutSuperAdmin}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap self-start md:self-center"
          >
            <LogOut className="w-4 h-4" /> સુપર એડમિન લોગઆઉટ
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side License Key Generator form */}
        <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
          <h3 className="font-bold text-sm text-indigo-600 flex items-center gap-1.5 border-b pb-2">
            <KeyRound className="w-4 h-4" /> નવી લાયસન્સ કી જનરેટર
          </h3>

          <form onSubmit={handleCreateLicense} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1">ગ્રાહક ટ્રસ્ટનું પૂરું નામ *</label>
              <input
                type="text"
                placeholder="દા.ત. શ્રી અંબાજી જન કલ્યાણ મંડળ"
                value={trustNameGuj}
                onChange={(e) => setTrustNameGuj(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">નોંધાયેલ ઇમેઇલ *</label>
                <input
                  type="email"
                  placeholder="trust@email.org"
                  value={registeredEmail}
                  onChange={(e) => setRegisteredEmail(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">નોંધાયેલ મોબાઇલ</label>
                <input
                  type="text"
                  placeholder="9825XXXXXX"
                  value={registeredPhone}
                  onChange={(e) => setRegisteredPhone(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">એડમિન યુઝરનેમ (Login ID) *</label>
                <input
                  type="text"
                  placeholder="દા.ત. trustadmin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold ${inputBg}`}
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">સુરક્ષા પાસવર્ડ (Password) *</label>
                <input
                  type="text"
                  placeholder="દા.ત. pass123"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold ${inputBg}`}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">મુદત સમયગાળો</label>
                <select
                  value={expiryYears}
                  onChange={(e) => setExpiryYears(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                >
                  <option value="1">૧ વર્ષ મુદત (1 Year Plan)</option>
                  <option value="2">૨ વર્ષ મુદત (2 Year Plan)</option>
                  <option value="3">૩ વર્ષ મુદત (3 Year Plan)</option>
                  <option value="5">૫ વર્ષ મુદત (5 Year Enterprise)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">પ્રોડક્ટ વર્ઝન</label>
                <select className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}>
                  <option value="v4.2.0">v4.2.0 (નવીનતમ સ્થિર)</option>
                  <option value="v4.1.0">v4.1.0 (જૂનું સંસ્કરણ)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs mt-2"
            >
              ટ્રસ્ટ રજીસ્ટર કરો અને લાયસન્સ જનરેટ કરો (Register Trust & Key)
            </button>
          </form>

          {generatedKey && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">જનરેટ રજીસ્ટ્રેશન વિગતો:</span>
              <code className="p-2 bg-white dark:bg-slate-900 block text-center font-mono font-bold text-sm text-slate-800 dark:text-slate-100 rounded select-all border border-dashed border-emerald-300 dark:border-emerald-700">
                {generatedKey}
              </code>
              {createdCredentials && (
                <div className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 text-[11px] font-mono space-y-1 text-slate-800 dark:text-slate-200">
                  <div className="flex justify-between">
                    <span className="font-sans font-bold text-slate-600 dark:text-slate-400">એડમિન યુઝરનેમ (ID):</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">{createdCredentials.username}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans font-bold text-slate-600 dark:text-slate-400">પાસવર્ડ:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">{createdCredentials.pass}</strong>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                ✓ આ યુઝરનેમ અને પાસવર્ડ વડે આ ટ્રસ્ટથી સીધું લોગિન કરી શકાશે.
              </p>
            </div>
          )}
        </div>

        {/* Right Side Customers list and Backup health statuses */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm space-y-3`}>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 border-b pb-2 flex justify-between items-center">
              <span>સક્રિય રજીસ્ટર્ડ ચેરિટી ગ્રાહકો (Active Trust Clients List)</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">કુલ: {licenses.length}</span>
            </h3>

            <div className="space-y-3">
              {licenses.map(lic => {
                const isActive = lic.status.startsWith('સક્રિય') || (lic.status.toLowerCase().includes('active') && !lic.status.toLowerCase().includes('in'));
                return (
                <div key={lic.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs flex flex-col justify-between gap-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{lic.trustNameGuj}</h4>
                      <span className="block font-mono text-indigo-600 mt-1">{lic.licenseKey}</span>
                      <span className={`block text-[10px] ${textMuted} mt-1`}>નોંધણી: {lic.registeredEmail} • વર્ઝન: {lic.version}</span>
                    </div>

                    <div className="flex flex-row md:flex-col items-start gap-2 justify-between shrink-0">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {lic.status}
                      </span>
                      <span className={`text-[10px] ${textMuted}`}>મુદત: {lic.expiryDate}</span>
                      {lic.status.includes('Expired') && (
                        <button
                          onClick={() => onRenewLicense(lic.id)}
                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[9px]"
                        >
                          રીન્યુ કરો (Renew 1 Year)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Edit, Deactivate, Delete Action Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingLicense(lic)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> એડિટ (Edit)
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleDeactivate(lic.id)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                        isActive
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      <Power className="w-3 h-3" /> {isActive ? 'ડીએક્ટિવેટ (Deactivate)' : 'એક્ટિવેટ (Activate)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingLicense(lic)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> ડિલીટ (Delete)
                    </button>
                  </div>
                </div>
              );})}
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {deletingLicense && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
              <div className={`w-full max-w-sm ${cardBg} p-6 rounded-3xl shadow-2xl border space-y-4 text-center`}>
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">લાયસન્સ ડિલીટ કરો? (Delete License)</h3>
                <p className="text-xs text-slate-500">
                  શું તમે ખાતરીપૂર્વક ટ્રસ્ટ <strong className="text-slate-800 dark:text-slate-200">"{deletingLicense.trustNameGuj}"</strong> નું લાયસન્સ ડિલીટ કરવા માંગો છો? આ ક્રિયા પરત ખેંચી શકાતી નથી.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingLicense(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    ના (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteLicense(deletingLicense.id);
                      setDeletingLicense(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    હા, ડિલીટ કરો (Delete)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit License Modal */}
          {editingLicense && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
              <div className={`w-full max-w-md ${cardBg} p-6 rounded-3xl shadow-2xl border space-y-4`}>
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-sm text-indigo-600">ટ્રસ્ટ લાયસન્સ સંપાદિત કરો (Edit Client License)</h3>
                  <button onClick={() => setEditingLicense(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  onEditLicense(editingLicense);
                  setEditingLicense(null);
                }} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1">ટ્રસ્ટનું નામ *</label>
                    <input
                      type="text"
                      value={editingLicense.trustNameGuj}
                      onChange={(e) => setEditingLicense({ ...editingLicense, trustNameGuj: e.target.value })}
                      className={`w-full p-2.5 rounded-xl ${inputBg}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">ઇમેઇલ *</label>
                    <input
                      type="email"
                      value={editingLicense.registeredEmail}
                      onChange={(e) => setEditingLicense({ ...editingLicense, registeredEmail: e.target.value })}
                      className={`w-full p-2.5 rounded-xl ${inputBg}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">મોબાઇલ</label>
                    <input
                      type="text"
                      value={editingLicense.registeredPhone}
                      onChange={(e) => setEditingLicense({ ...editingLicense, registeredPhone: e.target.value })}
                      className={`w-full p-2.5 rounded-xl ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">લાયસન્સ મુદત તારીખ *</label>
                    <input
                      type="date"
                      value={editingLicense.expiryDate}
                      onChange={(e) => setEditingLicense({ ...editingLicense, expiryDate: e.target.value })}
                      className={`w-full p-2.5 rounded-xl ${inputBg}`}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingLicense(null)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                    >
                      કેન્સલ
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer"
                    >
                      સાચવો (Save Changes)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Customer Backup Status / Remote Updates Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${cardBg} space-y-2`}>
              <h4 className="font-bold text-xs flex items-center gap-1.5 text-indigo-600"><Database className="w-4 h-4" /> ક્લાયન્ટ બેકઅપ આરોગ્ય</h4>
              <p className="text-[10px] text-slate-500">ગ્રાહકોના ઓટોમેટેડ સિક્યોર્ડ ઓફલાઇન ડેટાબેઝ ક્લાઉડ સિંક ઓડિટ સ્કોર.</p>
              <div className="space-y-2 text-[11px] pt-1">
                <div className="flex justify-between border-b pb-1">
                  <span>પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> પૂર્ણ સેવ (100%)</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${cardBg} space-y-2`}>
              <h4 className="font-bold text-xs flex items-center gap-1.5 text-indigo-600"><RefreshCw className="w-4 h-4" /> સોફ્ટવેર રીમોટ અપડેટ્સ</h4>
              <p className="text-[10px] text-slate-500">ગ્રાહકોની વિન્ડોઝ ડેસ્કટોપ સિસ્ટમ માટે નવીનતમ v4.2.0 સેટઅપ ડિલિવરી.</p>
              <button
                onClick={() => alert('નવું સિસ્ટમ v4.2.0 પેચ રોલઆઉટ પ્રોટોકોલ ચાલુ છે (Remote Patch Triggered).')}
                className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[11px] mt-2 border border-indigo-200"
              >
                રીમોટ પેચ v4.2.0 પુશ કરો
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
