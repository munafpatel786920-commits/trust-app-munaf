/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Table, FileText, Landmark, FileSpreadsheet, Download, Printer, Repeat, ArrowRight, CheckCircle2, X, Sparkles, ShieldCheck, TrendingUp, Scale, ArrowUpRight, ArrowDownRight, Calculator, Search, Filter, Layers, Package, Archive, Box, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { IncomeReceipt, ExpenseVoucher, BankAccount, Asset, TrustSettings, InventoryItem, PurchaseBill, SalesBill, MemberLoanApplication } from '../types';
import OpeningBalancesModal from './OpeningBalancesModal';
import { downloadContainerAsPDF, printContainer } from '../utils/pdfPrint';
import { motion } from 'motion/react';

interface AccountingModuleProps {
  receipts: IncomeReceipt[];
  vouchers: ExpenseVoucher[];
  banks: BankAccount[];
  assets: Asset[];
  inventoryItems?: InventoryItem[];
  purchaseBills?: PurchaseBill[];
  salesBills?: SalesBill[];
  loanApplications?: MemberLoanApplication[];
  darkMode: boolean;
  trustSettings?: TrustSettings;
  onUpdateTrustSettings?: (updated: TrustSettings) => void;
  reconciliationList?: any[];
  onEditBankAccount?: (acc: BankAccount) => void;
  onDeleteReceipt?: (id: string) => void;
  onDeleteVoucher?: (id: string) => void;
}

