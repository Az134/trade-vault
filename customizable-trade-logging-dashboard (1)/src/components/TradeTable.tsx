import { useState } from 'react';
import { Trade, SortField, SortOrder } from '../types/trade';
import { cn } from '../utils/cn';
import { Pencil, Trash2, ChevronUp, ChevronDown, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';

interface TradeTableProps {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onView: (trade: Trade) => void;
}

export default function TradeTable({ trades, onEdit, onDelete, onView }: TradeTableProps) {
  const [sortField, setSortField] = useState<SortField>('entryDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sorted = [...trades].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'entryDate':
        cmp = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
        break;
      case 'symbol':
        cmp = a.symbol.localeCompare(b.symbol);
        break;
      case 'pnl':
        cmp = (a.pnl || 0) - (b.pnl || 0);
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'direction':
        cmp = a.direction.localeCompare(b.direction);
        break;
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex flex-col ml-1">
      {sortField === field ? (
        sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
      ) : (
        <ChevronDown size={14} className="text-slate-600" />
      )}
    </span>
  );

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      WIN: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      LOSS: 'bg-red-500/15 text-red-400 border-red-500/30',
      BREAKEVEN: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      OPEN: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    };
    return (
      <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', map[status] || map.OPEN)}>
        {status}
      </span>
    );
  };

  const handleDeleteClick = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (trades.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No trades yet</h3>
        <p className="text-slate-500">Add your first trade to get started tracking your performance.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            {([
              ['entryDate', 'Date'],
              ['symbol', 'Symbol'],
              ['direction', 'Side'],
              ['status', 'Status'],
            ] as [SortField, string][]).map(([field, label]) => (
              <th
                key={field}
                onClick={() => handleSort(field)}
                className="text-left py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white transition-colors select-none"
              >
                <span className="flex items-center">
                  {label} <SortIcon field={field} />
                </span>
              </th>
            ))}
            <th className="text-left py-3 px-4 text-slate-400 font-medium">Asset</th>
            <th className="text-right py-3 px-4 text-slate-400 font-medium">Entry</th>
            <th className="text-right py-3 px-4 text-slate-400 font-medium">Exit</th>
            <th className="text-right py-3 px-4 text-slate-400 font-medium">Qty</th>
            <th
              onClick={() => handleSort('pnl')}
              className="text-right py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white transition-colors select-none"
            >
              <span className="flex items-center justify-end">
                P&L <SortIcon field={'pnl'} />
              </span>
            </th>
            <th className="text-center py-3 px-4 text-slate-400 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(trade => (
            <tr
              key={trade.id}
              className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors group"
            >
              <td className="py-3 px-4 text-slate-300">
                {format(new Date(trade.entryDate), 'MMM dd, yyyy')}
              </td>
              <td className="py-3 px-4">
                <span className="font-bold text-white">{trade.symbol}</span>
              </td>
              <td className="py-3 px-4">
                <span className={cn(
                  'flex items-center gap-1 font-semibold text-xs',
                  trade.direction === 'LONG' ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {trade.direction === 'LONG' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {trade.direction}
                </span>
              </td>
              <td className="py-3 px-4">{statusBadge(trade.status)}</td>
              <td className="py-3 px-4 text-slate-400 text-xs">{trade.assetClass}</td>
              <td className="py-3 px-4 text-right text-slate-300 font-mono">${trade.entryPrice.toFixed(2)}</td>
              <td className="py-3 px-4 text-right text-slate-300 font-mono">
                {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '—'}
              </td>
              <td className="py-3 px-4 text-right text-slate-300 font-mono">{trade.quantity}</td>
              <td className={cn(
                'py-3 px-4 text-right font-bold font-mono',
                trade.pnl === null ? 'text-slate-500'
                  : trade.pnl > 0 ? 'text-emerald-400'
                  : trade.pnl < 0 ? 'text-red-400'
                  : 'text-amber-400'
              )}>
                {trade.pnl !== null
                  ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}`
                  : '—'}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onView(trade)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="View details"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => onEdit(trade)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Edit trade"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(trade.id)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      deleteConfirm === trade.id
                        ? 'text-red-400 bg-red-500/20'
                        : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                    )}
                    title={deleteConfirm === trade.id ? 'Click again to confirm' : 'Delete trade'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
