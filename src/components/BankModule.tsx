/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Landmark, ChevronRight, CheckCircle, HelpCircle, ArrowUpRight, ArrowDownLeft, X, Edit3, CheckCircle2, Clock, Filter, FileText, Calculator, Trash2 } from 'lucide-react';
import { BankAccount, BankTransaction, IncomeReceipt, ExpenseVoucher, TrustSettings } from '../types';
import OpeningBalancesModal from './OpeningBalancesModal';

interface BankModuleProps {
  banks: BankAccount[];
  receipts?: IncomeReceipt[];
  vouchers?: ExpenseVoucher[];
  onAddAccount: (acc: Omit<BankAccount, 'id' | 'balance' | 'isActive'>) => void;
  onEditAccount?: (acc: BankAccount) => void;
  onDeleteAccount?: (id: string) => void;
  onAddTransaction: (bankId: string, amount: number, type: 'જમા (Deposit)' | 'ઉપાડ (Withdrawal)', remarks: string) => void;
  currentUser: { role: string };
  darkMode: boolean;
  isCustom?: boolean;
  reconciliationList?: any[];
  onToggleClearStatus?: (id: string, itemData?: any) => void;
  trustSettings?: TrustSettings;
  onSaveSettings?: (updated: TrustSettings) => void;
}

