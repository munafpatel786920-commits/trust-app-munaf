/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Landmark,
  Plus,
  Search,
  Printer,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Filter,
  ShieldCheck,
  TrendingUp,
  X
} from 'lucide-react';
import { TrustFixedDeposit, BankAccount, TrustSettings } from '../types';
import { printContainer, downloadContainerAsPDF } from '../utils/pdfPrint';

interface FDModuleProps {
  fixedDeposits: TrustFixedDeposit[];
  banks: BankAccount[];
  onAddFD: (fd: Omit<TrustFixedDeposit, 'id'>) => void;
  onEditFD: (fd: TrustFixedDeposit) => void;
  onDeleteFD: (id: string) => void;
  currentUser: { role: string };
  darkMode: boolean;
  trustSettings?: TrustSettings;
}

export default function FDModule({
  fixedDeposits = [],
  banks = [],
  onAddFD,
  onEditFD,
  onDeleteFD,
  currentUser,
  darkMode,
  trustSettings
}: FDModuleProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFD, setEditingFD] = useState<TrustFixedDeposit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPrintRegister, setShowPrintRegister] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Form states
  const [fdNumber, setFdNumber] = useState('');
  const [bankNameGuj, setBankNameGuj] = useState('');
  const [branchGuj, setBranchGuj] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('7.25');
  const [depositDate, setDepositDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [maturityDate, setMaturityDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [maturityAmount, setMaturityAmount] = useState('');
  const [interestPayout, setInterestPayout] = useState<'માસિક (Monthly)' | 'ત્રિમાસિક (Quarterly)' | 'વાર્ષિક (Annual)' | 'પાકતી મુદતે (Cumulative on Maturity)'>('પાકતી મુદતે (Cumulative on Maturity)');
  const [status, setStatus] = useState<'ચાલુ / સક્રિય (Active)' | 'પાકેલ / બાકી ક્લેમ (Matured)' | 'રીન્યુ કરેલ (Renewed)' | 'રોકડમાં વટાવેલ (Closed/Withdrawn)'>('ચાલુ / સક્રિય (Active)');
  const [remarksGuj, setRemarksGuj] = useState('');
  const [certificateNo, setCertificateNo] = useState('');

  // Auto-calculate maturity amount when principal or rate changes
  const handlePrincipalOrRateChange = (p: string, r: string, depDate: string, matDate: string) => {
    const pNum = parseFloat(p) || 0;
    const rNum = parseFloat(r) || 0;
    if (pNum > 0 && rNum > 0 && depDate && matDate) {
      const d1 = new Date(depDate);
      const d2 = new Date(matDate);
      const diffTime = Math.max(0, d2.getTime() - d1.getTime());
      const years = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      const interest = (pNum * rNum * (years || 1)) / 100;
      setMaturityAmount(String(Math.round(pNum + interest)));
    }
  };

  const handleOpenAddModal = () => {
    setEditingFD(null);
    setFdNumber(`FD-${Date.now().toString().slice(-6)}`);
    setBankNameGuj(banks[0]?.bankNameGuj || 'સ્ટેટ બેંક ઓફ ઇન્ડિયા (SBI)');
    setBranchGuj(banks[0]?.branchGuj || 'ઇખર શાખા');
    setPrincipalAmount('');
    setInterestRate('7.25');
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setDepositDate(today);
    setMaturityDate(nextYear.toISOString().split('T')[0]);
    setMaturityAmount('');
    setInterestPayout('પાકતી મુદતે (Cumulative on Maturity)');
    setStatus('ચાલુ / સક્રિય (Active)');
    setRemarksGuj('');
    setCertificateNo('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (fd: TrustFixedDeposit) => {
    setEditingFD(fd);
    setFdNumber(fd.fdNumber);
    setBankNameGuj(fd.bankNameGuj);
    setBranchGuj(fd.branchGuj);
    setPrincipalAmount(String(fd.principalAmount));
    setInterestRate(String(fd.interestRate));
    setDepositDate(fd.depositDate);
    setMaturityDate(fd.maturityDate);
    setMaturityAmount(String(fd.maturityAmount));
    setInterestPayout(fd.interestPayout);
    setStatus(fd.status);
    setRemarksGuj(fd.remarksGuj || '');
    setCertificateNo(fd.certificateNo || '');
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const pAmt = parseFloat(principalAmount) || 0;
    const mAmt = parseFloat(maturityAmount) || (pAmt + (pAmt * (parseFloat(interestRate) || 0) / 100));
    
    if (pAmt <= 0) {
      alert('કૃપા કરીને માન્ય રકમ દાખલ કરો.');
      return;
    }

    if (editingFD) {
      onEditFD({
        ...editingFD,
        fdNumber: fdNumber.trim(),
        bankNameGuj: bankNameGuj.trim(),
        branchGuj: branchGuj.trim(),
        principalAmount: pAmt,
        interestRate: parseFloat(interestRate) || 0,
        depositDate,
        maturityDate,
        maturityAmount: mAmt,
        interestPayout,
        status,
        remarksGuj: remarksGuj.trim(),
        certificateNo: certificateNo.trim()
      });
    } else {
      onAddFD({
        fdNumber: fdNumber.trim() || `FD-${Date.now().toString().slice(-6)}`,
        bankNameGuj: bankNameGuj.trim(),
        branchGuj: branchGuj.trim(),
        principalAmount: pAmt,
        interestRate: parseFloat(interestRate) || 0,
        depositDate,
        maturityDate,
        maturityAmount: mAmt,
        interestPayout,
        status,
        remarksGuj: remarksGuj.trim(),
        certificateNo: certificateNo.trim()
      });
    }

    setShowAddModal(false);
  };

  // Calculations
  const totalPrincipal = fixedDeposits.reduce((sum, fd) => sum + (fd.status === 'ચાલુ / સક્રિય (Active)' ? fd.principalAmount : 0), 0);
  const totalMaturity = fixedDeposits.reduce((sum, fd) => sum + (fd.status === 'ચાલુ / સક્રિય (Active)' ? fd.maturityAmount : 0), 0);
  const totalAnnualInterest = fixedDeposits.reduce((sum, fd) => {
    if (fd.status === 'ચાલુ / સક્રિય (Active)') {
      return sum + (fd.principalAmount * (fd.interestRate || 0) / 100);
    }
    return sum;
  }, 0);

  // Check upcoming maturities (within 60 days)
  const now = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(now.getDate() + 60);

  const maturingSoonFDs = fixedDeposits.filter(fd => {
    if (fd.status !== 'ચાલુ / સક્રિય (Active)') return false;
    const mDate = new Date(fd.maturityDate);
    return mDate >= now && mDate <= sixtyDaysFromNow;
  });

  const filteredFDs = fixedDeposits.filter(fd => {
    const matchesSearch =
      fd.fdNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fd.bankNameGuj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fd.branchGuj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fd.certificateNo && fd.certificateNo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || fd.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePrint = () => {
    printContainer('fd-register-print');
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    await downloadContainerAsPDF('fd-register-print', `Trust_FD_Register_${new Date().toISOString().split('T')[0]}`);
    setIsGeneratingPDF(false);
  };

  const isReadOnly = currentUser.role === 'ReadOnly';

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Landmark className="w-5 h-5" />
            </span>
            ફિક્સ્ડ ડિપોઝિટ & મુદ્દતી રોકાણ રજિસ્ટર (Fixed Deposits)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            ટ્રસ્ટની બેંક એફ.ડી., ટર્મ ડિપોઝિટ, વ્યાજ આવક અને પાકતી મુદતનું સંપૂર્ણ સંચાલન
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowPrintRegister(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            એફ.ડી. રજિસ્ટર પ્રિન્ટ
          </button>

          {!isReadOnly && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              નવી એફ.ડી. ઉમેરો (Add FD)
            </button>
          )}
        </div>
      </div>

      {/* Maturity Alert Banner if any */}
      {maturingSoonFDs.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            <span className="font-bold">ધ્યાન આપો:</span> ટ્રસ્ટની <span className="font-black underline">{maturingSoonFDs.length} એફ.ડી.</span> આગામી ૬૦ દિવસમાં પાકતી મુદતે પહોંચી રહી છે. કૃપા કરીને રિન્યુઅલ અથવા વટાવવા માટે સમિતિમાં ચર્ચા કરો.
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">કુલ સક્રિય રોકાણ (Principal)</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2">
            ₹ {totalPrincipal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {fixedDeposits.filter(f => f.status === 'ચાલુ / સક્રિય (Active)').length} સક્રિય ડિપોઝિટ
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">પાકતી મુદતે કુલ રકમ (Maturity)</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2">
            ₹ {totalMaturity.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">
            મૂળ રકમ + પાકતું વ્યાજ
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">અંદાજિત વાર્ષિક વ્યાજ આવક</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-2">
            ₹ {Math.round(totalAnnualInterest).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            વાર્ષિક અંદાજિત વ્યાજ કમાણી
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">કુલ એફ.ડી. એકાઉન્ટ્સ</span>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {fixedDeposits.length}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">
            બધા બેંક ખાતાઓ સંયુક્ત
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="FD નંબર, બેંક અથવા સર્ટિફિકેટ શોધો..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">બધી સ્થિતિ (All Status)</option>
            <option value="ચાલુ / સક્રિય (Active)">ચાલુ / સક્રિય (Active)</option>
            <option value="પાકેલ / બાકી ક્લેમ (Matured)">પાકેલ (Matured)</option>
            <option value="રીન્યુ કરેલ (Renewed)">રીન્યુ કરેલ (Renewed)</option>
            <option value="રોકડમાં વટાવેલ (Closed/Withdrawn)">વટાવેલ (Closed)</option>
          </select>
        </div>
      </div>

      {/* FD Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">FD નંબર / સર્ટિફિકેટ</th>
                <th className="py-3.5 px-4">બેંક & શાખા</th>
                <th className="py-3.5 px-4 text-right">મૂળ રકમ (Principal)</th>
                <th className="py-3.5 px-4 text-center">વ્યાજ દર</th>
                <th className="py-3.5 px-4 text-center">જમા તારીખ</th>
                <th className="py-3.5 px-4 text-center">પાકતી તારીખ</th>
                <th className="py-3.5 px-4 text-right">પાકતી રકમ</th>
                <th className="py-3.5 px-4 text-center">સ્થિતિ</th>
                {!isReadOnly && <th className="py-3.5 px-4 text-right">એક્શન</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFDs.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 8 : 9} className="text-center py-12 text-slate-400">
                    કોઈ એફ.ડી. રેકોર્ડ મળ્યો નથી.
                  </td>
                </tr>
              ) : (
                filteredFDs.map((fd) => {
                  const isMatured = new Date(fd.maturityDate) <= new Date() && fd.status === 'ચાલુ / સક્રિય (Active)';
                  return (
                    <tr key={fd.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 dark:text-white">{fd.fdNumber}</div>
                        {fd.certificateNo && (
                          <div className="text-[10px] text-slate-400">Cert: {fd.certificateNo}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{fd.bankNameGuj}</div>
                        <div className="text-[10px] text-slate-400">{fd.branchGuj}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        ₹ {fd.principalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-[11px]">
                          {fd.interestRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500">{fd.depositDate}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-bold ${isMatured ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {fd.maturityDate}
                        </span>
                        {isMatured && <div className="text-[9px] text-rose-500 font-bold">પાકેલ છે!</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-blue-600 dark:text-blue-400">
                        ₹ {fd.maturityAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            fd.status === 'ચાલુ / સક્રિય (Active)'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : fd.status === 'પાકેલ / બાકી ક્લેમ (Matured)'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : fd.status === 'રીન્યુ કરેલ (Renewed)'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {fd.status}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(fd)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg"
                              title="સુધારો (Edit)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`શું તમે ખરેખર ${fd.fdNumber} એફ.ડી. ડિલીટ કરવા માંગો છો?`)) {
                                  onDeleteFD(fd.id);
                                }
                              }}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg"
                              title="કાઢી નાખો (Delete)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit FD Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-600" />
                {editingFD ? 'એફ.ડી. વિગત સુધારો' : 'નવી એફ.ડી. ડિપોઝિટ ઉમેરો'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    એફ.ડી. નંબર (FD / A/c No.) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fdNumber}
                    onChange={(e) => setFdNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    સર્ટિફિકેટ / રસીદ નંબર (Certificate No.)
                  </label>
                  <input
                    type="text"
                    value={certificateNo}
                    onChange={(e) => setCertificateNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    બેંક / સંસ્થાનું નામ *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankNameGuj}
                    onChange={(e) => setBankNameGuj(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    શાખા (Branch)
                  </label>
                  <input
                    type="text"
                    value={branchGuj}
                    onChange={(e) => setBranchGuj(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    મૂળ રકમ (Principal Amount ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={principalAmount}
                    onChange={(e) => {
                      setPrincipalAmount(e.target.value);
                      handlePrincipalOrRateChange(e.target.value, interestRate, depositDate, maturityDate);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    વાર્ષિક વ્યાજ દર (% Annual Interest) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={interestRate}
                    onChange={(e) => {
                      setInterestRate(e.target.value);
                      handlePrincipalOrRateChange(principalAmount, e.target.value, depositDate, maturityDate);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    જમા કર્યા તારીખ (Deposit Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={depositDate}
                    onChange={(e) => {
                      setDepositDate(e.target.value);
                      handlePrincipalOrRateChange(principalAmount, interestRate, e.target.value, maturityDate);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    પાકતી તારીખ (Maturity Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={maturityDate}
                    onChange={(e) => {
                      setMaturityDate(e.target.value);
                      handlePrincipalOrRateChange(principalAmount, interestRate, depositDate, e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    પાકતી રકમ (Maturity Amount ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={maturityAmount}
                    onChange={(e) => setMaturityAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-blue-600 dark:text-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    વ્યાજ ચુકવણી પ્રકાર
                  </label>
                  <select
                    value={interestPayout}
                    onChange={(e) => setInterestPayout(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="પાકતી મુદતે (Cumulative on Maturity)">પાકતી મુદતે (Cumulative on Maturity)</option>
                    <option value="વાર્ષિક (Annual)">વાર્ષિક (Annual)</option>
                    <option value="ત્રિમાસિક (Quarterly)">ત્રિમાસિક (Quarterly)</option>
                    <option value="માસિક (Monthly)">માસિક (Monthly)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    એફ.ડી. સ્થિતિ (Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="ચાલુ / સક્રિય (Active)">ચાલુ / સક્રિય (Active)</option>
                    <option value="પાકેલ / બાકી ક્લેમ (Matured)">પાકેલ (Matured)</option>
                    <option value="રીન્યુ કરેલ (Renewed)">રીન્યુ કરેલ (Renewed)</option>
                    <option value="રોકડમાં વટાવેલ (Closed/Withdrawn)">રોકડમાં વટાવેલ (Closed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  વિશેષ નોંધ / હેતુ (Remarks)
                </label>
                <textarea
                  rows={2}
                  value={remarksGuj}
                  onChange={(e) => setRemarksGuj(e.target.value)}
                  placeholder="દા.ત. અનામત ફંડ, એજ્યુકેશન કોર્પસ..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  રદ કરો (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-600/20"
                >
                  {editingFD ? 'સુધારો સાચવો' : 'એફ.ડી. સેવ કરો'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Printable FD Register Modal */}
      {showPrintRegister && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-600" />
                મુદ્દતી થાપણ (FD) રજિસ્ટર પ્રિન્ટ વ્યુ
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isGeneratingPDF ? 'પીડીએફ બની રહી છે...' : 'PDF ડાઉનલોડ'}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  પ્રિન્ટ
                </button>
                <button
                  onClick={() => setShowPrintRegister(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Container */}
            <div id="fd-register-print" className="p-8 bg-white text-black font-sans">
              <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-2xl font-black">{trustSettings?.trustNameGuj || 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ'}</h1>
                <p className="text-xs mt-1 font-semibold">{trustSettings?.addressGuj}</p>
                <p className="text-xs font-semibold">નોંધણી નં: {trustSettings?.regNoGuj || trustSettings?.registrationNumber} | PAN: {trustSettings?.panNumber}</p>
                <h2 className="text-base font-bold mt-3 underline uppercase">બેંક ફિક્સ્ડ ડિપોઝિટ & મુદ્દતી રોકાણ રજિસ્ટર</h2>
                <div className="text-xs font-semibold mt-1">તારીખ: {new Date().toLocaleDateString('gu-IN')}</div>
              </div>

              <table className="w-full text-xs border-collapse border border-black mb-6">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black p-2 text-center">ક્રમ</th>
                    <th className="border border-black p-2 text-left">FD નંબર / Cert</th>
                    <th className="border border-black p-2 text-left">બેંક & શાખા</th>
                    <th className="border border-black p-2 text-right">મૂળ રકમ (₹)</th>
                    <th className="border border-black p-2 text-center">વ્યાજ દર</th>
                    <th className="border border-black p-2 text-center">જમા તારીખ</th>
                    <th className="border border-black p-2 text-center">પાકતી તારીખ</th>
                    <th className="border border-black p-2 text-right">પાકતી રકમ (₹)</th>
                    <th className="border border-black p-2 text-center">સ્થિતિ</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedDeposits.map((fd, idx) => (
                    <tr key={fd.id}>
                      <td className="border border-black p-2 text-center">{idx + 1}</td>
                      <td className="border border-black p-2 font-bold">{fd.fdNumber}</td>
                      <td className="border border-black p-2">{fd.bankNameGuj} ({fd.branchGuj})</td>
                      <td className="border border-black p-2 text-right font-bold">₹ {fd.principalAmount.toLocaleString('en-IN')}</td>
                      <td className="border border-black p-2 text-center">{fd.interestRate}%</td>
                      <td className="border border-black p-2 text-center">{fd.depositDate}</td>
                      <td className="border border-black p-2 text-center">{fd.maturityDate}</td>
                      <td className="border border-black p-2 text-right font-bold">₹ {fd.maturityAmount.toLocaleString('en-IN')}</td>
                      <td className="border border-black p-2 text-center">{fd.status}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={3} className="border border-black p-2 text-right">કુલ (TOTAL):</td>
                    <td className="border border-black p-2 text-right font-black">₹ {totalPrincipal.toLocaleString('en-IN')}</td>
                    <td colSpan={3} className="border border-black p-2"></td>
                    <td className="border border-black p-2 text-right font-black">₹ {totalMaturity.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-2"></td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-center mt-12 pt-8 text-xs font-bold">
                <div className="text-center">
                  <div className="w-40 border-t border-black mb-1"></div>
                  ખજાનચી / એકાઉન્ટન્ટ
                </div>
                <div className="text-center">
                  <div className="w-40 border-t border-black mb-1"></div>
                  મંત્રીશ્રી (Secretary)
                </div>
                <div className="text-center">
                  <div className="w-40 border-t border-black mb-1"></div>
                  પ્રમુખશ્રી / મેનેજીંગ ટ્રસ્ટી
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
