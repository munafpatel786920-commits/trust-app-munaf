/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Receipt,
  FileText,
  Users,
  Building2,
  Landmark,
  Package,
  Scroll,
  ArrowRight,
  X,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  IncomeReceipt,
  ExpenseVoucher,
  Donor,
  TrustMember,
  BankAccount,
  Asset,
  AgendaTharav,
  TrustFixedDeposit,
  DonationCertificate80G
} from '../types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipts?: IncomeReceipt[];
  vouchers?: ExpenseVoucher[];
  donors?: Donor[];
  members?: TrustMember[];
  banks?: BankAccount[];
  assets?: Asset[];
  tharavs?: AgendaTharav[];
  fixedDeposits?: TrustFixedDeposit[];
  certificates80g?: DonationCertificate80G[];
  onNavigate: (tabId: string, searchParam?: string) => void;
}

export default function QuickSearchModal({
  isOpen,
  onClose,
  receipts = [],
  vouchers = [],
  donors = [],
  members = [],
  banks = [],
  assets = [],
  tharavs = [],
  fixedDeposits = [],
  certificates80g = [],
  onNavigate
}: QuickSearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search in receipts
  const matchedReceipts = q
    ? receipts.filter(r =>
        r.receiptNumber.toLowerCase().includes(q) ||
        r.donorNameGuj.toLowerCase().includes(q) ||
        String(r.amount).includes(q)
      ).slice(0, 5)
    : [];

  // Search in vouchers
  const matchedVouchers = q
    ? vouchers.filter(v =>
        v.voucherNumber.toLowerCase().includes(q) ||
        v.paidToGuj.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        String(v.amount).includes(q)
      ).slice(0, 5)
    : [];

  // Search in donors
  const matchedDonors = q
    ? donors.filter(d =>
        d.nameGuj.toLowerCase().includes(q) ||
        (d.phone && d.phone.includes(q)) ||
        (d.panNumber && d.panNumber.toLowerCase().includes(q))
      ).slice(0, 5)
    : [];

  // Search in members
  const matchedMembers = q
    ? members.filter(m =>
        m.nameGuj.toLowerCase().includes(q) ||
        (m.memberNo && m.memberNo.toLowerCase().includes(q)) ||
        (m.phone && m.phone.includes(q))
      ).slice(0, 5)
    : [];

  // Search in banks & FDs
  const matchedBanks = q
    ? banks.filter(b =>
        b.bankNameGuj.toLowerCase().includes(q) ||
        b.accountNumber.includes(q)
      ).slice(0, 3)
    : [];

  const matchedFDs = q
    ? fixedDeposits.filter(f =>
        f.fdNumber.toLowerCase().includes(q) ||
        f.bankNameGuj.toLowerCase().includes(q) ||
        String(f.principalAmount).includes(q)
      ).slice(0, 3)
    : [];

  // Search in 80G Certificates
  const matched80G = q
    ? certificates80g.filter(c =>
        c.certificateNumber.toLowerCase().includes(q) ||
        c.donorNameGuj.toLowerCase().includes(q) ||
        c.donorPan.toLowerCase().includes(q) ||
        c.receiptNumber.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  // Search in assets
  const matchedAssets = q
    ? assets.filter(a =>
        a.nameGuj.toLowerCase().includes(q) ||
        (a.deadStockNo && a.deadStockNo.toLowerCase().includes(q))
      ).slice(0, 3)
    : [];

  // Search in tharavs
  const matchedTharavs = q
    ? tharavs.filter(t =>
        t.tharavNumber.toLowerCase().includes(q) ||
        t.subjectGuj.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const totalResults =
    matchedReceipts.length +
    matchedVouchers.length +
    matchedDonors.length +
    matchedMembers.length +
    matchedBanks.length +
    matchedFDs.length +
    matched80G.length +
    matchedAssets.length +
    matchedTharavs.length;

  const handleSelect = (tab: string, param?: string) => {
    onNavigate(tab, param);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-16 sm:pt-24 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="સંપૂર્ણ ટ્રસ્ટમાં શોધો... (રસીદ નં, વાઉચર, દાતા, સભાસદ, બેંક, FD, ઠરાવ)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-bold focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!q ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <div className="text-xs font-bold text-slate-500">ઝડપી શોધ કરવા માટે કીવર્ડ ટાઈપ કરો</div>
              <div className="text-[11px] text-slate-400">
                દા.ત. "REC", "VOU", "SBI", દાતાનું નામ, રકમ અથવા સભાસદ નંબર
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <div className="text-xs font-bold">"{query}" માટે કોઈ પરિણામ મળ્યું નથી.</div>
            </div>
          ) : (
            <>
              {/* Receipts */}
              {matchedReceipts.length > 0 && (
                <div>
                  <div className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 px-3 py-1 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    આવક પાવતીઓ (Receipts)
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedReceipts.map(r => (
                      <button
                        key={r.id}
                        onClick={() => handleSelect('receipts', r.receiptNumber)}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white mr-2">{r.receiptNumber}</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">{r.donorNameGuj}</span>
                          <span className="text-[10px] text-slate-400 ml-2">({r.date})</span>
                        </div>
                        <div className="text-xs font-black text-emerald-600">
                          ₹ {r.amount.toLocaleString('en-IN')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vouchers */}
              {matchedVouchers.length > 0 && (
                <div>
                  <div className="text-[11px] font-black uppercase text-rose-600 dark:text-rose-400 px-3 py-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    ખર્ચ વાઉચરો (Expense Vouchers)
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedVouchers.map(v => (
                      <button
                        key={v.id}
                        onClick={() => handleSelect('vouchers', v.voucherNumber)}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white mr-2">{v.voucherNumber}</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">{v.paidToGuj}</span>
                          <span className="text-[10px] text-slate-400 ml-2">({v.category})</span>
                        </div>
                        <div className="text-xs font-black text-rose-600">
                          ₹ {v.amount.toLocaleString('en-IN')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Donors */}
              {matchedDonors.length > 0 && (
                <div>
                  <div className="text-[11px] font-black uppercase text-blue-600 dark:text-blue-400 px-3 py-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    દાતાઓ (Donors)
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedDonors.map(d => (
                      <button
                        key={d.id}
                        onClick={() => handleSelect('donors', d.nameGuj)}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white">{d.nameGuj}</span>
                          {d.phone && <span className="text-[10px] text-slate-400 ml-2">📞 {d.phone}</span>}
                          {d.panNumber && <span className="text-[10px] text-slate-400 ml-2">PAN: {d.panNumber}</span>}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              {matchedMembers.length > 0 && (
                <div>
                  <div className="text-[11px] font-black uppercase text-purple-600 dark:text-purple-400 px-3 py-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    સભાસદો (Members)
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedMembers.map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleSelect('members', m.nameGuj)}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white">{m.nameGuj}</span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold ml-2">#{m.memberNo || m.id}</span>
                          {m.phone && <span className="text-[10px] text-slate-400 ml-2">📞 {m.phone}</span>}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 80G Certificates */}
              {matched80G.length > 0 && (
                <div>
                  <div className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 px-3 py-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    ૮૦-જી ટેક્સ પ્રમાણપત્રો (80G Certificates)
                  </div>
                  <div className="space-y-1 mt-1">
                    {matched80G.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect('tax_80g', c.certificateNumber)}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white mr-2">{c.certificateNumber}</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">{c.donorNameGuj}</span>
                          <span className="text-[10px] text-slate-400 ml-2">(PAN: {c.donorPan})</span>
                        </div>
                        <div className="text-xs font-black text-emerald-600">₹ {c.amount.toLocaleString('en-IN')}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FDs & Banks */}
              {(matchedBanks.length > 0 || matchedFDs.length > 0) && (
                <div>
                  <div className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 px-3 py-1 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" />
                    બેંક એકાઉન્ટ્સ & ફિક્સ્ડ ડિપોઝિટ્સ (Banks & FDs)
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedBanks.map(b => (
                      <button
                        key={b.id}
                        onClick={() => handleSelect('banks', b.bankNameGuj)}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white">{b.bankNameGuj}</span>
                          <span className="text-[10px] text-slate-400 ml-2">A/c: {b.accountNumber}</span>
                        </div>
                        <div className="text-xs font-black text-emerald-600">₹ {b.balance.toLocaleString('en-IN')}</div>
                      </button>
                    ))}
                    {matchedFDs.map(f => (
                      <button
                        key={f.id}
                        onClick={() => handleSelect('fixed_deposits', f.fdNumber)}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white mr-2">{f.fdNumber}</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">{f.bankNameGuj}</span>
                          <span className="text-[10px] text-slate-400 ml-2">(પાકતી તારીખ: {f.maturityDate})</span>
                        </div>
                        <div className="text-xs font-black text-blue-600">₹ {f.principalAmount.toLocaleString('en-IN')}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tharavs */}
              {matchedTharavs.length > 0 && (
                <div>
                  <div className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 px-3 py-1 flex items-center gap-1.5">
                    <Scroll className="w-3.5 h-3.5" />
                    ઠરાવો & એજન્ડા (Tharavs)
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedTharavs.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSelect('tharav', t.tharavNumber)}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white mr-2">ઠરાવ નં. {t.tharavNumber}</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300">{t.subjectGuj}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>ઝડપી સર્ચ શોર્ટકટ: <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[9px]">Ctrl+K</kbd></span>
            <span>બંધ કરવા: <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[9px]">Esc</kbd></span>
          </div>
          <div>સંપૂર્ણ ટ્રસ્ટ રેકોર્ડ્સ શોધ સક્ષમ</div>
        </div>
      </motion.div>
    </div>
  );
}
