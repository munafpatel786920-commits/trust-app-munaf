/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  X
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

const DEFAULT_EXPENSE_HEADS = [
  'શિક્ષણ & સ્કોલરશીપ સહાય',
  'મેડિકલ & આરોગ્ય સહાય',
  'અન્નક્ષેત્ર / રાશન કીટ વિતરણ',
  'મકાન & સ્થાવર મિલકત સમારકામ',
  'કર્મચારી પગાર & મહેનતાણું',
  'વીજળી & પાણી બિલ ખર્ચ',
  'ઓફિસ સ્ટેશનરી & પ્રિન્ટિંગ',
  'ઓડિટ ફી & કાનૂની ખર્ચ',
  'ધાર્મિક & ઉત્સવ ઉજવણી ખર્ચ',
  'પરચૂરણ વહીવટી ખર્ચ'
];

const DEFAULT_INCOME_HEADS = [
  'સામાન્ય દાન (General Donation)',
  'બિલ્ડીંગ ફંડ દાન',
  'શિક્ષણ સહાય ફંડ દાન',
  'બેંક એફ.ડી. વ્યાજ આવક',
  'મિલકત ભાડાની આવક',
  'સભાસદ વાર્ષિક લવાજમ / ફી',
  'પરચૂરણ આવક'
];