export default function BankModule({
  banks,
  receipts = [],
  vouchers = [],
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onAddTransaction,
  currentUser,
  darkMode,
  isCustom,
  reconciliationList = [],
  onToggleClearStatus,
  trustSettings,
  onSaveSettings
}: BankModuleProps) {
  const [showAddAccForm, setShowAddAccForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [showTxForm, setShowTxForm] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState('');

  // Form states account
  const [bankNameGuj, setBankNameGuj] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchGuj, setBranchGuj] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [openingBalanceInput, setOpeningBalanceInput] = useState('0');

  // Form states transaction
  const [txBankId, setTxBankId] = useState('');
  const [txType, setTxType] = useState<'જમા (Deposit)' | 'ઉપાડ (Withdrawal)'>('જમા (Deposit)');
  const [txAmount, setTxAmount] = useState('');
  const [txRemarks, setTxRemarks] = useState('');

  const handleStartAddAccount = () => {
    setEditingBank(null);
    setBankNameGuj('');
    setAccountNumber('');
    setBranchGuj('');
    setIfscCode('');
    setOpeningBalanceInput('0');
    setShowAddAccForm(true);
  };

  const handleStartEditAccount = (b: BankAccount) => {
    setEditingBank(b);
    setBankNameGuj(b.bankNameGuj);
    setAccountNumber(b.accountNumber);
    setBranchGuj(b.branchGuj || '');
    setIfscCode(b.ifscCode || '');
    setOpeningBalanceInput(String(b.openingBalance ?? 0));
    setShowAddAccForm(true);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankNameGuj || !accountNumber || !ifscCode) {
      alert('મહેરબાની કરીને બધી જરૂરી માહિતી ભરો.');
      return;
    }

    const parsedOpening = parseFloat(openingBalanceInput) || 0;

    if (editingBank && onEditAccount) {
      onEditAccount({
        ...editingBank,
        bankNameGuj,
        accountNumber,
        branchGuj: branchGuj || 'મુખ્ય બ્રાંચ',
        ifscCode: ifscCode.toUpperCase(),
        openingBalance: parsedOpening
      });
      alert(`✓ બેંક ખાતું "${bankNameGuj}" ની વિગતો અને પ્રારંભિક શિલક સુધારવામાં આવી છે.`);
    } else {
      onAddAccount({
        bankNameGuj,
        accountNumber,
        branchGuj: branchGuj || 'મુખ્ય બ્રાંચ',
        ifscCode: ifscCode.toUpperCase(),
        openingBalance: parsedOpening
      });
    }

    setBankNameGuj('');
    setAccountNumber('');
    setBranchGuj('');
    setIfscCode('');
    setOpeningBalanceInput('0');
    setEditingBank(null);
    setShowAddAccForm(false);
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0) {
      alert('સાચી રકમ ભરો.');
      return;
    }
    if (!txBankId) {
      alert('બેંક ખાતું પસંદ કરો.');
      return;
    }

    onAddTransaction(txBankId, parseFloat(txAmount), txType, txRemarks || 'બેંક વ્યવહાર નોંધણી');

    setTxAmount('');
    setTxRemarks('');
    setShowTxForm(false);
  };

  const handleClearStatus = (item: any) => {
    if (onToggleClearStatus) {
      onToggleClearStatus(item.id, item);
    }
  };

  // State for Cheque Reconciliation Panel filters
  const [reconFilter, setReconFilter] = useState<'all' | 'donor_cheque' | 'expense_cheque' | 'pending' | 'cleared'>('all');
  const [reconSearch, setReconSearch] = useState('');

  // Unify all non-cash Receipts + non-cash Vouchers + Bank Transactions
  const activeReceipts = (receipts || []).filter(
    r => !r.isDeleted && !r.donorNameGuj?.includes('ડેમો') && r.chequeNumber !== '987654' && !r.remarksGuj?.includes('ડેમો')
  );
  const activeVouchers = (vouchers || []).filter(v => !v.isDeleted);

  // Map for status lookup from stored reconciliationList
  const reconMap = new Map<string, any>();
  reconciliationList.forEach(item => {
    reconMap.set(item.id, item);
    if (item.refId) reconMap.set(item.refId, item);
  });

  const unifiedList: any[] = [];

  // 1. Donor Cheques / Bank Transfers from Income Receipts
  activeReceipts.forEach(r => {
    const isBankOrCheque = (r.paymentMode && r.paymentMode !== 'રોકડ (Cash)') || Boolean(r.chequeNumber);
    if (isBankOrCheque) {
      const matchedBank = banks.find(b => b.id === r.bankId);
      const bankLabel = matchedBank ? matchedBank.bankNameGuj.split(' ')[0] : 'બેંક';
      const existing = reconMap.get(r.id) || reconMap.get('rcp-' + r.id);

      unifiedList.push({
        id: existing?.id || 'rcp-' + r.id,
        refId: r.id,
        date: r.date,
        docType: r.paymentMode === 'ચેક (Cheque)' ? 'દાન ચેક (Donor Cheque)' : 'આવક બેંક (Bank/Online)',
        sourceType: 'donor_cheque',
        bank: bankLabel,
        num: r.chequeNumber || r.receiptNumber || '-',
        amount: r.amount,
        partyName: r.donorNameGuj,
        category: r.category ? r.category.split(' ')[0] : 'દાન',
        desc: `દાન: ${r.donorNameGuj}`,
        status: existing?.status || 'બાકી (Pending)',
        type: 'જમા (Deposit)'
      });
    }
  });

  // 2. Expense Cheques / Bank Transfers from Expense Vouchers
  activeVouchers.forEach(v => {
    const isBankOrCheque = (v.paymentMode && v.paymentMode !== 'રોકડ (Cash)') || Boolean(v.chequeNumber);
    if (isBankOrCheque) {
      const matchedBank = banks.find(b => b.id === v.bankId);
      const bankLabel = matchedBank ? matchedBank.bankNameGuj.split(' ')[0] : 'બેંક';
      const existing = reconMap.get(v.id) || reconMap.get('vch-' + v.id);

      unifiedList.push({
        id: existing?.id || 'vch-' + v.id,
        refId: v.id,
        date: v.date,
        docType: v.paymentMode === 'ચેક (Cheque)' ? 'ખર્ચ ચેક (Expense Cheque)' : 'જાવક બેંક (Bank/Online)',
        sourceType: 'expense_cheque',
        bank: bankLabel,
        num: v.chequeNumber || v.voucherNumber || '-',
        amount: v.amount,
        partyName: v.paidToGuj,
        category: v.category ? v.category.split(' ')[0] : 'ખર્ચ',
        desc: `ખર્ચ ચુકવણી: ${v.paidToGuj}`,
        status: existing?.status || 'બાકી (Pending)',
        type: 'ઉપાડ (Withdrawal)'
      });
    }
  });

  // 3. Manual Contra / Bank Transactions
  reconciliationList.forEach(item => {
    if (!item.refId && !item.id.startsWith('rcp-') && !item.id.startsWith('vch-')) {
      unifiedList.push({
        ...item,
        status: item.status || 'બાકી (Pending)',
        sourceType: 'contra',
        partyName: item.desc || 'બેંક કન્ટ્રા વ્યવહાર',
        category: 'બેંક (Bank)'
      });
    }
  });

  unifiedList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Stats
  const donorChequeCount = unifiedList.filter(u => u.type === 'જમા (Deposit)').length;
  const donorChequeSum = unifiedList.filter(u => u.type === 'જમા (Deposit)').reduce((sum, u) => sum + u.amount, 0);
  const expenseChequeCount = unifiedList.filter(u => u.type === 'ઉપાડ (Withdrawal)').length;
  const expenseChequeSum = unifiedList.filter(u => u.type === 'ઉપાડ (Withdrawal)').reduce((sum, u) => sum + u.amount, 0);
  const pendingCount = unifiedList.filter(u => u.status === 'બાકી (Pending)' || u.status === 'Uncleared').length;
  const pendingSum = unifiedList.filter(u => u.status === 'બાકી (Pending)' || u.status === 'Uncleared').reduce((sum, u) => sum + u.amount, 0);
  const clearedCount = unifiedList.filter(u => u.status === 'ક્લિયર થયેલ' || u.status === 'Cleared').length;

  // Filtered List
  const filteredRecon = unifiedList.filter(item => {
    if (reconFilter === 'donor_cheque' && item.type !== 'જમા (Deposit)') return false;
    if (reconFilter === 'expense_cheque' && item.type !== 'ઉપાડ (Withdrawal)') return false;
    if (reconFilter === 'pending' && item.status !== 'બાકી (Pending)' && item.status !== 'Uncleared') return false;
    if (reconFilter === 'cleared' && item.status !== 'ક્લિયર થયેલ' && item.status !== 'Cleared') return false;

    if (reconSearch.trim()) {
      const q = reconSearch.toLowerCase();
      const matchNum = (item.num || '').toLowerCase().includes(q);
      const matchParty = (item.partyName || '').toLowerCase().includes(q);
      const matchDesc = (item.desc || '').toLowerCase().includes(q);
      const matchBank = (item.bank || '').toLowerCase().includes(q);
      return matchNum || matchParty || matchDesc || matchBank;
    }
    return true;
  });

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black">બેંક વ્યવસ્થાપન અને સમાધાન (Bank Ledger & Reconciliation)</h2>
          <p className={`text-xs ${textMuted}`}>ટ્રસ્ટના બેંક ખાતાઓ, બેંક બેલેન્સ રજીસ્ટર, રોકડ ડિપોઝીટ, ઉપાડ અને ચેક ક્લિયરિંગ સમાધાન.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentUser.role === 'Admin' && (
            <button
              type="button"
              onClick={() => setShowOpeningModal(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="રોકડ અને બેંક પ્રારંભિક શિલક સેટ કરો"
            >
              <Calculator className="w-4 h-4" /> પ્રારંભિક શિલક (Opening Balances)
            </button>
          )}
          {currentUser.role === 'Admin' && (
            <button
              id="btn-add-bank-acc"
              onClick={handleStartAddAccount}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> નવું બેંક ખાતું ઉમેરો
            </button>
          )}
          {currentUser.role !== 'ReadOnly' && (
            <button
              id="btn-add-bank-tx"
              onClick={() => setShowTxForm(!showTxForm)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
            >
              રોકડ જમા / ઉપાડ કરો
            </button>
          )}
        </div>
      </div>

      {/* Opening Balances Modal */}
      {showOpeningModal && (
        <OpeningBalancesModal
          isOpen={showOpeningModal}
          onClose={() => setShowOpeningModal(false)}
          trustSettings={trustSettings}
          banks={banks}
          darkMode={darkMode}
          currentUserRole={currentUser.role}
          onSaveOpeningBalances={(newCashOpening, bankOpenings) => {
            // Update trustSettings cash opening
            if (trustSettings && onSaveSettings) {
              onSaveSettings({
                ...trustSettings,
                openingCashBalance: newCashOpening
              });
            }
            // Update each bank opening
            if (onEditAccount) {
              banks.forEach(b => {
                const newOpening = bankOpenings[b.id];
                if (newOpening !== undefined && newOpening !== b.openingBalance) {
                  onEditAccount({
                    ...b,
                    openingBalance: newOpening
                  });
                }
              });
            }
          }}
        />
      )}

      {/* Grid of Bank accounts and Add Bank Form */}
      {showAddAccForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border ${cardBg} max-w-xl mx-auto`}
        >
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h3 className="font-bold text-sm text-indigo-600 flex items-center gap-2">
              {editingBank ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingBank ? 'બેંક ખાતાની વિગતો સુધારો (Edit Bank Account Details)' : 'નવું બેંક ખાતું રજીસ્ટર કરો (Register Bank Account)'}
            </h3>
            <button onClick={() => { setShowAddAccForm(false); setEditingBank(null); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">બેંકનું નામ *</label>
              <input
                type="text"
                placeholder="દા.ત. સ્ટેટ બેંક ઓફ ઇન્ડિયા"
                value={bankNameGuj}
                onChange={(e) => setBankNameGuj(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">ખાતા નંબર *</label>
                <input
                  type="text"
                  placeholder="Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">IFSC કોડ *</label>
                <input
                  type="text"
                  placeholder="IFSC Code"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">શાખાનું નામ</label>
                <input
                  type="text"
                  placeholder="બ્રાન્ચનું નામ અને સરનામું"
                  value={branchGuj}
                  onChange={(e) => setBranchGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-emerald-700 dark:text-emerald-400">પ્રારંભિક શિલક (Opening Balance ₹) *</label>
                <input
                  type="number"
                  placeholder="0"
                  value={openingBalanceInput}
                  onChange={(e) => setOpeningBalanceInput(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 ${inputBg}`}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => { setShowAddAccForm(false); setEditingBank(null); }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                રદ કરો (Cancel)
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {editingBank ? 'ફેરફાર સેવ કરો (Update Bank)' : 'ખાતું સેવ કરો (Save Account)'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Add Bank Transaction Form */}
      {showTxForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border ${cardBg} max-w-xl mx-auto`}
        >
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h3 className="font-bold text-sm text-emerald-600">રોકડ જમા / ઉપાડ એન્ટ્રી (Contra Bank Transaction Form)</h3>
            <button onClick={() => setShowTxForm(false)} className="text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">બેંક ખાતું પસંદ કરો *</label>
                <select
                  value={txBankId}
                  onChange={(e) => setTxBankId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                >
                  <option value="">-- સિલેક્ટ કરો --</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.bankNameGuj} ({b.accountNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">વ્યવહાર પ્રકાર (Contra Type) *</label>
                <select
                  value={txType}
                  onChange={(e: any) => setTxType(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                >
                  <option value="જમા (Deposit)">બેંકમાં રોકડ જમા (Contra Deposit)</option>
                  <option value="ઉપાડ (Withdrawal)">બેંકમાંથી રોકડ ઉપાડ (Contra Withdrawal)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">રકમ (Amount in ₹) *</label>
              <input
                type="number"
                placeholder="ટ્રાન્ઝેકશન રકમ ભરો"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">નોંધ / વિગત (Particulars/Narration)</label>
              <input
                type="text"
                placeholder="દા.ત. ઓફિસ કેશ માટે એસબીઆઈ બેંકમાંથી ઉપાડ્યા"
                value={txRemarks}
                onChange={(e) => setTxRemarks(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowTxForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">રદ કરો</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">વ્યવહાર લાગુ કરો</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Bank Account balances cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banks.length === 0 && (
          <div className={`col-span-full p-8 rounded-2xl border text-center ${cardBg}`}>
            <Landmark className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">કોઈ બેંક ખાતું ઉમેરેલ નથી (No Bank Accounts)</h4>
            <p className={`text-xs mt-1 ${textMuted}`}>હજુ સુધી કોઈ બેંક ખાતું સેટ કરેલ નથી. નવું બેંક ખાતું ઉમેરવા માટે ઉપર "નવું બેંક ખાતું ઉમેરો" બટન પર ક્લિક કરો.</p>
          </div>
        )}
        {banks.map(b => (
          <div key={b.id} className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Landmark className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="font-bold text-sm">{b.bankNameGuj}</h4>
                  <span className={`text-[10px] ${textMuted}`}>{b.branchGuj}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full">સક્રિય (Active)</span>
                {currentUser.role === 'Admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEditAccount(b)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
                      title="બેંક ખાતા વિગતો સુધારો (Edit Bank Account)"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {onDeleteAccount && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`${b.bankNameGuj} (${b.accountNumber}) ખાતું રદ કરવા માંગો છો?`)) {
                            onDeleteAccount(b.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                        title="બેંક ખાતું રદ કરો (Delete Bank Account)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <span className={`block text-[10px] ${textMuted}`}>ખાતા નંબર (Account Number)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{b.accountNumber}</span>
              </div>
              <div>
                <span className={`block text-[10px] ${textMuted}`}>IFSC કોડ</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{b.ifscCode}</span>
              </div>
            </div>

            <div className="border-t pt-3 flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
              <div className="flex justify-between items-center text-xs">
                <span className={`text-[11px] font-semibold ${textMuted}`}>પ્રારંભિક શિલક (Opening):</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹ {(b.openingBalance ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">ચાલુ સિલક (Book Balance):</span>
                <strong className="text-lg text-indigo-600 dark:text-indigo-400 font-black">₹ {b.balance.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bank Reconciliation module statement list */}
      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-5`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Landmark className="w-5 h-5" /> ચેક અને બેંક રિકન્સિલિયેશન પેનલ (Cheque Reconciliation Panel)
            </h3>
            <p className={`text-xs ${textMuted} mt-0.5`}>
              દાનવીરોના ચેક પાવતીઓ (Donor Cheques), ખર્ચ ચુકવણી ચેક (Payment Cheques) અને બેંક વટાવ ક્લિયરન્સ રજિસ્ટર.
            </p>
          </div>
        </div>

        {/* Stats summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className={`block text-[10px] font-bold ${textMuted}`}>કુલ ચેક / બેંક વ્યવહારો</span>
            <div className="text-base font-black text-slate-800 dark:text-slate-100 mt-1">
              {unifiedList.length} <span className="text-xs font-normal text-slate-500">વ્યવહાર</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400">📥 દાન જમા ચેક (Donor In)</span>
            <div className="text-base font-black text-emerald-800 dark:text-emerald-300 mt-1">
              ₹ {donorChequeSum.toLocaleString('en-IN')} <span className="text-[10px] text-emerald-600 font-bold">({donorChequeCount})</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
            <span className="block text-[10px] font-bold text-rose-700 dark:text-rose-400">📤 ખર્ચ જાવક ચેક (Payment Out)</span>
            <div className="text-base font-black text-rose-800 dark:text-rose-300 mt-1">
              ₹ {expenseChequeSum.toLocaleString('en-IN')} <span className="text-[10px] text-rose-600 font-bold">({expenseChequeCount})</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-400">⏳ ક્લિયરિંગ બાકી (Pending)</span>
            <div className="text-base font-black text-amber-800 dark:text-amber-300 mt-1">
              ₹ {pendingSum.toLocaleString('en-IN')} <span className="text-[10px] text-amber-600 font-bold">({pendingCount})</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setReconFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                reconFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              બધા ({unifiedList.length})
            </button>
            <button
              type="button"
              onClick={() => setReconFilter('donor_cheque')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                reconFilter === 'donor_cheque'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50'
              }`}
            >
              📥 દાન ચેક ({donorChequeCount})
            </button>
            <button
              type="button"
              onClick={() => setReconFilter('expense_cheque')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                reconFilter === 'expense_cheque'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-50'
              }`}
            >
              📤 ખર્ચ ચેક ({expenseChequeCount})
            </button>
            <button
              type="button"
              onClick={() => setReconFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                reconFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-50'
              }`}
            >
              ⏳ બાકી ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setReconFilter('cleared')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                reconFilter === 'cleared'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50'
              }`}
            >
              ✓ ક્લિયર થયેલ ({clearedCount})
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ચેક નં, પાર્ટી કે બેંક શોધો..."
              value={reconSearch}
              onChange={(e) => setReconSearch(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs ${inputBg} border focus:ring-0`}
            />
          </div>
        </div>

        {/* Reconciliation Table */}
        <div className="overflow-x-auto text-xs border rounded-xl dark:border-slate-800">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/60">
                <th className="p-3">તારીખ</th>
                <th className="p-3">પ્રકાર / સ્ત્રોત</th>
                <th className="p-3">બેંક</th>
                <th className="p-3">ચેક / રેફરન્સ નં</th>
                <th className="p-3">દાનવીર / પાર્ટી વિગત</th>
                <th className="p-3 text-right">રકમ</th>
                <th className="p-3 text-center">રીકોન સ્ટેટસ (Click to Toggle)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredRecon.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 whitespace-nowrap font-mono">{item.date}</td>
                  <td className="p-3 whitespace-nowrap">
                    {item.type === 'જમા (Deposit)' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                        📥 દાન ચેક
                      </span>
                    ) : item.type === 'ઉપાડ (Withdrawal)' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 inline-flex items-center gap-1">
                        📤 ખર્ચ ચેક
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1">
                        🔄 કન્ટ્રા
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">{item.bank}</td>
                  <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {item.num !== '-' ? `№ ${item.num}` : '-'}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{item.partyName}</div>
                    <div className="text-[10px] text-slate-500 italic">{item.category}</div>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {item.type === 'જમા (Deposit)' ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+ ₹ {item.amount.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="font-bold text-rose-600 dark:text-rose-400">- ₹ {item.amount.toLocaleString('en-IN')}</span>
                    )}
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleClearStatus(item)}
                      title="ક્લિયરન્સ સ્ટેટસ બદલવા માટે ક્લિક કરો"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm ${
                        item.status === 'ક્લિયર થયેલ' || item.status === 'Cleared'
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {item.status === 'ક્લિયર થયેલ' || item.status === 'Cleared' ? (
                        <><CheckCircle className="w-3.5 h-3.5" /> ✓ ક્લિયર થયેલ (Cleared)</>
                      ) : (
                        <><Clock className="w-3.5 h-3.5" /> ⏳ બાકી (Pending)</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRecon.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    કોઈ ચેક અથવા બેંક રિકન્સિલિયેશન રેકોર્ડ મળ્યા નથી (No reconciliation entries found)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
