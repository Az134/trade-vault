import { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Trade, TradeFormData, FilterPeriod } from './types/trade';
import { createTradeFromForm, tradeToFormData, calculateStats, filterTradesByPeriod, exportTrades } from './utils/tradeUtils';
import Modal from './components/Modal';
import TradeForm from './components/TradeForm';
import TradeTable from './components/TradeTable';
import TradeDetail from './components/TradeDetail';
import StatsCard from './components/StatsCard';
import PnlChart from './components/PnlChart';
import InstallPrompt from './components/InstallPrompt';
import { cn } from './utils/cn';
import {
  Plus, BarChart3, TrendingUp, TrendingDown, DollarSign,
  Target, Activity, Award, Zap, Receipt,
  Download, Search, LayoutDashboard, List, LineChart,
  Flame, AlertTriangle, X,
} from 'lucide-react';

type ViewTab = 'dashboard' | 'trades' | 'charts';

export default function App() {
  const [trades, setTrades] = useLocalStorage<Trade[]>('tradevault_trades', []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [period, setPeriod] = useState<FilterPeriod>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');

  // Filtered trades
  const filteredTrades = useMemo(() => {
    let result = filterTradesByPeriod(trades, period);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.symbol.toLowerCase().includes(q) ||
        t.strategy.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    if (directionFilter !== 'all') {
      result = result.filter(t => t.direction === directionFilter);
    }
    return result;
  }, [trades, period, searchQuery, statusFilter, directionFilter]);

  const stats = useMemo(() => calculateStats(filteredTrades), [filteredTrades]);

  // Build a unique, most-recently-used list of symbols from trade history
  const recentSymbols = useMemo(() => {
    const seen = new Set<string>();
    return [...trades]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .reduce<string[]>((acc, t) => {
        const sym = t.symbol.toUpperCase();
        if (!seen.has(sym)) {
          seen.add(sym);
          acc.push(sym);
        }
        return acc;
      }, [])
      .slice(0, 15);
  }, [trades]);

  const handleAddTrade = useCallback((formData: TradeFormData) => {
    const newTrade = createTradeFromForm(formData);
    setTrades(prev => [...prev, newTrade]);
    setIsFormOpen(false);
  }, [setTrades]);

  const handleEditTrade = useCallback((formData: TradeFormData) => {
    if (!editingTrade) return;
    const updated = createTradeFromForm(formData, editingTrade.id);
    updated.createdAt = editingTrade.createdAt;
    setTrades(prev => prev.map(t => t.id === editingTrade.id ? updated : t));
    setEditingTrade(null);
  }, [editingTrade, setTrades]);

  const handleDeleteTrade = useCallback((id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  }, [setTrades]);

  const handleExport = () => {
    const csv = exportTrades(filteredTrades);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradevault-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete ALL trades? This cannot be undone.')) {
      setTrades([]);
    }
  };

  const periods: { value: FilterPeriod; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  const tabs: { value: ViewTab; label: string; icon: typeof LayoutDashboard }[] = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'trades', label: 'Trades', icon: List },
    { value: 'charts', label: 'Charts', icon: LineChart },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20">
                TV
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">TradeVault</h1>
                <p className="text-[10px] text-slate-500 -mt-0.5 hidden sm:block">Trade Journal & Analytics</p>
              </div>
            </div>

            {/* Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/30">
              {tabs.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab.value
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {trades.length > 0 && (
                <button
                  onClick={handleExport}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm"
                >
                  <Download size={15} />
                  Export
                </button>
              )}
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:from-blue-500 hover:to-blue-400 transition-all text-sm shadow-lg shadow-blue-600/25"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Trade</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="md:hidden sticky top-16 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-4 py-2">
        <nav className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/30">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                activeTab === tab.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/30">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  period === p.value
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-500 hover:text-white'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search symbol, strategy, tags..."
              className="w-full bg-slate-800/50 border border-slate-700/30 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/30 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Status</option>
            <option value="WIN">Win</option>
            <option value="LOSS">Loss</option>
            <option value="BREAKEVEN">Breakeven</option>
            <option value="OPEN">Open</option>
          </select>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={e => setDirectionFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/30 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Sides</option>
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>

          <div className="text-xs text-slate-500 ml-auto">
            {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              <StatsCard
                title="Total P&L"
                value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
                icon={DollarSign}
                color={stats.totalPnl >= 0 ? 'green' : 'red'}
              />
              <StatsCard
                title="Win Rate"
                value={`${stats.winRate.toFixed(1)}%`}
                icon={Target}
                color={stats.winRate >= 50 ? 'green' : 'red'}
                subtitle={`${stats.totalTrades} closed trades`}
              />
              <StatsCard
                title="Profit Factor"
                value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                icon={TrendingUp}
                color={stats.profitFactor >= 1 ? 'green' : 'red'}
              />
              <StatsCard
                title="Avg Win"
                value={`+$${stats.avgWin.toFixed(2)}`}
                icon={Award}
                color="green"
              />
              <StatsCard
                title="Avg Loss"
                value={`-$${stats.avgLoss.toFixed(2)}`}
                icon={TrendingDown}
                color="red"
              />
              <StatsCard
                title="Open Trades"
                value={stats.openTrades}
                icon={Activity}
                color="blue"
              />
              <StatsCard
                title="Best Trade"
                value={`+$${stats.bestTrade.toFixed(2)}`}
                icon={Zap}
                color="cyan"
              />
              <StatsCard
                title="Worst Trade"
                value={`$${stats.worstTrade.toFixed(2)}`}
                icon={AlertTriangle}
                color="red"
              />
              <StatsCard
                title="Win Streak"
                value={stats.winStreak}
                icon={Flame}
                color="purple"
              />
              <StatsCard
                title="Loss Streak"
                value={stats.lossStreak}
                icon={Flame}
                color="red"
              />
              <StatsCard
                title="Total Fees"
                value={`$${stats.totalFees.toFixed(2)}`}
                icon={Receipt}
                color="yellow"
              />
              <StatsCard
                title="Net Trades"
                value={stats.totalTrades}
                icon={BarChart3}
                color="blue"
              />
            </div>

            {/* Charts Preview */}
            <PnlChart trades={filteredTrades} />

            {/* Recent Trades */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <List size={18} className="text-slate-400" />
                  Recent Trades
                </h2>
                <button
                  onClick={() => setActiveTab('trades')}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  View All →
                </button>
              </div>
              <TradeTable
                trades={filteredTrades.slice(0, 10)}
                onEdit={trade => { setEditingTrade(trade); }}
                onDelete={handleDeleteTrade}
                onView={trade => setViewingTrade(trade)}
              />
            </div>
          </>
        )}

        {/* Trades View */}
        {activeTab === 'trades' && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <List size={18} className="text-slate-400" />
                All Trades
              </h2>
              <div className="flex items-center gap-2">
                {trades.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            <TradeTable
              trades={filteredTrades}
              onEdit={trade => { setEditingTrade(trade); }}
              onDelete={handleDeleteTrade}
              onView={trade => setViewingTrade(trade)}
            />
          </div>
        )}

        {/* Charts View */}
        {activeTab === 'charts' && (
          <PnlChart trades={filteredTrades} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <p className="text-xs text-slate-600">TradeVault — All data stored locally in your browser.</p>
          <p className="text-xs text-slate-600">{trades.length} total trades</p>
        </div>
      </footer>

      {/* Add Trade Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add New Trade"
        size="xl"
      >
        <TradeForm
          onSubmit={handleAddTrade}
          onCancel={() => setIsFormOpen(false)}
          recentSymbols={recentSymbols}
        />
      </Modal>

      {/* Edit Trade Modal */}
      <Modal
        isOpen={!!editingTrade}
        onClose={() => setEditingTrade(null)}
        title="Edit Trade"
        size="xl"
      >
        {editingTrade && (
          <TradeForm
            initialData={tradeToFormData(editingTrade)}
            onSubmit={handleEditTrade}
            onCancel={() => setEditingTrade(null)}
            isEditing
            recentSymbols={recentSymbols}
          />
        )}
      </Modal>

      {/* View Trade Modal */}
      <Modal
        isOpen={!!viewingTrade}
        onClose={() => setViewingTrade(null)}
        title="Trade Details"
        size="lg"
      >
        {viewingTrade && <TradeDetail trade={viewingTrade} />}
      </Modal>

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-bottom-4 {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeIn 0.2s ease-out; }
        .slide-in-from-bottom-4 { animation: slide-in-from-bottom-4 0.3s ease-out; }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        
        /* Select styling */
        select option { background: #1e293b; color: #e2e8f0; }
        
        /* Date input icon color */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
        }
        
        /* PWA standalone mode adjustments */
        @media (display-mode: standalone) {
          body { -webkit-user-select: none; user-select: none; }
        }
      `}</style>
    </div>
  );
}