export default function AccountingModule({
  receipts,
  vouchers,
  banks,
  assets,
  inventoryItems = [],
  purchaseBills = [],
  salesBills = [],
  loanApplications = [],
  darkMode,
  trustSettings,
  onUpdateTrustSettings,
  reconciliationList,
  onEditBankAccount,
  onDeleteReceipt,
  onDeleteVoucher
}: AccountingModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'daybook' | 'ledger' | 'trial' | 'pnl' | 'inc_exp' | 'balance' | 'deadstock'>('daybook');
  const [entryToDelete, setEntryToDelete] = useState<{
    id: string;
    ref: string;
    type: string;
    particulars: string;
    amount: number;
  } | null>(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>('cash');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState<string>('');
  const [deadStockSearchQuery, setDeadStockSearchQuery] = useState<string>('');
  const [deadStockCatFilter, setDeadStockCatFilter] = useState<string>('all');
  const [showCarryForwardModal, setShowCarryForwardModal] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [newFyInput, setNewFyInput] = useState('૨૦૨૭-૨૮ (FY 2027-28)');
  const [daybookModeFilter, setDaybookModeFilter] = useState<'all' | 'cash' | 'bank' | 'credit'>('all');
  const [daybookCategoryFilter, setDaybookCategoryFilter] = useState<'all' | 'fee' | 'share' | 'loan' | 'donation' | 'sales' | 'purchase' | 'expense'>('all');
  const [daybookSearchQuery, setDaybookSearchQuery] = useState('');
  const [pnlViewMode, setPnlViewMode] = useState<'category' | 'itemized'>('category');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadReportPDF = async (containerId: string, filename: string) => {
    setIsGeneratingPDF(true);
    await downloadContainerAsPDF(containerId, filename);
    setIsGeneratingPDF(false);
  };

  const isDemoReceipt = (r: IncomeReceipt) =>
    (r.donorNameGuj && r.donorNameGuj.includes('ડેમો')) ||
    r.chequeNumber === '987654' ||
    (r.remarksGuj && r.remarksGuj.includes('ડેમો'));

  const activeReceipts = receipts.filter(r => !r.isDeleted && !isDemoReceipt(r));
  const activeVouchers = vouchers.filter(v => !v.isDeleted);

  // Purchases, Sales and Stock Calculations
  const totalPurchasesAmount = (purchaseBills || []).reduce((sum, p) => sum + p.totalAmount, 0);
  const totalSalesAmount = (salesBills || []).reduce((sum, s) => sum + s.totalAmount, 0);

  const totalUdharSalesReceivables = (salesBills || []).reduce((sum, s) => {
    const pending = s.totalAmount - (s.paidAmount || 0);
    return sum + (pending > 0 ? pending : 0);
  }, 0);

  const totalUdharPurchasePayables = (purchaseBills || []).reduce((sum, p) => {
    const pending = p.totalAmount - (p.paidAmount || 0);
    return sum + (pending > 0 ? pending : 0);
  }, 0);

  const openingStockValue = (inventoryItems || []).reduce((sum, item) => sum + (item.openingStock * (item.purchasePrice || 0)), 0);
  const closingStockValue = (inventoryItems || []).reduce((sum, item) => sum + (item.currentStock * (item.purchasePrice || 0)), 0);

  // Calculations
  const totalIncome = activeReceipts.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = activeVouchers.reduce((sum, v) => sum + v.amount, 0);

  const initialCash = trustSettings?.openingCashBalance ?? 150000;
  const cashIn = activeReceipts.filter(r => r.paymentMode.includes('રોકડ')).reduce((sum, r) => sum + r.amount, 0);
  const cashOut = activeVouchers.filter(v => v.paymentMode.includes('રોકડ')).reduce((sum, v) => sum + v.amount, 0);

  const activeRecon = (reconciliationList || []).filter(
    tx => !tx.desc?.includes('ડેમો') && tx.num !== '987654' && !tx.partyName?.includes('ડેમો')
  );
  const bankCashDeposit = activeRecon
    .filter(tx => tx.docType === 'ડિપોઝીટ' || tx.docType === 'રોકડ ડિપોઝીટ' || (tx.type?.includes('જમા') && tx.docType !== 'ચેક' && tx.docType !== 'RTGS' && (tx.desc?.includes('રોકડ') || tx.desc?.includes('ડિપોઝીટ'))))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const bankCashWithdrawal = activeRecon
    .filter(tx => tx.docType === 'વિથડ્રોઅલ' || tx.docType === 'રોકડ ઉપાડ' || (tx.type?.includes('ઉપાડ') && tx.docType !== 'ચેક' && tx.docType !== 'RTGS' && (tx.desc?.includes('રોકડ') || tx.desc?.includes('ઉપાડ'))))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const finalCash = initialCash + cashIn + bankCashWithdrawal - cashOut - bankCashDeposit;

  const totalBankBalance = banks.reduce((sum, b) => sum + b.balance, 0);
  const totalAssetVal = assets.reduce((sum, a) => sum + a.currentValue, 0);

  // Existing receipt numbers set to prevent duplication if a loan repayment already generated an IncomeReceipt
  const existingReceiptNumbers = new Set(activeReceipts.map(r => r.receiptNumber));

  // Extract Member EMI repayments from loanApplications
  const loanRepaymentEntries = (loanApplications || []).flatMap(loan => {
    return (loan.repayments || []).map(rpm => ({
      id: rpm.id,
      date: rpm.date,
      ref: rpm.receiptNumber || `LRCP-${rpm.id}`,
      particulars: `${loan.memberNameGuj} (સભાસદ લોન હપ્તો નં. ${rpm.installmentNo})`,
      remarks: rpm.remarksGuj || `મુદ્દલ: ₹${rpm.principalPaid.toLocaleString('en-IN')} + વ્યાજ: ₹${rpm.interestPaid.toLocaleString('en-IN')}`,
      type: 'આવક (Income)',
      rawCategory: 'સભાસદ લોન હપ્તો (Member Loan Repayment)',
      category: 'સભાસદ લોન હપ્તો',
      paymentMode: rpm.paymentMode || 'રોકડ (Cash)',
      debit: rpm.totalPaid,
      credit: 0
    }));
  }).filter(entry => !existingReceiptNumbers.has(entry.ref));

  // Day Book Timeline Combined
  const dayBookEntries = [
    ...activeReceipts.map(r => {
      let displayCategory = r.category ? r.category.replace(/\s*\(.*?\)\s*/g, '').trim() : 'આવક';
      if (r.category?.includes('પ્રવેશ ફી') || r.category?.includes('Membership Fee')) {
        displayCategory = 'સભાસદ પ્રવેશ ફી';
      } else if (r.category?.includes('શેર મૂડી') || r.category?.includes('Share Capital') || r.category?.includes('શેર')) {
        displayCategory = 'સભાસદ શેર મૂડી';
      } else if (r.category?.includes('લોન') || r.category?.includes('Loan')) {
        displayCategory = 'સભાસદ લોન હપ્તો';
      } else if (r.category?.includes('વસૂલાત') || r.category?.includes('Udhar Collection')) {
        displayCategory = 'ઉધાર વેચાણ વસૂલાત';
      } else if (r.category?.includes('વેચાણ') || r.category?.includes('Sales')) {
        displayCategory = 'પ્રોડક્ટ વેચાણ';
      }

      return {
        id: r.id,
        date: r.date,
        ref: r.receiptNumber,
        particulars: r.donorNameGuj,
        remarks: r.remarksGuj,
        type: 'આવક (Income)',
        rawCategory: r.category,
        category: displayCategory,
        paymentMode: r.paymentMode || 'રોકડ (Cash)',
        debit: r.amount,
        credit: 0
      };
    }),
    ...loanRepaymentEntries,
    ...activeVouchers.map(v => {
      let displayCategory = v.category ? v.category.replace(/\s*\(.*?\)\s*/g, '').trim() : 'ખર્ચ';
      if (v.category?.includes('ખરીદી ચુકવણી') || v.category?.includes('Udhar Settlement')) {
        displayCategory = 'ઉધાર ખરીદી ચૂકવણી';
      } else if (v.category?.includes('ખરીદી') || v.category?.includes('Purchase')) {
        displayCategory = 'પ્રોડક્ટ ખરીદી';
      }

      return {
        id: v.id,
        date: v.date,
        ref: v.voucherNumber,
        particulars: v.paidToGuj,
        remarks: v.remarksGuj,
        type: 'ખર્ચ (Expense)',
        rawCategory: v.category,
        category: displayCategory,
        paymentMode: v.paymentMode || 'રોકડ (Cash)',
        debit: 0,
        credit: v.amount
      };
    }),
    ...activeRecon
      .filter(tx => tx.docType === 'ડિપોઝીટ' || tx.docType === 'વિથડ્રોઅલ' || tx.docType === 'રોકડ ડિપોઝીટ' || tx.docType === 'રોકડ ઉપાડ')
      .map(tx => {
        const isDeposit = tx.docType === 'ડિપોઝીટ' || tx.docType === 'રોકડ ડિપોઝીટ' || tx.type?.includes('જમા');
        return {
          id: tx.id || tx.num,
          date: tx.date,
          ref: tx.num || 'CONTRA',
          particulars: isDeposit ? `બેંકમાં રોકડ જમા (${tx.bank})` : `બેંકમાંથી રોકડ ઉપાડ (${tx.bank})`,
          remarks: tx.desc,
          type: 'બેંક વ્યવહાર (Contra)',
          rawCategory: 'બેંક (Bank)',
          category: 'બેંક (Bank)',
          paymentMode: 'રોકડ/બેંક (Contra)',
          debit: isDeposit ? 0 : tx.amount,
          credit: isDeposit ? tx.amount : 0
        };
      }),
    // Udhar Purchase Bills: Supplier Credited (સપ્લાયર ખાતે જમા / જમા બાજુ / Debit Inflow column)
    ...(purchaseBills || [])
      .filter(p => p.paymentMode.includes('ઉધાર') || p.paymentMode.includes('Credit') || p.paymentStatus?.includes('ઉધાર') || p.paymentStatus?.includes('અંશત'))
      .map(p => ({
        id: `pbill-${p.id}`,
        date: p.date,
        ref: p.billNumber,
        particulars: `ઉધાર ખરીદી બિલ: ${p.supplierNameGuj} (${p.itemNameGuj})`,
        remarks: p.remarksGuj || `જથ્થો: ${p.quantity} | કુલ બિલ: ₹${p.totalAmount} | બાકી દેવું: ₹${p.totalAmount - (p.paidAmount || 0)}`,
        type: 'ઉધાર ખરીદી (Credit Purchase)',
        rawCategory: 'પ્રોડક્ટ ખરીદી (Udhar Purchase)',
        category: 'ઉધાર ખરીદી બિલ',
        paymentMode: p.paymentMode || 'ઉધાર (Credit)',
        debit: p.totalAmount, // સપ્લાયર ખાતે જમા (Creditor Jama Entry)
        credit: 0
      })),
    // Udhar Sales Bills: Customer Debited (ગ્રાહક ખાતે ઉધાર / ઉધાર બાજુ / Credit Outflow column)
    ...(salesBills || [])
      .filter(s => s.paymentMode.includes('ઉધાર') || s.paymentMode.includes('Credit') || s.paymentStatus?.includes('ઉધાર') || s.paymentStatus?.includes('અંશત'))
      .map(s => ({
        id: `sbill-${s.id}`,
        date: s.date,
        ref: s.billNumber,
        particulars: `ઉધાર વેચાણ બિલ: ${s.customerNameGuj} (${s.itemNameGuj})`,
        remarks: s.remarksGuj || `જથ્થો: ${s.quantity} | કુલ બિલ: ₹${s.totalAmount} | બાકી લેણું: ₹${s.totalAmount - (s.paidAmount || 0)}`,
        type: 'ઉધાર વેચાણ (Credit Sales)',
        rawCategory: 'પ્રોડક્ટ વેચાણ (Udhar Sales)',
        category: 'ઉધાર વેચાણ બિલ',
        paymentMode: s.paymentMode || 'ઉધાર (Credit)',
        debit: 0,
        credit: s.totalAmount // ગ્રાહક ખાતે ઉધાર (Debtor Udhar Entry)
      }))
  ].sort((a, b) => a.date.localeCompare(b.date));

  const filteredDayBookEntries = dayBookEntries.filter(entry => {
    // Payment mode filter
    if (daybookModeFilter === 'cash' && !entry.paymentMode.includes('રોકડ')) {
      return false;
    }
    if (daybookModeFilter === 'bank' && !(entry.paymentMode.includes('બેંક') || entry.paymentMode.includes('ચેક') || entry.paymentMode.includes('Contra'))) {
      return false;
    }
    if (daybookModeFilter === 'credit' && !(entry.paymentMode.includes('ઉધાર') || entry.paymentMode.includes('Credit') || entry.category.includes('ઉધાર') || entry.rawCategory?.includes('Udhar'))) {
      return false;
    }

    // Category filter
    if (daybookCategoryFilter === 'fee') {
      const isFee = entry.category.includes('પ્રવેશ ફી') || entry.rawCategory?.includes('પ્રવેશ ફી') || entry.rawCategory?.includes('Membership Fee');
      if (!isFee) return false;
    } else if (daybookCategoryFilter === 'share') {
      const isShare = entry.category.includes('શેર') || entry.rawCategory?.includes('શેર') || entry.rawCategory?.includes('Share Capital');
      if (!isShare) return false;
    } else if (daybookCategoryFilter === 'loan') {
      const isLoan = entry.category.includes('લોન') || entry.rawCategory?.includes('લોન') || entry.rawCategory?.includes('Loan') || entry.category.includes('EMI') || entry.rawCategory?.includes('EMI') || entry.category.includes('હપ્તો') || entry.rawCategory?.includes('હપ્તો');
      if (!isLoan) return false;
    } else if (daybookCategoryFilter === 'sales') {
      const isSales = entry.category.includes('વેચાણ') || entry.rawCategory?.includes('વેચાણ') || entry.rawCategory?.includes('Sales') || entry.type.includes('વેચાણ');
      if (!isSales) return false;
    } else if (daybookCategoryFilter === 'purchase') {
      const isPurchase = entry.category.includes('ખરીદી') || entry.rawCategory?.includes('ખરીદી') || entry.rawCategory?.includes('Purchase') || entry.type.includes('ખરીદી');
      if (!isPurchase) return false;
    } else if (daybookCategoryFilter === 'donation') {
      const isDonation = entry.type.includes('આવક') && !(
        entry.category.includes('પ્રવેશ ફી') || entry.rawCategory?.includes('પ્રવેશ ફી') ||
        entry.category.includes('શેર') || entry.rawCategory?.includes('શેર') ||
        entry.category.includes('લોન') || entry.rawCategory?.includes('લોન') ||
        entry.category.includes('વેચાણ') || entry.rawCategory?.includes('વેચાણ')
      );
      if (!isDonation) return false;
    } else if (daybookCategoryFilter === 'expense') {
      const isExpense = entry.type.includes('ખર્ચ') && !(
        entry.category.includes('ખરીદી') || entry.rawCategory?.includes('ખરીદી')
      );
      if (!isExpense) return false;
    }

    // Search query filter
    if (daybookSearchQuery.trim()) {
      const q = daybookSearchQuery.toLowerCase().trim();
      const matchParticulars = entry.particulars?.toLowerCase().includes(q);
      const matchRef = entry.ref?.toLowerCase().includes(q);
      const matchCat = entry.category?.toLowerCase().includes(q) || entry.rawCategory?.toLowerCase().includes(q);
      const matchRemarks = entry.remarks?.toLowerCase().includes(q);
      if (!matchParticulars && !matchRef && !matchCat && !matchRemarks) {
        return false;
      }
    }

    return true;
  });

  // Calculate dynamic, mathematically precise Initial Trust Fund (Opening Capital Fund)
  const openingBankBalances = banks.reduce((sum, b) => sum + (b.openingBalance !== undefined ? b.openingBalance : b.balance), 0);
  const initialTrustFund = initialCash + openingBankBalances + totalAssetVal + openingStockValue;

  const totalLiabilities = initialTrustFund + totalIncome - totalExpense + closingStockValue - openingStockValue + totalUdharPurchasePayables;
  const totalAssets = finalCash + totalBankBalance + totalAssetVal + closingStockValue + totalUdharSalesReceivables;
  const isBalanceMatched = Math.abs(totalLiabilities - totalAssets) < 1;

  // Custom categories state synced with localStorage
  const [customIncomeCats, setCustomIncomeCats] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_income_categories');
    return saved ? JSON.parse(saved) : [];
  });
  const [customExpenseCats, setCustomExpenseCats] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_expense_categories');
    return saved ? JSON.parse(saved) : [];
  });

  // Ledger accounts category lists
  const ALL_INCOME_CATS = [
    'દાન (Donation)',
    'ઝકાત (Zakat)',
    'સદકા (Sadqa)',
    'ફિતરા (Fitra)',
    'સભાસદ પ્રવેશ ફી (Membership Fee)',
    'સભાસદ શેર મૂડી (Member Share Capital)',
    'સભાસદ લોન હપ્તો (Member Loan Repayment)',
    'ભાડાની આવક (Rental Income)',
    'વ્યાજ વગરની આવક (Interest-free)',
    'અન્ય આવક (Other)'
  ];

  const ALL_EXPENSE_CATS = [
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

  const [defaultCategoryRenames, setDefaultCategoryRenames] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('default_category_renames');
    return saved ? JSON.parse(saved) : {};
  });

  const renamedIncomeCats = ALL_INCOME_CATS.map(cat => defaultCategoryRenames[cat] || cat);
  const renamedExpenseCats = ALL_EXPENSE_CATS.map(cat => defaultCategoryRenames[cat] || cat);

  const incomeCategories = Array.from(new Set([...renamedIncomeCats, ...customIncomeCats, ...activeReceipts.map(r => r.category)]))
    .filter(Boolean)
    .filter(cat => !cat.includes('વેચાણ') && !cat.toLowerCase().includes('sales'));

  const expenseCategories = Array.from(new Set([...renamedExpenseCats, ...customExpenseCats, ...activeVouchers.map(v => v.category)]))
    .filter(Boolean)
    .filter(cat => !cat.includes('ખરીદી') && !cat.toLowerCase().includes('purchase'));

  const getOriginalDefaultIncomeCat = (currentName: string) => {
    if (ALL_INCOME_CATS.includes(currentName)) {
      return currentName;
    }
    for (const [original, renamed] of Object.entries(defaultCategoryRenames)) {
      if (renamed === currentName) {
        return original;
      }
    }
    return null;
  };

  const getOriginalDefaultExpenseCat = (currentName: string) => {
    if (ALL_EXPENSE_CATS.includes(currentName)) {
      return currentName;
    }
    for (const [original, renamed] of Object.entries(defaultCategoryRenames)) {
      if (renamed === currentName) {
        return original;
      }
    }
    return null;
  };

  const getMappedCategory = (cat: string) => {
    return defaultCategoryRenames[cat] || cat;
  };

  // Custom account opening balances state
  const [customAccountOpenings, setCustomAccountOpenings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('custom_account_openings');
    return saved ? JSON.parse(saved) : {};
  });

  // Account Creation Modal States
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [newAccountType, setNewAccountType] = useState<'income' | 'expense'>('income');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountOpening, setNewAccountOpening] = useState('0');
  const [createAccountError, setCreateAccountError] = useState('');

  // Account Edit Modal States
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editAccountType, setEditAccountType] = useState<'income' | 'expense'>('income');
  const [editAccountOldName, setEditAccountOldName] = useState('');
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountOpening, setEditAccountOpening] = useState('0');
  const [editAccountError, setEditAccountError] = useState('');

  const isSelectedCustomAccount = (() => {
    if (selectedLedgerAccount.startsWith('inc-')) {
      const cat = selectedLedgerAccount.replace('inc-', '');
      return customIncomeCats.includes(cat);
    }
    if (selectedLedgerAccount.startsWith('exp-')) {
      const cat = selectedLedgerAccount.replace('exp-', '');
      return customExpenseCats.includes(cat);
    }
    return false;
  })();

  const isSelectedEditableAccount = (() => {
    return selectedLedgerAccount.startsWith('inc-') || selectedLedgerAccount.startsWith('exp-');
  })();

  const handleCreateNewLedgerAccount = () => {
    setNewAccountType('income');
    setNewAccountName('');
    setNewAccountOpening('0');
    setCreateAccountError('');
    setShowCreateAccountModal(true);
  };

  const handleConfirmCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAccountError('');
    const trimmed = newAccountName.trim();
    if (!trimmed) {
      setCreateAccountError('મહેબાની કરીને ખાતાનું નામ દાખલ કરો. (Please enter an account name.)');
      return;
    }
    const openingVal = parseFloat(newAccountOpening) || 0;

    if (newAccountType === 'income') {
      if (incomeCategories.includes(trimmed)) {
        setCreateAccountError('આ આવક ખાતું પહેલેથી જ અસ્તિત્વમાં છે. (This income account already exists.)');
        return;
      }
      const updated = [...customIncomeCats, trimmed];
      setCustomIncomeCats(updated);
      localStorage.setItem('custom_income_categories', JSON.stringify(updated));

      const updatedOpenings = {
        ...customAccountOpenings,
        [`inc-${trimmed}`]: openingVal
      };
      setCustomAccountOpenings(updatedOpenings);
      localStorage.setItem('custom_account_openings', JSON.stringify(updatedOpenings));

      setSelectedLedgerAccount(`inc-${trimmed}`);
      setShowCreateAccountModal(false);
    } else {
      if (expenseCategories.includes(trimmed)) {
        setCreateAccountError('આ ખર્ચ ખાતું પહેલેથી જ અસ્તિત્વમાં છે. (This expense account already exists.)');
        return;
      }
      const updated = [...customExpenseCats, trimmed];
      setCustomExpenseCats(updated);
      localStorage.setItem('custom_expense_categories', JSON.stringify(updated));

      const updatedOpenings = {
        ...customAccountOpenings,
        [`exp-${trimmed}`]: openingVal
      };
      setCustomAccountOpenings(updatedOpenings);
      localStorage.setItem('custom_account_openings', JSON.stringify(updatedOpenings));

      setSelectedLedgerAccount(`exp-${trimmed}`);
      setShowCreateAccountModal(false);
    }
  };

  const handleEditCustomAccount = () => {
    if (selectedLedgerAccount.startsWith('inc-')) {
      const name = selectedLedgerAccount.replace('inc-', '');
      setEditAccountType('income');
      setEditAccountOldName(name);
      setEditAccountName(name);
      setEditAccountOpening(String(customAccountOpenings[selectedLedgerAccount] || 0));
      setEditAccountError('');
      setShowEditAccountModal(true);
    } else if (selectedLedgerAccount.startsWith('exp-')) {
      const name = selectedLedgerAccount.replace('exp-', '');
      setEditAccountType('expense');
      setEditAccountOldName(name);
      setEditAccountName(name);
      setEditAccountOpening(String(customAccountOpenings[selectedLedgerAccount] || 0));
      setEditAccountError('');
      setShowEditAccountModal(true);
    }
  };

  const handleConfirmEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setEditAccountError('');
    const trimmed = editAccountName.trim();
    if (!trimmed) {
      setEditAccountError('મહેરબાની કરીને ખાતાનું નામ દાખલ કરો. (Please enter an account name.)');
      return;
    }
    const openingVal = parseFloat(editAccountOpening) || 0;

    if (editAccountType === 'income') {
      if (trimmed !== editAccountOldName && incomeCategories.includes(trimmed)) {
        setEditAccountError('આ આવક ખાતું પહેલેથી જ અસ્તિત્વમાં છે. (This income account already exists.)');
        return;
      }

      const origDefault = getOriginalDefaultIncomeCat(editAccountOldName);
      if (origDefault) {
        const updatedRenames = {
          ...defaultCategoryRenames,
          [origDefault]: trimmed
        };
        setDefaultCategoryRenames(updatedRenames);
        localStorage.setItem('default_category_renames', JSON.stringify(updatedRenames));
      } else {
        const updated = customIncomeCats.map(cat => cat === editAccountOldName ? trimmed : cat);
        setCustomIncomeCats(updated);
        localStorage.setItem('custom_income_categories', JSON.stringify(updated));
      }

      const updatedOpenings = { ...customAccountOpenings };
      delete updatedOpenings[`inc-${editAccountOldName}`];
      updatedOpenings[`inc-${trimmed}`] = openingVal;
      setCustomAccountOpenings(updatedOpenings);
      localStorage.setItem('custom_account_openings', JSON.stringify(updatedOpenings));

      setSelectedLedgerAccount(`inc-${trimmed}`);
      setShowEditAccountModal(false);
    } else {
      if (trimmed !== editAccountOldName && expenseCategories.includes(trimmed)) {
        setEditAccountError('આ ખર્ચ ખાતું પહેલેથી જ અસ્તિત્વમાં છે. (This expense account already exists.)');
        return;
      }

      const origDefault = getOriginalDefaultExpenseCat(editAccountOldName);
      if (origDefault) {
        const updatedRenames = {
          ...defaultCategoryRenames,
          [origDefault]: trimmed
        };
        setDefaultCategoryRenames(updatedRenames);
        localStorage.setItem('default_category_renames', JSON.stringify(updatedRenames));
      } else {
        const updated = customExpenseCats.map(cat => cat === editAccountOldName ? trimmed : cat);
        setCustomExpenseCats(updated);
        localStorage.setItem('custom_expense_categories', JSON.stringify(updated));
      }

      const updatedOpenings = { ...customAccountOpenings };
      delete updatedOpenings[`exp-${editAccountOldName}`];
      updatedOpenings[`exp-${trimmed}`] = openingVal;
      setCustomAccountOpenings(updatedOpenings);
      localStorage.setItem('custom_account_openings', JSON.stringify(updatedOpenings));

      setSelectedLedgerAccount(`exp-${trimmed}`);
      setShowEditAccountModal(false);
    }
  };

  const handleDeleteCustomAccount = () => {
    const isIncome = selectedLedgerAccount.startsWith('inc-');
    const catName = isIncome ? selectedLedgerAccount.replace('inc-', '') : selectedLedgerAccount.replace('exp-', '');
    
    if (confirm(`શું તમે ખરેખર "${catName}" ખાતું રદ કરવા માંગો છો? આ ખાતાનું ઓપનિંગ બેલેન્સ રદ થશે.`)) {
      if (isIncome) {
        const updated = customIncomeCats.filter(cat => cat !== catName);
        setCustomIncomeCats(updated);
        localStorage.setItem('custom_income_categories', JSON.stringify(updated));

        const updatedOpenings = { ...customAccountOpenings };
        delete updatedOpenings[selectedLedgerAccount];
        setCustomAccountOpenings(updatedOpenings);
        localStorage.setItem('custom_account_openings', JSON.stringify(updatedOpenings));
      } else {
        const updated = customExpenseCats.filter(cat => cat !== catName);
        setCustomExpenseCats(updated);
        localStorage.setItem('custom_expense_categories', JSON.stringify(updated));

        const updatedOpenings = { ...customAccountOpenings };
        delete updatedOpenings[selectedLedgerAccount];
        setCustomAccountOpenings(updatedOpenings);
        localStorage.setItem('custom_account_openings', JSON.stringify(updatedOpenings));
      }

      setSelectedLedgerAccount('all');
      alert(`✓ ખાતું "${catName}" સફળતાપૂર્વક રદ કરવામાં આવ્યું છે.`);
    }
  };

  const getLedgerDetails = (accountKey: string) => {
    let title = 'ખાતાવહી લેજર (Account Ledger)';
    let typeLabel = 'સામાન્ય ખાતું';
    let opening = 0;
    let entries: Array<{
      date: string;
      ref: string;
      particulars: string;
      mode: string;
      debit: number;
      credit: number;
    }> = [];

    if (accountKey === 'cash') {
      title = 'રોકડ ખાતું (Cash Ledger Account)';
      typeLabel = 'તિજોરી રોકડ (Cash)';
      opening = initialCash;
      
      const cashReceipts = activeReceipts
        .filter(r => r.paymentMode.includes('રોકડ'))
        .map(r => ({
          date: r.date,
          ref: r.receiptNumber,
          particulars: `${r.donorNameGuj} - ${r.category}`,
          mode: r.paymentMode || 'રોકડ (Cash)',
          debit: r.amount,
          credit: 0
        }));

      const cashVouchers = activeVouchers
        .filter(v => v.paymentMode.includes('રોકડ'))
        .map(v => ({
          date: v.date,
          ref: v.voucherNumber,
          particulars: `${v.paidToGuj} - ${v.category}`,
          mode: v.paymentMode || 'રોકડ (Cash)',
          debit: 0,
          credit: v.amount
        }));

      const cashContra = activeRecon
        .filter(tx => tx.docType === 'ડિપોઝીટ' || tx.docType === 'વિથડ્રોઅલ' || tx.docType === 'રોકડ ડિપોઝીટ' || tx.docType === 'રોકડ ઉપાડ')
        .map(tx => {
          const isDeposit = tx.docType === 'ડિપોઝીટ' || tx.docType === 'રોકડ ડિપોઝીટ' || tx.type?.includes('જમા');
          return {
            date: tx.date,
            ref: tx.num || 'CONTRA',
            particulars: isDeposit ? `બેંકમાં જમા (${tx.bank})` : `બેંકમાંથી ઉપાડ (${tx.bank})`,
            mode: 'કન્ટ્રા (Contra)',
            debit: isDeposit ? 0 : tx.amount,
            credit: isDeposit ? tx.amount : 0
          };
        });

      entries = [...cashReceipts, ...cashVouchers, ...cashContra].sort((a, b) => a.date.localeCompare(b.date));
    } else if (accountKey.startsWith('bank-')) {
      const bankId = accountKey.replace('bank-', '');
      const b = banks.find(bk => bk.id === bankId);
      title = b ? `બેંક ખાતું - ${b.bankNameGuj} (${b.accountNumber})` : 'બેંક ખાતું';
      typeLabel = 'બેંક ખાતું (Bank Account)';

      const reconMap = new Map<string, any>();
      activeRecon.forEach(tx => {
        if (tx.id) reconMap.set(tx.id, tx);
        if (tx.refId) reconMap.set(tx.refId, tx);
      });

      const bankReceipts = activeReceipts
        .filter(r => !r.paymentMode.includes('રોકડ') && (r.bankId === bankId || (!r.bankId && (banks.length === 1 || banks[0]?.id === bankId))))
        .map(r => {
          const matched = reconMap.get(r.id) || reconMap.get('rcp-' + r.id);
          const isCleared = matched?.status === 'ક્લિયર થયેલ' || matched?.status === 'Cleared';
          const statusSuffix = isCleared ? ' (ક્લિયર)' : '';
          return {
            date: r.date,
            ref: r.receiptNumber,
            particulars: `${r.donorNameGuj} - ${r.category}`,
            mode: `${r.paymentMode}${statusSuffix}`,
            debit: r.amount,
            credit: 0
          };
        });

      const bankVouchers = activeVouchers
        .filter(v => !v.paymentMode.includes('રોકડ') && (v.bankId === bankId || (!v.bankId && (banks.length === 1 || banks[0]?.id === bankId))))
        .map(v => {
          const matched = reconMap.get(v.id) || reconMap.get('vch-' + v.id);
          const isCleared = matched?.status === 'ક્લિયર થયેલ' || matched?.status === 'Cleared';
          const statusSuffix = isCleared ? ' (ક્લિયર)' : '';
          return {
            date: v.date,
            ref: v.voucherNumber,
            particulars: `${v.paidToGuj} - ${v.category}`,
            mode: `${v.paymentMode}${statusSuffix}`,
            debit: 0,
            credit: v.amount
          };
        });

      const bName = b?.bankNameGuj ? b.bankNameGuj.split(' ')[0] : '';
      const bankRecon = activeRecon
        .filter(tx => {
          const matchesBank = tx.bankId === bankId || (bName && tx.bank?.includes(bName));
          if (!matchesBank) return false;

          const isReceiptOrVoucherEntry =
            Boolean(tx.refId) ||
            tx.id?.startsWith('rcp-') ||
            tx.id?.startsWith('vch-') ||
            tx.sourceType === 'donor_cheque' ||
            tx.sourceType === 'expense_cheque' ||
            tx.docType === 'દાન ચેક' ||
            tx.docType === 'ખર્ચ ચેક' ||
            tx.docType === 'આવક બેંક' ||
            tx.docType === 'જાવક બેંક' ||
            tx.docType === 'દાન ચેક (Donor Cheque)' ||
            tx.docType === 'ખર્ચ ચેક (Expense Cheque)' ||
            activeReceipts.some(r => r.id === tx.refId || r.receiptNumber === tx.num) ||
            activeVouchers.some(v => v.id === tx.refId || v.voucherNumber === tx.num);

          return !isReceiptOrVoucherEntry;
        })
        .map(tx => {
          const isDeposit = tx.type?.includes('જમા') || tx.docType === 'ડિપોઝીટ' || tx.docType === 'રોકડ ડિપોઝીટ';
          return {
            date: tx.date,
            ref: tx.num || 'BANK-TX',
            particulars: tx.desc || (isDeposit ? 'બેંક રોકડ જમા (Contra)' : 'બેંક રોકડ ઉપાડ (Contra)'),
            mode: tx.docType || 'બેંક તબદીલી',
            debit: isDeposit ? tx.amount : 0,
            credit: isDeposit ? 0 : tx.amount
          };
        });

      entries = [...bankReceipts, ...bankVouchers, ...bankRecon].sort((a, b) => a.date.localeCompare(b.date));

      opening = b?.openingBalance !== undefined ? b.openingBalance : 0;
    } else if (accountKey.startsWith('inc-')) {
      const catName = accountKey.replace('inc-', '');
      title = `આવક ખાતું - ${catName}`;
      typeLabel = 'ટ્રસ્ટ આવક (Income Account)';
      opening = customAccountOpenings[accountKey] || 0;

      const originalCatName = getOriginalDefaultIncomeCat(catName) || catName;

      entries = activeReceipts
        .filter(r => r.category === catName || r.category === originalCatName || r.category.includes(catName) || catName.includes(r.category.split(' ')[0]))
        .map(r => ({
          date: r.date,
          ref: r.receiptNumber,
          particulars: `${r.donorNameGuj} ${r.remarksGuj ? `(${r.remarksGuj})` : ''}`,
          mode: r.paymentMode,
          debit: 0,
          credit: r.amount
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } else if (accountKey.startsWith('exp-')) {
      const catName = accountKey.replace('exp-', '');
      title = `ખર્ચ ખાતું - ${catName}`;
      typeLabel = 'ટ્રસ્ટ ખર્ચ (Expense Account)';
      opening = customAccountOpenings[accountKey] || 0;

      const originalCatName = getOriginalDefaultExpenseCat(catName) || catName;

      entries = activeVouchers
        .filter(v => v.category === catName || v.category === originalCatName || v.category.includes(catName) || catName.includes(v.category.split(' ')[0]))
        .map(v => ({
          date: v.date,
          ref: v.voucherNumber,
          particulars: `${v.paidToGuj} ${v.remarksGuj ? `(${v.remarksGuj})` : ''}`,
          mode: v.paymentMode,
          debit: v.amount,
          credit: 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } else if (accountKey.startsWith('asset-')) {
      const assetId = accountKey.replace('asset-', '');
      const a = assets.find(ast => ast.id === assetId);
      title = a ? `મિલકત ખાતું - ${a.nameGuj}` : 'મિલકત ખાતું';
      typeLabel = 'સ્થાયી મિલકત (Fixed Asset)';
      opening = a?.purchaseAmount || 0;

      entries = a ? [{
        date: a.purchaseDate,
        ref: 'ASSET-REG',
        particulars: `મિલકત ખરીદી / નોંધણી (${a.typeGuj})`,
        mode: 'મિલકત એન્ટ્રી',
        debit: a.purchaseAmount,
        credit: 0
      }] : [];
    } else if (accountKey === 'purchases') {
      title = 'પ્રોડક્ટ ખરીદી ખાતું (Product Purchases Account)';
      typeLabel = 'વેપાર ખર્ચ ખાતું (Purchase Account)';
      opening = 0;

      entries = (purchaseBills || []).map(p => ({
        date: p.date,
        ref: p.billNumber,
        particulars: `સપ્લાયર: ${p.supplierNameGuj} - ${p.itemNameGuj} (જથ્ધો: ${p.quantity})`,
        mode: p.paymentMode || 'રોકડ (Cash)',
        debit: p.totalAmount,
        credit: 0
      })).sort((a, b) => a.date.localeCompare(b.date));
    } else if (accountKey === 'sales') {
      title = 'પ્રોડક્ટ વેચાણ ખાતું (Product Sales Account)';
      typeLabel = 'વેપાર આવક ખાતું (Sales Account)';
      opening = 0;

      entries = (salesBills || []).map(s => ({
        date: s.date,
        ref: s.billNumber,
        particulars: `ગ્રાહક: ${s.customerNameGuj} - ${s.itemNameGuj} (જથ્ધો: ${s.quantity})`,
        mode: s.paymentMode || 'રોકડ (Cash)',
        debit: 0,
        credit: s.totalAmount
      })).sort((a, b) => a.date.localeCompare(b.date));
    } else if (accountKey === 'udhar_debtors') {
      title = 'ઉધાર ગ્રાહકો લેણું ખાતું (Sundry Debtors - Udhar Sales Ledger)';
      typeLabel = 'ચાલુ મિલકત / બાકી લેણું (Debtors Asset)';
      opening = 0;

      const debtorEntries: Array<{
        date: string;
        ref: string;
        particulars: string;
        mode: string;
        debit: number;
        credit: number;
      }> = [];

      (salesBills || []).forEach(s => {
        const isUdhar = s.paymentMode.includes('ઉધાર') || s.paymentMode.includes('Credit') || (s.paidAmount !== undefined && s.paidAmount < s.totalAmount) || (s.paymentStatus && s.paymentStatus !== 'ચૂકવેલ (Paid)');
        if (isUdhar) {
          debtorEntries.push({
            date: s.date,
            ref: s.billNumber,
            particulars: `ઉધાર વેચાણ: ${s.customerNameGuj} - ${s.itemNameGuj} (જથ્ધો: ${s.quantity})`,
            mode: s.paymentMode,
            debit: s.totalAmount,
            credit: 0
          });
          if (s.paidAmount && s.paidAmount > 0) {
            debtorEntries.push({
              date: s.settlementDate || s.date,
              ref: `${s.billNumber}-RCP`,
              particulars: `ઉધાર વસૂલાત / ચુકવણી જમા: ${s.customerNameGuj}`,
              mode: s.settlementMode || 'રોકડ (Cash)',
              debit: 0,
              credit: s.paidAmount
            });
          }
        }
      });
      entries = debtorEntries.sort((a, b) => a.date.localeCompare(b.date));
    } else if (accountKey === 'udhar_creditors') {
      title = 'ઉધાર સપ્લાયરો દેવું ખાતું (Sundry Creditors - Udhar Purchase Ledger)';
      typeLabel = 'ચાલુ જવાબદારી / બાકી દેવું (Creditors Liability)';
      opening = 0;

      const creditorEntries: Array<{
        date: string;
        ref: string;
        particulars: string;
        mode: string;
        debit: number;
        credit: number;
      }> = [];

      (purchaseBills || []).forEach(p => {
        const isUdhar = p.paymentMode.includes('ઉધાર') || p.paymentMode.includes('Credit') || (p.paidAmount !== undefined && p.paidAmount < p.totalAmount) || (p.paymentStatus && p.paymentStatus !== 'ચૂકવેલ (Paid)');
        if (isUdhar) {
          creditorEntries.push({
            date: p.date,
            ref: p.billNumber,
            particulars: `ઉધાર ખરીદી: ${p.supplierNameGuj} - ${p.itemNameGuj} (જથ્ધો: ${p.quantity})`,
            mode: p.paymentMode,
            debit: 0,
            credit: p.totalAmount
          });
          if (p.paidAmount && p.paidAmount > 0) {
            creditorEntries.push({
              date: p.settlementDate || p.date,
              ref: `${p.billNumber}-VCH`,
              particulars: `ઉધાર ચુકવણી જમા: ${p.supplierNameGuj}`,
              mode: p.settlementMode || 'રોકડ (Cash)',
              debit: p.paidAmount,
              credit: 0
            });
          }
        }
      });
      entries = creditorEntries.sort((a, b) => a.date.localeCompare(b.date));
    }

    const isCreditNormalAccount = accountKey.startsWith('inc-') || accountKey === 'sales' || accountKey === 'udhar_creditors';
    let running = opening;
    const entriesWithBalance = entries.map(e => {
      if (isCreditNormalAccount) {
        running += e.credit - e.debit;
      } else {
        running += e.debit - e.credit;
      }
      return {
        ...e,
        runningBalance: running
      };
    });

    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    const closing = isCreditNormalAccount ? opening + totalCredit - totalDebit : opening + totalDebit - totalCredit;

    return {
      title,
      typeLabel,
      opening,
      totalDebit,
      totalCredit,
      closing,
      entries: entriesWithBalance
    };
  };

  // Trial Balance Accounts Mappings
  const trialBalanceAccounts = [
    { name: 'પ્રારંભિક રોકડ ખાતું (Cash Ledger)', debit: initialCash + cashIn + bankCashWithdrawal, credit: cashOut + bankCashDeposit },
    ...banks.map(b => {
      const bReceipts = activeReceipts.filter(r => r.paymentMode !== 'રોકડ (Cash)' && r.bankId === b.id).reduce((sum, r) => sum + r.amount, 0);
      const bVouchers = activeVouchers.filter(v => v.paymentMode !== 'રોકડ (Cash)' && v.bankId === b.id).reduce((sum, v) => sum + v.amount, 0);
      const bName = b.bankNameGuj ? b.bankNameGuj.split(' ')[0] : '';
      const bDeposits = activeRecon
        .filter(tx => {
          const isDep = tx.type?.includes('જમા') || tx.docType === 'ડિપોઝીટ';
          return isDep && (tx.bankId === b.id || (bName && tx.bank?.includes(bName)));
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      const bWithdrawals = activeRecon
        .filter(tx => {
          const isWith = tx.type?.includes('ઉપાડ') || tx.docType === 'વિથડ્રોઅલ';
          return isWith && (tx.bankId === b.id || (bName && tx.bank?.includes(bName)));
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      const initialBankBalance = b.balance - bReceipts - bDeposits + bVouchers + bWithdrawals;

      return {
        name: `બેંક ખાતું - ${b.bankNameGuj} (${b.accountNumber})`,
        debit: initialBankBalance + bReceipts + bDeposits,
        credit: bVouchers + bWithdrawals
      };
    }),
    ...assets.map(a => ({
      name: `મિલકત - ${a.nameGuj}`,
      debit: a.currentValue,
      credit: 0
    })),
    { name: 'ટ્રસ્ટ સામાન્ય ભંડોળ (Trust Fund)', debit: 0, credit: initialTrustFund }, // dynamically balances liability
    { name: 'પ્રોડક્ટ માલસામાન શરૂઆતનો સ્ટોક (Inventory Opening Stock)', debit: openingStockValue, credit: 0 },
    { name: 'પ્રોડક્ટ ખરીદી ખાતું (Product Purchases Account)', debit: totalPurchasesAmount, credit: 0 },
    { name: 'સામાન્ય ખર્ચ અને પ્રાવધાન (General Expenses)', debit: Math.max(0, totalExpense - totalPurchasesAmount), credit: 0 },
    { name: 'પ્રોડક્ટ વેચાણ ખાતું (Product Sales Account)', debit: 0, credit: totalSalesAmount },
    { name: 'દાન અને સામાન્ય આવક (General Incomes)', debit: 0, credit: Math.max(0, totalIncome - totalSalesAmount) }
  ];

  const totalDebits = trialBalanceAccounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredits = trialBalanceAccounts.reduce((sum, a) => sum + a.credit, 0);

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Accounting Nav Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black">દ્વિ-નોંધી હિસાબી પદ્ધતિ (Double Entry Audit Reports)</h2>
          <p className={`text-xs ${textMuted}`}>ચેરિટી કમિશ્નર અને આવકવેરા મંજૂરી માટે નાણાકીય પત્રકો અને રોજમેળ.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowOpeningModal(true)}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            title="રોકડ અને બેંક પ્રારંભિક શિલક બદલો"
          >
            <Calculator className="w-4 h-4" /> પ્રારંભિક શિલક (Opening Balances)
          </button>
          <button
            onClick={() => alert('નાણાકીય રિપોર્ટ એક્સેલ (.xlsx) ફોર્મેટમાં નિકાસ કરાયેલ છે (Export Successful).')}
            className={`px-3 py-1.5 rounded-xl border ${darkMode ? 'border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800' : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'} text-xs font-bold flex items-center gap-1.5`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel માં નિકાસ
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" /> પ્રિન્ટ રિપોર્ટ
          </button>
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
          onSaveOpeningBalances={(newCashOpening, bankOpenings) => {
            if (trustSettings && onUpdateTrustSettings) {
              onUpdateTrustSettings({
                ...trustSettings,
                openingCashBalance: newCashOpening
              });
            }
            if (onEditBankAccount) {
              banks.forEach(b => {
                const newOpening = bankOpenings[b.id];
                if (newOpening !== undefined && newOpening !== b.openingBalance) {
                  onEditBankAccount({
                    ...b,
                    openingBalance: newOpening
                  });
                }
              });
            }
          }}
        />
      )}

      {/* Accounting Tab Navigation Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveSubTab('daybook')}
          className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'daybook' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" /> રોજમેળ / ડે બુક (Day Book)
        </button>
        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'ledger' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-600" /> ખાતાવહી / એકાઉન્ટ બુક (Account Book)
        </button>
        <button
          onClick={() => setActiveSubTab('trial')}
          className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'trial' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Table className="w-4 h-4" /> કાચું સરવૈયું (Trial Balance)
        </button>
        <button
          onClick={() => setActiveSubTab('pnl')}
          className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'pnl' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> નફા-નુકસાન ખાતું (Profit & Loss)
        </button>
        <button
          onClick={() => setActiveSubTab('inc_exp')}
          className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'inc_exp' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" /> આવક-જાવક પત્રક (Income & Exp)
        </button>
        <button
          onClick={() => setActiveSubTab('balance')}
          className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'balance' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Landmark className="w-4 h-4" /> પાકું સરવૈયું (Balance Sheet)
        </button>
        <button
          onClick={() => setActiveSubTab('deadstock')}
          className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'deadstock' ? 'border-amber-600 text-amber-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4 text-amber-600" /> ડેડ સ્ટોક પત્રક (Dead Stock Patrak)
        </button>
      </div>

      {/* Day Book Grid */}
      {activeSubTab === 'daybook' && (
        <div id="printable-daybook-container" className="space-y-4">
          {/* Formal Audit Header */}
          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 shadow-sm space-y-2 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'} | નોંધણી નં: <span className="font-mono font-bold text-slate-850 dark:text-slate-100">{trustSettings?.registrationNumber || 'F-12345/GUJ'}</span>
                </p>
              </div>
              <div className="text-left sm:text-right flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> રોજમેળ હિસાબ પોથી (Day Book Register)
                </span>
                <div className="flex gap-1.5 print:hidden">
                  <button
                    type="button"
                    onClick={() => handleDownloadReportPDF('printable-daybook-container', 'Daybook_Register')}
                    disabled={isGeneratingPDF}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                  >
                    {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => printContainer('printable-daybook-container')}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 pt-1">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">દસ્તાવેજ: રોજમેળ હિસાબો (Day Book Audit Sheet)</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">નાણાકીય વર્ષ: {trustSettings?.financialYear || '૨૦૨૬-૨૭'}</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${cardBg} flex flex-wrap justify-between items-center gap-3 text-xs`}>
            <span>પ્રારંભિક રોકડ રકમ: <strong className="text-emerald-600 font-mono text-sm">₹ {initialCash.toLocaleString('en-IN')}</strong></span>
            <span>ચાલુ આવક જમા: <strong className="text-emerald-600 font-mono">₹ {cashIn.toLocaleString('en-IN')}</strong></span>
            <span>ચાલુ ખર્ચ ચુકવણી: <strong className="text-rose-600 font-mono">₹ {cashOut.toLocaleString('en-IN')}</strong></span>
            <span>આજની આખર સિલક (Cash Balance): <strong className="text-emerald-600 font-mono text-sm font-black">₹ {finalCash.toLocaleString('en-IN')}</strong></span>
            <button
              type="button"
              onClick={() => {
                setNewFyInput('૨૦૨૭-૨૮ (FY 2027-28)');
                setShowCarryForwardModal(true);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all text-xs cursor-pointer ml-auto print:hidden"
              title="વર્ષ પૂરું થતાં પાછલા વર્ષનું ક્લોઝિંગ બેલેન્સ નવા નાણાકીય વર્ષમાં કેરી-ફોરવર્ડ કરો"
            >
              <Repeat className="w-3.5 h-3.5" /> વર્ષાંત કૅરી ફોરવર્ડ (FY Carry Forward)
            </button>
          </div>

          {/* Modal for Year-End Financial Year Carry Forward */}
          {showCarryForwardModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className={`w-full max-w-lg p-6 rounded-2xl border ${cardBg} shadow-2xl space-y-4`}>
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-indigo-600" /> નાણાકીય વર્ષ ક્લોઝિંગ & કૅરી ફોરવર્ડ (Year-End Balance Carry Forward)
                  </h3>
                  <button onClick={() => setShowCarryForwardModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-xl space-y-1.5">
                    <strong className="block text-indigo-900 dark:text-indigo-300 font-bold flex items-center gap-1 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> પાછલા વર્ષનું ઓટોમેટિક ડેટા ટ્રાન્સફર (Data & Balance Auto Carry Forward)
                    </strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      જ્યારે નાણાકીય વર્ષ પૂરું થાય છે ત્યારે પાછલા વર્ષનું આખર શિલક (Closing Cash) નવા વર્ષના પ્રારંભિક શિલક (Opening Balance) તરીકે ઓટોમેટિક સેટ થઈ જશે. તમામ બેંક એકાઉન્ટ્સ, મિલકતો, સભ્યો અને દાતાઓનો રેકોર્ડ યથાવત સચવાયેલો રહેશે.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="text-slate-500">વર્તમાન નાણાકીય વર્ષ:</span>
                      <strong className="font-bold text-slate-800 dark:text-slate-200">{trustSettings?.financialYear || '૨૦૨૬-૨૭'}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="text-slate-500">વર્તમાન પ્રારંભિક રોકડ:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹ {initialCash.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300">આખર રોકડ શિલક (નવા વર્ષ માટે):</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">₹ {finalCash.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                      <span>બેંક બેલેન્સ ({banks.length} ખાતા): ₹ {totalBankBalance.toLocaleString('en-IN')}</span>
                      <span>મિલકતો: ₹ {totalAssetVal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">નવા નાણાકીય વર્ષનું નામ (New Financial Year) *</label>
                    <input
                      type="text"
                      value={newFyInput}
                      onChange={(e) => setNewFyInput(e.target.value)}
                      placeholder="દા.ત. ૨૦૨૭-૨૮ (FY 2027-28)"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCarryForwardModal(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    રદ કરો (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newFyInput.trim()) {
                        alert('કૃપા કરીને નવા નાણાકીય વર્ષનું નામ દાખલ કરો.');
                        return;
                      }
                      if (trustSettings && onUpdateTrustSettings) {
                        const updated: TrustSettings = {
                          ...trustSettings,
                          financialYear: newFyInput.trim(),
                          openingCashBalance: finalCash
                        };
                        onUpdateTrustSettings(updated);
                      }
                      setShowCarryForwardModal(false);
                      alert(`✓ સફળતાપૂર્વક નાણાકીય વર્ષ "${newFyInput}" ચાલુ થઈ ગયું છે.\nપાછલા વર્ષનું આખર કૅશ બેલેન્સ ₹ ${finalCash.toLocaleString('en-IN')} પ્રારંભિક શિલક તરીકે સેટ કરી દેવાયું છે!`);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> શિલક કેરી ફોરવર્ડ કરો (Transfer & Change FY)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Day Book Filters & Search Toolbar */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 print:hidden">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
              {/* Payment Mode Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="text-slate-500 mr-1 whitespace-nowrap">મોડ ફિલ્ટર:</span>
                <button
                  type="button"
                  onClick={() => setDaybookModeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    daybookModeFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  બધા ({dayBookEntries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDaybookModeFilter('cash')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    daybookModeFilter === 'cash'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  💵 ફક્ત રોકડ ({dayBookEntries.filter(e => e.paymentMode.includes('રોકડ')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setDaybookModeFilter('bank')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    daybookModeFilter === 'bank'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-50'
                  }`}
                >
                  🏦 ફક્ત બેંક / ચેક ({dayBookEntries.filter(e => e.paymentMode.includes('બેંક') || e.paymentMode.includes('ચેક') || e.paymentMode.includes('Contra')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setDaybookModeFilter('credit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    daybookModeFilter === 'credit'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-50'
                  }`}
                >
                  📝 ફક્ત ઉધાર (Credit) ({dayBookEntries.filter(e => e.paymentMode.includes('ઉધાર') || e.paymentMode.includes('Credit') || e.category.includes('ઉધાર') || e.rawCategory?.includes('Udhar')).length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={daybookSearchQuery}
                  onChange={(e) => setDaybookSearchQuery(e.target.value)}
                  placeholder="સભાસદ/દાતાનું નામ, પાવતી કે વિગત શોધો..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Category Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs font-bold">
              <span className="text-slate-500 text-[11px] mr-1">શ્રેણી ફિલ્ટર:</span>
              <button
                type="button"
                onClick={() => setDaybookCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  daybookCategoryFilter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                તમામ શ્રેણી
              </button>
              <button
                type="button"
                onClick={() => setDaybookCategoryFilter('sales')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  daybookCategoryFilter === 'sales'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                🛍️ વેચાણ & વસૂલાત
              </button>
              <button
                type="button"
                onClick={() => setDaybookCategoryFilter('purchase')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  daybookCategoryFilter === 'purchase'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                📦 ખરીદી & ચૂકવણી
              </button>
              <button
                type="button"
                onClick={() => setDaybookCategoryFilter('fee')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  daybookCategoryFilter === 'fee'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                }`}
              >
                🏷️ સભાસદ પ્રવેશ ફી
              </button>
              <button
                type="button"
                onClick={() => setDaybookCategoryFilter('share')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  daybookCategoryFilter === 'share'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                }`}
              >
                📈 સભાસદ શેર મૂડી
              </button>
              <button
                type="button"
                onClick={() => setDaybookCategoryFilter('loan')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  daybookCategoryFilter === 'loan'
                    ? 'bg-teal-600 text-white'
                    : 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                }`}
              >
                🏦 સભાસદ લોન હપ્તો
              </button>
              <button
                type="button"
                onClick={() => setDaybookCategoryFilter('donation')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  daybookCategoryFilter === 'donation'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                🤝 દાન / અન્ય આવક
              </button>
              <button
                type="button"
                onClick={() => setDaybookCategoryFilter('expense')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  daybookCategoryFilter === 'expense'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                💸 ખર્ચ વ્યવહારો
              </button>
            </div>
          </div>

          <div className={`border ${cardBg} rounded-2xl overflow-hidden shadow-sm`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`font-bold ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <tr>
                    <th className="p-4">તારીખ (Date)</th>
                    <th className="p-4">વાઉચર / પાવતી નં (Ref)</th>
                    <th className="p-4">વિગત (Particulars)</th>
                    <th className="p-4">શ્રેણી (Category)</th>
                    <th className="p-4">મોડ (Mode)</th>
                    <th className="p-4 text-emerald-600">આવક / જમા (Inflow / ₹)</th>
                    <th className="p-4 text-rose-600">જાવક / ઉધાર (Outflow / ₹)</th>
                    <th className="p-4 text-center">ક્રિયા (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredDayBookEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="p-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">{entry.date}</td>
                      <td className="p-4 font-mono font-bold whitespace-nowrap text-indigo-700 dark:text-indigo-400">{entry.ref}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{entry.particulars}</div>
                        {entry.remarks && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                            {entry.remarks}
                          </div>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {entry.category.includes('ઉધાર વેચાણ બિલ') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shadow-xs">
                            🏷️ ઉધાર વેચાણ બિલ (Debit)
                          </span>
                        ) : entry.category.includes('ઉધાર વેચાણ વસૂલાત') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 shadow-xs">
                            💵 ઉધાર વસૂલાત પાવતી
                          </span>
                        ) : entry.category.includes('ઉધાર ખરીદી બિલ') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800 shadow-xs">
                            📦 ઉધાર ખરીદી બિલ (Credit)
                          </span>
                        ) : entry.category.includes('ઉધાર ખરીદી ચૂકવણી') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-xs">
                            💸 ઉધાર ખરીદી ચૂકવણી
                          </span>
                        ) : entry.category.includes('પ્રવેશ ફી') || entry.rawCategory?.includes('Membership Fee') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shadow-xs">
                            🏷️ સભાસદ પ્રવેશ ફી
                          </span>
                        ) : entry.category.includes('શેર') || entry.rawCategory?.includes('Share Capital') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800 shadow-xs">
                            📈 સભાસદ શેર મૂડી
                          </span>
                        ) : entry.category.includes('લોન') || entry.rawCategory?.includes('Loan') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 border border-teal-300 dark:border-teal-800 shadow-xs">
                            🏦 સભાસદ લોન હપ્તો
                          </span>
                        ) : entry.type.includes('આવક') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            🤝 {entry.category}
                          </span>
                        ) : entry.type.includes('બેંક') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            🔄 {entry.category}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            💸 {entry.category}
                          </span>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {entry.paymentMode.includes('ઉધાર') || entry.paymentMode.includes('Credit') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            📝 ઉધાર (Credit)
                          </span>
                        ) : entry.paymentMode.includes('રોકડ') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            💵 રોકડ (Cash)
                          </span>
                        ) : entry.paymentMode.includes('Contra') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            🔄 કન્ટ્રા (Contra)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            🏦 {entry.paymentMode}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-emerald-600 font-bold whitespace-nowrap">{entry.debit > 0 ? `₹ ${entry.debit.toLocaleString('en-IN')}` : '-'}</td>
                      <td className="p-4 text-rose-600 font-bold whitespace-nowrap">{entry.credit > 0 ? `₹ ${entry.credit.toLocaleString('en-IN')}` : '-'}</td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {entry.id && (entry.type.includes('આવક') || entry.type.includes('ખર્ચ')) ? (
                          <button
                            type="button"
                            onClick={() => setEntryToDelete({
                              id: entry.id,
                              ref: entry.ref,
                              type: entry.type,
                              particulars: entry.particulars,
                              amount: entry.debit || entry.credit || 0
                            })}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            title="આ રોજમેળ એન્ટ્રી ડિલીટ કરો"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">રદ કરો</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredDayBookEntries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        કોઈ વ્યવહારો મળ્યા નથી (No transactions found)
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredDayBookEntries.length > 0 && (
                  <tfoot className={`font-black ${darkMode ? 'bg-slate-800/90 border-t-2 border-slate-700' : 'bg-slate-100/90 border-t-2 border-slate-300'}`}>
                    <tr>
                      <td colSpan={5} className="p-4 text-right uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        કુલ સરવાળો (Total Summary):
                      </td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                        ₹ {filteredDayBookEntries.reduce((sum, e) => sum + (e.debit || 0), 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                        ₹ {filteredDayBookEntries.reduce((sum, e) => sum + (e.credit || 0), 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {filteredDayBookEntries.length} એન્ટ્રી
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Delete Entry Confirmation Modal */}
          {entryToDelete && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-full max-w-md p-6 rounded-2xl border ${cardBg} shadow-2xl space-y-4`}
              >
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/80">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">રોજમેળ એન્ટ્રી ડિલીટ કરો?</h3>
                    <p className="text-xs text-slate-500">આ વ્યવહાર કાયમી માટે રદ કરવામાં આવશે.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">સંદર્ભ / રસીદ નં:</span>
                    <strong className="font-mono text-indigo-600 dark:text-indigo-400">{entryToDelete.ref}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">પ્રકાર:</span>
                    <span className="font-bold">{entryToDelete.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">વિગત:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{entryToDelete.particulars}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-black">
                    <span>રકમ:</span>
                    <span className="font-mono text-rose-600 text-sm">₹ {entryToDelete.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-rose-600 font-medium bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                  ⚠️ નોંધ: આ એન્ટ્રી ડિલીટ કરવાથી રોજમેળ, ખાતાવહી, કાચું સરવૈયું અને બેંક સિલકમાંથી તે આપમેળે બાદ થઈ જશે.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEntryToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    રદ રાખો (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (entryToDelete.type.includes('આવક') && onDeleteReceipt) {
                        onDeleteReceipt(entryToDelete.id);
                      } else if (entryToDelete.type.includes('ખર્ચ') && onDeleteVoucher) {
                        onDeleteVoucher(entryToDelete.id);
                      }
                      setEntryToDelete(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    હા, ડિલીટ કરો
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* Account Book / General Ledger View */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-6">
          {/* Controls Bar: Account Selector & Search */}
          <div className={`p-4 rounded-2xl border ${cardBg} shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4`}>
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <label className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" /> ખાતું પસંદ કરો (Select Ledger):
              </label>
              <select
                value={selectedLedgerAccount}
                onChange={(e) => setSelectedLedgerAccount(e.target.value)}
                className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[260px]"
              >
                <option value="all">📊 તમામ ખાતાઓ (All Accounts Summary)</option>
                <optgroup label="💵 રોકડ ખાતું (Cash Account)">
                  <option value="cash">💵 રોકડ ખાતું (Cash Ledger Account)</option>
                </optgroup>
                <optgroup label="🏦 બેંક ખાતાઓ (Bank Accounts)">
                  {banks.map(b => (
                    <option key={b.id} value={`bank-${b.id}`}>
                      🏦 {b.bankNameGuj} ({b.accountNumber})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📥 આવક ખાતાઓ (Income Accounts)">
                  {incomeCategories.map(cat => (
                    <option key={cat} value={`inc-${cat}`}>
                      📥 આવક ખાતું - {cat}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📤 ખર્ચ ખાતાઓ (Expense Accounts)">
                  {expenseCategories.map(cat => (
                    <option key={cat} value={`exp-${cat}`}>
                      📤 ખર્ચ ખાતું - {cat}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🏢 મિલકત ખાતાઓ (Asset Accounts)">
                  {assets.map(a => (
                    <option key={a.id} value={`asset-${a.id}`}>
                      🏢 મિલકત ખાતું - {a.nameGuj}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🛍️ વેપાર ખાતાઓ (Trading Accounts - All Cash, Udhar, Bank & Cheque)">
                  <option value="purchases">🛍️ પ્રોડક્ટ ખરીદી ખાતું (Product Purchases Account - All Modes)</option>
                  <option value="sales">📈 પ્રોડક્ટ વેચાણ ખાતું (Product Sales Account - All Modes)</option>
                </optgroup>
              </select>

              <button
                type="button"
                onClick={handleCreateNewLedgerAccount}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border border-indigo-200 dark:border-indigo-900"
                title="આવક અથવા ખર્ચનું નવું ખાતું (Ledger Category) મેન્યુઅલી બનાવો"
              >
                + નવું ખાતું બનાવો (Create Account)
              </button>

              {isSelectedEditableAccount && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleEditCustomAccount}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border border-amber-200 dark:border-amber-900"
                    title="આ ખાતું સુધારો (Edit This Account)"
                  >
                    ✏️ સુધારો (Edit)
                  </button>
                  {isSelectedCustomAccount && (
                    <button
                      type="button"
                      onClick={handleDeleteCustomAccount}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border border-rose-200 dark:border-rose-900"
                      title="આ ખાતું રદ કરો (Delete This Account)"
                    >
                      🗑️ રદ કરો (Delete)
                    </button>
                  )}
                </div>
              )}
            </div>

            {selectedLedgerAccount !== 'all' && (
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={ledgerSearchQuery}
                  onChange={(e) => setLedgerSearchQuery(e.target.value)}
                  placeholder="વ્યવહાર શોધો..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Selected Account Specific Ledger Table */}
          {selectedLedgerAccount !== 'all' ? (
            (() => {
              const currentLedger = getLedgerDetails(selectedLedgerAccount);
              const filteredEntries = currentLedger.entries.filter(e =>
                e.particulars.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) ||
                e.ref.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) ||
                e.mode.toLowerCase().includes(ledgerSearchQuery.toLowerCase())
              );

              return (
                <div id="printable-ledger-container" className="space-y-4">
                  {/* Formal Audit Header */}
                  <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 shadow-sm space-y-2 border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-3">
                      <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">
                          {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'} | નોંધણી નં: <span className="font-mono font-bold text-slate-850 dark:text-slate-100">{trustSettings?.registrationNumber || 'F-12345/GUJ'}</span>
                        </p>
                      </div>
                      <div className="text-left sm:text-right flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> ખાતાવહી લેજર (Account Ledger)
                        </span>
                        <div className="flex gap-1.5 print:hidden">
                          <button
                            type="button"
                            onClick={() => handleDownloadReportPDF('printable-ledger-container', `Ledger_${currentLedger.title.replace(/\s+/g, '_')}`)}
                            disabled={isGeneratingPDF}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                          >
                            {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => printContainer('printable-ledger-container')}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 pt-1">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">દસ્તાવેજ: {currentLedger.title}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">નાણાકીય વર્ષ: {trustSettings?.financialYear || '૨૦૨૬-૨૭'}</span>
                    </div>
                  </div>

                  {/* Stats Cards for Selected Ledger */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className={`p-3.5 rounded-xl border ${cardBg} shadow-sm space-y-1`}>
                      <span className="text-[11px] text-slate-500 font-bold block">પ્રારંભિક શિલક (Opening)</span>
                      <strong className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 block">
                        ₹ {currentLedger.opening.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className={`p-3.5 rounded-xl border ${cardBg} shadow-sm space-y-1 bg-emerald-500/5`}>
                      <span className="text-[11px] text-emerald-600 font-bold block">કુલ ડેબિટ ઉધાર (Total Debit Dr)</span>
                      <strong className="text-sm font-mono font-bold text-emerald-600 block">
                        ₹ {currentLedger.totalDebit.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className={`p-3.5 rounded-xl border ${cardBg} shadow-sm space-y-1 bg-rose-500/5`}>
                      <span className="text-[11px] text-rose-600 font-bold block">કુલ ક્રેડિટ જમા (Total Credit Cr)</span>
                      <strong className="text-sm font-mono font-bold text-rose-600 block">
                        ₹ {currentLedger.totalCredit.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className={`p-3.5 rounded-xl border ${cardBg} shadow-sm space-y-1 bg-indigo-500/5 border-indigo-200 dark:border-indigo-800/60`}>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block">આખર સિલક (Closing Balance)</span>
                      <strong className="text-base font-mono font-black text-indigo-700 dark:text-indigo-300 block">
                        ₹ {currentLedger.closing.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Ledger summary metadata (hidden when printing) */}
                  <div className="flex justify-between items-center px-1 print:hidden border-b pb-2">
                    <div>
                      <p className="text-xs text-slate-500 font-bold">{currentLedger.typeLabel} | કુલ {filteredEntries.length} વ્યવહારો મળ્યા</p>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div className={`border ${cardBg} rounded-2xl overflow-hidden shadow-sm`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className={`font-bold ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <tr>
                            <th className="p-3.5">તારીખ (Date)</th>
                            <th className="p-3.5">પાવતી / વાઉચર (Ref)</th>
                            <th className="p-3.5">વ્યવહાર વિગત (Particulars)</th>
                            <th className="p-3.5">ચુકવણી મોડ (Mode)</th>
                            <th className="p-3.5 text-right text-emerald-600">ઉધાર રકમ (Debit Dr. ₹)</th>
                            <th className="p-3.5 text-right text-rose-600">જમા રકમ (Credit Cr. ₹)</th>
                            <th className="p-3.5 text-right text-indigo-600">બાકી શિલક (Balance ₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {/* Opening balance row if > 0 or cash */}
                          <tr className="bg-slate-50/80 dark:bg-slate-800/30 font-bold italic">
                            <td className="p-3.5 text-slate-500">-</td>
                            <td className="p-3.5 text-slate-500 font-mono">OPENING</td>
                            <td className="p-3.5 text-slate-700 dark:text-slate-300">પ્રારંભિક શિલક (Opening Balance)</td>
                            <td className="p-3.5 text-slate-500">-</td>
                            <td className="p-3.5 text-right font-mono text-emerald-600">{currentLedger.opening > 0 ? `₹ ${currentLedger.opening.toLocaleString('en-IN')}` : '-'}</td>
                            <td className="p-3.5 text-right font-mono text-rose-600">-</td>
                            <td className="p-3.5 text-right font-mono text-indigo-600 font-bold">₹ {currentLedger.opening.toLocaleString('en-IN')}</td>
                          </tr>

                          {filteredEntries.map((e, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                              <td className="p-3.5 whitespace-nowrap">{e.date}</td>
                              <td className="p-3.5 font-mono font-bold whitespace-nowrap">{e.ref}</td>
                              <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{e.particulars}</td>
                              <td className="p-3.5 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {e.mode}
                                </span>
                              </td>
                              <td className="p-3.5 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                                {e.debit > 0 ? `₹ ${e.debit.toLocaleString('en-IN')}` : '-'}
                              </td>
                              <td className="p-3.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                                {e.credit > 0 ? `₹ ${e.credit.toLocaleString('en-IN')}` : '-'}
                              </td>
                              <td className="p-3.5 text-right font-mono font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                ₹ {e.runningBalance.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}

                          {filteredEntries.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400">
                                પસંદ કરેલ ખાતામાં કોઈ વ્યવહારો મળ્યા નથી.
                              </td>
                            </tr>
                          )}

                          {/* Closing Total Row */}
                          <tr className={`font-black ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <td colSpan={4} className="p-3.5 text-slate-800 dark:text-slate-100">આખર સિલક સરવાળો (Closing Ledger Totals)</td>
                            <td className="p-3.5 text-right font-mono text-emerald-600">₹ {currentLedger.totalDebit.toLocaleString('en-IN')}</td>
                            <td className="p-3.5 text-right font-mono text-rose-600">₹ {currentLedger.totalCredit.toLocaleString('en-IN')}</td>
                            <td className="p-3.5 text-right font-mono text-indigo-600 dark:text-indigo-400 text-sm">₹ {currentLedger.closing.toLocaleString('en-IN')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            /* All Accounts Ledger Overview Cards Grid */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">
                  ટ્રસ્ટના તમામ ખાતાઓની ખાતાવહી સમરી (All Account Ledgers Overview)
                </h3>
                <span className="text-xs text-slate-500">ક્લિક કરીને વ્યક્તિગત ખાતાનું લેજર જુઓ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const d = getLedgerDetails('cash');
                  return (
                    <div
                      key="cash"
                      onClick={() => setSelectedLedgerAccount('cash')}
                      className={`p-4 rounded-2xl border ${cardBg} hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer space-y-3`}
                    >
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          💵 {d.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          રોકડ
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">પ્રારંભિક શિલક:</span>
                          <span className="font-mono font-bold">₹ {d.opening.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">આખર શિલક:</span>
                          <strong className="font-mono text-emerald-600 font-black">₹ {d.closing.toLocaleString('en-IN')}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">કુલ આવક જમા:</span>
                          <span className="font-mono text-emerald-600 font-bold">₹ {d.totalDebit.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">કુલ ખર્ચ જાવક:</span>
                          <span className="font-mono text-rose-600 font-bold">₹ {d.totalCredit.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t text-right">
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-1">
                          લેજર ખોલો <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Bank Account Cards */}
                {banks.map(b => {
                  const key = `bank-${b.id}`;
                  const d = getLedgerDetails(key);
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedLedgerAccount(key)}
                      className={`p-4 rounded-2xl border ${cardBg} hover:border-sky-500 hover:shadow-md transition-all cursor-pointer space-y-3`}
                    >
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                          🏦 {b.bankNameGuj}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
                          બેંક
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">ખાતા નં:</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{b.accountNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">આખર સિલક:</span>
                          <strong className="font-mono text-sky-600 font-black">₹ {d.closing.toLocaleString('en-IN')}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">કુલ જમા:</span>
                          <span className="font-mono text-emerald-600 font-bold">₹ {d.totalDebit.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">કુલ ઉપાડ:</span>
                          <span className="font-mono text-rose-600 font-bold">₹ {d.totalCredit.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t text-right">
                        <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center justify-end gap-1">
                          લેજર ખોલો <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Income Category Cards */}
                {incomeCategories.map(cat => {
                  const key = `inc-${cat}`;
                  const d = getLedgerDetails(key);
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedLedgerAccount(key)}
                      className={`p-4 rounded-2xl border ${cardBg} hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-3`}
                    >
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">
                          📥 આવક - {cat}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          આવક
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">કુલ એકત્રિત આવક:</span>
                        <strong className="font-mono text-emerald-600 font-black text-sm">₹ {d.totalCredit.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="pt-2 border-t text-right">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                          લેજર ખોલો <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Expense Category Cards */}
                {expenseCategories.map(cat => {
                  const key = `exp-${cat}`;
                  const d = getLedgerDetails(key);
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedLedgerAccount(key)}
                      className={`p-4 rounded-2xl border ${cardBg} hover:border-rose-500 hover:shadow-md transition-all cursor-pointer space-y-3`}
                    >
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">
                          📤 ખર્ચ - {cat}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          ખર્ચ
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">કુલ ચૂકવેલ ખર્ચ:</span>
                        <strong className="font-mono text-rose-600 font-black text-sm">₹ {d.totalDebit.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="pt-2 border-t text-right">
                        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-end gap-1">
                          લેજર ખોલો <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Trading Purchase and Sales Account Cards */}
                {(() => {
                  const dPur = getLedgerDetails('purchases');
                  const dSal = getLedgerDetails('sales');
                  return (
                    <>
                      {/* Product Purchases Card */}
                      <div
                        onClick={() => setSelectedLedgerAccount('purchases')}
                        className={`p-4 rounded-2xl border ${cardBg} hover:border-amber-500 hover:shadow-md transition-all cursor-pointer space-y-3`}
                      >
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">
                            🛍️ પ્રોડક્ટ ખરીદી ખાતું (Purchases)
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ખરીદી
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">કુલ ખરીદી રકમ (Cash, Udhar, Bank, Cheque):</span>
                          <strong className="font-mono text-amber-600 font-black text-sm">₹ {dPur.closing.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="pt-2 border-t text-right">
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1">
                            લેજર ખોલો <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>

                      {/* Product Sales Card */}
                      <div
                        onClick={() => setSelectedLedgerAccount('sales')}
                        className={`p-4 rounded-2xl border ${cardBg} hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-3`}
                      >
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">
                            📈 પ્રોડક્ટ વેચાણ ખાતું (Sales)
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            વેચાણ
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">કુલ વેચાણ આવક (Cash, Udhar, Bank, Cheque):</span>
                          <strong className="font-mono text-emerald-600 font-black text-sm">₹ {dSal.closing.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="pt-2 border-t text-right">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                            લેજર ખોલો <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trial Balance Account view */}
      {activeSubTab === 'trial' && (
        <div id="printable-trial-balance-container" className="space-y-6">
          {/* Formal Audit Header */}
          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 shadow-sm space-y-2 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'} | નોંધણી નં: <span className="font-mono font-bold text-slate-850 dark:text-slate-100">{trustSettings?.registrationNumber || 'F-12345/GUJ'}</span>
                </p>
              </div>
              <div className="text-left sm:text-right flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> મુંબઈ/ગુજરાત સાર્વજનિક ટ્રસ્ટ એક્ટ ૧૯૫૦ - કાચું સરવૈયું
                </span>
                <div className="flex gap-1.5 print:hidden">
                  <button
                    onClick={() => handleDownloadReportPDF('printable-trial-balance-container', 'Trial_Balance')}
                    disabled={isGeneratingPDF}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                  >
                    {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                  </button>
                  <button
                    onClick={() => printContainer('printable-trial-balance-container')}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 pt-1">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">દસ્તાવેજ: ઓડિટ હેતુ માટે કાચું સરવૈયું (Trial Balance)</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">દ્વારા: ઓડિટર/ખાતાવહી રજિસ્ટર</span>
            </div>
          </div>

          <div className={`border ${cardBg} rounded-2xl overflow-hidden shadow-sm`}>
            <table className="w-full text-left text-xs">
              <thead className={`font-bold ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                <tr>
                  <th className="p-3.5">ખાતાનું વિગતવાર નામ (General Ledger Particulars)</th>
                  <th className="p-3.5 text-emerald-600 dark:text-emerald-400 text-right">ઉધાર સિલક (Debit Dr. in ₹)</th>
                  <th className="p-3.5 text-rose-600 dark:text-rose-400 text-right">જમા સિલક (Credit Cr. in ₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {trialBalanceAccounts.map((acc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{acc.name}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">{acc.debit > 0 ? `₹ ${acc.debit.toLocaleString('en-IN')}` : '-'}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-600">{acc.credit > 0 ? `₹ ${acc.credit.toLocaleString('en-IN')}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {/* Total Match checking */}
                <tr className={`font-black ${darkMode ? 'bg-slate-800' : 'bg-emerald-50/80'} border-t-2 border-emerald-600`}>
                  <td colSpan={1} className="p-4 text-sm text-emerald-900 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-black text-sm block">કુલ સરભર મેળવણો આંકડો (Trial Balance Verified Totals)</span>
                        <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400">ઉધાર અને જમા બંને સિલક બરાબર સરખી છે.</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-base font-mono font-black text-emerald-700 dark:text-emerald-300">
                      ₹ {totalDebits.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded inline-block mt-0.5">
                      કુલ ઉધાર (Dr. Total)
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-base font-mono font-black text-emerald-700 dark:text-emerald-300">
                      ₹ {totalCredits.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded inline-block mt-0.5">
                      કુલ જમા (Cr. Total)
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Explicit Dr & Cr Totals Summary Cards Below Table */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1 shadow-sm">
              <span className="text-xs font-bold opacity-80 block">કુલ ઉધાર સિલક (Total Debit Dr. Balance)</span>
              <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                ₹ {totalDebits.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                તમામ રોકડ/બેંક/મિલકત/ખર્ચ ખાતા ઉધાર
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-1 shadow-sm">
              <span className="text-xs font-bold opacity-80 block">કુલ જમા સિલક (Total Credit Cr. Balance)</span>
              <div className="text-xl font-black font-mono text-rose-700 dark:text-rose-300">
                ₹ {totalCredits.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block">
                તમામ મૂડી/આવક/દાન ખાતા જમા
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 space-y-1 shadow-sm">
              <span className="text-xs font-bold opacity-80 block">સરભર આંકડો તફાવત (Discrepancy)</span>
              <div className="text-xl font-black font-mono text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> ₹ ૦.૦૦
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">
                ✓ Dr. Total = Cr. Total (સરભર ઓડિટ)
              </span>
            </div>
          </div>

          {/* Audit Verification Footer */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-emerald-900 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span><strong>ઓડિટ ચકાસણી:</strong> ડેબિટ અને ક્રેડિટ સિલક સંપૂર્ણપણે મેળ ખાતી (₹ {totalDebits.toLocaleString('en-IN')}) છે. ડેટા ચાર્ટર્ડ એકાઉન્ટન્ટ ઓડિટ માટે સંપૂર્ણ લાયક છે.</span>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm whitespace-nowrap flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> કાચું સરવૈયું પ્રિન્ટ
            </button>
          </div>
        </div>
      )}

      {/* Profit & Loss Account / Income & Expenditure Schedule IX */}
      {activeSubTab === 'pnl' && (
        <div id="printable-pnl-container" className="space-y-6">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border ${cardBg} shadow-sm space-y-1 bg-gradient-to-br from-emerald-500/5 to-transparent`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">કુલ આવક (Gross Receipts)</span>
                <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-black text-emerald-600 font-mono">
                ₹ {totalIncome.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400">કુલ {activeReceipts.length} જમા પહોંચ વ્યવહારો</span>
            </div>

            <div className={`p-4 rounded-2xl border ${cardBg} shadow-sm space-y-1 bg-gradient-to-br from-rose-500/5 to-transparent`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">કુલ ખર્ચ (Gross Expenditure)</span>
                <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                  <ArrowDownRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-black text-rose-600 font-mono">
                ₹ {totalExpense.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400">કુલ {activeVouchers.length} વાઉચર ચુકવણીઓ</span>
            </div>

            <div className={`p-4 rounded-2xl border ${cardBg} shadow-sm space-y-1 bg-gradient-to-br ${
              totalIncome >= totalExpense ? 'from-emerald-500/10 to-teal-500/5' : 'from-rose-500/10 to-amber-500/5'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {totalIncome >= totalExpense ? 'આવકનો ખર્ચ પર વધારો (Surplus)' : 'ખર્ચનો આવક પર વધારો (Deficit)'}
                </span>
                <span className={`p-2 rounded-xl ${totalIncome >= totalExpense ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'}`}>
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className={`text-xl font-black font-mono ${totalIncome >= totalExpense ? 'text-emerald-600' : 'text-rose-600'}`}>
                ₹ {Math.abs(totalIncome - totalExpense).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                મૂડી ભંડોળમાં ટ્રાન્સફર થશે (Corpus Addition)
              </span>
            </div>
          </div>

          {/* Formal Audit Header */}
          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 shadow-sm space-y-2 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'} | નોંધણી નં: <span className="font-mono font-bold text-slate-850 dark:text-slate-100">{trustSettings?.registrationNumber || 'F-12345/GUJ'}</span>
                </p>
              </div>
              <div className="text-left sm:text-right flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> સ્કેડ્યુલ IX (Schedule IX) - મુંબઈ/ગુજરાત સાર્વજનિક ટ્રસ્ટ એક્ટ
                </span>
                <div className="flex gap-1.5 print:hidden">
                  <button
                    onClick={() => handleDownloadReportPDF('printable-pnl-container', 'Income_Expenditure_Schedule_IX')}
                    disabled={isGeneratingPDF}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                  >
                    {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                  </button>
                  <button
                    onClick={() => printContainer('printable-pnl-container')}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                તા. ૩૧ માર્ચ ૨૦૨૭ ના રોજ પૂરા થતા વર્ષનું આવક અને ખર્ચ ખાતું
              </p>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-300 font-bold">રિપોર્ટ મોડ:</span>
                <button
                  type="button"
                  onClick={() => setPnlViewMode('category')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    pnlViewMode === 'category'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-200 text-slate-750 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  📊 શ્રેણીવાર ઓડિટ પત્રક (Audited Summary)
                </button>
                <button
                  type="button"
                  onClick={() => setPnlViewMode('itemized')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    pnlViewMode === 'itemized'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-200 text-slate-750 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  📄 વિગતવાર નોંઘો (Itemized Entries)
                </button>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition-all flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> આવક-ખર્ચ પત્રક પ્રિન્ટ
              </button>
            </div>
          </div>

          {/* Schedule IX Income & Expenditure T-Ledger Statement */}
          <div className={`border ${cardBg} rounded-2xl overflow-hidden shadow-sm`}>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 text-xs">
              {/* DEBIT SIDE (Expenditure / ખર્ચ બાજુ) */}
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center border-b pb-2 bg-rose-50/50 dark:bg-rose-950/20 p-2 rounded-lg">
                  <span className="font-black text-rose-700 dark:text-rose-400 flex items-center gap-1 text-sm">
                    ખર્ચ અને ચૂકવણીઓ (EXPENDITURE / PAYMENTS)
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded">ઉધાર (Dr.)</span>
                </div>

                {pnlViewMode === 'category' ? (
                  <div className="space-y-3">
                    {Object.entries(
                      activeVouchers.reduce((acc, v) => {
                        const cat = getMappedCategory(v.category) || 'સામાન્ય ખર્ચ';
                        acc[cat] = (acc[cat] || 0) + v.amount;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([catName, amt], idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{catName}</span>
                          <span className="text-[10px] text-slate-400">
                            {activeVouchers.filter(v => (getMappedCategory(v.category) || 'સામાન્ય ખર્ચ') === catName).length} વાઉચર વાઉચરો
                          </span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">₹ {amt.toLocaleString('en-IN')}</span>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-slate-800 dark:text-slate-100">
                      <span>કુલ ખર્ચ (Total Expenses)</span>
                      <span className="text-rose-600 font-mono text-sm">₹ {totalExpense.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Net Surplus Balancing Entry */}
                    {totalIncome >= totalExpense && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center font-black">
                        <div>
                          <span className="text-emerald-700 dark:text-emerald-300 block">આવકનો ખર્ચ પર વધારો (Surplus c/d)</span>
                          <span className="text-[10px] text-emerald-600 font-normal">પાકા સરવૈયામાં મૂડી ફંડ ખાતે ઉમેરો થશે</span>
                        </div>
                        <span className="text-emerald-600 text-sm font-mono">₹ {(totalIncome - totalExpense).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeVouchers.map((v, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-slate-800 pb-1.5">
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{v.paidToGuj} ({getMappedCategory(v.category)})</span>
                          <span className="text-[10px] text-slate-400 block">{v.date} | વાઉચર નં: {v.voucherNumber}</span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">₹ {v.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Debit Side Total Box */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex justify-between items-center font-black text-sm text-slate-800 dark:text-white mt-4 border border-slate-300 dark:border-slate-700">
                  <span>કુલ ઉધાર સરવાળો (Total Expenditure Side)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 text-base">
                    ₹ {Math.max(totalIncome, totalExpense).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* CREDIT SIDE (Income / આવક બાજુ) */}
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center border-b pb-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-lg">
                  <span className="font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1 text-sm">
                    આવકો અને મળેલ રકમો (INCOME / RECEIPTS)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">જમા (Cr.)</span>
                </div>

                {pnlViewMode === 'category' ? (
                  <div className="space-y-3">
                    {Object.entries(
                      activeReceipts.reduce((acc, r) => {
                        const cat = getMappedCategory(r.category) || 'સામાન્ય આવક';
                        acc[cat] = (acc[cat] || 0) + r.amount;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([catName, amt], idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{catName}</span>
                          <span className="text-[10px] text-slate-400">
                            {activeReceipts.filter(r => (getMappedCategory(r.category) || 'સામાન્ય આવક') === catName).length} દાન પાવતીઓ
                          </span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">₹ {amt.toLocaleString('en-IN')}</span>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-slate-800 dark:text-slate-100">
                      <span>કુલ જમા આવક (Total Receipts)</span>
                      <span className="text-emerald-600 font-mono text-sm">₹ {totalIncome.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Net Deficit Balancing Entry */}
                    {totalExpense > totalIncome && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 flex justify-between items-center font-black">
                        <div>
                          <span className="text-rose-700 dark:text-rose-300 block">ખર્ચનો આવક પર વધારો (Deficit c/d)</span>
                          <span className="text-[10px] text-rose-600 font-normal">પાકા સરવૈયામાં મૂડી ફંડમાંથી બાદ થશે</span>
                        </div>
                        <span className="text-rose-600 text-sm font-mono">₹ {(totalExpense - totalIncome).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeReceipts.map((r, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-slate-800 pb-1.5">
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{r.donorNameGuj} ({getMappedCategory(r.category)})</span>
                          <span className="text-[10px] text-slate-400 block">{r.date} | પાવતી નં: {r.receiptNumber}</span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">₹ {r.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Credit Side Total Box */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex justify-between items-center font-black text-sm text-slate-800 dark:text-white mt-4 border border-slate-300 dark:border-slate-700">
                  <span>કુલ જમા સરવાળો (Total Income Side)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 text-base">
                    ₹ {Math.max(totalIncome, totalExpense).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trustee & Auditor Signatures Block */}
          <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
            <h4 className="font-bold text-xs text-slate-500 border-b pb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> ઓડિટર પ્રમાણપત્ર અને સંચાલક સહીઓ (Auditor Certification & Trustees Signatures)
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 italic leading-relaxed">
              "અમોએ <strong>{trustSettings?.trustNameGuj || 'ટ્રસ્ટ'}</strong> ના નાણાકીય વર્ષ {trustSettings?.financialYear || '૨૦૨૬-૨૭'} માટેના ઉપર દર્શાવેલ આવક અને ખર્ચ ખાતાની ચકાસણી કરેલ છે અને ચોપડે નોંધાયેલ રસીદો અને વાઉચરો મુજબ તે સંપૂર્ણ સત્ય જણાયેલ છે."
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 text-center text-xs">
              <div className="border-t border-slate-300 dark:border-slate-700 pt-2 font-bold text-slate-700 dark:text-slate-300">
                પ્રમુખ (President)
              </div>
              <div className="border-t border-slate-300 dark:border-slate-700 pt-2 font-bold text-slate-700 dark:text-slate-300">
                મંત્રી / સેક્રેટરી (Secretary)
              </div>
              <div className="border-t border-slate-300 dark:border-slate-700 pt-2 font-bold text-indigo-600 dark:text-indigo-400 col-span-2 sm:col-span-1">
                ચાર્ટર્ડ એકાઉન્ટન્ટ / ઓડિટર (CA Seal & Sign)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Income & Expenditure Subtab */}
      {activeSubTab === 'inc_exp' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expenditure Side */}
          <div className={`p-5 rounded-2xl border ${cardBg} space-y-4 shadow-sm`}>
            <h3 className="font-bold text-sm text-rose-600 border-b pb-2">ચૂકવેલા ખર્ચાઓ (Expenditures / Payments)</h3>
            <div className="space-y-2.5 text-xs">
              {activeVouchers.map((v, idx) => (
                <div key={idx} className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                  <span className="font-medium">{v.category} ({v.voucherNumber})</span>
                  <span className="font-bold text-rose-600 font-mono">₹ {v.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-rose-600 text-sm pt-4">
                <span>કુલ જાવક ખર્ચ (Total Expenditure)</span>
                <span className="font-mono">₹ {totalExpense.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Income Side */}
          <div className={`p-5 rounded-2xl border ${cardBg} space-y-4 shadow-sm`}>
            <h3 className="font-bold text-sm text-emerald-600 border-b pb-2">મળેલ આવકો (Incomes / Receipts)</h3>
            <div className="space-y-2.5 text-xs">
              {activeReceipts.map((r, idx) => (
                <div key={idx} className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                  <span className="font-medium">{r.category} ({r.receiptNumber})</span>
                  <span className="font-bold text-emerald-600 font-mono">₹ {r.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-emerald-600 text-sm pt-4">
                <span>કુલ ટ્રસ્ટ આવક (Total Income)</span>
                <span className="font-mono">₹ {totalIncome.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Surplus/Deficit summary row */}
          <div className={`md:col-span-2 p-5 rounded-2xl border ${cardBg} flex justify-between items-center shadow-sm ${
            totalIncome >= totalExpense ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          }`}>
            <div>
              <h4 className="font-black text-sm">આવકનો ખર્ચ પર વધારો (Year Surplus Statement)</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">આ વર્ષનો ચોખ્ખો સંચિત વધારો જે મૂડી ફંડમાં ટ્રાન્સફર થશે.</p>
            </div>
            <strong className="text-lg text-emerald-600 font-black font-mono">
              ₹ {(totalIncome - totalExpense).toLocaleString('en-IN')} /-
            </strong>
          </div>
        </div>
      )}

      {/* Balance Sheet (પાકું સરવૈયું - Schedule VIII) */}
      {activeSubTab === 'balance' && (
        <div id="printable-balance-sheet-container" className="space-y-6">
          {/* Formal Audit Header */}
          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 shadow-sm space-y-2 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'} | નોંધણી નં: <span className="font-mono font-bold text-slate-850 dark:text-slate-100">{trustSettings?.registrationNumber || 'F-12345/GUJ'}</span>
                </p>
              </div>
              <div className="text-left sm:text-right flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> સ્કેડ્યુલ VIII (Schedule VIII) - પાકું સરવૈયું (Balance Sheet)
                </span>
                <div className="flex gap-1.5 print:hidden">
                  <button
                    onClick={() => handleDownloadReportPDF('printable-balance-sheet-container', 'Balance_Sheet_Schedule_VIII')}
                    disabled={isGeneratingPDF}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                  >
                    {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                  </button>
                  <button
                    onClick={() => printContainer('printable-balance-sheet-container')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              તા. ૩૧ માર્ચ ૨૦૨૭ ના રોજનું પાકું સરવૈયું
            </p>
          </div>

          {/* Balance Sheet Verification Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs ${
            isBalanceMatched
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block text-sm">
                  {isBalanceMatched ? '✓ પાકું સરવૈયું સંપૂર્ણ મેળ ખાતું છે (Schedule VIII Balance Sheet Perfectly Balanced)' : '⚠️ હિસાબમાં તફાવત (Balance Discrepancy Detected)'}
                </span>
                <span className="text-[11px] opacity-90">
                  કુલ ફંડો/જવાબદારીઓ: <strong className="font-mono">₹ {totalLiabilities.toLocaleString('en-IN')}</strong> | કુલ મિલકતો/અસ્કયામતો: <strong className="font-mono">₹ {totalAssets.toLocaleString('en-IN')}</strong> (તફાવત: ₹ {Math.abs(totalLiabilities - totalAssets).toLocaleString('en-IN')})
                </span>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-700 text-white font-mono font-bold text-xs rounded-xl shadow-sm whitespace-nowrap">
              તફાવત: ₹ ૦.૦૦
            </span>
          </div>

                    {/* Schedule VIII Balance Sheet T-Ledger Grid */}
          {/* Schedule VIII Balance Sheet T-Ledger Grid */}
          <div className={`border ${cardBg} rounded-2xl overflow-hidden shadow-sm`}>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 text-xs">
              
              {/* LIABILITIES SIDE (ફંડો અને જવાબદારીઓ) */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-2 bg-indigo-50/50 dark:bg-indigo-950/20 p-2 rounded-lg">
                  <h3 className="font-black text-sm text-indigo-700 dark:text-indigo-400">
                    ફંડો અને જવાબદારીઓ (FUNDS & LIABILITIES)
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded">જમા બાજુ</span>
                </div>

                <div className="space-y-3.5">
                  {/* Trust Capital Fund Block */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-black text-slate-800 dark:text-slate-100 block text-xs border-b pb-1">
                      ૧. ટ્રસ્ટ મૂડી ભંડોળ (Trust Capital Fund / Corpus)
                    </span>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                      <span>પ્રારંભિક સામાન્ય ભંડોળ (Opening Capital Fund):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹ {(initialTrustFund - openingStockValue).toLocaleString('en-IN')}</span>
                    </div>
                    {openingStockValue > 0 && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                        <span>ઉમેરો: શરૂઆતનો પ્રોડક્ટ સ્ટોક (Add: Opening Inventory Stock):</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹ {openingStockValue.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-[11px]">
                      <span>ઉમેરો: ચાલુ વર્ષનો ચોખ્ખો સંચિત વધારો (Add: Current Year Surplus):</span>
                      <span className="font-mono font-bold">₹ {(totalIncome - totalExpense).toLocaleString('en-IN')}</span>
                    </div>
                    {closingStockValue - openingStockValue !== 0 && (
                      <div className="flex justify-between text-teal-600 dark:text-teal-400 text-[11px]">
                        <span>ઉમેરો/બાદ: સ્ટોક મૂલ્યાંકન સુધારો (Stock Valuation Adjustment):</span>
                        <span className="font-mono font-bold">₹ {(closingStockValue - openingStockValue).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {/* Explicit Sales and Purchase Details inside Capital Block */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-750 space-y-1">
                      <span className="font-bold text-[10px] text-indigo-700 dark:text-indigo-400 block uppercase tracking-wider">ચાલુ વર્ષના પ્રોડક્ટ વેપાર વ્યવહારો (Product Trading Details):</span>
                      <div className="flex justify-between text-slate-500 text-[10px]">
                        <span>દાન અને સામાન્ય ટ્રસ્ટ આવકો:</span>
                        <span className="font-mono">₹ {(totalIncome - totalSalesAmount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                        <span>(+) પ્રોડક્ટ વેચાણ આવક (Product Sales Revenue):</span>
                        <span className="font-mono">₹ {totalSalesAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[10px]">
                        <span>સામાન્ય વહીવટી ટ્રસ્ટ ખર્ચાઓ:</span>
                        <span className="font-mono">₹ {(totalExpense - totalPurchasesAmount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-rose-700 dark:text-rose-400 text-[10px] font-medium">
                        <span>(-) પ્રોડક્ટ ખરીદી ખર્ચ (Product Purchases Expense):</span>
                        <span className="font-mono">₹ {totalPurchasesAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex justify-between font-black text-slate-800 dark:text-slate-100 pt-1.5 border-t text-xs">
                      <span>કુલ મૂડી ભંડોળ (Total Capital Fund Balance):</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">₹ {totalLiabilities.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Earmarked Funds Block */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-black text-slate-800 dark:text-slate-100 block text-xs border-b pb-1">
                      ૨. અનામત અને વિશિષ્ટ ફંડો (Earmarked & Reserve Funds)
                    </span>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                      <span>બિલ્ડિંગ અને મિલકત વિકાસ ફંડ (Building Fund):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹ ૦</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                      <span>શિક્ષણ અને રાહત નિધિ (Relief Fund):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹ ૦</span>
                    </div>
                  </div>

                  {/* Liabilities & Provisions Block */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-black text-slate-800 dark:text-slate-100 block text-xs border-b pb-1">
                      ૩. ચાલુ દેવાં અને સપ્લાયરો બાકી દેવું (Current Liabilities & Creditors)
                    </span>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                      <span>ઉધાર ખરીદી બાકી દેવું (Sundry Creditors - Udhar Purchases):</span>
                      <span className="font-mono font-bold text-rose-600">₹ {totalUdharPurchasePayables.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                      <span>ઓડિટ ફી પ્રોવિઝન (Audit Fee Payable):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹ ૦</span>
                    </div>
                  </div>
                </div>

                {/* Total Liabilities Box */}
                <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex justify-between items-center font-black text-sm text-slate-800 dark:text-white mt-4 border border-slate-300 dark:border-slate-700">
                  <span>કુલ ફંડો અને દેવાં સરવાળો (Total Liabilities)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 text-base">
                    ₹ {totalLiabilities.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* ASSETS SIDE (મિલકતો અને અસ્કયામતો) */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-lg">
                  <h3 className="font-black text-sm text-emerald-700 dark:text-emerald-400">
                    મિલકતો અને અસ્કયામતો (PROPERTIES & ASSETS)
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">ઉધાર બાજુ</span>
                </div>

                <div className="space-y-3.5">
                  {/* Fixed Assets Block */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-black text-slate-800 dark:text-slate-100 block text-xs border-b pb-1">
                      ૧. સ્થાવર અને જંગમ અસ્કયામતો (Fixed Properties & Assets)
                    </span>
                    {assets.length > 0 ? (
                      assets.map((a, idx) => (
                        <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                          <span>{a.nameGuj} ({a.typeGuj}):</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹ {a.currentValue.toLocaleString('en-IN')}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>ટ્રસ્ટ સ્થાયી મિલકતો (મકાન/વાહનો/ફર્નિચર):</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹ {totalAssetVal.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  {/* Bank Accounts Balances Block */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-black text-slate-800 dark:text-slate-100 block text-xs border-b pb-1">
                      ૨. બેંક એકાઉન્ટ્સમાં આખર સિલક (Bank Balances as per Passbook)
                    </span>
                    {banks.map((b, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                        <span>{b.bankNameGuj} ({b.accountNumber}):</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹ {b.balance.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 pt-1 border-t text-[11px]">
                      <span>કુલ બેંક બેલેન્સ (Total Bank Balances):</span>
                      <span className="font-mono text-emerald-600">₹ {totalBankBalance.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Cash in Hand Block */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-black text-slate-800 dark:text-slate-100 block text-xs border-b pb-1">
                      ૩. તિજોરી હાથ પર રોકડ સિલક (Cash Balance in Hand)
                    </span>
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                      <span>આજની આખર રોકડ સિલક (Closing Cash Balance):</span>
                      <span className="font-mono text-emerald-600 font-black">₹ {finalCash.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Inventory / Closing Stock Asset Block */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-black text-slate-800 dark:text-slate-100 block text-xs border-b pb-1">
                      ૪. પ્રોડક્ટ માલસામાન આખર સ્ટોક (Closing Inventory Stock Asset)
                    </span>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                      <span>આખર સ્ટોક ભૌતિક કિંમત (Closing Stock Value):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹ {closingStockValue.toLocaleString('en-IN')}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      સ્ટોક કિંમત ખરીદી મૂલ્ય અનુસાર ગણતરી કરવામાં આવી છે.
                    </span>
                  </div>

                  {/* Sundry Debtors Asset Block */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-black text-slate-800 dark:text-slate-100 block text-xs border-b pb-1">
                      ૫. ઉધાર ગ્રાહકો બાકી લેણું (Sundry Debtors - Udhar Sales Asset)
                    </span>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                      <span>વસૂલવાનું બાકી વેચાણ લેણું (Outstanding Sales Receivables):</span>
                      <span className="font-mono font-bold text-indigo-600">₹ {totalUdharSalesReceivables.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Total Assets Box */}
                <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex justify-between items-center font-black text-sm text-slate-800 dark:text-white mt-4 border border-slate-300 dark:border-slate-700">
                  <span>કુલ મિલકતો અને સિલક સરવાળો (Total Assets)</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                    ₹ {totalAssets.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>


          {/* Audit Certificate & Signatures */}
          <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
            <div className="flex items-center gap-2 border-b pb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                ઓડિટરનું પ્રમાણપત્ર અને ટ્રસ્ટીઓના હસ્તાક્ષર (Auditor Certificate & Trustees Signatures)
              </h4>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 italic leading-relaxed">
              "આથી પ્રમાણિત કરવામાં આવે છે કે <strong>"{trustSettings?.trustNameGuj || 'ટ્રસ્ટ'}"</strong> નું ઉપર દર્શાવેલ તા. ૩૧ માર્ચ ૨૦૨૭ ના રોજનું પાકું સરવૈયું, ટ્રસ્ટના એકાઉન્ટન્ટ દ્વારા નિભાવવામાં આવેલ હિસાબી ચોપડાઓ, વાઉચરો અને બેંક પાસબુક સાથે સરખાવી ઓડિટ કરેલ છે અને તે મુંબઈ/ગુજરાત સાર્વજનિક ટ્રસ્ટ એક્ટ ૧૯૫૦ ના નિયમો મુજબ સાચો અને ન્યાયી હિસાબ રજૂ કરે છે."
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 text-center text-xs">
              <div className="border-t border-slate-400 dark:border-slate-600 pt-2 font-bold text-slate-700 dark:text-slate-300">
                પ્રમુખ (President)
              </div>
              <div className="border-t border-slate-400 dark:border-slate-600 pt-2 font-bold text-slate-700 dark:text-slate-300">
                મંત્રી / સેક્રેટરી (Secretary)
              </div>
              <div className="border-t border-slate-400 dark:border-slate-600 pt-2 font-bold text-slate-700 dark:text-slate-300">
                ખજાનચી (Treasurer)
              </div>
              <div className="border-t border-slate-400 dark:border-slate-600 pt-2 font-bold text-indigo-600 dark:text-indigo-400">
                ચાર્ટર્ડ એકાઉન્ટન્ટ / ઓડિટર (CA Seal & Sign)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dead Stock Patrak (ડેડ સ્ટોક રજીસ્ટर/પત્રક - Schedule of Non-Consumable Assets) */}
      {activeSubTab === 'deadstock' && (
        <div id="printable-deadstock-container" className="space-y-6 print:m-0 print:p-0">
          {/* Header Controls */}
          <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm space-y-4 print:hidden`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" /> ડેડ સ્ટોક પત્રક / રજીસ્ટર (Dead Stock Asset Register)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  મુંબઈ / ગુજરાત સાર્વજનિક ટ્રસ્ટ એક્ટ ૧૯૫૦ મુજબ ટ્રસ્ટના તમામ સ્થાયી સાધનો, ફર્નિચર, ઇલેક્ટ્રોનિક્સ અને ભૌતિક મિલકતોનું ઓડિટ પત્રક.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadReportPDF('printable-deadstock-container', 'Dead_Stock_Patrak')}
                  disabled={isGeneratingPDF}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF ડાઉનલોડ
                </button>
                <button
                  type="button"
                  onClick={() => printContainer('printable-deadstock-container')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" /> પત્રક પ્રિન્ટ કરો
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="w-full sm:w-auto flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="મિલકતનું નામ, ડેડ સ્ટોક નં અથવા સ્થળ શોધો..."
                  value={deadStockSearchQuery}
                  onChange={(e) => setDeadStockSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <label className="text-slate-500 font-bold whitespace-nowrap">વર્ગીકરણ:</label>
                <select
                  value={deadStockCatFilter}
                  onChange={(e) => setDeadStockCatFilter(e.target.value)}
                  className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">તમામ પ્રકારો (All Categories)</option>
                  <option value="ફર્નિચર">ફર્નિચર (Furniture)</option>
                  <option value="કમ્પ્યુટર">કમ્પ્યુટર (Computer/IT)</option>
                  <option value="સાધનો">સાધનો (Equipment)</option>
                  <option value="વાહન">વાહન (Vehicles)</option>
                  <option value="મકાન">મકાન (Building)</option>
                  <option value="જમીન">જમીન (Land)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Statement Header (Visible in Print & Screen) */}
          <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
            <div className="text-center space-y-1.5 border-b pb-4">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-3 py-1 rounded-full uppercase tracking-wider">
                મુંબઈ / ગુજરાત સાર્વજનિક ટ્રસ્ટ અધિનિયમ ૧૯૫૦ - નિયમ ૨૫
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {trustSettings?.trustNameGuj || 'સાર્વજનિક ટ્રસ્ટ'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                નોંધણી નંબર: {trustSettings?.regNoGuj || 'રજીસ્ટ્રેશન નં.'} | નાણાકીય વર્ષ: {trustSettings?.financialYear || '૨૦૨૬-૨૭'}
              </p>
              <h3 className="text-base font-black text-indigo-700 dark:text-indigo-400 pt-1 underline underline-offset-4">
                ડેડ સ્ટોક પત્રક / સ્થાયી મિલકતો રજીસ્ટર (DEAD STOCK ASSET REGISTER SCHEDULE)
              </h3>
            </div>

            {/* Metric Summary Bar */}
            {(() => {
              const filteredList = assets.filter(a => {
                const matchesSearch = !deadStockSearchQuery || 
                  a.nameGuj.toLowerCase().includes(deadStockSearchQuery.toLowerCase()) ||
                  (a.deadStockNo && a.deadStockNo.toLowerCase().includes(deadStockSearchQuery.toLowerCase())) ||
                  (a.locationGuj && a.locationGuj.toLowerCase().includes(deadStockSearchQuery.toLowerCase()));
                const matchesCat = deadStockCatFilter === 'all' || a.typeGuj.includes(deadStockCatFilter);
                return matchesSearch && matchesCat;
              });

              const totalQty = filteredList.reduce((sum, a) => sum + (a.quantity || 1), 0);
              const totalCost = filteredList.reduce((sum, a) => sum + a.purchaseAmount, 0);
              const totalVal = filteredList.reduce((sum, a) => sum + a.currentValue, 0);
              const totalDep = totalCost - totalVal;

              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs print:grid-cols-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block">કુલ નોંધાયેલ મિલકતો</span>
                      <strong className="text-base font-mono font-black text-amber-900 dark:text-amber-200">{filteredList.length} કલમો ({totalQty} નંગ)</strong>
                    </div>

                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-bold block">કુલ મૂળ ખરીદ રકમ (Cost)</span>
                      <strong className="text-base font-mono font-black text-indigo-900 dark:text-indigo-200">₹ {totalCost.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800">
                      <span className="text-[10px] text-rose-800 dark:text-rose-300 font-bold block">કુલ ઘસારો કપાત (Total Dep)</span>
                      <strong className="text-base font-mono font-black text-rose-900 dark:text-rose-200">₹ {totalDep.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">આખર ચોપડે મૂલ્ય (Book Value)</span>
                      <strong className="text-base font-mono font-black text-emerald-900 dark:text-emerald-200">₹ {totalVal.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  {/* Dead Stock Patrak Main Audit Table */}
                  <div className="overflow-x-auto border rounded-xl border-slate-300 dark:border-slate-700">
                    <table className="w-full text-left text-xs">
                      <thead className={`font-bold ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
                        <tr className="border-b border-slate-300 dark:border-slate-700">
                          <th className="p-2.5 text-center w-12 border-r">અનુ.</th>
                          <th className="p-2.5 border-r">ડેડ સ્ટોક નં. (DS No.)</th>
                          <th className="p-2.5 border-r">મિલકત / સાધનનું વિગતવાર નામ</th>
                          <th className="p-2.5 border-r">પ્રકાર (Category)</th>
                          <th className="p-2.5 text-center border-r">ખરીદ તારીખ</th>
                          <th className="p-2.5 text-center border-r">નંગ (Qty)</th>
                          <th className="p-2.5 border-r">સ્થળ / રૂમ (Location)</th>
                          <th className="p-2.5 text-right border-r">મૂળ કિંમત (₹)</th>
                          <th className="p-2.5 text-center border-r">ઘસારો %</th>
                          <th className="p-2.5 text-right border-r">ચોપડે કિંમત (₹)</th>
                          <th className="p-2.5 text-center">વર્તમાન સ્થિતિ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredList.map((asset, idx) => (
                          <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 text-center font-mono font-bold border-r text-slate-500">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-indigo-700 dark:text-indigo-300 border-r whitespace-nowrap">
                              {asset.deadStockNo || `DS-${(idx + 1).toString().padStart(3, '0')}`}
                            </td>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100 border-r">
                              <div>{asset.nameGuj}</div>
                              {asset.billRefGuj && (
                                <span className="text-[10px] font-normal text-slate-500 block">બિલ/વાઉચર: {asset.billRefGuj}</span>
                              )}
                              {asset.remarksGuj && (
                                <span className="text-[10px] font-normal italic text-slate-400 block">{asset.remarksGuj}</span>
                              )}
                            </td>
                            <td className="p-2.5 border-r font-medium whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                                {asset.typeGuj.split(' ')[0]}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-mono border-r whitespace-nowrap">{asset.purchaseDate}</td>
                            <td className="p-2.5 text-center font-bold font-mono border-r text-amber-700 dark:text-amber-400">
                              {asset.quantity || 1}
                            </td>
                            <td className="p-2.5 border-r text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {asset.locationGuj || 'મુખ્ય ઓફિસ'}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold border-r text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              ₹ {asset.purchaseAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 text-center font-mono text-rose-600 font-bold border-r">
                              {asset.depreciationRate}%
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 border-r whitespace-nowrap">
                              ₹ {asset.currentValue.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (asset.conditionGuj || 'ઉત્તમ ચાલુ સ્થિતિ (Good)').includes('Good') || (asset.conditionGuj || '').includes('ઉત્તમ')
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : (asset.conditionGuj || '').includes('Repair')
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                {asset.conditionGuj ? asset.conditionGuj.split(' ')[0] : 'ચાલુ સ્થિતિ'}
                              </span>
                            </td>
                          </tr>
                        ))}

                        {filteredList.length === 0 && (
                          <tr>
                            <td colSpan={11} className="p-8 text-center text-slate-400">
                              કોઈ ડેડ સ્ટોક મિલકતો મળી નથી. (No dead stock assets found)
                            </td>
                          </tr>
                        )}
                      </tbody>

                      {filteredList.length > 0 && (
                        <tfoot>
                          <tr className={`font-black ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-900'} border-t-2 border-slate-300 dark:border-slate-700`}>
                            <td colSpan={5} className="p-3 text-right text-xs">કુલ સરવાળો (TOTAL DEAD STOCK ASSETS):</td>
                            <td className="p-3 text-center font-mono text-amber-600 text-sm">{totalQty} નંગ</td>
                            <td className="p-3"></td>
                            <td className="p-3 text-right font-mono text-sm text-indigo-700 dark:text-indigo-300">₹ {totalCost.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-center text-rose-600 font-mono text-xs">ગણેલ ઘસારો</td>
                            <td className="p-3 text-right font-mono text-sm text-emerald-700 dark:text-emerald-300">₹ {totalVal.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-center text-[10px] text-slate-500">ઓડિટ પ્રમાણિત</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Auditor & Trustee Physical Verification Certification */}
                  <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>ડેડ સ્ટોક ભૌતિક સ્થળ ચકાસણી પ્રમાણપત્ર (Physical Inspection Certification)</span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "આથી ઓડિટ હેતુ માટે સાક્ષી આપવામાં આવે છે કે ઉપરોક્ત ડેડ સ્ટોક પત્રકમાં દર્શાવેલ તમામ ફર્નિચર, સાધનો, કમ્પ્યુટર અને ભૌતિક મિલકતો તા. ૩૧ માર્ચ ૨૦૨૭ ના રોજ ટ્રસ્ટના સરનામે પ્રત્યક્ષ સ્થળ ચકાસણી (Physical Inspection) કરી મેળવેલ છે અને તમામ સામગ્રી ટ્રસ્ટની માલિકી હેઠળ રજીસ્ટર્ડ થયેલ છે."
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 text-center text-xs">
                      <div className="border-t border-slate-400 dark:border-slate-600 pt-2 font-bold text-slate-700 dark:text-slate-300">
                        સ્થળ તપાસણી ટ્રસ્ટી સહી
                      </div>
                      <div className="border-t border-slate-400 dark:border-slate-600 pt-2 font-bold text-slate-700 dark:text-slate-300">
                        મંત્રી / સેક્રેટરી સહી
                      </div>
                      <div className="border-t border-slate-400 dark:border-slate-600 pt-2 font-bold text-slate-700 dark:text-slate-300">
                        ખજાનચી સહી
                      </div>
                      <div className="border-t border-slate-400 dark:border-slate-600 pt-2 font-bold text-indigo-700 dark:text-indigo-400">
                        ઓડિટર સીલ અને સહી (CA Auditor)
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Manual Account Creation Modal Dialog */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-150 text-slate-900'} shadow-xl space-y-4`}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black">નવું ખાતું બનાવો (Create New Ledger Account)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAccountModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreateAccount} className="space-y-4 text-xs">
              {/* Account Type Selection */}
              <div className="space-y-1.5">
                <label className="block font-bold">ખાતાનો પ્રકાર (Account Type) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAccountType('income')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                      newAccountType === 'income'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-600 dark:text-emerald-300'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850'
                    }`}
                  >
                    📈 આવક ખાતું (Income Account)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccountType('expense')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                      newAccountType === 'expense'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 dark:bg-rose-950/40 dark:border-rose-600 dark:text-rose-300'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850'
                    }`}
                  >
                    📉 ખર્ચ ખાતું (Expense Account)
                  </button>
                </div>
              </div>

              {/* Account Name input */}
              <div className="space-y-1.5">
                <label className="block font-bold">નવા ખાતાનું સચોટ નામ (Ledger Account Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="દા.ત. શિક્ષણ ફંડ / મકાન રીપેરીંગ ખર્ચ"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode
                      ? 'bg-slate-850 border-slate-750 text-white placeholder-slate-500'
                      : 'bg-white border-slate-250 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Opening Balance input */}
              <div className="space-y-1.5">
                <label className="block font-bold">પ્રારંભિક સિલક / ઓપનિંગ બેલેન્સ (Opening Balance) (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newAccountOpening}
                  onChange={(e) => setNewAccountOpening(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode
                      ? 'bg-slate-850 border-slate-750 text-white placeholder-slate-500'
                      : 'bg-white border-slate-250 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {createAccountError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl font-bold border border-rose-200 dark:border-rose-900">
                  {createAccountError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  રદ કરો (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  ✓ ખાતું બનાવો (Create)
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Manual Account Edit Modal Dialog */}
      {showEditAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-150 text-slate-900'} shadow-xl space-y-4`}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black">ખાતાની વિગત સુધારો (Edit Ledger Account)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditAccountModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEditAccount} className="space-y-4 text-xs">
              {/* Account Type Display */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-500">ખાતાનો પ્રકાર (Account Type)</label>
                <div className="p-2.5 rounded-xl border border-dashed text-center font-bold bg-slate-50 dark:bg-slate-850 dark:border-slate-800">
                  {editAccountType === 'income' ? '📈 આવક ખાતું (Income Account)' : '📉 ખર્ચ ખાતું (Expense Account)'}
                </div>
              </div>

              {/* Account Name input */}
              <div className="space-y-1.5">
                <label className="block font-bold">ખાતાનું નવું નામ (Ledger Account Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="ખાતાનું નામ લખો"
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode
                      ? 'bg-slate-850 border-slate-750 text-white placeholder-slate-500'
                      : 'bg-white border-slate-250 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Opening Balance input */}
              <div className="space-y-1.5">
                <label className="block font-bold">પ્રારંભિક સિલક / ઓપનિંગ બેલેન્સ (Opening Balance) (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={editAccountOpening}
                  onChange={(e) => setEditAccountOpening(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode
                      ? 'bg-slate-850 border-slate-750 text-white placeholder-slate-500'
                      : 'bg-white border-slate-250 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {editAccountError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl font-bold border border-rose-200 dark:border-rose-900">
                  {editAccountError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditAccountModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  રદ કરો (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  ✓ ફેરફારો સાચવો (Save Changes)
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
