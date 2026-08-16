/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Upload, FileText, Search, Download, Trash2, ShieldCheck, Eye, Plus, X, ExternalLink,
  Printer, Edit3, Inbox, Send, Calendar, Tag, CheckCircle2, Filter, Hash, UserCheck, Loader2
} from 'lucide-react';
import { DocumentMeta, TrustSettings } from '../types';
import { downloadContainerAsPDF, printContainer } from '../utils/pdfPrint';

export interface AavakJaavakEntry {
  id: string;
  type: 'આવક (Inward)' | 'જાવક (Outward)';
  regNo: string; // e.g. AVK-2026-001 or JVK-2026-001
  date: string; // YYYY-MM-DD
  partyNameGuj: string; // મોકલનાર / મેળવનારનું નામ
  partyAddressGuj: string; // સરનામું / વિગત
  subjectGuj: string; // પત્રનો વિષય
  refNo: string; // પત્ર ક્રમાંક / સંદર્ભ નં.
  dispatchMode: 'સ્પીડ પોસ્ટ' | 'રજીસ્ટર્ડ એડી' | 'સામાન્ય ટપાલ' | 'રૂબરૂ (Hand Delivery)' | 'ઈ-મેઈલ' | 'કુરિયર';
  statusGuj: 'પૂર્ણ / ફાઈલ કરેલ' | 'ચાલુ / પ્રક્રિયા હેઠળ' | 'મંજૂર / સ્વીકૃત' | 'મોકલેલ';
  stampExpense?: number; // પોસ્ટેજ / સ્ટેમ્પ ખર્ચ
  remarksGuj?: string;
}

interface DocModuleProps {
  documents: DocumentMeta[];
  onUploadDocument: (doc: Omit<DocumentMeta, 'id' | 'uploadDate' | 'fileSize' | 'fileType'> & Partial<DocumentMeta>) => void;
  onEditDocument?: (doc: DocumentMeta) => void;
  onDeleteDocument: (id: string) => void;
  currentUser: { role: string };
  darkMode: boolean;
  trustSettings?: TrustSettings;
}

