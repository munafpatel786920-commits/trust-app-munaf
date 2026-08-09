/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, ShieldCheck, Save, RefreshCw, FileText, Settings, AlertCircle, Upload, Trash2, Image, RotateCcw, ShieldAlert, Lock, X, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { TrustSettings } from '../types';

interface TrustSettingsModuleProps {
  settings: TrustSettings;
  onSaveSettings: (updated: TrustSettings) => void;
  currentUser: { role: string };
  darkMode: boolean;
  appMode: 'offline' | 'online' | 'hybrid';
  onAppModeChange: (mode: 'offline' | 'online' | 'hybrid') => void;
  isOnline: boolean;
  onSyncNow: () => void;
  onMasterReset?: (adminUsername: string, adminPassword: string) => boolean;
}

export default function TrustSettingsModule({
  settings,
  onSaveSettings,
  currentUser,
  darkMode,
  appMode,
  onAppModeChange,
  isOnline,
  onSyncNow,
  onMasterReset
}: TrustSettingsModuleProps) {
  const [trustNameGuj, setTrustNameGuj] = useState(settings.trustNameGuj);
  const [trustNameEng, setTrustNameEng] = useState(settings.trustNameEng);
  const [regNoGuj, setRegNoGuj] = useState(settings.regNoGuj);
  const [addressGuj, setAddressGuj] = useState(settings.addressGuj);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [panNumber, setPanNumber] = useState(settings.panNumber);
  const [tanNumber, setTanNumber] = useState(settings.tanNumber);
  const [section12ANo, setSection12ANo] = useState(settings.section12ANo);
  const [section80GNo, setSection80GNo] = useState(settings.section80GNo);
  const [financialYear, setFinancialYear] = useState(settings.financialYear);
  const [receiptHeaderGuj, setReceiptHeaderGuj] = useState(settings.receiptHeaderGuj);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [openingCashBalance, setOpeningCashBalance] = useState<number>(settings.openingCashBalance ?? 150000);

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Master Reset Auth Modal States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetAdminUsername, setResetAdminUsername] = useState('admin');
  const [resetAdminPassword, setResetAdminPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Auto Update States
  const hasElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
  
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
  const [updateServerUrl, setUpdateServerUrl] = useState<string>('https://raw.githubusercontent.com/patelmunaf90/charitable-trust-updates/main/');
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>('');
  
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'ready' | 'error'>('idle');
  const [latestVersionInfo, setLatestVersionInfo] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [updateErrorMsg, setUpdateErrorMsg] = useState<string>('');

  React.useEffect(() => {
    if (hasElectron) {
      const api = (window as any).electronAPI;
      api.getAppVersion().then((v: string) => setCurrentVersion(v));
      api.getUpdateUrl().then((url: string) => {
        setUpdateServerUrl(url);
        setTempUrl(url);
      });

      const unsubAvailable = api.onUpdateAvailable((info: any) => {
        setLatestVersionInfo(info);
        setUpdateStatus('available');
      });

      const unsubNotAvailable = api.onUpdateNotAvailable((info: any) => {
        setLatestVersionInfo(info);
        setUpdateStatus('not-available');
      });

      const unsubProgress = (info: any) => {
        if (info && typeof info.percent === 'number') {
          setDownloadProgress(Math.round(info.percent));
          setUpdateStatus('downloading');
        }
      };
      const unsubProgressCleanup = api.onDownloadProgress(unsubProgress);

      const unsubDownloaded = api.onUpdateDownloaded((info: any) => {
        setUpdateStatus('ready');
      });

      const unsubError = api.onUpdateError((err: string) => {
        setUpdateErrorMsg(err || 'અપડેટ પ્રક્રિયામાં કોઈ ક્ષતિ આવી છે.');
        setUpdateStatus('error');
      });

      return () => {
        unsubAvailable();
        unsubNotAvailable();
        unsubProgressCleanup();
        unsubDownloaded();
        unsubError();
      };
    } else {
      setTempUrl(updateServerUrl);
    }
  }, [hasElectron]);

  const handleCheckForUpdates = () => {
    setUpdateErrorMsg('');
    setUpdateStatus('checking');
    
    if (hasElectron) {
      (window as any).electronAPI.checkForUpdates();
    } else {
      setTimeout(() => {
        setLatestVersionInfo({ version: '1.0.1' });
        setUpdateStatus('available');
      }, 1500);
    }
  };

  const handleDownloadUpdate = () => {
    setUpdateStatus('downloading');
    setDownloadProgress(0);
    
    if (hasElectron) {
      (window as any).electronAPI.downloadUpdate();
    } else {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setDownloadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setUpdateStatus('ready');
        }
      }, 300);
    }
  };

  const handleInstallUpdate = () => {
    if (hasElectron) {
      (window as any).electronAPI.installUpdate();
    } else {
      alert('રીસ્ટાર્ટ અને ઇન્સ્ટોલેશનનું નિદર્શન સફળ થયું છે (સિગ્નલ: quitAndInstall).');
      setUpdateStatus('idle');
    }
  };

  const handleSaveUpdateUrl = () => {
    if (!tempUrl.trim()) return;
    setUpdateServerUrl(tempUrl.trim());
    setIsEditingUrl(false);
    
    if (hasElectron) {
      (window as any).electronAPI.setUpdateUrl(tempUrl.trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert('કૃપા કરીને ૧.૫ MB થી ઓછી સાઇઝનો લોગો અપલોડ કરો.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role === 'ReadOnly') {
      alert('તમારી પાસે સેટિંગ્સ બદલવાની પરવાનગી નથી.');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      onSaveSettings({
        trustNameGuj,
        trustNameEng,
        regNoGuj,
        addressGuj,
        phone,
        email,
        panNumber,
        tanNumber,
        section12ANo,
        section80GNo,
        financialYear,
        receiptHeaderGuj,
        logoUrl,
        openingCashBalance
      });
      setSaving(false);
      alert('ટ્રસ્ટ પ્રોફાઇલ, લોગો અને હિસાબી સેટિંગ્સ સફળતાપૂર્વક અપડેટ કરવામાં આવી છે.');
    }, 800);
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  const isReadOnly = currentUser.role === 'ReadOnly';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black">ટ્રસ્ટ પ્રોફાઇલ અને સેટીંગ્સ (Trust Profile & Settings)</h2>
        <p className={`text-xs ${textMuted}`}>ચેરિટેબલ ટ્રસ્ટની કાનૂની ઓળખ, નોંધણી નંબર, નાણાકીય વર્ષ અને પ્રિન્ટ પાવતીના હેડરની સુયોજના.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Section 1: General Info */}
          <div className={`lg:col-span-2 p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
            <h3 className="font-bold text-sm text-emerald-600 flex items-center gap-1.5 border-b pb-2">
              <Landmark className="w-4 h-4" /> સામાન્ય વિગતો (General Identity)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold mb-1">ટ્રસ્ટનું પૂરું નામ (ગુજરાતીમાં) *</label>
                <input
                  type="text"
                  value={trustNameGuj}
                  onChange={(e) => setTrustNameGuj(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Trust Registered Name (In English) *</label>
                <input
                  type="text"
                  value={trustNameEng}
                  onChange={(e) => setTrustNameEng(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold mb-1">નોંધણી નંબર (Registration No.) *</label>
                <input
                  type="text"
                  value={regNoGuj}
                  onChange={(e) => setRegNoGuj(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">નાણાકીય વર્ષ (Financial Year) *</label>
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                >
                  <option value="૨૦૨૫-૨૬ (FY 2025-26)">૨૦૨૫-૨૬ (FY 2025-26)</option>
                  <option value="૨૦૨૬-૨૭ (FY 2026-27)">૨૦૨૬-૨૭ (FY 2026-27)</option>
                  <option value="૨૦૨૭-૨૮ (FY 2027-28)">૨૦૨૭-૨૮ (FY 2027-28)</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold mb-1">નોંધાયેલું પૂરું સરનામું (Registered Address) *</label>
              <textarea
                rows={2}
                value={addressGuj}
                onChange={(e) => setAddressGuj(e.target.value)}
                disabled={isReadOnly}
                className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold mb-1">સંપર્ક ટેલિફોન / મોબાઇલ *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">અધિકૃત ઈમેઈલ આઈડી *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>
            </div>

            {/* Financial Year & Cash Opening Balance */}
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-3 mt-4">
              <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Landmark className="w-4 h-4" /> નાણાકીય વર્ષ અને પ્રારંભિક કૅશ શિલક (Cash Opening Balance)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold mb-1">નાણાકીય વર્ષ (Financial Year) *</label>
                  <input
                    type="text"
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    disabled={isReadOnly}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">પ્રારંભિક રોકડ શિલક (Opening Cash Balance ₹) *</label>
                  <input
                    type="number"
                    value={openingCashBalance}
                    onChange={(e) => setOpeningCashBalance(Number(e.target.value) || 0)}
                    disabled={isReadOnly}
                    placeholder="દા.ત. 150000"
                    className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 ${inputBg}`}
                    required
                  />
                  <span className={`block text-[10px] ${textMuted} mt-1`}>
                    વર્ષની શરૂઆતની હાથ પરની રોકડ (રોજમેળમાં આ રકમથી કેશ બેલેન્સ શરૂ થશે).
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Statutory & Receipt settings */}
          <div className="space-y-6">
            {/* Trust Logo Section */}
            <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4 text-xs`}>
              <h3 className="font-bold text-sm text-emerald-600 flex items-center gap-1.5 border-b pb-2">
                <Image className="w-4 h-4" /> ટ્રસ્ટ લોગો (Trust Logo)
              </h3>

              <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-xl border-slate-300 dark:border-slate-700 space-y-3">
                {logoUrl ? (
                  <div className="relative group w-32 h-32 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
                    <img 
                      src={logoUrl} 
                      alt="Trust Logo" 
                      className="max-w-full max-h-full object-contain p-1" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                    <Landmark className="w-10 h-10 mb-1" />
                    <span className="text-[10px]">લોગો અપલોડ નથી</span>
                  </div>
                )}

                <div className="flex gap-2 w-full justify-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    disabled={isReadOnly}
                    className="hidden"
                  />
                  
                  <button
                    id="btn-upload-logo"
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                  >
                    <Upload className="w-3 h-3" /> આટેચ લોગો (Attach)
                  </button>

                  {logoUrl && (
                    <button
                      id="btn-delete-logo"
                      type="button"
                      disabled={isReadOnly}
                      onClick={handleDeleteLogo}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3 h-3" /> ડિલીટ (Delete)
                    </button>
                  )}
                </div>

                <span className={`text-[10px] text-center ${textMuted}`}>
                  મહત્તમ કદ: ૧.૫ MB (JPG, PNG અથવા SVG). આ લોગો તમારી બધી દાન પાવતી અને ચુકવણી વાઉચર પર પ્રિન્ટ થશે.
                </span>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4 text-xs`}>
              <h3 className="font-bold text-sm text-indigo-600 flex items-center gap-1.5 border-b pb-2">
                <ShieldCheck className="w-4 h-4" /> કરમુકતી અને ટેક્સ આઈડી
              </h3>

              <div>
                <label className="block font-bold mb-1">PAN કાર્ડ નંબર *</label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  disabled={isReadOnly}
                  className={`w-full p-2.5 rounded-xl font-mono text-xs ${inputBg}`}
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">TAN નંબર</label>
                <input
                  type="text"
                  value={tanNumber}
                  onChange={(e) => setTanNumber(e.target.value.toUpperCase())}
                  disabled={isReadOnly}
                  className={`w-full p-2.5 rounded-xl font-mono text-xs ${inputBg}`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">12A નોંધણી ક્રમાંક</label>
                <input
                  type="text"
                  value={section12ANo}
                  onChange={(e) => setSection12ANo(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full p-2.5 rounded-xl font-mono text-xs ${inputBg}`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">80G દાન મુક્તિ ક્રમાંક (Tax Free No.)</label>
                <input
                  type="text"
                  value={section80GNo}
                  onChange={(e) => setSection80GNo(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full p-2.5 rounded-xl font-mono text-xs ${inputBg}`}
                />
              </div>
            </div>

            {/* Custom Header on Receipt */}
            <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4 text-xs`}>
              <h3 className="font-bold text-sm text-amber-600 flex items-center gap-1.5 border-b pb-2">
                <FileText className="w-4 h-4" /> પાવતીના ટાઇટલ સેટિંગ્સ
              </h3>

              <div>
                <label className="block font-bold mb-1">પાવતીના મથાળે સ્લોગન / વિગત</label>
                <input
                  type="text"
                  value={receiptHeaderGuj}
                  onChange={(e) => setReceiptHeaderGuj(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="દા.ત. માનવ સેવા એ જ પ્રભુ સેવા"
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
                <span className={`block text-[10px] ${textMuted} mt-1.5`}>
                  નોંધ: આ સૂત્ર/સ્લોગન દાન પાવતી પ્રિન્ટ પત્રકમાં સૌથી ઉપર દેખાશે.
                </span>
              </div>
            </div>

            {/* Application Mode & Sync Settings (Offline / Online / Hybrid) */}
            <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4 text-xs`}>
              <h3 className="font-bold text-sm text-emerald-600 flex items-center gap-1.5 border-b pb-2">
                <RefreshCw className="w-4 h-4" /> એપ્લિકેશન મોડ અને ક્લાઉડ સિન્ક સેટિંગ્સ (App & Sync Mode)
              </h3>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="font-bold block">વર્તમાન ઇન્ટરનેટ સ્થિતિ (Connection Status):</span>
                  <span className={`inline-flex items-center gap-1.5 font-semibold mt-0.5 ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    {isOnline ? 'ઇન્ટરનેટ ઉપલબ્ધ (Online Connected)' : 'ઓફલાઇન મોડ (Offline Mode)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onSyncNow}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> હમણાં સિન્ક કરો (Sync Now)
                </button>
              </div>

              <div>
                <label className="block font-bold mb-1.5">મોડ પસંદ કરો (Select Application Mode) *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => onAppModeChange('offline')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      appMode === 'offline'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    <strong className="block text-xs font-bold mb-0.5">ઓફલાઇન મોડ (Offline Mode)</strong>
                    <span className="text-[10px] opacity-90 block leading-tight">ફક્ત લોકલ SQLite/LocalStorage ડેટાબેઝનો ઉપયોગ કરે છે. ઇન્ટરનેટની જરૂર નથી.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAppModeChange('online')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      appMode === 'online'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    <strong className="block text-xs font-bold mb-0.5">ઓનલાઇન મોડ (Online Mode)</strong>
                    <span className="text-[10px] opacity-90 block leading-tight">ફક્ત Firebase Firestore ક્લાઉડ ડેટાબેઝ સાથે ડાયરેક્ટ સિંક કરે છે.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAppModeChange('hybrid')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      appMode === 'hybrid'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    <strong className="block text-xs font-bold mb-0.5">હાઇબ્રિડ મોડ (Hybrid Mode - Recommended)</strong>
                    <span className="text-[10px] opacity-90 block leading-tight">ઓફલાઇન વખતે SQLite અને ઇન્ટરનેટ મળતા જ Firebase સાથે ઓટો સિન્ક.</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Software Auto Update Section */}
            <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4 text-xs`}>
              <h3 className="font-bold text-sm text-indigo-600 flex items-center gap-1.5 border-b pb-2">
                <RefreshCw className="w-4 h-4 text-indigo-600" /> સોફ્ટવેર ઓટો અપડેટ સિસ્ટમ (Software Update)
              </h3>

              <div className="space-y-3.5">
                {/* Current & Latest Version info */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className={`block text-[10px] ${textMuted} uppercase tracking-wider`}>વર્તમાન વર્ઝન (Current)</span>
                    <strong className="text-sm font-mono">{currentVersion}</strong>
                  </div>
                  <div>
                    <span className={`block text-[10px] ${textMuted} uppercase tracking-wider`}>નવીનતમ વર્ઝન (Latest)</span>
                    <strong className="text-sm font-mono">
                      {latestVersionInfo ? latestVersionInfo.version : (updateStatus === 'checking' ? 'તપાસ ચાલુ...' : 'અજ્ઞાત')}
                    </strong>
                  </div>
                </div>

                {/* Connection check banner */}
                {!isOnline && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-[10px] text-amber-800 dark:text-amber-300">
                    ⚠️ આપ અત્યારે ઑફલાઇન છો. અપડેટ તપાસવા માટે ઇન્ટરનેટ કનેક્શન જરૂરી છે.
                  </div>
                )}

                {/* Status messages & Progress */}
                {updateStatus === 'checking' && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>નવા અપડેટ માટે સર્વર પર તપાસ થઈ રહી છે...</span>
                  </div>
                )}

                {updateStatus === 'not-available' && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                    <span>આપનું સોફ્ટવેર અદ્યતન (Up to date) છે! કોઈ નવા અપડેટની જરૂર નથી.</span>
                  </div>
                )}

                {updateStatus === 'available' && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold">
                      <AlertCircle className="w-4.5 h-4.5 text-indigo-500" />
                      <span>નવું સોફ્ટવેર અપડેટ ઉપલબ્ધ છે.</span>
                    </div>
                    <p className={`text-[10px] ${textMuted} leading-tight`}>
                      નવું સંસ્કરણ {latestVersionInfo?.version} ડાઉનલોડ કરવા માટે તૈયાર છે. આ અપડેટ દ્વારા આપનો હિસાબી ડેટા કાયમ માટે સુરક્ષિત રહેશે.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadUpdate}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-sm"
                    >
                      અપડેટ ડાઉનલોડ કરો (Download Update)
                    </button>
                  </div>
                )}

                {updateStatus === 'downloading' && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/10 border border-indigo-200 dark:border-indigo-800/50 rounded-xl space-y-2">
                    <div className="flex justify-between font-semibold">
                      <span>નવું અપડેટ ડાઉનલોડ થઈ રહ્યું છે...</span>
                      <span className="font-mono">{downloadProgress}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                    <span className={`block text-[9px] ${textMuted} text-center`}>
                      કૃપા કરીને ડાઉનલોડ પૂર્ણ થવા સુધી રાહ જુઓ. એપ્લિકેશન બંધ કરશો નહીં.
                    </span>
                  </div>
                )}

                {updateStatus === 'ready' && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                      <span>અપડેટ તૈયાર છે. સોફ્ટવેર ફરી શરૂ કરીને અપડેટ ઇન્સ્ટોલ કરો.</span>
                    </div>
                    <p className={`text-[10px] ${textMuted} leading-tight`}>
                      ડાઉનલોડ સફળતાપૂર્વક પૂર્ણ થયું છે. અપડેટ લાગુ કરવા માટે સોફ્ટવેર ફરી શરૂ કરવાની જરૂર છે.
                    </p>
                    <button
                      type="button"
                      onClick={handleInstallUpdate}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> ફરી શરૂ કરો અને ઇન્સ્ટોલ કરો (Restart & Install)
                    </button>
                  </div>
                )}

                {updateStatus === 'error' && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                      <AlertCircle className="w-4.5 h-4.5 text-rose-500" />
                      <span>અપડેટ ક્ષતિ (Update Error)</span>
                    </div>
                    <p className="text-[10px] text-rose-700 dark:text-rose-400 font-mono leading-tight bg-white dark:bg-slate-900 p-2 rounded-lg border dark:border-slate-800 break-all max-h-24 overflow-y-auto font-mono">
                      {updateErrorMsg}
                    </p>
                    <button
                      type="button"
                      onClick={handleCheckForUpdates}
                      className="w-full py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-all text-xs cursor-pointer"
                    >
                      ફરી પ્રયાસ કરો (Retry)
                    </button>
                  </div>
                )}

                {/* Primary Action Button */}
                {['idle', 'not-available'].includes(updateStatus) && (
                  <button
                    type="button"
                    onClick={handleCheckForUpdates}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> અપડેટ માટે તપાસ કરો (Check for Updates)
                  </button>
                )}

                {/* Server configuration */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`block font-bold text-[10px] ${textMuted}`}>અપડેટ સર્વર એડ્રેસ (Update Server URL)</label>
                    {!isEditingUrl ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingUrl(true)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        બદલો (Edit)
                      </button>
                    ) : (
                      <div className="flex gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={handleSaveUpdateUrl}
                          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                        >
                          સાચવો (Save)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTempUrl(updateServerUrl);
                            setIsEditingUrl(false);
                          }}
                          className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
                        >
                          રદ (Cancel)
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditingUrl ? (
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border font-mono text-[9px] text-slate-500 dark:text-slate-400 break-all select-all">
                      {updateServerUrl}
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      className={`w-full p-2 rounded-lg font-mono text-[10px] ${inputBg} outline-none focus:border-indigo-500`}
                      placeholder="દા.ત. https://your-server.com/updates/"
                    />
                  )}
                  <span className={`block text-[9px] ${textMuted} leading-tight`}>
                    * આ એડ્રેસ પરથી એપ્લિકેશન અપડેટ્સ માટેની ફાઇલો અને `latest.yml` ઓટોમેટીક ડાઉનલોડ કરશે.
                  </span>
                </div>
              </div>
            </div>

            {/* Master Data Reset Section */}
            <div className={`p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm space-y-3 text-xs`}>
              <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-900/60 pb-2.5">
                <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-600" /> માસ્ટર ડેટા રિસેટ (Master Factory Reset)
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                  સુરક્ષિત ક્ષેત્ર (Admin Only)
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                આ સેટિંગ દ્વારા તમામ પાવતીઓ, વાઉચરો, બેંક ખાતાઓ, દાતાઓ, સભ્યો, અસ્કયામતો અને ઠરાવોનો ડેટા સફાચટ (Clear/Reset) કરીને ફેક્ટરી મોડમાં લાવી શકાય છે. સુરક્ષા કારણોસર આ ક્રિયા માટે <strong>એડમિન આઈડી અને પાસવર્ડ (Admin ID & Password)</strong> ની ચકાસણી ફરજિયાત છે.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  id="btn-master-reset-trigger"
                  onClick={() => {
                    if (currentUser.role === 'ReadOnly') {
                      alert('તમારી પાસે આ ક્રિયા કરવાની પરવાનગી નથી.');
                      return;
                    }
                    setResetError('');
                    setResetSuccess(false);
                    setResetAdminPassword('');
                    setShowResetModal(true);
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> માસ્ટર રિસેટ શરૂ કરો (Factory Reset)
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Submit Button Block */}
        {!isReadOnly && (
          <div className="flex justify-end pt-2">
            <button
              id="btn-save-settings"
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> સાચવવામાં આવી રહ્યું છે...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> સેટિંગ્સ સેવ કરો (Save Settings)
                </>
              )}
            </button>
          </div>
        )}

        {isReadOnly && (
          <div className={`p-4 rounded-xl border border-dashed ${cardBg} flex gap-3 text-xs items-center`}>
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className={textMuted}>
              તમારી વર્તમાન ભૂમિકા <strong>માત્ર નિરીક્ષક (Read Only)</strong> છે. તેથી આ વિગતોમાં ફેરફાર કરવાની પરવાનગી નથી.
            </p>
          </div>
        )}
      </form>

      {/* Master Reset Admin Authentication Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              } space-y-4 relative`}
            >
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400">એડમિન ઓથેન્ટિકેશન - માસ્ટર રિસેટ</h3>
                  <span className="text-[11px] text-slate-400">Admin Authentication Required</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <strong>⚠️ ચેતવણી (Warning):</strong>
                <p>આ ક્રિયા કરવાથી તમામ હિસાબો, દાન પાવતીઓ, વાઉચરો અને નોંધો કાયમ માટે ભૂંસાઈ જશે. મંજૂરી માટે એડમિન આઈડી અને પાસવર્ડ નાખો.</p>
              </div>

              {resetError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>રિસેટ સફળ! તમામ ડેટા ફેક્ટરી સ્થિતિમાં રિસેટ થઈ ગયો છે.</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setResetError('');
                  if (!resetAdminUsername.trim() || !resetAdminPassword) {
                    setResetError('કૃપા કરીને એડમિન યુઝરનેમ અને પાસવર્ડ બંને દાખલ કરો.');
                    return;
                  }

                  if (onMasterReset) {
                    const success = onMasterReset(resetAdminUsername, resetAdminPassword);
                    if (success) {
                      setResetSuccess(true);
                      setResetError('');
                      setTimeout(() => {
                        setResetSuccess(false);
                        setShowResetModal(false);
                        setResetAdminPassword('');
                        alert('માસ્ટર ડેટા રિસેટ સફળતાપૂર્વક પૂર્ણ થયો છે! સિસ્ટમના તમામ હિસાબો સાફ કરી દેવાયા છે.');
                      }, 800);
                    } else {
                      setResetError('અમાન્ય એડમિન યુઝરનેમ અથવા પાસવર્ડ! માસ્ટર રિસેટ ફક્ત સાચા એડમિન આઈડી અને પાસવર્ડ દ્વારા જ થઈ શકે છે.');
                    }
                  }
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    એડમિન યુઝરનેમ / આઈડી (Admin ID) *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="દા.ત. admin"
                      value={resetAdminUsername}
                      onChange={(e) => setResetAdminUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    એડમિન પાસવર્ડ (Admin Password) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showResetPassword ? "text" : "password"}
                      required
                      placeholder="એડમિન પાસવર્ડ દાખલ કરો"
                      value={resetAdminPassword}
                      onChange={(e) => setResetAdminPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                  >
                    રદ કરો (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> ફેક્ટરી રિસેટ કરો (Confirm)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
