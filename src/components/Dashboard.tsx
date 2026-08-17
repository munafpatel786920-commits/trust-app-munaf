/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard,
  LayoutGrid,
  TrendingUp, 
  TrendingDown, 
  Landmark, 
  Users, 
  Calendar, 
  DollarSign, 
  Wallet, 
  BookOpen,
  ShieldCheck,
  Database,
  ShoppingBag,
  FileText,
  HardDrive,
  Settings,
  UserCheck,
  UserCog,
  FileSpreadsheet,
  ChevronRight,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Receipt,
  CreditCard
} from 'lucide-react';
import { IncomeReceipt, ExpenseVoucher, Donor, BankAccount } from '../types';

interface DashboardProps {
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
  mode?: 'control_panel' | 'dashboard';
}

export default function Dashboard({ receipts, vouchers, donors, banks, currentUser, darkMode, trustSettings, reconciliationList, onSelectTab, mode = 'dashboard' }: DashboardProps) {
  const [chartHoverIndex, setChartHoverIndex] = useState<number | null>(null);

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
  const todayStr = hasTransactionsToday ? realToday : '2026-07-28';

  const todayIncome = activeReceipts.filter(r => r.date === todayStr).reduce((sum, r) => sum + r.amount, 0);
  const todayExpense = activeVouchers.filter(v => v.date === todayStr).reduce((sum, v) => sum + v.amount, 0);

  // Monthly stats
  const currentMonth = todayStr.substring(0, 7);
  const monthlyIncome = activeReceipts.filter(r => r.date.startsWith(currentMonth)).reduce((sum, r) => sum + r.amount, 0);
  const monthlyExpense = activeVouchers.filter(v => v.date.startsWith(currentMonth)).reduce((sum, v) => sum + v.amount, 0);
  const monthlyNet = monthlyIncome - monthlyExpense;

  // Category distribution
  const categoriesMap: { [key: string]: number } = {};
  activeReceipts.forEach(r => {
    const key = r.category.split(' ')[0] || 'સામાન્ય ફંડ';
    categoriesMap[key] = (categoriesMap[key] || 0) + r.amount;
  });

  const categoriesData = Object.entries(categoriesMap)
    .map(([name, val]) => ({ name, val }))
    .sort((a, b) => b.val - a.val);

  // Monthly Trends (Past 6 Months Chart Data)
  const getPastMonthsData = () => {
    const monthGujNames = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઑગસ્ટ', 'સપ્ટેમ્બર', 'ઑક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];
    const list = [];
    
    // We construct 6 months relative to todayStr or current date
    const baseDate = new Date(todayStr.length === 10 ? todayStr : '2026-07-28');
    for (let i = 5; i >= 0; i--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${monthNum}`;
      
      const label = `${monthGujNames[d.getMonth()].substring(0, 5)} ${year}`;
      const shortLabel = monthGujNames[d.getMonth()].substring(0, 4);
      
      const inc = activeReceipts.filter(r => r.date.startsWith(monthKey)).reduce((sum, r) => sum + r.amount, 0);
      const exp = activeVouchers.filter(v => v.date.startsWith(monthKey)).reduce((sum, v) => sum + v.amount, 0);
      
      list.push({ key: monthKey, label, shortLabel, inc, exp, net: inc - exp });
    }
    return list;
  };

  const monthlyTrends = getPastMonthsData();
  const maxTrendVal = Math.max(1, ...monthlyTrends.map(m => Math.max(m.inc, m.exp)));

  // Recent transactions combined
  const recentTx = [
    ...activeReceipts.map(r => ({ ...r, type: 'INCOME', label: 'આવક પાવતી' })),
    ...activeVouchers.map(v => ({ ...v, type: 'EXPENSE', label: 'ખર્ચ વાઉચર' }))
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  if (mode === 'control_panel') {
    return (
      <div className="space-y-6">
        {/* 1. Control Panel Header Banner */}
        <div className={`p-6 rounded-3xl border ${cardBg} shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-5 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20`}>
          <div className="flex items-center gap-4 z-10">
            {trustSettings?.logoUrl ? (
              <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden flex items-center justify-center p-2 border border-slate-200/80 dark:border-slate-800 shrink-0 shadow-md">
                <img
                  src={trustSettings.logoUrl}
                  alt="Trust Logo"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl shrink-0 shadow-md">
                <LayoutDashboard className="w-8 h-8" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  darkMode ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                }`}>
                  🎛️ કંટ્રોલ પેનલ મોડ્યુલ્સ (Control Panel)
                </span>
              </div>
              <h2 className={`text-xl md:text-2xl font-black mt-1 leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {trustSettings?.trustNameGuj || 'ઇખર મસ્જિદ ટ્રસ્ટ , ઇખર'}
              </h2>
              <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                સ્વાગત છે, <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentUser.nameGuj}</span> ({currentUser.roleGuj})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap md:justify-end z-10">
            <div className={`px-4 py-2.5 rounded-2xl border ${
              darkMode ? 'bg-slate-800/80 border-slate-700 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            } flex items-center gap-3 text-xs font-bold shadow-sm`}>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] block text-slate-500 dark:text-slate-400 font-semibold leading-tight uppercase">નાણાકીય વર્ષ (Financial Year)</span>
                <span className="text-xs md:text-sm font-black">{trustSettings?.financialYear || '૨૦૨૬-૨૭ (AY 2026-27)'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Sections with Unified Grid Alignment */}
        <div className="space-y-6">
          {/* Module Section 1: Financials & Accounts */}
          <div className={`p-5 md:p-6 rounded-3xl border ${cardBg} shadow-sm space-y-4`}>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-5 bg-emerald-600 rounded-full" />
                  <h3 className="text-base font-black">નાણાકીય વ્યવહારો અને હિસાબ (Financials & Accounts)</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  આવક પાવતીઓ, ખર્ચ વાઉચર્સ, એક્ટિવ બેંક ખાતાઓ અને મિલકત વ્યવસ્થાપન
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-200/80 dark:border-emerald-800 shrink-0">
                કુલ ૬ મોડ્યુલ્સ
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 py-2">
              <button
                type="button"
                onClick={() => onSelectTab('receipts')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-emerald-50 text-emerald-500 border border-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <TrendingUp className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                  આવક પાવતીઓ
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('vouchers')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-rose-50 text-rose-500 border border-rose-100/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <TrendingDown className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors leading-snug">
                  ખર્ચ વાઉચર્સ
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('banks')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-sky-50 text-sky-500 border border-sky-100/80 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <Landmark className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors leading-snug">
                  બેંક ખાતાઓ
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('accounting')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-purple-50 text-purple-500 border border-purple-100/80 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <BookOpen className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug">
                  દ્વિ-નોંધી નામું
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('assets')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-amber-50 text-amber-500 border border-amber-100/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <Database className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                  સ્થાયી મિલકતો
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('purchase_sales')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-fuchsia-50 text-fuchsia-500 border border-fuchsia-100/80 dark:bg-fuchsia-950/40 dark:text-fuchsia-400 dark:border-fuchsia-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <ShoppingBag className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors leading-snug">
                  ખરીદી અને વેચાણ
                </span>
              </button>
            </div>
          </div>

          {/* Module Section 2: Trust Registry & Administration */}
          <div className={`p-5 md:p-6 rounded-3xl border ${cardBg} shadow-sm space-y-4`}>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-5 bg-emerald-600 rounded-full" />
                  <h3 className="text-base font-black">ટ્રસ્ટ વહીવટ અને રજીસ્ટર (Trust Registry & Administration)</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  દાતાઓ, સભાસદો, ટ્રસ્ટ બોર્ડ હોદ્દેદારો, ઠરાવ પુસ્તિકા અને દસ્તાવેજો
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-200/80 dark:border-emerald-800 shrink-0">
                કુલ ૫ મોડ્યુલ્સ
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 py-2">
              <button
                type="button"
                onClick={() => onSelectTab('donors')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-indigo-50 text-indigo-500 border border-indigo-100/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <Users className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                  દાતાઓ
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('members')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-teal-50 text-teal-500 border border-teal-100/80 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <UserCheck className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug">
                  સભાસદો
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('trust_members')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-cyan-50 text-cyan-500 border border-cyan-100/80 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                  ટ્રસ્ટ હોદ્દેદારો
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('documents')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-sky-50 text-sky-500 border border-sky-100/80 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <FileText className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors leading-snug">
                  દસ્તાવેજો
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('tharav')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-orange-50 text-orange-500 border border-orange-100/80 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <BookOpen className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug">
                  એજન્ડા & ઠરાવ
                </span>
              </button>
            </div>
          </div>

          {/* Module Section 3: System Setup & Configuration */}
          <div className={`p-5 md:p-6 rounded-3xl border ${cardBg} shadow-sm space-y-4`}>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-5 bg-emerald-600 rounded-full" />
                  <h3 className="text-base font-black">સિસ્ટમ સેટઅપ અને વિશ્લેષણ (System Configuration & Analytics)</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ગ્રાફિકલ ડેશબોર્ડ, ઓટો ડેટા બેકઅપ, સેટિંગ્સ અને એડમિન પરવાનગીઓ
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-200/80 dark:border-emerald-800 shrink-0">
                કુલ ૪ મોડ્યુલ્સ
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 py-2">
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-emerald-50 text-emerald-500 border border-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <LayoutGrid className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                  ડેશબોર્ડ & એનાલિટિક્સ
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('users')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-indigo-50 text-indigo-500 border border-indigo-100/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                  વપરાશકર્તાઓ
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('backup')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-lime-50 text-lime-600 border border-lime-100/80 dark:bg-lime-950/40 dark:text-lime-400 dark:border-lime-800/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <HardDrive className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors leading-snug">
                  ઓટો બેકઅપ
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('settings')}
                className="w-full p-2 py-4 md:py-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-slate-100 text-slate-600 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs shrink-0">
                  <Settings className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors leading-snug">
                  ટ્રસ્ટ સેટિંગ્સ
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Trust Dashboard Banner */}
      <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-5`}>
        <div className="flex items-center gap-4 z-10">
          {trustSettings?.logoUrl ? (
            <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden flex items-center justify-center p-1.5 border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm">
              <img
                src={trustSettings.logoUrl}
                alt="Trust Logo"
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shrink-0 shadow-sm">
              <BarChart3 className="w-7 h-7" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                darkMode ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                📊 ટ્રસ્ટ એનાલિટિક્સ અને ડેશબોર્ડ
              </span>
            </div>
            <h2 className={`text-xl md:text-2xl font-black mt-1 leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {trustSettings?.trustNameGuj || 'ઇખર મસ્જિદ ટ્રસ્ટ , ઇખર'}
            </h2>
            <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              સ્વાગત છે, <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentUser.nameGuj}</span> ({currentUser.roleGuj})
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap md:justify-end z-10">
          <div className={`px-4 py-2.5 rounded-2xl border ${
            darkMode ? 'bg-slate-800/80 border-slate-700 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          } flex items-center gap-3 text-xs font-bold shadow-sm`}>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] block text-slate-500 dark:text-slate-400 font-semibold leading-tight uppercase">નાણાકીય વર્ષ (Financial Year)</span>
              <span className="text-xs md:text-sm font-black">{trustSettings?.financialYear || '૨૦૨૬-૨૭ (AY 2026-27)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Summary Cards (સૌથી ઉપર હિસાબી મુખ્ય આંકડા) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Income */}
        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>કુલ આવક (Total Income)</p>
              <h3 className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
                ₹ {totalIncome.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">કુલ {activeReceipts.length} આવક પાવતીઓ</span>
            <span className="font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> જમા
            </span>
          </div>
        </div>

        {/* Card 2: Total Expense */}
        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>કુલ ખર્ચ (Total Expense)</p>
              <h3 className="text-2xl font-black mt-2 text-rose-600 dark:text-rose-400">
                ₹ {totalExpense.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-2xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">કુલ {activeVouchers.length} માન્ય વાઉચરો</span>
            <span className="font-bold text-rose-600 flex items-center gap-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" /> ઉધડ
            </span>
          </div>
        </div>

        {/* Card 3: Cash Balance */}
        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>રોકડ સિલક (Cash Balance)</p>
              <h3 className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400">
                ₹ {cashBalance.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">સેફ લોકરમાં હાર્ડ કૅશ</span>
            <span className="font-bold text-amber-600">ઉપલબ્ધ</span>
          </div>
        </div>

        {/* Card 4: Bank Balance */}
        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>બેંક સિલક (Bank Balance)</p>
              <h3 className="text-2xl font-black mt-2 text-blue-600 dark:text-blue-400">
                ₹ {bankBalance.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Landmark className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">કુલ {banks.length} સક્રિય બેંક એકાઉન્ટ</span>
            <span className="font-bold text-blue-600">બેંક સિલક</span>
          </div>
        </div>
      </div>

      {/* 3. Professional Interactive Charts Section (ઉપર ગ્રાફ અને વિશ્લેષણ) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Monthly Income vs Expense Comparison Bar Chart */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                માસિક આવક વિરુદ્ધ ખર્ચ સરખામણી ગ્રાફ (Monthly Income vs Expense)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                છેલ્લા ૬ મહિનાનો સરખામણી ગ્રાફ (બાર ગ્રાફ ઉપર કર્સર રાખી વિગતો જુઓ)
              </p>
            </div>
            
            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs font-bold shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
                <span>આવક (Income)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-500 inline-block"></span>
                <span>ખર્ચ (Expense)</span>
              </div>
            </div>
          </div>

          {/* Visual SVG / HTML Bar Chart */}
          <div className="pt-4 pb-2">
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-200 dark:border-slate-800 relative">
              
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 dark:opacity-10">
                <div className="border-b border-slate-400 w-full"></div>
                <div className="border-b border-slate-400 w-full"></div>
                <div className="border-b border-slate-400 w-full"></div>
                <div className="border-b border-slate-400 w-full"></div>
              </div>

              {monthlyTrends.map((month, idx) => {
                const incHeightPct = Math.max(6, Math.round((month.inc / maxTrendVal) * 100));
                const expHeightPct = Math.max(6, Math.round((month.exp / maxTrendVal) * 100));
                const isHovered = chartHoverIndex === idx;

                return (
                  <div
                    key={month.key}
                    onMouseEnter={() => setChartHoverIndex(idx)}
                    onMouseLeave={() => setChartHoverIndex(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative z-10"
                  >
                    {/* Hover Tooltip Popup */}
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: -10 }}
                        className="absolute bottom-full mb-2 bg-slate-900 text-white text-[11px] p-2.5 rounded-xl shadow-xl z-30 whitespace-nowrap border border-slate-700 font-sans pointer-events-none"
                      >
                        <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-emerald-400">
                          {month.label}
                        </div>
                        <div className="text-emerald-300">આવક: ₹{month.inc.toLocaleString('en-IN')}</div>
                        <div className="text-rose-300">ખર્ચ: ₹{month.exp.toLocaleString('en-IN')}</div>
                        <div className={`font-bold mt-1 pt-1 border-t border-slate-800 ${month.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          નેટ બાકી: ₹{month.net.toLocaleString('en-IN')}
                        </div>
                      </motion.div>
                    )}

                    {/* Bars Container */}
                    <div className="w-full max-w-[64px] flex items-end justify-center gap-1.5 h-full pt-6">
                      {/* Income Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${incHeightPct}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.08 }}
                        className={`w-1/2 rounded-t-lg transition-all ${
                          isHovered ? 'bg-emerald-400 shadow-lg' : 'bg-emerald-500'
                        } flex items-end justify-center pb-1`}
                      >
                        <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity transform -rotate-90 sm:rotate-0">
                          {month.inc > 0 ? `₹${(month.inc / 1000).toFixed(0)}k` : ''}
                        </span>
                      </motion.div>

                      {/* Expense Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${expHeightPct}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.08 + 0.04 }}
                        className={`w-1/2 rounded-t-lg transition-all ${
                          isHovered ? 'bg-rose-400 shadow-lg' : 'bg-rose-500'
                        } flex items-end justify-center pb-1`}
                      >
                        <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity transform -rotate-90 sm:rotate-0">
                          {month.exp > 0 ? `₹${(month.exp / 1000).toFixed(0)}k` : ''}
                        </span>
                      </motion.div>
                    </div>

                    {/* Month Label */}
                    <div className="mt-2 text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {month.shortLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Summary Bar */}
          <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap justify-between items-center text-xs gap-3">
            <div>
              <span className={`block font-medium ${textMuted}`}>ચાલુ મહિનાની આવક ({currentMonth})</span>
              <strong className="text-emerald-600 text-sm font-black">₹ {monthlyIncome.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className={`block font-medium ${textMuted}`}>ચાલુ મહિનાનો ખર્ચ ({currentMonth})</span>
              <strong className="text-rose-600 text-sm font-black">₹ {monthlyExpense.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className={`block font-medium ${textMuted}`}>માસિક નેટ વધારો (Net Surplus)</span>
              <strong className={`text-sm font-black ${monthlyNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ₹ {monthlyNet.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>

        {/* Chart 2: Income Distribution by Category Progress Donut */}
        <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              આવક વિતરણ સ્ત્રોતો (Income Sources)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              વિવિધ ફંડ/કેટેગરી મુજબ પ્રાપ્ત દાન
            </p>
          </div>

          <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
            {categoriesData.length === 0 ? (
              <p className={`text-xs text-center py-8 ${textMuted}`}>કોઈ વર્ગીકરણ ઉપલબ્ધ નથી.</p>
            ) : (
              categoriesData.map((cat, idx) => {
                const pct = totalIncome > 0 ? (cat.val / totalIncome) * 100 : 0;
                const colors = [
                  'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500'
                ];
                const colorClass = colors[idx % colors.length];

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{cat.name}</span>
                      <span className="font-black text-slate-700 dark:text-slate-300">
                        ₹ {cat.val.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className={`w-full h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className={`h-full ${colorClass}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold">
            <span className={textMuted}>આજની આવક:</span>
            <span className="text-emerald-600">₹ {todayIncome.toLocaleString('en-IN')}</span>
          </div>
        </div>

      </div>

      {/* 4. Recent Transactions & Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions Feed */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black">તાજેતરના ટ્રાન્ઝેક્શન્સ (Recent Financial Postings)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">છેલ્લા નોંધાયેલા પાવતી અને વાઉચરો</p>
            </div>
            <button
              onClick={() => onSelectTab('accounting')}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              રોજમેળ જુઓ <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentTx.length === 0 ? (
              <p className={`text-xs text-center py-6 ${textMuted}`}>કોઈ વ્યવહારો મળી આવ્યા નથી.</p>
            ) : (
              recentTx.map((tx: any) => {
                const isInc = tx.type === 'INCOME';
                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTab(isInc ? 'receipts' : 'vouchers')}
                    className={`p-3 rounded-xl border ${
                      darkMode ? 'bg-slate-850 border-slate-800 hover:bg-slate-800' : 'bg-slate-50/80 border-slate-200/80 hover:bg-white'
                    } flex items-center justify-between gap-3 text-xs transition-all cursor-pointer group`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isInc ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400'
                      }`}>
                        {isInc ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate max-w-[160px] sm:max-w-[240px]">
                            {isInc ? tx.donorNameGuj : tx.paidToGuj || 'પરચૂરણ ખર્ચ'}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase ${
                            isInc ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          }`}>
                            {isInc ? tx.receiptNumber : tx.voucherNumber}
                          </span>
                        </div>
                        <span className={`block mt-0.5 text-[10px] ${textMuted}`}>
                          તારીખ: {tx.date} • ચૂકવણી: {tx.paymentMode} {tx.category ? `• ${tx.category.split(' ')[0]}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-sm font-black ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isInc ? '+' : '-'} ₹ {tx.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black">ઝડપી એક્શન (Quick Actions)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">મુખ્ય હિસાબી કામગીરી માટે શોર્ટકટ</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => onSelectTab('receipts')}
              className="w-full p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer flex items-center justify-between gap-2 font-bold text-xs text-emerald-800 dark:text-emerald-300 group"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4 text-emerald-600 group-hover:text-white" />
                <span>+ નવી આવક પાવતી બનાવો</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => onSelectTab('vouchers')}
              className="w-full p-3 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-600 hover:text-white transition-all cursor-pointer flex items-center justify-between gap-2 font-bold text-xs text-rose-800 dark:text-rose-300 group"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4 text-rose-600 group-hover:text-white" />
                <span>+ નવું ખર્ચ વાઉચર બનાવો</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => onSelectTab('banks')}
              className="w-full p-3 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center justify-between gap-2 font-bold text-xs text-blue-800 dark:text-blue-300 group"
            >
              <div className="flex items-center gap-2.5">
                <Landmark className="w-4 h-4 text-blue-600 group-hover:text-white" />
                <span>બેંક જમા / ઉપાડ વ્યવહાર</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => onSelectTab('accounting')}
              className="w-full p-3 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-600 hover:text-white transition-all cursor-pointer flex items-center justify-between gap-2 font-bold text-xs text-purple-800 dark:text-purple-300 group"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-purple-600 group-hover:text-white" />
                <span>રોજમેળ & કેશબુક તપાસો</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