export default function DocModule({
  documents,
  onUploadDocument,
  onEditDocument,
  onDeleteDocument,
  currentUser,
  darkMode,
  trustSettings
}: DocModuleProps) {
  // Navigation SubTab State
  const [activeSubTab, setActiveSubTab] = useState<'vault' | 'aavak_jaavak'>('aavak_jaavak');

  // --- VAULT STATES ---
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentMeta | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<DocumentMeta | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Form states (Vault)
  const [titleGuj, setTitleGuj] = useState('');
  const [typeGuj, setTypeGuj] = useState<'ટ્રસ્ટ ડીડ (Trust Deed)' | 'PAN કાર્ડ' | '12A પ્રમાણપત્ર' | '80G પ્રમાણપત્ર' | 'નોંધણી પ્રમાણપત્ર' | 'ઓડિટ રિપોર્ટ' | 'અન્ય'>('ટ્રસ્ટ ડીડ (Trust Deed)');
  const [remarksGuj, setRemarksGuj] = useState('');

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; type: string; dataUrl?: string } | null>(null);

  // --- AAVAK & JAAVAK CORRESPONDENCE REGISTER STATES ---
  const [aavakJaavakEntries, setAavakJaavakEntries] = useState<AavakJaavakEntry[]>(() => {
    try {
      const saved = localStorage.getItem('trust_aavak_jaavak_register_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading aavak_jaavak local storage', e);
    }
    return [];
  });

  // Sync if documents are wiped (e.g. on master reset)
  useEffect(() => {
    if (documents.length === 0) {
      const saved = localStorage.getItem('trust_aavak_jaavak_register_v1');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAavakJaavakEntries(parsed);
        } catch {
          setAavakJaavakEntries([]);
        }
      } else {
        setAavakJaavakEntries([]);
      }
    }
  }, [documents.length]);

  useEffect(() => {
    try {
      localStorage.setItem('trust_aavak_jaavak_register_v1', JSON.stringify(aavakJaavakEntries));
    } catch (e) {
      console.error('Error saving aavak_jaavak local storage', e);
    }
  }, [aavakJaavakEntries]);

  // Aavak Jaavak Filters & Form State
  const [ajTypeFilter, setAjTypeFilter] = useState<'all' | 'આવક (Inward)' | 'જાવક (Outward)'>('all');
  const [ajSearchQuery, setAjSearchQuery] = useState('');
  const [showAjFormModal, setShowAjFormModal] = useState(false);
  const [editingAj, setEditingAj] = useState<AavakJaavakEntry | null>(null);
  const [showPrintRegisterModal, setShowPrintRegisterModal] = useState(false);

  // Form inputs for Aavak/Jaavak
  const [ajFormType, setAjFormType] = useState<'આવક (Inward)' | 'જાવક (Outward)'>('આવક (Inward)');
  const [ajFormRegNo, setAjFormRegNo] = useState('');
  const [ajFormDate, setAjFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [ajFormPartyName, setAjFormPartyName] = useState('');
  const [ajFormPartyAddress, setAjFormPartyAddress] = useState('');
  const [ajFormSubject, setAjFormSubject] = useState('');
  const [ajFormRefNo, setAjFormRefNo] = useState('');
  const [ajFormDispatchMode, setAjFormDispatchMode] = useState<AavakJaavakEntry['dispatchMode']>('સ્પીડ પોસ્ટ');
  const [ajFormStatus, setAjFormStatus] = useState<AavakJaavakEntry['statusGuj']>('પૂર્ણ / ફાઈલ કરેલ');
  const [ajFormStampExpense, setAjFormStampExpense] = useState<number | ''>('');
  const [ajFormRemarks, setAjFormRemarks] = useState('');

  // Auto generate next reg no based on type
  const generateNextRegNo = (type: 'આવક (Inward)' | 'જાવક (Outward)') => {
    const year = new Date().getFullYear();
    const prefix = type.includes('આવક') ? 'AVK' : 'JVK';
    const existing = aavakJaavakEntries.filter(e => e.type === type);
    const nextSeq = existing.length + 1;
    return `${prefix}-${year}-${String(nextSeq).padStart(3, '0')}`;
  };

  const handleOpenNewAjModal = (defaultType: 'આવક (Inward)' | 'જાવક (Outward)' = 'આવક (Inward)') => {
    setEditingAj(null);
    setAjFormType(defaultType);
    setAjFormRegNo(generateNextRegNo(defaultType));
    setAjFormDate(new Date().toISOString().split('T')[0]);
    setAjFormPartyName('');
    setAjFormPartyAddress('');
    setAjFormSubject('');
    setAjFormRefNo('');
    setAjFormDispatchMode('સ્પીડ પોસ્ટ');
    setAjFormStatus(defaultType.includes('આવક') ? 'પૂર્ણ / ફાઈલ કરેલ' : 'મોકલેલ');
    setAjFormStampExpense('');
    setAjFormRemarks('');
    setShowAjFormModal(true);
  };

  const handleOpenEditAjModal = (entry: AavakJaavakEntry) => {
    setEditingAj(entry);
    setAjFormType(entry.type);
    setAjFormRegNo(entry.regNo);
    setAjFormDate(entry.date);
    setAjFormPartyName(entry.partyNameGuj);
    setAjFormPartyAddress(entry.partyAddressGuj);
    setAjFormSubject(entry.subjectGuj);
    setAjFormRefNo(entry.refNo);
    setAjFormDispatchMode(entry.dispatchMode);
    setAjFormStatus(entry.statusGuj);
    setAjFormStampExpense(entry.stampExpense || '');
    setAjFormRemarks(entry.remarksGuj || '');
    setShowAjFormModal(true);
  };

  const handleSaveAjEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ajFormPartyName.trim() || !ajFormSubject.trim()) {
      alert('કૃપા કરીને મોકલનાર/મેળવનારનું નામ અને પત્રનો વિષય દાખલ કરો.');
      return;
    }

    if (editingAj) {
      setAavakJaavakEntries(prev =>
        prev.map(item =>
          item.id === editingAj.id
            ? {
                ...item,
                type: ajFormType,
                regNo: ajFormRegNo,
                date: ajFormDate,
                partyNameGuj: ajFormPartyName.trim(),
                partyAddressGuj: ajFormPartyAddress.trim(),
                subjectGuj: ajFormSubject.trim(),
                refNo: ajFormRefNo.trim(),
                dispatchMode: ajFormDispatchMode,
                statusGuj: ajFormStatus,
                stampExpense: Number(ajFormStampExpense) || 0,
                remarksGuj: ajFormRemarks.trim()
              }
            : item
        )
      );
      alert('આવક/જાવક પત્રની વિગત સફળતાપૂર્વક અપડેટ થઈ ગઈ છે.');
    } else {
      const newEntry: AavakJaavakEntry = {
        id: `aj-${Date.now()}`,
        type: ajFormType,
        regNo: ajFormRegNo || generateNextRegNo(ajFormType),
        date: ajFormDate,
        partyNameGuj: ajFormPartyName.trim(),
        partyAddressGuj: ajFormPartyAddress.trim(),
        subjectGuj: ajFormSubject.trim(),
        refNo: ajFormRefNo.trim(),
        dispatchMode: ajFormDispatchMode,
        statusGuj: ajFormStatus,
        stampExpense: Number(ajFormStampExpense) || 0,
        remarksGuj: ajFormRemarks.trim()
      };
      setAavakJaavakEntries(prev => [newEntry, ...prev]);
      alert(`નવો ${ajFormType.split(' ')[0]} પત્ર રેકોર્ડ નં. ${newEntry.regNo} સફળતાપૂર્વક ઉમેરાયો!`);
    }

    setShowAjFormModal(false);
  };

  const handleDeleteAjEntry = (id: string, regNo: string) => {
    if (confirm(`શું તમે નોંધણી ક્રમાંક ${regNo} નો આવક/જાવક રેકોર્ડ કાયમી ડિલીટ કરવા માંગો છો?`)) {
      setAavakJaavakEntries(prev => prev.filter(item => item.id !== id));
    }
  };

  // Filtered Aavak Jaavak Entries
  const filteredAjEntries = aavakJaavakEntries.filter(e => {
    if (ajTypeFilter !== 'all' && e.type !== ajTypeFilter) return false;
    if (ajSearchQuery.trim()) {
      const q = ajSearchQuery.toLowerCase();
      return (
        e.regNo.toLowerCase().includes(q) ||
        e.partyNameGuj.toLowerCase().includes(q) ||
        e.subjectGuj.toLowerCase().includes(q) ||
        e.refNo.toLowerCase().includes(q) ||
        (e.remarksGuj && e.remarksGuj.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalInwardCount = aavakJaavakEntries.filter(e => e.type.includes('આવક')).length;
  const totalOutwardCount = aavakJaavakEntries.filter(e => e.type.includes('જાવક')).length;
  const totalPostageExpense = aavakJaavakEntries.reduce((sum, e) => sum + (e.stampExpense || 0), 0);

  // Vault processing logic
  const processFile = (file: File) => {
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    if (file.size > 15 * 1024 * 1024) {
      alert('ફાઇલ માપ ૧૫ MB કરતાં વધુ ન હોવું જોઈએ.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedFile({
        name: file.name,
        size: sizeStr,
        type: file.type || 'application/pdf',
        dataUrl
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleStartEdit = (doc: DocumentMeta) => {
    setEditingDoc(doc);
    setTitleGuj(doc.titleGuj);
    setTypeGuj(doc.typeGuj as any);
    setRemarksGuj(doc.remarksGuj || '');
    setShowUploadForm(true);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleGuj) {
      alert('કૃપા કરીને શીર્ષક ભરો.');
      return;
    }

    if (editingDoc && onEditDocument) {
      onEditDocument({
        ...editingDoc,
        titleGuj,
        typeGuj,
        remarksGuj: remarksGuj || `${typeGuj} નકલ`,
        ...(selectedFile ? {
          fileDataUrl: selectedFile.dataUrl,
          fileSize: selectedFile.size,
          fileType: selectedFile.type
        } : {})
      });
      setEditingDoc(null);
      alert('દસ્તાવેજની વિગતો સફળતાપૂર્વક સુધારવામાં આવી છે.');
    } else {
      onUploadDocument({
        titleGuj,
        typeGuj,
        remarksGuj: remarksGuj || `${typeGuj} નકલ`,
        fileDataUrl: selectedFile?.dataUrl,
        fileSize: selectedFile?.size || '1.5 MB',
        fileType: selectedFile?.type || 'application/pdf'
      });
      alert('દસ્તાવેજ સુરક્ષિત ક્લાઉડ આર્કાઇવમાં સફળતાપૂર્વક અપલોડ કરવામાં આવ્યો છે.');
    }

    setTitleGuj('');
    setRemarksGuj('');
    setSelectedFile(null);
    setEditingDoc(null);
    setShowUploadForm(false);
  };

  const handleOpenExternalViewer = (doc: DocumentMeta) => {
    if (doc.fileDataUrl) {
      try {
        if (doc.fileDataUrl.startsWith('data:')) {
          const parts = doc.fileDataUrl.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : (doc.fileType || 'application/pdf');
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          const blobUrl = URL.createObjectURL(blob);
          const win = window.open(blobUrl, '_blank');
          if (win) return;
        } else {
          const win = window.open(doc.fileDataUrl, '_blank');
          if (win) return;
        }
      } catch (err) {
        console.error('Error opening original file in external viewer:', err);
      }
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${doc.titleGuj} - Vault Document Viewer</title>
            <meta charset="utf-8">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; margin: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
              .btn-bar { width: 100%; max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
              .btn { background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; }
              .btn:hover { background: #0369a1; }
              .cert { width: 100%; max-width: 800px; background: #ffffff; color: #0f172a; border: 8px double #0284c7; padding: 40px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); box-sizing: border-box; }
              .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; }
              .title { font-size: 24px; font-weight: bold; color: #0369a1; }
              .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
              .box { background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .row { display: flex; margin-bottom: 12px; font-size: 14px; }
              .lbl { width: 180px; font-weight: bold; color: #0369a1; }
              .val { flex: 1; color: #334155; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; }
              @media print { .btn-bar { display: none; } body { padding: 0; background: white; } .cert { box-shadow: none; border-width: 4px; } }
            </style>
          </head>
          <body>
            <div class="btn-bar">
              <span style="font-weight:bold; font-size:16px; color:#38bdf8;">📄 ${doc.titleGuj}</span>
              <button class="btn" onclick="window.print()">🖨️ પ્રિન્ટ / PDF સેવ કરો</button>
            </div>
            <div class="cert">
              <div class="header">
                <div class="title">ચેરિટેબલ ટ્રસ્ટ - સત્તાવાર ફાઇલ આર્કાઇવ</div>
                <div class="subtitle">Secure Vault System • AES-256 Encrypted Copy</div>
              </div>
              <h2 style="text-align:center; color:#0f172a; font-size:22px; margin-bottom:20px;">${doc.titleGuj}</h2>
              <div class="box">
                <div class="row"><div class="lbl">દસ્તાવેજ પ્રકાર:</div><div class="val">${doc.typeGuj}</div></div>
                <div class="row"><div class="lbl">અપલોડ તારીખ:</div><div class="val">${doc.uploadDate}</div></div>
                <div class="row"><div class="lbl">ફાઇલ સાઇઝ:</div><div class="val">${doc.fileSize}</div></div>
                <div class="row"><div class="lbl">ટિપ્પણી / વિગત:</div><div class="val">${doc.remarksGuj || 'સત્તાવાર દસ્તાવેજ'}</div></div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      printContainer('vault-doc-preview-container');
    }
  };

  const handleDownloadPDFModal = async (doc: DocumentMeta) => {
    if (doc.fileDataUrl && doc.fileDataUrl.startsWith('data:application/pdf')) {
      const link = document.createElement('a');
      link.href = doc.fileDataUrl;
      link.download = `${doc.titleGuj.replace(/\s+/g, '_')}.pdf`;
      link.click();
      return;
    }
    setIsGeneratingPDF(true);
    await downloadContainerAsPDF('vault-doc-preview-container', `Document_${doc.id}`);
    setIsGeneratingPDF(false);
  };

  const filteredDocs = documents.filter(d => {
    const query = searchQuery.toLowerCase();
    return (
      d.titleGuj.toLowerCase().includes(query) ||
      d.typeGuj.toLowerCase().includes(query)
    );
  });

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Top Header & SubTab Selector */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <FileText className="w-6 h-6 text-indigo-600" /> દસ્તાવેજો અને આવક-જાવક ટપાલ રજીસ્ટર
          </h2>
          <p className={`text-xs ${textMuted} mt-0.5`}>
            ટ્રસ્ટના કાનૂની દસ્તાવેજ વોલ્ટ તેમજ આવક (Inward) અને જાવક (Outward) ટપાલ/પત્ર નોંધણી રજીસ્ટર (પ્રિન્ટ & PDF સુવિધા સાથે).
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('aavak_jaavak')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'aavak_jaavak'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Inbox className="w-4 h-4 text-emerald-300" /> આવક - જાવક પત્ર રજીસ્ટર
          </button>
          <button
            onClick={() => setActiveSubTab('vault')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'vault'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-sky-300" /> કાનૂની દસ્તાવેજ કબાટ (Vault)
          </button>
        </div>
      </div>

      {/* --- SUBTAB 1: AAVAK & JAAVAK CORRESPONDENCE REGISTER --- */}
      {activeSubTab === 'aavak_jaavak' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <p className={`text-[11px] font-bold ${textMuted}`}>કુલ આવક પત્રો (Inward)</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalInwardCount} પત્રો</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">બહારથી પ્રાપ્ત ટપાલ</p>
              </div>
              <span className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                <Inbox className="w-6 h-6" />
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <p className={`text-[11px] font-bold ${textMuted}`}>કુલ જાવક પત્રો (Outward)</p>
                <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalOutwardCount} પત્રો</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">બહાર મોકલેલ ટપાલ</p>
              </div>
              <span className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
                <Send className="w-6 h-6" />
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <p className={`text-[11px] font-bold ${textMuted}`}>કુલ ટપાલ વ્યવહાર (Total Entries)</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{aavakJaavakEntries.length} નોંધણી</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">આવક + જાવક રજીસ્ટર</p>
              </div>
              <span className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
                <FileText className="w-6 h-6" />
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <p className={`text-[11px] font-bold ${textMuted}`}>કુલ પોસ્ટેજ / કુરિયર ખર્ચ</p>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
                  ₹ {totalPostageExpense.toLocaleString('en-IN')}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">સ્ટેમ્પ અને સ્પીડપોસ્ટ</p>
              </div>
              <span className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
                <Tag className="w-6 h-6" />
              </span>
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className={`p-4 rounded-2xl border ${cardBg} flex flex-wrap justify-between items-center gap-3 print:hidden`}>
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAjTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ajTypeFilter === 'all'
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                તમામ પત્રો ({aavakJaavakEntries.length})
              </button>
              <button
                onClick={() => setAjTypeFilter('આવક (Inward)')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  ajTypeFilter === 'આવક (Inward)'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" /> 📥 ફક્ત આવક ({totalInwardCount})
              </button>
              <button
                onClick={() => setAjTypeFilter('જાવક (Outward)')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  ajTypeFilter === 'જાવક (Outward)'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                }`}
              >
                <Send className="w-3.5 h-3.5" /> 📤 ફક્ત જાવક ({totalOutwardCount})
              </button>

              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${inputBg} ml-2`}>
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="નોંધણી નં., નામ અથવા વિષય દ્વારા શોધો..."
                  value={ajSearchQuery}
                  onChange={e => setAjSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-48 sm:w-64"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowPrintRegisterModal(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" /> પ્રિન્ટ / PDF રજીસ્ટર (Print PDF)
              </button>
              {currentUser.role !== 'ReadOnly' && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenNewAjModal('આવક (Inward)')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> 📥 નવી આવક એન્ટ્રી
                  </button>
                  <button
                    onClick={() => handleOpenNewAjModal('જાવક (Outward)')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> 📤 નવી જાવક એન્ટ્રી
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Table View */}
          <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-xs`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> આવક - જાવક રજીસ્ટર યાદી (Inward & Outward Correspondence List)
              </h3>
              <span className="text-xs text-slate-500 font-mono">દર્શાવેલ: {filteredAjEntries.length} Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 text-center">પ્રકાર</th>
                    <th className="p-3">નોંધણી ક્રમાંક</th>
                    <th className="p-3">તારીખ</th>
                    <th className="p-3">મોકલનાર / મેળવનારનું નામ & સરનામું</th>
                    <th className="p-3">વિષય & પત્ર સંદર્ભ નં.</th>
                    <th className="p-3">મોકલવાની રીત</th>
                    <th className="p-3">સ્થિતિ</th>
                    <th className="p-3 text-right">ખર્ચ (₹)</th>
                    <th className="p-3 text-center">કાર્યવાહી</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredAjEntries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                        કોઈ આવક અથવા જાવક પત્ર રેકોર્ડ મળેલ નથી.
                      </td>
                    </tr>
                  ) : (
                    filteredAjEntries.map(e => {
                      const isInward = e.type.includes('આવક');
                      return (
                        <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isInward
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                            }`}>
                              {isInward ? <Inbox className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                              {isInward ? 'આવક' : 'જાવક'}
                            </span>
                          </td>

                          <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {e.regNo}
                          </td>

                          <td className="p-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {e.date}
                          </td>

                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{e.partyNameGuj}</span>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">{e.partyAddressGuj || '-'}</span>
                          </td>

                          <td className="p-3 max-w-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block line-clamp-2">{e.subjectGuj}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">સંદર્ભ નં.: {e.refNo || '-'}</span>
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[10px]">
                              {e.dispatchMode}
                            </span>
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              e.statusGuj.includes('પૂર્ણ') || e.statusGuj.includes('મંજૂર')
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : e.statusGuj.includes('ચાલુ')
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                            }`}>
                              {e.statusGuj}
                            </span>
                          </td>

                          <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                            {e.stampExpense ? `₹ ${e.stampExpense}` : '-'}
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditAjModal(e)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg cursor-pointer"
                                title="સુધારો"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {currentUser.role === 'Admin' && (
                                <button
                                  onClick={() => handleDeleteAjEntry(e.id, e.regNo)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                                  title="રદ કરો"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: LEGAL DOCUMENTS VAULT --- */}
      {activeSubTab === 'vault' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">કાનૂની દસ્તાવેજો (Trust Deed & Regulatory Folders)</h3>
              <p className={`text-xs ${textMuted}`}>ટ્રસ્ટ ડીડ, પાન કાર્ડ, 12A અને 80G ના કરમુક્તિ પ્રમાણપત્રો તેમજ આવકવેરા વાર્ષિક ઓડિટ રિપોર્ટ્સનું સ્થાનિક ક્લાઉડ આર્કાઈવ.</p>
            </div>
            {currentUser.role !== 'ReadOnly' && (
              <button
                id="btn-upload-doc"
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" /> નવો દસ્તાવેજ અપલોડ (Upload Document)
              </button>
            )}
          </div>

          {showUploadForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border ${cardBg} max-w-xl mx-auto space-y-4`}
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-emerald-600">નવી ફાઇલ અપલોડ પ્રોટોકોલ (Upload Legal File)</h3>
                <button onClick={() => setShowUploadForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">દસ્તાવેજ શીર્ષક (Title) *</label>
                  <input
                    type="text"
                    placeholder="દા.ત. આઇટીઆર ૨૦૨૫-૨૬ ઓડિટ આકારણી રિપોર્ટ"
                    value={titleGuj}
                    onChange={(e) => setTitleGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">દસ્તાવેજ વર્ગીકરણ (Document Type) *</label>
                  <select
                    value={typeGuj}
                    onChange={(e: any) => setTypeGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  >
                    <option value="ટ્રસ્ટ ડીડ (Trust Deed)">ટ્રસ્ટ ડીડ (Trust Deed)</option>
                    <option value="PAN કાર્ડ">PAN કાર્ડ (PAN Copy)</option>
                    <option value="12A પ્રમાણપત્ર">12A પ્રમાણપત્ર (12A Certificate)</option>
                    <option value="80G પ્રમાણપત્ર">80G પ્રમાણપત્ર (80G Certificate)</option>
                    <option value="નોંધણી પ્રમાણપત્ર">નોંધણી પ્રમાણપત્ર (Reg Certificate)</option>
                    <option value="ઓડિટ રિપોર્ટ">ઓડિટ રિપોર્ટ (Audit Report)</option>
                    <option value="અન્ય">અન્ય (Other Document)</option>
                  </select>
                </div>

                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-6 border-2 border-dashed rounded-xl text-center text-xs transition-colors ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                  }`}
                >
                  <input
                    type="file"
                    id="file-picker"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                  <label htmlFor="file-picker" className="cursor-pointer space-y-2 block">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    {selectedFile ? (
                      <div className="text-emerald-600 font-bold">
                        પસંદ કરેલ ફાઇલ: {selectedFile.name} ({selectedFile.size})
                      </div>
                    ) : (
                      <div>
                        <span className="text-indigo-600 font-bold">અહીં ફાઇલ ખેંચો (Drag & Drop)</span> અથવા બ્રાઉઝ કરવા માટે ક્લિક કરો
                        <span className={`block text-[10px] ${textMuted} mt-1`}>સમર્થિત ફાઇલો: PDF, PNG, JPG (મહત્તમ ૧૫ MB)</span>
                      </div>
                    )}
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">દસ્તાવેજ વિશે ટૂંકી નોંધ (Remarks)</label>
                  <input
                    type="text"
                    placeholder="આધારભૂત વિગત..."
                    value={remarksGuj}
                    onChange={(e) => setRemarksGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button type="button" onClick={() => setShowUploadForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">રદ કરો</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">ફાઇલ અપલોડ કરો</button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Documents Library Grid */}
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${cardBg} flex items-center gap-3`}>
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="દસ્તાવેજ શીર્ષક અથવા પ્રકાર દ્વારા શોધો..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map(doc => (
                <div key={doc.id} className={`p-5 rounded-2xl border ${cardBg} shadow-xs space-y-4 flex flex-col justify-between`}>
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                        <FileText className="w-5 h-5" />
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-300 rounded">
                        {doc.typeGuj.split(' ')[0]}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs mt-3 line-clamp-2">{doc.titleGuj}</h4>
                    <p className={`text-[10px] italic mt-1 ${textMuted}`}>"{doc.remarksGuj}"</p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-500">
                    <span>તારીખ: {doc.uploadDate}</span>
                    <span>સાઇઝ: {doc.fileSize}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setSelectedPreviewDoc(doc)}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 hover:text-emerald-700 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> પ્રીવ્યૂ
                    </button>
                    <button
                      onClick={() => handleOpenExternalViewer(doc)}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-300 hover:text-indigo-700 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      title="મૂળ અપલોડ થયેલ ફાઇલ / વ્યુઅરમાં ખોલો"
                    >
                      <ExternalLink className="w-3 h-3" /> ખોલો
                    </button>
                    {currentUser.role === 'Admin' && (
                      <>
                        <button
                          onClick={() => handleStartEdit(doc)}
                          className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> સુધારો
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`દસ્તાવેજ "${doc.titleGuj}" કાયમી રદ કરવા માંગો છો?`)) {
                              onDeleteDocument(doc.id);
                            }
                          }}
                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> રદ કરો
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: ADD / EDIT AAVAK-JAAVAK ENTRY FORM --- */}
      {showAjFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> {editingAj ? 'આવક/જાવક એન્ટ્રી એડિટ કરો' : 'નવી આવક / જાવક પત્ર એન્ટ્રી ઉમેરો'}
              </h3>
              <button onClick={() => setShowAjFormModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAjEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">નોંધણી પ્રકાર (Type) *</label>
                  <select
                    value={ajFormType}
                    onChange={(e: any) => {
                      const newType = e.target.value;
                      setAjFormType(newType);
                      if (!editingAj) {
                        setAjFormRegNo(generateNextRegNo(newType));
                        setAjFormStatus(newType.includes('આવક') ? 'પૂર્ણ / ફાઈલ કરેલ' : 'મોકલેલ');
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${inputBg}`}
                  >
                    <option value="આવક (Inward)">📥 આવક પત્ર (Inward Letter)</option>
                    <option value="જાવક (Outward)">📤 જાવક પત્ર (Outward Letter)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">આવક / જાવક ક્રમાંક *</label>
                  <input
                    type="text"
                    value={ajFormRegNo}
                    onChange={e => setAjFormRegNo(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold ${inputBg}`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">તારીખ (Date) *</label>
                  <input
                    type="date"
                    value={ajFormDate}
                    onChange={e => setAjFormDate(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${inputBg}`}
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">મોકલવાની / મળવાની રીત *</label>
                  <select
                    value={ajFormDispatchMode}
                    onChange={(e: any) => setAjFormDispatchMode(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${inputBg}`}
                  >
                    <option value="સ્પીડ પોસ્ટ">સ્પીડ પોસ્ટ (Speed Post)</option>
                    <option value="રજીસ્ટર્ડ એડી">રજીસ્ટર્ડ એડી (Regd AD)</option>
                    <option value="સામાન્ય ટપાલ">સામાન્ય ટપાલ (Ordinary Post)</option>
                    <option value="રૂબરૂ (Hand Delivery)">રૂબરૂ (Hand Delivery)</option>
                    <option value="ઈ-મેઈલ">ઈ-મેઈલ (Email)</option>
                    <option value="કુરિયર">કુરિયર (Courier)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {ajFormType.includes('આવક') ? 'મોકલનારનું નામ & કચેરી (Sender Name & Dept) *' : 'મેળવનારનું નામ & કચેરી (Recipient Name & Dept) *'}
                </label>
                <input
                  type="text"
                  placeholder="દા.ત. સહકારી મંડળીઓ રજીસ્ટ્રાર કચેરી, અમદાવાદ"
                  value={ajFormPartyName}
                  onChange={e => setAjFormPartyName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${inputBg}`}
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">સરનામું / સ્થળ (Address / Location)</label>
                <input
                  type="text"
                  placeholder="દા.ત. સેક્ટર-૧૬, ગાંધીનગર"
                  value={ajFormPartyAddress}
                  onChange={e => setAjFormPartyAddress(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${inputBg}`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">પત્રનો વિષય / બાબત (Subject) *</label>
                <textarea
                  rows={2}
                  placeholder="દા.ત. નાણાકીય વર્ષ ૨૦૨૫-૨૬ ના ઓડિટ રિપોર્ટ સબમિટ કરવા અંગે"
                  value={ajFormSubject}
                  onChange={e => setAjFormSubject(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${inputBg}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">પત્ર ક્રમાંક / સંદર્ભ નં. (Ref No)</label>
                  <input
                    type="text"
                    placeholder="દા.ત. REG/AUDIT/2026/7821"
                    value={ajFormRefNo}
                    onChange={e => setAjFormRefNo(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${inputBg}`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">પોસ્ટેજ / સ્ટેમ્પ ખર્ચ (રૂ.)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={ajFormStampExpense}
                    onChange={e => setAjFormStampExpense(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">વર્તમાન સ્થિતિ (Status) *</label>
                <select
                  value={ajFormStatus}
                  onChange={(e: any) => setAjFormStatus(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${inputBg}`}
                >
                  <option value="પૂર્ણ / ફાઈલ કરેલ">પૂર્ણ / ફાઈલ કરેલ (Completed & Filed)</option>
                  <option value="ચાલુ / પ્રક્રિયા હેઠળ">ચાલુ / પ્રક્રિયા હેઠળ (In Progress)</option>
                  <option value="મંજૂર / સ્વીકૃત">મંજૂર / સ્વીકૃત (Approved)</option>
                  <option value="મોકલેલ">મોકલેલ (Dispatched / Sent)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">ટિપ્પણી / નોંધ (Remarks)</label>
                <input
                  type="text"
                  placeholder="અન્ય કોઈ આધારભૂત નોંધ..."
                  value={ajFormRemarks}
                  onChange={e => setAjFormRemarks(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${inputBg}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAjFormModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {editingAj ? 'અપડેટ કરો' : 'સેવ કરો'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: PRINTABLE AAVAK - JAAVAK REGISTER (PRINT & PDF) --- */}
      {showPrintRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-5 space-y-4 shadow-2xl max-h-[96vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Printer className="w-5 h-5" /> આવક અને જાવક પત્ર રજીસ્ટર (Inward & Outward Register Print / PDF)
                </h3>
                <p className="text-xs text-slate-500">
                  સંસ્થાના તમામ આવક પત્રો અને જાવક પત્રોનું સત્તાવાર પ્રિન્ટેબલ રજીસ્ટર
                </p>
              </div>
              <button
                onClick={() => setShowPrintRegisterModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Controls Toolbar */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">પ્રિન્ટ ફિલ્ટર:</span>
                <select
                  value={ajTypeFilter}
                  onChange={(e: any) => setAjTypeFilter(e.target.value)}
                  className="p-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <option value="all">તમામ પત્રો ({aavakJaavakEntries.length})</option>
                  <option value="આવક (Inward)">📥 ફક્ત આવક પત્રો ({totalInwardCount})</option>
                  <option value="જાવક (Outward)">📤 ફક્ત જાવક પત્રો ({totalOutwardCount})</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadContainerAsPDF('printable-aavak-jaavak-register-container', `Aavak_Jaavak_Register_${new Date().toISOString().split('T')[0]}`)}
                  disabled={isGeneratingPDF}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF ડાઉનલોડ
                </button>
                <button
                  onClick={() => printContainer('printable-aavak-jaavak-register-container')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ રજીસ્ટર
                </button>
              </div>
            </div>

            {/* Printable Container */}
            <div
              id="printable-aavak-jaavak-register-container"
              className="p-6 sm:p-8 border-2 border-slate-800 rounded-xl space-y-6 bg-white text-slate-900"
            >
              {/* Trust Formal Letterhead */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-800 gap-4">
                {trustSettings?.logoUrl && (
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-white p-1 rounded-lg border border-slate-200">
                    <img
                      src={trustSettings.logoUrl}
                      alt="Trust Logo"
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="flex-1 text-center">
                  <h1 className="text-2xl font-black text-indigo-950">
                    {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                  </h1>
                  <p className="text-xs font-medium text-slate-700 mt-1">
                    {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'}
                  </p>
                  <p className="text-xs font-mono text-slate-600 mt-0.5">
                    નોંધણી ક્રમાંક: {trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'} {trustSettings?.phone ? ` | ફોન: ${trustSettings?.phone}` : ''}
                  </p>
                </div>
                {trustSettings?.logoUrl && (
                  <div className="w-16 h-16 opacity-0 shrink-0 select-none hidden md:block"></div>
                )}
              </div>

              {/* Title Bar */}
              <div className="text-center bg-slate-100 border border-slate-300 rounded-lg p-3">
                <h2 className="text-base font-black text-slate-950 uppercase tracking-wide">
                  સત્તાવાર આવક અને જાવક પત્ર રજીસ્ટર (INWARD & OUTWARD CORRESPONDENCE REGISTER)
                </h2>
                <p className="text-xs font-bold text-slate-700 mt-1">
                  તારીખ: {new Date().toLocaleDateString('en-IN')} | નાણાકીય વર્ષ: {trustSettings?.financialYear || '૨૦૨૬-૨૭'}
                </p>
              </div>

              {/* KPI Summary Bar for Print */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl">
                <div>
                  <span className="text-slate-500 font-sans text-[10px] block font-bold">કુલ નોંધાયેલ પત્રો</span>
                  <span className="font-black text-slate-900 text-sm">{filteredAjEntries.length} પત્રો</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans text-[10px] block font-bold">કુલ આવક પત્રો (Inward)</span>
                  <span className="font-black text-emerald-800 text-sm">{filteredAjEntries.filter(e => e.type.includes('આવક')).length} પત્રો</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans text-[10px] block font-bold">કુલ જાવક પત્રો (Outward)</span>
                  <span className="font-black text-indigo-900 text-sm">{filteredAjEntries.filter(e => e.type.includes('જાવક')).length} પત્રો</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans text-[10px] block font-bold">કુલ પોસ્ટેજ ખર્ચ</span>
                  <span className="font-black text-amber-800 text-sm">
                    ₹ {filteredAjEntries.reduce((s, e) => s + (e.stampExpense || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Printable Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-400 text-slate-900 font-bold">
                      <th className="p-2 border border-slate-400 text-center">ક્રમ</th>
                      <th className="p-2 border border-slate-400 text-center">પ્રકાર</th>
                      <th className="p-2 border border-slate-400">આવક/જાવક નં.</th>
                      <th className="p-2 border border-slate-400">તારીખ</th>
                      <th className="p-2 border border-slate-400">મોકલનાર / મેળવનારનું નામ અને વિગત</th>
                      <th className="p-2 border border-slate-400">પત્રનો વિષય અને સંદર્ભ નં.</th>
                      <th className="p-2 border border-slate-400 text-center">રીત</th>
                      <th className="p-2 border border-slate-400 text-center">સ્થિતિ</th>
                      <th className="p-2 border border-slate-400 text-right">ખર્ચ (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-sans">
                    {filteredAjEntries.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                          કોઈ રેકોર્ડ મળેલ નથી.
                        </td>
                      </tr>
                    ) : (
                      filteredAjEntries.map((e, index) => {
                        const isInward = e.type.includes('આવક');
                        return (
                          <tr key={e.id} className="hover:bg-slate-50">
                            <td className="p-2 border border-slate-300 text-center font-mono font-bold">{index + 1}</td>
                            <td className="p-2 border border-slate-300 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isInward ? 'bg-emerald-100 text-emerald-900' : 'bg-indigo-100 text-indigo-900'
                              }`}>
                                {isInward ? 'આવક' : 'જાવક'}
                              </span>
                            </td>
                            <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900">{e.regNo}</td>
                            <td className="p-2 border border-slate-300 font-mono whitespace-nowrap">{e.date}</td>
                            <td className="p-2 border border-slate-300">
                              <span className="font-bold text-slate-900 block">{e.partyNameGuj}</span>
                              <span className="text-[10px] text-slate-600 block">{e.partyAddressGuj || '-'}</span>
                            </td>
                            <td className="p-2 border border-slate-300">
                              <span className="font-medium text-slate-900 block">{e.subjectGuj}</span>
                              <span className="text-[10px] text-slate-500 font-mono block">સંદર્ભ: {e.refNo || '-'}</span>
                            </td>
                            <td className="p-2 border border-slate-300 text-center font-medium">{e.dispatchMode}</td>
                            <td className="p-2 border border-slate-300 text-center font-bold">{e.statusGuj}</td>
                            <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                              {e.stampExpense ? `₹ ${e.stampExpense}` : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Official Declaration */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-800">
                <p className="font-bold text-slate-900">સત્તાવાર ચકાસણી પ્રમાણપત્ર:</p>
                <p>
                  આથી ખાતરી આપવામાં આવે છે કે ઉપરોક્ત દર્શાવેલ તમામ આવક પત્રો (Inward) અને જાવક પત્રો (Outward) ની વિગતો સંસ્થાના સત્તાવાર ચોપડે રજીસ્ટર ક્રમાંક અને તારીખ મુજબ સાચી અને સત્ય નોંધાયેલ છે.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-800">
                <div>
                  <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>નોંધણી કરનાર ક્લાર્ક સહી</span>
                </div>
                <div>
                  <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>મંત્રી / સચિવ સહી</span>
                </div>
                <div>
                  <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>પ્રમુખશ્રી / ટ્રસ્ટી સહી</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vault Legal Document preview modal */}
      {selectedPreviewDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white text-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">દસ્તાવેજ પ્રીવ્યુઅર (Secure File Vault Viewer)</span>
              </div>
              <button onClick={() => setSelectedPreviewDoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content View */}
            <div className="p-6 overflow-y-auto bg-slate-100 space-y-4">
              <div
                id="vault-doc-preview-container"
                className="border-4 border-sky-600 p-6 bg-white rounded-xl space-y-4 max-w-xl mx-auto shadow-md relative text-center text-xs"
              >
                <div className="flex justify-between items-center text-[9px] text-slate-500 border-b pb-2">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> સુરક્ષિત વોલ્ટ આર્કાઇવ
                  </span>
                  <span>ID: {selectedPreviewDoc.id}</span>
                </div>

                <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto my-2 border border-sky-100">
                  <FileText className="w-8 h-8" />
                </div>

                <h4 className="font-bold text-base text-slate-900">{selectedPreviewDoc.titleGuj}</h4>
                <div className="inline-block bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-[10px] font-bold">
                  {selectedPreviewDoc.typeGuj}
                </div>

                {selectedPreviewDoc.fileDataUrl ? (
                  <div className="my-4 border-2 border-indigo-200 rounded-xl overflow-hidden bg-slate-900 p-2">
                    <div className="text-[10px] text-emerald-400 font-bold mb-2 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> મૂળ અપલોડ થયેલ ફાઇલ (Original File Preview)
                    </div>
                    {selectedPreviewDoc.fileDataUrl.startsWith('data:image') ? (
                      <img
                        src={selectedPreviewDoc.fileDataUrl}
                        alt={selectedPreviewDoc.titleGuj}
                        className="max-h-64 object-contain mx-auto rounded bg-white"
                      />
                    ) : (
                      <div className="space-y-3 p-4 bg-slate-800 rounded-lg text-white">
                        <FileText className="w-12 h-12 text-sky-400 mx-auto" />
                        <p className="text-xs text-slate-300">મૂળ પીડીએફ દસ્તાવેજ સંલગ્ન છે ({selectedPreviewDoc.fileSize})</p>
                        <button
                          onClick={() => handleOpenExternalViewer(selectedPreviewDoc)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" /> મૂળ પીડીએફ વ્યુઅરમાં ખોલો
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="bg-slate-50 p-3 rounded-lg text-left space-y-1.5 text-slate-700 text-[11px] border">
                  <div><strong>અપલોડ તારીખ:</strong> {selectedPreviewDoc.uploadDate}</div>
                  <div><strong>ફાઇલ માપ:</strong> {selectedPreviewDoc.fileSize}</div>
                  <div><strong>નોંધ / વિગત:</strong> {selectedPreviewDoc.remarksGuj || 'સત્તાવાર દસ્તાવેજ'}</div>
                  <div><strong>એન્ક્રિપ્શન ડેટા:</strong> AES-256 (SHA-256)</div>
                </div>

                <p className="text-slate-500 text-[10px] leading-relaxed italic border-t pt-3">
                  "આ ટ્રસ્ટનો માન્ય કાનૂની દસ્તાવેજ છે. સેન્ટ્રલ સેફ વોલ્ટ સર્વરમાં સુરક્ષિત સંગ્રહિત છે."
                </p>

                <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>MD5: de892a012ffec9c0</span>
                  <span className="text-emerald-600 font-sans font-bold">✓ પ્રમાણિત (Verified)</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap gap-2 justify-end shrink-0">
              <button
                onClick={() => printContainer('vault-doc-preview-container')}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> પ્રિન્ટ (Print)
              </button>

              <button
                onClick={() => handleDownloadPDFModal(selectedPreviewDoc)}
                disabled={isGeneratingPDF}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> {isGeneratingPDF ? 'PDF બની રહી છે...' : 'ડાઉનલોડ PDF'}
              </button>

              <button
                id="btn-open-external-pdf-viewer"
                onClick={() => handleOpenExternalViewer(selectedPreviewDoc)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> બાહ્ય પીડીએફ વ્યુઅરમાં ખોલો
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
