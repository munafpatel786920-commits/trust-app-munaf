/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  Printer, 
  Download, 
  Loader2, 
  CreditCard, 
  Coins, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  User, 
  Receipt, 
  FileText, 
  RefreshCw,
  ChevronRight,
  Eye
} from 'lucide-react';
import { PurchaseBill, SalesBill, BankAccount, TrustSettings, BillPaymentRecord } from '../types';
import { downloadContainerAsPDF, printContainer } from '../utils/pdfPrint';

interface PartyLedgerViewProps {
  purchaseBills: PurchaseBill[];
  salesBills: SalesBill[];
  banks: BankAccount[];
  trustSettings?: TrustSettings;
  darkMode?: boolean;
  currentUser?: { role: string; nameGuj?: string; username?: string };
  isReadOnly?: boolean;
  selectedPartyName?: string;
  initialPartyName?: string;
  onOpenSettlementModal: (type: 'purchase' | 'sales', bill: PurchaseBill | SalesBill) => void;
  onViewInvoice: (type: 'purchase' | 'sales', bill: any) => void;
  onViewReceipt: (type: 'purchase' | 'sales', bill: PurchaseBill | SalesBill) => void;
}

interface PartyInfo {
  name: string;
  type: 'supplier' | 'customer' | 'both';
  totalPurchases: number;
  totalPurchasePaid: number;
  purchasePending: number;
  totalSales: number;
  totalSalesReceived: number;
  salesPending: number;
  netPendingBalance: number;
  totalTxCount: number;
  lastTxDate: string;
}

interface LedgerEntry {
  id: string;
  date: string;
  type: 'purchase_bill' | 'purchase_payment' | 'sales_bill' | 'sales_receipt';
  typeLabelGuj: string;
  refNumber: string;
  particularsGuj: string;
  paymentMode?: string;
  bankName?: string;
  debitAmount: number; // Dr (ઉધાર)
  creditAmount: number; // Cr (જમા)
  runningBalance: number;
  balanceType: 'Dr' | 'Cr' | 'Nil';
  rawBill?: PurchaseBill | SalesBill;
  paymentRecord?: BillPaymentRecord;
}

