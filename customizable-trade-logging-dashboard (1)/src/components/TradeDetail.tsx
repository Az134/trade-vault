import { Trade } from '../types/trade';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Tag, FileText, Calendar, DollarSign, BarChart3 } from 'lucide-react';

interface TradeDetailProps {
  trade: Trade;
}

export default function TradeDetail({ trade }: TradeDetailProps) {
  const statusColor: Record<string, string> = {
    WIN: 'text-emerald-400 bg-emerald-500/15',
    LOSS: 'text-red-400 bg-red-500/15',
    BREAKEVEN: 'text-amber-400 bg-amber-500/15',
    OPEN: 'text-blue-400 bg-blue-500/15',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          trade.direction === 'LONG' ? 'bg-emerald-500/20' : 'bg-red-500/20'
        )}>
          {trade.direction === 'LONG'
            ? <ArrowUpRight className="text-emerald-400" size={24} />
            : <ArrowDownRight className="text-red-400" size={24} />}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">{trade.symbol}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', statusColor[trade.status])}>
              {trade.status}
            </span>
            <span className="text-slate-500 text-sm">•</span>
            <span className="text-slate-400 text-sm">{trade.assetClass}</span>
            <span className="text-slate-500 text-sm">•</span>
            <span className={cn('text-sm font-medium', trade.direction === 'LONG' ? 'text-emerald-400' : 'text-red-400')}>
              {trade.direction}
            </span>
          </div>
        </div>
        {trade.pnl !== null && (
          <div className={cn(
            'ml-auto text-right',
          )}>
            <p className="text-xs text-slate-400">P&L</p>
            <p className={cn(
              'text-2xl font-bold font-mono',
              trade.pnl > 0 ? 'text-emerald-400' : trade.pnl < 0 ? 'text-red-400' : 'text-amber-400'
            )}>
              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Price & Quantity Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Entry Price', value: `$${trade.entryPrice.toFixed(2)}`, icon: DollarSign },
          { label: 'Exit Price', value: trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '—', icon: DollarSign },
          { label: 'Quantity', value: trade.quantity.toString(), icon: BarChart3 },
          { label: 'Fees', value: `$${trade.fees.toFixed(2)}`, icon: DollarSign },
        ].map((item, i) => (
          <div key={i} className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/30">
            <div className="flex items-center gap-1.5 mb-1">
              <item.icon size={13} className="text-slate-500" />
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
            <p className="text-white font-semibold font-mono">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar size={13} className="text-slate-500" />
            <p className="text-xs text-slate-500">Entry Date</p>
          </div>
          <p className="text-white font-medium">{format(new Date(trade.entryDate), 'MMMM dd, yyyy')}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar size={13} className="text-slate-500" />
            <p className="text-xs text-slate-500">Exit Date</p>
          </div>
          <p className="text-white font-medium">
            {trade.exitDate ? format(new Date(trade.exitDate), 'MMMM dd, yyyy') : '—'}
          </p>
        </div>
      </div>

      {/* Strategy */}
      {trade.strategy && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 size={14} className="text-slate-500" />
            <p className="text-sm font-medium text-slate-400">Strategy</p>
          </div>
          <p className="text-white">{trade.strategy}</p>
        </div>
      )}

      {/* Tags */}
      {trade.tags.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={14} className="text-slate-500" />
            <p className="text-sm font-medium text-slate-400">Tags</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {trade.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-medium border border-blue-500/20">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-center gap-1.5 mb-2">
            <FileText size={14} className="text-slate-500" />
            <p className="text-sm font-medium text-slate-400">Notes</p>
          </div>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
        </div>
      )}
    </div>
  );
}
