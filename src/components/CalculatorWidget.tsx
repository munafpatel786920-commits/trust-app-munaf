import React, { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2, Copy, Check, Trash2, History } from 'lucide-react';

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

  // Save history to localstorage
  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

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
      className="fixed bottom-6 right-6 z-50 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl select-none text-white overflow-hidden flex flex-col font-sans"
    >
      {/* Header bar (draggable) */}
      <div
        onMouseDown={handleMouseDown}
        className="px-4 py-3 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between cursor-move"
      >
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">🧮</span>
          <span className="text-xs font-bold text-slate-300 tracking-wide font-mono">કેલ્ક્યુલેટર (Calculator)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(prev => !prev)}
            className={`p-1 rounded-md transition-colors ${showHistory ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            title="ઇતિહાસ (History)"
          >
            <History className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="નાનું કરો"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:bg-red-950/40 hover:text-red-400 transition-colors"
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
          <div className="absolute inset-0 z-10 bg-slate-950/95 p-3 flex flex-col border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">ગણતરી ઇતિહાસ</span>
              <button
                onClick={clearHistory}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> સાફ કરો
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-56">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                  કોઈ ઇતિહાસ નથી
                </div>
              ) : (
                history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => useHistoryItem(item)}
                    className="w-full text-left p-1.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs block group"
                  >
                    <div className="text-[10px] text-slate-400 font-mono truncate">{item.equation}</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono truncate group-hover:text-emerald-300">{item.result}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Display screen */}
        <div className="p-4 bg-slate-950/40 text-right flex flex-col justify-end min-h-24">
          <div className="text-slate-500 text-xs font-mono min-h-5 truncate">
            {equation}
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white truncate my-1">
            {displayValue}
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/40">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">નકલ કરો</span>
            <button
              onClick={handleCopyToClipboard}
              className={`px-2 py-1 rounded text-[10px] font-bold font-mono flex items-center gap-1 transition-all ${
                copied 
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-transparent'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> કોપી થયેલ
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
        <div className="p-3 bg-slate-900 grid grid-cols-4 gap-2 border-t border-slate-800/60 text-sm font-medium">
          {/* Row 1 */}
          <button
            onClick={handleClear}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 font-bold transition-all hover:scale-105 active:scale-95"
          >
            C
          </button>
          <button
            onClick={handleToggleSign}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all hover:scale-105 active:scale-95"
          >
            +/-
          </button>
          <button
            onClick={handlePercentage}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all hover:scale-105 active:scale-95"
          >
            %
          </button>
          <button
            onClick={() => handleOperator('/')}
            className="p-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 font-bold transition-all hover:scale-105 active:scale-95"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleNumber('7')}
            className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-white transition-all hover:scale-105 active:scale-95 font-mono text-base"
          >
            7
          </button>
          <button
            onClick={() => handleNumber('8')}
            className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-white transition-all hover:scale-105 active:scale-95 font-mono text-base"
          >
            8
          </button>
          <button
            onClick={() => handleNumber('9')}
            className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-white transition-all hover:scale-105 active:scale-95 font-mono text-base"
          >
            9
          </button>
          <button
            onClick={() => handleOperator('*')}
            className="p-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 font-bold transition-all hover:scale-105 active:scale-95"
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleNumber('4')}
            className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-white transition-all hover:scale-105 active:scale-95 font-mono text-base"
          >
            4
          </button>
          <button
            onClick={() => handleNumber('5')}
            className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-white transition-all hover:scale-105 active:scale-95 font-mono text-base"
          >
            5
          </button>
          <button
            onClick={() => handleNumber('6')}
            className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-white transition-all hover:scale-105 active:scale-95 font-mono text-base"
          >
            6
          </button>
          <button
            onClick={() => handleOperator('-')}
            className="p-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 font-bold transition-all hover:scale-105 active:scale-95"
          >
            -
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleNumber('1')}
            className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-white transition-all hover:scale-105 active:scale-95 font-mono text-base"
          >
            1
          </button>
          <button
            onClick={() => handleNumber('2')}
            className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-white transition-all hover:scale-105 active:scale-95 font-mono text-base"
          >
            2
          </button>
          <button
            onClick={() => handleNumber('3')}
            className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-white transition-all hover:scale-105 active:scale-95 font-mono text-base"
          >
            3
          </button>
          <button
            onClick={() => handleOperator('+')}
            className="p-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 font-bold transition-all hover:scale-105 active:scale-95"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            onClick={() => handleNumber('0')}
            className="col-span-2 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-white transition-all hover:scale-105 active:scale-95 font-mono text-base text-left pl-5"
          >
            0
          </button>
          <button
            onClick={() => handleNumber('.')}
            className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-white transition-all hover:scale-105 active:scale-95 font-mono text-base"
          >
            .
          </button>
          <button
            onClick={handleCalculate}
            className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/50 transition-all hover:scale-105 active:scale-95"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}