export default function BudgetModule({
  budgetPlan,
  receipts = [],
  vouchers = [],
  onSaveBudgetPlan,
  currentUser,
  darkMode,
  trustSettings
}: BudgetModuleProps) {
  const [items, setItems] = useState<BudgetItem[]>(() => {
    if (budgetPlan?.items && budgetPlan.items.length > 0) {
      return budgetPlan.items;
    }
    // Initialize default items
    const defaultList: BudgetItem[] = [
      ...DEFAULT_INCOME_HEADS.map((name, i) => ({
        id: `inc-${i}`,
        categoryGuj: name,
        type: 'આવક (Income)' as const,
        budgetedAmount: 500000,
        notesGuj: 'અંદાજિત વાર્ષિક લક્ષ્યાંક'
      })),
      ...DEFAULT_EXPENSE_HEADS.map((name, i) => ({
        id: `exp-${i}`,
        categoryGuj: name,
        type: 'ખર્ચ (Expense)' as const,
        budgetedAmount: 200000,
        notesGuj: 'વાર્ષિક મંજૂર બજેટ'
      }))
    ];
    return defaultList;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'આવક (Income)' | 'ખર્ચ (Expense)'>('ખર્ચ (Expense)');
  const [newCatAmount, setNewCatAmount] = useState('');
  const [newCatNotes, setNewCatNotes] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Calculate actuals
  const actualIncomeMap = receipts.reduce((acc, r) => {
    const cat = r.category || 'સામાન્ય દાન (General Donation)';
    acc[cat] = (acc[cat] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);

  const actualExpenseMap = vouchers.reduce((acc, v) => {
    const cat = v.category || 'પરચૂરણ વહીવટી ખર્ચ';
    acc[cat] = (acc[cat] || 0) + v.amount;
    return acc;
  }, {} as Record<string, number>);

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
    alert('વાર્ષિક અંદાજપત્ર (Budget Plan) સફળતાપૂર્વક સાચવવામાં આવ્યું છે.');
  };

  const incomeItems = items.filter(i => i.type === 'આવક (Income)');
  const expenseItems = items.filter(i => i.type === 'ખર્ચ (Expense)');

  const totalBudgetedIncome = incomeItems.reduce((s, i) => s + i.budgetedAmount, 0);
  const totalActualIncome = receipts.reduce((s, r) => s + r.amount, 0);

  const totalBudgetedExpense = expenseItems.reduce((s, i) => s + i.budgetedAmount, 0);
  const totalActualExpense = vouchers.reduce((s, v) => s + v.amount, 0);

  const handlePrint = () => {
    printContainer('budget-sheet-print');
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    await downloadContainerAsPDF('budget-sheet-print', `Budget_Sheet_${trustSettings?.financialYear || '2026-27'}`);
    setIsGeneratingPDF(false);
  };

  const isReadOnly = currentUser.role === 'ReadOnly';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            વાર્ષિક અંદાજપત્ર & બજેટ સરખામણી (Budget vs Actual Planner)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            નાણાકીય વર્ષ {trustSettings?.financialYear || '૨૦૨૬-૨૭'} માટે આવક-ખર્ચના અંદાજિત લક્ષ્યાંકો & વાસ્તવિક ખર્ચનું નિયંત્રણ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowPrintView(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            અંદાજપત્ર પત્રક પ્રિન્ટ
          </button>

          {!isReadOnly && (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                નવું હેડિંગ ઉમેરો
              </button>

              <button
                onClick={handleSaveBudget}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/20 transition"
              >
                <Save className="w-4 h-4" />
                બજેટ સાચવો (Save Budget)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">મંજૂર અંદાજિત આવક (Budgeted)</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹ {totalBudgetedIncome.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            વાસ્તવિક પ્રાપ્ત: ₹ {totalActualIncome.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">મંજૂર અંદાજિત ખર્ચ (Budgeted)</div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2">
            ₹ {totalBudgetedExpense.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            વાસ્તવિક ખર્ચ: ₹ {totalActualExpense.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">ખર્ચ બજેટ ઉપયોગિતા (% Utilized)</div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {totalBudgetedExpense > 0 ? ((totalActualExpense / totalBudgetedExpense) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            બાકી ખર્ચ ક્ષમતા: ₹ {Math.max(0, totalBudgetedExpense - totalActualExpense).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">અંદાજિત વાર્ષિક પુરાંત / ખાધ</div>
          <div className={`text-xl font-black mt-2 ${totalBudgetedIncome >= totalBudgetedExpense ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹ {(totalBudgetedIncome - totalBudgetedExpense).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            {totalBudgetedIncome >= totalBudgetedExpense ? 'પુરાંતવાળું બજેટ (Surplus)' : 'ખાધવાળું બજેટ (Deficit)'}
          </div>
        </div>
      </div>

      {/* Expense Budget Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            ખર્ચ વિષયક અંદાજપત્ર & વાસ્તવિક ખર્ચ સરખામણી (Expenses Budget vs Actual)
          </h3>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
            કુલ મંજૂર ખર્ચ: ₹ {totalBudgetedExpense.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">ખર્ચનું હેડિંગ / કેટેગરી</th>
                <th className="py-3 px-4 text-right">મંજૂર બજેટ રકમ (₹)</th>
                <th className="py-3 px-4 text-right">વાસ્તવિક ખર્ચ (₹)</th>
                <th className="py-3 px-4 text-center">બજેટ વપરાશ (% Progress)</th>
                <th className="py-3 px-4 text-right">બાકી રકમ (Variance)</th>
                {!isReadOnly && <th className="py-3 px-4 text-right">એક્શન</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenseItems.map((item) => {
                const actual = actualExpenseMap[item.categoryGuj] || 0;
                const pct = item.budgetedAmount > 0 ? (actual / item.budgetedAmount) * 100 : 0;
                const isOver = actual > item.budgetedAmount;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {item.categoryGuj}
                      {item.notesGuj && <div className="text-[10px] text-slate-400 font-normal">{item.notesGuj}</div>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isReadOnly ? (
                        <input
                          type="number"
                          value={item.budgetedAmount}
                          onChange={(e) => handleUpdateAmount(item.id, parseFloat(e.target.value) || 0)}
                          className="w-28 text-right px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-rose-600 focus:outline-none"
                        />
                      ) : (
                        <span className="font-black text-rose-600">₹ {item.budgetedAmount.toLocaleString('en-IN')}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                      ₹ {actual.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full max-w-[140px] mx-auto">
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span className={isOver ? 'text-rose-600' : 'text-slate-500'}>{pct.toFixed(0)}%</span>
                          {isOver && <span className="text-rose-600 font-black">વધારે ખર્ચ!</span>}
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      <span className={isOver ? 'text-rose-600 font-black' : 'text-emerald-600'}>
                        ₹ {(item.budgetedAmount - actual).toLocaleString('en-IN')}
                      </span>
                    </td>
                    {!isReadOnly && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
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
                  placeholder="દા.ત. કોમ્પ્યુટર લેબ ખર્ચ"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  વિશેષ નોંધ (Notes)
                </label>
                <input
                  type="text"
                  placeholder="હેતુ અથવા સમિતિ ઠરાવ સંદર્ભ"
                  value={newCatNotes}
                  onChange={(e) => setNewCatNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                વાર્ષિક અંદાજપત્ર પત્રક (Annual Budget Sheet)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isGeneratingPDF ? 'બની રહી છે...' : 'PDF ડાઉનલોડ'}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  પ્રિન્ટ
                </button>
                <button
                  onClick={() => setShowPrintView(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="budget-sheet-print" className="p-8 bg-white text-black font-sans">
              <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-2xl font-black">{trustSettings?.trustNameGuj || 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ'}</h1>
                <p className="text-xs mt-1 font-semibold">{trustSettings?.addressGuj}</p>
                <p className="text-xs font-semibold">નોંધણી નં: {trustSettings?.regNoGuj || trustSettings?.registrationNumber} | PAN: {trustSettings?.panNumber}</p>
                <h2 className="text-base font-bold mt-3 underline uppercase">વાર્ષિક અંદાજપત્ર (ANNUAL BUDGET STATEMENT)</h2>
                <div className="text-xs font-semibold mt-1">નાણાકીય વર્ષ: {trustSettings?.financialYear || '૨૦૨૬-૨૭'}</div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Income Side */}
                <div>
                  <h3 className="text-xs font-black border-b border-black pb-1 mb-2 uppercase">અંદાજિત આવક (ESTIMATED INCOME)</h3>
                  <table className="w-full text-[11px] border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1 text-left">આવક હેડ</th>
                        <th className="border border-black p-1 text-right">બજેટ રકમ (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeItems.map(i => (
                        <tr key={i.id}>
                          <td className="border border-black p-1">{i.categoryGuj}</td>
                          <td className="border border-black p-1 text-right font-bold">₹ {i.budgetedAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold">
                        <td className="border border-black p-1 text-right">કુલ અંદાજિત આવક:</td>
                        <td className="border border-black p-1 text-right font-black">₹ {totalBudgetedIncome.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Expense Side */}
                <div>
                  <h3 className="text-xs font-black border-b border-black pb-1 mb-2 uppercase">અંદાજિત ખર્ચ (ESTIMATED EXPENSES)</h3>
                  <table className="w-full text-[11px] border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1 text-left">ખર્ચ હેડ</th>
                        <th className="border border-black p-1 text-right">બજેટ રકમ (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseItems.map(i => (
                        <tr key={i.id}>
                          <td className="border border-black p-1">{i.categoryGuj}</td>
                          <td className="border border-black p-1 text-right font-bold">₹ {i.budgetedAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold">
                        <td className="border border-black p-1 text-right">કુલ અંદાજિત ખર્ચ:</td>
                        <td className="border border-black p-1 text-right font-black">₹ {totalBudgetedExpense.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border border-black p-3 bg-slate-50 text-xs font-bold flex justify-between items-center mb-8">
                <span>અંદાજિત ચોખ્ખી પુરાંત / (ખાધ) [SURPLUS / DEFICIT]:</span>
                <span className="text-sm font-black">₹ {(totalBudgetedIncome - totalBudgetedExpense).toLocaleString('en-IN')}</span>
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
        </div>
      )}
    </div>
  );
}