export default function PartyLedgerView({
  purchaseBills,
  salesBills,
  banks,
  trustSettings,
  darkMode,
  currentUser,
  isReadOnly: isReadOnlyProp,
  selectedPartyName: propSelectedPartyName,
  initialPartyName,
  onOpenSettlementModal,
  onViewInvoice,
  onViewReceipt
}: PartyLedgerViewProps) {
  const isReadOnly = isReadOnlyProp !== undefined ? isReadOnlyProp : currentUser?.role === 'ReadOnly';
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async (containerId: string, filename: string) => {
    setIsGeneratingPDF(true);
    await downloadContainerAsPDF(containerId, filename);
    setIsGeneratingPDF(false);
  };

  // 1. Gather all unique parties & calculate overview stats
  const allParties = useMemo<PartyInfo[]>(() => {
    const partyMap = new Map<string, {
      name: string;
      isSupplier: boolean;
      isCustomer: boolean;
      totalPurchases: number;
      totalPurchasePaid: number;
      totalSales: number;
      totalSalesReceived: number;
      txDates: string[];
      txCount: number;
    }>();

    // Scan purchases
    purchaseBills.forEach(p => {
      const name = p.supplierNameGuj?.trim();
      if (!name) return;
      
      const paid = p.paidAmount !== undefined ? p.paidAmount : (p.paymentMode === 'ઉધાર (Credit)' ? 0 : p.totalAmount);
      const existing = partyMap.get(name) || {
        name,
        isSupplier: true,
        isCustomer: false,
        totalPurchases: 0,
        totalPurchasePaid: 0,
        totalSales: 0,
        totalSalesReceived: 0,
        txDates: [],
        txCount: 0
      };

      existing.isSupplier = true;
      existing.totalPurchases += p.totalAmount;
      existing.totalPurchasePaid += paid;
      existing.txDates.push(p.date);
      if (p.settlementDate) existing.txDates.push(p.settlementDate);
      existing.txCount += 1;

      partyMap.set(name, existing);
    });

    // Scan sales
    salesBills.forEach(s => {
      const name = s.customerNameGuj?.trim();
      if (!name) return;

      const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentMode === 'ઉધાર (Credit)' ? 0 : s.totalAmount);
      const existing = partyMap.get(name) || {
        name,
        isSupplier: false,
        isCustomer: true,
        totalPurchases: 0,
        totalPurchasePaid: 0,
        totalSales: 0,
        totalSalesReceived: 0,
        txDates: [],
        txCount: 0
      };

      existing.isCustomer = true;
      existing.totalSales += s.totalAmount;
      existing.totalSalesReceived += paid;
      existing.txDates.push(s.date);
      if (s.settlementDate) existing.txDates.push(s.settlementDate);
      existing.txCount += 1;

      partyMap.set(name, existing);
    });

    return Array.from(partyMap.values()).map(p => {
      const purchasePending = Math.max(0, p.totalPurchases - p.totalPurchasePaid);
      const salesPending = Math.max(0, p.totalSales - p.totalSalesReceived);
      
      let type: 'supplier' | 'customer' | 'both' = 'supplier';
      if (p.isSupplier && p.isCustomer) type = 'both';
      else if (p.isCustomer) type = 'customer';

      const sortedDates = p.txDates.filter(Boolean).sort();
      const lastTxDate = sortedDates[sortedDates.length - 1] || '—';

      return {
        name: p.name,
        type,
        totalPurchases: p.totalPurchases,
        totalPurchasePaid: p.totalPurchasePaid,
        purchasePending,
        totalSales: p.totalSales,
        totalSalesReceived: p.totalSalesReceived,
        salesPending,
        netPendingBalance: purchasePending > 0 ? purchasePending : salesPending,
        totalTxCount: p.txCount,
        lastTxDate
      };
    }).sort((a, b) => b.netPendingBalance - a.netPendingBalance || a.name.localeCompare(b.name));
  }, [purchaseBills, salesBills]);

  // Selected party state
  const [selectedPartyName, setSelectedPartyName] = useState<string>(() => {
    const target = propSelectedPartyName || initialPartyName;
    if (target && allParties.some(p => p.name === target)) {
      return target;
    }
    return target || allParties[0]?.name || '';
  });

  useEffect(() => {
    if (propSelectedPartyName) {
      setSelectedPartyName(propSelectedPartyName);
    }
  }, [propSelectedPartyName]);

  const [partySearch, setPartySearch] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState<'all' | 'suppliers' | 'customers' | 'pending'>('all');
  
  // Date range filters for statement
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entryTypeFilter, setEntryTypeFilter] = useState<'all' | 'bills_only' | 'payments_only'>('all');

  // Filtered party list for selector
  const filteredParties = useMemo(() => {
    return allParties.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(partySearch.toLowerCase());
      if (!matchesSearch) return false;

      if (partyTypeFilter === 'suppliers') return p.type === 'supplier' || p.type === 'both';
      if (partyTypeFilter === 'customers') return p.type === 'customer' || p.type === 'both';
      if (partyTypeFilter === 'pending') return p.purchasePending > 0 || p.salesPending > 0;
      return true;
    });
  }, [allParties, partySearch, partyTypeFilter]);

  // Active party info
  const activeParty = useMemo(() => {
    return allParties.find(p => p.name === selectedPartyName) || null;
  }, [allParties, selectedPartyName]);

  // Build the complete chronological ledger for active party
  const partyLedgerEntries = useMemo<LedgerEntry[]>(() => {
    if (!activeParty) return [];

    const entries: Array<Omit<LedgerEntry, 'runningBalance' | 'balanceType'>> = [];
    const partyName = activeParty.name;

    // 1. Purchases for this party (Supplier)
    const partyPurchases = purchaseBills.filter(p => p.supplierNameGuj?.trim() === partyName);
    partyPurchases.forEach(p => {
      // Credit Purchase Bill entry -> Party account is Credited (Cr)
      entries.push({
        id: `bill-pur-${p.id}`,
        date: p.date,
        type: 'purchase_bill',
        typeLabelGuj: 'ખરીદી બિલ (Purchase Bill)',
        refNumber: p.billNumber,
        particularsGuj: `આઇટમ: ${p.itemNameGuj} (જથ્થો: ${p.quantity} @ ₹${p.rate}) ${p.isGstBill ? `[GST ${p.gstRate}%]` : ''} ${p.paymentMode === 'ઉધાર (Credit)' ? '[ઉધાર]' : '[રોકડ/બેંક]'}`,
        paymentMode: p.paymentMode,
        debitAmount: 0,
        creditAmount: p.totalAmount, // Cr = Bill amount (Trust owes supplier)
        rawBill: p
      });

      // Payments recorded against this purchase bill
      // A. Initial payment at time of billing
      const initialPaid = p.paidAmount !== undefined ? p.paidAmount : (p.paymentMode === 'ઉધાર (Credit)' ? 0 : p.totalAmount);
      
      // If payment history array exists on the bill
      if (p.paymentHistory && p.paymentHistory.length > 0) {
        p.paymentHistory.forEach(pay => {
          const bank = banks.find(b => b.id === pay.bankId);
          entries.push({
            id: `pay-${pay.id}`,
            date: pay.date,
            type: 'purchase_payment',
            typeLabelGuj: `નાણાં ચૂકવણી (${pay.paymentMode})`,
            refNumber: pay.receiptNumber || `PAY-${p.billNumber}`,
            particularsGuj: `બિલ નં: ${p.billNumber} પેટે ચૂકવેલ રકમ. ${bank ? `(${bank.bankNameGuj})` : ''} ${pay.remarksGuj || ''}`,
            paymentMode: pay.paymentMode,
            bankName: bank?.bankNameGuj,
            debitAmount: pay.amount, // Dr = Payment made to supplier
            creditAmount: 0,
            rawBill: p,
            paymentRecord: pay
          });
        });
      } else {
        // Fallback for bills without granular paymentHistory array
        if (p.paymentMode !== 'ઉધાર (Credit)' && initialPaid > 0) {
          const bank = banks.find(b => b.id === p.bankId);
          entries.push({
            id: `pay-init-${p.id}`,
            date: p.date,
            type: 'purchase_payment',
            typeLabelGuj: `રોકડ/બેંક ચૂકવણી`,
            refNumber: `PAY-${p.billNumber}`,
            particularsGuj: `બિલ સમયે ચૂકવેલ રકમ. ${bank ? `(${bank.bankNameGuj})` : ''} ${p.remarksGuj || ''}`,
            paymentMode: p.paymentMode,
            bankName: bank?.bankNameGuj,
            debitAmount: initialPaid,
            creditAmount: 0,
            rawBill: p
          });
        } else if (p.paymentMode === 'ઉધાર (Credit)' && initialPaid > 0) {
          const bank = banks.find(b => b.id === (p.settlementBankId || p.bankId));
          entries.push({
            id: `pay-settle-${p.id}`,
            date: p.settlementDate || p.date,
            type: 'purchase_payment',
            typeLabelGuj: `ઉધાર ચૂકવણી (${p.settlementMode || 'રોકડ'})`,
            refNumber: `REC-UDHAR-${p.billNumber.replace(/[^0-9]/g, '') || 'SETL'}`,
            particularsGuj: `ઉધાર ખરીદી બિલ નં: ${p.billNumber} ની ચુકવણી. ${bank ? `(${bank.bankNameGuj})` : ''} ${p.settlementRemarksGuj || ''}`,
            paymentMode: p.settlementMode || 'રોકડ (Cash)',
            bankName: bank?.bankNameGuj,
            debitAmount: initialPaid,
            creditAmount: 0,
            rawBill: p
          });
        }
      }
    });

    // 2. Sales for this party (Customer)
    const partySales = salesBills.filter(s => s.customerNameGuj?.trim() === partyName);
    partySales.forEach(s => {
      // Credit Sales Bill entry -> Party account is Debited (Dr)
      entries.push({
        id: `bill-sal-${s.id}`,
        date: s.date,
        type: 'sales_bill',
        typeLabelGuj: 'વેચાણ બિલ (Sales Bill)',
        refNumber: s.billNumber,
        particularsGuj: `આઇટમ: ${s.itemNameGuj} (જથ્થો: ${s.quantity} @ ₹${s.rate}) ${s.isGstBill ? `[GST ${s.gstRate}%]` : ''} ${s.paymentMode === 'ઉધાર (Credit)' ? '[ઉધાર]' : '[રોકડ/બેંક]'}`,
        paymentMode: s.paymentMode,
        debitAmount: s.totalAmount, // Dr = Bill amount (Customer owes Trust)
        creditAmount: 0,
        rawBill: s
      });

      // Payments received against this sales bill
      const initialPaid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentMode === 'ઉધાર (Credit)' ? 0 : s.totalAmount);
      
      if (s.paymentHistory && s.paymentHistory.length > 0) {
        s.paymentHistory.forEach(pay => {
          const bank = banks.find(b => b.id === pay.bankId);
          entries.push({
            id: `rec-${pay.id}`,
            date: pay.date,
            type: 'sales_receipt',
            typeLabelGuj: `નાણાં વસૂલાત (${pay.paymentMode})`,
            refNumber: pay.receiptNumber || `REC-${s.billNumber}`,
            particularsGuj: `બિલ નં: ${s.billNumber} પેટે જમા થયેલ રકમ. ${bank ? `(${bank.bankNameGuj})` : ''} ${pay.remarksGuj || ''}`,
            paymentMode: pay.paymentMode,
            bankName: bank?.bankNameGuj,
            debitAmount: 0,
            creditAmount: pay.amount, // Cr = Payment received from customer
            rawBill: s,
            paymentRecord: pay
          });
        });
      } else {
        if (s.paymentMode !== 'ઉધાર (Credit)' && initialPaid > 0) {
          const bank = banks.find(b => b.id === s.bankId);
          entries.push({
            id: `rec-init-${s.id}`,
            date: s.date,
            type: 'sales_receipt',
            typeLabelGuj: `રોકડ/બેંક વસૂલાત`,
            refNumber: `REC-${s.billNumber}`,
            particularsGuj: `બિલ સમયે વસૂલ રકમ. ${bank ? `(${bank.bankNameGuj})` : ''} ${s.remarksGuj || ''}`,
            paymentMode: s.paymentMode,
            bankName: bank?.bankNameGuj,
            debitAmount: 0,
            creditAmount: initialPaid,
            rawBill: s
          });
        } else if (s.paymentMode === 'ઉધાર (Credit)' && initialPaid > 0) {
          const bank = banks.find(b => b.id === (s.settlementBankId || s.bankId));
          entries.push({
            id: `rec-settle-${s.id}`,
            date: s.settlementDate || s.date,
            type: 'sales_receipt',
            typeLabelGuj: `ઉધાર વસૂલાત પાવતી (${s.settlementMode || 'રોકડ'})`,
            refNumber: `REC-UDHAR-${s.billNumber.replace(/[^0-9]/g, '') || 'SETL'}`,
            particularsGuj: `ઉધાર વેચાણ બિલ નં: ${s.billNumber} ની વસૂલાત. ${bank ? `(${bank.bankNameGuj})` : ''} ${s.settlementRemarksGuj || ''}`,
            paymentMode: s.settlementMode || 'રોકડ (Cash)',
            bankName: bank?.bankNameGuj,
            debitAmount: 0,
            creditAmount: initialPaid,
            rawBill: s
          });
        }
      }
    });

    // Sort chronologically ascending
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate Running Balance
    let balance = 0;
    const computedEntries: LedgerEntry[] = entries.map(entry => {
      if (activeParty.type === 'customer') {
        // Customer: Debit increases receivable, Credit decreases receivable
        balance += (entry.debitAmount - entry.creditAmount);
        const balanceType: 'Dr' | 'Cr' | 'Nil' = balance > 0 ? 'Dr' : (balance < 0 ? 'Cr' : 'Nil');
        return {
          ...entry,
          runningBalance: Math.abs(balance),
          balanceType
        };
      } else {
        // Supplier: Credit increases payable, Debit decreases payable
        balance += (entry.creditAmount - entry.debitAmount);
        const balanceType: 'Dr' | 'Cr' | 'Nil' = balance > 0 ? 'Cr' : (balance < 0 ? 'Dr' : 'Nil');
        return {
          ...entry,
          runningBalance: Math.abs(balance),
          balanceType
        };
      }
    });

    return computedEntries;
  }, [activeParty, purchaseBills, salesBills, banks]);

  // Filter entries by date and type
  const filteredLedgerEntries = useMemo(() => {
    return partyLedgerEntries.filter(entry => {
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;

      if (entryTypeFilter === 'bills_only') {
        return entry.type === 'purchase_bill' || entry.type === 'sales_bill';
      }
      if (entryTypeFilter === 'payments_only') {
        return entry.type === 'purchase_payment' || entry.type === 'sales_receipt';
      }

      return true;
    });
  }, [partyLedgerEntries, startDate, endDate, entryTypeFilter]);

  // Compute totals of filtered ledger
  const totals = useMemo(() => {
    const totalDebit = filteredLedgerEntries.reduce((acc, e) => acc + e.debitAmount, 0);
    const totalCredit = filteredLedgerEntries.reduce((acc, e) => acc + e.creditAmount, 0);
    return {
      totalDebit,
      totalCredit,
      closingBalance: activeParty?.type === 'customer' ? Math.max(0, totalDebit - totalCredit) : Math.max(0, totalCredit - totalDebit)
    };
  }, [filteredLedgerEntries, activeParty]);

  // Unpaid bills for quick settlement from ledger
  const unpaidBillsForParty = useMemo(() => {
    if (!activeParty) return [];
    if (activeParty.type === 'supplier') {
      return purchaseBills
        .filter(p => p.supplierNameGuj?.trim() === activeParty.name)
        .filter(p => {
          const paid = p.paidAmount !== undefined ? p.paidAmount : (p.paymentMode === 'ઉધાર (Credit)' ? 0 : p.totalAmount);
          return p.totalAmount - paid > 0;
        });
    } else {
      return salesBills
        .filter(s => s.customerNameGuj?.trim() === activeParty.name)
        .filter(s => {
          const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentMode === 'ઉધાર (Credit)' ? 0 : s.totalAmount);
          return s.totalAmount - paid > 0;
        });
    }
  }, [activeParty, purchaseBills, salesBills]);

  return (
    <div className="space-y-5">
      {/* Top Banner / Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                પાર્ટી ખાતાવહી અને ખાતા ખતવણી (Party Ledger & Statement)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ઉધાર ખરીદી-વેચાણ, નાણાં ચુકવણી અને વસૂલાતનો સંપૂર્ણ પક્ષકાર હિસાબ
              </p>
            </div>
          </div>

          {/* Action Buttons for Print / PDF */}
          {activeParty && (
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                onClick={() => handleDownloadPDF('printable-party-ledger-statement', `Party_Ledger_${activeParty.name.replace(/\s+/g, '_')}`)}
                disabled={isGeneratingPDF}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="ખાતાવહી સ્ટેટમેન્ટ PDF ડાઉનલોડ"
              >
                {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                સ્ટેટમેન્ટ PDF
              </button>
              <button
                onClick={() => printContainer('printable-party-ledger-statement')}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="ખાતાવહી સ્ટેટમેન્ટ પ્રિન્ટ"
              >
                <Printer className="w-3.5 h-3.5" />
                સ્ટેટમેન્ટ પ્રિન્ટ
              </button>
            </div>
          )}
        </div>

        {/* Party Selector and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Party Dropdown / Search */}
          <div className="md:col-span-6 space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>પાર્ટી / પક્ષકાર પસંદ કરો (Select Party):</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                કુલ {allParties.length} પાર્ટી નોંધાયેલ
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedPartyName}
                onChange={(e) => setSelectedPartyName(e.target.value)}
                className="w-full p-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 text-xs text-slate-850 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">-- પાર્ટી પસંદ કરો --</option>
                {filteredParties.map(p => {
                  const typeBadge = p.type === 'supplier' ? '📦 સપ્લાયર' : (p.type === 'customer' ? '👤 ગ્રાહક' : '🏢 સપ્લાયર & ગ્રાહક');
                  const balanceText = p.netPendingBalance > 0 
                    ? `(બાકી: ₹ ${p.netPendingBalance.toLocaleString('en-IN')})` 
                    : '(સરભર)';
                  return (
                    <option key={p.name} value={p.name}>
                      {p.name} — {typeBadge} {balanceText}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Quick Party Type Filter */}
          <div className="md:col-span-6 flex flex-wrap items-end gap-1.5">
            <button
              onClick={() => setPartyTypeFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                partyTypeFilter === 'all'
                  ? 'bg-slate-850 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              બધા ({allParties.length})
            </button>
            <button
              onClick={() => setPartyTypeFilter('suppliers')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                partyTypeFilter === 'suppliers'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
              }`}
            >
              📦 સપ્લાયર્સ ({allParties.filter(p => p.type === 'supplier' || p.type === 'both').length})
            </button>
            <button
              onClick={() => setPartyTypeFilter('customers')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                partyTypeFilter === 'customers'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              👤 ગ્રાહકો ({allParties.filter(p => p.type === 'customer' || p.type === 'both').length})
            </button>
            <button
              onClick={() => setPartyTypeFilter('pending')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                partyTypeFilter === 'pending'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              ⚠️ બાકી વાળા ({allParties.filter(p => p.purchasePending > 0 || p.salesPending > 0).length})
            </button>
          </div>
        </div>

        {/* Quick Party chips for fast one-click navigation */}
        {allParties.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">ઝડપી પસંદગી:</span>
            {allParties.slice(0, 8).map(p => (
              <button
                key={p.name}
                onClick={() => setSelectedPartyName(p.name)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  selectedPartyName === p.name
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
              >
                {p.type === 'supplier' ? '📦' : '👤'} {p.name}
                {p.netPendingBalance > 0 && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    selectedPartyName === p.name ? 'bg-amber-800 text-amber-100' : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300'
                  }`}>
                    ₹{p.netPendingBalance.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Party Statement Section */}
      {!activeParty ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">કોઈ પાર્ટી પસંદ કરેલ નથી</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            કૃપા કરીને ઉપરથી જે પક્ષકાર કે વેપારીનો હિસાબ અને ખાતાવહી જોવી હોય તે પાર્ટી પસંદ કરો.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Party Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Goods / Invoiced */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {activeParty.type === 'supplier' ? 'કુલ ખરીદ માલ રકમ' : 'કુલ વેચાણ માલ રકમ'}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-850 dark:text-white font-mono">
                  ₹ {(activeParty.type === 'supplier' ? activeParty.totalPurchases : activeParty.totalSales).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {activeParty.totalTxCount} બિલ
                </span>
              </div>
            </div>

            {/* Total Paid / Received */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {activeParty.type === 'supplier' ? 'કુલ ચૂકવેલ રકમ' : 'કુલ જમા / વસૂલ રકમ'}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹ {(activeParty.type === 'supplier' ? activeParty.totalPurchasePaid : activeParty.totalSalesReceived).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">ચૂકવણી/પાવતી</span>
              </div>
            </div>

            {/* Net Outstanding Balance */}
            <div className={`p-4 rounded-2xl shadow-xs space-y-1 border ${
              activeParty.netPendingBalance > 0
                ? (activeParty.type === 'supplier'
                    ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60')
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                  ચોખ્ખી બાકી રકમ (Balance)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                  activeParty.netPendingBalance > 0
                    ? (activeParty.type === 'supplier' ? 'bg-purple-200 text-purple-900' : 'bg-amber-200 text-amber-900')
                    : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {activeParty.netPendingBalance > 0
                    ? (activeParty.type === 'supplier' ? 'ટ્રસ્ટે ચૂકવવાનું બાકી (Payable)' : 'ગ્રાહક પાસેથી લેણું (Receivable)')
                    : 'સરભર (Settled)'}
                </span>
              </div>
              <div className="text-2xl font-black font-mono">
                <span className={activeParty.netPendingBalance > 0 ? (activeParty.type === 'supplier' ? 'text-purple-700 dark:text-purple-300' : 'text-amber-700 dark:text-amber-300') : 'text-emerald-700 dark:text-emerald-300'}>
                  ₹ {activeParty.netPendingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                છેલ્લો વ્યવહાર: {activeParty.lastTxDate}
              </span>
              <div className="flex items-center gap-2 pt-2">
                {activeParty.netPendingBalance > 0 && unpaidBillsForParty.length > 0 && !isReadOnly ? (
                  <button
                    onClick={() => {
                      const firstUnpaid = unpaidBillsForParty[0];
                      if (firstUnpaid) {
                        onOpenSettlementModal(activeParty.type === 'customer' ? 'sales' : 'purchase', firstUnpaid);
                      }
                    }}
                    className={`w-full py-2 px-3 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeParty.type === 'customer' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    {activeParty.type === 'customer' ? 'વસૂલાત જમા કરો' : 'નાણાં ચૂકવણી કરો'}
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> તમામ બિલ સેટલ થયેલ છે
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Statement Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Date Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> સમયગાળો:
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 focus:outline-none"
                  title="શરૂઆતની તારીખ"
                />
                <span className="text-slate-400">થી</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 focus:outline-none"
                  title="અંતિમ તારીખ"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-[11px] text-rose-600 hover:underline font-bold ml-1 cursor-pointer"
                  >
                    ફિલ્ટર હટાવો
                  </button>
                )}
              </div>

              {/* Entry Type Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setEntryTypeFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    entryTypeFilter === 'all'
                      ? 'bg-slate-850 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  બધા વ્યવહારો
                </button>
                <button
                  onClick={() => setEntryTypeFilter('bills_only')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    entryTypeFilter === 'bills_only'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  માત્ર બિલ
                </button>
                <button
                  onClick={() => setEntryTypeFilter('payments_only')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    entryTypeFilter === 'payments_only'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  માત્ર ચુકવણી/પાવતી
                </button>
              </div>
            </div>
          </div>

          {/* Printable Statement Container */}
          <div id="printable-party-ledger-statement" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            {/* Trust Header for Official Statement */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-200 space-y-3 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={trustSettings?.logoUrl || '/logo.png'}
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                      alt="Trust Logo"
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'} | રજી. નં: <span className="font-mono font-bold">{trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      PAN: {trustSettings?.panNumber || 'AAATT1234F'} {trustSettings?.isGstEnabled ? `| GSTIN: ${trustSettings.gstNumber || '24AAACT1234A1Z5'}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black text-xs rounded-lg border border-amber-500/30">
                    પાર્ટી ખાતાવહી પત્રક (Party Statement)
                  </span>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    તારીખ: {new Date().toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Party Profile Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">પાર્ટી / વેપારીનું નામ:</span>
                  <span className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                    {activeParty.type === 'supplier' ? <Building2 className="w-4 h-4 text-purple-500" /> : <User className="w-4 h-4 text-emerald-500" />}
                    {activeParty.name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">પક્ષકાર વર્ગીકરણ:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {activeParty.type === 'supplier' ? 'વિક્રેતા / સપ્લાયર (Supplier / Creditor)' : (activeParty.type === 'customer' ? 'ગ્રાહક / પક્ષકાર (Customer / Debtor)' : 'સપ્લાયર અને ગ્રાહક બંને')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">સ્ટેટમેન્ટ સમયગાળો:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {startDate || 'પ્રારંભ'} થી {endDate || 'આજ સુધી'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase">
                    <th className="p-3">તારીખ (Date)</th>
                    <th className="p-3">વ્યવહાર પ્રકાર</th>
                    <th className="p-3">બિલ/પાવતી નં.</th>
                    <th className="p-3">વિગત / આઇટમ વર્ણન</th>
                    <th className="p-3 text-right">ડેબિટ / ઉધાર (Dr ₹)</th>
                    <th className="p-3 text-right">ક્રેડિટ / જમા (Cr ₹)</th>
                    <th className="p-3 text-right">ચોખ્ખી બાકી (Balance ₹)</th>
                    <th className="p-3 text-center print:hidden">ક્રિયા</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredLedgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        પસંદ કરેલ સમયગાળામાં આ પાર્ટી માટે કોઈ વ્યવહાર મળ્યો નથી.
                      </td>
                    </tr>
                  ) : (
                    filteredLedgerEntries.map((entry, idx) => (
                      <tr 
                        key={entry.id || idx} 
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            entry.type === 'purchase_bill'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : entry.type === 'purchase_payment'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                              : entry.type === 'sales_bill'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {entry.typeLabelGuj}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {entry.refNumber}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs">
                          <div>{entry.particularsGuj}</div>
                          {entry.paymentMode && (
                            <span className="text-[10px] text-slate-400">
                              પદ્ધતિ: {entry.paymentMode} {entry.bankName ? `(${entry.bankName})` : ''}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {entry.debitAmount > 0 ? `₹ ${entry.debitAmount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {entry.creditAmount > 0 ? `₹ ${entry.creditAmount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-black whitespace-nowrap">
                          <span className={entry.runningBalance > 0 ? (activeParty.type === 'supplier' ? 'text-purple-600' : 'text-amber-600') : 'text-emerald-600'}>
                            ₹ {entry.runningBalance.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] text-slate-400 ml-1 font-bold">
                            {entry.balanceType}
                          </span>
                        </td>
                        <td className="p-3 text-center print:hidden whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {entry.rawBill && (
                              <button
                                onClick={() => onViewInvoice(entry.type.startsWith('purchase') ? 'purchase' : 'sales', entry.rawBill)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                                title="મૂળ બિલ જુઓ"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {(entry.type === 'purchase_payment' || entry.type === 'sales_receipt') && entry.rawBill && (
                              <button
                                onClick={() => onViewReceipt(entry.type.startsWith('purchase') ? 'purchase' : 'sales', entry.rawBill!)}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-lg cursor-pointer transition-colors"
                                title="પાવતી જુઓ / પ્રિન્ટ કરો"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Statement Totals Footer */}
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-black text-xs border-t-2 border-slate-300 dark:border-slate-700">
                    <td colSpan={4} className="p-3 text-right text-slate-800 dark:text-slate-200">
                      કુલ સરવાળો (Total Debits & Credits):
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900 dark:text-white">
                      ₹ {totals.totalDebit.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900 dark:text-white">
                      ₹ {totals.totalCredit.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-mono text-base font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      ₹ {totals.closingBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Official Signatures and Notes for Printed Statement */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  આખર બાકી રકમ (Net Outstanding):
                </span>
                <span className="font-black text-sm text-slate-900 dark:text-white">
                  ₹ {totals.closingBalance.toLocaleString('en-IN')} (અક્ષરે: રૂપિયા {totals.closingBalance.toLocaleString('en-IN')} પૂરા બાકી)
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center text-[11px] text-slate-600 dark:text-slate-400 pt-6">
                <div>
                  <div className="border-b border-dashed border-slate-400 pb-8 mb-1"></div>
                  <span className="font-bold">હિસાબ કરનાર (Accountant)</span>
                </div>
                <div>
                  <div className="border-b border-dashed border-slate-400 pb-8 mb-1"></div>
                  <span className="font-bold">ઓડિટર / ચકાસનાર</span>
                </div>
                <div>
                  <div className="border-b border-dashed border-slate-400 pb-8 mb-1"></div>
                  <span className="font-bold">પ્રમુખશ્રી / મંત્રીશ્રી (ટ્રસ્ટી)</span>
                </div>
                <div>
                  <div className="border-b border-dashed border-slate-400 pb-8 mb-1"></div>
                  <span className="font-bold">પક્ષકાર / વેપારીની સહી</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
