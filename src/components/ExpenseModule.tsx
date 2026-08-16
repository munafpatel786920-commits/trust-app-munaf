/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Printer, Trash2, Eye, X, Award, ArrowLeft, Download, Loader2, Edit3, CheckCircle2 } from 'lucide-react';
import { ExpenseVoucher, ExpenseCategory, BankAccount, TrustSettings } from '../types';
import { downloadContainerAsPDF, printContainer } from '../utils/pdfPrint';

interface ExpenseModuleProps {
  vouchers: ExpenseVoucher[];
  banks: BankAccount[];
  onAddVoucher: (voucher: Omit<ExpenseVoucher, 'id' | 'voucherNumber'>) => void;
  onEditVoucher?: (voucher: ExpenseVoucher) => void;
  onDeleteVoucher: (id: string) => void;
  currentUser: { nameGuj: string; role: string };
  darkMode: boolean;
  trustSettings?: TrustSettings;
}

export default function ExpenseModule({ vouchers, banks, onAddVoucher, onEditVoucher, onDeleteVoucher, currentUser, darkMode, trustSettings }: ExpenseModuleProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<ExpenseVoucher | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<ExpenseVoucher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Close modal on Escape key or Browser Back button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedVoucher(null);
      }
    };

    if (selectedVoucher) {
      window.addEventListener('keydown', handleKeyDown);
      window.history.pushState({ modalOpen: true }, '');

      const handlePopState = () => {
        setSelectedVoucher(null);
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [selectedVoucher]);

  const handleDownloadPDF = async () => {
    if (!selectedVoucher) return;
    setIsGeneratingPDF(true);
    await downloadContainerAsPDF('printable-voucher-container', `Voucher_${selectedVoucher.voucherNumber}`);
    setIsGeneratingPDF(false);
  };

  const handlePrintVoucher = () => {
    printContainer('printable-voucher-container');
  };

  // Form states
  const [voucherDate, setVoucherDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customVoucherNum, setCustomVoucherNum] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [defaultCategoryRenames] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('default_category_renames');
    return saved ? JSON.parse(saved) : {};
  });

  const [category, setCategory] = useState<ExpenseCategory>(() => {
    return (defaultCategoryRenames['ઓફિસ ખર્ચ (Office)'] || 'ઓફિસ ખર્ચ (Office)') as ExpenseCategory;
  });
  const [amount, setAmount] = useState('');
  const [paidToGuj, setPaidToGuj] = useState('');
  const [paymentMode, setPaymentMode] = useState<'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)'>('રોકડ (Cash)');
  const [bankId, setBankId] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [remarksGuj, setRemarksGuj] = useState('');
  const [approvedByGuj, setApprovedByGuj] = useState('રમણલાલ શાહ (ટ્રસ્ટી)');

  // Next voucher number preview
  const nextVoucherSeq = (() => {
    const highestNum = vouchers.reduce((max, v) => {
      const match = v.voucherNumber?.match(/\d+$/);
      const num = match ? parseInt(match[0], 10) : 0;
      return Math.max(max, isNaN(num) ? 0 : num);
    }, 0);
    const seq = Math.max(highestNum + 1, vouchers.length + 1);
    return `EX-2026-${String(seq).padStart(4, '0')}`;
  })();

  const [customExpenseCats, setCustomExpenseCats] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_expense_categories');
    return saved ? JSON.parse(saved) : [];
  });

  const DEFAULT_EXPENSE_CATS: ExpenseCategory[] = [
    'સભાસદ બેંક લોન EMI (Bank EMI Payment)',
    'પગાર (Salary)',
    'વીજળી બિલ (Electricity)',
    'પાણી બિલ (Water)',
    'ઓફિસ ખર્ચ (Office)',
    'મેન્ટેનન્સ (Maintenance)',
    'મુસાફરી ખર્ચ (Travel)',
    'બેંક લોન હપ્તા ભરપાઈ (Bank Loan EMI)',
    'બેંક ચાર્જ (Bank Charges)',
    'અન્ય ખર્ચ (Other)'
  ];

  const categories = Array.from(new Set([
    ...DEFAULT_EXPENSE_CATS.map(cat => defaultCategoryRenames[cat] || cat),
    ...customExpenseCats
  ])) as ExpenseCategory[];

  const handleAddNewCategory = () => {
    const newCat = prompt('નવું ખર્ચ ખાતું / શ્રેણીનું નામ દાખલ કરો (Enter New Expense Account/Category Name):');
    if (newCat && newCat.trim()) {
      const trimmed = newCat.trim();
      if (categories.includes(trimmed)) {
        alert('આ ખાતું અથવા શ્રેણી પહેલેથી જ અસ્તિત્વમાં છે.');
        return;
      }
      const updated = [...customExpenseCats, trimmed];
      setCustomExpenseCats(updated);
      localStorage.setItem('custom_expense_categories', JSON.stringify(updated));
      setCategory(trimmed);
      alert(`✓ નવું ખર્ચ ખાતું "${trimmed}" સફળતાપૂર્વક ઉમેરવામાં આવ્યું છે.`);
    }
  };

  const filteredVouchers = vouchers.filter(v => {
    if (v.isDeleted) return false;
    const query = searchQuery.toLowerCase();
    return (
      v.voucherNumber.toLowerCase().includes(query) ||
      v.paidToGuj.toLowerCase().includes(query) ||
      v.category.toLowerCase().includes(query) ||
      (v.remarksGuj && v.remarksGuj.toLowerCase().includes(query))
    );
  });

  const handleStartEdit = (v: ExpenseVoucher) => {
    setEditingVoucher(v);
    setVoucherDate(v.date || new Date().toISOString().split('T')[0]);
    setCustomVoucherNum(v.voucherNumber || '');
    setCategory(v.category);
    setAmount(String(v.amount));
    setPaidToGuj(v.paidToGuj);
    setPaymentMode(v.paymentMode);
    setBankId(v.bankId || '');
    setChequeNumber(v.chequeNumber || '');
    setRemarksGuj(v.remarksGuj || '');
    if (v.approvedByGuj) setApprovedByGuj(v.approvedByGuj);
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('મહેરબાની કરીને સાચી રકમ (Amount) દાખલ કરો.');
      return;
    }
    if (!paidToGuj.trim()) {
      alert('ચૂકવણી મેળવનારનું નામ દાખલ કરો.');
      return;
    }

    if (paymentMode !== 'રોકડ (Cash)' && banks.length > 0 && !bankId) {
      alert('મહેરબાની કરીને બેંક ખાતું પસંદ કરો.');
      return;
    }

    const generatedNum = customVoucherNum.trim() || nextVoucherSeq;

    if (editingVoucher && onEditVoucher) {
      onEditVoucher({
        ...editingVoucher,
        date: voucherDate,
        category,
        amount: parsedAmount,
        paidToGuj: paidToGuj.trim(),
        paymentMode,
        bankId: paymentMode !== 'રોકડ (Cash)' ? bankId : undefined,
        chequeNumber: paymentMode === 'ચેક (Cheque)' ? chequeNumber : undefined,
        remarksGuj: remarksGuj || `${category} ખર્ચ ચુકવણી`,
        approvedByGuj: approvedByGuj || currentUser.nameGuj
      });
      setEditingVoucher(null);
      setSuccessNotice(`✓ ખર્ચ વાઉચર નં. ${editingVoucher.voucherNumber} સફળતાપૂર્વક અપડેટ થયું છે!`);
    } else {
      (onAddVoucher as any)({
        date: voucherDate || new Date().toISOString().split('T')[0],
        voucherNumber: generatedNum,
        category,
        amount: parsedAmount,
        paidToGuj: paidToGuj.trim(),
        paymentMode,
        bankId: paymentMode !== 'રોકડ (Cash)' ? bankId : undefined,
        chequeNumber: paymentMode === 'ચેક (Cheque)' ? chequeNumber : undefined,
        remarksGuj: remarksGuj || `${category} ખર્ચ ચુકવણી`,
        approvedByGuj: approvedByGuj || currentUser.nameGuj,
        operatorGuj: currentUser.nameGuj
      });
      setSuccessNotice(`✓ નવું ખર્ચ વાઉચર નં. ${generatedNum} સફળતાપૂર્વક જનરેટ થઈ ગયું છે!`);
    }

    setTimeout(() => setSuccessNotice(null), 5000);

    // Reset Form
    setAmount('');
    setPaidToGuj('');
    setRemarksGuj('');
    setChequeNumber('');
    setBankId('');
    setCustomVoucherNum('');
    setEditingVoucher(null);
    setShowAddForm(false);
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Module Title and add action */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-rose-600">ખર્ચ વાઉચર્સ (Expense Vouchers Register)</h2>
          <p className={`text-xs ${textMuted}`}>ટ્રસ્ટના તમામ દૈનિક અને નિયમિત વહીવટી ખર્ચાઓની પરવાનગી અને વાઉચર વિગતો અહીં નોંધાય છે.</p>
        </div>
        <div>
          {currentUser.role !== 'ReadOnly' && (
            <button
              id="btn-add-voucher"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> નવું વાઉચર ઉમેરો (New Voucher)
            </button>
          )}
        </div>
      </div>

      {/* Notification banner */}
      {successNotice && (
        <div className="p-4 rounded-xl bg-rose-600 text-white font-bold text-sm shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-white hover:text-rose-100 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Conditional Add Form or List View */}
      {showAddForm ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border ${cardBg} shadow-sm max-w-4xl mx-auto`}
        >
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
            <div>
              <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
                <Award className="w-5 h-5" /> {editingVoucher ? 'ખર્ચ વાઉચર સુધારો (Edit Payment Voucher)' : 'નવું ખર્ચ વાઉચર ફોર્મ (New Payment Voucher Entry)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                વાઉચર ક્રમાંક: <span className="font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">{editingVoucher ? editingVoucher.voucherNumber : nextVoucherSeq}</span>
              </p>
            </div>
            <button onClick={() => { setShowAddForm(false); setEditingVoucher(null); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold mb-1.5">તારીખ (Voucher Date) *</label>
                <input
                  type="date"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono ${inputBg} focus:outline-rose-500`}
                  required
                />
              </div>

              {/* Voucher Number */}
              <div>
                <label className="block text-xs font-bold mb-1.5">વાઉચર નંબર (Voucher No.)</label>
                <input
                  type="text"
                  placeholder={nextVoucherSeq}
                  value={customVoucherNum}
                  onChange={(e) => setCustomVoucherNum(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold ${inputBg} focus:outline-rose-500`}
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold">ખર્ચનો પ્રકાર (Category) *</label>
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1"
                  >
                    + નવું ખાતું
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg} focus:outline-rose-500`}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Paid To */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1.5">કોને ચૂકવ્યા? (Paid To / Receiver Name) *</label>
                <input
                  type="text"
                  placeholder="દા.ત. સંજય ઇલેક્ટ્રિકલ્સ / ઓફિસ સ્ટેશનરી સ્ટોર / સ્ટાફ પગાર"
                  value={paidToGuj}
                  onChange={(e) => setPaidToGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold ${inputBg} focus:outline-rose-500`}
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold mb-1.5">ચુકવણી રકમ (Amount in ₹) *</label>
                <input
                  type="number"
                  placeholder="દા.ત. 1500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold text-rose-600 ${inputBg} focus:outline-rose-500`}
                  required
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-bold mb-1.5">ચૂકવણી મોડ (Payment Mode) *</label>
                <select
                  value={paymentMode}
                  onChange={(e: any) => setPaymentMode(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg} focus:outline-rose-500`}
                >
                  <option value="રોકડ (Cash)">રોકડ (Cash)</option>
                  <option value="બેંક ટ્રાન્સફર (Bank)">બેંક ટ્રાન્સફર (Bank Transfer / RTGS / UPI)</option>
                  <option value="ચેક (Cheque)">ચેક (Cheque)</option>
                </select>
              </div>

              {/* Approved By */}
              <div>
                <label className="block text-xs font-bold mb-1.5">મંજૂર કરનાર (Approved By) *</label>
                <input
                  type="text"
                  placeholder="મંજૂરી આપનાર ટ્રસ્ટીનું નામ"
                  value={approvedByGuj}
                  onChange={(e) => setApprovedByGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg} focus:outline-rose-500`}
                  required
                />
              </div>

              {/* Bank accounts dropdown if not Cash */}
              {paymentMode !== 'રોકડ (Cash)' && (
                <>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">કઈ બેંકમાંથી ચૂકવ્યા? (Select Bank) *</label>
                    <select
                      value={bankId}
                      onChange={(e) => setBankId(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs ${inputBg} focus:outline-rose-500`}
                    >
                      <option value="">-- બેંક ખાતું પસંદ કરો --</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.bankNameGuj} - {b.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  {paymentMode === 'ચેક (Cheque)' && (
                    <div>
                      <label className="block text-xs font-bold mb-1.5">ચેક નંબર (Cheque Number)</label>
                      <input
                        type="text"
                        placeholder="૬ આંકડાનો ચેક નંબર"
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                        className={`w-full p-2.5 rounded-xl text-xs ${inputBg} focus:outline-rose-500`}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Remarks */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold mb-1.5">ખર્ચ હેતુની નોંધ (Remarks / Description)</label>
                <textarea
                  placeholder="ખર્ચ હેતુ અને વિગતોની બ્રીફ નોંધ દાખલ કરો..."
                  value={remarksGuj}
                  onChange={(e) => setRemarksGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg} h-16 focus:outline-rose-500`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setEditingVoucher(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                રદ કરો (Cancel)
              </button>
              <button
                type="submit"
                id="btn-save-expense-voucher"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" /> {editingVoucher ? 'વાઉચર અપડેટ કરો (Update)' : '✓ ખર્ચ વાઉચર જનરેટ કરો & સેવ કરો (Generate Voucher)'}
              </button>
            </div>
          </form>

          {/* Quick Guide on Bank Interest and Tax Cuts */}
          <div className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              💡 માર્ગદર્શિકા: બેંક વ્યાજ અને ટેક્સ કપાત / ચાર્જીસની એન્ટ્રી કેવી રીતે કરવી?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-1.5">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block">📥 ૧. બેંક વ્યાજ જમા થાય ત્યારે (Interest Credited):</span>
                <p>
                  વ્યાજ એ ટ્રસ્ટની આવક છે. તેની એન્ટ્રી <strong>આવક પાવતીઓ (Income Receipts)</strong> માં કરવા માટે:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>આવક પાવતીઓ રજિસ્ટરમાં જઈ <strong>"નવી પાવતી ઉમેરો"</strong> ક્લિક કરો.</li>
                  <li>દાતાની પસંદગીમાં <strong className="text-slate-800 dark:text-white">"બેંક વ્યાજ / અન્ય જમા"</strong> પસંદ કરો (કોઈ નવો દાતા બનાવવાની જરૂર નથી).</li>
                  <li>આવકનો પ્રકાર માં <strong>"વ્યાજ આવક / Interest"</strong> અથવા <strong>"પરચુરણ આવક"</strong> રાખો.</li>
                  <li>ચૂકવણી મોડ <strong>"બેંક ટ્રાન્સફર (Bank)"</strong> રાખી તમારી બેંક પસંદ કરો.</li>
                </ul>
              </div>

              <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 space-y-1.5">
                <span className="font-bold text-rose-700 dark:text-rose-400 block">📤 ૨. ટેક્સ કપાત / બેંક ચાર્જીસ હોય ત્યારે (Tax Cut / Bank Charges):</span>
                <p>
                  TDS ટેક્સ કપાત અથવા બેંક ચાર્જ એ ખર્ચ છે. તેની એન્ટ્રી અહીં કરવા માટે:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>ખર્ચનો પ્રકાર માં <strong>"બેંક ચાર્જીસ / Bank Charges"</strong> અથવા <strong>"ટેક્સ કપાત / TDS"</strong> ખાતું પસંદ કરો.</li>
                  <li>"કોને ચૂકવ્યા? (Paid To)" માં તમારી બેંકનું નામ લખો (દા.ત. <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded font-mono">State Bank of India</code>).</li>
                  <li>ચૂકવણી મોડ <strong>"બેંક ટ્રાન્સફર (Bank)"</strong> રાખી સંબંધિત બેંક પસંદ કરો.</li>
                  <li>યોગ્ય રકમ લખી <strong>"વાઉચર સેવ કરો"</strong> પર ક્લિક કરો.</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Vouchers Register List */
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${cardBg} flex items-center gap-3`}>
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="વાઉચર નંબર, મેળવનાર અથવા ખર્ચ શ્રેણી દ્વારા શોધો..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full focus:ring-0"
            />
          </div>

          <div className={`border ${cardBg} rounded-2xl overflow-hidden shadow-sm`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`font-bold ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <tr>
                    <th className="p-4">વાઉચર નંબર (Voucher No)</th>
                    <th className="p-4">તારીખ (Date)</th>
                    <th className="p-4">કોને ચૂકવ્યા (Paid To)</th>
                    <th className="p-4">શ્રેણી (Category)</th>
                    <th className="p-4">રકમ (Amount)</th>
                    <th className="p-4">મોડ (Payment Mode)</th>
                    <th className="p-4 text-center">ક્રિયાઓ (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        કોઈ ખર્ચ વાઉચર મળી આવ્યા નથી.
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="p-4 font-mono font-bold text-rose-600">{v.voucherNumber}</td>
                        <td className="p-4">{v.date}</td>
                        <td className="p-4 font-bold">{v.paidToGuj}</td>
                        <td className="p-4">{v.category}</td>
                        <td className="p-4 font-black text-rose-600">₹ {v.amount.toLocaleString('en-IN')}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-100">
                            {v.paymentMode.split(' ')[0]}
                          </span>
                        </td>
                        <td className="p-4 flex items-center justify-center gap-2">
                          <button
                            title="વાઉચર જુઓ (View Voucher)"
                            onClick={() => setSelectedVoucher(v)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {currentUser.role === 'Admin' && (
                            <>
                              <button
                                title="વાઉચર સુધારો (Edit Voucher)"
                                onClick={() => handleStartEdit(v)}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="રદ કરો (Void / Delete)"
                                onClick={() => {
                                  if (confirm(`${v.voucherNumber} ખર્ચ વાઉચર રદ કરવા માંગો છો? આનાથી એકાઉન્ટિંગ બેલેન્સ અપડેટ થશે.`)) {
                                    onDeleteVoucher(v.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Voucher Print Preview Modal */}
      {selectedVoucher && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedVoucher(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white text-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls Bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap justify-between items-center gap-2 print:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-700"
                  title="પાછા જાઓ (Back to Vouchers List)"
                >
                  <ArrowLeft className="w-4 h-4" /> પાછા જાઓ (Back)
                </button>
                <h3 className="text-sm font-bold flex items-center gap-2 text-rose-400">
                  <Printer className="w-4 h-4" /> વાઉચર પ્રિન્ટ / PDF વિગત
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      PDF બની રહ્યું છે...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      ડાઉનલોડ PDF
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrintVoucher}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  પ્રિન્ટ (Print)
                </button>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                  title="બંધ કરો (Close)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tip Banner for saving PDF */}
            <div className="mx-8 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 print:hidden">
              <span className="font-bold shrink-0">💡 પીડીએફ ટિપ:</span>
              <span>"ડાઉનલોડ PDF" બટન પર ક્લિક કરવાથી વાઉચરની પીડીએફ ફાઈલ સીધી ડાઉનલોડ થશે. આપ પ્રિન્ટ પણ કરી શકો છો.</span>
            </div>

            {/* Printable Content Frame */}
            <div className="p-8 bg-slate-50/50" id="printable-voucher-container">
              <div className="border-2 border-dashed border-rose-800 p-6 bg-white rounded-xl space-y-6 relative">
                
                {/* Header info */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200 gap-4">
                  {trustSettings?.logoUrl && (
                    <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-white p-1 rounded-lg border border-slate-200">
                      <img
                        src={trustSettings.logoUrl}
                        alt="Trust Logo"
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="flex-1 text-center">
                    <h2 className="text-xl font-black text-rose-950">
                      {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ (ગુજરાત)'}
                    </h2>
                    <p className="text-[10px] text-slate-500">
                      રજીસ્ટ્રેશન નંબર: {trustSettings?.regNoGuj || 'E-4903/AHMEDABAD'} 
                      {trustSettings?.addressGuj ? ` • સરનામું: ${trustSettings?.addressGuj}` : ''}
                    </p>
                    <div className="inline-block mt-2 px-4 py-0.5 bg-rose-100 text-rose-900 text-[10px] font-black rounded-full uppercase">
                      ચુકવણી વાઉચર (PAYMENT VOUCHER)
                    </div>
                  </div>
                  {trustSettings?.logoUrl && (
                    <div className="w-16 h-16 opacity-0 shrink-0 select-none hidden md:block"></div>
                  )}
                </div>

                {/* Voucher metadata */}
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 font-bold">વાઉચર ક્રમાંક:</span> <strong className="text-rose-800 font-mono">{selectedVoucher.voucherNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">તારીખ:</span> <strong>{selectedVoucher.date}</strong>
                  </div>
                </div>

                {/* Ledger details table */}
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-bold">મેળવનારનું નામ:</span>
                    <strong className="col-span-3 text-slate-800 text-sm">{selectedVoucher.paidToGuj}</strong>
                  </div>

                  <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-bold">ખર્ચ વિગત પ્રકાર:</span>
                    <span className="col-span-3 font-semibold">{selectedVoucher.category}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-bold">ચૂકવણી પદ્ધતિ:</span>
                    <span className="col-span-3 font-semibold">{selectedVoucher.paymentMode}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-bold">ચૂકવણી હેતુ / વિગત:</span>
                    <span className="col-span-3 text-slate-700 italic">"{selectedVoucher.remarksGuj}"</span>
                  </div>
                </div>

                {/* Ledger and validation figures */}
                <div className="bg-rose-50/50 border border-rose-200 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">ચૂકવેલી રકમ (Amount Paid)</span>
                    <strong className="text-base text-rose-700 font-black">₹ {selectedVoucher.amount.toLocaleString('en-IN')} /-</strong>
                  </div>
                  <div className="text-right text-[11px] font-medium text-slate-600">
                    મંજૂરી આપનાર: <strong className="text-rose-900">{selectedVoucher.approvedByGuj}</strong>
                  </div>
                </div>

                {/* Trust and Double-Entry Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-10 text-center text-[11px]">
                  <div>
                    <div className="border-t border-slate-300 pt-1 font-bold text-slate-500">
                      નામું લખનાર (Accountant)
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-300 pt-1 font-bold text-slate-500">
                      મેળવનાર સહી (Receiver Sign)
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-300 pt-1 font-bold text-rose-950">
                      ટ્રસ્ટી શ્રી સહીશ્રી
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Bottom Action Controls */}
            <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center gap-3 print:hidden">
              <button
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                પાછા જાઓ / લિસ્ટ જુઓ (Back to Vouchers List)
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingPDF ? 'PDF ફાઈલ બની રહી છે...' : 'ડાઉનલોડ PDF ફાઈલ'}
                </button>
                <button
                  onClick={handlePrintVoucher}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  પ્રિન્ટ વાઉચર (Print)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
