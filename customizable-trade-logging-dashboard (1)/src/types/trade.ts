export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';
export type AssetClass = 'Stocks' | 'Options' | 'Futures' | 'Forex' | 'Crypto' | 'Other';

export interface Trade {
  id: string;
  symbol: string;
  direction: TradeDirection;
  status: TradeStatus;
  assetClass: AssetClass;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  entryDate: string;
  exitDate: string | null;
  fees: number;
  pnl: number | null;
  notes: string;
  tags: string[];
  strategy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeFormData {
  symbol: string;
  direction: TradeDirection;
  status: TradeStatus;
  assetClass: AssetClass;
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  entryDate: string;
  exitDate: string;
  fees: string;
  notes: string;
  tags: string;
  strategy: string;
}

export interface DashboardStats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  totalFees: number;
  openTrades: number;
  winStreak: number;
  lossStreak: number;
}

export type FilterPeriod = 'all' | 'today' | 'week' | 'month' | 'year';
export type SortField = 'entryDate' | 'symbol' | 'pnl' | 'status' | 'direction';
export type SortOrder = 'asc' | 'desc';
