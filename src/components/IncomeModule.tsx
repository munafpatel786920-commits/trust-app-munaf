/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Printer, Trash2, Eye, X, Check, CheckCircle2, Award, QrCode, ArrowLeft, Download, Loader2, Edit3 } from 'lucide-react';
import { IncomeReceipt, Donor, IncomeCategory, BankAccount, TrustSettings } from '../types';
import { downloadContainerAsPDF, printContainer } from '../utils/pdfPrint';

interface IncomeModuleProps {
  receipts: IncomeReceipt[];
  donors: Donor[];
  banks: BankAccount[];
  onAddReceipt: (receipt: Omit<IncomeReceipt, 'id' | 'receiptNumber'>) => void;
  onEditReceipt?: (receipt: IncomeReceipt) => void;
  onDeleteReceipt: (id: string) => void;
  currentUser: { nameGuj: string; role: string };
  darkMode: boolean;
  trustSettings?: TrustSettings;
}

export default function IncomeModule({ receipts, donors, banks, onAddReceipt, onEditReceipt, onDeleteReceipt, currentUser, darkMode, trustSettings }: IncomeModuleProps) {
  // Navigation states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<IncomeReceipt | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<IncomeReceipt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Close modal on Escape key or Browser Back button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedReceipt(null);
      }
    };

    if (selectedReceipt) {
      window.addEventListener('keydown', handleKeyDown);
      window.history.pushState({ modalOpen: true }, '');

      const handlePopState = () => {
        setSelectedReceipt(null);
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [selectedReceipt]);

  const handleDownloadPDF = async () => {
    if (!selectedReceipt) return;
    setIsGeneratingPDF(true);
    await downloadContainerAsPDF('printable-receipt-container', `Receipt_${selectedReceipt.receiptNumber}`);
    setIsGeneratingPDF(false);
  };

  const handlePrintReceipt = () => {
    printContainer('printable-receipt-container');
  };

  // Form states
  const [donorId, setDonorId] = useState('');
  const [receiptDate, setReceiptDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customReceiptNum, setCustomReceiptNum] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [defaultCategoryRenames] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('default_category_renames');
    return saved ? JSON.parse(saved) : {};
  });

  const [category, setCategory] = useState<IncomeCategory>(() => {
    return (defaultCategoryRenames['દાન (Donation)'] || 'દાન (Donation)') as IncomeCategory;
  });
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)'>('રોકડ (Cash)');
  const [bankId, setBankId] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [remarksGuj, setRemarksGuj] = useState('');
  const [customDonorName, setCustomDonorName] = useState('');
  const [customDonorPhone, setCustomDonorPhone] = useState('');
  const [customDonorPan, setCustomDonorPan] = useState('');

  // Next receipt number preview
  const nextReceiptSeq = (() => {
    const highestNum = receipts.reduce((max, r) => {
      const match = r.receiptNumber?.match(/\d+$/);
      const num = match ? parseInt(match[0], 10) : 0;
      return Math.max(max, isNaN(num) ? 0 : num);
    }, 0);
    const seq = Math.max(highestNum + 1, receipts.length + 1);
    return `TR-2026-${String(seq).padStart(4, '0')}`;
  })();

  // Search filter
  const filteredReceipts = receipts.filter(r => {
    if (r.isDeleted) return false;
    const query = searchQuery.toLowerCase();
    return (
      r.receiptNumber.toLowerCase().includes(query) ||
      r.donorNameGuj.toLowerCase().includes(query) ||
      r.category.toLowerCase().includes(query) ||
      (r.remarksGuj && r.remarksGuj.toLowerCase().includes(query))
    );
  });

  const [customIncomeCats, setCustomIncomeCats] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_income_categories');
    return saved ? JSON.parse(saved) : [];
  });

  const DEFAULT_INCOME_CATS: IncomeCategory[] = [
    'દાન (Donation)',
    'ઝકાત (Zakat)',
    'સદકા (Sadqa)',
    'ફિતરા (Fitra)',
    'સભ્ય ફી (Member Fee)',
    'ભાડાની આવક (Rental Income)',
    'વ્યાજ વગરની આવક (Interest-free)',
    'અન્ય આવક (Other)'
  ];

  const categories = Array.from(new Set([
    ...DEFAULT_INCOME_CATS.map(cat => defaultCategoryRenames[cat] || cat),
    ...customIncomeCats
  ])) as IncomeCategory[];

  const handleAddNewCategory = () => {
    const newCat = prompt('નવું આવક ખાતું / શ્રેણીનું નામ દાખલ કરો (Enter New Income Account/Category Name):');
    if (newCat && newCat.trim()) {
      const trimmed = newCat.trim();
      if (categories.includes(trimmed)) {
        alert('આ ખાતું અથવા શ્રેણી પહેલેથી જ અસ્તિત્વમાં છે.');
        return;
      }
      const updated = [...customIncomeCats, trimmed];
      setCustomIncomeCats(updated);
      localStorage.setItem('custom_income_categories', JSON.stringify(updated));
      setCategory(trimmed);
      alert(`✓ નવું ખાતું "${trimmed}" સફળતાપૂર્વક ઉમેરવામાં આવ્યું છે.`);
    }
  };

  const handleStartEdit = (r: IncomeReceipt) => {
    setEditingReceipt(r);
    setDonorId(r.donorId || '');
    setReceiptDate(r.date || new Date().toISOString().split('T')[0]);
    setCustomReceiptNum(r.receiptNumber || '');
    setCategory(r.category);
    setAmount(String(r.amount));
    setPaymentMode(r.paymentMode);
    setBankId(r.bankId || '');
    setChequeNumber(r.chequeNumber || '');
    setRemarksGuj(r.remarksGuj || '');
    setShowAddForm(true);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('મહેરબાની કરીને સાચી રકમ (Amount) દાખલ કરો.');
      return;
    }

    let finalDonorId = donorId;
    let finalDonorName = '';

    if (donorId === 'bank-interest') {
      finalDonorName = 'બેંક વ્યાજ / અન્ય જમા (Bank Interest)';
      finalDonorId = 'bank-interest';
    } else if (donorId === 'new' || (!donorId && customDonorName)) {
      const newDnrName = customDonorName.trim() || 'અજ્ઞાત દાતા (Anonymous)';
      finalDonorName = newDnrName;
      finalDonorId = 'dnr-temp-' + Date.now();
    } else if (donorId) {
      const selected = donors.find(d => d.id === donorId);
      finalDonorName = selected ? selected.nameGuj : (customDonorName || 'અજ્ઞાત દાતા');
    } else if (customDonorName.trim()) {
      finalDonorName = customDonorName.trim();
      finalDonorId = 'dnr-temp-' + Date.now();
    } else {
      alert('મહેરબાની કરીને દાતાનું નામ દાખલ કરો અથવા યાદીમાંથી પસંદ કરો.');
      return;
    }

    if (paymentMode !== 'રોકડ (Cash)' && banks.length > 0 && !bankId) {
      alert('મહેરબાની કરીને બેંક ખાતું પસંદ કરો.');
      return;
    }

    const generatedNum = customReceiptNum.trim() || nextReceiptSeq;

    if (editingReceipt && onEditReceipt) {
      onEditReceipt({
        ...editingReceipt,
        date: receiptDate,
        donorId: finalDonorId,
        donorNameGuj: finalDonorName,
        category,
        amount: parsedAmount,
        paymentMode,
        bankId: paymentMode !== 'રોકડ (Cash)' ? bankId : undefined,
        chequeNumber: paymentMode === 'ચેક (Cheque)' ? chequeNumber : undefined,
        remarksGuj: remarksGuj || `${category} સ્વીકાર્યા`,
      });
      setEditingReceipt(null);
      setSuccessNotice(`✓ પાવતી નં. ${editingReceipt.receiptNumber} સફળતાપૂર્વક અપડેટ થઈ ગઈ છે!`);
    } else {
      (onAddReceipt as any)({
        date: receiptDate || new Date().toISOString().split('T')[0],
        receiptNumber: generatedNum,
        donorId: finalDonorId,
        donorNameGuj: finalDonorName,
        category,
        amount: parsedAmount,
        paymentMode,
        bankId: paymentMode !== 'રોકડ (Cash)' ? bankId : undefined,
        chequeNumber: paymentMode === 'ચેક (Cheque)' ? chequeNumber : undefined,
        remarksGuj: remarksGuj || `${category} સ્વીકાર્યા`,
        operatorGuj: currentUser.nameGuj,
        customDonorPhone,
        customDonorPan
      });
      setSuccessNotice(`✓ નવી પાવતી નં. ${generatedNum} સફળતાપૂર્વક જનરેટ થઈ ગઈ છે!`);
    }

    setTimeout(() => setSuccessNotice(null), 5000);

    // Reset Form
    setDonorId('');
    setAmount('');
    setRemarksGuj('');
    setChequeNumber('');
    setBankId('');
    setCustomDonorName('');
    setCustomDonorPhone('');
    setCustomDonorPan('');
    setCustomReceiptNum('');
    setEditingReceipt(null);
    setShowAddForm(false);
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  // Simulating a Barcode SVG
  const renderBarcode = (text: string) => {
    return (
      <div className="flex flex-col items-center">
        <svg className="w-48 h-10">
          <g fill="currentColor">
            <rect x="10" y="2" width="2" height="30" />
            <rect x="14" y="2" width="1" height="30" />
            <rect x="18" y="2" width="3" height="30" />
            <rect x="23" y="2" width="1" height="30" />
            <rect x="26" y="2" width="2" height="30" />
            <rect x="30" y="2" width="4" height="30" />
            <rect x="36" y="2" width="1" height="30" />
            <rect x="39" y="2" width="2" height="30" />
            <rect x="43" y="2" width="2" height="30" />
            <rect x="47" y="2" width="3" height="30" />
            <rect x="52" y="2" width="1" height="30" />
            <rect x="55" y="2" width="2" height="30" />
            <rect x="59" y="2" width="4" height="30" />
            <rect x="65" y="2" width="1" height="30" />
            <rect x="68" y="2" width="2" height="30" />
            <rect x="72" y="2" width="2" height="30" />
            <rect x="76" y="2" width="3" height="30" />
            <rect x="81" y="2" width="1" height="30" />
            <rect x="84" y="2" width="2" height="30" />
            <rect x="88" y="2" width="4" height="30" />
            <rect x="94" y="2" width="1" height="30" />
            <rect x="97" y="2" width="2" height="30" />
            <rect x="101" y="2" width="2" height="30" />
            <rect x="105" y="2" width="3" height="30" />
            <rect x="110" y="2" width="1" height="30" />
            <rect x="113" y="2" width="2" height="30" />
            <rect x="117" y="2" width="4" height="30" />
            <rect x="123" y="2" width="1" height="30" />
            <rect x="126" y="2" width="2" height="30" />
            <rect x="130" y="2" width="2" height="30" />
            <rect x="134" y="2" width="3" height="30" />
            <rect x="139" y="2" width="1" height="30" />
            <rect x="142" y="2" width="2" height="30" />
            <rect x="146" y="2" width="4" height="30" />
            <rect x="152" y="2" width="1" height="30" />
            <rect x="155" y="2" width="2" height="30" />
            <rect x="159" y="2" width="2" height="30" />
            <rect x="163" y="2" width="3" height="30" />
            <rect x="168" y="2" width="2" height="30" />
          </g>
        </svg>
        <span className="text-[10px] tracking-widest font-mono text-slate-500 mt-1">{text}</span>
      </div>
    );
  };

  // Simulating QR Code SVG
  const renderQRCode = (text: string) => {
    return (
      <div className="flex flex-col items-center">
        <div className="p-2 bg-white rounded-lg border border-slate-200">
          <svg className="w-24 h-24" viewBox="0 0 29 29">
            <path d="M0,0h7v7h-7z M22,0h7v7h-7z M0,22h7v7h-7z" fill="black" />
            <path d="M2,2h3v3h-3z M24,2h3v3h-3z M2,24h3v3h-3z" fill="white" />
            <path d="M9,0h4v1h-4z M15,0h5v2h-5z M9,2h2v3h-2z M13,3h4v2h-4z M18,4h3v2h-3z M9,6h11v2h-11z M0,9h4v2h-4z M6,9h5v3h-5z M13,9h9v2h-9z M24,9h4v2h-4z M2,12h10v3h-10z M14,12h13v2h-13z M0,16h6v4h-6z M8,16h18v3h-18z M0,20h12v1h-12z M14,20h9v1h-9z M25,20h3v5h-3z M8,22h4v3h-4z M14,22h9v3h-9z M8,26h18v2h-18z" fill="black" />
          </svg>
        </div>
        <span className="text-[9px] text-slate-400 mt-1 font-mono">verify receipt</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section with add action */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black">આવક પાવતીઓ (Income Receipts Register)</h2>
          <p className={`text-xs ${textMuted}`}>ટ્રસ્ટના તમામ દાન અને સહાયક આવકોની પાવતી અહીંથી સંચાલિત થાય છે.</p>
        </div>
        <div>
          {currentUser.role !== 'ReadOnly' && (
            <button
              id="btn-add-receipt"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> નવી પાવતી ઉમેરો (New Receipt)
            </button>
          )}
        </div>
      </div>

      {/* Notification banner */}
      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-white hover:text-emerald-100 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid containing Receipt List or New Entry Form */}
      {showAddForm ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border ${cardBg} shadow-sm max-w-4xl mx-auto`}
        >
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
            <div>
              <h3 className="font-bold text-base text-emerald-600 flex items-center gap-2">
                <Award className="w-5 h-5" /> {editingReceipt ? 'આવક પાવતી સુધારો (Edit Income Receipt)' : 'નવી આવક પાવતી ફોર્મ (New Income Receipt Entry)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                પાવતી ક્રમાંક: <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">{editingReceipt ? editingReceipt.receiptNumber : nextReceiptSeq}</span>
              </p>
            </div>
            <button onClick={() => { setShowAddForm(false); setEditingReceipt(null); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold mb-1.5">તારીખ (Receipt Date) *</label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono ${inputBg} focus:outline-emerald-500`}
                  required
                />
              </div>

              {/* Receipt Number */}
              <div>
                <label className="block text-xs font-bold mb-1.5">પાવતી નંબર (Receipt No.)</label>
                <input
                  type="text"
                  placeholder={nextReceiptSeq}
                  value={customReceiptNum}
                  onChange={(e) => setCustomReceiptNum(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold ${inputBg} focus:outline-emerald-500`}
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold">આવકનો પ્રકાર (Category) *</label>
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1"
                  >
                    + નવું ખાતું
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg} focus:outline-emerald-500`}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Donor Dropdown & Direct Donor Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1.5">દાતા પસંદ કરો અથવા નવું નામ લખો (Donor) *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={donorId}
                    onChange={(e) => {
                      setDonorId(e.target.value);
                      if (e.target.value && e.target.value !== 'new' && e.target.value !== 'bank-interest') {
                        const d = donors.find(dn => dn.id === e.target.value);
                        if (d) {
                          setCustomDonorName(d.nameGuj);
                          setCustomDonorPhone(d.phone || '');
                          setCustomDonorPan(d.panNumber || '');
                        }
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg} focus:outline-emerald-500`}
                  >
                    <option value="">-- મોજૂદ દાતામાંથી પસંદ કરો --</option>
                    <option value="new">+ નવો દાતા (Add New Donor)</option>
                    <option value="bank-interest">🏛️ બેંક વ્યાજ / અન્ય જમા (Bank Interest)</option>
                    {donors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nameGuj} {d.phone ? `(${d.phone})` : ''}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="દાતાનું પૂરું નામ લખો (દા.ત. રમેશભાઈ શાહ)"
                    value={customDonorName}
                    onChange={(e) => {
                      setCustomDonorName(e.target.value);
                      if (donorId && donorId !== 'new' && donorId !== 'bank-interest') {
                        setDonorId('new');
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold ${inputBg} focus:outline-emerald-500`}
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold mb-1.5">રકમ (Amount in ₹) *</label>
                <input
                  type="number"
                  placeholder="દા.ત. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold text-emerald-600 ${inputBg} focus:outline-emerald-500`}
                  required
                />
              </div>

              {/* Optional Donor details */}
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold mb-1 text-slate-600 dark:text-slate-300">દાતાનો મોબાઇલ નંબર</label>
                  <input
                    type="text"
                    placeholder="98XXXXXX"
                    value={customDonorPhone}
                    onChange={(e) => setCustomDonorPhone(e.target.value)}
                    className={`w-full p-2 rounded-lg text-xs ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1 text-slate-600 dark:text-slate-300">PAN નંબર (80G ટેક્સ રિસીપ્ટ માટે)</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={customDonorPan}
                    onChange={(e) => setCustomDonorPan(e.target.value.toUpperCase())}
                    className={`w-full p-2 rounded-lg text-xs uppercase font-mono ${inputBg}`}
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold mb-1.5">ચૂકવણી મોડ (Payment Mode) *</label>
                <select
                  value={paymentMode}
                  onChange={(e: any) => setPaymentMode(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg} focus:outline-emerald-500`}
                >
                  <option value="રોકડ (Cash)">રોકડ (Cash)</option>
                  <option value="બેંક ટ્રાન્સફર (Bank)">બેંક ટ્રાન્સફર (Bank Transfer / UPI)</option>
                  <option value="ચેક (Cheque)">ચેક (Cheque)</option>
                </select>
              </div>

              {/* Conditional Bank Mappings */}
              {paymentMode !== 'રોકડ (Cash)' && (
                <>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">કઈ બેંકમાં જમા થયા? (Select Bank) *</label>
                    <select
                      value={bankId}
                      onChange={(e) => setBankId(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs ${inputBg} focus:outline-emerald-500`}
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
                        className={`w-full p-2.5 rounded-xl text-xs ${inputBg} focus:outline-emerald-500`}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Remarks */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold mb-1.5">નોંધ / વિગતો (Remarks)</label>
                <textarea
                  placeholder="દાન હેતુ અથવા વધારાની વિગતો દાખલ કરો..."
                  value={remarksGuj}
                  onChange={(e) => setRemarksGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg} h-16 focus:outline-emerald-500`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setEditingReceipt(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                રદ કરો (Cancel)
              </button>
              <button
                type="submit"
                id="btn-save-income-receipt"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" /> {editingReceipt ? 'પાવતી અપડેટ કરો (Update)' : '✓ પાવતી જનરેટ કરો & સેવ કરો (Generate Receipt)'}
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
                  <li>દાતાની પસંદગીમાં <strong className="text-slate-800 dark:text-white">"બેંક વ્યાજ / અન્ય જમા"</strong> પસંદ કરો (કોઈ નવો દાતા બનાવવાની જરૂર નથી).</li>
                  <li>આવકનો પ્રકાર (Income Category) માં <strong>"વ્યાજ આવક / Interest"</strong> અથવા <strong>"પરચુરણ આવક"</strong> રાખો.</li>
                  <li>ચૂકવણી મોડ <strong>"બેંક ટ્રાન્સફર (Bank)"</strong> રાખી તમારી બેંક પસંદ કરો.</li>
                </ul>
              </div>

              <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 space-y-1.5">
                <span className="font-bold text-rose-700 dark:text-rose-400 block">📤 ૨. ટેક્સ કપાત / બેંક ચાર્જીસ હોય ત્યારે (Tax Cut / Bank Charges):</span>
                <p>
                  ટેક્સ કપાત (TDS) અથવા બેંક ચાર્જ એ ખર્ચ છે. તેની એન્ટ્રી <strong>ખર્ચ વાઉચરો (Expense Vouchers)</strong> માં કરવા માટે:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>ખર્ચ વાઉચર ફોર્મ ખોલો.</li>
                  <li>ખર્ચનો પ્રકાર (Expense Category) માં <strong>"બેંક ચાર્જીસ / Bank Charges"</strong> અથવા <strong>"ટેક્સ કપાત / TDS"</strong> ખાતું પસંદ કરો.</li>
                  <li>"કોને ચૂકવ્યા?" માં બેંકનું નામ લખો (દા.ત. <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded font-mono">State Bank of India</code>).</li>
                  <li>ચૂકવણી મોડ <strong>"બેંક ટ્રાન્સફર (Bank)"</strong> રાખી સંબંધિત બેંક પસંદ કરો.</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* List and Filter Section */
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${cardBg} flex items-center gap-3`}>
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="પાવતી નંબર, દાતાનું નામ કે દાનના પ્રકાર દ્વારા શોધો..."
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
                    <th className="p-4">પાવતી નંબર (Receipt No)</th>
                    <th className="p-4">તારીખ (Date)</th>
                    <th className="p-4">દાતાનું નામ (Donor Name)</th>
                    <th className="p-4">પ્રકાર (Category)</th>
                    <th className="p-4">રકમ (Amount)</th>
                    <th className="p-4">મોડ (Mode)</th>
                    <th className="p-4 text-center">ક્રિયાઓ (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        કોઈ પાવતી મળી આવી નથી.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="p-4 font-mono font-bold text-emerald-600">{r.receiptNumber}</td>
                        <td className="p-4">{r.date}</td>
                        <td className="p-4 font-bold">{r.donorNameGuj}</td>
                        <td className="p-4">{r.category}</td>
                        <td className="p-4 font-black text-emerald-600">₹ {r.amount.toLocaleString('en-IN')}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.paymentMode.includes('રોકડ') ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {r.paymentMode.split(' ')[0]}
                          </span>
                        </td>
                        <td className="p-4 flex items-center justify-center gap-2">
                          <button
                            title="પાવતી જુઓ (View Receipt)"
                            onClick={() => setSelectedReceipt(r)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {currentUser.role === 'Admin' && (
                            <>
                              <button
                                title="પાવતી સુધારો (Edit Receipt)"
                                onClick={() => handleStartEdit(r)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="રદ કરો (Void / Delete)"
                                onClick={() => {
                                  if (confirm(`${r.receiptNumber} પાવતી રદ કરવા માંગો છો? આનાથી એકાઉન્ટિંગ બેલેન્સ અપડેટ થશે.`)) {
                                    onDeleteReceipt(r.id);
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

      {/* High Fidelity Receipt Print Preview Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedReceipt(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white text-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls Bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap justify-between items-center gap-2 print:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-700"
                  title="પાછા જાઓ (Back to Receipts List)"
                >
                  <ArrowLeft className="w-4 h-4" /> પાછા જાઓ (Back)
                </button>
                <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                  <Printer className="w-4 h-4" /> પાવતી પ્રિન્ટ / PDF વિગત
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
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
                  onClick={handlePrintReceipt}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  પ્રિન્ટ (Print)
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                  title="બંધ કરો (Close)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tip Banner for saving PDF */}
            <div className="mx-8 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 print:hidden">
              <span className="font-bold shrink-0">💡 પીડીએફ ટિપ:</span>
              <span>"ડાઉનલોડ PDF" બટન પર ક્લિક કરવાથી રસીદની પીડીએફ ફાઈલ સીધી ડાઉનલોડ થશે. આપ પ્રિન્ટ પણ કરી શકો છો.</span>
            </div>

            {/* Printable Receipt Frame */}
            <div className="p-8 space-y-6 bg-amber-50/20" id="printable-receipt-container">
              {/* Receipt Border Decoration */}
              <div className="border-4 border-double border-emerald-800 p-6 rounded-xl space-y-6 relative bg-white">
                
                {/* Trust Seal Logo Watermark Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                  <Award className="w-80 h-80 text-emerald-800" />
                </div>

                {/* Trust Letterhead */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-slate-300 gap-4">
                  {trustSettings?.logoUrl && (
                    <div className="w-20 h-20 shrink-0 flex items-center justify-center bg-white p-1 rounded-lg border border-slate-200">
                      <img
                        src={trustSettings.logoUrl}
                        alt="Trust Logo"
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="flex-1 text-center">
                    <span className="text-xs tracking-wider bg-emerald-800 text-white px-3 py-0.5 rounded-full font-bold uppercase">
                      {trustSettings?.receiptHeaderGuj || 'સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                    </span>
                    <h1 className="text-2xl font-black text-emerald-900 mt-2">
                      {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ (ગુજરાત)'}
                    </h1>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      રજીસ્ટ્રેશન નંબર: {trustSettings?.regNoGuj || 'E-4903/AHMEDABAD'} 
                      {trustSettings?.section12ANo || trustSettings?.section80GNo ? ` • આઈટી કલમ: ${trustSettings?.section12ANo ? '12A' : ''}${trustSettings?.section12ANo && trustSettings?.section80GNo ? '/' : ''}${trustSettings?.section80GNo ? '80G' : ''} માન્ય` : ''}
                    </p>
                    <p className="text-xs font-medium text-slate-700 mt-1">
                      સરનામું: {trustSettings?.addressGuj || '૨૨-૨૫, ટ્રસ્ટ ભવન, આશ્રમ રોડ, અમદાવાદ - ૩૮૦૦૦૯'} 
                      {trustSettings?.phone ? ` • સંપર્ક: ${trustSettings?.phone}` : ''}
                    </p>
                  </div>
                  {trustSettings?.logoUrl && (
                    <div className="w-20 h-20 opacity-0 shrink-0 select-none hidden md:block"></div>
                  )}
                </div>

                {/* Receipt Title and Metadata Strip */}
                <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 font-bold">પાવતી નં:</span> <strong className="text-emerald-800 font-mono text-sm">{selectedReceipt.receiptNumber}</strong>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 rounded-lg text-emerald-800 font-bold">
                    આવક રસીદ (INCOME RECEIPT)
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">તારીખ:</span> <strong>{selectedReceipt.date}</strong>
                  </div>
                </div>

                {/* Donor Receipt Details Table */}
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-4 gap-2 items-center">
                    <span className="text-slate-500 font-bold col-span-1">દાતાશ્રીનું નામ:</span>
                    <strong className="col-span-3 text-base text-slate-800">{selectedReceipt.donorNameGuj}</strong>
                  </div>

                  <div className="grid grid-cols-4 gap-2 items-center">
                    <span className="text-slate-500 font-bold col-span-1">દાનની શ્રેણી:</span>
                    <span className="col-span-3 font-semibold">{selectedReceipt.category}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 items-center">
                    <span className="text-slate-500 font-bold col-span-1">ચૂકવણી મોડ:</span>
                    <span className="col-span-3 font-semibold">
                      {selectedReceipt.paymentMode} 
                      {selectedReceipt.chequeNumber ? ` (ચેક નંબર: ${selectedReceipt.chequeNumber})` : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 items-start">
                    <span className="text-slate-500 font-bold col-span-1">નોંધ / વિગત:</span>
                    <span className="col-span-3 text-slate-700 leading-relaxed italic">"{selectedReceipt.remarksGuj}"</span>
                  </div>
                </div>

                {/* Amount Box in Words and Figures */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs mt-4">
                  <div>
                    <span className="text-slate-500 block font-bold uppercase text-[10px]">રકમ આંકડામાં (Amount In Figure)</span>
                    <strong className="text-lg text-emerald-800 font-black">₹ {selectedReceipt.amount.toLocaleString('en-IN')} /-</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block font-bold uppercase text-[10px]">આવકવેરા અધિનિયમ કર મુક્તિ</span>
                    <span className="text-[10px] font-bold text-emerald-700">આ દાન ૧૯૬૧ ની કલમ 80G હેઠળ કર મુક્તિ માટે પાત્ર છે.</span>
                  </div>
                </div>

                {/* Double Footer Signatures & QR/Barcode Code area */}
                <div className="grid grid-cols-3 gap-4 pt-4 items-end border-t border-slate-200">
                  {/* Verification QR */}
                  <div className="flex justify-start">
                    {renderQRCode(selectedReceipt.receiptNumber)}
                  </div>

                  {/* Serial Barcode */}
                  <div className="flex justify-center flex-col items-center">
                    {renderBarcode(selectedReceipt.receiptNumber)}
                  </div>

                  {/* Signatures */}
                  <div className="text-right text-xs space-y-8 flex flex-col justify-end">
                    <span className="text-[10px] text-slate-400">બનાવનાર: {selectedReceipt.operatorGuj}</span>
                    <div className="border-t border-slate-300 pt-1 font-bold text-slate-600">
                      ટ્રસ્ટી / અધિકૃત સહીશ્રી
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Controls */}
            <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center gap-3 print:hidden">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                પાછા જાઓ / લિસ્ટ જુઓ (Back to Receipts List)
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingPDF ? 'PDF ફાઈલ બની રહી છે...' : 'ડાઉનલોડ PDF ફાઈલ'}
                </button>
                <button
                  onClick={handlePrintReceipt}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  પ્રિન્ટ રસીદ (Print)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
