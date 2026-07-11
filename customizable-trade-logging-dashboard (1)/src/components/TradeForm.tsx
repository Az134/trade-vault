import React, { useState, useEffect, useMemo } from 'react';
import { TradeFormData, TradeDirection, TradeStatus, AssetClass } from '../types/trade';
import { getEmptyFormData } from '../utils/tradeUtils';
import { cn } from '../utils/cn';
import { TrendingUp, TrendingDown, Minus, Calculator } from 'lucide-react';
import SymbolAutocomplete from './SymbolAutocomplete';

interface TradeFormProps {
  initialData?: TradeFormData;
  onSubmit: (data: TradeFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
  recentSymbols?: string[];
}

const directions: TradeDirection[] = ['LONG', 'SHORT'];
const statuses: TradeStatus[] = ['WIN', 'LOSS', 'BREAKEVEN', 'OPEN'];
const assetClasses: AssetClass[] = ['Stocks', 'Options', 'Futures', 'Forex', 'Crypto', 'Other'];

export default function TradeForm({ initialData, onSubmit, onCancel, isEditing = false, recentSymbols = [] }: TradeFormProps) {
  const [form, setForm] = useState<TradeFormData>(initialData || getEmptyFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoStatus, setAutoStatus] = useState(true);

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  // ──── Live P&L calculation ────
  const liveCalc = useMemo(() => {
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const qty = parseFloat(form.quantity);
    const fees = parseFloat(form.fees) || 0;

    if (!entry || !exit || !qty || entry <= 0 || exit <= 0 || qty <= 0) {
      return null;
    }

    const rawPnl = form.direction === 'LONG'
      ? (exit - entry) * qty
      : (entry - exit) * qty;

    const netPnl = rawPnl - fees;
    const pnlPerUnit = qty > 0 ? netPnl / qty : 0;
    const pnlPercent = entry > 0 ? ((form.direction === 'LONG' ? (exit - entry) : (entry - exit)) / entry) * 100 : 0;
    const riskReward = rawPnl !== 0 ? Math.abs(rawPnl / (fees || 1)) : 0;

    return {
      grossPnl: rawPnl,
      netPnl,
      pnlPerUnit,
      pnlPercent,
      fees,
      riskReward,
    };
  }, [form.entryPrice, form.exitPrice, form.quantity, form.fees, form.direction]);

  // ──── Auto-set status based on calculated P&L ────
  useEffect(() => {
    if (!autoStatus || form.status === 'OPEN') return;

    if (liveCalc) {
      const { netPnl } = liveCalc;
      let newStatus: TradeStatus;
      if (Math.abs(netPnl) < 0.01) {
        newStatus = 'BREAKEVEN';
      } else if (netPnl > 0) {
        newStatus = 'WIN';
      } else {
        newStatus = 'LOSS';
      }
      if (newStatus !== form.status) {
        setForm(prev => ({ ...prev, status: newStatus }));
      }
    }
  }, [liveCalc, autoStatus, form.status]);

  const updateField = (field: keyof TradeFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));

