/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck2,
  Plus,
  Search,
  Printer,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  Calendar,
  Users,
  MapPin,
  Clock,
  Sparkles,
  FileText,
  UserCheck,
  CheckCircle,
  ListOrdered,
  Download,
  BookOpen,
  FilePlus,
  PenTool
} from 'lucide-react';
import { AgendaTharav, TrustMember, TrustSettings } from '../types';

interface AgendaTharavModuleProps {
  tharavs: AgendaTharav[];
  members: TrustMember[];
  trustSettings?: TrustSettings;
  onAddTharav: (tharav: Omit<AgendaTharav, 'id' | 'createdAt'>) => void;
  onEditTharav?: (tharav: AgendaTharav) => void;
  onDeleteTharav?: (id: string) => void;
  currentUser: { role: string };
  darkMode: boolean;
}

export default function AgendaTharavModule({
  tharavs,
  members,
  trustSettings,
  onAddTharav,
  onEditTharav,
  onDeleteTharav,
  currentUser,
  darkMode
}: AgendaTharavModuleProps) {
  const [activeModuleTab, setActiveModuleTab] = useState<'tharavs' | 'agenda'>('tharavs');
  
  // Resolution states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTharav, setEditingTharav] = useState<AgendaTharav | null>(null);
  const [selectedTharavForPrint, setSelectedTharavForPrint] = useState<AgendaTharav | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('તમામ');

  // Form states for Tharav
  const [meetingNumber, setMeetingNumber] = useState('૨૦૨૬/૦૧');
  const [meetingType, setMeetingType] = useState<AgendaTharav['meetingType']>('કારોબારી સભા (Executive Committee)');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('૧૧:૦૦ AM');
  const [venueGuj, setVenueGuj] = useState('ટ્રસ્ટ મુખ્ય કાર્યાલય (Trust Office)');
  const [chairpersonGuj, setChairpersonGuj] = useState('');
  const [presentMembersGuj, setPresentMembersGuj] = useState('');
  const [agendaPointsGuj, setAgendaPointsGuj] = useState('');

  const [tharavNumber, setTharavNumber] = useState('ઠરાવ નં. ૧');
  const [subjectGuj, setSubjectGuj] = useState('');
  const [proposerGuj, setProposerGuj] = useState('');
  const [seconderGuj, setSeconderGuj] = useState('');
  const [statusGuj, setStatusGuj] = useState<AgendaTharav['statusGuj']>('સર્વાનુમતે મંજૂર (Unanimously Passed)');
  const [descriptionGuj, setDescriptionGuj] = useState('');
  const [actionAssignedToGuj, setActionAssignedToGuj] = useState('');

  // Agenda Creator States (for printing Agenda + Proposed Resolutions + Member Signature Table)
  const [agendaNoticeNo, setAgendaNoticeNo] = useState('નોટિસ નં. ૨૦૨૬/૦૧');
  const [agendaMeetingType, setAgendaMeetingType] = useState('કારોબારી સભા (Executive Committee)');
  const [agendaDate, setAgendaDate] = useState(new Date().toISOString().split('T')[0]);
  const [agendaTime, setAgendaTime] = useState('૧૧:૦૦ AM');
  const [agendaVenue, setAgendaVenue] = useState(trustSettings?.addressGuj || 'ટ્રસ્ટ મુખ્ય કાર્યાલય, અમદાવાદ');
  const [agendaChairperson, setAgendaChairperson] = useState(members[0]?.nameGuj || 'પ્રમુખશ્રી');
  
  // Dynamic Agenda Topics / Proposed Resolutions
  const [agendaItems, setAgendaItems] = useState<string[]>([
    'ગત મિટિંગની પ્રોસીડિંગ્સ તથા પ્રોસીડિંગ બુક વાંચનમાં લઈ મંજૂર કરવી.',
    'નાણાકીય વર્ષના આવક-જાવક હિસાબો અને બેંક સિલકની સમીક્ષા તથા મંજૂરી.',
    'ટ્રસ્ટના સામાજિક/શૈક્ષણિક કલ્યાણ કાર્યક્રમો માટે બજેટની ફાળવણી કરવી.',
    'પ્રમુખશ્રીની પરવાનગીથી અન્ય પરચુરણ વિષયો અંગે ચર્ચા વિચારણા.'
  ]);
  const [newItemText, setNewItemText] = useState('');

  // Selected members for signature sheet
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    members.map(m => m.id)
  );

  const [isAgendaPrintView, setIsAgendaPrintView] = useState(false);

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800';

  const handleStartAdd = () => {
    setEditingTharav(null);
    setMeetingNumber(`૨૦૨૬/૦${tharavs.length + 1}`);
    setMeetingType('કારોબારી સભા (Executive Committee)');
    setMeetingDate(new Date().toISOString().split('T')[0]);
    setMeetingTime('૧૧:૦૦ AM');
    setVenueGuj(trustSettings?.addressGuj || 'ટ્રસ્ટ મુખ્ય કાર્યાલય');
    setChairpersonGuj(members[0]?.nameGuj || '');
    setPresentMembersGuj(members.map(m => m.nameGuj).join(', ') || '');
    setAgendaPointsGuj('૧. પાછલી પ્રોસીડિંગ્સ વંચાણે લેવી.\n૨. નાણાકીય હિસાબો રજૂ કરવા.');

    setTharavNumber(`ઠરાવ નં. ${tharavs.length + 1}`);
    setSubjectGuj('');
    setProposerGuj(members[0]?.nameGuj || '');
    setSeconderGuj(members[1]?.nameGuj || '');
    setStatusGuj('સર્વાનુમતે મંજૂર (Unanimously Passed)');
    setDescriptionGuj('');
    setActionAssignedToGuj('');
    setShowAddForm(true);
  };

  const handleStartEdit = (t: AgendaTharav) => {
    setEditingTharav(t);
    setMeetingNumber(t.meetingNumber);
    setMeetingType(t.meetingType);
    setMeetingDate(t.meetingDate);
    setMeetingTime(t.meetingTime || '૧૧:૦૦ AM');
    setVenueGuj(t.venueGuj || '');
    setChairpersonGuj(t.chairpersonGuj || '');
    setPresentMembersGuj(t.presentMembersGuj || '');
    setAgendaPointsGuj(t.agendaPointsGuj || '');

    setTharavNumber(t.tharavNumber);
    setSubjectGuj(t.subjectGuj);
    setProposerGuj(t.proposerGuj);
    setSeconderGuj(t.seconderGuj);
    setStatusGuj(t.statusGuj);
    setDescriptionGuj(t.descriptionGuj);
    setActionAssignedToGuj(t.actionAssignedToGuj || '');
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectGuj || !descriptionGuj || !proposerGuj || !seconderGuj) {
      alert('કૃપા કરીને ઠરાવનો વિગતવાર વિષય, સૂચક, અનુમોદક અને ઠરાવ લખાણ ભરો.');
      return;
    }

    if (editingTharav && onEditTharav) {
      onEditTharav({
        ...editingTharav,
        meetingNumber,
        meetingType,
        meetingDate,
        meetingTime,
        venueGuj,
        chairpersonGuj,
        presentMembersGuj,
        agendaPointsGuj,
        tharavNumber,
        subjectGuj,
        proposerGuj,
        seconderGuj,
        statusGuj,
        descriptionGuj,
        actionAssignedToGuj
      });
      alert(`✓ ઠરાવ "${tharavNumber}" ની વિગતો સફળતાપૂર્વક સુધારવામાં આવી.`);
    } else {
      onAddTharav({
        meetingNumber,
        meetingType,
        meetingDate,
        meetingTime,
        venueGuj,
        chairpersonGuj,
        presentMembersGuj,
        agendaPointsGuj,
        tharavNumber,
        subjectGuj,
        proposerGuj,
        seconderGuj,
        statusGuj,
        descriptionGuj,
        actionAssignedToGuj
      });
      alert(`✓ નવો ઠરાવ "${tharavNumber}" સફળતાપૂર્વક રજિસ્ટરમાં ઉમેરાઈ ગયો છે.`);
    }

    setShowAddForm(false);
    setEditingTharav(null);
  };

  // Agenda Item Handlers
  const handleAddAgendaItem = () => {
    if (!newItemText.trim()) return;
    setAgendaItems([...agendaItems, newItemText.trim()]);
    setNewItemText('');
  };

  const handleRemoveAgendaItem = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const handleToggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      setSelectedMemberIds(selectedMemberIds.filter(mId => mId !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleSelectAllMembers = () => {
    if (selectedMemberIds.length === members.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(members.map(m => m.id));
    }
  };

  // Filter logic for Tharavs
  const filteredTharavs = tharavs.filter(t => {
    const matchesSearch =
      t.subjectGuj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.descriptionGuj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tharavNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.proposerGuj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.seconderGuj.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === 'તમામ' ||
      t.meetingType.includes(filterType);

    return matchesSearch && matchesFilter;
  });

  const handlePrintTharav = (t: AgendaTharav) => {
    setSelectedTharavForPrint(t);
    setIsAgendaPrintView(false);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleDownloadTharavPDF = (t: AgendaTharav) => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="UTF-8">
  <title>Tharav_${t.tharavNumber.replace(/[/\\?%*:|"<>]/g, '_')}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Shruti', 'Gujarati', 'Noto Sans Gujarati', Arial, sans-serif; margin: 0; padding: 20px; color: #000; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
    .trust-name { font-size: 24px; font-weight: bold; margin: 0; }
    .reg-no { font-size: 13px; color: #333; margin: 4px 0; }
    .badge { display: inline-block; font-size: 15px; font-weight: bold; background: #f0f0f0; padding: 6px 20px; border: 1px solid #000; margin-top: 8px; text-transform: uppercase; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; background: #f9f9f9; padding: 12px; border: 1px solid #ccc; margin-bottom: 20px; }
    .desc-box { font-size: 14px; line-height: 1.8; background: #fff; padding: 15px; border: 1px solid #999; margin-bottom: 20px; white-space: pre-wrap; }
    .meta-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; margin-top: 15px; }
    .footer-sig { margin-top: 50px; display: flex; justify-content: space-between; font-size: 13px; }
    .sig-box { text-align: center; width: 200px; }
    .top-bar { text-align: right; margin-bottom: 20px; }
    .btn { padding: 10px 20px; background: #059669; color: white; border: none; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 14px; margin-left: 8px; }
    @media print { .top-bar { display: none !important; } }
  </style>
</head>
<body>
  <div class="top-bar">
    <button onclick="window.print()" class="btn">🖨️ પ્રિન્ટ / PDF ડાઉનલોડ કરો (Print / Save PDF)</button>
  </div>
  <div class="header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; gap: 15px;">
    <div style="width: 70px; height: 70px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
      <img src="${trustSettings?.logoUrl || '/logo.png'}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="Logo" />
    </div>
    <div style="flex: 1; text-align: center;">
      <h1 class="trust-name" style="margin: 0; font-size: 24px; font-weight: bold;">${trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ'}</h1>
      <div class="reg-no" style="font-size: 13px; color: #333; margin: 4px 0;">રજિસ્ટ્રેશન નં: ${trustSettings?.regNoGuj || 'એફ/૧૨૩૪૫/અમદાવાદ'} | ${trustSettings?.addressGuj || ''}</div>
      <div class="badge" style="display: inline-block; font-size: 15px; font-weight: bold; background: #f0f0f0; padding: 6px 20px; border: 1px solid #000; margin-top: 8px; text-transform: uppercase;">વિશેષ ઠરાવ નકલ (${t.tharavNumber})</div>
    </div>
    <div style="width: 70px; height: 70px; flex-shrink: 0; opacity: 0;"></div>
  </div>
  <div class="info-grid">
    <div><strong>મિટિંગ ક્રમાંક:</strong> ${t.meetingNumber}</div>
    <div><strong>સભા પ્રકાર:</strong> ${t.meetingType}</div>
    <div><strong>સભા તારીખ & સમય:</strong> ${t.meetingDate} (${t.meetingTime || '૧૧:૦૦ AM'})</div>
    <div><strong>સભા સ્થળ:</strong> ${t.venueGuj || '-'}</div>
    <div><strong>સભા પ્રમુખશ્રી:</strong> ${t.chairpersonGuj || '-'}</div>
    <div><strong>ઠરાવ સ્થિતિ:</strong> ${t.statusGuj}</div>
  </div>
  <div>
    <strong>ઠરાવનો વિષય (Subject):</strong>
    <div style="font-size: 15px; font-weight: bold; margin-top: 4px; margin-bottom: 12px; color: #111;">${t.subjectGuj}</div>
  </div>
  <div>
    <strong>ઠરાવનું સંપૂર્ણ લખાણ અને નિર્ણય (Resolution Text):</strong>
    <div class="desc-box">${t.descriptionGuj}</div>
  </div>
  <div class="meta-box">
    <div><strong>સૂચક સભ્યશ્રી (Proposer):</strong> ${t.proposerGuj}</div>
    <div><strong>અનુમોદક સભ્યશ્રી (Seconder):</strong> ${t.seconderGuj}</div>
    ${t.actionAssignedToGuj ? `<div style="grid-column: span 2;"><strong>અમલવારી જવાબદારી (Action Assigned):</strong> ${t.actionAssignedToGuj}</div>` : ''}
  </div>
  <div class="footer-sig">
    <div class="sig-box">
      <p><strong>સભા પ્રમુખશ્રીની સહી:</strong></p>
      <div style="border-top: 1px dashed #000; margin-top: 40px; padding-top: 4px;">${t.chairpersonGuj || 'પ્રમુખશ્રી'}</div>
    </div>
    <div class="sig-box">
      <p><strong>મંત્રીશ્રી / ટ્રસ્ટીશ્રી:</strong></p>
      <div style="border-top: 1px dashed #000; margin-top: 40px; padding-top: 4px;">સહી / સિક્કો</div>
    </div>
  </div>
</body>
</html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      setTimeout(() => {
        printWin.print();
      }, 300);
    } else {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tharav_${t.tharavNumber.replace(/[/\\?%*:|"<>]/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAllTharavsPDF = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="UTF-8">
  <title>Tharav_Register_Book</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Shruti', 'Gujarati', 'Noto Sans Gujarati', Arial, sans-serif; margin: 0; padding: 20px; color: #000; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .trust-name { font-size: 22px; font-weight: bold; margin: 0; }
    .reg-no { font-size: 12px; color: #333; margin: 3px 0; }
    .badge { display: inline-block; font-size: 14px; font-weight: bold; background: #f0f0f0; padding: 4px 16px; border: 1px solid #000; margin-top: 6px; text-transform: uppercase; }
    .tharav-item { margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px; page-break-inside: avoid; }
    .tharav-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; background: #eee; padding: 6px 10px; border: 1px solid #999; margin-bottom: 8px; }
    .desc { font-size: 13px; line-height: 1.6; margin: 8px 0; white-space: pre-wrap; }
    .meta { font-size: 12px; color: #444; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 6px; }
    .top-bar { text-align: right; margin-bottom: 20px; }
    .btn { padding: 8px 16px; background: #059669; color: white; border: none; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 13px; }
    @media print { .top-bar { display: none !important; } }
  </style>
</head>
<body>
  <div class="top-bar">
    <button onclick="window.print()" class="btn">🖨️ આખું ઠરાવ રજીસ્ટર પ્રિન્ટ / PDF ડાઉનલોડ કરો</button>
  </div>
  <div class="header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; gap: 15px;">
    <div style="width: 70px; height: 70px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
      <img src="${trustSettings?.logoUrl || '/logo.png'}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="Logo" />
    </div>
    <div style="flex: 1; text-align: center;">
      <h1 class="trust-name" style="margin: 0; font-size: 22px; font-weight: bold;">${trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ'}</h1>
      <div class="reg-no" style="font-size: 12px; color: #333; margin: 3px 0;">રજિસ્ટ્રેશન નં: ${trustSettings?.regNoGuj || 'એફ/૧૨૩૪૫/અમદાવાદ'} | ${trustSettings?.addressGuj || ''}</div>
      <div class="badge" style="display: inline-block; font-size: 14px; font-weight: bold; background: #f0f0f0; padding: 4px 16px; border: 1px solid #000; margin-top: 6px; text-transform: uppercase;">વાર્ષિક ઠરાવ રજિસ્ટર બુક (Tharav Register Book)</div>
    </div>
    <div style="width: 70px; height: 70px; flex-shrink: 0; opacity: 0;"></div>
  </div>
  <div>
    ${tharavs.map((t, index) => `
      <div class="tharav-item">
        <div class="tharav-header">
          <span>ક્રમ: ${index + 1} | ${t.tharavNumber}</span>
          <span>તારીખ: ${t.meetingDate} (${t.meetingType.split(' ')[0]})</span>
        </div>
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">વિષય: ${t.subjectGuj}</div>
        <div class="desc">${t.descriptionGuj}</div>
        <div class="meta">
          <div>સૂચક: <strong>${t.proposerGuj}</strong></div>
          <div>અનુમોદક: <strong>${t.seconderGuj}</strong></div>
          <div>સ્થિતિ: <strong>${t.statusGuj}</strong></div>
          <div>મિટિંગ નં: <strong>${t.meetingNumber}</strong></div>
          ${t.actionAssignedToGuj ? `<div style="grid-column: span 2;">અમલવારી: <strong>${t.actionAssignedToGuj}</strong></div>` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      setTimeout(() => {
        printWin.print();
      }, 300);
    } else {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tharav_Register_Book.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrintAgendaNotice = () => {
    setSelectedTharavForPrint(null);
    setIsAgendaPrintView(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleDownloadAgendaPDF = () => {
    const selectedMembers = members.filter(m => selectedMemberIds.includes(m.id));
    const htmlContent = `
<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="UTF-8">
  <title>Agenda_Notice_${agendaNoticeNo.replace(/[/\\?%*:|"<>]/g, '_')}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Shruti', 'Gujarati', 'Noto Sans Gujarati', Arial, sans-serif; margin: 0; padding: 20px; color: #000; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
    .trust-name { font-size: 22px; font-weight: bold; margin: 0; }
    .reg-no { font-size: 12px; color: #333; margin: 3px 0; }
    .badge { display: inline-block; font-size: 14px; font-weight: bold; background: #f0f0f0; padding: 4px 16px; border: 1px solid #000; margin-top: 6px; text-transform: uppercase; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; background: #f9f9f9; padding: 10px; border: 1px solid #ccc; margin-bottom: 15px; }
    .section-title { font-size: 13px; font-weight: bold; text-decoration: underline; margin-top: 15px; margin-bottom: 6px; }
    ol.agenda-list { font-size: 13px; line-height: 1.6; padding-left: 20px; margin-top: 4px; }
    ol.agenda-list li { margin-bottom: 4px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
    th { background-color: #eee; font-weight: bold; }
    .sig-line { border-bottom: 1px dashed #666; width: 85%; height: 24px; margin: 0 auto; }
    .footer-sig { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
    .sig-box { text-align: center; width: 180px; }
    .top-bar { text-align: right; margin-bottom: 15px; }
    .btn { padding: 8px 16px; background: #059669; color: white; border: none; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 13px; margin-left: 8px; }
    @media print { .top-bar { display: none !important; } }
  </style>
</head>
<body>
  <div class="top-bar">
    <button onclick="window.print()" class="btn">🖨️ પ્રિન્ટ / PDF ડાઉનલોડ કરો (Print / Save PDF)</button>
  </div>
  <div class="header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; gap: 15px;">
    <div style="width: 70px; height: 70px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
      <img src="${trustSettings?.logoUrl || '/logo.png'}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="Logo" />
    </div>
    <div style="flex: 1; text-align: center;">
      <h1 class="trust-name" style="margin: 0; font-size: 22px; font-weight: bold;">${trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ'}</h1>
      <div class="reg-no" style="font-size: 12px; color: #333; margin: 3px 0;">રજિસ્ટ્રેશન નં: ${trustSettings?.regNoGuj || 'એફ/૧૨૩૪૫/અમદાવાદ'} | ${trustSettings?.addressGuj || ''}</div>
      <div class="badge" style="display: inline-block; font-size: 14px; font-weight: bold; background: #f0f0f0; padding: 4px 16px; border: 1px solid #000; margin-top: 6px; text-transform: uppercase;">સભા એજન્ડા નોટિસ અને સભાસદોનું હાજરી-સહી પત્રક</div>
    </div>
    <div style="width: 70px; height: 70px; flex-shrink: 0; opacity: 0;"></div>
  </div>
  <div class="info-grid">
    <div><strong>નોટિસ ક્રમાંક:</strong> ${agendaNoticeNo}</div>
    <div><strong>સભાનો પ્રકાર:</strong> ${agendaMeetingType}</div>
    <div><strong>સભા તારીખ & સમય:</strong> ${agendaDate} (${agendaTime})</div>
    <div><strong>સભા સ્થળ:</strong> ${agendaVenue}</div>
    <div style="grid-column: span 2;"><strong>સભા ચેરમેન / પ્રમુખશ્રી:</strong> ${agendaChairperson}</div>
  </div>
  <div class="section-title">૧. સભામાં હાથ ધરવાના પ્રસ્તાવિત ઠરાવો / વિષયો (Agenda Topics):</div>
  <ol class="agenda-list">
    ${agendaItems.map(item => `<li>${item}</li>`).join('')}
  </ol>
  <div class="section-title">૨. સભ્યોનું નામ, હોદ્દો અને સહી પત્રક (Member Attendance & Signature Sheet):</div>
  <table>
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">ક્રમ</th>
        <th>સભ્યશ્રીનું નામ</th>
        <th>હોદ્દો</th>
        <th>મોબાઈલ</th>
        <th style="width: 170px; text-align: center;">હાજરી અને સહી (Signature)</th>
      </tr>
    </thead>
    <tbody>
      ${selectedMembers.map((m, idx) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-weight: bold;">${m.nameGuj}</td>
          <td>${m.roleGuj}</td>
          <td>${m.phone || '-'}</td>
          <td style="text-align: center;"><div class="sig-line"></div></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer-sig">
    <div class="sig-box">
      <p><strong>સભા પ્રમુખશ્રી:</strong></p>
      <div style="border-top: 1px dashed #000; margin-top: 35px; padding-top: 4px;">${agendaChairperson}</div>
    </div>
    <div class="sig-box">
      <p><strong>મંત્રીશ્રી / ટ્રસ્ટીશ્રી:</strong></p>
      <div style="border-top: 1px dashed #000; margin-top: 35px; padding-top: 4px;">સહી / સિક્કો</div>
    </div>
  </div>
</body>
</html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      setTimeout(() => {
        printWin.print();
      }, 300);
    } else {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Agenda_Notice_${agendaNoticeNo.replace(/[/\\?%*:|"<>]/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Main Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-indigo-600" />
            એજન્ડા અને ઠરાવ બુક (Agenda & Tharav Register)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            સભા એજન્ડા નોટિસ, પ્રસ્તાવિત ઠરાવો, સભ્યોની સહી પત્રક અને મંજૂર ઠરાવોની નોંધણી.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveModuleTab('tharavs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeModuleTab === 'tharavs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" /> ઠરાવ રજીસ્ટર ({tharavs.length})
          </button>
          <button
            onClick={() => setActiveModuleTab('agenda')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeModuleTab === 'agenda'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> એજન્ડા નોટિસ & સહી પત્રક
          </button>
        </div>
      </div>

      {/* TAB 1: THARAV REGISTER */}
      {activeModuleTab === 'tharavs' && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              કુલ નોંધાયેલા ઠરાવ પત્રકો: <strong className="text-indigo-600">{tharavs.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadAllTharavsPDF}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> આખું રજીસ્ટર PDF ડાઉનલોડ
              </button>
              {currentUser.role !== 'ReadOnly' && (
                <button
                  onClick={handleStartAdd}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> નવો ઠરાવ નોધો (Record Resolution)
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border ${cardBg} shadow-sm`}>
              <span className="text-[10px] text-slate-400 font-bold block">કુલ નોંધાયેલ ઠરાવ</span>
              <strong className="text-lg font-black text-indigo-600">{tharavs.length}</strong>
            </div>
            <div className={`p-4 rounded-2xl border ${cardBg} shadow-sm`}>
              <span className="text-[10px] text-slate-400 font-bold block">સર્વાનુમતે મંજૂર ઠરાવો</span>
              <strong className="text-lg font-black text-emerald-600">
                {tharavs.filter(t => t.statusGuj.includes('સર્વાનુમતે')).length}
              </strong>
            </div>
            <div className={`p-4 rounded-2xl border ${cardBg} shadow-sm`}>
              <span className="text-[10px] text-slate-400 font-bold block">કારોબારી સભા ઠરાવ</span>
              <strong className="text-lg font-black text-amber-600">
                {tharavs.filter(t => t.meetingType.includes('કારોબારી')).length}
              </strong>
            </div>
            <div className={`p-4 rounded-2xl border ${cardBg} shadow-sm`}>
              <span className="text-[10px] text-slate-400 font-bold block">વાર્ષિક સામાન્ય સભા (AGM)</span>
              <strong className="text-lg font-black text-purple-600">
                {tharavs.filter(t => t.meetingType.includes('AGM') || t.meetingType.includes('સાધારણ')).length}
              </strong>
            </div>
          </div>

          {/* Add / Edit Modal Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-6 rounded-2xl border ${cardBg} shadow-xl max-w-3xl mx-auto space-y-4`}
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-indigo-600 flex items-center gap-2">
                    {editingTharav ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingTharav ? 'ઠરાવ વિગતો સુધારો (Edit Resolution)' : 'નવી સભા એજન્ડા & ઠરાવ નોંધણી (New Tharav Entry)'}
                  </h3>
                  <button
                    onClick={() => { setShowAddForm(false); setEditingTharav(null); }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  {/* Meeting info box */}
                  <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-xl space-y-3">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 block flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" /> ૧. સભા અને એજન્ડા વિગતો (Meeting Details)
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1">મિટિંગ નંબર (Meeting No.) *</label>
                        <input
                          type="text"
                          value={meetingNumber}
                          onChange={(e) => setMeetingNumber(e.target.value)}
                          placeholder="દા.ત. ૨૦૨૬/૦૧"
                          className={`w-full p-2.5 rounded-xl font-bold ${inputBg}`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">સભાનો પ્રકાર (Meeting Type) *</label>
                        <select
                          value={meetingType}
                          onChange={(e) => setMeetingType(e.target.value as any)}
                          className={`w-full p-2.5 rounded-xl font-bold ${inputBg}`}
                        >
                          <option value="કારોબારી સભા (Executive Committee)">કારોબારી સભા (Executive Committee)</option>
                          <option value="સાધારણ સભા (General Board)">સાધારણ સભા (General Board)</option>
                          <option value="વાર્ષિક સાધારણ સભા (AGM)">વાર્ષિક સાધારણ સભા (AGM)</option>
                          <option value="ખાસ કટોકટી સભા (Emergency Meeting)">ખાસ કટોકટી સભા (Emergency Meeting)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">સભા તારીખ (Date) *</label>
                        <input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className={`w-full p-2.5 rounded-xl font-bold ${inputBg}`}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1">સભા સ્થળ (Venue)</label>
                        <input
                          type="text"
                          value={venueGuj}
                          onChange={(e) => setVenueGuj(e.target.value)}
                          placeholder="ટ્રસ્ટ ઓફિસ / હોલ"
                          className={`w-full p-2.5 rounded-xl ${inputBg}`}
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">સભા પ્રમુખશ્રી / ચેરમેન (Chairperson)</label>
                        <input
                          type="text"
                          value={chairpersonGuj}
                          onChange={(e) => setChairpersonGuj(e.target.value)}
                          placeholder="સભા પ્રમુખશ્રીનું નામ"
                          className={`w-full p-2.5 rounded-xl ${inputBg}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">હાજર સભ્યોની યાદી (Present Members)</label>
                      <input
                        type="text"
                        value={presentMembersGuj}
                        onChange={(e) => setPresentMembersGuj(e.target.value)}
                        placeholder="દા.ત. મોહમ્મદ હસન, અબ્દુલ રહીમ, ઇબ્રાહીમ અહેમદ..."
                        className={`w-full p-2.5 rounded-xl ${inputBg}`}
                      />
                      {members.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] text-slate-400">સભ્યો ઝડપી ઉમેરો:</span>
                          {members.slice(0, 5).map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                if (!presentMembersGuj.includes(m.nameGuj)) {
                                  setPresentMembersGuj(prev => prev ? `${prev}, ${m.nameGuj}` : m.nameGuj);
                                }
                              }}
                              className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold"
                            >
                              + {m.nameGuj}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tharav section */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-indigo-600" /> ૨. ઠરાવ વિગતો (Resolution Specification)
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1">ઠરાવ નંબર (Tharav No.) *</label>
                        <input
                          type="text"
                          value={tharavNumber}
                          onChange={(e) => setTharavNumber(e.target.value)}
                          placeholder="દા.ત. ઠરાવ નં. ૧"
                          className={`w-full p-2.5 rounded-xl font-mono font-bold ${inputBg}`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">ઠરાવ સ્થિતિ (Resolution Status) *</label>
                        <select
                          value={statusGuj}
                          onChange={(e) => setStatusGuj(e.target.value as any)}
                          className={`w-full p-2.5 rounded-xl font-bold ${inputBg}`}
                        >
                          <option value="સર્વાનુમતે મંજૂર (Unanimously Passed)">સર્વાનુમતે મંજૂર (Unanimously Passed)</option>
                          <option value="બહુમતીથી મંજૂર (Passed by Majority)">બહુમતીથી મંજૂર (Passed by Majority)</option>
                          <option value="મુલતવી (Deferred/Rejected)">મુલતવી (Deferred/Rejected)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">ઠરાવનો વિષય (Subject / Agenda Topic) *</label>
                      <input
                        type="text"
                        value={subjectGuj}
                        onChange={(e) => setSubjectGuj(e.target.value)}
                        placeholder="દા.ત. વાર્ષિક હિસાબો તથા ઓડિટ રિપોર્ટ મંજૂર કરવા બાબત..."
                        className={`w-full p-2.5 rounded-xl font-bold ${inputBg}`}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1">સૂચક સભ્યશ્રી (Proposed By) *</label>
                        <input
                          type="text"
                          value={proposerGuj}
                          onChange={(e) => setProposerGuj(e.target.value)}
                          placeholder="સૂચક ટ્રસ્ટીનું નામ"
                          className={`w-full p-2.5 rounded-xl font-bold ${inputBg}`}
                          required
                        />
                        {members.length > 0 && (
                          <select
                            onChange={(e) => e.target.value && setProposerGuj(e.target.value)}
                            className="mt-1 w-full p-1 text-[11px] bg-transparent text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg"
                          >
                            <option value="">-- સભ્યોમાંથી પસંદ કરો --</option>
                            {members.map(m => (
                              <option key={m.id} value={m.nameGuj}>{m.nameGuj} ({m.roleGuj.split(' ')[0]})</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold mb-1">અનુમોદક સભ્યશ્રી (Seconded By) *</label>
                        <input
                          type="text"
                          value={seconderGuj}
                          onChange={(e) => setSeconderGuj(e.target.value)}
                          placeholder="અનુમોદક ટ્રસ્ટીનું નામ"
                          className={`w-full p-2.5 rounded-xl font-bold ${inputBg}`}
                          required
                        />
                        {members.length > 0 && (
                          <select
                            onChange={(e) => e.target.value && setSeconderGuj(e.target.value)}
                            className="mt-1 w-full p-1 text-[11px] bg-transparent text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg"
                          >
                            <option value="">-- સભ્યોમાંથી પસંદ કરો --</option>
                            {members.map(m => (
                              <option key={m.id} value={m.nameGuj}>{m.nameGuj} ({m.roleGuj.split(' ')[0]})</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">ઠરાવનું સંપૂર્ણ લખાણ અને નિર્ણય (Resolution Text) *</label>
                      <textarea
                        rows={4}
                        value={descriptionGuj}
                        onChange={(e) => setDescriptionGuj(e.target.value)}
                        placeholder="આજની સભામાં રજૂ થયેલ એજન્ડા મુજબ તમામ ટ્રસ્ટીશ્રીઓની ઉપસ્થિતિમાં ચર્ચા વિચારણા કરી નિર્ણય લેવામાં આવ્યો કે..."
                        className={`w-full p-2.5 rounded-xl ${inputBg}`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">અમલવારી કરવાની જવાબદારી (Action Assigned To)</label>
                      <input
                        type="text"
                        value={actionAssignedToGuj}
                        onChange={(e) => setActionAssignedToGuj(e.target.value)}
                        placeholder="દા.ત. પ્રમુખશ્રી / મંત્રીશ્રી / મેનેજરશ્રી"
                        className={`w-full p-2.5 rounded-xl ${inputBg}`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setShowAddForm(false); setEditingTharav(null); }}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
                    >
                      રદ કરો (Cancel)
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {editingTharav ? 'ફેરફાર સેવ કરો (Update Tharav)' : 'ઠરાવ સાચવો (Save Resolution)'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter and Search Bar */}
          <div className={`p-4 rounded-2xl border ${cardBg} shadow-sm space-y-3`}>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="ઠરાવ નં, વિષય, સૂચક કે લખાણથી શોધો..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs ${inputBg}`}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                {['તમામ', 'કારોબારી', 'સાધારણ', 'AGM'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      filterType === type
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resolution Cards List */}
          <div className="space-y-4">
            {filteredTharavs.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border ${cardBg} space-y-3`}>
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 font-bold">કોઈ ઠરાવ મળ્યો નથી.</p>
                {currentUser.role !== 'ReadOnly' && (
                  <button
                    onClick={handleStartAdd}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> પ્રથમ ઠરાવ ઉમેરો
                  </button>
                )}
              </div>
            ) : (
              filteredTharavs.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl border ${cardBg} shadow-sm hover:shadow-md transition-all space-y-3`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-black text-xs rounded-xl">
                        {t.tharavNumber}
                      </span>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-snug">
                          {t.subjectGuj}
                        </h3>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>મિટિંગ નં: {t.meetingNumber}</span>
                          <span>•</span>
                          <span>{t.meetingType.split(' ')[0]}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t.meetingDate}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                          t.statusGuj.includes('સર્વાનુમતે')
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {t.statusGuj.split(' ')[0]}
                      </span>

                      <button
                        onClick={() => handlePrintTharav(t)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                        title="ઠરાવ નકલ પ્રિન્ટ કરો"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDownloadTharavPDF(t)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                        title="ઠરાવ PDF ડાઉનલોડ કરો"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {currentUser.role !== 'ReadOnly' && (
                        <button
                          onClick={() => handleStartEdit(t)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                          title="સુધારો કરો"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {currentUser.role === 'Admin' && onDeleteTharav && (
                        <button
                          onClick={() => {
                            if (confirm(`શું તમે ઠરાવ "${t.tharavNumber}" ખરેખર કાઢી નાખવા માંગો છો?`)) {
                              onDeleteTharav(t.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="ડીલીટ કરો"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Resolution Content */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-2 text-xs">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">
                      {t.descriptionGuj}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400">સૂચક સભ્ય:</span>{' '}
                        <strong className="text-slate-700 dark:text-slate-200">{t.proposerGuj}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">અનુમોદક સભ્ય:</span>{' '}
                        <strong className="text-slate-700 dark:text-slate-200">{t.seconderGuj}</strong>
                      </div>
                      {t.actionAssignedToGuj && (
                        <div>
                          <span className="text-slate-400">અમલવારી જવાબદારી:</span>{' '}
                          <strong className="text-indigo-600 dark:text-indigo-400">{t.actionAssignedToGuj}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AGENDA NOTICE & MEMBER ATTENDANCE SIGNATURE SHEET */}
      {activeModuleTab === 'agenda' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-6`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="font-bold text-base text-indigo-600 flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-indigo-600" />
                  સભા એજન્ડા નોટિસ અને સભ્યોનું સહી પત્રક જનરેટર
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  મિટિંગ નોટિસ, ચર્ચાવાના પ્રસ્તાવિત ઠરાવોનું લિસ્ટ અને સભ્યોની ભૌતિક સહી માટેની બ્લેન્ક લાઈન ધરાવતું ઓફિશિયલ પત્રક બનાવો.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintAgendaNotice}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  પ્રિન્ટ કરો (Print Notice)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAgendaPDF}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  PDF / Save PDF (ડાઉનલોડ)
                </button>
              </div>
            </div>

            {/* Agenda Details Controls Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              {/* Left Column: Meeting Particulars */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Calendar className="w-4 h-4 text-indigo-600" /> ૧. મિટિંગ અને નોટિસ વિગતો
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">એજન્ડા / નોટિસ ક્રમાંક</label>
                    <input
                      type="text"
                      value={agendaNoticeNo}
                      onChange={(e) => setAgendaNoticeNo(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-bold ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">સભાનો પ્રકાર</label>
                    <select
                      value={agendaMeetingType}
                      onChange={(e) => setAgendaMeetingType(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-bold ${inputBg}`}
                    >
                      <option value="કારોબારી સભા (Executive Committee)">કારોબારી સભા (Executive Committee)</option>
                      <option value="સાધારણ સભા (General Board)">સાધારણ સભા (General Board)</option>
                      <option value="વાર્ષિક સાધારણ સભા (AGM)">વાર્ષિક સાધારણ સભા (AGM)</option>
                      <option value="ખાસ કટોકટી સભા (Emergency Meeting)">ખાસ કટોકટી સભા (Emergency Meeting)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">સભા તારીખ</label>
                    <input
                      type="date"
                      value={agendaDate}
                      onChange={(e) => setAgendaDate(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-bold ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">સભા સમય</label>
                    <input
                      type="text"
                      value={agendaTime}
                      onChange={(e) => setAgendaTime(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-bold ${inputBg}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">સભા સ્થળ</label>
                    <input
                      type="text"
                      value={agendaVenue}
                      onChange={(e) => setAgendaVenue(e.target.value)}
                      className={`w-full p-2.5 rounded-xl ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">સભા પ્રમુખશ્રીનું નામ</label>
                    <input
                      type="text"
                      value={agendaChairperson}
                      onChange={(e) => setAgendaChairperson(e.target.value)}
                      className={`w-full p-2.5 rounded-xl ${inputBg}`}
                    />
                  </div>
                </div>

                {/* List of Agenda Points / Proposed Resolutions */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4 text-indigo-600" /> ૨. સભામાં હાથ ધરવાના મુદ્દાઓ / પ્રસ્તાવિત ઠરાવો
                    </label>
                    <span className="text-[10px] text-indigo-600 font-bold">કુલ: {agendaItems.length} વિષયો</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {agendaItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="font-black text-indigo-600 shrink-0 w-6 text-center">{idx + 1}.</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...agendaItems];
                            updated[idx] = e.target.value;
                            setAgendaItems(updated);
                          }}
                          className={`flex-1 bg-transparent border-none text-xs text-slate-800 dark:text-slate-100 focus:outline-none`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAgendaItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="કાઢી નાખો"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="નવો પ્રસ્તાવિત ઠરાવ / મુદ્દો ઉમેરો..."
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAgendaItem(); } }}
                      className={`flex-1 p-2 rounded-xl text-xs ${inputBg}`}
                    />
                    <button
                      type="button"
                      onClick={handleAddAgendaItem}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> ઉમેરો
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Member Selection for Signature Sheet */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" /> ૩. સહી પત્રકમાં સમાવેશ કરવાના ટ્રસ્ટીઓ / સભ્યો ({selectedMemberIds.length}/{members.length})
                  </h3>

                  <button
                    type="button"
                    onClick={handleSelectAllMembers}
                    className="text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    {selectedMemberIds.length === members.length ? 'બધા દૂર કરો' : 'બધા સભ્યો પસંદ કરો'}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  આ પત્રકમાં નીચે પસંદ કરેલા દરેક સભ્યોના નામ સામે સહી માટે ખાલી લાઇન (Blank Signature Space) પ્રિન્ટ થશે.
                </p>

                <div className="max-h-80 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
                  {members.map((m) => {
                    const isSelected = selectedMemberIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleMember(m.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                            : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <div>
                            <strong className="block text-slate-800 dark:text-slate-100 font-bold">{m.nameGuj}</strong>
                            <span className="text-[10px] text-slate-500">{m.roleGuj} • {m.phone || 'મોબાઈલ નથી'}</span>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">સહી લાઇન તૈયાર</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live On-Screen Preview Box */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> પ્રિન્ટ પ્રિવ્યૂ નમૂનો (Live Sheet Preview)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrintAgendaNotice}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> પ્રિન્ટ કરો
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadAgendaPDF}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> PDF સેવ / ડાઉનલોડ
                  </button>
                </div>
              </div>

              {/* Embedded Document Preview */}
              <div className="p-6 bg-white text-slate-900 rounded-xl shadow-inner border border-slate-300 font-serif space-y-4 max-w-2xl mx-auto text-xs">
                <div className="text-center border-b pb-3">
                  <h3 className="font-bold text-base text-black">{trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ'}</h3>
                  <p className="text-[11px] text-gray-600">રજિસ્ટ્રેશન નં: {trustSettings?.regNoGuj || 'એફ/૧૨૩૪૫/અમદાવાદ'} | {trustSettings?.addressGuj}</p>
                  <div className="mt-2 text-xs font-black bg-gray-100 py-1 border border-gray-300 uppercase tracking-wide">
                    સભા એજન્ડા નોટિસ અને સભ્યોનું સહી પત્રક
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded border border-gray-200">
                  <div><strong>નોટિસ નં:</strong> {agendaNoticeNo}</div>
                  <div><strong>સભા પ્રકાર:</strong> {agendaMeetingType}</div>
                  <div><strong>તારીખ/સમય:</strong> {agendaDate} ({agendaTime})</div>
                  <div><strong>સ્થળ:</strong> {agendaVenue}</div>
                </div>

                <div>
                  <strong className="block text-xs mb-1 text-black font-sans font-bold">કયા કયા ઠરાવો કરવાના છે તેનું લિસ્ટ (Agenda Topics):</strong>
                  <ol className="list-decimal list-inside space-y-1 bg-amber-50/50 p-2.5 rounded border border-amber-200 text-[11px]">
                    {agendaItems.map((item, i) => (
                      <li key={i} className="leading-snug">{item}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <strong className="block text-xs mb-1.5 text-black font-sans font-bold">હાજર સભ્યોનું નામ અને સહી પત્રક (Member Signature Table):</strong>
                  <table className="w-full text-left border-collapse border border-gray-400 text-[11px]">
                    <thead>
                      <tr className="bg-gray-200 text-black">
                        <th className="border border-gray-400 p-1 text-center w-8">ક્રમ</th>
                        <th className="border border-gray-400 p-1">સભ્યશ્રીનું નામ</th>
                        <th className="border border-gray-400 p-1">હોદ્દો</th>
                        <th className="border border-gray-400 p-1 w-32 text-center">હાજરી અને સહી (Signature)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.filter(m => selectedMemberIds.includes(m.id)).map((m, index) => (
                        <tr key={m.id} className="border-b border-gray-300">
                          <td className="border border-gray-400 p-1 text-center font-bold">{index + 1}</td>
                          <td className="border border-gray-400 p-1 font-bold">{m.nameGuj}</td>
                          <td className="border border-gray-400 p-1">{m.roleGuj}</td>
                          <td className="border border-gray-400 p-2 text-center text-gray-300 font-mono text-[10px]">
                            <span className="inline-block border-b border-dashed border-gray-400 w-24 h-4"></span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-6 flex justify-between text-[11px]">
                  <div>
                    <p className="font-bold">પ્રમુખશ્રી:</p>
                    <p className="pt-6 border-t border-dashed border-gray-400 w-28 text-center">{agendaChairperson}</p>
                  </div>
                  <div>
                    <p className="font-bold">મંત્રીશ્રી / ટ્રસ્ટીશ્રી:</p>
                    <p className="pt-6 border-t border-dashed border-gray-400 w-28 text-center">સહી / સિક્કો</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT AREA 1: Printable Tharav Copy (Visible only during printing when selectedTharavForPrint is set) */}
      {selectedTharavForPrint && (
        <div id="printable-tharav-area" className="hidden print:block print:p-8 bg-white text-black font-serif space-y-6">
          <div className="flex items-center gap-4 border-b pb-4">
            <img src={trustSettings?.logoUrl || '/logo.png'} className="w-16 h-16 object-contain shrink-0" referrerPolicy="no-referrer" alt="Trust Logo" />
            <div className="text-center flex-1 space-y-1">
              <h2 className="text-2xl font-bold text-black">{trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ'}</h2>
              <p className="text-sm text-gray-600">નોંધણી નં: {trustSettings?.regNoGuj || 'એફ/૧૨૩૪૫/અમદાવાદ'}</p>
              <p className="text-xs text-gray-500">{trustSettings?.addressGuj}</p>
            </div>
            <div className="w-16 h-16 opacity-0 shrink-0"></div>
          </div>
          <div className="text-lg font-bold underline pt-2 text-center">સભાસદ/ટ્રસ્ટી મિટિંગ ઠરાવ રજીસ્ટર નકલ</div>

          <div className="flex justify-between text-xs border-b pb-2">
            <div><strong>મિટિંગ નં:</strong> {selectedTharavForPrint.meetingNumber} ({selectedTharavForPrint.meetingType})</div>
            <div><strong>સભા તારીખ:</strong> {selectedTharavForPrint.meetingDate}</div>
            <div><strong>સ્થળ:</strong> {selectedTharavForPrint.venueGuj || 'ટ્રસ્ટ કાર્યાલય'}</div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">{selectedTharavForPrint.tharavNumber}</span>
              <span className="font-bold border border-black px-2 py-0.5 text-xs">{selectedTharavForPrint.statusGuj}</span>
            </div>

            <div>
              <strong className="text-sm block mb-1">ઠરાવનો વિષય:</strong>
              <div className="text-sm font-bold bg-gray-100 p-2 rounded">{selectedTharavForPrint.subjectGuj}</div>
            </div>

            <div>
              <strong className="text-sm block mb-1">ઠરાવનું સંપૂર્ણ લખાણ:</strong>
              <div className="text-xs leading-relaxed whitespace-pre-wrap border p-4 rounded min-h-[150px]">
                {selectedTharavForPrint.descriptionGuj}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t">
              <div><strong>સૂચક સભ્યનું નામ:</strong> {selectedTharavForPrint.proposerGuj}</div>
              <div><strong>અનુમોદક સભ્યનું નામ:</strong> {selectedTharavForPrint.seconderGuj}</div>
            </div>
          </div>

          <div className="pt-16 grid grid-cols-3 text-center text-xs border-t">
            <div>
              <div className="pt-8 border-t border-dashed w-32 mx-auto">સૂચકની સહી</div>
            </div>
            <div>
              <div className="pt-8 border-t border-dashed w-32 mx-auto">અનુમોદકની સહી</div>
            </div>
            <div>
              <div className="pt-8 border-t border-dashed w-32 mx-auto">પ્રમુખશ્રી / મંત્રીશ્રીની સહી</div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT AREA 2: Printable Agenda Notice & Member Attendance Signature Sheet */}
      {isAgendaPrintView && (
        <div id="printable-agenda-area" className="hidden print:block print:p-8 bg-white text-black font-serif space-y-6">
          <div className="flex items-center gap-4 border-b pb-4">
            <img src={trustSettings?.logoUrl || '/logo.png'} className="w-16 h-16 object-contain shrink-0" referrerPolicy="no-referrer" alt="Trust Logo" />
            <div className="text-center flex-1 space-y-1">
              <h1 className="text-2xl font-bold text-black">{trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ'}</h1>
              <p className="text-xs text-gray-700">નોંધણી નં: {trustSettings?.regNoGuj || 'એફ/૧૨૩૪૫/અમદાવાદ'}</p>
              <p className="text-xs text-gray-600">{trustSettings?.addressGuj}</p>
            </div>
            <div className="w-16 h-16 opacity-0 shrink-0"></div>
          </div>
          <div className="text-base font-bold underline pt-3 uppercase text-center">
            સભા એજન્ડા નોટિસ અને સભાસદોનું હાજરી-સહી પત્રક
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border p-3 bg-gray-50 rounded">
            <div><strong>નોટિસ ક્રમાંક:</strong> {agendaNoticeNo}</div>
            <div><strong>સભાનો પ્રકાર:</strong> {agendaMeetingType}</div>
            <div><strong>સભા તારીખ & સમય:</strong> {agendaDate} ({agendaTime})</div>
            <div><strong>સભા સ્થળ:</strong> {agendaVenue}</div>
            <div className="col-span-2"><strong>સભા ચેરમેન / પ્રમુખશ્રી:</strong> {agendaChairperson}</div>
          </div>

          {/* Agenda Items / Proposed Resolutions */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm underline">ચર્ચાવાના વિષયો / પ્રસ્તાવિત ઠરાવોની યાદી (Agenda Topics):</h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs pl-2">
              {agendaItems.map((item, idx) => (
                <li key={idx} className="leading-relaxed font-semibold">{item}</li>
              ))}
            </ol>
          </div>

          {/* Member Attendance & Signature Table */}
          <div className="space-y-2 pt-2">
            <h3 className="font-bold text-sm underline">ઉપસ્થિત સભ્યોનું નામ અને સહી પત્રક (Member Attendance & Signature Sheet):</h3>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-100 text-black">
                  <th className="border border-black p-2 text-center w-10">ક્રમ</th>
                  <th className="border border-black p-2 text-left">સભ્યશ્રીનું નામ</th>
                  <th className="border border-black p-2 text-left">હોદ્દો</th>
                  <th className="border border-black p-2 text-left">મોબાઈલ</th>
                  <th className="border border-black p-2 text-center w-40">હાજરી અને સહી (Signature)</th>
                </tr>
              </thead>
              <tbody>
                {members.filter(m => selectedMemberIds.includes(m.id)).map((m, index) => (
                  <tr key={m.id}>
                    <td className="border border-black p-2 text-center font-bold">{index + 1}</td>
                    <td className="border border-black p-2 font-bold">{m.nameGuj}</td>
                    <td className="border border-black p-2">{m.roleGuj}</td>
                    <td className="border border-black p-2">{m.phone || '-'}</td>
                    <td className="border border-black p-2 h-10 text-center">
                      <span className="inline-block border-b border-dashed border-gray-400 w-32 h-4 mt-2"></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-12 grid grid-cols-2 text-xs border-t">
            <div>
              <p className="font-bold">સભા પ્રમુખશ્રીની સહી:</p>
              <div className="pt-10 border-t border-dashed w-40 mt-6">{agendaChairperson}</div>
            </div>
            <div className="text-right">
              <p className="font-bold">મંત્રીશ્રી / ટ્રસ્ટીશ્રીની સહી:</p>
              <div className="pt-10 border-t border-dashed w-40 ml-auto mt-6">સહી / સિક્કો</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
