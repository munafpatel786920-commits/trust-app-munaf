/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  FileCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Boxes, 
  AlertTriangle, 
  History, 
  Printer, 
  DollarSign, 
  Truck, 
  User, 
  Tag, 
  Barcode, 
  Coins, 
  Check, 
  Activity,
  Download,
  Loader2,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  BookOpen,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { InventoryItem, PurchaseBill, SalesBill, BankAccount, TrustSettings } from '../types';
import { downloadContainerAsPDF, printContainer } from '../utils/pdfPrint';

interface PurchaseSalesModuleProps {
  inventoryItems: InventoryItem[];
  purchaseBills: PurchaseBill[];
  salesBills: SalesBill[];
  banks: BankAccount[];
  onAddInventoryItem: (item: Omit<InventoryItem, 'id' | 'currentStock'>) => void;
  onEditInventoryItem: (item: InventoryItem) => void;
  onDeleteInventoryItem: (id: string) => void;
  onAddPurchase: (bill: Omit<PurchaseBill, 'id' | 'billNumber'>) => void;
  onUpdatePurchase?: (bill: PurchaseBill, settlementDetails?: any) => void;
  onAddSales: (bill: Omit<SalesBill, 'id' | 'billNumber'>) => void;
  onUpdateSales?: (bill: SalesBill, settlementDetails?: any) => void;
  onDeletePurchase: (id: string) => void;
  onDeleteSales: (id: string) => void;
  currentUser: { role: string };
  darkMode: boolean;
  trustSettings?: TrustSettings;
}

