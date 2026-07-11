import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { SYMBOLS, SymbolEntry } from '../data/symbols';
import { cn } from '../utils/cn';
import { Search, Clock, Star, TrendingUp, X } from 'lucide-react';

interface SymbolAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  recentSymbols?: string[];
  className?: string;
  hasError?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  Stocks: '📈',
  Crypto: '₿',
  Forex: '💱',
  Futures: '📊',
  ETFs: '🏦',
  Indices: '📉',
};

const CATEGORY_COLORS: Record<string, string> = {
  Stocks: 'text-blue-400 bg-blue-500/10',
  Crypto: 'text-amber-400 bg-amber-500/10',
  Forex: 'text-emerald-400 bg-emerald-500/10',
  Futures: 'text-purple-400 bg-purple-500/10',
  ETFs: 'text-cyan-400 bg-cyan-500/10',
  Indices: 'text-rose-400 bg-rose-500/10',
};

export default function SymbolAutocomplete({
  value,
  onChange,
  recentSymbols = [],
  className,
  hasError = false,
}: SymbolAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Build suggestions ──
  const suggestions = useMemo(() => {
    const query = value.trim().toUpperCase();

    // If empty, show recent + popular
    if (!query) {
      const recentEntries: (SymbolEntry & { isRecent: boolean })[] = recentSymbols
        .slice(0, 5)
        .map(sym => {
          const found = SYMBOLS.find(s => s.symbol === sym);
          return {
            symbol: sym,
            name: found?.name || sym,
            category: (found?.category || 'Stocks') as SymbolEntry['category'],
            isRecent: true,
          };
        });

      const popular = SYMBOLS
        .filter(s => ['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'BTC/USD', 'ETH/USD', 'EUR/USD', 'ES', 'META'].includes(s.symbol))
        .map(s => ({ ...s, isRecent: false }));

      return { recent: recentEntries, results: popular, total: popular.length };
    }

    // Fuzzy match: symbol starts with, symbol contains, name contains
    const startsWithSymbol: (SymbolEntry & { isRecent: boolean })[] = [];
    const containsSymbol: (SymbolEntry & { isRecent: boolean })[] = [];
    const containsName: (SymbolEntry & { isRecent: boolean })[] = [];

    for (const entry of SYMBOLS) {
      const sym = entry.symbol.toUpperCase();
      const name = entry.name.toUpperCase();
      if (sym.startsWith(query)) {
        startsWithSymbol.push({ ...entry, isRecent: false });
      } else if (sym.includes(query)) {
        containsSymbol.push({ ...entry, isRecent: false });
      } else if (name.includes(query)) {
        containsName.push({ ...entry, isRecent: false });
      }
    }

    const results = [...startsWithSymbol, ...containsSymbol, ...containsName].slice(0, 20);

    // Also check if any recent symbols match
    const recentMatches = recentSymbols
      .filter(sym => {
        const upper = sym.toUpperCase();
        return upper.includes(query) && !results.some(r => r.symbol === sym);
      })
      .slice(0, 3)
      .map(sym => {
        const found = SYMBOLS.find(s => s.symbol === sym);
        return {
          symbol: sym,
          name: found?.name || sym,
          category: (found?.category || 'Stocks') as SymbolEntry['category'],
          isRecent: true,
        };
      });

    return { recent: recentMatches, results, total: recentMatches.length + results.length };
  }, [value, recentSymbols]);

  const allItems = useMemo(() => {
    return [...suggestions.recent, ...suggestions.results];
  }, [suggestions]);

  // ── Click outside to close ──
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Scroll highlighted item into view ──
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-suggestion-item]');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  const selectSymbol = useCallback((symbol: string) => {
    onChange(symbol);
    setIsOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.blur();
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => (prev + 1) % allItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => (prev - 1 + allItems.length) % allItems.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < allItems.length) {
          selectSymbol(allItems[highlightIndex].symbol);
        } else if (allItems.length > 0) {
          selectSymbol(allItems[0].symbol);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toUpperCase().indexOf(query.toUpperCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-blue-400 font-bold">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search AAPL, BTC, EUR/USD..."
          autoComplete="off"
          className={cn(
            'w-full bg-slate-900/50 border rounded-lg pl-10 pr-9 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm',
            hasError
              ? 'border-red-500 focus:ring-red-500/50'
              : 'border-slate-600 focus:ring-blue-500/50 focus:border-blue-500',
            className,
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); inputRef.current?.focus(); setIsOpen(true); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && allItems.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 top-full mt-1.5 left-0 w-full bg-slate-800 border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
          style={{ maxHeight: '320px', overflowY: 'auto' }}
        >
          {/* Recent section */}
          {suggestions.recent.length > 0 && (
            <>
              <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
                <Clock size={11} className="text-slate-500" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Recent</span>
              </div>
              {suggestions.recent.map((item, idx) => {
                const globalIdx = idx;
                return (
                  <button
                    key={`recent-${item.symbol}`}
                    type="button"
                    data-suggestion-item
                    onClick={() => selectSymbol(item.symbol)}
                    onMouseEnter={() => setHighlightIndex(globalIdx)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                      highlightIndex === globalIdx
                        ? 'bg-blue-600/20'
                        : 'hover:bg-slate-700/50'
                    )}
                  >
                    <span className="text-base w-5 text-center">{CATEGORY_ICONS[item.category] || '📈'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{highlightMatch(item.symbol, value.trim())}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', CATEGORY_COLORS[item.category])}>
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{item.name}</p>
                    </div>
                    <Clock size={12} className="text-slate-600 shrink-0" />
                  </button>
                );
              })}
              {suggestions.results.length > 0 && (
                <div className="border-t border-slate-700/40 mx-3" />
              )}
            </>
          )}

          {/* Results section */}
          {suggestions.results.length > 0 && (
            <>
              <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
                {value.trim() ? (
                  <>
                    <TrendingUp size={11} className="text-slate-500" />
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Matches ({suggestions.results.length})
                    </span>
                  </>
                ) : (
                  <>
                    <Star size={11} className="text-slate-500" />
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Popular
                    </span>
                  </>
                )}
              </div>
              {suggestions.results.map((item, idx) => {
                const globalIdx = suggestions.recent.length + idx;
                return (
                  <button
                    key={`result-${item.symbol}`}
                    type="button"
                    data-suggestion-item
                    onClick={() => selectSymbol(item.symbol)}
                    onMouseEnter={() => setHighlightIndex(globalIdx)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                      highlightIndex === globalIdx
                        ? 'bg-blue-600/20'
                        : 'hover:bg-slate-700/50'
                    )}
                  >
                    <span className="text-base w-5 text-center">{CATEGORY_ICONS[item.category] || '📈'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{highlightMatch(item.symbol, value.trim())}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', CATEGORY_COLORS[item.category])}>
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{highlightMatch(item.name, value.trim())}</p>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Tip footer */}
          <div className="px-3 py-2 border-t border-slate-700/40 bg-slate-800/50">
            <p className="text-[10px] text-slate-600 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[9px] font-mono">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[9px] font-mono">↵</kbd> select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[9px] font-mono">esc</kbd> close
              </span>
            </p>
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && value.trim() && allItems.length === 0 && (
        <div className="absolute z-50 top-full mt-1.5 left-0 w-full bg-slate-800 border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 p-4 text-center">
          <p className="text-sm text-slate-400 mb-1">No symbols found for "<span className="text-white font-medium">{value}</span>"</p>
          <p className="text-xs text-slate-500">You can still type any custom symbol</p>
        </div>
      )}
    </div>
  );
}
