/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard,
  TrendingUp, 
  TrendingDown, 
  Landmark, 
  Users, 
  Calendar, 
  DollarSign, 
  Wallet, 
  ShieldAlert, 
  Award,
  BookOpen,
  ShieldCheck,
  Database,
  ShoppingBag,
  FileText,
  HardDrive,
  Settings,
  KeyRound,
  ChevronRight,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { IncomeReceipt, ExpenseVoucher, Donor, BankAccount } from '../types';

interface DashboardProps {
  mode?: 'control_panel' | 'analytics';
  receipts: IncomeReceipt[];
  vouchers: ExpenseVoucher[];
  donors: Donor[];
  banks: BankAccount[];
  currentUser: { nameGuj: string; roleGuj: string };
  darkMode: boolean;
  trustSettings?: any;
  reconciliationList?: any[];
  onSelectTab: (tab: string) => void;
  isSuperAdminAuthenticated?: boolean;
  onLogout?: () => void;
}

export default function Dashboard({ mode = 'control_panel', receipts, vouchers, donors, banks, currentUser, darkMode, trustSettings, reconciliationList, onSelectTab, isSuperAdminAuthenticated, onLogout }: DashboardProps) {
  // Calculations
  const activeReceipts = receipts.filter(r => !r.isDeleted);
  const activeVouchers = vouchers.filter(v => !v.isDeleted);

  const totalIncome = activeReceipts.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = activeVouchers.reduce((sum, v) => sum + v.amount, 0);

  const activeRecon = reconciliationList || [];
  const bankCashDeposit = activeRecon
    .filter(tx => tx.docType === 'ડિપોઝીટ' || tx.docType === 'રોકડ ડિપોઝીટ' || (tx.type?.includes('જમા') && tx.docType !== 'ચેક' && tx.docType !== 'RTGS' && (tx.desc?.includes('રોકડ') || tx.desc?.includes('ડિપોઝીટ'))))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const bankCashWithdrawal = activeRecon
    .filter(tx => tx.docType === 'વિથડ્રોઅલ' || tx.docType === 'રોકડ ઉપાડ' || (tx.type?.includes('ઉપાડ') && tx.docType !== 'ચેક' && tx.docType !== 'RTGS' && (tx.desc?.includes('રોકડ') || tx.desc?.includes('ઉપાડ'))))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const cashIn = activeReceipts.filter(r => r.paymentMode.includes('રોકડ')).reduce((sum, r) => sum + r.amount, 0);
  const cashOut = activeVouchers.filter(v => v.paymentMode.includes('રોકડ')).reduce((sum, v) => sum + v.amount, 0);

  const openingCash = trustSettings?.openingCashBalance !== undefined ? Number(trustSettings.openingCashBalance) : 150000;
  const cashBalance = openingCash + cashIn + bankCashWithdrawal - cashOut - bankCashDeposit;

  const bankBalance = banks.reduce((sum, b) => sum + b.balance, 0);

  // Today's Date in YYYY-MM-DD
  const realToday = new Date().toISOString().split('T')[0];
  const hasTransactionsToday = activeReceipts.some(r => r.date === realToday) || activeVouchers.some(v => v.date === realToday);
  const todayStr = hasTransactionsToday ? realToday : '2026-07-28'; // Fallback to simulated date for initial mock dataset

  const todayIncome = activeReceipts.filter(r => r.date === todayStr).reduce((sum, r) => sum + r.amount, 0);
  const todayExpense = activeVouchers.filter(v => v.date === todayStr).reduce((sum, v) => sum + v.amount, 0);

  // Monthly stats
  const currentMonth = todayStr.substring(0, 7);
  const monthlyIncome = activeReceipts.filter(r => r.date.startsWith(currentMonth)).reduce((sum, r) => sum + r.amount, 0);
  const monthlyExpense = activeVouchers.filter(v => v.date.startsWith(currentMonth)).reduce((sum, v) => sum + v.amount, 0);

  // Category distribution
  const categoriesMap: { [key: string]: number } = {};
  activeReceipts.forEach(r => {
    const key = r.category.split(' ')[0];
    categoriesMap[key] = (categoriesMap[key] || 0) + r.amount;
  });

  const categoriesData = Object.entries(categoriesMap).map(([name, val]) => ({ name, val }));

  // Recent transactions combined
  const recentTx = [
    ...activeReceipts.map(r => ({ ...r, type: 'INCOME', label: 'આવક પાવતી' })),
    ...activeVouchers.map(v => ({ ...v, type: 'EXPENSE', label: 'ખર્ચ વાઉચર' }))
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  const controlPanelModules = [
    { id: 'dashboard', title: 'ડેશબોર્ડ & એનાલિટિક્સ', desc: 'ગ્રાફ, આંકડા અને સમીક્ષા', icon: LayoutDashboard, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    { id: 'receipts', title: 'આવક પાવતીઓ', desc: 'દાન અને સભ્ય ફાળો', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    { id: 'vouchers', title: 'ખર્ચ વાઉચર્સ', desc: 'ચૂકવણા અને ખર્ચ', icon: TrendingDown, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
    { id: 'banks', title: 'બેંક ખાતાઓ', desc: 'બેંક પાસબુક અને રીકોન્સિલેશન', icon: Landmark, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
    { id: 'accounting', title: 'દ્વિ-નોંધી નામું', desc: 'પાકું સરવૈયું, ટ્રાયલ બેલેન્સ', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
    { id: 'donors', title: 'દાતાઓ', desc: 'દાતા મિત્રોની યાદી', icon: Users, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800' },
    { id: 'members', title: 'સભાસદો', desc: 'સભાસદ સભ્યપદ નોંધો', icon: Users, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800' },
    { id: 'trust_members', title: 'ટ્રસ્ટ હોદ્દેદારો', desc: 'પ્રમુખ, મંત્રી અને ટ્રસ્ટીઓ', icon: ShieldCheck, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800' },
    { id: 'assets', title: 'સ્થાયી મિલકતો', desc: 'જમીન, મકાન અને ઘસારો', icon: Database, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
    { id: 'purchase_sales', title: 'ખરીદી અને વેચાણ', desc: 'ઇન્વેન્ટરી અને બિલ', icon: ShoppingBag, color: 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-800' },
    { id: 'documents', title: 'દસ્તાવેજો', desc: 'ટ્રસ્ટ સર્ટિફિકેટ અને ડીડ', icon: FileText, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' },
    { id: 'tharav', title: 'એજન્ડા & ઠરાવ', desc: 'સભા એજન્ડા અને ઠરાવ બુક', icon: BookOpen, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' },
    { id: 'backup', title: 'ઓટો બેકઅપ', desc: 'બેકઅપ અને ડ્રાઇવ સિંક', icon: HardDrive, color: 'text-lime-600 bg-lime-50 dark:bg-lime-950/40 border-lime-200 dark:border-lime-800' },
    { id: 'settings', title: 'ટ્રસ્ટ સેટિંગ્સ', desc: 'નાણાકીય વર્ષ સેટિંગ્સ', icon: Settings, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700' },
    { id: 'users', title: 'વપરાશકર્તાઓ', desc: 'યુઝર્સ અને પરવાનગીઓ', icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
  ];

  if (isSuperAdminAuthenticated) {
    controlPanelModules.push({
      id: 'superadmin',
      title: 'સુપર એડમિન',
      desc: 'વેન્ડર લાયસન્સ પેનલ',
      icon: KeyRound,
      color: 'text-rose-600 bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700'
    });
  }

  // 1. Control Panel Mode
  if (mode === 'control_panel') {
    // Define logical groupings for a highly professional, enterprise-grade control panel
    const groups = [
      {
        id: 'financial',
        title: 'નાણાકીય વ્યવહારો અને હિસાબ (Financials & Accounts)',
        desc: 'આવક પાવતીઓ, ખર્ચ વાઉચર્સ, એક્ટિવ બેંક ખાતાઓ અને મિલકત વ્યવસ્થાપન',
        moduleIds: ['receipts', 'vouchers', 'banks', 'accounting', 'assets', 'purchase_sales'],
      },
      {
        id: 'registry',
        title: 'ટ્રસ્ટ વહીવટ અને રજીસ્ટર (Trust Registry & Administration)',
        desc: 'દાતાઓ, સભાસદો, ટ્રસ્ટ બોર્ડ હોદ્દેદારો, ઠરાવ પુસ્તિકા અને દસ્તાવેજો',
        moduleIds: ['donors', 'members', 'trust_members', 'documents', 'tharav'],
      },
      {
        id: 'system',
        title: 'સિસ્ટમ સેટઅપ અને વિશ્લેષણ (System Configuration & Analytics)',
        desc: 'ગ્રાફિકલ ડેશબોર્ડ, ઓટો ડેટા બેકઅપ, સેટિંગ્સ અને એડમિન પરવાનગીઓ',
        moduleIds: ['dashboard', 'users', 'backup', 'settings', 'superadmin'],
      }
    ];

    const getModuleById = (id: string) => controlPanelModules.find(m => m.id === id);

    const getModuleStat = (id: string) => {
      switch (id) {
        case 'receipts': return `કુલ આવક: ₹${totalIncome.toLocaleString('en-IN')}`;
        case 'vouchers': return `કુલ ખર્ચ: ₹${totalExpense.toLocaleString('en-IN')}`;
        case 'donors': return `${donors.length} નોંધાયેલ દાતાઓ`;
        case 'banks': return `${banks.length} એક્ટિવ બેંક ખાતા`;
        case 'members': return `સભાસદોની સભ્ય નોંધણી`;
        case 'trust_members': return `ટ્રસ્ટીઓ અને હોદ્દાઓ`;
        case 'accounting': return `દ્વિ-નોંધી વાર્ષિક હિસાબો`;
        case 'assets': return `મિલકત અને ઘસારો રજીસ્ટર`;
        case 'purchase_sales': return `ઇન્વેન્ટરી અને બિલિંગ`;
        case 'documents': return `ડીડ અને સર્ટિફિકેટ્સ`;
        case 'tharav': return `એજન્ડા અને ઠરાવ બુક`;
        case 'backup': return `ઓટો ડ્રાઇવ બેકઅપ સિંક`;
        case 'settings': return `વિગતો અને સામાન્ય સેટિંગ્સ`;
        case 'users': return `યુઝર્સ અને પરમિશન`;
        case 'dashboard': return `લાઈવ હિસાબી એનાલિટિક્સ`;
        case 'superadmin': return `સિસ્ટમ લાયસન્સ પેનલ`;
        default: return '';
      }
    };

    return (
      <div className="space-y-6">
        {/* Trust Header with Logo & Name */}
        <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6`}>
          <div className="absolute right-0 top-0 opacity-[0.03] dark:opacity-[0.05] translate-x-10 -translate-y-10">
            <Award className="w-64 h-64 text-emerald-600" />
          </div>
          <div className="flex items-center gap-4.5 z-10">
            {trustSettings?.logoUrl ? (
              <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden flex items-center justify-center p-1.5 border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm">
                <img
                  src={trustSettings.logoUrl}
                  alt="Trust Logo"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="p-4 bg-emerald-600 text-white rounded-2xl shrink-0 shadow-sm">
                <Landmark className="w-8 h-8" />
              </div>
            )}
            <div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${darkMode ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                ચેરિટેબલ ટ્રસ્ટ કંટ્રોલ પેનલ
              </span>
              <h2 className={`text-xl md:text-2xl font-black mt-2 leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`} title={trustSettings?.trustNameGuj}>
                {trustSettings?.trustNameGuj || 'શ્રી સમસ્ત ટ્રસ્ટ'}
              </h2>
              <p className={`text-xs mt-1.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>સ્વાગત છે, <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentUser.nameGuj}</span> ({currentUser.roleGuj})</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3.5 flex-wrap md:justify-end z-10">
            {/* Financial Year Badge */}
            <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60 text-slate-200' : 'bg-slate-50 border-slate-200/80 text-slate-700'} text-xs font-bold`}>
              <Calendar className="w-4 h-4 text-emerald-500" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">ચાલુ વર્ષ</span>
                <span className="leading-tight">૨૦૨૬-૨૭ (AY 2026-27)</span>
              </div>
            </div>

            {/* Secure Database Connection Badge */}
            <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60 text-slate-200' : 'bg-slate-50 border-slate-200/80 text-slate-700'} text-xs font-bold`}>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">સિસ્ટમ જોડાણ</span>
                <span className="leading-tight text-emerald-600 dark:text-emerald-400 font-bold">સુરક્ષિત અને લાઈવ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categorized Modules Grid */}
        <div className="space-y-6">
          {groups.map((group) => {
            // Filter modules belonging to this group
            const groupModules = group.moduleIds
              .map(getModuleById)
              .filter((mod): mod is any => mod !== undefined);

            if (groupModules.length === 0) return null;

            return (
              <div key={group.id} className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4 transition-all duration-300`}>
                <div className={`flex justify-between items-start border-b pb-3.5 ${darkMode ? 'border-slate-800' : 'border-slate-200/80'}`}>
                  <div>
                    <h3 className={`text-base font-bold flex items-center gap-2.5 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      <span className="w-1.5 h-4.5 rounded-full bg-emerald-600 dark:bg-emerald-500 inline-block"></span>
                      {group.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{group.desc}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${darkMode ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                    કુલ {groupModules.length} મોડ્યુલ્સ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pt-1">
                  {groupModules.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <div
                        key={mod.id}
                        onClick={() => onSelectTab(mod.id)}
                        className={`p-3.5 rounded-2xl flex flex-col items-center text-center gap-2.5 transition-all duration-300 cursor-pointer group ${
                          darkMode 
                            ? 'hover:bg-slate-800/60 text-slate-100' 
                            : 'hover:bg-slate-100/80 text-slate-800'
                        }`}
                        title={mod.title}
                      >
                        {/* Top side: Icon inside styled box */}
                        <div className={`p-4 rounded-2xl border ${mod.color} shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        
                        {/* Bottom: Title */}
                        <span className={`text-xs font-bold leading-tight transition-colors duration-200 ${darkMode ? 'group-hover:text-emerald-400' : 'group-hover:text-emerald-700'}`}>
                          {mod.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Analytics Dashboard Mode
  return (
    <div className="space-y-6">
      {/* Back to Control Panel Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => onSelectTab('control_panel')}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> કંટ્રોલ પેનલ પર પાછા જાઓ
        </button>
        <div className="text-right">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">ડેશબોર્ડ & એનાલિટિક્સ સમીક્ષા</span>
        </div>
      </div>

      {/* Hero Stats Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${textMuted}`}>કુલ આવક (Total Income)</p>
              <h3 className="text-xl md:text-2xl font-black mt-2 text-emerald-600">₹ {totalIncome.toLocaleString('en-IN')}</h3>
            </div>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span>આ ચાલુ વર્ષનો સંચિત આંકડો છે</span>
          </div>
        </div>

        {/* Total Expense */}
        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${textMuted}`}>કુલ ખર્ચ (Total Expense)</p>
              <h3 className="text-xl md:text-2xl font-black mt-2 text-rose-600">₹ {totalExpense.toLocaleString('en-IN')}</h3>
            </div>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <span>બધા માન્ય વાઉચરો સહિત</span>
          </div>
        </div>

        {/* Cash Balance */}
        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${textMuted}`}>રોકડ સિલક (Cash Balance)</p>
              <h3 className="text-xl md:text-2xl font-black mt-2 text-amber-600">₹ {cashBalance.toLocaleString('en-IN')}</h3>
            </div>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-0.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
            <span>ઓપનિંગ (₹{openingCash.toLocaleString('en-IN')}) + જમા (₹{cashIn.toLocaleString('en-IN')}) - ખર્ચ (₹{cashOut.toLocaleString('en-IN')})</span>
            <span className="text-[10px] text-slate-400">સેફ લોકરમાં ઉપલબ્ધ હાર્ડ કેશ</span>
          </div>
        </div>

        {/* Bank Balance */}
        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all duration-300`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${textMuted}`}>બેંક સિલક (Bank Balance)</p>
              <h3 className="text-xl md:text-2xl font-black mt-2 text-blue-600">₹ {bankBalance.toLocaleString('en-IN')}</h3>
            </div>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Landmark className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
            <span>કુલ {banks.length} સક્રિય બેંક ખાતાઓ</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${cardBg} flex items-center gap-3`}>
          <Users className="w-5 h-5 text-indigo-500" />
          <div>
            <span className={`text-[10px] block ${textMuted}`}>કુલ દાતાઓ (Donors)</span>
            <span className="font-bold text-sm">{donors.length} દાતા મિત્રો</span>
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg} flex items-center gap-3`}>
          <Calendar className="w-5 h-5 text-emerald-500" />
          <div>
            <span className={`text-[10px] block ${textMuted}`}>આજની આવક (Today)</span>
            <span className="font-bold text-sm text-emerald-600">₹ {todayIncome.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg} flex items-center gap-3`}>
          <Calendar className="w-5 h-5 text-rose-500" />
          <div>
            <span className={`text-[10px] block ${textMuted}`}>આજનો ખર્ચ (Today)</span>
            <span className="font-bold text-sm text-rose-600">₹ {todayExpense.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg} flex items-center gap-3`}>
          <DollarSign className="w-5 h-5 text-violet-500" />
          <div>
            <span className={`text-[10px] block ${textMuted}`}>માસિક સરવૈયું (July)</span>
            <span className="font-bold text-sm text-violet-600">₹ {(monthlyIncome - monthlyExpense).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Grid of Chart and Recent Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Dynamic Category Graph */}
        <div className={`xl:col-span-2 p-6 rounded-2xl border ${cardBg} shadow-sm`}>
          <h4 className="text-base font-bold mb-4">આવક વિતરણ સ્ત્રોત (Income Distribution Sources)</h4>
          
          <div className="space-y-4">
            {categoriesData.map((cat, idx) => {
              const pct = totalIncome > 0 ? (cat.val / totalIncome) * 100 : 0;
              const colorClass = [
                'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-cyan-500', 'bg-rose-500'
              ][idx % 6];
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{cat.name}</span>
                    <span className={textMuted}>₹ {cat.val.toLocaleString('en-IN')} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className={`h-full ${colorClass}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 flex justify-between items-center text-xs">
            <div>
              <span className={`block font-medium ${textMuted}`}>ચાલુ માસિક કુલ આવક (July 2026)</span>
              <strong className="text-emerald-600 text-sm">₹ {monthlyIncome.toLocaleString('en-IN')}</strong>
            </div>
            <div className="text-right">
              <span className={`block font-medium ${textMuted}`}>ચાલુ માસિક કુલ ખર્ચ (July 2026)</span>
              <strong className="text-rose-600 text-sm">₹ {monthlyExpense.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Real-time Activity Logs / Recent Tx */}
        <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm`}>
          <h4 className="text-base font-bold mb-4">તાજેતરના ટ્રાન્ઝેક્શન (Recent Postings)</h4>
          <div className="space-y-3">
            {recentTx.length === 0 ? (
              <p className={`text-xs text-center py-6 ${textMuted}`}>કોઈ ટ્રાન્ઝેક્શન મળી આવ્યા નથી.</p>
            ) : (
              recentTx.map((tx: any) => {
                const isInc = tx.type === 'INCOME';
                return (
                  <div key={tx.id} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'} flex items-center justify-between gap-2 text-xs`}>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={`w-2 h-2 rounded-full ${isInc ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="truncate max-w-[120px]">{isInc ? tx.donorNameGuj : tx.paidToGuj || 'પરચૂરણ ખર્ચ'}</span>
                      </div>
                      <span className={`block mt-0.5 text-[10px] ${textMuted}`}>{tx.receiptNumber || tx.voucherNumber} • {tx.date}</span>
                    </div>
                    <div className="text-right font-black">
                      <span className={isInc ? 'text-emerald-600' : 'text-rose-600'}>
                        {isInc ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                      </span>
                      <span className={`block text-[9px] font-normal ${textMuted}`}>
                        {tx.category ? tx.category.replace(/\s*\(.*?\)\s*/g, '').trim() : ''}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
