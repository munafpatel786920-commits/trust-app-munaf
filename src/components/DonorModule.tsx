/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Search, Phone, Mail, FileCheck, Landmark, ShieldCheck, X, Edit3, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Donor, IncomeReceipt } from '../types';

interface DonorModuleProps {
  donors: Donor[];
  receipts: IncomeReceipt[];
  onAddDonor: (donor: Omit<Donor, 'id' | 'createdAt'>) => void;
  onEditDonor?: (donor: Donor) => void;
  onDeleteDonor?: (id: string) => void;
  currentUser: { role: string };
  darkMode: boolean;
}

export default function DonorModule({ donors, receipts, onAddDonor, onEditDonor, onDeleteDonor, currentUser, darkMode }: DonorModuleProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);

  // Form states
  const [nameGuj, setNameGuj] = useState('');
  const [phone, setPhone] = useState('');
  const [addressGuj, setAddressGuj] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [email, setEmail] = useState('');

  const filteredDonors = donors.filter(d => {
    const query = searchQuery.toLowerCase();
    return (
      d.nameGuj.toLowerCase().includes(query) ||
      (d.phone && d.phone.includes(query)) ||
      (d.panNumber && d.panNumber.toLowerCase().includes(query))
    );
  });

  const handleStartAdd = () => {
    setEditingDonor(null);
    setNameGuj('');
    setPhone('');
    setAddressGuj('');
    setPanNumber('');
    setAadharNumber('');
    setEmail('');
    setShowAddForm(true);
  };

  const handleStartEdit = (d: Donor) => {
    setEditingDonor(d);
    setNameGuj(d.nameGuj);
    setPhone(d.phone || '');
    setAddressGuj(d.addressGuj || '');
    setPanNumber(d.panNumber || '');
    setAadharNumber(d.aadharNumber || '');
    setEmail(d.email || '');
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameGuj) {
      alert('મહેરબાની કરીને દાતાનું નામ દાખલ કરો.');
      return;
    }

    if (editingDonor && onEditDonor) {
      const updated: Donor = {
        ...editingDonor,
        nameGuj,
        phone,
        addressGuj,
        panNumber: panNumber.toUpperCase(),
        aadharNumber,
        email
      };
      onEditDonor(updated);
      if (selectedDonor?.id === updated.id) {
        setSelectedDonor(updated);
      }
      alert(`✓ દાતાશ્રી "${nameGuj}" ની વિગતો સફળતાપૂર્વક અપડેટ કરવામાં આવી છે.`);
    } else {
      onAddDonor({
        nameGuj,
        phone,
        addressGuj,
        panNumber: panNumber.toUpperCase(),
        aadharNumber,
        email
      });
    }

    // Reset
    setNameGuj('');
    setPhone('');
    setAddressGuj('');
    setPanNumber('');
    setAadharNumber('');
    setEmail('');
    setEditingDonor(null);
    setShowAddForm(false);
  };

  const donorHistory = selectedDonor
    ? receipts.filter(r => r.donorId === selectedDonor.id && !r.isDeleted)
    : [];

  const totalDonated = donorHistory.reduce((sum, r) => sum + r.amount, 0);

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black">દાતાઓનું મેનેજમેન્ટ (Donor Directory)</h2>
          <p className={`text-xs ${textMuted}`}>ટ્રસ્ટના તમામ આદરણીય દાતાશ્રીઓની પ્રોફાઇલ, PAN/આધાર વિગતો અને સંપૂર્ણ ઇતિહાસ અહીં ઉપલબ્ધ છે.</p>
        </div>
        {currentUser.role !== 'ReadOnly' && (
          <button
            id="btn-add-donor"
            onClick={handleStartAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> નવો દાતા રજીસ્ટર કરો (Register Donor)
          </button>
        )}
      </div>

      {showAddForm ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border ${cardBg} max-w-2xl mx-auto`}
        >
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h3 className="font-bold text-sm text-emerald-600 flex items-center gap-2">
              {editingDonor ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingDonor ? 'દાતા પ્રોફાઇલ સુધારો (Edit Donor Profile)' : 'નવી દાતા પ્રોફાઇલ એન્ટ્રી (New Donor Form)'}
            </h3>
            <button onClick={() => { setShowAddForm(false); setEditingDonor(null); }} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">દાતાશ્રીનું નામ (Donor Name in Gujarati) *</label>
              <input
                type="text"
                placeholder="દા.ત. ચિંતનભાઈ વિનોદચંદ્ર શાહ"
                value={nameGuj}
                onChange={(e) => setNameGuj(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">મોબાઇલ નંબર (Mobile No)</label>
                <input
                  type="text"
                  placeholder="મોબાઇલ નંબર"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">ઇમેઇલ એડ્રેસ (Email)</label>
                <input
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">PAN કાર્ડ નંબર (80G મુક્તિ માટે)</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">આધાર કાર્ડ નંબર (Aadhar No)</label>
                <input
                  type="text"
                  placeholder="૧૨ આંકડાનો આધાર નંબર"
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">સરનામું (Address)</label>
              <textarea
                placeholder="પૂરું ઘર કે ઓફિસનું સરનામું..."
                value={addressGuj}
                onChange={(e) => setAddressGuj(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs ${inputBg} h-16`}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setEditingDonor(null); }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                રદ કરો (Cancel)
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {editingDonor ? 'ફેરફાર સેવ કરો (Update Donor)' : 'દાતા ઉમેરો (Save Profile)'}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        /* Donors List with search and profiles details trigger */
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${cardBg} flex items-center gap-3`}>
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="દાતાનું નામ, ફોન કે PAN નંબર ટાઈપ કરો..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full focus:ring-0"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List side */}
            <div className="lg:col-span-2 space-y-3">
              {filteredDonors.map(d => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDonor(d)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedDonor?.id === d.id
                      ? 'border-emerald-600 bg-emerald-500/5'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50'
                  } ${cardBg} flex justify-between items-center text-xs`}
                >
                  <div>
                    <strong className="text-sm block">{d.nameGuj}</strong>
                    <span className={`block text-[10px] mt-1 ${textMuted}`}>
                      {d.phone ? `મોબાઇલ: ${d.phone}` : 'ફોન નથી'} • {d.panNumber ? `PAN: ${d.panNumber}` : 'PAN નથી'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser.role !== 'ReadOnly' && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(d);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                          title="દાતા પ્રોફાઇલ સુધારો (Edit Donor Profile)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteDonor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`દાતા ${d.nameGuj} રદ કરવા માંગો છો?`)) {
                                onDeleteDonor(d.id);
                                if (selectedDonor?.id === d.id) setSelectedDonor(null);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                            title="દાતા રદ કરો (Delete Donor)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                    <button className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 hover:text-emerald-700 rounded text-[10px] font-bold">
                      ઇતિહાસ જુઓ (Profile)
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Donor specific detailed Profile view */}
            <div>
              {selectedDonor ? (
                <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
                  <div className="border-b pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm text-emerald-600">{selectedDonor.nameGuj}</h3>
                      <span className={`text-[10px] ${textMuted}`}>દાતા પ્રોફાઇલ વિગતો</span>
                    </div>
                    {currentUser.role !== 'ReadOnly' && (
                      <button
                        onClick={() => handleStartEdit(selectedDonor)}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        title="પ્રોફાઇલ એડિટ કરો"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>સુધારો (Edit)</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className={`block text-[10px] uppercase ${textMuted}`}>મોબાઇલ</span>
                      <span className="font-bold flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {selectedDonor.phone || '-'}</span>
                    </div>
                    <div>
                      <span className={`block text-[10px] uppercase ${textMuted}`}>ઇમેઇલ</span>
                      <span className="font-bold flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {selectedDonor.email || '-'}</span>
                    </div>
                    <div>
                      <span className={`block text-[10px] uppercase ${textMuted}`}>PAN કાર્ડ નંબર</span>
                      <span className="font-bold flex items-center gap-1"><FileCheck className="w-3 h-3 text-emerald-500" /> {selectedDonor.panNumber || 'રજિસ્ટર નથી'}</span>
                    </div>
                    <div>
                      <span className={`block text-[10px] uppercase ${textMuted}`}>સરનામું</span>
                      <span className="text-slate-700 dark:text-slate-300 italic">{selectedDonor.addressGuj || 'સરનામું ઉપલબ્ધ નથી'}</span>
                    </div>
                  </div>

                  {/* Donor Donation summary ledger */}
                  <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl text-xs space-y-2">
                    <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> દાન યોગદાન સારાંશ
                    </h4>
                    <div className="flex justify-between font-semibold">
                      <span>કુલ પાવતી સંખ્યા:</span>
                      <span>{donorHistory.length} પાવતી</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-emerald-700">
                      <span>કુલ મળેલ ફંડ:</span>
                      <span>₹ {totalDonated.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Little list of recent receipt numbers */}
                  {donorHistory.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] block uppercase text-slate-400 font-bold">છેલ્લા વ્યવહારો (Recent Bookings)</span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {donorHistory.map(r => (
                          <div key={r.id} className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 text-[10px] flex justify-between">
                            <span>{r.receiptNumber} ({r.date})</span>
                            <strong className="text-emerald-600">₹ {r.amount}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`p-8 rounded-2xl border ${cardBg} text-center text-slate-400 border-dashed flex flex-col items-center justify-center h-64`}>
                  <Landmark className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-xs">દાતાના નામ પર ક્લિક કરવાથી તેમની પ્રોફાઇલ અને ઇતિહાસ અહીં જોઈ શકાશે.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
