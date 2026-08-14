/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Award, Plus, Layers, Database, RefreshCw, Server, CheckCircle2, AlertTriangle, LogOut, ShieldCheck, Edit2, Trash2, Power, X, Share2, Copy, Check, ExternalLink, Send } from 'lucide-react';
import { TrustLicense, User } from '../types';

interface SuperAdminPanelProps {
  licenses: TrustLicense[];
  appUsers?: User[];
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
  appUsers = [],
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
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; pass: string; trustName: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getTrustAdminUser = (trustName: string) => {
    const tUsers = appUsers.filter(u => (u.trustNameGuj || '').trim() === trustName.trim());
    return tUsers.find(u => u.role === 'Admin') || tUsers[0];
  };

  const generateSetupLink = (lic: TrustLicense, userCred?: { username: string; pass: string }) => {
    const origin = window.location.origin + window.location.pathname;
    let username = 'admin';
    let password = 'admin123';

    if (userCred) {
      username = userCred.username;
      password = userCred.pass;
    } else {
      const u = getTrustAdminUser(lic.trustNameGuj);
      if (u) {
        username = u.username;
        password = u.passwordHash;
      }
    }

    const payload = {
      t: lic.trustNameGuj,
      u: username,
      p: password,
      e: lic.registeredEmail,
      m: lic.registeredPhone,
      exp: lic.expiryDate
    };

    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
      return `${origin}?setup=${encoded}`;
    } catch (e) {
      return `${origin}?trust=${encodeURIComponent(lic.trustNameGuj)}&user=${encodeURIComponent(username)}&pass=${encodeURIComponent(password)}`;
    }
  };

  const getWhatsAppShareUrl = (lic: TrustLicense, userCred?: { username: string; pass: string }) => {
    const link = generateSetupLink(lic, userCred);
    let username = 'admin';
    let password = 'admin123';

    if (userCred) {
      username = userCred.username;
      password = userCred.pass;
    } else {
      const u = getTrustAdminUser(lic.trustNameGuj);
      if (u) {
        username = u.username;
        password = u.passwordHash;
      }
    }

    const text = `🙏 નમસ્તે,\nતમારા ટ્રસ્ટ માટે એકાઉન્ટિંગ સોફ્ટવેર લોગિન વિગતો:\n\n🏛️ ટ્રસ્ટ: *${lic.trustNameGuj}*\n👤 યુઝરનેમ (ID): *${username}*\n🔒 પાસવર્ડ: *${password}*\n📅 માન્યતા મુદત: ${lic.expiryDate}\n\n👉 ૧-ક્લિકમાં સોફ્ટવેર શરૂ કરવા આ લિંક ખોલો:\n${link}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

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
    setCreatedCredentials({ username: cleanUser, pass: cleanPass, trustName: trustNameGuj });
    setTrustNameGuj('');
    setRegisteredEmail('');
    setRegisteredPhone('');
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
              સુપર એડમિન મેનેજર (Super Admin Panel)
            </span>
            <span className="px-2.5 py-1 text-[10px] bg-emerald-600 text-white rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> સક્રિય સેશન (Active)
            </span>
          </div>
          <h2 className="text-xl font-black text-indigo-700 mt-2">ટ્રસ્ટ ક્લાયન્ટ સંચાલન (Trust Accounts Manager)</h2>
          <p className="text-xs text-slate-500 mt-1">નવા ગ્રાહક ટ્રસ્ટ બનાવો, યુઝર આઈડી અને પાસવર્ડ સેટ કરો અને ક્લાઉડ એકાઉન્ટ્સ મેનેજ કરો.</p>
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
        {/* Left Side Client Trust Creation form */}
        <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
          <h3 className="font-bold text-sm text-indigo-600 flex items-center gap-1.5 border-b pb-2">
            <Plus className="w-4 h-4" /> નવું ક્લાયન્ટ ટ્રસ્ટ રજીસ્ટ્રેશન
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
                <label className="block font-bold mb-1">સબ્સ્ક્રિપ્શન પ્લાન</label>
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
                  <option value="v4.2.0">v4.2.0 (સ્થિર સંસ્કરણ)</option>
                  <option value="v4.1.0">v4.1.0 (જૂનું સંસ્કરણ)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs mt-2 cursor-pointer transition-colors"
            >
              ટ્રસ્ટ રજીસ્ટર કરો (Register Trust Account)
            </button>
          </form>

          {createdCredentials && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-3 text-xs shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> એકાઉન્ટ સફળતાપૂર્વક રજીસ્ટર થયું!
                </span>
                <span className="text-[10px] bg-emerald-200/70 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  સક્રિય (Active)
                </span>
              </div>

              <div className="p-2.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono space-y-1.5 text-slate-800 dark:text-slate-200">
                <div className="flex justify-between">
                  <span className="font-sans font-bold text-slate-600 dark:text-slate-400">ટ્રસ્ટ:</span>
                  <strong className="text-slate-800 dark:text-white font-sans">{createdCredentials.trustName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans font-bold text-slate-600 dark:text-slate-400">એડમિન યુઝરનેમ:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">{createdCredentials.username}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans font-bold text-slate-600 dark:text-slate-400">પાસવર્ડ:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">{createdCredentials.pass}</strong>
                </div>
              </div>

              {/* One-click share buttons */}
              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 space-y-2">
                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">
                  📲 ગ્રાહકના મોબાઈલમાં ૧-ક્લિકથી શરૂ કરવા માટે મોકલો:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={getWhatsAppShareUrl({
                      id: 'temp',
                      trustNameGuj: createdCredentials.trustName,
                      licenseKey: 'TRST-' + Date.now(),
                      registeredEmail: 'admin@trust.org',
                      registeredPhone: '',
                      activationDate: new Date().toISOString().split('T')[0],
                      expiryDate: '2099-12-31',
                      status: 'સક્રિય (Active)',
                      version: 'v4.2.0'
                    }, createdCredentials)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
                  >
                    <Send className="w-3.5 h-3.5" /> WhatsApp પર મોકલો
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyText(
                      generateSetupLink({
                        id: 'temp',
                        trustNameGuj: createdCredentials.trustName,
                        licenseKey: 'TRST-' + Date.now(),
                        registeredEmail: 'admin@trust.org',
                        registeredPhone: '',
                        activationDate: new Date().toISOString().split('T')[0],
                        expiryDate: '2099-12-31',
                        status: 'સક્રિય (Active)',
                        version: 'v4.2.0'
                      }, createdCredentials),
                      'gen-link'
                    )}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    {copiedId === 'gen-link' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> લિંક કોપી થઈ ગઈ!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> ડાયરેક્ટ લિંક કોપી કરો
                      </>
                    )}
                  </button>
                </div>
              </div>
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
                const adminUser = getTrustAdminUser(lic.trustNameGuj);
                const shareLink = generateSetupLink(lic);
                const waUrl = getWhatsAppShareUrl(lic);

                return (
                <div key={lic.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs flex flex-col justify-between gap-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{lic.trustNameGuj}</h4>
                      <span className={`block text-[10px] ${textMuted} mt-1`}>નોંધણી: {lic.registeredEmail} {lic.registeredPhone ? `• મો: ${lic.registeredPhone}` : ''} • વર્ઝન: {lic.version}</span>
                      {adminUser && (
                        <div className="mt-1.5 flex items-center gap-3 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          <span>User: <strong className="text-emerald-700 dark:text-emerald-400">{adminUser.username}</strong></span>
                          <span>Pass: <strong className="text-emerald-700 dark:text-emerald-400">{adminUser.passwordHash}</strong></span>
                        </div>
                      )}
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

                  {/* Share on WhatsApp & Copy Link Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                      <Share2 className="w-3 h-3 text-indigo-600" /> ગ્રાહકને મોકલો:
                    </span>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Send className="w-3 h-3" /> WhatsApp Share
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyText(shareLink, `link-${lic.id}`)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === `link-${lic.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> લિંક કોપી થઈ!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> ડાયરેક્ટ લિંક કોપી
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyText(
                        `ટ્રસ્ટ: ${lic.trustNameGuj}\nયુઝરનેમ: ${adminUser?.username || 'admin'}\nપાસવર્ડ: ${adminUser?.passwordHash || 'admin123'}\nલિંક: ${shareLink}`,
                        `msg-${lic.id}`
                      )}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === `msg-${lic.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> વિગત કોપી થઈ!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> પૂરી વિગત કોપી
                        </>
                      )}
                    </button>
                  </div>

                  {/* Edit, Deactivate, Delete Action Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
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

          {/* Customer Backup Status Panel */}
          <div className="grid grid-cols-1 gap-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}
