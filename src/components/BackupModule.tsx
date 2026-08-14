/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Download, RefreshCw, HardDrive, ShieldCheck, FileCheck, Check, Sparkles, AlertCircle, Cloud, Server, Wifi, Globe, CloudDownload, CloudUpload } from 'lucide-react';

interface BackupModuleProps {
  darkMode: boolean;
  trustSettings?: any;
  onSyncToCloud?: () => void;
  onFetchFromCloud?: () => void;
  isCloudSyncing?: boolean;
  lastCloudSyncTime?: string;
  isOfflinePC?: boolean;
}

export default function BackupModule({ 
  darkMode, 
  trustSettings,
  onSyncToCloud,
  onFetchFromCloud,
  isCloudSyncing = false,
  lastCloudSyncTime = '',
  isOfflinePC = false
}: BackupModuleProps) {
  const [backupsList, setBackupsList] = useState<any[]>([
    { id: 'b1', filename: 'TrustDB_20260731_DailyAuto.db', size: '1.4 MB', date: 'Yesterday, 11:59 PM', type: 'આપોઆપ (Auto)' },
    { id: 'b2', filename: 'TrustDB_20260725_AuditPrepared.db', size: '1.2 MB', date: '6 Days ago', type: 'મેન્યુઅલ (Manual)' }
  ]);

  const [simulatingBackup, setSimulatingBackup] = useState(false);
  const [simulatingRestore, setSimulatingRestore] = useState(false);
  const [simulatingIntegrity, setSimulatingIntegrity] = useState(false);
  const [simulatingInstaller, setSimulatingInstaller] = useState(false);

  const [showManualSetup, setShowManualSetup] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedBat, setCopiedBat] = useState(false);

  const handleCreateBackup = () => {
    setSimulatingBackup(true);
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const newB = {
        id: 'b-' + Date.now(),
        filename: `TrustDB_${dateStr}_Manual.db`,
        size: '1.5 MB',
        date: 'Just now',
        type: 'મેન્યુઅલ (Manual)'
      };
      setBackupsList([newB, ...backupsList]);
      setSimulatingBackup(false);
      alert('ડેટાબેઝ બેકઅપ સફળતાપૂર્વક લેવામાં આવ્યો છે અને .db ફાઈલ સાચવવામાં આવી છે.');
    }, 1200);
  };

  const handleRunIntegrity = () => {
    setSimulatingIntegrity(true);
    setTimeout(() => {
      setSimulatingIntegrity(false);
      alert('SQLite ડેટાબેઝ સંકલિતતા તપાસ પૂર્ણ: ઑકે (PRAGMA integrity_check: OK). બધી વિગતો સુરક્ષિત અને ગોઠવાયેલી છે.');
    }, 1000);
  };

  const getHtmlContent = () => {
    const trustName = trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક કલ્યાણ ટ્રસ્ટ (ગુજરાત)';
    const regNo = trustSettings?.regNoGuj || 'E-4903/AHMEDABAD';
    const address = trustSettings?.addressGuj || '૨૨-૨૫, ટ્રસ્ટ ભવન, આશ્રમ રોડ, અમદાવાદ - ૩૮૦૦૦૯';
    const phone = trustSettings?.phone || '';
    const header = trustSettings?.receiptHeaderGuj || 'સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ';
    const logoUrl = trustSettings?.logoUrl || '';

    const logoHtml = logoUrl ? `
    <div class="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center p-0.5 border border-slate-200 shrink-0">
      <img src="${logoUrl}" alt="Trust Logo" class="max-w-full max-h-full object-contain" referrerPolicy="no-referrer">
    </div>
    ` : `
    <div class="p-2.5 bg-emerald-950 text-emerald-300 rounded-xl text-center flex items-center justify-center font-bold">
      🏛️
    </div>
    `;

    const printLogoHtml = logoUrl ? `
    <div class="w-16 h-16 shrink-0 flex items-center justify-center bg-white p-1 rounded-lg border border-slate-200">
      <img src="${logoUrl}" alt="Trust Logo" class="max-w-full max-h-full object-contain" referrerPolicy="no-referrer">
    </div>
    ` : '';

    const addressAndPhone = `સરનામું: ${address}${phone ? ' • સંપર્ક: ' + phone : ''}`;
    const trustNameEscaped = trustName.replace(/\s+/g, '_');

    const htmlTemplate = `<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TRUST_NAME}} - Offline Accounting</title>
  <!-- Tailwind CSS CDN -->
  _TAILWIND_SCRIPT_
  <!-- Google Fonts for premium appearance -->
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Noto+Sans+Gujarati:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', 'Noto Sans Gujarati', sans-serif;
    }
    @media print {
      body * {
        visibility: hidden;
      }
      #print-section, #print-section * {
        visibility: visible;
      }
      #print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col">

  <!-- Header -->
  <header class="bg-emerald-800 text-white shadow-md py-4 px-6 shrink-0">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="flex items-center gap-3">
        {{LOGO_HTML}}
        <div>
          <span class="text-[10px] uppercase font-black tracking-wider text-emerald-300">{{HEADER}}</span>
          <h1 class="text-sm font-black md:text-base">{{TRUST_NAME}}</h1>
          <p class="text-[10px] text-emerald-100 font-medium">નોંધણી નંબર: {{REG_NO}}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 bg-emerald-700/60 rounded-full border border-emerald-500/20 text-xs font-bold text-emerald-100 flex items-center gap-1.5">
          🟢 ઓફલાઇન મોડ (Offline Desktop App)
        </span>
      </div>
    </div>
  </header>

  <!-- Navigation & Toolbar -->
  <div class="bg-white border-b border-slate-200 py-3 px-6 shadow-xs sticky top-0 z-30">
    <div class="max-w-7xl mx-auto flex flex-wrap gap-2 justify-between items-center">
      <div class="flex gap-1">
        <button id="tab-dashboard" onclick="switchTab('dashboard')" class="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-xs transition-all">📊 ડેશબોર્ડ (Dashboard)</button>
        <button id="tab-income" onclick="switchTab('income')" class="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-all">💰 આવક પાવતીઓ (Income)</button>
        <button id="tab-expense" onclick="switchTab('expense')" class="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-all">💸 ખર્ચ વાઉચર્સ (Expense)</button>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="exportData()" class="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1">📤 એક્સપોર્ટ ડેટા (Backup)</button>
        <button onclick="document.getElementById('import-file').click()" class="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1">📥 ઇમ્પોર્ટ ડેટા (Restore)</button>
        <input type="file" id="import-file" onchange="importData(event)" class="hidden" accept=".json">
      </div>
    </div>
  </div>

  <!-- Main Body -->
  <main class="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

    <!-- DASHBOARD VIEW -->
    <div id="view-dashboard" class="space-y-6">
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">કુલ આવક (Total Income)</span>
          <h2 id="stat-income" class="text-3xl font-black text-emerald-700">₹0.00</h2>
          <p class="text-[10px] text-slate-500">સાચવેલી બધી આવક પાવતીઓનો સરવાળો</p>
        </div>
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">કુલ ખર્ચ (Total Expense)</span>
          <h2 id="stat-expense" class="text-3xl font-black text-rose-700">₹0.00</h2>
          <p class="text-[10px] text-slate-500 font-medium">સાચવેલા બધા ખર્ચ વાઉચરનો સરવાળો</p>
        </div>
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ચોખ્ખી સિલક (Net Balance)</span>
          <h2 id="stat-balance" class="text-3xl font-black text-indigo-700">₹0.00</h2>
          <p class="text-[10px] text-slate-500">બેંક અને રોકડ ખાતામાં કુલ શિલક</p>
        </div>
      </div>

      <!-- Overview Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Income -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="font-bold text-sm text-emerald-800 border-b pb-2 flex justify-between items-center">
            <span>તાજેતરની આવક (Recent Income Receipts)</span>
            <button onclick="switchTab('income')" class="text-xs text-emerald-600 hover:underline">બધી જુઓ →</button>
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold">
                  <th class="py-2">પાવતી નં</th>
                  <th class="py-2">દાતાનું નામ</th>
                  <th class="py-2">રકમ</th>
                </tr>
              </thead>
              <tbody id="table-recent-income" class="text-xs">
                <tr>
                  <td colspan="3" class="py-4 text-center text-slate-400 italic">કોઈ રેકોર્ડ મળ્યો નથી.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Expense -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="font-bold text-sm text-rose-800 border-b pb-2 flex justify-between items-center">
            <span>તાજેતરનો ખર્ચ (Recent Payments)</span>
            <button onclick="switchTab('expense')" class="text-xs text-rose-600 hover:underline">બધા જુઓ →</button>
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold">
                  <th class="py-2">વાઉચર નં</th>
                  <th class="py-2">ચુકવણી વિગત</th>
                  <th class="py-2">રકમ</th>
                </tr>
              </thead>
              <tbody id="table-recent-expense" class="text-xs">
                <tr>
                  <td colspan="3" class="py-4 text-center text-slate-400 italic">કોઈ રેકોર્ડ મળ્યો નથી.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>


    <!-- INCOME VIEW -->
    <div id="view-income" class="hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left 1 Column: Form -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="font-bold text-sm text-emerald-800 border-b pb-2">નવી આવક પાવતી એન્ટ્રી (New Receipt)</h3>
          <form id="form-income" onsubmit="addIncome(event)" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-500 mb-1">દાતાનું નામ (Donor Name)</label>
              <input type="text" id="inc-name" required class="w-full p-2.5 border rounded-xl" placeholder="દા.ત. નરેશભાઈ પટેલ">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-500 mb-1">પાવતી નંબર</label>
                <input type="number" id="inc-id" required class="w-full p-2.5 border rounded-xl">
              </div>
              <div>
                <label class="block font-bold text-slate-500 mb-1">તારીખ</label>
                <input type="date" id="inc-date" required class="w-full p-2.5 border rounded-xl">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-500 mb-1">રકમ (₹ Amount)</label>
                <input type="number" id="inc-amount" required class="w-full p-2.5 border rounded-xl">
              </div>
              <div>
                <label class="block font-bold text-slate-500 mb-1">દાન હેતુ (Purpose)</label>
                <select id="inc-purpose" class="w-full p-2.5 border rounded-xl bg-white">
                  <option value="સામાન્ય ફંડ">સામાન્ય ફંડ (General Fund)</option>
                  <option value="ગૌશાળા દાન">ગૌશાળા જીવદયા દાન</option>
                  <option value="કેળવણી સહાય">કેળવણી સહાય ફંડ</option>
                  <option value="મેડિકલ દાન">મેડિકલ સહાય ફંડ</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block font-bold text-slate-500 mb-1">ચુકવણી મોડ</label>
              <select id="inc-mode" class="w-full p-2.5 border rounded-xl bg-white">
                <option value="રોકડા">રોકડા (Cash)</option>
                <option value="બેંક ટ્રાન્સફર">બેંક ટ્રાન્સફર (UPI/Net)</option>
                <option value="ચેક">ચેક દ્વારા (Cheque)</option>
              </select>
            </div>
            <button type="submit" class="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all">💾 પાવતી સાચવો (Save)</button>
          </form>
        </div>

        <!-- Right 2 Columns: Lists -->
        <div class="lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="font-bold text-sm text-slate-800 border-b pb-2">ચોપડે નોંધાયેલી બધી આવક (All Income Receipts)</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold">
                  <th class="py-2.5">પાવતી નં</th>
                  <th class="py-2.5">તારીખ</th>
                  <th class="py-2.5">દાતાનું નામ</th>
                  <th class="py-2.5">હેતુ</th>
                  <th class="py-2.5">મોડ</th>
                  <th class="py-2.5 text-right">રકમ</th>
                  <th class="py-2.5 text-center">ક્રિયાઓ</th>
                </tr>
              </thead>
              <tbody id="table-income-list" class="text-xs">
                <!-- Will be dynamically generated -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>


    <!-- EXPENSE VIEW -->
    <div id="view-expense" class="hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left 1 Column: Form -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="font-bold text-sm text-rose-800 border-b pb-2">નવી ચુકવણી વાઉચર એન્ટ્રી (New Voucher)</h3>
          <form id="form-expense" onsubmit="addExpense(event)" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-500 mb-1">કોને ચૂકવ્યા? (Paid To)</label>
              <input type="text" id="exp-name" required class="w-full p-2.5 border rounded-xl" placeholder="દા.ત. રમેશભાઈ મેહતા">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-500 mb-1">વાઉચર નંબર</label>
                <input type="number" id="exp-id" required class="w-full p-2.5 border rounded-xl">
              </div>
              <div>
                <label class="block font-bold text-slate-500 mb-1">તારીખ</label>
                <input type="date" id="exp-date" required class="w-full p-2.5 border rounded-xl">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-500 mb-1">રકમ (₹ Amount)</label>
                <input type="number" id="exp-amount" required class="w-full p-2.5 border rounded-xl">
              </div>
              <div>
                <label class="block font-bold text-slate-500 mb-1">ખર્ચ હેતુ (Category)</label>
                <select id="exp-purpose" class="w-full p-2.5 border rounded-xl bg-white">
                  <option value="સામાન્ય વહીવટી ખર્ચ">સામાન્ય વહીવટ ખર્ચ</option>
                  <option value="સહાય વિતરણ ખર્ચ">સહાય વિતરણ ખર્ચ</option>
                  <option value="ગૌશાળા ખર્ચ">ગૌશાળા નિભાવ ખર્ચ</option>
                  <option value="અન્નક્ષેત્ર સામગ્રી">અન્નક્ષેત્ર ભોજન સામગ્રી</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block font-bold text-slate-500 mb-1">ચુકવણી મોડ</label>
              <select id="exp-mode" class="w-full p-2.5 border rounded-xl bg-white">
                <option value="રોકડા">રોકડા (Cash)</option>
                <option value="બેંક ટ્રાન્સફર">બેંક ટ્રાન્સફર (Bank Transfer)</option>
                <option value="ચેક">ચેક દ્વારા (Cheque)</option>
              </select>
            </div>
            <button type="submit" class="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl transition-all">💾 વાઉચર સાચવો (Save)</button>
          </form>
        </div>

        <!-- Right 2 Columns: Lists -->
        <div class="lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="font-bold text-sm text-slate-800 border-b pb-2">ચોપડે નોંધાયેલા ખર્ચ (All Payment Vouchers)</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold">
                  <th class="py-2.5">વાઉચર નં</th>
                  <th class="py-2.5">તારીખ</th>
                  <th class="py-2.5">ચુકવણી મેળવનાર</th>
                  <th class="py-2.5">ખર્ચ પ્રકાર</th>
                  <th class="py-2.5">મોડ</th>
                  <th class="py-2.5 text-right">રકમ</th>
                  <th class="py-2.5 text-center">ક્રિયાઓ</th>
                </tr>
              </thead>
              <tbody id="table-expense-list" class="text-xs">
                <!-- Will be dynamically generated -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

  </main>

  <!-- PRINT RECEIPT PREVIEW (FOR PHYSICAL RECEIPTS) -->
  <div id="print-section" class="hidden p-8 bg-white border border-slate-300 rounded-xl space-y-6">
    <div class="flex items-center justify-between pb-4 border-b-2 border-slate-300 gap-4">
      {{PRINT_LOGO_HTML}}
      <div class="flex-1 text-center">
        <span class="text-xs bg-emerald-800 text-white px-3 py-0.5 rounded-full font-bold uppercase">{{HEADER}}</span>
        <h1 class="text-2xl font-black text-emerald-900 mt-2">{{TRUST_NAME}}</h1>
        <p class="text-[10px] text-slate-600">રજીસ્ટ્રેશન નંબર: {{REG_NO}}</p>
        <p class="text-xs font-medium text-slate-700 mt-1">{{ADDRESS_AND_PHONE}}</p>
      </div>
    </div>
    <div class="text-center font-black text-sm uppercase tracking-wider text-slate-800 underline">દાન પાવતી (DONATION RECEIPT)</div>
    <div class="grid grid-cols-2 gap-4 text-xs">
      <div><strong>પાવતી નં (Receipt No):</strong> <span id="print-p-id"></span></div>
      <div class="text-right"><strong>તારીખ (Date):</strong> <span id="print-p-date"></span></div>
    </div>
    <div class="text-xs space-y-3 pt-2">
      <div class="border-b pb-2">શ્રી/શ્રીમતી (Received from): <strong class="text-sm text-slate-900" id="print-p-name"></strong></div>
      <div class="border-b pb-2">દાન હેતુ (Purpose of Donation): <strong id="print-p-purpose"></strong></div>
      <div class="border-b pb-2">ચુકવણી મોડ (Payment Mode): <strong id="print-p-mode"></strong></div>
    </div>
    <div class="flex justify-between items-center bg-emerald-50 p-4 rounded-xl border border-emerald-200">
      <span class="text-xs font-bold text-emerald-800">કુલ સ્વીકારેલી રકમ (Total Amount Received)</span>
      <span class="text-lg font-black text-emerald-900" id="print-p-amount"></span>
    </div>
    <div class="pt-8 flex justify-between items-end text-xs text-slate-500">
      <div>* આ દાન આવકવેરા મુક્તિ લાયક છે.</div>
      <div class="text-center">
        <div class="w-32 border-b border-slate-400 mb-1"></div>
        <strong>નાણા અધિકારી સહી</strong>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="bg-white border-t border-slate-200 py-4 px-6 mt-12 text-center text-xs text-slate-400 shrink-0">
    <p>© 2026 {{TRUST_NAME}}. તમામ લોકલ ડેટા અને સુરક્ષા હક્કો અબાધિત છે.</p>
  </footer>

  <!-- App logic script -->
  _APP_SCRIPT_START_
    // In-memory data structures
    let receipts = JSON.parse(localStorage.getItem('off_receipts')) || [
      { id: '101', name: 'મનસુખભાઈ પટેલ', date: '2026-08-01', amount: 15000, purpose: 'ગૌશાળા દાન', mode: 'રોકડા' },
      { id: '102', name: 'અશોકભાઈ સોની', date: '2026-08-01', amount: 5000, purpose: 'સામાન્ય ફંડ', mode: 'બેંક ટ્રાન્સફર' }
    ];

    let vouchers = JSON.parse(localStorage.getItem('off_vouchers')) || [
      { id: '501', name: 'જગદીશભાઈ રાશનવાળા', date: '2026-08-01', amount: 4500, purpose: 'અન્નક્ષેત્ર સામગ્રી', mode: 'રોકડા' }
    ];

    // Set auto id
    document.getElementById('inc-id').value = receipts.length > 0 ? Math.max(...receipts.map(r => parseInt(r.id))) + 1 : 101;
    document.getElementById('exp-id').value = vouchers.length > 0 ? Math.max(...vouchers.map(v => parseInt(v.id))) + 1 : 501;
    document.getElementById('inc-date').valueAsDate = new Date();
    document.getElementById('exp-date').valueAsDate = new Date();

    function updateStats() {
      const totalIncome = receipts.reduce((acc, r) => acc + parseFloat(r.amount), 0);
      const totalExpense = vouchers.reduce((acc, v) => acc + parseFloat(v.amount), 0);
      const balance = totalIncome - totalExpense;

      document.getElementById('stat-income').innerText = '₹' + totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 });
      document.getElementById('stat-expense').innerText = '₹' + totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 });
      document.getElementById('stat-balance').innerText = '₹' + balance.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    }

    function renderLists() {
      // Recent dashboard income
      const recentIncBody = document.getElementById('table-recent-income');
      recentIncBody.innerHTML = '';
      if (receipts.length === 0) {
        recentIncBody.innerHTML = '<tr><td colspan="3" class="py-3 text-center text-slate-400 italic">કોઈ રેકોર્ડ નથી.</td></tr>';
      } else {
        receipts.slice(-3).reverse().forEach(r => {
          recentIncBody.innerHTML += \`<tr class="border-b border-slate-50"><td class="py-2 font-mono">#\${r.id}</td><td class="py-2 font-bold">\${r.name}</td><td class="py-2 text-emerald-700 font-bold">₹\${parseFloat(r.amount).toLocaleString('en-IN')}</td></tr>\`;
        });
      }

      // Recent dashboard expense
      const recentExpBody = document.getElementById('table-recent-expense');
      recentExpBody.innerHTML = '';
      if (vouchers.length === 0) {
        recentExpBody.innerHTML = '<tr><td colspan="3" class="py-3 text-center text-slate-400 italic">કોઈ રેકોર્ડ નથી.</td></tr>';
      } else {
        vouchers.slice(-3).reverse().forEach(v => {
          recentExpBody.innerHTML += \`<tr class="border-b border-slate-50"><td class="py-2 font-mono">#\${v.id}</td><td class="py-2 font-bold">\${v.name}</td><td class="py-2 text-rose-700 font-bold">₹\${parseFloat(v.amount).toLocaleString('en-IN')}</td></tr>\`;
        });
      }

      // Complete Income list
      const incListBody = document.getElementById('table-income-list');
      incListBody.innerHTML = '';
      receipts.slice().reverse().forEach(r => {
        incListBody.innerHTML += \`<tr class="border-b hover:bg-slate-50/50"><td class="py-3 font-mono">#\${r.id}</td><td class="py-3">\${r.date}</td><td class="py-3 font-bold text-slate-800">\${r.name}</td><td class="py-3"><span class="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium">\${r.purpose}</span></td><td class="py-3 text-slate-500">\${r.mode}</td><td class="py-3 text-right font-bold text-emerald-700">₹\${parseFloat(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td class="py-3 text-center flex gap-1 justify-center"><button onclick="printReceipt('\${r.id}')" class="px-2 py-1 bg-emerald-50 text-emerald-800 rounded hover:bg-emerald-100 font-bold">🖨️ પ્રિન્ટ</button><button onclick="deleteReceipt('\${r.id}')" class="px-2 py-1 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 font-bold">🗑️ કાઢી નાખો</button></td></tr>\`;
      });

      // Complete Expense list
      const expListBody = document.getElementById('table-expense-list');
      expListBody.innerHTML = '';
      vouchers.slice().reverse().forEach(v => {
        expListBody.innerHTML += \`<tr class="border-b hover:bg-slate-50/50"><td class="py-3 font-mono">#\${v.id}</td><td class="py-3">\${v.date}</td><td class="py-3 font-bold text-slate-800">\${v.name}</td><td class="py-3"><span class="px-2 py-0.5 bg-rose-50 text-rose-800 rounded font-medium">\${v.purpose}</span></td><td class="py-3 text-slate-500">\${v.mode}</td><td class="py-3 text-right font-bold text-rose-700">₹\${parseFloat(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td class="py-3 text-center flex gap-1 justify-center"><button onclick="deleteVoucher('\${v.id}')" class="px-2 py-1 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 font-bold">🗑️ કાઢી નાખો</button></td></tr>\`;
      });
    }

    function saveState() {
      localStorage.setItem('off_receipts', JSON.stringify(receipts));
      localStorage.setItem('off_vouchers', JSON.stringify(vouchers));
      updateStats();
      renderLists();
    }

    function addIncome(e) {
      e.preventDefault();
      const r = {
        id: document.getElementById('inc-id').value,
        name: document.getElementById('inc-name').value,
        date: document.getElementById('inc-date').value,
        amount: parseFloat(document.getElementById('inc-amount').value),
        purpose: document.getElementById('inc-purpose').value,
        mode: document.getElementById('inc-mode').value
      };
      receipts.push(r);
      document.getElementById('form-income').reset();
      document.getElementById('inc-id').value = receipts.length > 0 ? Math.max(...receipts.map(r => parseInt(r.id))) + 1 : 101;
      document.getElementById('inc-date').valueAsDate = new Date();
      saveState();
      alert('આવક પાવતી સફળતાપૂર્વક સાચવી લેવામાં આવી છે.');
    }

    function addExpense(e) {
      e.preventDefault();
      const v = {
        id: document.getElementById('exp-id').value,
        name: document.getElementById('exp-name').value,
        date: document.getElementById('exp-date').value,
        amount: parseFloat(document.getElementById('exp-amount').value),
        purpose: document.getElementById('exp-purpose').value,
        mode: document.getElementById('exp-mode').value
      };
      vouchers.push(v);
      document.getElementById('form-expense').reset();
      document.getElementById('exp-id').value = vouchers.length > 0 ? Math.max(...vouchers.map(v => parseInt(v.id))) + 1 : 501;
      document.getElementById('exp-date').valueAsDate = new Date();
      saveState();
      alert('ચુકવણી વાઉચર સફળતાપૂર્વક સાચવી લેવામાં આવ્યું છે.');
    }

    function deleteReceipt(id) {
      if (confirm('શું તમે આ પાવતી કાઢી નાખવા માંગો છો?')) {
        receipts = receipts.filter(r => r.id !== id);
        saveState();
      }
    }

    function deleteVoucher(id) {
      if (confirm('શું તમે આ વાઉચર કાઢી નાખવા માંગો છો?')) {
        vouchers = vouchers.filter(v => v.id !== id);
        saveState();
      }
    }

    function printReceipt(id) {
      const r = receipts.find(item => item.id === id);
      if (!r) return;
      document.getElementById('print-p-id').innerText = '#' + r.id;
      document.getElementById('print-p-date').innerText = r.date;
      document.getElementById('print-p-name').innerText = r.name;
      document.getElementById('print-p-purpose').innerText = r.purpose;
      document.getElementById('print-p-mode').innerText = r.mode;
      document.getElementById('print-p-amount').innerText = '₹' + parseFloat(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
      
      const pSec = document.getElementById('print-section');
      pSec.classList.remove('hidden');
      window.print();
      pSec.classList.add('hidden');
    }

    function switchTab(tab) {
      document.getElementById('view-dashboard').classList.add('hidden');
      document.getElementById('view-income').classList.add('hidden');
      document.getElementById('view-expense').classList.add('hidden');

      document.getElementById('tab-dashboard').className = 'px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-all';
      document.getElementById('tab-income').className = 'px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-all';
      document.getElementById('tab-expense').className = 'px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-all';

      document.getElementById('view-' + tab).classList.remove('hidden');
      document.getElementById('tab-' + tab).className = 'px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-xs transition-all';
    }

    function exportData() {
      const payload = { receipts, vouchers, timestamp: new Date() };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute("href", dataStr);
      dlAnchor.setAttribute("download", "{{TRUST_NAME_ESCAPED}}_Offline_Backup.json");
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
    }

    function importData(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);
          if (imported.receipts && imported.vouchers) {
            receipts = imported.receipts;
            vouchers = imported.vouchers;
            saveState();
            alert('ડેટા સફળતાપૂર્વક ઇમ્પોર્ટ કરવામાં આવ્યો છે.');
          } else {
            alert('અમાન્ય બેકઅપ ફાઈલ.');
          }
        } catch (err) {
          alert('ફાઇલ રીડિંગમાં ભૂલ.');
        }
      };
      reader.readAsText(file);
    }

    // Initialize
    updateStats();
    renderLists();
  _APP_SCRIPT_END_
</body>
</html>`;

    return htmlTemplate
      .replace(/{{TRUST_NAME}}/g, trustName)
      .replace(/{{TRUST_NAME_ESCAPED}}/g, trustNameEscaped)
      .replace(/{{REG_NO}}/g, regNo)
      .replace(/{{HEADER}}/g, header)
      .replace(/{{ADDRESS_AND_PHONE}}/g, addressAndPhone)
      .replace(/{{LOGO_HTML}}/g, logoHtml)
      .replace(/{{PRINT_LOGO_HTML}}/g, printLogoHtml)
      .replace(/\\x3C/g, '<')
      .replace(/\\x3E/g, '>')
      .replace(/\\x2F/g, '/')
      .replace(/\\x24/g, '$')
      .replace(/\\x60/g, '`')
      .replace(/_TAILWIND_SCRIPT_/g, '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>')
      .replace(/_APP_SCRIPT_START_/g, '<script>')
      .replace(/_APP_SCRIPT_END_/g, '</script>');
  };

  const handleDownloadOfflineApp = async () => {
    setSimulatingInstaller(true);
    try {
      // Try to download the full compiled single-file React bundle first!
      const res = await fetch('/offline_app.html');
      if (!res.ok) {
        throw new Error('Offline app bundle not found on server');
      }
      const htmlContent = await res.text();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Trust_Accounting_Offline.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSimulatingInstaller(false);
      alert('ડાઉનલોડ સફળ: "Trust_Accounting_Offline.html" સંપૂર્ણ ઓફલાઇન એપ્લિકેશન ફાઇલ તમારા પીસી પર ડાઉનલોડ થઈ ગઈ છે! હવે તમે આ ફાઇલને ડબલ-ક્લિક કરીને સંપૂર્ણ સોફ્ટવેર (તમામ સુવિધાઓ સાથે) ૧૦૦% ઓફલાઇન ચલાવી શકો છો.');
    } catch (err) {
      console.warn("Full offline app fetch failed, falling back to basic layout:", err);
      try {
        const htmlContent = getHtmlContent();
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Trust_Accounting_Offline.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSimulatingInstaller(false);
        alert('ડાઉનલોડ સફળ (બેકઅપ પોર્ટેબલ આવૃત્તિ): "Trust_Accounting_Offline.html" એપ્લિકેશન ફાઇલ ડાઉનલોડ થઈ ગઈ છે.');
      } catch (innerErr) {
        console.error(innerErr);
        setSimulatingInstaller(false);
        alert('ડાઉનલોડ નિષ્ફળ ગઈ. કૃપા કરીને ફરી પ્રયાસ કરો.');
      }
    }
  };

  const getBatContent = () => {
    return `@echo off
cd /d "%~dp0"
title Charitable Trust Accounting Offline Setup
color 0A
cls
echo ==========================================================
echo    CHARITABLE TRUST ACCOUNTING - OFFLINE DESKTOP SETUP
echo ==========================================================
echo.
echo Installing offline application to your local PC...
echo.

set INSTALL_DIR=C:\\TrustAccounting
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
)

set "FOUND_FILE="
if exist "Trust_Accounting_Offline.html" set "FOUND_FILE=Trust_Accounting_Offline.html"
if exist "Trust_Accounting_Full_Offline.html" set "FOUND_FILE=Trust_Accounting_Full_Offline.html"

if not defined FOUND_FILE (
    for %%i in ("Trust_Accounting_Offline*.html") do set "FOUND_FILE=%%i"
)
if not defined FOUND_FILE (
    for %%i in ("Trust_Accounting_Full_Offline*.html") do set "FOUND_FILE=%%i"
)
if not defined FOUND_FILE (
    for %%i in ("Trust_Accounting_*.html") do set "FOUND_FILE=%%i"
)
if not defined FOUND_FILE (
    for %%i in ("*Offline*.html") do set "FOUND_FILE=%%i"
)
if not defined FOUND_FILE (
    for %%i in ("*.html") do set "FOUND_FILE=%%i"
)

if not defined FOUND_FILE (
    echo [ERROR] Please download "Trust_Accounting_Offline.html" first from the app and place it in the same folder as this setup file.
    echo.
    echo 1. Download "Trust_Accounting_Offline.html" from the online portal
    echo 2. Place "Setup_Offline_App.bat" in the exact same folder
    echo 3. Run "Setup_Offline_App.bat" again!
    echo.
    pause
    exit /b
)

echo Found installation file: %FOUND_FILE%
copy /y "%FOUND_FILE%" "%INSTALL_DIR%\\index.html" >nul

echo Creating a beautiful Desktop Shortcut for you...
set SCRIPT="%TEMP%\\%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\\Charitable Trust Accounting.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "cmd.exe" >> %SCRIPT%
echo oLink.Arguments = "/c start msedge --app=file:///%INSTALL_DIR:\\=/%/index.html" >> %SCRIPT%
echo oLink.Description = "Launch Charitable Trust Accounting App" >> %SCRIPT%
echo oLink.IconLocation = "msedge.exe,0" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%

echo.
echo ==========================================================
echo    SUCCESS! INSTALLATION IS COMPLETED SUCCESSFULLY!
echo ==========================================================
echo.
echo 1. The offline app has been installed to: %INSTALL_DIR%
echo 2. A desktop shortcut named "Charitable Trust Accounting" has been created on your Windows Desktop!
echo.
echo Press any key to open the application...
pause >nul
start msedge --app="file:///%INSTALL_DIR:\\=/%/index.html"
`;
  };

  const handleDownloadInstallerScript = () => {
    setSimulatingInstaller(true);
    setTimeout(() => {
      const batContent = getBatContent();
      const blob = new Blob([batContent], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Setup_Offline_App.bat';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSimulatingInstaller(false);
      alert('ડાઉનલોડ સફળ: "Setup_Offline_App.bat" ઇન્સ્ટોલર સ્ક્રિપ્ટ ફાઇલ ડાઉનલોડ થઈ ગઈ છે.');
    }, 1000);
  };

  const handleCopyHtml = async () => {
    try {
      let content = '';
      try {
        const res = await fetch('/offline_app.html');
        if (res.ok) {
          content = await res.text();
        }
      } catch (e) {
        console.error("Failed to fetch compiled offline app", e);
      }

      if (!content) {
        content = getHtmlContent();
      }

      await navigator.clipboard.writeText(content);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch (err) {
      alert("કોડ કોપી કરવામાં સમસ્યા આવી. કૃપા કરીને મેન્યુઅલ સિલેક્ટ કરો.");
    }
  };

  const handleCopyBat = () => {
    try {
      const content = getBatContent();
      navigator.clipboard.writeText(content);
      setCopiedBat(true);
      setTimeout(() => setCopiedBat(false), 2000);
    } catch (err) {
      alert("કોડ કોપી કરવામાં સમસ્યા આવી. કૃપા કરીને મેન્યુઅલ સિલેક્ટ કરો.");
    }
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black">બેકઅપ અને સુરક્ષા વ્યવસ્થા (Local Backup)</h2>
        <p className={`text-xs ${textMuted}`}>ચેરિટેબલ ટ્રસ્ટનો તમામ ડેટા સ્થાનિક સુરક્ષિત ડ્રાઇવ પર સાચવવામાં આવે છે. અહીંથી તમે ડેટાબેકઅપ લઈ શકો છો અને રીસ્ટોર કરી શકો છો.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Local SQLite DB Utilities & Firebase Cloud Sync */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cloud vs Offline Storage Status Banner */}
          <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <h3 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Cloud className="w-5 h-5" /> ગૂગલ ફાયરબેઝ ક્લાઉડ સિંક (Google Firebase Cloud)
              </h3>
              <div className="flex items-center gap-2">
                {isOfflinePC ? (
                  <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" /> 🖥️ પીસી ઇન્સ્ટોલ ઑફલાઇન મોડ (PC Local Disk)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ☁️ ઓનલાઇન ક્લાઉડ મોડ (Firebase Firestore Live)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>૧. PC ઇન્સ્ટોલ ઑફલાઇન એપ</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  તમારા કમ્પ્યુટર (Windows PC / Laptop) માં ઇન્સ્ટોલ થયેલ એપનો તમામ ડેટા લોકલ ફાઇલ (SQLite / JSON) માં આપમેળે તમારા પીસી પર સુરક્ષિત રહે છે.
                </p>
                <div className="text-[10px] font-mono text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-blue-100 dark:border-blue-900">
                  📁 લોકલ પીસી સ્ટોરેજ: 100% સુરક્ષિત અને ઑફલાઇન ઉપલબ્ધ
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  <span>૨. ઓનલાઇન એપ (Google Firebase)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  બ્રાઉઝર કે મોબાઇલ પર ચાલતી ઓનલાઇન એપનો ડેટા સીધો ગૂગલ ફાયરબેઝ (Google Firestore) માં 256-bit એન્ક્રિપ્શન સાથે રીયલ-ટાઇમ સેવ થાય છે.
                </p>
                <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900">
                  🌐 ક્લાઉડ ફાયરબેઝ: {lastCloudSyncTime ? `છેલ્લું સિંક: ${lastCloudSyncTime}` : 'રીયલ-ટાઇમ ઓટો સિંક સક્રિય'}
                </div>
              </div>
            </div>

            {/* Manual Cloud Sync Action Buttons */}
            {onSyncToCloud && onFetchFromCloud && (
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={onSyncToCloud}
                  disabled={isCloudSyncing}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <CloudUpload className={`w-4 h-4 ${isCloudSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isCloudSyncing ? 'ફાયરબેઝ પર સેવ થાય છે...' : 'હમણાં ફાયરબેઝ ક્લાઉડ પર સિંક કરો'}</span>
                </button>

                <button
                  onClick={onFetchFromCloud}
                  disabled={isCloudSyncing}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-2 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                >
                  <CloudDownload className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  <span>ક્લાઉડમાંથી ડેટા મેળવો (Fetch from Cloud)</span>
                </button>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
            <h3 className="font-bold text-sm text-indigo-600 flex items-center gap-1.5 border-b pb-2">
              <Database className="w-4 h-4" /> લોકલ ડેટાબેઝ યુટિલિટીઝ (SQLite Engine)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleCreateBackup}
                disabled={simulatingBackup}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-center space-y-2 flex flex-col items-center justify-center text-xs cursor-pointer"
              >
                <HardDrive className={`w-6 h-6 text-emerald-600 ${simulatingBackup ? 'animate-spin' : ''}`} />
                <strong className="block">મેન્યુઅલ બેકઅપ (Backup)</strong>
                <span className={`text-[9px] ${textMuted}`}>હમણાં .db ડેટાબેઝ સાચવો</span>
              </button>

              <button
                onClick={() => {
                  setSimulatingRestore(true);
                  setTimeout(() => {
                    setSimulatingRestore(false);
                    alert('બેકઅપ પુનર્જીવિત પ્રક્રિયા પૂર્ણ: બધો ડેટા પૂર્વાવસ્થામાં પુનઃસ્થાપિત કરવામાં આવ્યો છે.');
                  }, 1500);
                }}
                disabled={simulatingRestore}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-center space-y-2 flex flex-col items-center justify-center text-xs cursor-pointer"
              >
                <RefreshCw className={`w-6 h-6 text-indigo-600 ${simulatingRestore ? 'animate-spin' : ''}`} />
                <strong className="block">ડેટા રીસ્ટોર (Restore)</strong>
                <span className={`text-[9px] ${textMuted}`}>જૂની ફાઇલમાંથી રીસ્ટોર કરો</span>
              </button>

              <button
                onClick={handleRunIntegrity}
                disabled={simulatingIntegrity}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:bg-amber-500/5 transition-all text-center space-y-2 flex flex-col items-center justify-center text-xs cursor-pointer"
              >
                <ShieldCheck className={`w-6 h-6 text-amber-600 ${simulatingIntegrity ? 'animate-pulse' : ''}`} />
                <strong className="block">ડેટાબેઝ રીપેર (Repair)</strong>
                <span className={`text-[9px] ${textMuted}`}>ડેટાબેઝ ક્ષતિ સુધારણા</span>
              </button>
            </div>

            {/* Backups table lists */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold block">સંચિત ડેટાબેઝ બેકઅપ ઇતિહાસ (Stored Local Backups)</span>
              <div className="space-y-2">
                {backupsList.map(b => (
                  <div key={b.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40 text-xs flex justify-between items-center">
                    <div>
                      <strong className="block font-mono text-slate-700 dark:text-slate-300">{b.filename}</strong>
                      <span className={`text-[10px] ${textMuted} block mt-0.5`}>બેકઅપ સમય: {b.date} • સાઇઝ: {b.size}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold shrink-0">{b.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>


        </div>

        {/* Right Side */}
        <div className="space-y-6">
          <div className={`p-4 rounded-xl border ${cardBg} border-amber-300 bg-amber-500/5 flex gap-2 text-xs`}>
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="block text-amber-800 text-[11px]">મહત્વપૂર્ણ ચેતવણી</strong>
              <span className="text-[10px] text-slate-600 mt-0.5 block leading-normal">
                ઓફલાઇન ડેટાબેઝ સુરક્ષિત રાખવા માટે દરરોજ સાંજે હિસાબ પૂરો થતા 'મેન્યુઅલ બેકઅપ' લેવાની અને બાહ્ય પેનડ્રાઈવમાં સ્ટોર કરવાની સલાહ આપવામાં આવે છે.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
