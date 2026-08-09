/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Calculator, Hammer, TrendingDown, ClipboardList, Info, X, Edit3, Trash2, Package, Printer, Search } from 'lucide-react';
import { Asset, TrustSettings } from '../types';

interface AssetModuleProps {
  assets: Asset[];
  onAddAsset: (asset: Omit<Asset, 'id' | 'currentValue'>) => void;
  onEditAsset?: (asset: Asset) => void;
  onDeleteAsset?: (id: string) => void;
  onDepreciateAssets: () => void;
  currentUser: { role: string };
  darkMode: boolean;
  trustSettings?: TrustSettings;
}

export default function AssetModule({
  assets,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  onDepreciateAssets,
  currentUser,
  darkMode,
  trustSettings
}: AssetModuleProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'deadstock'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDepreciateConfirm, setShowDepreciateConfirm] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Form states
  const [nameGuj, setNameGuj] = useState('');
  const [typeGuj, setTypeGuj] = useState<'જમીન (Land)' | 'મકાન (Building)' | 'ફર્નિચર (Furniture)' | 'કમ્પ્યુટર (Computer)' | 'વાહન (Vehicle)' | 'સાધનો (Equipment)'>('ફર્નિચર (Furniture)');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [depreciationRate, setDepreciationRate] = useState('');
  const [remarksGuj, setRemarksGuj] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [locationGuj, setLocationGuj] = useState('મુખ્ય ઓફિસ');
  const [conditionGuj, setConditionGuj] = useState<'ઉત્તમ ચાલુ સ્થિતિ (Good)' | 'સમારકામ યોગ્ય (Needs Repair)' | 'બિનઉપયોગી/ભંગાર (Scrap)'>('ઉત્તમ ચાલુ સ્થિતિ (Good)');
  const [billRefGuj, setBillRefGuj] = useState('');
  const [deadStockNo, setDeadStockNo] = useState('');

  const handleStartEdit = (a: Asset) => {
    setEditingAsset(a);
    setNameGuj(a.nameGuj);
    setTypeGuj(a.typeGuj);
    setPurchaseDate(a.purchaseDate);
    setPurchaseAmount(String(a.purchaseAmount));
    setDepreciationRate(String(a.depreciationRate));
    setRemarksGuj(a.remarksGuj || '');
    setQuantity(String(a.quantity || 1));
    setLocationGuj(a.locationGuj || 'મુખ્ય ઓફિસ');
    setConditionGuj(a.conditionGuj || 'ઉત્તમ ચાલુ સ્થિતિ (Good)');
    setBillRefGuj(a.billRefGuj || '');
    setDeadStockNo(a.deadStockNo || '');
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameGuj || !purchaseAmount || !purchaseDate) {
      alert('કૃપા કરીને બધી વિગતો ભરો.');
      return;
    }

    const qtyNum = parseInt(quantity) || 1;
    const generatedDsNo = deadStockNo.trim() || `DS-${(assets.length + 1).toString().padStart(3, '0')}`;

    if (editingAsset && onEditAsset) {
      onEditAsset({
        ...editingAsset,
        nameGuj,
        typeGuj,
        purchaseDate,
        purchaseAmount: parseFloat(purchaseAmount),
        depreciationRate: parseFloat(depreciationRate) || 0,
        currentValue: parseFloat(purchaseAmount),
        remarksGuj,
        quantity: qtyNum,
        locationGuj,
        conditionGuj,
        billRefGuj,
        deadStockNo: generatedDsNo
      });
      setEditingAsset(null);
    } else {
      onAddAsset({
        nameGuj,
        typeGuj,
        purchaseDate,
        purchaseAmount: parseFloat(purchaseAmount),
        depreciationRate: parseFloat(depreciationRate) || 0,
        remarksGuj,
        quantity: qtyNum,
        locationGuj,
        conditionGuj,
        billRefGuj,
        deadStockNo: generatedDsNo
      });
    }

    setNameGuj('');
    setPurchaseAmount('');
    setPurchaseDate('');
    setDepreciationRate('');
    setRemarksGuj('');
    setQuantity('1');
    setLocationGuj('મુખ્ય ઓફિસ');
    setConditionGuj('ઉત્તમ ચાલુ સ્થિતિ (Good)');
    setBillRefGuj('');
    setDeadStockNo('');
    setEditingAsset(null);
    setShowAddForm(false);
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  const totalAssetCost = assets.reduce((sum, a) => sum + a.purchaseAmount, 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalQuantity = assets.reduce((sum, a) => sum + (a.quantity || 1), 0);

  const filteredAssets = assets.filter(a =>
    !searchQuery ||
    a.nameGuj.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.deadStockNo && a.deadStockNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.locationGuj && a.locationGuj.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" /> સ્થાયી મિલકત અને ડેડ સ્ટોક રજીસ્ટર
          </h2>
          <p className={`text-xs ${textMuted}`}>ટ્રસ્ટની માલિકીની જમીન, મકાનો, વાહનો, ઓફિસ ફર્નિચર અને સાધનોની યાદી તેમજ ઓડિટ ડેડ સ્ટોક પત્રક.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              મિલકત બોક્સ યાદી
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deadstock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'deadstock' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> ડેડ સ્ટોક પત્રક (Dead Stock)
            </button>
          </div>
          {currentUser.role !== 'ReadOnly' && (
            <button
              id="btn-depreciate"
              onClick={() => setShowDepreciateConfirm(true)}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <Calculator className="w-4 h-4" /> ઘસારો ગણો (Depreciate)
            </button>
          )}
          {currentUser.role === 'Admin' && (
            <button
              id="btn-add-asset"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
            >
              નવી મિલકત ઉમેરો (Add Asset)
            </button>
          )}
        </div>
      </div>

      {/* Asset Cost summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border ${cardBg} flex justify-between items-center shadow-sm`}>
          <div>
            <span className={`text-[10px] block ${textMuted}`}>કુલ મૂળ કિંમત (Total Acquisition Cost)</span>
            <strong className="text-base text-indigo-600 font-black">₹ {totalAssetCost.toLocaleString('en-IN')}</strong>
          </div>
          <Hammer className="w-5 h-5 text-indigo-400" />
        </div>
        <div className={`p-4 rounded-xl border ${cardBg} flex justify-between items-center shadow-sm`}>
          <div>
            <span className={`text-[10px] block ${textMuted}`}>હાલની ચોપડે કિંમત (Current Book Value)</span>
            <strong className="text-base text-emerald-600 font-black">₹ {totalCurrentValue.toLocaleString('en-IN')}</strong>
          </div>
          <ClipboardList className="w-5 h-5 text-emerald-400" />
        </div>
        <div className={`p-4 rounded-xl border ${cardBg} flex justify-between items-center shadow-sm`}>
          <div>
            <span className={`text-[10px] block ${textMuted}`}>કુલ ઘસારો કપાત (Total Depreciation Written-off)</span>
            <strong className="text-base text-rose-600 font-black">₹ {(totalAssetCost - totalCurrentValue).toLocaleString('en-IN')}</strong>
          </div>
          <TrendingDown className="w-5 h-5 text-rose-400" />
        </div>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border ${cardBg} max-w-xl mx-auto`}
        >
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h3 className="font-bold text-sm text-indigo-600">નવી મિલકત નોંધણી ફોર્મ (New Fixed Asset)</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">મિલકતનું નામ *</label>
              <input
                type="text"
                placeholder="દા.ત. ઓફિસ ભવન માટે નવું લેપટોપ અને કોમ્પ્યુટર"
                value={nameGuj}
                onChange={(e) => setNameGuj(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">મિલકત પ્રકાર *</label>
                <select
                  value={typeGuj}
                  onChange={(e: any) => setTypeGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                >
                  <option value="જમીન (Land)">જમીન (Land)</option>
                  <option value="મકાન (Building)">મકાન (Building)</option>
                  <option value="ફર્નિચર (Furniture)">ફર્નિચર (Furniture)</option>
                  <option value="કમ્પ્યુટર (Computer)">કમ્પ્યુટર (Computer)</option>
                  <option value="વાહન (Vehicle)">વાહન (Vehicle)</option>
                  <option value="સાધનો (Equipment)">સાધનો (Equipment)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">ખરીદી તારીખ *</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">ખરીદ કિંમત (Acquisition Cost in ₹) *</label>
                <input
                  type="number"
                  placeholder="મૂળ ખરીદ રકમ"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">વાર્ષિક ઘસારાનો દર (% Depreciation Rate) *</label>
                <input
                  type="number"
                  placeholder="દા.ત. 10 અથવા 15"
                  value={depreciationRate}
                  onChange={(e) => setDepreciationRate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">ડેડ સ્ટોક ક્રમાંક (DS Reg No)</label>
                <input
                  type="text"
                  placeholder="દા.ત. DS-001 (ઓટો-જનરેટ)"
                  value={deadStockNo}
                  onChange={(e) => setDeadStockNo(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">નંગ / જથ્થો (Quantity) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="દા.ત. 1 અથવા 5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">બિલ / વાઉચર નં. (Bill Ref)</label>
                <input
                  type="text"
                  placeholder="દા.ત. INV-2026-89"
                  value={billRefGuj}
                  onChange={(e) => setBillRefGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">રાખવાનું સ્થળ / રૂમ (Location)</label>
                <input
                  type="text"
                  placeholder="દા.ત. મુખ્ય ઓફિસ / સ્ટોર રૂમ / પ્રાર્થના હોલ"
                  value={locationGuj}
                  onChange={(e) => setLocationGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">વર્તમાન સ્થિતિ (Physical Condition)</label>
                <select
                  value={conditionGuj}
                  onChange={(e: any) => setConditionGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                >
                  <option value="ઉત્તમ ચાલુ સ્થિતિ (Good)">ઉત્તમ ચાલુ સ્થિતિ (Good)</option>
                  <option value="સમારકામ યોગ્ય (Needs Repair)">સમારકામ યોગ્ય (Needs Repair)</option>
                  <option value="બિનઉપયોગી/ભંગાર (Scrap)">બિનઉપયોગી/ભંગાર (Scrap)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">નોંધ / વિગતો</label>
              <input
                type="text"
                placeholder="વધારાની વિગતો..."
                value={remarksGuj}
                onChange={(e) => setRemarksGuj(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">રદ કરો</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">મિલકત સેવ કરો</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Assets Register table OR Dead Stock Patrak */}
      {activeTab === 'list' ? (
        <div className={`border ${cardBg} rounded-2xl overflow-hidden shadow-sm`}>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className={`font-bold ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <tr>
                  <th className="p-4">ડેડ સ્ટોક નં / મિલકત વિગત</th>
                  <th className="p-4">પ્રકાર</th>
                  <th className="p-4 text-center">નંગ</th>
                  <th className="p-4">ખરીદ તારીખ</th>
                  <th className="p-4 text-right">ખરીદ કિંમત (Cost)</th>
                  <th className="p-4 text-center">ઘસારા દર (Dep %)</th>
                  <th className="p-4 text-right">હાલની કિંમત (Book Value)</th>
                  <th className="p-4 text-center">સ્થિતિ</th>
                  <th className="p-4 text-center">ક્રિયાઓ (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {assets.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="p-4 font-bold">
                      <span className="text-[10px] font-mono font-bold text-indigo-600 block">{a.deadStockNo || 'DS-REG'}</span>
                      {a.nameGuj}
                      {a.locationGuj && <span className="text-[10px] text-slate-400 font-normal block">સ્થળ: {a.locationGuj}</span>}
                    </td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">{a.typeGuj.split(' ')[0]}</span></td>
                    <td className="p-4 text-center font-bold font-mono text-amber-600">{a.quantity || 1}</td>
                    <td className="p-4 font-mono">{a.purchaseDate}</td>
                    <td className="p-4 text-right">₹ {a.purchaseAmount.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center text-rose-600 font-bold">{a.depreciationRate}%</td>
                    <td className="p-4 text-right font-black text-emerald-600">₹ {a.currentValue.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        {a.conditionGuj ? a.conditionGuj.split(' ')[0] : 'ચાલુ'}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-center gap-1.5">
                      {currentUser.role === 'Admin' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(a)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg"
                            title="મિલકત સુધારો (Edit Asset)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteAsset && (
                            <button
                              type="button"
                              onClick={() => setAssetToDelete(a)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"
                              title="મિલકત રદ કરો (Delete Asset)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Dead Stock Patrak Register Table View */
        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm space-y-4 print:m-0 print:p-0`}>
          {/* Formal Trust Header (Print only / Visible above list) */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-800 dark:border-slate-700 gap-4">
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
              <h1 className="text-xl font-black text-indigo-950 dark:text-white">
                {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
              </h1>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'}
              </p>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                નોંધણી ક્રમાંક: {trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'} {trustSettings?.phone ? ` | ફોન: ${trustSettings?.phone}` : ''}
              </p>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded">
                ડેડ સ્ટોક પત્રક (Dead Stock Asset Audit Schedule)
              </h2>
            </div>
            {trustSettings?.logoUrl && (
              <div className="w-16 h-16 opacity-0 shrink-0 select-none hidden md:block"></div>
            )}
          </div>

          <div className="flex justify-between items-center border-b pb-3 print:hidden">
            <h3 className="font-black text-sm flex items-center gap-2 text-amber-600">
              <Package className="w-4 h-4" /> ડેડ સ્ટોક પત્રક (Dead Stock Asset Audit Schedule)
            </h3>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> પત્રક પ્રિન્ટ (Print Patrak)
            </button>
          </div>

          <div className="overflow-x-auto border rounded-xl border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className={`font-bold ${darkMode ? 'bg-slate-800' : 'bg-slate-100 text-slate-800'}`}>
                <tr className="border-b border-slate-300 dark:border-slate-700">
                  <th className="p-2.5 text-center w-10 border-r">અનુ.</th>
                  <th className="p-2.5 border-r">ડેડ સ્ટોક નં.</th>
                  <th className="p-2.5 border-r">મિલકત / સાધનની વિગત</th>
                  <th className="p-2.5 border-r">પ્રકાર</th>
                  <th className="p-2.5 text-center border-r">ખરીદ તારીખ</th>
                  <th className="p-2.5 text-center border-r">જથ્થો (Qty)</th>
                  <th className="p-2.5 border-r">સ્થળ (Location)</th>
                  <th className="p-2.5 text-right border-r">મૂળ કિંમત (₹)</th>
                  <th className="p-2.5 text-right border-r">ચોપડે કિંમત (₹)</th>
                  <th className="p-2.5 text-center">ભૌતિક સ્થિતિ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {assets.map((a, idx) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 text-center font-mono font-bold border-r text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-indigo-700 dark:text-indigo-300 border-r">{a.deadStockNo || `DS-${(idx + 1).toString().padStart(3, '0')}`}</td>
                    <td className="p-2.5 font-bold border-r">
                      {a.nameGuj}
                      {a.billRefGuj && <span className="text-[10px] text-slate-400 font-normal block">બિલ: {a.billRefGuj}</span>}
                    </td>
                    <td className="p-2.5 border-r">{a.typeGuj.split(' ')[0]}</td>
                    <td className="p-2.5 text-center font-mono border-r">{a.purchaseDate}</td>
                    <td className="p-2.5 text-center font-bold font-mono border-r text-amber-600">{a.quantity || 1}</td>
                    <td className="p-2.5 border-r">{a.locationGuj || 'મુખ્ય ઓફિસ'}</td>
                    <td className="p-2.5 text-right font-mono font-bold border-r">₹ {a.purchaseAmount.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right font-mono font-black text-emerald-600 border-r">₹ {a.currentValue.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {a.conditionGuj ? a.conditionGuj.split(' ')[0] : 'ચાલુ સ્થિતિ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-black bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                  <td colSpan={5} className="p-3 text-right">કુલ સરવાળો (TOTAL DEAD STOCK):</td>
                  <td className="p-3 text-center font-mono text-amber-600">{totalQuantity} નંગ</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right font-mono text-indigo-600">₹ {totalAssetCost.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-mono text-emerald-600">₹ {totalCurrentValue.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-center text-[10px] text-slate-500">ઓડિટ પ્રમાણિત</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className={`p-4 rounded-xl border ${cardBg} border-dashed flex gap-3 text-xs items-center`}>
        <Info className="w-5 h-5 text-indigo-600 shrink-0" />
        <p className={textMuted}>
          આઇટીઆર (ITR) ઓડિટ પત્રક માટે, ઘસારો સીધી લીટી (Straight Line Method) અથવા બ્લોક ઓફ એસેટ્સ વેટ-ડાઉન વેલ્યુ (WDV Method) નિયમ મુજબ સ્વયં સંચાલિત રીતે ગણતરી થાય છે.
        </p>
      </div>

      {/* Custom Depreciation Confirmation Modal */}
      {showDepreciateConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-850 text-white' : 'bg-white border-slate-150 text-slate-900'} shadow-xl space-y-4`}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <Calculator className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black">વાર્ષિક ઘસારો ગણવાની પુષ્ટિ</h3>
            </div>
            <p className={`text-xs ${textMuted} leading-relaxed`}>
              શું તમે તમામ મિલકતો પર વાર્ષિક ઘસારો ગણવા માંગો છો? આનાથી દરેક એસેટની ચોપડે કિંમત (Current Book Value) વાર્ષિક ઘસારા દર મુજબ ઘટી જશે અને તેની ગણતરી રજિસ્ટરમાં નોંધાશે.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDepreciateConfirm(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                રદ કરો (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  onDepreciateAssets();
                  setShowDepreciateConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                હા, ઘસારો ગણો (Calculate)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Custom Asset Delete Confirmation Modal */}
      {assetToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-850 text-white' : 'bg-white border-slate-150 text-slate-900'} shadow-xl space-y-4`}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black">મિલકત રદ કરવાની પુષ્ટિ</h3>
            </div>
            <p className={`text-xs ${textMuted} leading-relaxed`}>
              શું તમે ખરેખર મિલકત <strong className="text-slate-900 dark:text-white font-black">"{assetToDelete.nameGuj}"</strong> રદ કરવા માંગો છો? આ પ્રક્રિયા પાછી ખેંચી શકાશે નહીં.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAssetToDelete(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                રદ કરો (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAsset) {
                    onDeleteAsset(assetToDelete.id);
                  }
                  setAssetToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                હા, રદ કરો (Delete)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
