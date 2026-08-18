/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Type, Check, X, Sparkles, SlidersHorizontal, Search, RefreshCw } from 'lucide-react';
import { GUJARATI_FONTS, GujaratiFont, getFontById } from '../data/fonts';

interface FontSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFontId: string;
  onSelectFont: (fontId: string) => void;
  darkMode: boolean;
}

export default function FontSelectorModal({
  isOpen,
  onClose,
  selectedFontId,
  onSelectFont,
  darkMode
}: FontSelectorModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('બધા ફોન્ટ');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [testText, setTestText] = useState<string>('શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - હિસાબી નામા પદ્ધતિ');

  if (!isOpen) return null;

  const categories = ['બધા ફોન્ટ', 'સામાન્ય / રનિંગ', 'ટ્રેડિશનલ / ક્લાસિક', 'કેલિગ્રાફી / સુલેખ', 'મોડર્ન સેરીફ', 'આર્ટિસ્ટિક / ડેકોરેટિવ'];

  const filteredFonts = GUJARATI_FONTS.filter(font => {
    const matchesCategory = selectedCategory === 'બધા ફોન્ટ' || font.categoryGuj === selectedCategory;
    const matchesSearch = 
      font.nameGuj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      font.nameEng.toLowerCase().includes(searchQuery.toLowerCase()) ||
      font.descriptionGuj.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentActiveFont = getFontById(selectedFontId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        } overflow-hidden`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b flex items-center justify-between gap-4 ${
          darkMode ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg shadow-inner">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">ગુજરાતી ફોન્ટ સેટિંગ્સ (Gujarati Fonts)</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  {GUJARATI_FONTS.length} ફોન્ટ ઉપલબ્ધ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                હરિકૃષ્ણ, સુલેખ, શ્રુતિ, ગોપિકા સહિત તમારી પસંદગી મુજબનો ફોન્ટ પસંદ કરો
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Test Bar */}
        <div className={`p-4 border-b space-y-3 ${
          darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-indigo-50/40 border-slate-100'
        }`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="અહીં લખાણ ટાઇપ કરીને બધા ફોન્ટમાં લાઇવ પ્રિવ્યૂ જુઓ..."
                className={`w-full px-4 py-2 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <button
              onClick={() => setTestText('શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ - હિસાબી નામા પદ્ધતિ')}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="ડિફોલ્ટ વાક્ય લાવો"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ડિફોલ્ટ ટેક્સ્ટ</span>
            </button>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : darkMode
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ફોન્ટ શોધો..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1 text-xs rounded-xl border focus:outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Font Cards Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[50vh] space-y-3">
          {filteredFonts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              કોઈ ફોન્ટ મળ્યો નથી.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredFonts.map((font) => {
                const isSelected = selectedFontId === font.id;
                return (
                  <div
                    key={font.id}
                    onClick={() => onSelectFont(font.id)}
                    className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between gap-3 ${
                      isSelected
                        ? darkMode
                          ? 'border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-950/50'
                          : 'border-indigo-600 bg-indigo-50/70 shadow-md shadow-indigo-100'
                        : darkMode
                          ? 'border-slate-800 hover:border-slate-700 bg-slate-850/60 hover:bg-slate-800'
                          : 'border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Card Top Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {font.nameGuj}
                          </h3>
                          {font.isPopular && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> લોકપ્રિય
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {font.categoryGuj} • {font.nameEng}
                        </span>
                      </div>

                      {isSelected ? (
                        <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-500 shrink-0 transition-colors">
                          <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </div>

                    {/* Font Preview Area */}
                    <div
                      className={`p-3 rounded-xl border transition-all ${
                        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-100 shadow-inner'
                      }`}
                    >
                      <div
                        className={`text-base sm:text-lg leading-relaxed text-slate-850 dark:text-slate-100 ${font.cssClass}`}
                        style={{ fontFamily: font.fontFamily }}
                      >
                        {testText || font.samplePhraseGuj}
                      </div>
                    </div>

                    {/* Description & Action */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="line-clamp-1">{font.descriptionGuj}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFont(font.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] shrink-0 transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white'
                        }`}
                      >
                        {isSelected ? 'સક્રિય છે (Selected)' : 'આ ફોન્ટ લાગુ કરો'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">હાલમાં પસંદ કરેલ ફોન્ટ:</span>
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
              {currentActiveFont.nameGuj}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSelectFont('noto-sans');
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ડિફોલ્ટ રનિંગ ફોન્ટ કરો
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all cursor-pointer"
            >
              પૂર્ણ (Done)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