export default function PurchaseSalesModule({
  inventoryItems,
  purchaseBills,
  salesBills,
  banks,
  onAddInventoryItem,
  onEditInventoryItem,
  onDeleteInventoryItem,
  onAddPurchase,
  onUpdatePurchase,
  onAddSales,
  onUpdateSales,
  onDeletePurchase,
  onDeleteSales,
  currentUser,
  darkMode,
  trustSettings
}: PurchaseSalesModuleProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadReportPDF = async (containerId: string, filename: string) => {
    setIsGeneratingPDF(true);
    await downloadContainerAsPDF(containerId, filename);
    setIsGeneratingPDF(false);
  };
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'purchases' | 'sales' | 'udhar_ledger' | 'transactions'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [udharFilter, setUdharFilter] = useState<'all' | 'sales_udhar' | 'purchase_udhar' | 'settled'>('all');
  
  // Modals / Form Triggers
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  
  const [selectedInvoice, setSelectedInvoice] = useState<{
    type: 'purchase' | 'sales';
    data: any;
  } | null>(null);

  // Settlement Modal State
  const [settlingBill, setSettlingBill] = useState<{
    type: 'purchase' | 'sales';
    bill: PurchaseBill | SalesBill;
  } | null>(null);
  const [settlementAmount, setSettlementAmount] = useState('0');
  const [settlementMode, setSettlementMode] = useState<'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)'>('રોકડ (Cash)');
  const [settlementBankId, setSettlementBankId] = useState('');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [settlementRemarks, setSettlementRemarks] = useState('');

  // Udhar Payment Settlement Receipt Modal State
  const [selectedSettlementReceipt, setSelectedSettlementReceipt] = useState<{
    receiptNumber: string;
    type: 'purchase' | 'sales';
    billNumber: string;
    date: string;
    partyName: string;
    itemName: string;
    quantity?: number;
    rate?: number;
    totalAmount: number;
    previouslyPaid: number;
    paidToday: number;
    remainingBalance: number;
    paymentMode: string;
    bankName?: string;
    remarks?: string;
  } | null>(null);

  const handleOpenReceiptModalForBill = (type: 'purchase' | 'sales', bill: PurchaseBill | SalesBill) => {
    const currentPaid = bill.paidAmount !== undefined ? bill.paidAmount : (bill.paymentMode === 'ઉધાર (Credit)' ? 0 : bill.totalAmount);
    const partyName = type === 'sales' ? (bill as SalesBill).customerNameGuj : (bill as PurchaseBill).supplierNameGuj;
    const bankObj = banks.find(b => b.id === (bill.settlementBankId || bill.bankId));
    
    const totalAmount = bill.totalAmount;
    const paidToday = currentPaid > 0 ? currentPaid : totalAmount;
    const previouslyPaid = Math.max(0, totalAmount - paidToday);

    setSelectedSettlementReceipt({
      receiptNumber: `REC-UDHAR-${bill.billNumber.replace(/[^0-9]/g, '') || Date.now().toString().slice(-5)}`,
      type,
      billNumber: bill.billNumber,
      date: bill.settlementDate || bill.date,
      partyName,
      itemName: bill.itemNameGuj,
      quantity: bill.quantity,
      rate: bill.rate,
      totalAmount,
      previouslyPaid,
      paidToday,
      remainingBalance: Math.max(0, totalAmount - currentPaid),
      paymentMode: bill.settlementMode || bill.paymentMode || 'રોકડ (Cash)',
      bankName: bankObj?.bankNameGuj,
      remarks: bill.settlementRemarksGuj || bill.remarksGuj || ''
    });
  };

  // Item Form State
  const [itemNameGuj, setItemNameGuj] = useState('');
  const [itemNameEng, setItemNameEng] = useState('');
  const [sku, setSku] = useState('');
  const [unitGuj, setUnitGuj] = useState('નંગ (Pcs)');
  const [openingStock, setOpeningStock] = useState('0');
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [salesPrice, setSalesPrice] = useState('0');
  const [descriptionGuj, setDescriptionGuj] = useState('');

  // Purchase Form State
  const [pDate, setPDate] = useState(new Date().toISOString().split('T')[0]);
  const [pSupplierNameGuj, setPSupplierNameGuj] = useState('');
  const [pItemId, setPItemId] = useState('');
  const [pQuantity, setPQuantity] = useState('0');
  const [pRate, setPRate] = useState('0');
  const [pGstRate, setPGstRate] = useState<number>(trustSettings?.isGstEnabled ? (trustSettings.defaultGstRate ?? 0) : 0);
  const [pPaymentMode, setPPaymentMode] = useState<'રોકડ (Cash)' | 'ઉધાર (Credit)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)'>('રોકડ (Cash)');
  const [pBankId, setPBankId] = useState('');
  const [pRemarksGuj, setPRemarksGuj] = useState('');
  const [pDueDate, setPDueDate] = useState('');
  const [pPaidAmount, setPPaidAmount] = useState('0');

  // Sales Form State
  const [sDate, setSDate] = useState(new Date().toISOString().split('T')[0]);
  const [sCustomerNameGuj, setSCustomerNameGuj] = useState('');
  const [sItemId, setSItemId] = useState('');
  const [sQuantity, setSQuantity] = useState('0');
  const [sRate, setSRate] = useState('0');
  const [sGstRate, setSGstRate] = useState<number>(trustSettings?.isGstEnabled ? (trustSettings.defaultGstRate ?? 0) : 0);
  const [sPaymentMode, setSPaymentMode] = useState<'રોકડ (Cash)' | 'ઉધાર (Credit)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)'>('રોકડ (Cash)');
  const [sBankId, setSBankId] = useState('');
  const [sRemarksGuj, setSRemarksGuj] = useState('');
  const [sDueDate, setSDueDate] = useState('');
  const [sPaidAmount, setSPaidAmount] = useState('0');

  // Quick stats calculations
  const totalStockItems = inventoryItems.length;
  const totalStockValue = inventoryItems.reduce((acc, item) => acc + (item.currentStock * item.purchasePrice), 0);
  const totalPurchases = purchaseBills.reduce((acc, bill) => acc + bill.totalAmount, 0);
  const totalSales = salesBills.reduce((acc, bill) => acc + bill.totalAmount, 0);
  const lowStockCount = inventoryItems.filter(item => item.currentStock <= 5).length;

  // Udhar Outstanding Calculations
  const totalSalesUdharReceivable = salesBills.reduce((acc, bill) => {
    const paid = bill.paidAmount !== undefined ? bill.paidAmount : (bill.paymentMode === 'ઉધાર (Credit)' ? 0 : bill.totalAmount);
    return acc + Math.max(0, bill.totalAmount - paid);
  }, 0);

  const totalPurchaseUdharPayable = purchaseBills.reduce((acc, bill) => {
    const paid = bill.paidAmount !== undefined ? bill.paidAmount : (bill.paymentMode === 'ઉધાર (Credit)' ? 0 : bill.totalAmount);
    return acc + Math.max(0, bill.totalAmount - paid);
  }, 0);

  // Handlers for Products
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemNameGuj('');
    setItemNameEng('');
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setUnitGuj('નંગ (Pcs)');
    setOpeningStock('0');
    setPurchasePrice('0');
    setSalesPrice('0');
    setDescriptionGuj('');
    setShowItemForm(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemNameGuj(item.nameGuj);
    setItemNameEng(item.nameEng || '');
    setSku(item.sku);
    setUnitGuj(item.unitGuj);
    setOpeningStock(item.openingStock.toString());
    setPurchasePrice(item.purchasePrice.toString());
    setSalesPrice(item.salesPrice.toString());
    setDescriptionGuj(item.descriptionGuj || '');
    setShowItemForm(true);
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemNameGuj) {
      alert('કૃપા કરીને વસ્તુનું નામ દાખલ કરો.');
      return;
    }

    const payload = {
      nameGuj: itemNameGuj,
      nameEng: itemNameEng,
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      unitGuj,
      openingStock: parseFloat(openingStock) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      salesPrice: parseFloat(salesPrice) || 0,
      descriptionGuj
    };

    if (editingItem) {
      onEditInventoryItem({
        ...editingItem,
        ...payload,
        currentStock: editingItem.currentStock + (payload.openingStock - editingItem.openingStock)
      });
      alert('✓ આઇટમ વિગતો અપડેટ કરવામાં આવી.');
    } else {
      onAddInventoryItem(payload);
      alert('✓ નવું ઉત્પાદન/આઇટમ ઉમેરવામાં આવી.');
    }
    setShowItemForm(false);
  };

  // Handlers for Purchase
  const handleOpenAddPurchase = () => {
    setPDate(new Date().toISOString().split('T')[0]);
    setPSupplierNameGuj('');
    setPItemId(inventoryItems[0]?.id || '');
    setPQuantity('');
    setPRate(inventoryItems[0]?.purchasePrice.toString() || '0');
    setPGstRate(trustSettings?.isGstEnabled ? (trustSettings.defaultGstRate ?? 18) : 0);
    setPPaymentMode('રોકડ (Cash)');
    setPBankId(banks[0]?.id || '');
    setPRemarksGuj('');
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setPDueDate(d.toISOString().split('T')[0]);
    setPPaidAmount('0');
    setShowPurchaseForm(true);
  };

  const handlePurchaseItemChange = (itemId: string) => {
    setPItemId(itemId);
    const item = inventoryItems.find(i => i.id === itemId);
    if (item) {
      setPRate(item.purchasePrice.toString());
    }
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pSupplierNameGuj) {
      alert('કૃપા કરીને વિક્રેતાનું નામ દાખલ કરો.');
      return;
    }
    if (!pItemId) {
      alert('કૃપા કરીને આઇટમ પસંદ કરો.');
      return;
    }
    const qty = parseFloat(pQuantity) || 0;
    const rateVal = parseFloat(pRate) || 0;
    if (qty <= 0 || rateVal <= 0) {
      alert('કૃપા કરીને યોગ્ય જથ્થો અને દર દાખલ કરો.');
      return;
    }

    const subtotal = Math.round(qty * rateVal * 100) / 100;
    const isGstOn = !!trustSettings?.isGstEnabled;
    const effectiveGstRate = isGstOn ? (Number(pGstRate) || 0) : 0;
    const gstAmt = isGstOn && effectiveGstRate > 0 ? Math.round((subtotal * effectiveGstRate) / 100 * 100) / 100 : 0;
    const totalAmt = Math.round((subtotal + gstAmt) * 100) / 100;

    const isCredit = pPaymentMode === 'ઉધાર (Credit)';
    const initialPaid = isCredit ? (parseFloat(pPaidAmount) || 0) : totalAmt;
    const status = isCredit ? (initialPaid >= totalAmt ? 'ચૂકવેલ (Paid)' : (initialPaid > 0 ? 'અંશત: ચૂકવેલ (Partially Paid)' : 'ઉધાર / બાકી (Unpaid / Credit)')) : 'ચૂકવેલ (Paid)';

    const item = inventoryItems.find(i => i.id === pItemId);
    onAddPurchase({
      date: pDate,
      supplierNameGuj: pSupplierNameGuj,
      itemId: pItemId,
      itemNameGuj: item ? item.nameGuj : 'અજ્ઞાત',
      quantity: qty,
      rate: rateVal,
      subtotal,
      gstRate: effectiveGstRate,
      gstAmount: gstAmt,
      isGstBill: isGstOn && effectiveGstRate > 0,
      totalAmount: totalAmt,
      paymentMode: pPaymentMode,
      bankId: pPaymentMode !== 'રોકડ (Cash)' && pPaymentMode !== 'ઉધાર (Credit)' ? pBankId : undefined,
      remarksGuj: pRemarksGuj,
      paymentStatus: status,
      paidAmount: initialPaid,
      dueDate: isCredit ? pDueDate : undefined
    });

    alert(isCredit ? '✓ ઉધાર ખરીદીનું બિલ સફળતાપૂર્વક સાચવવામાં આવ્યું છે અને ઉધાર રજીસ્ટરમાં ઉમેરાયું છે.' : '✓ ખરીદીનું બિલ સફળતાપૂર્વક સાચવવામાં આવ્યું છે.');
    setShowPurchaseForm(false);
  };

  // Handlers for Sales
  const handleOpenAddSales = () => {
    setSDate(new Date().toISOString().split('T')[0]);
    setSCustomerNameGuj('');
    setSItemId(inventoryItems[0]?.id || '');
    setSQuantity('');
    setSRate(inventoryItems[0]?.salesPrice.toString() || '0');
    setSGstRate(trustSettings?.isGstEnabled ? (trustSettings.defaultGstRate ?? 18) : 0);
    setSPaymentMode('રોકડ (Cash)');
    setSBankId(banks[0]?.id || '');
    setSRemarksGuj('');
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setSDueDate(d.toISOString().split('T')[0]);
    setSPaidAmount('0');
    setShowSalesForm(true);
  };

  const handleSalesItemChange = (itemId: string) => {
    setSItemId(itemId);
    const item = inventoryItems.find(i => i.id === itemId);
    if (item) {
      setSRate(item.salesPrice.toString());
    }
  };

  const handleSalesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sCustomerNameGuj) {
      alert('કૃપા કરીને ગ્રાહકનું નામ દાખલ કરો.');
      return;
    }
    if (!sItemId) {
      alert('કૃપા કરીને આઇટમ પસંદ કરો.');
      return;
    }
    const qty = parseFloat(sQuantity) || 0;
    const rateVal = parseFloat(sRate) || 0;
    if (qty <= 0 || rateVal <= 0) {
      alert('કૃપા કરીને યોગ્ય જથ્થો અને દર દાખલ કરો.');
      return;
    }

    const item = inventoryItems.find(i => i.id === sItemId);
    if (item && item.currentStock < qty) {
      const confirmProceed = window.confirm(`ચેતવણી: પસંદ કરેલી આઇટમનો સ્ટોક ફક્ત ${item.currentStock} છે, અને તમે ${qty} વેચવા જઈ રહ્યા છો. શું તમે છતાં પણ આગળ વધવા માંગો છો?`);
      if (!confirmProceed) return;
    }

    const subtotal = Math.round(qty * rateVal * 100) / 100;
    const isGstOn = !!trustSettings?.isGstEnabled;
    const effectiveGstRate = isGstOn ? (Number(sGstRate) || 0) : 0;
    const gstAmt = isGstOn && effectiveGstRate > 0 ? Math.round((subtotal * effectiveGstRate) / 100 * 100) / 100 : 0;
    const totalAmt = Math.round((subtotal + gstAmt) * 100) / 100;

    const isCredit = sPaymentMode === 'ઉધાર (Credit)';
    const initialPaid = isCredit ? (parseFloat(sPaidAmount) || 0) : totalAmt;
    const status = isCredit ? (initialPaid >= totalAmt ? 'ચૂકવેલ (Paid)' : (initialPaid > 0 ? 'અંશત: ચૂકવેલ (Partially Paid)' : 'ઉધાર / બાકી (Unpaid / Credit)')) : 'ચૂકવેલ (Paid)';

    onAddSales({
      date: sDate,
      customerNameGuj: sCustomerNameGuj,
      itemId: sItemId,
      itemNameGuj: item ? item.nameGuj : 'અજ્ઞાત',
      quantity: qty,
      rate: rateVal,
      subtotal,
      gstRate: effectiveGstRate,
      gstAmount: gstAmt,
      isGstBill: isGstOn && effectiveGstRate > 0,
      totalAmount: totalAmt,
      paymentMode: sPaymentMode,
      bankId: sPaymentMode !== 'રોકડ (Cash)' && sPaymentMode !== 'ઉધાર (Credit)' ? sBankId : undefined,
      remarksGuj: sRemarksGuj,
      paymentStatus: status,
      paidAmount: initialPaid,
      dueDate: isCredit ? sDueDate : undefined
    });

    alert(isCredit ? '✓ ઉધાર વેચાણ બિલ સફળતાપૂર્વક સાચવવામાં આવ્યું છે અને લેણું રજીસ્ટરમાં ઉમેરાયું છે.' : '✓ વેચાણ બિલ સફળતાપૂર્વક સાચવવામાં આવ્યું છે.');
    setShowSalesForm(false);
  };

  // Open Settlement Modal
  const handleOpenSettlementModal = (type: 'purchase' | 'sales', bill: PurchaseBill | SalesBill) => {
    const currentPaid = bill.paidAmount !== undefined ? bill.paidAmount : (bill.paymentMode === 'ઉધાર (Credit)' ? 0 : bill.totalAmount);
    const pending = Math.max(0, bill.totalAmount - currentPaid);

    setSettlingBill({ type, bill });
    setSettlementAmount(pending.toString());
    setSettlementMode('રોકડ (Cash)');
    setSettlementBankId(banks[0]?.id || '');
    setSettlementDate(new Date().toISOString().split('T')[0]);
    setSettlementRemarks('');
  };

  const handleSettlementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingBill) return;

    const payAmt = parseFloat(settlementAmount) || 0;
    if (payAmt <= 0) {
      alert('કૃપા કરીને યોગ્ય સેટલમેન્ટ રકમ દાખલ કરો.');
      return;
    }

    const { type, bill } = settlingBill;
    const currentPaid = bill.paidAmount !== undefined ? bill.paidAmount : (bill.paymentMode === 'ઉધાર (Credit)' ? 0 : bill.totalAmount);
    const newPaid = currentPaid + payAmt;
    const newStatus = newPaid >= bill.totalAmount ? 'ચૂકવેલ (Paid)' : 'અંશત: ચૂકવેલ (Partially Paid)';

    const settlementDetails = {
      amount: payAmt,
      mode: settlementMode,
      bankId: settlementMode !== 'રોકડ (Cash)' ? settlementBankId : undefined,
      date: settlementDate,
      remarksGuj: settlementRemarks
    };

    const partyName = type === 'sales' ? (bill as SalesBill).customerNameGuj : (bill as PurchaseBill).supplierNameGuj;
    const bankObj = banks.find(b => b.id === settlementBankId);
    const receiptNo = `REC-UDHAR-${Date.now().toString().slice(-6)}`;

    if (type === 'purchase') {
      const updated: PurchaseBill = {
        ...bill,
        paidAmount: newPaid,
        paymentStatus: newStatus,
        settlementDate,
        settlementMode,
        settlementBankId: settlementMode !== 'રોકડ (Cash)' ? settlementBankId : undefined,
        settlementRemarksGuj: settlementRemarks
      };
      if (onUpdatePurchase) {
        onUpdatePurchase(updated, settlementDetails);
      }
    } else {
      const updated: SalesBill = {
        ...bill,
        paidAmount: newPaid,
        paymentStatus: newStatus,
        settlementDate,
        settlementMode,
        settlementBankId: settlementMode !== 'રોકડ (Cash)' ? settlementBankId : undefined,
        settlementRemarksGuj: settlementRemarks
      };
      if (onUpdateSales) {
        onUpdateSales(updated, settlementDetails);
      }
    }

    setSettlingBill(null);

    // Open Payment Receipt Modal immediately for print and PDF download
    setSelectedSettlementReceipt({
      receiptNumber: receiptNo,
      type,
      billNumber: bill.billNumber,
      date: settlementDate,
      partyName,
      itemName: bill.itemNameGuj,
      quantity: bill.quantity,
      rate: bill.rate,
      totalAmount: bill.totalAmount,
      previouslyPaid: currentPaid,
      paidToday: payAmt,
      remainingBalance: Math.max(0, bill.totalAmount - newPaid),
      paymentMode: settlementMode,
      bankName: settlementMode !== 'રોકડ (Cash)' ? bankObj?.bankNameGuj : undefined,
      remarks: settlementRemarks
    });
  };

  const handlePrint = (divId: string) => {
    const printContent = document.getElementById(divId);
    if (!printContent) return;
    const winPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    if (!winPrint) return;
    winPrint.document.write(`
      <html>
        <head>
          <title>બિલ / ઇન્વોઇસ પ્રિન્ટ</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
          </style>
        </head>
        <body onload="window.print();window.close()">
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    winPrint.document.close();
    winPrint.focus();
  };

  // Filter products / bills
  const filteredItems = inventoryItems.filter(item => {
    const q = searchQuery.toLowerCase();
    return item.nameGuj.toLowerCase().includes(q) || (item.nameEng && item.nameEng.toLowerCase().includes(q)) || item.sku.toLowerCase().includes(q);
  });

  const filteredPurchases = purchaseBills.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.supplierNameGuj.toLowerCase().includes(q) || p.itemNameGuj.toLowerCase().includes(q) || p.billNumber.toLowerCase().includes(q);
  });

  const filteredSales = salesBills.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.customerNameGuj.toLowerCase().includes(q) || s.itemNameGuj.toLowerCase().includes(q) || s.billNumber.toLowerCase().includes(q);
  });

  // Combined transactions sorted by date desc
  const combinedTransactions = [
    ...purchaseBills.map(p => ({ ...p, txType: 'Purchase' as const })),
    ...salesBills.map(s => ({ ...s, txType: 'Sales' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = combinedTransactions.filter(tx => {
    const q = searchQuery.toLowerCase();
    const name = tx.txType === 'Purchase' ? tx.supplierNameGuj : tx.customerNameGuj;
    return name.toLowerCase().includes(q) || tx.itemNameGuj.toLowerCase().includes(q) || tx.billNumber.toLowerCase().includes(q);
  });

  const isReadOnly = currentUser.role === 'ReadOnly';

  return (
    <div className="space-y-6">
      {/* KPI Cards / Dashboard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">ઉત્પાદન આઇટમ્સ</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100">{totalStockItems}</span>
              <span className="text-[9px] text-slate-500 font-medium">આઇટમ્સ</span>
            </div>
          </div>
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
            <Boxes className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">સ્ટોક મૂલ્યાંકન</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100">₹ {totalStockValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">કુલ ખરીદી બિલ</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-rose-600 dark:text-rose-400">₹ {totalPurchases.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">કુલ વેચાણ આવક</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹ {totalSales.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block tracking-wider">ઉધાર વેચાણ બાકી (લેણું)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-amber-700 dark:text-amber-300">₹ {totalSalesUdharReceivable.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="p-2 bg-amber-100 dark:bg-amber-950/60 rounded-xl">
            <Coins className="w-4 h-4 text-amber-700 dark:text-amber-300" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase block tracking-wider">ઉધાર ખરીદી બાકી (દેવું)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-purple-700 dark:text-purple-300">₹ {totalPurchaseUdharPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="p-2 bg-purple-100 dark:bg-purple-950/60 rounded-xl">
            <CreditCard className="w-4 h-4 text-purple-700 dark:text-purple-300" />
          </div>
        </div>
      </div>

      {/* Toolbar / Search & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setActiveSubTab('inventory'); setSearchQuery(''); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'inventory'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" /> સ્ટોક / આઈટમ યાદી
          </button>
          <button
            onClick={() => { setActiveSubTab('purchases'); setSearchQuery(''); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'purchases'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-4 h-4" /> ખરીદીઓ (Purchases)
          </button>
          <button
            onClick={() => { setActiveSubTab('sales'); setSearchQuery(''); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'sales'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> વેચાણ ઇન્વોઇસ (Sales)
          </button>
          <button
            onClick={() => { setActiveSubTab('udhar_ledger'); setSearchQuery(''); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'udhar_ledger'
                ? 'bg-amber-600 text-white shadow-sm font-black'
                : 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500" /> ઉધાર બાકી રજીસ્ટર (Udhar Ledger)
          </button>
          <button
            onClick={() => { setActiveSubTab('transactions'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'transactions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" /> વ્યવહારોનો ઇતિહાસ
          </button>
        </div>

        {/* Search and action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ઝડપી શોધ કરો..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-750 dark:text-slate-200"
            />
          </div>

          {!isReadOnly && (
            <div className="flex gap-2">
              {activeSubTab === 'inventory' && (
                <button
                  onClick={handleOpenAddItem}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> નવી પ્રોડક્ટ ઉમેરો
                </button>
              )}
              {activeSubTab === 'purchases' && (
                <button
                  onClick={handleOpenAddPurchase}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> ખરીદી બિલ બનાવો
                </button>
              )}
              {activeSubTab === 'sales' && (
                <button
                  onClick={handleOpenAddSales}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> વેચાણ બિલ બનાવો
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Table views */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Inventory View */}
        {activeSubTab === 'inventory' && (
          <div id="printable-inventory-container" className="p-4 space-y-4 bg-white dark:bg-slate-900">
            {/* Formal Trust Header for Stock Inventory Report */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-200 space-y-2 border border-slate-200 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-750 pb-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                    <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                    </h2>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'} | નોંધણી નં: <span className="font-mono font-bold text-slate-850 dark:text-slate-250">{trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 print:hidden">
                  <button
                    onClick={() => handleDownloadReportPDF('printable-inventory-container', 'Stock_Inventory_Report')}
                    disabled={isGeneratingPDF}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                    title="આખરી સ્ટોક રિપોર્ટ પીડીએફ ડાઉનલોડ"
                  >
                    {isGeneratingPDF ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF ડાઉનલોડ
                  </button>
                  <button
                    onClick={() => printContainer('printable-inventory-container')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                    title="આખરી સ્ટોક રિપોર્ટ પ્રિન્ટ"
                  >
                    <Printer className="w-3 h-3" /> પ્રિન્ટ રિપોર્ટ
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>દસ્તાવેજ: સ્ટોક આઈટમ યાદી (Product Inventory Stock List)</span>
                <span>તા.: {new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">SKU / Code</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">વસ્તુનું નામ (Item Name)</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">એકમ (Unit)</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">શરૂઆતનો સ્ટોક</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">હાલનો સ્ટોક</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ખરીદ કિંમત (Price)</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">વેચાણ કિંમત (Price)</th>
                    {!isReadOnly && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center print:hidden">ક્રિયા</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={isReadOnly ? 7 : 8} className="p-8 text-center text-xs text-slate-400">
                        કોઈ આઈટમ અથવા પ્રોડક્ટ મળી નથી.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="p-4 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{item.sku}</td>
                        <td className="p-4">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">{item.nameGuj}</span>
                          {item.nameEng && <span className="text-[10px] text-slate-400 block font-mono">{item.nameEng}</span>}
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-600 dark:text-slate-400">{item.unitGuj}</td>
                        <td className="p-4 text-xs text-right font-mono text-slate-600 dark:text-slate-400">{item.openingStock}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.currentStock <= 5 && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping print:hidden" title="Low Stock Warning!" />
                            )}
                            <span className={`text-xs font-bold font-mono ${item.currentStock <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                              {item.currentStock}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-right font-bold font-mono text-rose-600">₹ {item.purchasePrice.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-xs text-right font-bold font-mono text-emerald-600">₹ {item.salesPrice.toLocaleString('en-IN')}</td>
                        {!isReadOnly && (
                          <td className="p-4 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditItem(item)}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:text-indigo-400 rounded-lg transition-all"
                                title="ફેરફાર કરો"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`શું તમે ખરેખર "${item.nameGuj}" ને હટાવવા માંગો છો? આ ક્રિયા સ્ટોક વિગતો દૂર કરશે.`)) {
                                    onDeleteInventoryItem(item.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-400 rounded-lg transition-all"
                                title="રદ કરો"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Purchases View */}
        {activeSubTab === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">બિલ નંબર</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">તારીખ</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">વિક્રેતા / સપ્લાયર</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">પ્રોડક્ટ</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">જથ્થો</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">દર (Rate)</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">કુલ રકમ</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ચૂકવણી મોડ</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">બાકી ઉધાર</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">ક્રિયા / સેટલમેન્ટ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-xs text-slate-400">
                      કોઈ ખરીદી નોંધો મળી નથી.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map(bill => {
                    const paid = bill.paidAmount !== undefined ? bill.paidAmount : (bill.paymentMode === 'ઉધાર (Credit)' ? 0 : bill.totalAmount);
                    const pending = Math.max(0, bill.totalAmount - paid);
                    return (
                      <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="p-4 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{bill.billNumber}</td>
                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{bill.date}</td>
                        <td className="p-4 text-xs font-bold text-slate-800 dark:text-slate-200">{bill.supplierNameGuj}</td>
                        <td className="p-4 text-xs text-slate-800 dark:text-slate-100">{bill.itemNameGuj}</td>
                        <td className="p-4 text-xs text-right font-mono font-bold text-slate-700 dark:text-slate-300">{bill.quantity}</td>
                        <td className="p-4 text-xs text-right font-mono text-slate-600 dark:text-slate-400">₹ {bill.rate.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-xs text-right font-bold font-mono text-rose-600">₹ {bill.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.paymentMode === 'ઉધાર (Credit)'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                              : bill.paymentMode === 'રોકડ (Cash)'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                          }`}>
                            {bill.paymentMode}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-right font-mono font-bold">
                          {pending > 0 ? (
                            <span className="text-purple-600 dark:text-purple-400">₹ {pending.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-emerald-600 text-[11px]">ચૂકવેલ (Paid)</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {pending > 0 && !isReadOnly && (
                              <button
                                onClick={() => handleOpenSettlementModal('purchase', bill)}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                title="ઉધાર ચૂકવણી કરો"
                              >
                                <CreditCard className="w-3 h-3" /> ચૂકવણી
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedInvoice({ type: 'purchase', data: bill })}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                              title="બિલ જુઓ / પ્રિન્ટ કરો"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {paid > 0 && (
                              <button
                                onClick={() => handleOpenReceiptModalForBill('purchase', bill)}
                                className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold text-[10px] rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                title="ચૂકવણી પાવતી જુઓ / ડાઉનલોડ કરો"
                              >
                                <Receipt className="w-3 h-3 text-purple-600 dark:text-purple-400" /> પાવતી
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Sales View */}
        {activeSubTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ઇન્વોઇસ નંબર</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">તારીખ</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ગ્રાહક / ખરીદનાર</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">પ્રોડક્ટ</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">જથ્થો</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">દર (Rate)</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">કુલ રકમ</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ચૂકવણી મોડ</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">બાકી લેણું</th>
                  <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">ક્રિયા / વસૂલાત</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-xs text-slate-400">
                      કોઈ વેચાણ નોંધો મળી નથી.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map(bill => {
                    const paid = bill.paidAmount !== undefined ? bill.paidAmount : (bill.paymentMode === 'ઉધાર (Credit)' ? 0 : bill.totalAmount);
                    const pending = Math.max(0, bill.totalAmount - paid);
                    return (
                      <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="p-4 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{bill.billNumber}</td>
                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{bill.date}</td>
                        <td className="p-4 text-xs font-bold text-slate-800 dark:text-slate-200">{bill.customerNameGuj}</td>
                        <td className="p-4 text-xs text-slate-800 dark:text-slate-100">{bill.itemNameGuj}</td>
                        <td className="p-4 text-xs text-right font-mono font-bold text-slate-700 dark:text-slate-300">{bill.quantity}</td>
                        <td className="p-4 text-xs text-right font-mono text-slate-600 dark:text-slate-400">₹ {bill.rate.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-xs text-right font-bold font-mono text-emerald-600">₹ {bill.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.paymentMode === 'ઉધાર (Credit)'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                              : bill.paymentMode === 'રોકડ (Cash)'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                          }`}>
                            {bill.paymentMode}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-right font-mono font-bold">
                          {pending > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">₹ {pending.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-emerald-600 text-[11px]">જમા થયેલ (Paid)</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {pending > 0 && !isReadOnly && (
                              <button
                                onClick={() => handleOpenSettlementModal('sales', bill)}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                title="ઉધાર વસૂલાત નોંધો"
                              >
                                <Coins className="w-3 h-3" /> જમા કરો
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedInvoice({ type: 'sales', data: bill })}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                              title="બિલ જુઓ / પ્રિન્ટ કરો"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {paid > 0 && (
                              <button
                                onClick={() => handleOpenReceiptModalForBill('sales', bill)}
                                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px] rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                title="વસૂલાત પાવતી જુઓ / ડાઉનલોડ કરો"
                              >
                                <Receipt className="w-3 h-3 text-amber-600 dark:text-amber-400" /> પાવતી
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Udhar / Credit Ledger View */}
        {activeSubTab === 'udhar_ledger' && (
          <div id="printable-udhar-container" className="p-4 space-y-4 bg-white dark:bg-slate-900">
            {/* Trust Header */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-200 space-y-2 border border-slate-200 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-750 pb-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                    <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                    </h2>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      ઉધાર બાકી અને વસૂલાત પત્રક (Udhar / Credit Outstanding Register)
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 print:hidden">
                  <button
                    onClick={() => handleDownloadReportPDF('printable-udhar-container', 'Udhar_Outstanding_Ledger')}
                    disabled={isGeneratingPDF}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    {isGeneratingPDF ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF ડાઉનલોડ
                  </button>
                  <button
                    onClick={() => printContainer('printable-udhar-container')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3 h-3" /> પ્રિન્ટ રિપોર્ટ
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2 pt-1 print:hidden">
                <button
                  onClick={() => setUdharFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${udharFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                  બધા ઉધાર વ્યવહારો
                </button>
                <button
                  onClick={() => setUdharFilter('sales_udhar')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${udharFilter === 'sales_udhar' ? 'bg-amber-600 text-white' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'}`}
                >
                  ઉધાર વેચાણ (બાકી લેણું) (₹ {totalSalesUdharReceivable.toLocaleString('en-IN')})
                </button>
                <button
                  onClick={() => setUdharFilter('purchase_udhar')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${udharFilter === 'purchase_udhar' ? 'bg-purple-600 text-white' : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'}`}
                >
                  ઉધાર ખરીદી (બાકી દેવું) (₹ {totalPurchaseUdharPayable.toLocaleString('en-IN')})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="p-3.5">બિલ નં & તારીખ</th>
                    <th className="p-3.5">પ્રકાર</th>
                    <th className="p-3.5">પક્ષકાર (ગ્રાહક / સપ્લાયર)</th>
                    <th className="p-3.5">આઇટમ વિગત</th>
                    <th className="p-3.5 text-right">કુલ બિલ રકમ</th>
                    <th className="p-3.5 text-right">ચૂકવેલ / જમા રકમ</th>
                    <th className="p-3.5 text-right">બાકી ઉધાર રકમ</th>
                    <th className="p-3.5">મુદત / પાકતી તારીખ</th>
                    <th className="p-3.5 text-center print:hidden">ક્રિયા</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(() => {
                    const udharItems: Array<{ type: 'sales' | 'purchase'; bill: SalesBill | PurchaseBill }> = [];
                    
                    if (udharFilter === 'all' || udharFilter === 'sales_udhar') {
                      salesBills.filter(s => s.paymentMode === 'ઉધાર (Credit)' || (s.paidAmount !== undefined && s.paidAmount < s.totalAmount)).forEach(s => udharItems.push({ type: 'sales', bill: s }));
                    }
                    if (udharFilter === 'all' || udharFilter === 'purchase_udhar') {
                      purchaseBills.filter(p => p.paymentMode === 'ઉધાર (Credit)' || (p.paidAmount !== undefined && p.paidAmount < p.totalAmount)).forEach(p => udharItems.push({ type: 'purchase', bill: p }));
                    }

                    const filteredUdharList = udharItems.filter(item => {
                      const q = searchQuery.toLowerCase();
                      const party = item.type === 'sales' ? (item.bill as SalesBill).customerNameGuj : (item.bill as PurchaseBill).supplierNameGuj;
                      return party.toLowerCase().includes(q) || item.bill.itemNameGuj.toLowerCase().includes(q) || item.bill.billNumber.toLowerCase().includes(q);
                    });

                    if (filteredUdharList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-xs text-slate-400">
                            કોઈ ઉધાર લેણું કે દેવું વિગત મળી નથી.
                          </td>
                        </tr>
                      );
                    }

                    return filteredUdharList.map(({ type, bill }) => {
                      const partyName = type === 'sales' ? (bill as SalesBill).customerNameGuj : (bill as PurchaseBill).supplierNameGuj;
                      const paid = bill.paidAmount !== undefined ? bill.paidAmount : 0;
                      const pending = Math.max(0, bill.totalAmount - paid);

                      return (
                        <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-xs">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">{bill.billNumber}</span>
                            <span className="text-[10px] text-slate-400 block">{bill.date}</span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              type === 'sales' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            }`}>
                              {type === 'sales' ? 'ઉધાર વેચાણ (લેણું)' : 'ઉધાર ખરીદી (દેવું)'}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{partyName}</td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-400">{bill.itemNameGuj} (x{bill.quantity})</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">₹ {bill.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="p-3.5 text-right font-mono text-emerald-600 font-bold">₹ {paid.toLocaleString('en-IN')}</td>
                          <td className="p-3.5 text-right font-mono font-black text-rose-600">
                            {pending > 0 ? `₹ ${pending.toLocaleString('en-IN')}` : <span className="text-emerald-600 text-[11px]">ચૂકવેલ / સેટલ</span>}
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">{bill.dueDate || '—'}</td>
                          <td className="p-3.5 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1.5">
                              {pending > 0 && !isReadOnly && (
                                <button
                                  onClick={() => handleOpenSettlementModal(type, bill)}
                                  className={`px-2.5 py-1 text-white font-bold text-[10px] rounded-lg cursor-pointer shadow-xs ${
                                    type === 'sales' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'
                                  }`}
                                >
                                  {type === 'sales' ? 'રકમ જમા કરો' : 'ચુકવણી કરો'}
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedInvoice({ type, data: bill })}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                                title="બિલ જુઓ / પ્રિન્ટ કરો"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              {paid > 0 && (
                                <button
                                  onClick={() => handleOpenReceiptModalForBill(type, bill)}
                                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px] rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                  title="વસૂલાત પાવતી પ્રિન્ટ / PDF ડાઉનલોડ"
                                >
                                  <Receipt className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> પાવતી
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* General combined Transactions view */}
        {activeSubTab === 'transactions' && (
          <div id="printable-transactions-container" className="p-4 space-y-4 bg-white dark:bg-slate-900">
            {/* Formal Trust Header for Transactions History */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-200 space-y-2 border border-slate-200 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-750 pb-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                    <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                    </h2>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'} | નોંધણી નં: <span className="font-mono font-bold text-slate-850 dark:text-slate-250">{trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 print:hidden">
                  <button
                    onClick={() => handleDownloadReportPDF('printable-transactions-container', 'Transactions_History_Report')}
                    disabled={isGeneratingPDF}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                    title="આર્થિક વ્યવહારોનો ઇતિહાસ પીડીએફ ડાઉનલોડ"
                  >
                    {isGeneratingPDF ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF ડાઉનલોડ
                  </button>
                  <button
                    onClick={() => printContainer('printable-transactions-container')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                    title="આર્થિક વ્યવહારોનો ઇતિહાસ પ્રિન્ટ"
                  >
                    <Printer className="w-3 h-3" /> પ્રિન્ટ રિપોર્ટ
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>દસ્તાવેજ: ઉત્પાદન આર્થિક વ્યવહારોનો સંપૂર્ણ ઇતિહાસ (Product Ledger History)</span>
                <span>તા.: {new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">તારીખ</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">પ્રકાર (Type)</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">બિલ / વાઉચર ક્રમાંક</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">પક્ષકાર (Party Name)</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">આઇટમ વિગત</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">જથ્થો</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">રકમ</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ચૂકવણી પદ્ધતિ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                        કોઈ આર્થિક વ્યવહાર પત્રક મળ્યું નથી.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{tx.date}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            tx.txType === 'Purchase'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                          }`}>
                            {tx.txType === 'Purchase' ? 'ખરીદી (Purchase)' : 'વેચાણ (Sales)'}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{tx.billNumber}</td>
                        <td className="p-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {tx.txType === 'Purchase' ? tx.supplierNameGuj : tx.customerNameGuj}
                        </td>
                        <td className="p-4 text-xs text-slate-700 dark:text-slate-350">{tx.itemNameGuj}</td>
                        <td className="p-4 text-xs text-right font-mono text-slate-700 dark:text-slate-300">{tx.quantity}</td>
                        <td className={`p-4 text-xs text-right font-bold font-mono ${tx.txType === 'Purchase' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ₹ {tx.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{tx.paymentMode}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Item Modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <span className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                <Boxes className="w-4 h-4 text-indigo-500" /> {editingItem ? 'ઉત્પાદનમાં સુધારો (Edit Product)' : 'નવી આઇટમ ઉમેરો (Add New Product)'}
              </span>
              <button
                type="button"
                onClick={() => setShowItemForm(false)}
                className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleItemSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">વસ્તુનું નામ (ગુજરાતી) *</label>
                  <input
                    type="text"
                    required
                    value={itemNameGuj}
                    onChange={(e) => setItemNameGuj(e.target.value)}
                    placeholder="દા.ત. ધાર્મિક પુસ્તકો"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">વસ્તુનું નામ (English)</label>
                  <input
                    type="text"
                    value={itemNameEng}
                    onChange={(e) => setItemNameEng(e.target.value)}
                    placeholder="e.g. Religious Books"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">બારકોડ / SKU Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="દા.ત. BOK-101"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">એકમ (Unit) *</label>
                  <select
                    value={unitGuj}
                    onChange={(e) => setUnitGuj(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="નંગ (Pcs)">નંગ (Pcs)</option>
                    <option value="કિલો (Kg)">કિલો (Kg)</option>
                    <option value="લીટર (Ltr)">લીટર (Ltr)</option>
                    <option value="બોક્સ (Box)">બોક્સ (Box)</option>
                    <option value="મીટર (Mtr)">મીટર (Mtr)</option>
                    <option value="કીટ (Kit)">કીટ (Kit)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">શરૂઆતનો સ્ટોક</label>
                  <input
                    type="number"
                    min="0"
                    value={openingStock}
                    onChange={(e) => setOpeningStock(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">ખરીદ કિંમત (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">વેચાણ કિંમત (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">ટૂંકી વિગત / વર્ણન</label>
                <textarea
                  value={descriptionGuj}
                  onChange={(e) => setDescriptionGuj(e.target.value)}
                  rows={2}
                  placeholder="વસ્તુ વિષે કોઈ ટિપ્પણી..."
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  સાચવો (Save Product)
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Purchase Bill Modal */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <span className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                <ShoppingBag className="w-4.5 h-4.5 text-rose-500" /> નવી ખરીદી પાવતી નોંધ (Add Purchase Invoice)
              </span>
              <button
                type="button"
                onClick={() => setShowPurchaseForm(false)}
                className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">તારીખ (Date) *</label>
                  <input
                    type="date"
                    required
                    value={pDate}
                    onChange={(e) => setPDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">વિક્રેતા / સપ્લાયર નું નામ *</label>
                  <input
                    type="text"
                    required
                    value={pSupplierNameGuj}
                    onChange={(e) => setPSupplierNameGuj(e.target.value)}
                    placeholder="દા.ત. જનરલ સપ્લાયર્સ લિ."
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">ઉત્પાદન / વસ્તુ પસંદ કરો *</label>
                {inventoryItems.length === 0 ? (
                  <div className="p-2 border border-dashed border-rose-300 text-rose-600 rounded-xl bg-rose-50/50">
                    તમારી પાસે કોઈ આઇટમ ઉપલબ્ધ નથી! પ્રથમ 'સ્ટોક / આઈટમ યાદી' માં નવી આઈટમ બનાવો.
                  </div>
                ) : (
                  <select
                    value={pItemId}
                    onChange={(e) => handlePurchaseItemChange(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nameGuj} - SKU: {item.sku} (ખરીદ ભાવ: ₹ {item.purchasePrice})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className={`grid ${trustSettings?.isGstEnabled ? 'grid-cols-3' : 'grid-cols-3'} gap-3`}>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">ખરીદી જથ્થો (Qty) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pQuantity}
                    onChange={(e) => setPQuantity(e.target.value)}
                    placeholder="દા.ત. 10"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">ખરીદી દર (Rate ₹) *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.01"
                    required
                    value={pRate}
                    onChange={(e) => setPRate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  />
                </div>
                {trustSettings?.isGstEnabled ? (
                  <div className="space-y-1">
                    <label className="font-bold text-purple-700 dark:text-purple-400 block flex items-center justify-between">
                      <span>GST દર (%)</span>
                      <span className="text-[10px] text-purple-500 font-normal">Active</span>
                    </label>
                    <select
                      value={pGstRate}
                      onChange={(e) => setPGstRate(Number(e.target.value))}
                      className="w-full p-2 border border-purple-300 dark:border-purple-800 rounded-xl bg-purple-50/40 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-bold focus:outline-none"
                    >
                      <option value={0}>0% (Exempt / કરમુક્ત)</option>
                      <option value={5}>5% (2.5% + 2.5%)</option>
                      <option value={12}>12% (6% + 6%)</option>
                      <option value={18}>18% (9% + 9%)</option>
                      <option value={28}>28% (14% + 14%)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400 block">કુલ રકમ (₹)</label>
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 font-mono text-center">
                      ₹ {((parseFloat(pQuantity) || 0) * (parseFloat(pRate) || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>

              {/* GST Calculation Summary Card for Purchase */}
              {trustSettings?.isGstEnabled && (
                <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>કરપાત્ર રકમ (Subtotal):</span>
                    <span className="font-mono font-bold">₹ {((parseFloat(pQuantity) || 0) * (parseFloat(pRate) || 0)).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-purple-700 dark:text-purple-300">
                    <span>GST રકમ ({pGstRate}%):</span>
                    <span className="font-mono font-bold">
                      ₹ {(Math.round(((parseFloat(pQuantity) || 0) * (parseFloat(pRate) || 0) * pGstRate) / 100 * 100) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-rose-600 dark:text-rose-400 border-t border-purple-200 dark:border-purple-800 pt-1.5 text-sm">
                    <span>કુલ ખરીદી રકમ (Net Total):</span>
                    <span className="font-mono">
                      ₹ {(Math.round(((parseFloat(pQuantity) || 0) * (parseFloat(pRate) || 0) * (1 + pGstRate / 100)) * 100) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">ચૂકવણી પદ્ધતિ (Mode) *</label>
                  <select
                    value={pPaymentMode}
                    onChange={(e) => setPPaymentMode(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  >
                    <option value="રોકડ (Cash)">રોકડ (Cash)</option>
                    <option value="બેંક ટ્રાન્સફર (Bank)">બેંક ટ્રાન્સફર (Bank)</option>
                    <option value="ચેક (Cheque)">ચેક (Cheque)</option>
                    <option value="ઉધાર (Credit)">ઉધાર (Credit)</option>
                  </select>
                </div>

                {pPaymentMode === 'ઉધાર (Credit)' ? (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="font-bold text-slate-600 dark:text-slate-400 block">પાકતી / ચૂકવણીની તારીખ (Due Date)</label>
                    <input
                      type="date"
                      value={pDueDate}
                      onChange={(e) => setPDueDate(e.target.value)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                    />
                  </div>
                ) : pPaymentMode !== 'રોકડ (Cash)' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="font-bold text-slate-600 dark:text-slate-400 block">બેંક ખાતું પસંદ કરો *</label>
                    <select
                      value={pBankId}
                      onChange={(e) => setPBankId(e.target.value)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                    >
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.bankNameGuj} ({b.accountNumber.slice(-4)}) - સિલક: ₹ {b.balance.toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {pPaymentMode === 'ઉધાર (Credit)' && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="space-y-1">
                    <label className="font-bold text-purple-800 dark:text-purple-300 block">એડવાન્સ / રોકડા ચૂકવેલ (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pPaidAmount}
                      onChange={(e) => setPPaidAmount(e.target.value)}
                      placeholder="0"
                      className="w-full p-2 border border-purple-200 dark:border-purple-800 rounded-xl bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-150 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-purple-800 dark:text-purple-300 block">બાકી ઉધાર રકમ (Payable)</label>
                    <div className="p-2 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl font-black text-rose-600 font-mono text-center">
                      ₹ {Math.max(0, ((parseFloat(pQuantity) || 0) * (parseFloat(pRate) || 0)) - (parseFloat(pPaidAmount) || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">ખાસ નોંધ / ટિપ્પણીઓ</label>
                <input
                  type="text"
                  value={pRemarksGuj}
                  onChange={(e) => setPRemarksGuj(e.target.value)}
                  placeholder="કોઈ વધારાની વિગતો..."
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 text-[11px] text-amber-700 dark:text-amber-400">
                💡 ખરીદી સેવ કરવાથી <strong>હાલનો સ્ટોક સ્વયંભૂ વધશે</strong> અને ટ્રસ્ટના નાણાકીય ખાતાવહીમાં <strong>ખર્ચ વાઉચર પણ નોંધાશે</strong>.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  disabled={inventoryItems.length === 0}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  ખરીદી કન્ફર્મ કરો
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Sales Bill Modal */}
      {showSalesForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <span className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                <ShoppingBag className="w-4.5 h-4.5 text-emerald-500" /> નવું વેચાણ બિલ બનાવો (Add Sales Invoice)
              </span>
              <button
                type="button"
                onClick={() => setShowSalesForm(false)}
                className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalesSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">તારીખ (Date) *</label>
                  <input
                    type="date"
                    required
                    value={sDate}
                    onChange={(e) => setSDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">ગ્રાહક / ખરીદનાર નું નામ *</label>
                  <input
                    type="text"
                    required
                    value={sCustomerNameGuj}
                    onChange={(e) => setSCustomerNameGuj(e.target.value)}
                    placeholder="દા.ત. નિતિનભાઈ પંચાલ"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">ઉત્પાદન / વસ્તુ પસંદ કરો *</label>
                {inventoryItems.length === 0 ? (
                  <div className="p-2 border border-dashed border-rose-300 text-rose-600 rounded-xl bg-rose-50/50">
                    તમારી પાસે કોઈ આઇટમ ઉપલબ્ધ નથી!
                  </div>
                ) : (
                  <select
                    value={sItemId}
                    onChange={(e) => handleSalesItemChange(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  >
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nameGuj} - SKU: {item.sku} (વેચાણ ભાવ: ₹ {item.salesPrice} | સ્ટોક: {item.currentStock})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className={`grid ${trustSettings?.isGstEnabled ? 'grid-cols-3' : 'grid-cols-3'} gap-3`}>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">વેચાણ જથ્થો (Qty) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sQuantity}
                    onChange={(e) => setSQuantity(e.target.value)}
                    placeholder="દા.ત. 5"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">વેચાણ દર (Rate ₹) *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.01"
                    required
                    value={sRate}
                    onChange={(e) => setSRate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  />
                </div>
                {trustSettings?.isGstEnabled ? (
                  <div className="space-y-1">
                    <label className="font-bold text-purple-700 dark:text-purple-400 block flex items-center justify-between">
                      <span>GST દર (%)</span>
                      <span className="text-[10px] text-purple-500 font-normal">Active</span>
                    </label>
                    <select
                      value={sGstRate}
                      onChange={(e) => setSGstRate(Number(e.target.value))}
                      className="w-full p-2 border border-purple-300 dark:border-purple-800 rounded-xl bg-purple-50/40 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-bold focus:outline-none"
                    >
                      <option value={0}>0% (Exempt / કરમુક્ત)</option>
                      <option value={5}>5% (2.5% + 2.5%)</option>
                      <option value={12}>12% (6% + 6%)</option>
                      <option value={18}>18% (9% + 9%)</option>
                      <option value={28}>28% (14% + 14%)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400 block">કુલ રકમ (₹)</label>
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 font-mono text-center">
                      ₹ {((parseFloat(sQuantity) || 0) * (parseFloat(sRate) || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>

              {/* GST Calculation Summary Card for Sales */}
              {trustSettings?.isGstEnabled && (
                <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>કરપાત્ર રકમ (Subtotal):</span>
                    <span className="font-mono font-bold">₹ {((parseFloat(sQuantity) || 0) * (parseFloat(sRate) || 0)).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-purple-700 dark:text-purple-300">
                    <span>GST રકમ ({sGstRate}%):</span>
                    <span className="font-mono font-bold">
                      ₹ {(Math.round(((parseFloat(sQuantity) || 0) * (parseFloat(sRate) || 0) * sGstRate) / 100 * 100) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-emerald-600 dark:text-emerald-400 border-t border-purple-200 dark:border-purple-800 pt-1.5 text-sm">
                    <span>કુલ વેચાણ બિલ (Net Total):</span>
                    <span className="font-mono">
                      ₹ {(Math.round(((parseFloat(sQuantity) || 0) * (parseFloat(sRate) || 0) * (1 + sGstRate / 100)) * 100) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">આવક પદ્ધતિ (Mode) *</label>
                  <select
                    value={sPaymentMode}
                    onChange={(e) => setSPaymentMode(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  >
                    <option value="રોકડ (Cash)">રોકડ (Cash)</option>
                    <option value="બેંક ટ્રાન્સફર (Bank)">બેંક ટ્રાન્સફર (Bank)</option>
                    <option value="ચેક (Cheque)">ચેક (Cheque)</option>
                    <option value="ઉધાર (Credit)">ઉધાર (Credit)</option>
                  </select>
                </div>

                {sPaymentMode === 'ઉધાર (Credit)' ? (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="font-bold text-slate-600 dark:text-slate-400 block">વસૂલાત તારીખ (Due Date)</label>
                    <input
                      type="date"
                      value={sDueDate}
                      onChange={(e) => setSDueDate(e.target.value)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                    />
                  </div>
                ) : sPaymentMode !== 'રોકડ (Cash)' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="font-bold text-slate-600 dark:text-slate-400 block">બેંક ખાતું પસંદ કરો *</label>
                    <select
                      value={sBankId}
                      onChange={(e) => setSBankId(e.target.value)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                    >
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.bankNameGuj} ({b.accountNumber.slice(-4)}) - સિલક: ₹ {b.balance.toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {sPaymentMode === 'ઉધાર (Credit)' && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="space-y-1">
                    <label className="font-bold text-amber-800 dark:text-amber-300 block">એડવાન્સ / રોકડા જમા મેળવેલ (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={sPaidAmount}
                      onChange={(e) => setSPaidAmount(e.target.value)}
                      placeholder="0"
                      className="w-full p-2 border border-amber-200 dark:border-amber-800 rounded-xl bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-150 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-amber-800 dark:text-amber-300 block">બાકી ઉધાર લેણું (Receivable)</label>
                    <div className="p-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl font-black text-amber-600 font-mono text-center">
                      ₹ {Math.max(0, (Math.round(((parseFloat(sQuantity) || 0) * (parseFloat(sRate) || 0) * (1 + (trustSettings?.isGstEnabled ? (sGstRate / 100) : 0))) * 100) / 100) - (parseFloat(sPaidAmount) || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">ખાસ નોંધ / ટિપ્પણીઓ</label>
                <input
                  type="text"
                  value={sRemarksGuj}
                  onChange={(e) => setSRemarksGuj(e.target.value)}
                  placeholder="કોઈ વધારાની વિગતો..."
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-700 dark:text-emerald-400">
                💡 વેચાણ સેવ કરવાથી <strong>હાલનો સ્ટોક ઘટશે</strong> અને ટ્રસ્ટના ખાતાવહીમાં <strong>આવક પાવતી પણ સ્વયંભૂ જનરેટ થશે</strong>.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSalesForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  disabled={inventoryItems.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  વેચાણ બિલ સેવ કરો
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Bill View / Invoice Printable Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 no-print">
              <span className="font-black text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-500" /> પ્રિન્ટ પ્રિવ્યૂ (Print Invoice)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrint('invoice-print-container')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ કરો
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="p-8 bg-white text-slate-900 font-sans" id="invoice-print-container">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4 mb-4 gap-4">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                </div>
                <div className="flex-1 text-center">
                  <h1 className="text-xl font-black text-indigo-800 uppercase tracking-wide">{trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}</h1>
                  <p className="text-[10px] text-slate-500 mt-1">નોંધણી નંબર: {trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'E/4925/AHMEDABAD'}</p>
                  {trustSettings?.isGstEnabled && trustSettings?.gstNumber && (
                    <p className="text-[10px] font-mono font-bold text-purple-700 mt-0.5">GSTIN: {trustSettings.gstNumber}</p>
                  )}
                  <p className="text-[11px] text-slate-600">{trustSettings?.addressGuj || 'ટ્રસ્ટ ભવન કાર્યાલય, ગુજરાત'}</p>
                </div>
                <div className="w-16 h-16 flex-shrink-0 opacity-0"></div>
              </div>
              <div className="text-center mb-4">
                <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full font-bold text-xs">
                  {selectedInvoice.type === 'purchase'
                    ? (selectedInvoice.data.isGstBill ? 'GST ખરીદી ઇન્વોઇસ (GST Purchase Bill)' : 'ખરીદી ઇન્વોઇસ (Purchase Bill)')
                    : (selectedInvoice.data.isGstBill ? 'GST કર વેચાણ બિલ (GST Sales Invoice)' : 'વેચાણ બિલ (Sales Invoice)')}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">બિલ / પાસબુક નં:</span>
                  <strong className="text-slate-800 font-mono text-sm">{selectedInvoice.data.billNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">તારીખ (Date):</span>
                  <strong className="text-slate-800">{selectedInvoice.data.date}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">
                    {selectedInvoice.type === 'purchase' ? 'વિક્રેતા / સપ્લાયર:' : 'ગ્રાહક / મેળવનાર:'}
                  </span>
                  <strong className="text-indigo-800 text-xs">
                    {selectedInvoice.type === 'purchase' ? selectedInvoice.data.supplierNameGuj : selectedInvoice.data.customerNameGuj}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">ચૂકવણી મોડ (Mode):</span>
                  <strong className="text-slate-800">{selectedInvoice.data.paymentMode}</strong>
                </div>
              </div>

              {/* Table of items */}
              <table className="w-full text-left border-collapse text-xs mb-6">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 font-bold">
                    <th className="p-2">વિગત (Particulars)</th>
                    <th className="p-2 text-right">જથ્થો (Qty)</th>
                    <th className="p-2 text-right">દર (Rate)</th>
                    {selectedInvoice.data.isGstBill && (
                      <>
                        <th className="p-2 text-right">કરપાત્ર રકમ</th>
                        <th className="p-2 text-right">GST %</th>
                      </>
                    )}
                    <th className="p-2 text-right">કુલ રકમ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3">
                      <span className="font-bold text-slate-800">{selectedInvoice.data.itemNameGuj}</span>
                    </td>
                    <td className="p-3 text-right font-mono">{selectedInvoice.data.quantity}</td>
                    <td className="p-3 text-right font-mono">₹ {selectedInvoice.data.rate.toLocaleString('en-IN')}</td>
                    {selectedInvoice.data.isGstBill && (
                      <>
                        <td className="p-3 text-right font-mono text-slate-700">
                          ₹ {(selectedInvoice.data.subtotal ?? (selectedInvoice.data.quantity * selectedInvoice.data.rate)).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-purple-700">
                          {selectedInvoice.data.gstRate ?? 0}%
                        </td>
                      </>
                    )}
                    <td className="p-3 text-right font-bold font-mono text-slate-800">₹ {selectedInvoice.data.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              {/* Total Summary */}
              <div className="flex justify-end mb-6 text-xs">
                <div className="w-1/2 space-y-1.5 border-t-2 pt-3">
                  <div className="flex justify-between text-slate-500">
                    <span>કરપાત્ર રકમ (Subtotal):</span>
                    <span className="font-mono">
                      ₹ {(selectedInvoice.data.subtotal ?? (selectedInvoice.data.quantity * selectedInvoice.data.rate)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {selectedInvoice.data.isGstBill && (selectedInvoice.data.gstAmount ?? 0) > 0 ? (
                    <>
                      <div className="flex justify-between text-purple-700">
                        <span>CGST ({(selectedInvoice.data.gstRate ?? 0) / 2}%):</span>
                        <span className="font-mono">₹ {(((selectedInvoice.data.gstAmount ?? 0) / 2)).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-purple-700">
                        <span>SGST ({(selectedInvoice.data.gstRate ?? 0) / 2}%):</span>
                        <span className="font-mono">₹ {(((selectedInvoice.data.gstAmount ?? 0) / 2)).toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-500">
                      <span>ટેક્સ / GST:</span>
                      <span className="font-mono">લાગુ નથી (0% / કરમુક્ત)</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-indigo-900 border-t pt-2 text-sm">
                    <span>કુલ ચોખ્ખી રકમ (Net Amount):</span>
                    <span className="font-mono text-base">₹ {selectedInvoice.data.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {selectedInvoice.data.remarksGuj && (
                <div className="p-3 bg-slate-50 rounded-lg text-[10px] text-slate-500 italic mb-8">
                  નોંધ: {selectedInvoice.data.remarksGuj}
                </div>
              )}

              {/* Signatures */}
              <div className="flex justify-between text-xs pt-12 border-t border-dashed">
                <div className="text-center w-1/3">
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1 font-medium text-slate-500">મેળવનારની સહી</div>
                </div>
                <div className="text-center w-1/3">
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1 font-medium text-slate-500">નામું રાખનાર સહી</div>
                </div>
                <div className="text-center w-1/3">
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-indigo-900">ટ્રસ્ટી શ્રી / સક્ષમ સત્તા</div>
                </div>
              </div>

              {/* Print Footer */}
              <div className="text-center text-[9px] text-slate-400 mt-12 border-t pt-4">
                માનવ કલ્યાણ અને સદ્ભાવના પ્રસાર માટે અતિ કલ્યાણકારી પ્રવૃત્તિઓ. આપના સહકાર બદલ આભાર!
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Udhar Settlement Modal */}
      {settlingBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <span className="font-black text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <CreditCard className="w-4.5 h-4.5 text-amber-500" />
                {settlingBill.type === 'sales' ? 'ઉધાર વસૂલાત નોંધણી (Sales Udhar Recovery)' : 'ઉધાર ચૂકવણી નોંધણી (Purchase Udhar Payment)'}
              </span>
              <button
                type="button"
                onClick={() => setSettlingBill(null)}
                className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSettlementSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>બિલ ક્રમાંક:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{settlingBill.bill.billNumber}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>પક્ષકાર:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {settlingBill.type === 'sales' ? (settlingBill.bill as SalesBill).customerNameGuj : (settlingBill.bill as PurchaseBill).supplierNameGuj}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>કુલ રકમ:</span>
                  <span className="font-mono font-bold">₹ {settlingBill.bill.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>અગાઉ ચૂકવેલ/જમા:</span>
                  <span className="font-mono font-bold text-emerald-600">₹ {(settlingBill.bill.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-black text-rose-600 border-t pt-1.5 text-sm">
                  <span>હાલની બાકી ઉધાર:</span>
                  <span className="font-mono">
                    ₹ {Math.max(0, settlingBill.bill.totalAmount - (settlingBill.bill.paidAmount || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">
                  {settlingBill.type === 'sales' ? 'નવી વસૂલાત જમા રકમ (₹) *' : 'નવી ચૂકવણી રકમ (₹) *'}
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.01"
                  max={Math.max(0, settlingBill.bill.totalAmount - (settlingBill.bill.paidAmount || 0))}
                  required
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  placeholder="રકમ લખો..."
                  className="w-full p-2.5 text-sm font-mono font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">ચૂકવણી મોડ *</label>
                  <select
                    value={settlementMode}
                    onChange={(e) => setSettlementMode(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  >
                    <option value="રોકડ (Cash)">રોકડ (Cash)</option>
                    <option value="બેંક ટ્રાન્સફર (Bank)">બેંક ટ્રાન્સફર (Bank)</option>
                    <option value="ચેક (Cheque)">ચેક (Cheque)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">ચૂકવણી તારીખ *</label>
                  <input
                    type="date"
                    required
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  />
                </div>
              </div>

              {settlementMode !== 'રોકડ (Cash)' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block">બેંક ખાતું *</label>
                  <select
                    value={settlementBankId}
                    onChange={(e) => setSettlementBankId(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                  >
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.bankNameGuj} - {b.accountNumber}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 block">નોંધ / રિમાર્કસ</label>
                <input
                  type="text"
                  value={settlementRemarks}
                  onChange={(e) => setSettlementRemarks(e.target.value)}
                  placeholder="દા.ત. ગુગલ પે દ્વારા સ્વીકારેલ"
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-150 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSettlingBill(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-xl font-bold cursor-pointer shadow-sm ${
                    settlingBill.type === 'sales' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {settlingBill.type === 'sales' ? 'વસૂલાત સાચવો' : 'ચૂકવણી સાચવો'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Udhar Settlement Payment Receipt Modal */}
      {selectedSettlementReceipt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6"
          >
            {/* Modal Toolbar */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                  {selectedSettlementReceipt.type === 'sales'
                    ? 'ઉધાર વસૂલાત પાવતી (Credit Sales Collection Receipt)'
                    : 'ઉધાર ચૂકવણી રસીદ (Credit Purchase Payment Receipt)'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadReportPDF('settlement-receipt-print-container', `Payment_Receipt_${selectedSettlementReceipt.receiptNumber}`)}
                  disabled={isGeneratingPDF}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF ડાઉનલોડ
                </button>
                <button
                  type="button"
                  onClick={() => handlePrint('settlement-receipt-print-container')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ કરો
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSettlementReceipt(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-lg text-slate-500 transition-all cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Container */}
            <div className="p-6 md:p-8 bg-white text-slate-900" id="settlement-receipt-print-container">
              {/* Trust Branding Header */}
              <div className="border-b-2 border-slate-800 pb-4 mb-4 text-center space-y-1">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                  </div>
                  <div className="text-center flex-1 px-4">
                    <h1 className="text-xl font-black text-slate-900 tracking-wide">
                      {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      નોંધણી નં: {trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'} | મો: {trustSettings?.phone || '9876543210'}
                      {trustSettings?.isGstEnabled && trustSettings?.gstNumber && ` | GSTIN: ${trustSettings.gstNumber}`}
                    </p>
                  </div>
                  <div className="w-16 h-16 opacity-0"></div>
                </div>
              </div>

              {/* Title Badge */}
              <div className="text-center my-3">
                <span className="px-4 py-1.5 bg-slate-100 text-slate-900 border border-slate-300 font-black text-xs uppercase tracking-widest rounded-full inline-block">
                  {selectedSettlementReceipt.type === 'sales'
                    ? 'ઉધાર નાણા વસૂલાત પાવતી (SETTLEMENT RECEIPT)'
                    : 'ઉધાર ચૂકવણી રસીદ વાઉચર (PAYMENT VOUCHER)'}
                </span>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-500 font-medium">પાવતી નંબર (Receipt No):</span>{' '}
                    <strong className="font-mono text-slate-900">{selectedSettlementReceipt.receiptNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">પાવતી તારીખ (Date):</span>{' '}
                    <strong className="text-slate-900">{selectedSettlementReceipt.date}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">
                      {selectedSettlementReceipt.type === 'sales' ? 'ગ્રાહકશ્રી (Customer Name):' : 'વેન્ડરશ્રી (Supplier Name):'}
                    </span>{' '}
                    <strong className="text-slate-900 text-sm">{selectedSettlementReceipt.partyName}</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                  <div>
                    <span className="text-slate-500 font-medium">સંદર્ભ બિલ નંબર (Ref Invoice):</span>{' '}
                    <strong className="font-mono text-slate-900">{selectedSettlementReceipt.billNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">વસ્તુ / સામાન (Item):</span>{' '}
                    <strong className="text-slate-900">{selectedSettlementReceipt.itemName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">ચૂકવણી મોડ (Mode):</span>{' '}
                    <strong className="text-slate-900">
                      {selectedSettlementReceipt.paymentMode} {selectedSettlementReceipt.bankName ? `(${selectedSettlementReceipt.bankName})` : ''}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Amount Breakup Table */}
              <div className="my-5 border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-700">
                      <th className="p-3">નાણાકીય વિગત (Financial Description)</th>
                      <th className="p-3 text-right">રકમ (Amount ₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 text-slate-700">મૂળ ઇન્વોઇસ કુલ રકમ (Total Original Invoice Amount)</td>
                      <td className="p-3 text-right font-mono font-bold">₹ {selectedSettlementReceipt.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-700">અગાઉ જમા થયેલ / ચૂકવેલ રકમ (Previously Paid)</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-600">₹ {selectedSettlementReceipt.previouslyPaid.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-emerald-50/70 font-black">
                      <td className="p-3 text-emerald-950 text-sm">
                        {selectedSettlementReceipt.type === 'sales' ? '✓ આજે સ્વીકારેલ / વસૂલ કરેલ રકમ (Amount Received Today)' : '✓ આજે ચુકવણી કરેલ રકમ (Amount Paid Today)'}
                      </td>
                      <td className="p-3 text-right font-mono text-base text-emerald-700">₹ {selectedSettlementReceipt.paidToday.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="font-bold">
                      <td className="p-3 text-rose-800">બાકી રહેતી ઉધાર શિલક (Remaining Balance Due)</td>
                      <td className="p-3 text-right font-mono text-rose-700">
                        {selectedSettlementReceipt.remainingBalance > 0
                          ? `₹ ${selectedSettlementReceipt.remainingBalance.toLocaleString('en-IN')}`
                          : '₹ 0 (પૂર્ણ ભરપાઈ / Full Paid)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks */}
              {selectedSettlementReceipt.remarks && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-6">
                  <span className="text-slate-500 font-bold">વિશેષ નોંધ / રિમાર્ક્સ:</span>{' '}
                  <span className="text-slate-800">{selectedSettlementReceipt.remarks}</span>
                </div>
              )}

              {/* Authorization & Signatures */}
              <div className="pt-10 mt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
                  <p className="font-bold text-slate-700">નાણાં આપનાર / ગ્રાહક સહી</p>
                  <p className="text-[10px] text-slate-400">Payer Signature</p>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
                  <p className="font-bold text-slate-700">નાણાં સ્વીકારનાર / ઓપરેટર સહી</p>
                  <p className="text-[10px] text-slate-400">Cashier Signature</p>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
                  <p className="font-bold text-slate-700">પ્રમુખશ્રી / ખજાનચી સહી</p>
                  <p className="text-[10px] text-slate-400">Trustee Signature</p>
                </div>
              </div>

              <div className="mt-8 text-center text-[10px] text-slate-400 border-t pt-2">
                આ પાવતી કોમ્પ્યુટર દ્વારા આપોઆપ જનરેટ કરવામાં આવેલ છે. | શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ અકાઉન્ટિંગ
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
