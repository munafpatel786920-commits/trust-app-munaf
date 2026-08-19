/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Save,
  X,
  RefreshCw,
  Eye,
  ArrowRight,
  ArrowLeft,
  Filter,
  Check
} from 'lucide-react';
import { BudgetItem, TrustBudgetPlan, IncomeReceipt, ExpenseVoucher, TrustSettings } from '../types';
import { printContainer, downloadContainerAsPDF } from '../utils/pdfPrint';

interface BudgetModuleProps {
  budgetPlan: TrustBudgetPlan;
  receipts: IncomeReceipt[];
  vouchers: ExpenseVoucher[];
  onSaveBudgetPlan: (plan: TrustBudgetPlan) => void;
  currentUser: { role: string };
  darkMode: boolean;
  trustSettings?: TrustSettings;
}

// Standard baseline categories for clean system defaults
const DEFAULT_EXPENSE_HEADS: { name: string; amount: number; notes: string }[] = [
  { name: 'પગાર (Salary)', amount: 300000, notes: 'કર્મચારી & સહાયક સ્ટાફ પગાર' },
  { name: 'વીજળી બિલ (Electricity)', amount: 60000, notes: 'વાર્ષિક વીજળી બિલ ખર્ચ' },
  { name: 'પાણી બિલ (Water)', amount: 15000, notes: 'પાણી વેરો અને વપરાશ ખર્ચ' },
  { name: 'ઓફિસ ખર્ચ (Office)', amount: 50000, notes: 'સ્ટેશનરી, પ્રિન્ટિંગ અને વહીવટી ખર્ચ' },
  { name: 'મેન્ટેનન્સ (Maintenance)', amount: 100000, notes: 'મકાન અને સ્થાવર મિલકત સમારકામ' },
  { name: 'મુસાફરી ખર્ચ (Travel)', amount: 30000, notes: 'ટ્રસ્ટ કામકાજ અર્થે મુસાફરી ભથ્થું' },
  { name: 'શિક્ષણ & સ્કોલરશીપ સહાય (Education)', amount: 250000, notes: 'વિદ્યાર્થી શિષ્યવૃત્તિ & પુસ્તક સહાય' },
  { name: 'મેડિકલ & આરોગ્ય સહાય (Medical Aid)', amount: 200000, notes: 'દર્દી સહાય & હોસ્પિટલ દવા ખર્ચ' },
  { name: 'અન્નક્ષેત્ર / રાશન કીટ વિતરણ (Ration Aid)', amount: 150000, notes: 'જરૂરિયાતમંદ પરિવારોને અનાજ કીટ સહાય' },
  { name: 'ધાર્મિક & ઉત્સવ ઉજવણી (Religious/Festival)', amount: 75000, notes: 'ધાર્મિક તહેવારો અને સામાજિક પ્રસંગો' },
  { name: 'બેંક લોન હપ્તા ભરપાઈ (Bank Loan EMI)', amount: 120000, notes: 'બેંક ધિરાણ હપ્તા ભરપાઈ' },
  { name: 'બેંક ચાર્જ (Bank Charges)', amount: 5000, notes: 'SMS & બેંક સેવા શુલ્ક' },
  { name: 'અન્ય ખર્ચ (Other)', amount: 40000, notes: 'આકસ્મિક અને પરચૂરણ ખર્ચ' }
];

const DEFAULT_INCOME_HEADS: { name: string; amount: number; notes: string }[] = [
  { name: 'દાન (Donation)', amount: 500000, notes: 'સામાન્ય જનરલ દાન આવક' },
  { name: 'સામાન્ય દાન (General Donation)', amount: 300000, notes: 'ટ્રસ્ટ સામાન્ય ફંડ દાન' },
  { name: 'ઝકાત (Zakat)', amount: 400000, notes: 'ઝકાત ફંડ આવક (સહાય અર્થે)' },
  { name: 'ઇમદાદ / સહાય (Aid)', amount: 150000, notes: 'ઇમદાદ અને વિશેષ સહાય ફંડ' },
  { name: 'બિલ્ડીંગ ફંડ (Building Fund)', amount: 350000, notes: 'મકાન નિર્માણ અને નવીનીકરણ ફંડ' },
  { name: 'શિક્ષણ સહાય (Education Aid)', amount: 200000, notes: 'શિક્ષણ પ્રવૃત્તિ દાન આવક' },
  { name: 'તબીબી સહાય (Medical Aid)', amount: 150000, notes: 'આરોગ્ય સહાય ફંડ આવક' },
  { name: 'રાશન કીટ / અનાજ સહાય (Ration Aid)', amount: 100000, notes: 'અનાજ વિતરણ ફંડ દાન' },
  { name: 'સભાસદ પ્રવેશ ફી (Membership Fee)', amount: 50000, notes: 'નવા સભાસદોની પ્રવેશ ફી' },
  { name: 'સભાસદ શેર મૂડી (Member Share Capital)', amount: 100000, notes: 'સભાસદ શેર ખરીદી મૂડી' },
  { name: 'બેંક એફ.ડી. વ્યાજ આવક (FD Interest)', amount: 80000, notes: 'મુદતી થાપણો પરનું વાર્ષિક વ્યાજ' },
  { name: 'મિલકત ભાડાની આવક (Rent Income)', amount: 120000, notes: 'ટ્રસ્ટ મિલકત ભાડાની આવક' },
  { name: 'અન્ય આવક (Other Income)', amount: 50000, notes: 'પરચૂરણ અને આકસ્મિક આવક' }
];

