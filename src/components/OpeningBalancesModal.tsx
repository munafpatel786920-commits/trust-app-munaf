/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Landmark, Wallet, Save, X, CheckCircle2, DollarSign, Calculator, AlertCircle } from 'lucide-react';
import { BankAccount, TrustSettings } from '../types';

interface OpeningBalancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trustSettings?: TrustSettings;
  banks: BankAccount[];
  onSaveOpeningBalances: (newCashOpening: number, bankOpenings: { [bankId: string]: number }) => void;
  darkMode: boolean;
  currentUserRole?: string;
}

export default function OpeningBalancesModal({
  isOpen,
  onClose,
  trustSettings,
  banks,
  onSaveOpeningBalances,
  darkMode,
  currentUserRole = 'Admin'
}: OpeningBalancesModalProps) {
  const [cashOpening, setCashOpening] = useState<number>(trustSettings?.openingCashBalance ?? 0);
  
  // Initial state for bank openings
  const [bankOpenings, setBankOpenings] = useState<{ [bankId: string]: number }>(() => {
    const initialMap: { [bankId: string]: number } = {};
    banks.forEach(b => {
      initialMap[b.id] = b.openingBalance ?? 0;
    });
    return initialMap;
  });

  if (!isOpen) return null;

  const handleBankOpeningChange = (bankId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setBankOpenings(prev => ({ ...prev, [bankId]: num }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole === 'ReadOnly') {
      alert('તમારી પાસે પ્રારંભિક શિલક બદલવાની પરવાનગી નથી.');
      return;
    }
    onSaveOpeningBalances(cashOpening, bankOpenings);
    alert('✓ રોકડ અને બેંક ખાતાઓની પ્રારંભિક શિલક (Opening Balances) સફળતાપૂર્વક સેવ કરવામાં આવી છે.');
    onClose();
  };

  const totalBankOpening: number = Object.values(bankOpenings).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
  const totalTrustOpening: number = cashOpening + totalBankOpening;

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-2xl p-6 rounded-2xl border ${cardBg} shadow-2xl space-y-5 my-8`}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                પ્રારંભિક શિલક સેટિંગ્સ (Cash & Bank Opening Balances)
              </h3>
              <p className={`text-xs ${textMuted}`}>
                નાણાકીય વર્ષની શરૂઆતમાં હાથ પરની રોકડ અને બેંક ખાતાઓની શરૂઆતની શિલક સેટ કરો.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Cash Opening Balance Section */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                રોકડ પ્રારંભિક શિલક (Opening Cash in Hand ₹) *
              </label>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                સેફ લોકર કેશ
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-700 dark:text-emerald-400 text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={cashOpening}
                onChange={(e) => setCashOpening(parseFloat(e.target.value) || 0)}
                disabled={currentUserRole === 'ReadOnly'}
                placeholder="દા.ત. 150000"
                className={`w-full pl-8 pr-4 py-2.5 rounded-xl text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 ${inputBg} border-emerald-300 dark:border-emerald-700 focus:ring-2 focus:ring-emerald-500`}
                required
              />
            </div>
            <span className={`block text-[11px] ${textMuted}`}>
              રોજમેળ (Day Book) માં આ રકમથી કેશ બેલેન્સ ગણવાની શરૂઆત થશે.
            </span>
          </div>

          {/* Bank Accounts Opening Balances Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-600" />
              બેંક ખાતાઓની પ્રારંભિક શિલક (Bank Accounts Opening Balance)
            </h4>

            {banks.length === 0 ? (
              <div className="p-4 text-center border border-dashed rounded-xl text-xs text-slate-400">
                કોઈ બેંક ખાતું ઉમેરેલું નથી. કૃપા કરીને પહેલાં બેંક ખાતું રજીસ્ટર કરો.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {banks.map((b) => (
                  <div key={b.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {b.bankNameGuj}
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-normal">({b.accountNumber})</span>
                      </div>
                      <span className={`block text-[10px] ${textMuted}`}>{b.branchGuj} | IFSC: {b.ifscCode}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-[11px] hidden sm:block">
                        <span className="text-slate-400 block text-[10px]">વર્તમાન સિલક:</span>
                        <strong className="font-mono text-slate-700 dark:text-slate-300">₹ {b.balance.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="relative w-36">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-blue-600 text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={bankOpenings[b.id] ?? 0}
                          onChange={(e) => handleBankOpeningChange(b.id, e.target.value)}
                          disabled={currentUserRole === 'ReadOnly'}
                          placeholder="0"
                          className={`w-full pl-6 pr-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-blue-700 dark:text-blue-400 ${inputBg}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grand Total Preview Banner */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-indigo-900 dark:text-indigo-300 font-bold block">
                કુલ પ્રારંભિક ટ્રસ્ટ ફંડ (Total Initial Fund):
              </span>
              <span className="text-[11px] text-slate-500">
                રોકડ શિલક (₹ {cashOpening.toLocaleString('en-IN')}) + બેંક ઓપનિંગ (₹ {totalBankOpening.toLocaleString('en-IN')})
              </span>
            </div>
            <strong className="text-base font-black text-indigo-700 dark:text-indigo-400 font-mono">
              ₹ {totalTrustOpening.toLocaleString('en-IN')}
            </strong>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              રદ કરો (Cancel)
            </button>
            {currentUserRole !== 'ReadOnly' && (
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
              >
                <Save className="w-4 h-4" /> પ્રારંભિક શિલક સેવ કરો (Save Opening Balances)
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
