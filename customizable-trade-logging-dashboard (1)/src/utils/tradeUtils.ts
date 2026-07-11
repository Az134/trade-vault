import { Trade, DashboardStats, TradeFormData } from '../types/trade';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';
import type { FilterPeriod } from '../types/trade';

export function calculatePnl(trade: Partial<Trade>): number | null {
  if (!trade.entryPrice || !trade.exitPrice || !trade.quantity) return null;
  const raw = trade.direction === 'LONG'
    ? (trade.exitPrice - trade.entryPrice) * trade.quantity
    : (trade.entryPrice - trade.exitPrice) * trade.quantity;
  return raw - (trade.fees || 0);
}

export function createTradeFromForm(form: TradeFormData, existingId?: string): Trade {
  const now = new Date().toISOString();
  const entryPrice = parseFloat(form.entryPrice) || 0;
  const exitPrice = form.exitPrice ? parseFloat(form.exitPrice) : null;
  const quantity = parseFloat(form.quantity) || 0;
  const fees = parseFloat(form.fees) || 0;

  const trade: Trade = {
    id: existingId || uuidv4(),
    symbol: form.symbol.toUpperCase().trim(),
    direction: form.direction,
    status: form.status,
    assetClass: form.assetClass,
    entryPrice,
    exitPrice,
    quantity,
    entryDate: form.entryDate,
    exitDate: form.exitDate || null,
    fees,
    pnl: null,
    notes: form.notes.trim(),
    tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    strategy: form.strategy.trim(),
    createdAt: existingId ? now : now,
    updatedAt: now,
  };

  if (exitPrice !== null && quantity > 0) {
    trade.pnl = calculatePnl(trade);
  }

  return trade;
}

export function getEmptyFormData(): TradeFormData {
  return {
    symbol: '',
    direction: 'LONG',
    status: 'WIN',
    assetClass: 'Stocks',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    entryDate: new Date().toISOString().split('T')[0],
    exitDate: '',
    fees: '0',
    notes: '',
    tags: '',
    strategy: '',
  };
}

export function tradeToFormData(trade: Trade): TradeFormData {
  return {
    symbol: trade.symbol,
    direction: trade.direction,
    status: trade.status,
    assetClass: trade.assetClass,
    entryPrice: trade.entryPrice.toString(),
    exitPrice: trade.exitPrice?.toString() || '',
    quantity: trade.quantity.toString(),
    entryDate: trade.entryDate,
    exitDate: trade.exitDate || '',
    fees: trade.fees.toString(),
    notes: trade.notes,
    tags: trade.tags.join(', '),
    strategy: trade.strategy,
  };
}

export function calculateStats(trades: Trade[]): DashboardStats {
  const closedTrades = trades.filter(t => t.status !== 'OPEN');
  const wins = closedTrades.filter(t => t.status === 'WIN');
  const losses = closedTrades.filter(t => t.status === 'LOSS');
  const openTrades = trades.filter(t => t.status === 'OPEN');

  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalFees = trades.reduce((sum, t) => sum + t.fees, 0);

  const winPnls = wins.map(t => t.pnl || 0);
  const lossPnls = losses.map(t => t.pnl || 0);

  const avgWin = winPnls.length > 0 ? winPnls.reduce((a, b) => a + b, 0) / winPnls.length : 0;
  const avgLoss = lossPnls.length > 0 ? Math.abs(lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length) : 0;

  const grossWins = winPnls.reduce((a, b) => a + b, 0);
  const grossLosses = Math.abs(lossPnls.reduce((a, b) => a + b, 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;

  const allPnls = closedTrades.map(t => t.pnl || 0);
  const bestTrade = allPnls.length > 0 ? Math.max(...allPnls) : 0;
  const worstTrade = allPnls.length > 0 ? Math.min(...allPnls) : 0;

  // Calculate streaks
  let winStreak = 0, lossStreak = 0, curWin = 0, curLoss = 0;
  const sorted = [...closedTrades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
  for (const t of sorted) {
    if (t.status === 'WIN') {
      curWin++;
      curLoss = 0;
      winStreak = Math.max(winStreak, curWin);
    } else if (t.status === 'LOSS') {
      curLoss++;
      curWin = 0;
      lossStreak = Math.max(lossStreak, curLoss);
    } else {
      curWin = 0;
      curLoss = 0;
    }
  }

  return {
    totalTrades: closedTrades.length,
    winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
    totalPnl,
    avgWin,
    avgLoss,
    profitFactor,
    bestTrade,
    worstTrade,
    totalFees,
    openTrades: openTrades.length,
    winStreak,
    lossStreak,
  };
}

export function filterTradesByPeriod(trades: Trade[], period: FilterPeriod): Trade[] {
  if (period === 'all') return trades;
  const now = new Date();
  let start: Date;
  switch (period) {
    case 'today': start = startOfDay(now); break;
    case 'week': start = startOfWeek(now); break;
    case 'month': start = startOfMonth(now); break;
    case 'year': start = startOfYear(now); break;
    default: return trades;
  }
  return trades.filter(t => isAfter(new Date(t.entryDate), start) || new Date(t.entryDate).getTime() === start.getTime());
}

export function exportTrades(trades: Trade[]): string {
  const headers = ['Symbol', 'Direction', 'Status', 'Asset Class', 'Entry Price', 'Exit Price', 'Quantity', 'Entry Date', 'Exit Date', 'Fees', 'P&L', 'Strategy', 'Tags', 'Notes'];
  const rows = trades.map(t => [
    t.symbol, t.direction, t.status, t.assetClass,
    t.entryPrice, t.exitPrice || '', t.quantity,
    t.entryDate, t.exitDate || '', t.fees, t.pnl || '',
    t.strategy, t.tags.join(';'), t.notes
  ]);
  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}