// Helper: Smart category matcher for vouchers
function matchesExpenseCategory(budgetCategory: string, voucherCategory: string): boolean {
  if (!budgetCategory || !voucherCategory) return false;
  const b = budgetCategory.toLowerCase().trim();
  const v = voucherCategory.toLowerCase().trim();

  // 1. Direct exact or containment match
  if (b === v || b.includes(v) || v.includes(b)) return true;

  // 2. Semantic keyword matching
  if ((b.includes('પગાર') || b.includes('salary') || b.includes('મહેનતાણું')) &&
      (v.includes('પગાર') || v.includes('salary') || v.includes('મહેનતાણું'))) return true;

  if ((b.includes('વીજળી') || b.includes('electricity') || b.includes('લાઇટ') || b.includes('લાઈટ')) &&
      (v.includes('વીજળી') || v.includes('electricity') || v.includes('લાઇટ') || v.includes('લાઈટ'))) return true;

  if ((b.includes('પાણી') || b.includes('water')) &&
      (v.includes('પાણી') || v.includes('water'))) return true;

  if ((b.includes('ઓફિસ') || b.includes('office') || b.includes('સ્ટેશનરી') || b.includes('પ્રિન્ટિંગ')) &&
      (v.includes('ઓફિસ') || v.includes('office') || v.includes('સ્ટેશનરી') || v.includes('પ્રિન્ટિંગ'))) return true;

  if ((b.includes('મેન્ટેનન્સ') || b.includes('maintenance') || b.includes('સમારકામ') || b.includes('રિપેરીંગ') || b.includes('મકાન')) &&
      (v.includes('મેન્ટેનન્સ') || v.includes('maintenance') || v.includes('સમારકામ') || v.includes('રિપેરીંગ') || v.includes('મકાન'))) return true;

  if ((b.includes('મુસાફરી') || b.includes('travel') || b.includes('વાહન')) &&
      (v.includes('મુસાફરી') || v.includes('travel') || v.includes('વાહન'))) return true;

  if ((b.includes('લોન') || b.includes('loan') || b.includes('emi') || b.includes('હપ્તા')) &&
      (v.includes('લોન') || v.includes('loan') || v.includes('emi') || v.includes('હપ્તા'))) return true;

  if ((b.includes('બેંક ચાર્જ') || b.includes('bank charge')) &&
      (v.includes('બેંક ચાર્જ') || v.includes('bank charge'))) return true;

  if ((b.includes('શિક્ષણ') || b.includes('સ્કોલરશીપ') || b.includes('scholarship') || b.includes('education')) &&
      (v.includes('શિક્ષણ') || v.includes('સ્કોલરશીપ') || v.includes('scholarship') || v.includes('education'))) return true;

  if ((b.includes('મેડિકલ') || b.includes('આરોગ્ય') || b.includes('medical') || b.includes('દવા')) &&
      (v.includes('મેડિકલ') || v.includes('આરોગ્ય') || v.includes('medical') || v.includes('દવા'))) return true;

  if ((b.includes('અન્નક્ષેત્ર') || b.includes('રાશન') || b.includes('કીટ') || b.includes('અનાજ') || b.includes('ration')) &&
      (v.includes('અન્નક્ષેત્ર') || v.includes('રાશન') || v.includes('કીટ') || v.includes('અનાજ') || v.includes('ration'))) return true;

  if ((b.includes('ધાર્મિક') || b.includes('ઉત્સવ') || b.includes('religious') || b.includes('તહેવાર')) &&
      (v.includes('ધાર્મિક') || v.includes('ઉત્સવ') || v.includes('religious') || v.includes('તહેવાર'))) return true;

  if ((b.includes('ઓડિટ') || b.includes('કાનૂની') || b.includes('audit') || b.includes('legal')) &&
      (v.includes('ઓડિટ') || v.includes('કાનૂની') || v.includes('audit') || v.includes('legal'))) return true;

  if ((b.includes('અન્ય') || b.includes('પરચૂરણ') || b.includes('other')) &&
      (v.includes('અન્ય') || v.includes('પરચૂરણ') || v.includes('other'))) return true;

  return false;
}

// Helper: Smart category matcher for receipts
function matchesIncomeCategory(budgetCategory: string, receiptCategory: string): boolean {
  if (!budgetCategory || !receiptCategory) return false;
  const b = budgetCategory.toLowerCase().trim();
  const r = receiptCategory.toLowerCase().trim();

  // 1. Direct exact or containment match
  if (b === r || b.includes(r) || r.includes(b)) return true;

  // 2. Semantic keyword matching
  if ((b.includes('સામાન્ય દાન') || b.includes('general donation') || b === 'દાન (donation)' || b.includes('દાન (donation)')) &&
      (r.includes('સામાન્ય દાન') || r.includes('general donation') || r === 'દાન (donation)' || r.includes('દાન (donation)'))) return true;

  if ((b.includes('ઝકાત') || b.includes('zakat')) &&
      (r.includes('ઝકાત') || r.includes('zakat'))) return true;

  if ((b.includes('ઇમદાદ') || b.includes('સહાય') || b.includes('aid')) &&
      (r.includes('ઇમદાદ') || r.includes('સહાય') || r.includes('aid'))) return true;

  if ((b.includes('ફિત્રા') || b.includes('fitra')) &&
      (r.includes('ફિત્રા') || r.includes('fitra'))) return true;

  if ((b.includes('બિલ્ડીંગ') || b.includes('building')) &&
      (r.includes('બિલ્ડીંગ') || r.includes('building'))) return true;

  if ((b.includes('શિક્ષણ') || b.includes('education')) &&
      (r.includes('શિક્ષણ') || r.includes('education'))) return true;

  if ((b.includes('તબીબી') || b.includes('મેડિકલ') || b.includes('medical')) &&
      (r.includes('તબીબી') || r.includes('મેડિકલ') || r.includes('medical'))) return true;

  if ((b.includes('રાશન') || b.includes('અનાજ') || b.includes('ration')) &&
      (r.includes('રાશન') || r.includes('અનાજ') || r.includes('ration'))) return true;

  if ((b.includes('લવાજમ') || b.includes('પ્રવેશ ફી') || b.includes('membership fee') || b.includes('ફી')) &&
      (r.includes('લવાજમ') || r.includes('પ્રવેશ ફી') || r.includes('membership fee') || r.includes('ફી'))) return true;

  if ((b.includes('શેર') || b.includes('share capital') || b.includes('શેરહોલ્ડર')) &&
      (r.includes('શેર') || r.includes('share'))) return true;

  if ((b.includes('એફ.ડી.') || b.includes('fd') || b.includes('વ્યાજ') || b.includes('interest')) &&
      (r.includes('એફ.ડી.') || r.includes('fd') || r.includes('વ્યાજ') || r.includes('interest'))) return true;

  if ((b.includes('ભાડું') || b.includes('rent')) &&
      (r.includes('ભાડું') || r.includes('rent'))) return true;

  if ((b.includes('લિલામી') || b.includes('ભંગાર') || b.includes('auction') || b.includes('scrap')) &&
      (r.includes('લિલામી') || r.includes('ભંગાર') || r.includes('auction') || r.includes('scrap'))) return true;

  if ((b.includes('પરચૂરણ') || b.includes('અન્ય') || b.includes('other')) &&
      (r.includes('પરચૂરણ') || r.includes('અન્ય') || r.includes('other'))) return true;

  return false;
}

