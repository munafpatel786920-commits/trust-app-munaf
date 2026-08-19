/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  Send,
  Copy,
  Users,
  Calendar,
  CheckCircle2,
  FileText,
  DollarSign,
  Share2,
  Plus,
  Trash2,
  Phone,
  Search,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { TrustNotice, Donor, TrustMember, MemberLoanApplication, IncomeReceipt, TrustSettings } from '../types';

interface NoticeModuleProps {
  notices: TrustNotice[];
  donors: Donor[];
  members: TrustMember[];
  loanApplications?: MemberLoanApplication[];
  receipts?: IncomeReceipt[];
  onAddNotice: (notice: TrustNotice) => void;
  onDeleteNotice: (id: string) => void;
  currentUser: { role: string };
  darkMode: boolean;
  trustSettings?: TrustSettings;
}

export default function NoticeModule({
  notices = [],
  donors = [],
  members = [],
  loanApplications = [],
  receipts = [],
  onAddNotice,
  onDeleteNotice,
  currentUser,
  darkMode,
  trustSettings
}: NoticeModuleProps) {
  const [templateType, setTemplateType] = useState<string>('agm_meeting');
  const [recipientCategory, setRecipientCategory] = useState<'custom' | 'donor' | 'member' | 'borrower'>('member');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pre-fill message based on template
  const applyTemplate = (type: string, name = recipientName) => {
    const trustName = trustSettings?.trustNameGuj || 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ';
    const cleanName = name || 'શ્રીમાન/શ્રીમતી';

    if (type === 'agm_meeting') {
      setSubject('વાર્ષિક સાધારણ સભા (AGM) અંગેની નોટિસ');
      setMessageText(
        `*પ્રણામ, ${cleanName} જી,*\n\n` +
        `*${trustName}* ના તમામ આદરણીય સભાસદો/ટ્રસ્ટીશ્રીઓને જણાવવાનું કે સંસ્થાની વાર્ષિક સાધારણ સભા (AGM) નીચે મુજબ યોજાનાર છે:\n\n` +
        `📅 *તારીખ:* ૨૫-માર્ચ-૨૦૨૬ (રવિવાર)\n` +
        `⏰ *સમય:* સવારે ૧૦:૦૦ કલાકે\n` +
        `📍 *સ્થળ:* ટ્રસ્ટ હોલ / મુખ્ય કાર્યાલય\n` +
        `📋 *એજન્ડા:* ગત વર્ષના હિસાબોની મંજૂરી, નવા વિકાસ કાર્યો અને અંદાજપત્ર.\n\n` +
        `આપની ઉપસ્થિતિ આવકાર્ય છે. 🙏\n- *કારોબારી સમિતિ, ${trustName}*`
      );
    } else if (type === 'donation_receipt') {
      setSubject('દાન રસીદ પુષ્ટિ & આભાર પત્ર');
      setMessageText(
        `*પ્રણામ, ${cleanName} જી,*\n\n` +
        `*${trustName}* માં આપશ્રી તરફથી મળેલ ઉમદા દાન સહયોગ બદલ અમે આપના ખૂબ ખૂબ આભારી છીએ.\n\n` +
        `🧾 *સંસ્થા:* ${trustName}\n` +
        `📄 *નોંધણી નં:* ${trustSettings?.regNoGuj || 'E/7862'}\n` +
        `🏛️ *80G કરમુક્તિ:* માન્ય\n\n` +
        `આપની દાન પાવતી તૈયાર છે. માનવ સેવાના આ કાર્યમાં સહભાગી થવા બદલ આપનો ખૂબ આભાર. 🙏`
      );
    } else if (type === 'loan_reminder') {
      setSubject('માસિક લોન હપ્તા ભરપાઈ અંગેની યાદી');
      setMessageText(
        `*પ્રણામ, ${cleanName} જી,*\n\n` +
        `*${trustName}* માં આપશ્રીના સભાસદ ખાતા પર ચાલતી લોનના ચાલુ માસના હપ્તાની મુદત નજીક આવી રહી છે.\n\n` +
        `કૃપા કરીને આપનો માસિક હપ્તો સમયસર ટ્રસ્ટના ખાતામાં અથવા ઓફિસે જમા કરાવી રસીદ મેળવી લેવા વિનંતી છે.\n\n` +
        `સહકાર બદલ આભાર. 🙏\n- *હિસાબ વિભાગ, ${trustName}*`
      );
    } else if (type === 'share_allotment') {
      setSubject('સભાસદ શેર પ્રમાણપત્ર & ફોલિયો નંબર નોટિસ');
      setMessageText(
        `*અભિનંદન, ${cleanName} જી,*\n\n` +
        `*${trustName}* માં આપશ્રીનું સભાસદ પદ મંજૂર કરવામાં આવ્યું છે અને શેર ફાળવણી કરવામાં આવી છે.\n\n` +
        `આપનું શેર સર્ટિફિકેટ ટ્રસ્ટ કાર્યાલય ખાતે તૈયાર છે. કાર્યાલય સમય દરમિયાન રૂબરૂ આવી પ્રમાણપત્ર મેળવી લેવા વિનંતી.\n\n` +
        `આભાર સહ, 🙏\n- *મંત્રીશ્રી, ${trustName}*`
      );
    } else if (type === 'general_announcement') {
      setSubject('ટ્રસ્ટની અગત્યની જાહેરાત / સૂચના');
      setMessageText(
        `*જય શ્રી કૃષ્ણ / સલામ, ${cleanName} જી,*\n\n` +
        `*${trustName}* દ્વારા સર્વે સભ્યો તથા દાતાશ્રીઓને જણાવવાનું કે...\n\n` +
        `[અહીં આપની વિગત લખો]\n\n` +
        `લી. *ટ્રસ્ટી મંડળ, ${trustName}*`
      );
    }
  };

  const handleSelectRecipient = (id: string) => {
    setSelectedRecipientId(id);
    if (recipientCategory === 'member') {
      const m = members.find(mem => mem.id === id);
      if (m) {
        setRecipientName(m.nameGuj);
        setRecipientPhone(m.phone || '');
        applyTemplate(templateType, m.nameGuj);
      }
    } else if (recipientCategory === 'donor') {
      const d = donors.find(don => don.id === id);
      if (d) {
        setRecipientName(d.nameGuj);
        setRecipientPhone(d.phone || '');
        applyTemplate(templateType, d.nameGuj);
      }
    } else if (recipientCategory === 'borrower') {
      const l = loanApplications.find(loan => loan.id === id);
      if (l) {
        setRecipientName(l.memberNameGuj);
        const mem = members.find(m => m.id === l.memberId);
        setRecipientPhone(mem?.phone || '');
        applyTemplate('loan_reminder', l.memberNameGuj);
      }
    }
  };

  const handleSendWhatsApp = () => {
    if (!messageText.trim()) {
      alert('કૃપા કરીને મેસેજ દાખલ કરો.');
      return;
    }

    const cleanPhone = recipientPhone.replace(/\D/g, '');
    const encoded = encodeURIComponent(messageText);

    // Save to notice history
    const newNotice: TrustNotice = {
      id: `ntc-${Date.now()}`,
      noticeType: templateType as any,
      recipientNameGuj: recipientName || 'સર્વે સભ્યો',
      recipientPhone: recipientPhone,
      subjectGuj: subject || 'વોટ્સએપ નોટિસ',
      messageTextGuj: messageText,
      sentDate: new Date().toISOString().split('T')[0],
      status: 'મોકલેલ (Sent)'
    };
    onAddNotice(newNotice);

    if (cleanPhone && cleanPhone.length >= 10) {
      const formatted = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      window.open(`https://wa.me/${formatted}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredNotices = notices.filter(n =>
    n.recipientNameGuj.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.subjectGuj.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </span>
            વોટ્સએપ & SMS મેસેજિંગ / નોટિસ કેન્દ્ર (Notice Communication)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            સભાસદો, દાતાઓ અને લોન ધારકોને ૧-ક્લિકમાં સભા નોટિસ, દાન આભાર પત્ર અને હપ્તા રીમાઇન્ડર મોકલો
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Composer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              મેસેજ ટેમ્પલેટ પસંદ કરો (Choose Template)
            </h3>

            {/* Template Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'agm_meeting', label: 'સાધારણ સભા (AGM)', icon: Users },
                { id: 'donation_receipt', label: 'દાન રસીદ આભાર', icon: DollarSign },
                { id: 'loan_reminder', label: 'લોન હપ્તા રીમાઇન્ડર', icon: AlertCircle },
                { id: 'share_allotment', label: 'શેર સર્ટિફિકેટ નોટિસ', icon: FileText },
                { id: 'general_announcement', label: 'સામાન્ય જાહેરાત', icon: MessageSquare }
              ].map(tpl => {
                const Icon = tpl.icon;
                const active = templateType === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      setTemplateType(tpl.id);
                      applyTemplate(tpl.id);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 border transition ${
                      active
                        ? 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tpl.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Recipient Selection */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">મેસેજ કોને મોકલવો છે?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setRecipientCategory('member'); setSelectedRecipientId(''); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${recipientCategory === 'member' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                  >
                    સભાસદ ({members.length})
                  </button>
                  <button
                    onClick={() => { setRecipientCategory('donor'); setSelectedRecipientId(''); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${recipientCategory === 'donor' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                  >
                    દાતા ({donors.length})
                  </button>
                  {loanApplications.length > 0 && (
                    <button
                      onClick={() => { setRecipientCategory('borrower'); setSelectedRecipientId(''); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${recipientCategory === 'borrower' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                    >
                      લોન ખાતાદાર ({loanApplications.length})
                    </button>
                  )}
                  <button
                    onClick={() => { setRecipientCategory('custom'); setSelectedRecipientId(''); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${recipientCategory === 'custom' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                  >
                    અન્ય / કસ્ટમ
                  </button>
                </div>
              </div>

              {recipientCategory !== 'custom' && (
                <div>
                  <select
                    value={selectedRecipientId}
                    onChange={(e) => handleSelectRecipient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="">-- નામ પસંદ કરો --</option>
                    {recipientCategory === 'member' && members.map(m => (
                      <option key={m.id} value={m.id}>{m.nameGuj} ({m.memberNo || m.id}) - {m.phone || 'No Phone'}</option>
                    ))}
                    {recipientCategory === 'donor' && donors.map(d => (
                      <option key={d.id} value={d.id}>{d.nameGuj} - {d.phone || 'No Phone'}</option>
                    ))}
                    {recipientCategory === 'borrower' && loanApplications.map(l => (
                      <option key={l.id} value={l.id}>{l.memberNameGuj} - લોન ₹{(l.sanctionedAmount || l.recommendedAmount || l.requestedAmount || 0).toLocaleString('en-IN')}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    પ્રાપ્તકર્તાનું નામ (Recipient Name)
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => {
                      setRecipientName(e.target.value);
                      applyTemplate(templateType, e.target.value);
                    }}
                    placeholder="દા.ત. રમેશભાઈ પટેલ"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    મોબાઇલ નંબર (WhatsApp No.)
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="9825012345"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  મેસેજ લખાણ (Message Text in Gujarati)
                </label>
                <button
                  onClick={handleCopy}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'કોપી થયું!' : 'ટેક્સ્ટ કોપી કરો'}
                </button>
              </div>
              <textarea
                rows={8}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Copy className="w-4 h-4" />
                લખાણ કોપી કરો
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-green-600/20 flex items-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                વોટ્સએપ પર મોકલો (Dispatch WhatsApp)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mobile Preview & History */}
        <div className="lg:col-span-5 space-y-4">
          {/* Mobile Preview Frame */}
          <div className="bg-slate-900 p-4 rounded-3xl border-4 border-slate-700 shadow-xl max-w-sm mx-auto text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-black text-xs text-black">
                  T
                </div>
                <div>
                  <div className="text-xs font-black">{trustSettings?.trustNameGuj || 'ટ્રસ્ટ કાર્યાલય'}</div>
                  <div className="text-[10px] text-green-400">ઓનલાઇન (WhatsApp Official)</div>
                </div>
              </div>
            </div>

            <div className="py-4 min-h-[220px] max-h-[300px] overflow-y-auto space-y-2">
              <div className="bg-emerald-900/90 text-white p-3.5 rounded-2xl rounded-tr-none text-xs leading-relaxed font-sans whitespace-pre-wrap shadow-sm">
                {messageText || 'મેસેજ ટેમ્પલેટ પસંદ કરો...'}
                <div className="text-[9px] text-emerald-300 text-right mt-1.5">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
              લાઈવ વોટ્સએપ મેસેજ પ્રિવ્યુ
            </div>
          </div>

          {/* History */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white">તાજેતરના મોકલેલ નોટિસ ઇતિહાસ</h4>
              <span className="text-[10px] text-slate-400">{notices.length} નોટિસ</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notices.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  કોઈ નોટિસ રેકોર્ડ નથી.
                </div>
              ) : (
                notices.slice(-5).reverse().map(ntc => (
                  <div key={ntc.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{ntc.recipientNameGuj}</div>
                      <div className="text-[10px] text-slate-400">{ntc.subjectGuj} • {ntc.sentDate}</div>
                    </div>
                    <button
                      onClick={() => onDeleteNotice(ntc.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
