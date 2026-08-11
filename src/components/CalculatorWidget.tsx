import React, { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Copy, Check, Trash2, History, Sun, Moon } from 'lucide-react';

interface CalculatorWidgetProps {
  onClose: () => void;
}

interface CalcHistoryItem {
  equation: string;
  result: string;
}

export default function CalculatorWidget({ onClose }: CalculatorWidgetProps) {
  const [displayValue, setDisplayValue] = useState('0');
  const [equation, setEquation] = useState('');
  const [calcTheme, setCalcTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('calc_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });
  const [history, setHistory] = useState<CalcHistoryItem[]>(() => {
    const saved = localStorage.getItem('calc_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);

  // Position state for basic dragging
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // For reset after pressing equals
  const resetOnNextNumber = useRef(false);

  // Save history & theme to localstorage
  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('calc_theme', calcTheme);
  }, [calcTheme]);

  const toggleTheme = () => {
    setCalcTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Handle keyboard events
  useEffect(() => {
    if (isMinimized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if user is typing in form inputs/textarea
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || activeElement.getAttribute('contenteditable') === 'true') {
          return;
        }
      }

      const key = e.key;

      if (/[0-9.]/.test(key)) {
        e.preventDefault();
        handleNumber(key);
      } else if (['+', '-', '*', '/'].includes(key)) {
        e.preventDefault();
        handleOperator(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === '%') {
        e.preventDefault();
        handlePercentage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [displayValue, equation, isMinimized]);

  const handleNumber = (num: string) => {
    if (resetOnNextNumber.current) {
      setDisplayValue(num === '.' ? '0.' : num);
      resetOnNextNumber.current = false;
    } else {
      if (num === '.' && displayValue.includes('.')) return;
      if (displayValue === '0' && num !== '.') {
        setDisplayValue(num);
      } else {
        setDisplayValue(prev => prev + num);
      }
    }
  };

  const handleOperator = (op: string) => {
    resetOnNextNumber.current = false;
    const currentVal = parseFloat(displayValue) || 0;
    
    // If we already have an operator at the end of equation, change it
    const trimmedEq = equation.trim();
    const lastChar = trimmedEq.slice(-1);
    
    if (['+', '-', '*', '/'].includes(lastChar) && displayValue === '0') {
      setEquation(trimmedEq.slice(0, -1) + op + ' ');
    } else {
      setEquation(prev => prev + ' ' + currentVal + ' ' + op);
      setDisplayValue('0');
    }
  };

  const handleCalculate = () => {
    if (!equation) return;
    
    const currentVal = parseFloat(displayValue) || 0;
    const fullEquation = `${equation} ${currentVal}`;
    
    try {
      // Safe mathematical evaluation
      // Replace safe multiplication and division
      const sanitizedEq = fullEquation
        .replace(/×/g, '*')
        .replace(/÷/g, '/');
      
      // We use Function instead of eval to evaluate safe simple expressions
      const calculation = new Function(`return (${sanitizedEq})`)();
      
      // Format response to avoid floating point issues (e.g. 0.1 + 0.2 = 0.3000000000004)
      const resultVal = parseFloat(Number(calculation).toFixed(8)).toString();
      
      setDisplayValue(resultVal);
      setEquation('');
      
      // Save to history
      const newHistoryItem: CalcHistoryItem = {
        equation: fullEquation + ' =',
        result: resultVal
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
      resetOnNextNumber.current = true;
    } catch (err) {
      setDisplayValue('Error');
      setEquation('');
      resetOnNextNumber.current = true;
    }
  };

  const handleClear = () => {
    setDisplayValue('0');
    setEquation('');
    resetOnNextNumber.current = false;
  };

  const handleBackspace = () => {
    if (displayValue.length > 1) {
      setDisplayValue(prev => prev.slice(0, -1));
    } else {
      setDisplayValue('0');
    }
  };

  const handlePercentage = () => {
    const currentVal = parseFloat(displayValue) || 0;
    setDisplayValue((currentVal / 100).toString());
  };

  const handleToggleSign = () => {
    const currentVal = parseFloat(displayValue) || 0;
    setDisplayValue((currentVal * -1).toString());
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(displayValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const useHistoryItem = (item: CalcHistoryItem) => {
    setDisplayValue(item.result);
    setEquation('');
    resetOnNextNumber.current = true;
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't drag if clicking buttons
    if (target.closest('button')) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate delta
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      
      // Keep inside bounds roughly
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (isMinimized) {
    return (
      <div 
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className="fixed bottom-6 right-6 z-50 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        onClick={() => setIsMinimized(false)}
        title="કેલ્ક્યુલેટર મોટું કરો"
      >
        <span className="font-bold text-lg select-none px-1">🧮</span>
      </div>
    );
  }

  return (
    <div
      ref={widgetRef}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      className={`fixed bottom-6 right-6 z-50 w-80 rounded-2xl shadow-2xl select-none overflow-hidden flex flex-col font-sans transition-colors duration-200 ${
        calcTheme === 'dark' 
          ? 'bg-slate-900 border border-slate-700/80 text-white' 
          : 'bg-white border border-slate-300 text-slate-900 shadow-slate-400/30'
      }`}
    >
      {/* Header bar (draggable) */}
      <div
        onMouseDown={handleMouseDown}
        className={`px-4 py-3 flex items-center justify-between cursor-move border-b transition-colors ${
          calcTheme === 'dark'
            ? 'bg-slate-950 border-slate-800/80'
            : 'bg-slate-100 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 font-bold">🧮</span>
          <span className={`text-xs font-bold tracking-wide font-mono ${calcTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            કેલ્ક્યુલેટર (Calculator)
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Light / Dark Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-md transition-colors ${
              calcTheme === 'dark'
                ? 'text-yellow-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={calcTheme === 'dark' ? 'લાઈટ થીમ કરો (Switch to Light Theme)' : 'ડાર્ક થીમ કરો (Switch to Dark Theme)'}
          >
            {calcTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowHistory(prev => !prev)}
            className={`p-1.5 rounded-md transition-colors ${
              showHistory 
                ? 'bg-emerald-500/20 text-emerald-500 font-bold' 
                : calcTheme === 'dark'
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title="ઇતિહાસ (History)"
          >
            <History className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className={`p-1.5 rounded-md transition-colors ${
              calcTheme === 'dark'
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title="નાનું કરો"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:bg-red-500/20 hover:text-red-500 transition-colors"
            title="બંધ કરો"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body with History slide-out */}
      <div className="relative flex flex-col flex-1">
        {/* History Panel Overlay */}
        {showHistory && (
          <div className={`absolute inset-0 z-10 p-3 flex flex-col border-b transition-colors ${
            calcTheme === 'dark' 
              ? 'bg-slate-950/95 border-slate-800' 
              : 'bg-slate-50/95 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${calcTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                ગણતરી ઇતિહાસ
              </span>
              <button
                onClick={clearHistory}
                className="text-[10px] text-red-500 hover:text-red-600 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> સાફ કરો
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-56">
              {history.length === 0 ? (
                <div className={`h-full flex items-center justify-center text-xs italic ${calcTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  કોઈ ઇતિહાસ નથી
                </div>
              ) : (
                history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => useHistoryItem(item)}
                    className={`w-full text-left p-1.5 rounded transition-all text-xs block group border ${
                      calcTheme === 'dark'
                        ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
                        : 'bg-white hover:bg-slate-100 border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className={`text-[10px] font-mono truncate ${calcTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{item.equation}</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate">{item.result}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Display screen */}
        <div className={`p-4 text-right flex flex-col justify-end min-h-24 transition-colors ${
          calcTheme === 'dark' ? 'bg-slate-950/60' : 'bg-slate-100/90'
        }`}>
          <div className={`text-xs font-mono min-h-5 truncate ${calcTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {equation}
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight truncate my-1 ${calcTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {displayValue}
          </div>
          <div className={`flex justify-between items-center mt-2 pt-2 border-t ${calcTheme === 'dark' ? 'border-slate-800/60' : 'border-slate-200'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${calcTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              નકલ કરો
            </span>
            <button
              onClick={handleCopyToClipboard}
              className={`px-2 py-1 rounded text-[10px] font-bold font-mono flex items-center gap-1 transition-all ${
                copied 
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40' 
                  : calcTheme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-transparent'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300/50'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" /> કોપી થયેલ
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> કોપી કરો
                </>
              )}
            </button>
          </div>
        </div>

        {/* Keypad */}
        <div className={`p-3 grid grid-cols-4 gap-2 border-t text-sm font-medium transition-colors ${
          calcTheme === 'dark' 
            ? 'bg-slate-900 border-slate-800/60' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Row 1 */}
          <button
            onClick={handleClear}
            className={`p-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 ${
              calcTheme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-400'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 shadow-sm'
            }`}
          >
            C
          </button>
          <button
            onClick={handleToggleSign}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${
              calcTheme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700 border border-slate-300/50 shadow-sm'
            }`}
          >
            +/-
          </button>
          <button
            onClick={handlePercentage}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${
              calcTheme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700 border border-slate-300/50 shadow-sm'
            }`}
          >
            %
          </button>
          <button
            onClick={() => handleOperator('/')}
            className={`p-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 ${
              calcTheme === 'dark'
                ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400'
                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300/60 shadow-sm'
            }`}
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleNumber('7')}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-mono text-base ${
              calcTheme === 'dark'
                ? 'bg-slate-800/40 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
            }`}
          >
            7
          </button>
          <button
            onClick={() => handleNumber('8')}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-mono text-base ${
              calcTheme === 'dark'
                ? 'bg-slate-800/40 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
            }`}
          >
            8
          </button>
          <button
            onClick={() => handleNumber('9')}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-mono text-base ${
              calcTheme === 'dark'
                ? 'bg-slate-800/40 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
            }`}
          >
            9
          </button>
          <button
            onClick={() => handleOperator('*')}
            className={`p-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 ${
              calcTheme === 'dark'
                ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400'
                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300/60 shadow-sm'
            }`}
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleNumber('4')}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-mono text-base ${
              calcTheme === 'dark'
                ? 'bg-slate-800/40 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
            }`}
          >
            4
          </button>
          <button
            onClick={() => handleNumber('5')}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-mono text-base ${
              calcTheme === 'dark'
                ? 'bg-slate-800/40 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
            }`}
          >
            5
          </button>
          <button
            onClick={() => handleNumber('6')}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-mono text-base ${
              calcTheme === 'dark'
                ? 'bg-slate-800/40 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
            }`}
          >
            6
          </button>
          <button
            onClick={() => handleOperator('-')}
            className={`p-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 ${
              calcTheme === 'dark'
                ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400'
                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300/60 shadow-sm'
            }`}
          >
            -
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleNumber('1')}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-mono text-base ${
              calcTheme === 'dark'
                ? 'bg-slate-800/40 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
            }`}
          >
            1
          </button>
          <button
            onClick={() => handleNumber('2')}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-mono text-base ${
              calcTheme === 'dark'
                ? 'bg-slate-800/40 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
            }`}
          >
            2
          </button>
          <button
            onClick={() => handleNumber('3')}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-mono text-base ${
              calcTheme === 'dark'
                ? 'bg-slate-800/40 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
            }`}
          >
            3
          </button>
          <button
            onClick={() => handleOperator('+')}
            className={`p-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 ${
              calcTheme === 'dark'
                ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400'
                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300/60 shadow-sm'
            }`}
          >
            +
          </button>

          {/* Row 5 */}
          <button
            onClick={() => handleNumber('0')}
            className={`col-span-2 p-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-mono text-base text-left pl-5 ${
              calcTheme === 'dark'
                ? 'bg-slate-800/40 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
            }`}
          >
            0
          </button>
          <button
            onClick={() => handleNumber('.')}
            className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-mono text-base ${
              calcTheme === 'dark'
                ? 'bg-slate-800/40 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
            }`}
          >
            .
          </button>
          <button
            onClick={handleCalculate}
            className={`p-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 text-white ${
              calcTheme === 'dark'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/50'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
            }`}
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}