export default function BudgetModule({
  budgetPlan,
  receipts = [],
  vouchers = [],
  onSaveBudgetPlan,
  currentUser,
  darkMode,
  trustSettings
}: BudgetModuleProps) {
  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'expenses' | 'income' | 'overview'>('expenses');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'utilized' | 'overspent' | 'remaining'>('all');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'આવક (Income)' | 'ખર્ચ (Expense)'>('ખર્ચ (Expense)');
  const [newCatAmount, setNewCatAmount] = useState('');
  const [newCatNotes, setNewCatNotes] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Drilldown Modal
  const [drilldownItem, setDrilldownItem] = useState<{
    item: BudgetItem;
    records: Array<{
      id: string;
      number: string;
      date: string;
      partyName: string;
      amount: number;
      category: string;
      remarks?: string;
    }>;
  } | null>(null);

  // Items initialization
  const [items, setItems] = useState<BudgetItem[]>(() => {
    if (budgetPlan?.items && budgetPlan.items.length > 0) {
      return budgetPlan.items;
    }
    // Initialize default items
    const defaultList: BudgetItem[] = [
      ...DEFAULT_INCOME_HEADS.map((head, i) => ({
        id: `inc-${i}-${Date.now()}`,
        categoryGuj: head.name,
        type: 'આવક (Income)' as const,
        budgetedAmount: head.amount,
        notesGuj: head.notes
      })),
      ...DEFAULT_EXPENSE_HEADS.map((head, i) => ({
        id: `exp-${i}-${Date.now()}`,
        categoryGuj: head.name,
        type: 'ખર્ચ (Expense)' as const,
        budgetedAmount: head.amount,
        notesGuj: head.notes
      }))
    ];
    return defaultList;
  });

  // Handle ESC key to exit modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPrintView) setShowPrintView(false);
        if (drilldownItem) setDrilldownItem(null);
        if (showAddModal) setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPrintView, drilldownItem, showAddModal]);

  // Calculate actual expenses for any category
  const getExpenseActuals = (categoryGuj: string) => {
    const matchedVouchers = vouchers.filter(v => !v.isDeleted && matchesExpenseCategory(categoryGuj, v.category));
    const total = matchedVouchers.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
    return { total, vouchers: matchedVouchers };
  };

  // Calculate actual incomes for any category
  const getIncomeActuals = (categoryGuj: string) => {
    const matchedReceipts = receipts.filter(r => !r.isDeleted && matchesIncomeCategory(categoryGuj, r.category));
    const total = matchedReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return { total, receipts: matchedReceipts };
  };

  // Synchronize all active categories from vouchers and receipts
  const handleSyncCategoriesFromTransactions = () => {
    const currentCatNames = new Set(items.map(it => it.categoryGuj.toLowerCase().trim()));
    const newItems: BudgetItem[] = [...items];
    let addedCount = 0;

    // Collect all active expense categories from vouchers
    const activeExpenseCategories = Array.from(new Set(vouchers.filter(v => !v.isDeleted && v.category).map(v => v.category.trim())));
    activeExpenseCategories.forEach(cat => {
      // Check if this category is already represented
      const alreadyRepresented = newItems.some(it => it.type === 'ખર્ચ (Expense)' && matchesExpenseCategory(it.categoryGuj, cat));
      if (!alreadyRepresented) {
        const actualAmt = vouchers.filter(v => !v.isDeleted && v.category === cat).reduce((s, v) => s + v.amount, 0);
        newItems.push({
          id: `exp-sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          categoryGuj: cat,
          type: 'ખર્ચ (Expense)',
          budgetedAmount: Math.max(actualAmt * 1.25, 50000), // Smart budgeted allocation
          notesGuj: 'વાઉચર્સ પરથી આપમેળે સિંક થયેલ ખાતું'
        });
        addedCount++;
      }
    });

    // Collect all active income categories from receipts
    const activeIncomeCategories = Array.from(new Set(receipts.filter(r => !r.isDeleted && r.category).map(r => r.category.trim())));
    activeIncomeCategories.forEach(cat => {
      const alreadyRepresented = newItems.some(it => it.type === 'આવક (Income)' && matchesIncomeCategory(it.categoryGuj, cat));
      if (!alreadyRepresented) {
        const actualAmt = receipts.filter(r => !r.isDeleted && r.category === cat).reduce((s, r) => s + r.amount, 0);
        newItems.push({
          id: `inc-sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          categoryGuj: cat,
          type: 'આવક (Income)',
          budgetedAmount: Math.max(actualAmt * 1.25, 100000),
          notesGuj: 'આવક રસીદો પરથી આપમેળે સિંક થયેલ ખાતું'
        });
        addedCount++;
      }
    });

    setItems(newItems);
    alert(addedCount > 0
      ? `✓ ${addedCount} નવી સક્રિય કેટેગરીઝ સફળતાપૂર્વક બજેટમાં ઉમેરાઈ ગઈ છે!`
      : 'બધી જ ખર્ચ અને આવક કેટેગરીઝ પહેલેથી બજેટમાં સિંક થયેલ છે.'
    );
  };

  const handleUpdateAmount = (id: string, newAmt: number) => {
    const updated = items.map(it => it.id === id ? { ...it, budgetedAmount: Math.max(0, newAmt) } : it);
    setItems(updated);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(it => it.id !== id));
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const amt = parseFloat(newCatAmount) || 0;
    const newItem: BudgetItem = {
      id: `b-${Date.now()}`,
      categoryGuj: newCatName.trim(),
      type: newCatType,
      budgetedAmount: amt,
      notesGuj: newCatNotes.trim()
    };
    setItems([...items, newItem]);
    setShowAddModal(false);
    setNewCatName('');
    setNewCatAmount('');
    setNewCatNotes('');
  };

  const handleSaveBudget = () => {
    const totalBudgetedIncome = items.filter(i => i.type === 'આવક (Income)').reduce((s, i) => s + i.budgetedAmount, 0);
    const totalBudgetedExpense = items.filter(i => i.type === 'ખર્ચ (Expense)').reduce((s, i) => s + i.budgetedAmount, 0);

    const updatedPlan: TrustBudgetPlan = {
      id: budgetPlan?.id || `budget-${Date.now()}`,
      financialYear: trustSettings?.financialYear || '૨૦૨૬-૨૭',
      items,
      totalBudgetedIncome,
      totalBudgetedExpense,
      approvedDate: new Date().toISOString().split('T')[0],
      approvedByGuj: 'ટ્રસ્ટ કારોબારી સમિતિ'
    };

    onSaveBudgetPlan(updatedPlan);
    alert('✓ વાર્ષિક અંદાજપત્ર (Budget Plan) સફળતાપૂર્વક સાચવવામાં આવ્યું છે.');
  };

  const incomeItems = useMemo(() => items.filter(i => i.type === 'આવક (Income)'), [items]);
  const expenseItems = useMemo(() => items.filter(i => i.type === 'ખર્ચ (Expense)'), [items]);

  const totalBudgetedIncome = useMemo(() => incomeItems.reduce((s, i) => s + i.budgetedAmount, 0), [incomeItems]);
  const totalActualIncome = useMemo(() => receipts.filter(r => !r.isDeleted).reduce((s, r) => s + (Number(r.amount) || 0), 0), [receipts]);

  const totalBudgetedExpense = useMemo(() => expenseItems.reduce((s, i) => s + i.budgetedAmount, 0), [expenseItems]);
  const totalActualExpense = useMemo(() => vouchers.filter(v => !v.isDeleted).reduce((s, v) => s + (Number(v.amount) || 0), 0), [vouchers]);

  const handlePrint = () => {
    printContainer('budget-sheet-print');
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    await downloadContainerAsPDF('budget-sheet-print', `Budget_Sheet_${trustSettings?.financialYear || '2026-27'}`);
    setIsGeneratingPDF(false);
  };

  // Filtered Expense Items
  const filteredExpenseItems = useMemo(() => {
    return expenseItems.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || item.categoryGuj.toLowerCase().includes(q) || (item.notesGuj && item.notesGuj.toLowerCase().includes(q));
      if (!matchSearch) return false;

      const { total: actual } = getExpenseActuals(item.categoryGuj);
      if (statusFilter === 'utilized' && actual <= 0) return false;
      if (statusFilter === 'overspent' && actual <= item.budgetedAmount) return false;
      if (statusFilter === 'remaining' && actual >= item.budgetedAmount) return false;

      return true;
    });
  }, [expenseItems, searchQuery, statusFilter, vouchers]);

  // Filtered Income Items
  const filteredIncomeItems = useMemo(() => {
    return incomeItems.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || item.categoryGuj.toLowerCase().includes(q) || (item.notesGuj && item.notesGuj.toLowerCase().includes(q));
      if (!matchSearch) return false;

      const { total: actual } = getIncomeActuals(item.categoryGuj);
      if (statusFilter === 'utilized' && actual <= 0) return false;
      if (statusFilter === 'overspent' && actual < item.budgetedAmount) return false;
      if (statusFilter === 'remaining' && actual >= item.budgetedAmount) return false;

      return true;
    });
  }, [incomeItems, searchQuery, statusFilter, receipts]);

  const isReadOnly = currentUser.role === 'ReadOnly';

  // Open drilldown
  const handleOpenExpenseDrilldown = (item: BudgetItem) => {
    const { vouchers: matchedVouchers } = getExpenseActuals(item.categoryGuj);
    setDrilldownItem({
      item,
      records: matchedVouchers.map(v => ({
        id: v.id,
        number: v.voucherNumber,
        date: v.date,
        partyName: v.paidToGuj,
        amount: v.amount,
        category: v.category,
        remarks: v.remarksGuj
      }))
    });
  };

  const handleOpenIncomeDrilldown = (item: BudgetItem) => {
    const { receipts: matchedReceipts } = getIncomeActuals(item.categoryGuj);
    setDrilldownItem({
      item,
      records: matchedReceipts.map(r => ({
        id: r.id,
        number: r.receiptNumber,
        date: r.date,
        partyName: r.donorNameGuj,
        amount: r.amount,
        category: r.category,
        remarks: r.remarksGuj
      }))
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            વાર્ષિક અંદાજપત્ર & બજેટ સરખામણી (Budget vs Actual Planner)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            નાણાકીય વર્ષ {trustSettings?.financialYear || '૨૦૨૬-૨૭'} માટે આવક-ખર્ચના મંજૂર બજેટ લક્ષ્યાંકો & વાસ્તવિક ખર્ચનું લાઈવ નિયંત્રણ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSyncCategoriesFromTransactions}
            title="સિસ્ટમમાં નોંધાયેલ વાઉચર્સ અને રસીદો પરથી કેટેગરીઝ સિંક કરો"
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            કેટેગરીઝ ઓટો-સિંક
          </button>

          <button
            onClick={() => setShowPrintView(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            અંદાજપત્ર પ્રિન્ટ
          </button>

          {!isReadOnly && (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                નવું હેડિંગ
              </button>

              <button
                onClick={handleSaveBudget}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/20 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                બજેટ સાચવો
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">મંજૂર અંદાજિત આવક (Budgeted)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹ {totalBudgetedIncome.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1 flex items-center justify-between">
            <span>વાસ્તવિક પ્રાપ્ત: <strong>₹ {totalActualIncome.toLocaleString('en-IN')}</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {totalBudgetedIncome > 0 ? ((totalActualIncome / totalBudgetedIncome) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">મંજૂર અંદાજિત ખર્ચ (Budgeted)</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2">
            ₹ {totalBudgetedExpense.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1 flex items-center justify-between">
            <span>વાસ્તવિક ખર્ચ: <strong>₹ {totalActualExpense.toLocaleString('en-IN')}</strong></span>
            <span className={totalActualExpense > totalBudgetedExpense ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-300 font-bold'}>
              {totalBudgetedExpense > 0 ? ((totalActualExpense / totalBudgetedExpense) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ખર્ચ બજેટ ઉપયોગિતા (% Utilized)</span>
            <PieChart className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {totalBudgetedExpense > 0 ? ((totalActualExpense / totalBudgetedExpense) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
            બાકી ખર્ચ ક્ષમતા: <strong className="text-indigo-600 dark:text-indigo-400">₹ {Math.max(0, totalBudgetedExpense - totalActualExpense).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">અંદાજિત પુરાંત / (ખાધ)</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-xl font-black mt-2 ${totalBudgetedIncome >= totalBudgetedExpense ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            ₹ {(totalBudgetedIncome - totalBudgetedExpense).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
            વાસ્તવિક પુરાંત: <strong className={totalActualIncome >= totalActualExpense ? 'text-emerald-600' : 'text-rose-600'}>₹ {(totalActualIncome - totalActualExpense).toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Sub Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              ખર્ચ બજેટ vs વાસ્તવિક ({expenseItems.length})
            </button>

            <button
              onClick={() => setActiveTab('income')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              આવક બજેટ vs વાસ્તવિક ({incomeItems.length})
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              સરવૈયું (Overview)
            </button>
          </div>

          {/* Search and Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <input
                type="text"
                placeholder="હેડિંગ અથવા નોંધ શોધો..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 px-3 py-1.5 pl-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">બધી સ્થિતિ (All Status)</option>
              <option value="utilized">વાસ્તવિક ખર્ચ/આવક થયેલ (&gt; 0)</option>
              <option value="overspent">બજેટથી વધુ ખર્ચ (Over)</option>
              <option value="remaining">બજેટ બાકી હોય (Remaining)</option>
            </select>
          </div>
        </div>
      </div>

      {/* EXPENSE BUDGET TAB */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              ખર્ચ વિષયક અંદાજપત્ર & વાસ્તવિક ખર્ચ સરખામણી (Expense Budget vs Actual Vouchers)
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-slate-500">
                કુલ મંજૂર: <strong className="text-rose-600 font-black">₹ {totalBudgetedExpense.toLocaleString('en-IN')}</strong>
              </span>
              <span className="font-bold text-slate-500">
                કુલ વાસ્તવિક ખર્ચ: <strong className="text-slate-900 dark:text-white font-black">₹ {totalActualExpense.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">ખર્ચનું હેડિંગ / કેટેગરી</th>
                  <th className="py-3 px-4 text-right">મંજૂર બજેટ રકમ (₹)</th>
                  <th className="py-3 px-4 text-right">વાસ્તવિક ખર્ચ (Actual ₹)</th>
                  <th className="py-3 px-4 text-center">બજેટ વપરાશ (% Utilized)</th>
                  <th className="py-3 px-4 text-right">બાકી રકમ (Variance)</th>
                  <th className="py-3 px-4 text-center">વિગત / વાઉચર્સ</th>
                  {!isReadOnly && <th className="py-3 px-4 text-right">એક્શન</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExpenseItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      કોઈ ખર્ચ હેડિંગ મળ્યા નથી. "નવું હેડિંગ" અથવા "કેટેગરીઝ ઓટો-સિંક" બટન પર ક્લિક કરો.
                    </td>
                  </tr>
                ) : (
                  filteredExpenseItems.map((item) => {
                    const { total: actual, vouchers: matchedVouchers } = getExpenseActuals(item.categoryGuj);
                    const pct = item.budgetedAmount > 0 ? (actual / item.budgetedAmount) * 100 : 0;
                    const isOver = actual > item.budgetedAmount;
                    const variance = item.budgetedAmount - actual;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span>{item.categoryGuj}</span>
                            {actual > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800">
                                {matchedVouchers.length} વાઉચર
                              </span>
                            )}
                          </div>
                          {item.notesGuj && <div className="text-[10px] text-slate-400 font-normal mt-0.5">{item.notesGuj}</div>}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {!isReadOnly ? (
                            <input
                              type="number"
                              min="0"
                              value={item.budgetedAmount}
                              onChange={(e) => handleUpdateAmount(item.id, parseFloat(e.target.value) || 0)}
                              className="w-28 text-right px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                          ) : (
                            <span className="font-black text-rose-600">₹ {item.budgetedAmount.toLocaleString('en-IN')}</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                          <button
                            onClick={() => handleOpenExpenseDrilldown(item)}
                            className="hover:underline text-slate-900 dark:text-white cursor-pointer font-black"
                            title="ક્લિક કરીને જોડાયેલ તમામ વાઉચર્સ જુઓ"
                          >
                            ₹ {actual.toLocaleString('en-IN')}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="w-full max-w-[140px] mx-auto">
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span className={isOver ? 'text-rose-600 font-black' : 'text-slate-600 dark:text-slate-400'}>
                                {pct.toFixed(1)}%
                              </span>
                              {isOver ? (
                                <span className="text-rose-600 font-black">વધારે ખર્ચ!</span>
                              ) : pct >= 80 ? (
                                <span className="text-amber-600 font-bold">ચેતવણી</span>
                              ) : (
                                <span className="text-emerald-600 font-bold">નિયંત્રિત</span>
                              )}
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-bold">
                          <span className={isOver ? 'text-rose-600 font-black' : 'text-emerald-600 dark:text-emerald-400'}>
                            {variance < 0 ? `- ₹ ${Math.abs(variance).toLocaleString('en-IN')}` : `₹ ${variance.toLocaleString('en-IN')}`}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenExpenseDrilldown(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="વાઉચર્સ જુઓ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>

                        {!isReadOnly && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              title="હેડિંગ રદ કરો"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredExpenseItems.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-black border-t-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <td className="py-3 px-4 text-slate-900 dark:text-white">કુલ ખર્ચ સરવાળો:</td>
                    <td className="py-3 px-4 text-right text-rose-600">₹ {totalBudgetedExpense.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-slate-900 dark:text-white">₹ {totalActualExpense.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">
                      {totalBudgetedExpense > 0 ? ((totalActualExpense / totalBudgetedExpense) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600">
                      ₹ {Math.max(0, totalBudgetedExpense - totalActualExpense).toLocaleString('en-IN')}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* INCOME BUDGET TAB */}
      {activeTab === 'income' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              આવક વિષયક અંદાજપત્ર & વાસ્તવિક આવક સરખામણી (Income Budget vs Actual Receipts)
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-slate-500">
                કુલ મંજૂર અંદાજ: <strong className="text-emerald-600 font-black">₹ {totalBudgetedIncome.toLocaleString('en-IN')}</strong>
              </span>
              <span className="font-bold text-slate-500">
                કુલ વાસ્તવિક આવક: <strong className="text-slate-900 dark:text-white font-black">₹ {totalActualIncome.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">આવકનું હેડિંગ / કેટેગરી</th>
                  <th className="py-3 px-4 text-right">મંજૂર બજેટ લક્ષ્યાંક (₹)</th>
                  <th className="py-3 px-4 text-right">વાસ્તવિક પ્રાપ્ત આવક (₹)</th>
                  <th className="py-3 px-4 text-center">લક્ષ્યાંક પ્રાપ્તિ (% Progress)</th>
                  <th className="py-3 px-4 text-right">બાકી લક્ષ્યાંક (Gap)</th>
                  <th className="py-3 px-4 text-center">વિગત / રસીદો</th>
                  {!isReadOnly && <th className="py-3 px-4 text-right">એક્શન</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredIncomeItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      કોઈ આવક હેડિંગ મળ્યા નથી. "નવું હેડિંગ" અથવા "કેટેગરીઝ ઓટો-સિંક" બટન પર ક્લિક કરો.
                    </td>
                  </tr>
                ) : (
                  filteredIncomeItems.map((item) => {
                    const { total: actual, receipts: matchedReceipts } = getIncomeActuals(item.categoryGuj);
                    const pct = item.budgetedAmount > 0 ? (actual / item.budgetedAmount) * 100 : 0;
                    const isAchieved = actual >= item.budgetedAmount;
                    const gap = item.budgetedAmount - actual;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span>{item.categoryGuj}</span>
                            {actual > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                                {matchedReceipts.length} રસીદ
                              </span>
                            )}
                          </div>
                          {item.notesGuj && <div className="text-[10px] text-slate-400 font-normal mt-0.5">{item.notesGuj}</div>}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {!isReadOnly ? (
                            <input
                              type="number"
                              min="0"
                              value={item.budgetedAmount}
                              onChange={(e) => handleUpdateAmount(item.id, parseFloat(e.target.value) || 0)}
                              className="w-28 text-right px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <span className="font-black text-emerald-600">₹ {item.budgetedAmount.toLocaleString('en-IN')}</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                          <button
                            onClick={() => handleOpenIncomeDrilldown(item)}
                            className="hover:underline text-slate-900 dark:text-white cursor-pointer font-black"
                            title="ક્લિક કરીને જોડાયેલ તમામ રસીદો જુઓ"
                          >
                            ₹ {actual.toLocaleString('en-IN')}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="w-full max-w-[140px] mx-auto">
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span className={isAchieved ? 'text-emerald-600 font-black' : 'text-slate-600 dark:text-slate-400'}>
                                {pct.toFixed(1)}%
                              </span>
                              {isAchieved ? (
                                <span className="text-emerald-600 font-black">લક્ષ્યાંક પૂર્ણ!</span>
                              ) : (
                                <span className="text-slate-500">{pct >= 50 ? 'પ્રગતિમાં' : 'બાકી'}</span>
                              )}
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isAchieved ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-bold">
                          <span className={isAchieved ? 'text-emerald-600 font-black' : 'text-slate-600 dark:text-slate-300'}>
                            {gap <= 0 ? `+ ₹ ${Math.abs(gap).toLocaleString('en-IN')}` : `₹ ${gap.toLocaleString('en-IN')}`}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenIncomeDrilldown(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="રસીદો જુઓ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>

                        {!isReadOnly && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              title="હેડિંગ રદ કરો"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredIncomeItems.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-black border-t-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <td className="py-3 px-4 text-slate-900 dark:text-white">કુલ આવક સરવાળો:</td>
                    <td className="py-3 px-4 text-right text-emerald-600">₹ {totalBudgetedIncome.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-slate-900 dark:text-white">₹ {totalActualIncome.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">
                      {totalBudgetedIncome > 0 ? ((totalActualIncome / totalBudgetedIncome) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                      ₹ {Math.max(0, totalBudgetedIncome - totalActualIncome).toLocaleString('en-IN')}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* COMBINED OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                આવક વિશ્લેષણ (Income Analytics)
              </h4>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {totalBudgetedIncome > 0 ? ((totalActualIncome / totalBudgetedIncome) * 100).toFixed(1) : 0}% લક્ષ્યાંક સિદ્ધ
              </span>
            </div>

            <div className="space-y-3">
              {incomeItems.slice(0, 6).map(it => {
                const { total: actual } = getIncomeActuals(it.categoryGuj);
                const pct = it.budgetedAmount > 0 ? (actual / it.budgetedAmount) * 100 : 0;
                return (
                  <div key={it.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{it.categoryGuj}</span>
                      <span>
                        <span className="text-slate-900 dark:text-white">₹ {actual.toLocaleString('en-IN')}</span> /
                        <span className="text-slate-400"> ₹ {it.budgetedAmount.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expense Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-500" />
                ખર્ચ વિશ્લેષણ (Expense Analytics)
              </h4>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                {totalBudgetedExpense > 0 ? ((totalActualExpense / totalBudgetedExpense) * 100).toFixed(1) : 0}% વપરાશ
              </span>
            </div>

            <div className="space-y-3">
              {expenseItems.slice(0, 6).map(it => {
                const { total: actual } = getExpenseActuals(it.categoryGuj);
                const pct = it.budgetedAmount > 0 ? (actual / it.budgetedAmount) * 100 : 0;
                return (
                  <div key={it.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{it.categoryGuj}</span>
                      <span>
                        <span className="text-slate-900 dark:text-white">₹ {actual.toLocaleString('en-IN')}</span> /
                        <span className="text-slate-400"> ₹ {it.budgetedAmount.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Drilldown Modal (Linked Vouchers / Receipts) */}
      {drilldownItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  વિગતવાર વ્યવહારો (Linked Transactions)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  હેડિંગ: <strong>{drilldownItem.item.categoryGuj}</strong> ({drilldownItem.item.type})
                </p>
              </div>
              <button onClick={() => setDrilldownItem(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {drilldownItem.records.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  આ કેટેગરી હેઠળ હાલમાં કોઈ વાઉચર કે રસીદ નોંધાયેલ નથી.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="grid grid-cols-12 pb-2 text-[11px] font-black text-slate-400 uppercase">
                    <div className="col-span-3">નંબર & તારીખ</div>
                    <div className="col-span-4">નામ / વિગત</div>
                    <div className="col-span-3">કેટેગરી</div>
                    <div className="col-span-2 text-right">રકમ (₹)</div>
                  </div>
                  {drilldownItem.records.map((rec) => (
                    <div key={rec.id} className="grid grid-cols-12 py-2.5 text-xs text-slate-700 dark:text-slate-300 items-center">
                      <div className="col-span-3">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400">{rec.number}</div>
                        <div className="text-[10px] text-slate-400">{rec.date}</div>
                      </div>
                      <div className="col-span-4">
                        <div className="font-bold text-slate-900 dark:text-white">{rec.partyName}</div>
                        {rec.remarks && <div className="text-[10px] text-slate-400 truncate">{rec.remarks}</div>}
                      </div>
                      <div className="col-span-3 text-[11px] text-slate-500 truncate">
                        {rec.category}
                      </div>
                      <div className="col-span-2 text-right font-black text-slate-900 dark:text-white">
                        ₹ {rec.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">
                કુલ વ્યવહારો: <strong>{drilldownItem.records.length}</strong>
              </span>
              <span className="font-black text-slate-900 dark:text-white">
                કુલ રકમ: <strong>₹ {drilldownItem.records.reduce((s, r) => s + r.amount, 0).toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add New Budget Head Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">નવું બજેટ હેડિંગ ઉમેરો</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  પ્રકાર (Type)
                </label>
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ખર્ચ (Expense)">ખર્ચ બજેટ (Expense)</option>
                  <option value="આવક (Income)">આવક બજેટ (Income)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  હેડિંગ / ખાતાનું નામ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="દા.ત. કોમ્પ્યુટર લેબ ખર્ચ અથવા પગાર"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  મંજૂર વાર્ષિક રકમ (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="100000"
                  value={newCatAmount}
                  onChange={(e) => setNewCatAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  વિશેષ નોંધ (Notes)
                </label>
                <input
                  type="text"
                  placeholder="હેતુ અથવા કારોબારી ઠરાવ સંદર્ભ"
                  value={newCatNotes}
                  onChange={(e) => setNewCatNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
                >
                  ઉમેરો
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Print View Modal */}
      {showPrintView && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrintView(false);
          }}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex items-center justify-between p-3 sm:p-4 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPrintView(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
                  title="પાછા જાઓ (ESC)"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                  <span>પાછા જાઓ</span>
                </button>

                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  <Printer className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">વાર્ષિક અંદાજપત્ર પત્રક</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isGeneratingPDF ? 'બની રહી છે...' : 'PDF ડાઉનલોડ'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>પ્રિન્ટ</span>
                </button>
                <button
                  onClick={() => setShowPrintView(false)}
                  className="p-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-xl transition cursor-pointer"
                  title="બંધ કરો (Close)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Body */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-white text-black font-sans">
              <div id="budget-sheet-print" className="p-4 bg-white text-black font-sans">
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                  <h1 className="text-2xl font-black">{trustSettings?.trustNameGuj || 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ'}</h1>
                  <p className="text-xs mt-1 font-semibold">{trustSettings?.addressGuj}</p>
                  <p className="text-xs font-semibold">નોંધણી નં: {trustSettings?.regNoGuj || trustSettings?.registrationNumber} | PAN: {trustSettings?.panNumber}</p>
                  <h2 className="text-base font-bold mt-3 underline uppercase">વાર્ષિક અંદાજપત્ર & વાસ્તવિક પત્રક (ANNUAL BUDGET STATEMENT)</h2>
                  <div className="text-xs font-semibold mt-1">નાણાકીય વર્ષ: {trustSettings?.financialYear || '૨૦૨૬-૨૭'}</div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Income Side */}
                  <div>
                    <h3 className="text-xs font-black border-b-2 border-black pb-1 mb-2 uppercase flex justify-between items-center">
                      <span>અંદાજિત આવક (ESTIMATED INCOME)</span>
                      <span className="text-[10px] font-bold">બજેટ લક્ષ્યાંક vs વાસ્તવિક આવક</span>
                    </h3>
                    <table className="w-full text-[11px] border-collapse border border-black">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-black p-1 text-left">આવક હેડ (Head)</th>
                          <th className="border border-black p-1 text-right">બજેટ રકમ (₹)</th>
                          <th className="border border-black p-1 text-right">વાસ્તવિક (₹)</th>
                          <th className="border border-black p-1 text-right bg-emerald-50">બાકી લક્ષ્યાંક (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomeItems.map(i => {
                          const { total: act } = getIncomeActuals(i.categoryGuj);
                          const rem = i.budgetedAmount - act;
                          return (
                            <tr key={i.id}>
                              <td className="border border-black p-1">{i.categoryGuj}</td>
                              <td className="border border-black p-1 text-right font-semibold">₹ {i.budgetedAmount.toLocaleString('en-IN')}</td>
                              <td className="border border-black p-1 text-right font-bold">₹ {act.toLocaleString('en-IN')}</td>
                              <td className={`border border-black p-1 text-right font-black ${rem <= 0 ? 'text-emerald-700 bg-emerald-50/50' : ''}`}>
                                {rem <= 0 ? `+ ₹ ${Math.abs(rem).toLocaleString('en-IN')} (પૂર્ણ)` : `₹ ${rem.toLocaleString('en-IN')}`}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-100 font-black border-t-2 border-black">
                          <td className="border border-black p-1 text-right">કુલ આવક સરવાળો:</td>
                          <td className="border border-black p-1 text-right font-black">₹ {totalBudgetedIncome.toLocaleString('en-IN')}</td>
                          <td className="border border-black p-1 text-right font-black">₹ {totalActualIncome.toLocaleString('en-IN')}</td>
                          <td className="border border-black p-1 text-right font-black bg-emerald-100">
                            {totalBudgetedIncome - totalActualIncome <= 0
                              ? `+ ₹ ${Math.abs(totalBudgetedIncome - totalActualIncome).toLocaleString('en-IN')} (સિદ્ધ)`
                              : `₹ ${(totalBudgetedIncome - totalActualIncome).toLocaleString('en-IN')}`}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Expense Side */}
                  <div>
                    <h3 className="text-xs font-black border-b-2 border-black pb-1 mb-2 uppercase flex justify-between items-center">
                      <span>અંદાજિત ખર્ચ (ESTIMATED EXPENSES)</span>
                      <span className="text-[10px] font-bold">મંજૂર બજેટ vs વાસ્તવિક ખર્ચ</span>
                    </h3>
                    <table className="w-full text-[11px] border-collapse border border-black">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-black p-1 text-left">ખર્ચ હેડ (Head)</th>
                          <th className="border border-black p-1 text-right">બજેટ રકમ (₹)</th>
                          <th className="border border-black p-1 text-right">વાસ્તવિક (₹)</th>
                          <th className="border border-black p-1 text-right bg-rose-50">બાકી બચત/શિલક (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenseItems.map(i => {
                          const { total: act } = getExpenseActuals(i.categoryGuj);
                          const rem = i.budgetedAmount - act;
                          return (
                            <tr key={i.id}>
                              <td className="border border-black p-1">{i.categoryGuj}</td>
                              <td className="border border-black p-1 text-right font-semibold">₹ {i.budgetedAmount.toLocaleString('en-IN')}</td>
                              <td className="border border-black p-1 text-right font-bold">₹ {act.toLocaleString('en-IN')}</td>
                              <td className={`border border-black p-1 text-right font-black ${rem < 0 ? 'text-rose-700 bg-rose-50/50' : 'text-slate-900'}`}>
                                {rem < 0 ? `- ₹ ${Math.abs(rem).toLocaleString('en-IN')} (વધારે ખર્ચ)` : `₹ ${rem.toLocaleString('en-IN')}`}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-100 font-black border-t-2 border-black">
                          <td className="border border-black p-1 text-right">કુલ ખર્ચ સરવાળો:</td>
                          <td className="border border-black p-1 text-right font-black">₹ {totalBudgetedExpense.toLocaleString('en-IN')}</td>
                          <td className="border border-black p-1 text-right font-black">₹ {totalActualExpense.toLocaleString('en-IN')}</td>
                          <td className="border border-black p-1 text-right font-black bg-rose-100">
                            {totalBudgetedExpense - totalActualExpense < 0
                              ? `- ₹ ${Math.abs(totalBudgetedExpense - totalActualExpense).toLocaleString('en-IN')} (વધારે)`
                              : `₹ ${(totalBudgetedExpense - totalActualExpense).toLocaleString('en-IN')}`}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Statements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-2 border-black p-3 bg-slate-50 text-xs font-bold mb-8">
                  <div className="space-y-1 border-r-0 sm:border-r border-black pr-0 sm:pr-4">
                    <div className="flex justify-between">
                      <span>અંદાજિત મંજૂર પુરાંત / (ખાધ):</span>
                      <span className="font-black text-sm">₹ {(totalBudgetedIncome - totalBudgetedExpense).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>વાસ્તવિક ચોખ્ખી પુરાંત / (ખાધ):</span>
                      <span className={`font-black text-sm ${totalActualIncome >= totalActualExpense ? 'text-emerald-800' : 'text-rose-800'}`}>
                        ₹ {(totalActualIncome - totalActualExpense).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pl-0 sm:pl-4">
                    <div className="flex justify-between">
                      <span>ખર્ચ બજેટમાંથી બાકી રહેલી બચત (Unspent Expense):</span>
                      <span className="font-black text-emerald-800">
                        ₹ {Math.max(0, totalBudgetedExpense - totalActualExpense).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>આવક લક્ષ્યાંકમાંથી પ્રાપ્ત કરવાની બાકી આવક:</span>
                      <span className="font-black text-indigo-800">
                        ₹ {Math.max(0, totalBudgetedIncome - totalActualIncome).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-12 pt-8 text-xs font-bold">
                  <div className="text-center">
                    <div className="w-36 border-t border-black mb-1"></div>
                    ખજાનચી / એકાઉન્ટન્ટ
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-t border-black mb-1"></div>
                    મંત્રીશ્રી (Secretary)
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-t border-black mb-1"></div>
                    પ્રમુખશ્રી (President)
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
              <button
                onClick={() => setShowPrintView(false)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>મુખ્ય બજેટ સ્ક્રીન પર પાછા જાઓ</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF ડાઉનલોડ</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>પ્રિન્ટ કરો</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