    // If user manually clicks a status, pause auto-status
    if (field === 'status') {
      setAutoStatus(false);
    }
    // If user changes price/qty/direction/fees, re-enable auto-status (unless OPEN)
    if (['entryPrice', 'exitPrice', 'quantity', 'fees', 'direction'].includes(field)) {
      if (form.status !== 'OPEN') setAutoStatus(true);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.symbol.trim()) newErrors.symbol = 'Symbol is required';
    if (!form.entryPrice || parseFloat(form.entryPrice) <= 0) newErrors.entryPrice = 'Valid entry price required';
    if (!form.quantity || parseFloat(form.quantity) <= 0) newErrors.quantity = 'Valid quantity required';
    if (!form.entryDate) newErrors.entryDate = 'Entry date required';
    if (form.status !== 'OPEN' && (!form.exitPrice || parseFloat(form.exitPrice) <= 0)) {
      newErrors.exitPrice = 'Exit price required for closed trades';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const inputClass = (field: string) => cn(
    'w-full bg-slate-900/50 border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm',
    errors[field] ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-600 focus:ring-blue-500/50 focus:border-blue-500'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ═══════ Live P&L Preview Card ═══════ */}
      <div className={cn(
        'rounded-xl border p-4 transition-all duration-300',
        liveCalc === null
          ? 'bg-slate-900/30 border-slate-700/40'
          : liveCalc.netPnl > 0
            ? 'bg-emerald-500/[0.07] border-emerald-500/30'
            : liveCalc.netPnl < 0
              ? 'bg-red-500/[0.07] border-red-500/30'
              : 'bg-amber-500/[0.07] border-amber-500/30'
      )}>
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={15} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live P&L Calculator</span>
          {autoStatus && form.status !== 'OPEN' && (
            <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
              Auto Status
            </span>
          )}
        </div>

        {liveCalc === null ? (
          <p className="text-sm text-slate-500 text-center py-2">
            Enter entry price, exit price & quantity to see live P&L
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Net P&L — Hero */}
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Net P&L</p>
              <div className="flex items-center gap-1.5">
                {liveCalc.netPnl > 0 ? (
                  <TrendingUp size={18} className="text-emerald-400" />
                ) : liveCalc.netPnl < 0 ? (
                  <TrendingDown size={18} className="text-red-400" />
                ) : (
                  <Minus size={18} className="text-amber-400" />
                )}
                <span className={cn(
                  'text-xl font-bold font-mono',
                  liveCalc.netPnl > 0 ? 'text-emerald-400'
                    : liveCalc.netPnl < 0 ? 'text-red-400'
                    : 'text-amber-400'
                )}>
                  {liveCalc.netPnl >= 0 ? '+' : ''}${liveCalc.netPnl.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Gross P&L */}
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Gross P&L</p>
              <span className={cn(
                'text-sm font-semibold font-mono',
                liveCalc.grossPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {liveCalc.grossPnl >= 0 ? '+' : ''}${liveCalc.grossPnl.toFixed(2)}
              </span>
            </div>

            {/* P&L % */}
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Return %</p>
              <span className={cn(
                'text-sm font-semibold font-mono',
                liveCalc.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {liveCalc.pnlPercent >= 0 ? '+' : ''}{liveCalc.pnlPercent.toFixed(2)}%
              </span>
            </div>

            {/* Per Unit */}
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Per Unit</p>
              <span className={cn(
                'text-sm font-semibold font-mono',
                liveCalc.pnlPerUnit >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {liveCalc.pnlPerUnit >= 0 ? '+' : ''}${liveCalc.pnlPerUnit.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Symbol */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Symbol *</label>
          <SymbolAutocomplete
            value={form.symbol}
            onChange={(val) => updateField('symbol', val)}
            recentSymbols={recentSymbols}
            hasError={!!errors.symbol}
          />
          {errors.symbol && <p className="text-red-400 text-xs mt-1">{errors.symbol}</p>}
        </div>

        {/* Asset Class */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Asset Class</label>
          <select
            value={form.assetClass}
            onChange={e => updateField('assetClass', e.target.value)}
            className={inputClass('assetClass')}
          >
            {assetClasses.map(ac => <option key={ac} value={ac}>{ac}</option>)}
          </select>
        </div>

        {/* Direction */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Direction *</label>
          <div className="flex gap-2">
            {directions.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => updateField('direction', d)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all border',
                  form.direction === d
                    ? d === 'LONG'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500'
                )}
              >
                {d === 'LONG' ? '↑ LONG' : '↓ SHORT'}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Status *
            {autoStatus && form.status !== 'OPEN' && liveCalc && (
              <span className="text-[10px] text-blue-400 ml-2 font-normal">(auto-detected)</span>
            )}
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {statuses.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => updateField('status', s)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-semibold transition-all border',
                  form.status === s
                    ? s === 'WIN' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : s === 'LOSS' ? 'bg-red-500/20 border-red-500 text-red-400'
                      : s === 'BREAKEVEN' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Entry Price */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Entry Price *</label>
          <input
            type="number"
            step="any"
            value={form.entryPrice}
            onChange={e => updateField('entryPrice', e.target.value)}
            placeholder="0.00"
            className={inputClass('entryPrice')}
          />
          {errors.entryPrice && <p className="text-red-400 text-xs mt-1">{errors.entryPrice}</p>}
        </div>

        {/* Exit Price */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Exit Price {form.status !== 'OPEN' ? '*' : ''}</label>
          <input
            type="number"
            step="any"
            value={form.exitPrice}
            onChange={e => updateField('exitPrice', e.target.value)}
            placeholder={form.status === 'OPEN' ? 'Still open' : '0.00'}
            className={inputClass('exitPrice')}
          />
          {errors.exitPrice && <p className="text-red-400 text-xs mt-1">{errors.exitPrice}</p>}
        </div>

        {/* Quantity / Lots */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Quantity / Lots *</label>
          <input
            type="number"
            step="any"
            value={form.quantity}
            onChange={e => updateField('quantity', e.target.value)}
            placeholder="0"
            className={inputClass('quantity')}
          />
          {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
        </div>

        {/* Fees */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Fees / Commission</label>
          <input
            type="number"
            step="any"
            value={form.fees}
            onChange={e => updateField('fees', e.target.value)}
            placeholder="0.00"
            className={inputClass('fees')}
          />
        </div>

        {/* Entry Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Entry Date *</label>
          <input
            type="date"
            value={form.entryDate}
            onChange={e => updateField('entryDate', e.target.value)}
            className={inputClass('entryDate')}
          />
          {errors.entryDate && <p className="text-red-400 text-xs mt-1">{errors.entryDate}</p>}
        </div>

        {/* Exit Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Exit Date</label>
          <input
            type="date"
            value={form.exitDate}
            onChange={e => updateField('exitDate', e.target.value)}
            className={inputClass('exitDate')}
          />
        </div>

        {/* Strategy */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Strategy</label>
          <input
            type="text"
            value={form.strategy}
            onChange={e => updateField('strategy', e.target.value)}
            placeholder="e.g. Breakout, Scalp, Swing"
            className={inputClass('strategy')}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Tags</label>
          <input
            type="text"
            value={form.tags}
            onChange={e => updateField('tags', e.target.value)}
            placeholder="comma separated: earnings, gap-up"
            className={inputClass('tags')}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => updateField('notes', e.target.value)}
          placeholder="Write your trade notes, reasoning, lessons learned..."
          rows={3}
          className={cn(inputClass('notes'), 'resize-none')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {/* Live P&L inline summary in the footer */}
        <div className="text-sm">
          {liveCalc ? (
            <span className={cn(
              'font-mono font-bold',
              liveCalc.netPnl > 0 ? 'text-emerald-400'
                : liveCalc.netPnl < 0 ? 'text-red-400'
                : 'text-amber-400'
            )}>
              P&L: {liveCalc.netPnl >= 0 ? '+' : ''}${liveCalc.netPnl.toFixed(2)}
              <span className="text-slate-500 font-normal ml-1.5">
                ({liveCalc.pnlPercent >= 0 ? '+' : ''}{liveCalc.pnlPercent.toFixed(2)}%)
              </span>
            </span>
          ) : (
            <span className="text-slate-600 text-xs">Fill prices & qty to calc P&L</span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors text-sm shadow-lg shadow-blue-600/20"
          >
            {isEditing ? 'Update Trade' : 'Add Trade'}
          </button>
        </div>
      </div>
    </form>
  );
}
