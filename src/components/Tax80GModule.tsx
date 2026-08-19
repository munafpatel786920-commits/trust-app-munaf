/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  Plus,
  Search,
  Printer,
  Download,
  Share2,
  FileText,
  CheckCircle2,
  Trash2,
  Eye,
  X,
  QrCode,
  ShieldCheck,
  Send,
  Building,
  UserCheck
} from 'lucide-react';
import { DonationCertificate80G, IncomeReceipt, Donor, TrustSettings } from '../types';
import { printContainer, downloadContainerAsPDF } from '../utils/pdfPrint';

interface Tax80GModuleProps {
  certificates: DonationCertificate80G[];
  receipts: IncomeReceipt[];
  donors: Donor[];
  onAddCertificate: (cert: DonationCertificate80G) => void;
  onDeleteCertificate: (id: string) => void;
  currentUser: { role: string };
  darkMode: boolean;
  trustSettings?: TrustSettings;
}

// Convert numbers to Gujarati Words
function numberToGujaratiWords(num: number): string {
  if (num === 0) return 'શૂન્ય';

  const units = ['', 'એક', 'બે', 'ત્રણ', 'ચાર', 'પાંચ', 'છ', 'સાત', 'આઠ', 'નવ', 'દસ',
    'અગિયાર', 'બાર', 'તેર', 'ચૌદ', 'પંદર', 'સોળ', 'સત્તર', 'અઢાર', 'ઓગણીસ', 'વીસ',
    'એકવીસ', 'બાવીસ', 'ત્રેવીસ', 'ચોવીસ', 'પચ્ચીસ', 'છવ્વીસ', 'સત્તાવીસ', 'અઠ્ઠાવીસ', 'ઓગણત્રીસ', 'ત્રીસ',
    'એકત્રીસ', 'બત્રીસ', 'તેત્રીસ', 'ચોત્રીસ', 'પાંત્રીસ', 'છત્રીસ', 'સાડત્રીસ', 'આડત્રીસ', 'ઓગણચાલીસ', 'ચાલીસ',
    'એકતાલીસ', 'બેતાલીસ', 'તેતાલીસ', 'ચુમ્માલીસ', 'પિસ્તાલીસ', 'છેતાલીસ', 'સુડતાલીસ', 'અડતાલીસ', 'ઓગણપચાસ', 'પચાસ',
    'એકાવન', 'બાવન', 'ત્રેપન', 'ચોપન', 'પંચાવન', 'છપ્પન', 'સત્તાવન', 'અઠ્ઠાવન', 'ઓગણસાઠ', 'સાઠ',
    'એકસઠ', 'બાસઠ', 'ત્રેસઠ', 'ચોસઠ', 'પાંસઠ', 'છાસઠ', 'સડસઠ', 'અડસઠ', 'અગણોસિત્તેર', 'સિત્તેર',
    'એકોતેર', 'બોતેર', 'તેરોતેર', 'ચોંતેર', 'પંચોતેર', 'છોતેર', 'સંતોતેર', 'ઈઠોતેર', 'ઓગણાએંસી', 'એંસી',
    'એક્યાસી', 'બ્યાસી', 'ત્યાસી', 'ચોર્યાસી', 'પંચાસી', 'છ્યાસી', 'સિત્યાસી', 'ઇઠ્યાસી', 'નેવ્યાસી', 'નેવું',
    'એકાણું', 'બાણું', 'ત્રાણું', 'ચોરાણું', 'પંચાણું', 'છન્નું', 'સત્તાણું', 'અઠ્ઠાણું', 'નવાણું'];

  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  const rem = num % 100;

  if (crore > 0) words += `${units[crore] || crore} કરોડ `;
  if (lakh > 0) words += `${units[lakh] || lakh} લાખ `;
  if (thousand > 0) words += `${units[thousand] || thousand} હજાર `;
  if (hundred > 0) words += `${units[hundred] || hundred} સો `;
  if (rem > 0) words += `${units[rem] || rem} `;

  return `${words.trim()} રૂપિયા પૂરા`;
}

export default function Tax80GModule({
  certificates = [],
  receipts = [],
  donors = [],
  onAddCertificate,
  onDeleteCertificate,
  currentUser,
  darkMode,
  trustSettings
}: Tax80GModuleProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<DonationCertificate80G | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Form states
  const [selectedReceiptId, setSelectedReceiptId] = useState('');
  const [donorNameGuj, setDonorNameGuj] = useState('');
  const [donorPan, setDonorPan] = useState('');
  const [donorAddressGuj, setDonorAddressGuj] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [certDate, setCertDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [financialYear, setFinancialYear] = useState<string>(trustSettings?.financialYear || '૨૦૨૬-૨૭');
  const [donationMode, setDonationMode] = useState<string>('બેંક ટ્રાન્સફર (NEFT/RTGS)');
  const [purposeGuj, setPurposeGuj] = useState<string>('સામાન્ય દાન / સામાજિક કલ્યાણ');

  // Auto-fill when selecting receipt
  const handleSelectReceipt = (rId: string) => {
    setSelectedReceiptId(rId);
    const receipt = receipts.find(r => r.id === rId);
    if (receipt) {
      setReceiptNumber(receipt.receiptNumber);
      setAmount(String(receipt.amount));
      setDonorNameGuj(receipt.donorNameGuj);
      setDonationMode(receipt.paymentMode);
      setCertDate(receipt.date);
      setPurposeGuj(receipt.category || 'સામાન્ય દાન');

      const donor = donors.find(d => d.id === receipt.donorId);
      if (donor) {
        setDonorPan(donor.panNumber || '');
        setDonorAddressGuj(donor.addressGuj || '');
        setDonorPhone(donor.phone || '');
      }
    }
  };

  const handleOpenAddModal = () => {
    setSelectedReceiptId('');
    setDonorNameGuj('');
    setDonorPan('');
    setDonorAddressGuj('');
    setDonorPhone('');
    setAmount('');
    setReceiptNumber('');
    setCertDate(new Date().toISOString().split('T')[0]);
    setFinancialYear(trustSettings?.financialYear || '૨૦૨૬-૨૭');
    setDonationMode('બેંક ટ્રાન્સફર (NEFT/RTGS)');
    setPurposeGuj('સામાન્ય દાન / સામાજિક કલ્યાણ');
    setShowAddModal(true);
  };

  const handleSaveCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      alert('કૃપા કરીને માન્ય રકમ દાખલ કરો.');
      return;
    }

    const certSeq = String(certificates.length + 1).padStart(4, '0');
    const newCert: DonationCertificate80G = {
      id: `cert-${Date.now()}`,
      certificateNumber: `80G-${new Date().getFullYear()}-${certSeq}`,
      receiptNumber: receiptNumber || `REC-${Date.now().toString().slice(-4)}`,
      date: certDate,
      donorNameGuj: donorNameGuj.trim(),
      donorAddressGuj: donorAddressGuj.trim(),
      donorPan: donorPan.trim().toUpperCase(),
      donorPhone: donorPhone.trim(),
      amount: amt,
      financialYear,
      donationMode,
      purposeGuj: purposeGuj.trim(),
      createdAt: new Date().toISOString()
    };

    onAddCertificate(newCert);
    setShowAddModal(false);
    setSelectedCert(newCert);
  };

  const handlePrint = () => {
    printContainer('certificate-80g-print');
  };

  const handleDownloadPDF = async () => {
    if (!selectedCert) return;
    setIsGeneratingPDF(true);
    await downloadContainerAsPDF('certificate-80g-print', `80G_Certificate_${selectedCert.certificateNumber}`);
    setIsGeneratingPDF(false);
  };

  const handleWhatsAppShare = (cert: DonationCertificate80G) => {
    const phone = cert.donorPhone?.replace(/\D/g, '') || '';
    const text = `*પ્રણામ, ${cert.donorNameGuj} જી,*\n\n` +
      `*${trustSettings?.trustNameGuj || 'ટ્રસ્ટ'}* માં આપશ્રી તરફથી મળેલ *₹ ${cert.amount.toLocaleString('en-IN')}* ના દાન માટેનું આવકવેરા કલમ 80G હેઠળ કરમુક્તિ પ્રમાણપત્ર તૈયાર છે.\n\n` +
      `📄 *પ્રમાણપત્ર નં:* ${cert.certificateNumber}\n` +
      `🧾 *રસીદ નં:* ${cert.receiptNumber}\n` +
      `📅 *તારીખ:* ${cert.date}\n` +
      `🆔 *PAN:* ${cert.donorPan || 'Not Provided'}\n` +
      `🏛️ *80G રજિ. નં:* ${trustSettings?.section80GNo || 'AAATP1234F20224'}\n\n` +
      `આપના ઉમદા સહયોગ બદલ ટ્રસ્ટ પરિવાર આપનો હૃદયપૂર્વક આભાર માને છે. 🙏`;

    const encoded = encodeURIComponent(text);
    if (phone && phone.length >= 10) {
      const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const filteredCerts = certificates.filter(c =>
    c.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.donorNameGuj.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.donorPan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExemptDonation = certificates.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Award className="w-5 h-5" />
            </span>
            ૮૦-જી (80G) દાન કર રાહત પ્રમાણપત્ર & ફોર્મ ૧૦બીઈ (Form 10BE)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            દાતાઓને આવકવેરા કપાત (Income Tax Exemption) માટે અધિકૃત 80G સર્ટિફિકેટ & WhatsApp શેરિંગ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {currentUser.role !== 'ReadOnly' && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              નવું 80G સર્ટિફિકેટ બનાવો (Generate 80G)
            </button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">કુલ 80G પ્રમાણપત્રો જારી થયેલ</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {certificates.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            માનવ સેવા & ધર્માદા દાન
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">કુલ કરમુક્ત દાન રકમ (80G Amount)</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹ {totalExemptDonation.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            ૫૦% આવકવેરા મુક્તિ લાયક
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">ટ્રસ્ટ 80G રજિસ્ટ્રેશન ઓર્ડર નંબર</div>
          <div className="text-sm font-black text-blue-600 dark:text-blue-400 mt-2 truncate">
            {trustSettings?.section80GNo || 'AAATP1234F20224'}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            12A No: {trustSettings?.section12ANo || 'AAATP1234F20211'}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="સર્ટિફિકેટ નં, દાતાનું નામ અથવા PAN શોધો..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Certificates List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">સર્ટિફિકેટ નં</th>
                <th className="py-3.5 px-4">તારીખ</th>
                <th className="py-3.5 px-4">દાતાનું નામ</th>
                <th className="py-3.5 px-4">PAN કાર્ડ નંબર</th>
                <th className="py-3.5 px-4">મૂળ રસીદ નં</th>
                <th className="py-3.5 px-4 text-right">દાન રકમ (₹)</th>
                <th className="py-3.5 px-4 text-center">શેર & પ્રિન્ટ</th>
                {currentUser.role !== 'ReadOnly' && <th className="py-3.5 px-4 text-right">એક્શન</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    કોઈ 80G સર્ટિફિકેટ મળ્યું નથી. 'નવું 80G સર્ટિફિકેટ બનાવો' પર ક્લિક કરો.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                      {cert.certificateNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{cert.date}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{cert.donorNameGuj}</div>
                      {cert.donorPhone && <div className="text-[10px] text-slate-400">{cert.donorPhone}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {cert.donorPan || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                      {cert.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                      ₹ {cert.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg font-bold text-[11px] flex items-center gap-1"
                          title="પ્રમાણપત્ર જુઓ અને પ્રિન્ટ કરો"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          પ્રિન્ટ / વ્યુ
                        </button>
                        <button
                          onClick={() => handleWhatsAppShare(cert)}
                          className="p-1.5 bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 hover:bg-green-100 rounded-lg"
                          title="વોટ્સએપ પર મોકલો"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    {currentUser.role !== 'ReadOnly' && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`શું તમે ખરેખર ${cert.certificateNumber} સર્ટિફિકેટ ડિલીટ કરવા માંગો છો?`)) {
                              onDeleteCertificate(cert.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate 80G Certificate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                નવું 80G દાન પ્રમાણપત્ર તૈયાર કરો
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCertificate} className="p-5 space-y-4">
              {/* Pick from existing receipts optionally */}
              {receipts.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                    દાન પાવતીમાંથી પસંદ કરો (Auto-Fill from Receipt)
                  </label>
                  <select
                    value={selectedReceiptId}
                    onChange={(e) => handleSelectReceipt(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="">-- અથવા સીધી નવી એન્ટ્રી દાખલ કરો --</option>
                    {receipts.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.receiptNumber} - {r.donorNameGuj} (₹ {r.amount.toLocaleString('en-IN')}) - {r.date}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    દાતાનું નામ (Donor Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={donorNameGuj}
                    onChange={(e) => setDonorNameGuj(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    દાતાનો PAN કાર્ડ નંબર (PAN No.) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="દા.ત. ABCDE1234F"
                    value={donorPan}
                    onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    દાન રકમ (Amount ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    દાન તારીખ (Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={certDate}
                    onChange={(e) => setCertDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    મૂળ રસીદ નંબર (Receipt No.)
                  </label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    મોબાઇલ નંબર (વોટ્સએપ માટે)
                  </label>
                  <input
                    type="tel"
                    placeholder="9825012345"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ચુકવણી પદ્ધતિ (Mode of Payment)
                  </label>
                  <input
                    type="text"
                    value={donationMode}
                    onChange={(e) => setDonationMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    નાણાકીય વર્ષ (Financial Year)
                  </label>
                  <input
                    type="text"
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  દાતાનું સરનામું (Address)
                </label>
                <textarea
                  rows={2}
                  value={donorAddressGuj}
                  onChange={(e) => setDonorAddressGuj(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20"
                >
                  પ્રમાણપત્ર તૈયાર કરો
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View & Print 80G Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                ૮૦-જી (80G) કર રાહત પ્રમાણપત્ર
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleWhatsAppShare(selectedCert)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  વોટ્સએપ શેર
                </button>
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
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Print Layout */}
            <div id="certificate-80g-print" className="p-8 bg-white text-black font-sans border-8 border-double border-emerald-800 m-4 rounded-xl relative">
              {/* Top Watermark / Badge */}
              <div className="text-center pb-4 border-b-2 border-emerald-800">
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-600 rounded-full text-[11px] font-black uppercase mb-2">
                  આવકવેરા કલમ ૮૦-જી (80G) હેઠળ ૫૦% કર રાહત પ્રમાણપત્ર
                </div>
                <h1 className="text-2xl font-black text-emerald-900">{trustSettings?.trustNameGuj || 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ'}</h1>
                <p className="text-xs text-slate-600 font-semibold mt-1">{trustSettings?.addressGuj}</p>
                <p className="text-xs font-semibold text-slate-700">
                  નોંધણી નં: <span className="font-bold">{trustSettings?.regNoGuj || trustSettings?.registrationNumber}</span> | PAN: <span className="font-bold">{trustSettings?.panNumber}</span>
                </p>
                <div className="mt-2 text-xs bg-slate-50 p-1.5 border border-slate-200 rounded font-semibold">
                  80G ઓર્ડર નં: <span className="font-bold text-emerald-800">{trustSettings?.section80GNo || 'AAATP1234F20224'}</span> | 12A નં: <span className="font-bold">{trustSettings?.section12ANo || 'AAATP1234F20211'}</span>
                </div>
              </div>

              {/* Certificate Meta */}
              <div className="flex justify-between items-center my-4 text-xs font-bold border-b border-slate-200 pb-2">
                <div>પ્રમાણપત્ર નં: <span className="font-black text-emerald-800">{selectedCert.certificateNumber}</span></div>
                <div>નાણાકીય વર્ષ: <span className="font-black">{selectedCert.financialYear}</span></div>
                <div>તારીખ: <span className="font-black">{selectedCert.date}</span></div>
              </div>

              {/* Main Content */}
              <div className="my-6 text-xs leading-relaxed space-y-4">
                <p>આથી પ્રમાણપત્ર આપવામાં આવે છે કે,</p>
                
                <div className="bg-slate-50 p-4 border border-slate-300 rounded-xl space-y-2">
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700">શ્રી / મેસર્સ:</span>
                    <span className="font-black text-sm text-black">{selectedCert.donorNameGuj}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700">PAN કાર્ડ નંબર:</span>
                    <span className="font-mono font-bold text-black">{selectedCert.donorPan || 'Not Provided'}</span>
                  </div>
                  {selectedCert.donorAddressGuj && (
                    <div className="flex">
                      <span className="w-36 font-bold text-slate-700">સરનામું:</span>
                      <span className="font-medium text-slate-800">{selectedCert.donorAddressGuj}</span>
                    </div>
                  )}
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700">મૂળ પાવતી નંબર:</span>
                    <span className="font-bold text-slate-800">{selectedCert.receiptNumber}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700">દાનની રકમ:</span>
                    <span className="font-black text-emerald-800 text-sm">₹ {selectedCert.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700">શબ્દોમાં રકમ:</span>
                    <span className="font-bold text-black">{numberToGujaratiWords(selectedCert.amount)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-bold text-slate-700">ચુકવણી માધ્યમ:</span>
                    <span className="font-medium text-slate-800">{selectedCert.donationMode}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-700 text-justify">
                  સદરહુ રકમ સંસ્થાને ધર્માદા / સામાજિક ઉદ્દેશ્ય માટે સ્વેચ્છાએ દાન સ્વરૂપે પ્રાપ્ત થયેલ છે. આ દાન આવકવેરા ધારા ૧૯૬૧ ની કલમ ૮૦-જી (5) (vi) અન્વયે દાતા માટે ૫૦% કર કપાત (Tax Exemption) માટે માન્ય છે.
                </p>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end mt-12 pt-8 text-xs font-bold">
                <div className="text-center">
                  <div className="w-36 border-t border-black mb-1"></div>
                  ખજાનચી / ઓડિટર
                </div>

                {/* QR stamp placeholder */}
                <div className="text-center p-2 border border-slate-300 rounded bg-slate-50 text-[9px] text-slate-500">
                  <QrCode className="w-10 h-10 mx-auto text-slate-800" />
                  વેરિફાઇડ પ્રમાણપત્ર
                </div>

                <div className="text-center">
                  <div className="w-36 border-t border-black mb-1"></div>
                  પ્રમુખ / સેક્રેટરી (ટ્રસ્ટી)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
