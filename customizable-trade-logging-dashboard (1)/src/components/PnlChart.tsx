import { useMemo } from 'react';
import { Trade } from '../types/trade';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import { format } from 'date-fns';

interface PnlChartProps {
  trades: Trade[];
}

export default function PnlChart({ trades }: PnlChartProps) {
  const cumulativeData = useMemo(() => {
    const closed = trades
      .filter(t => t.status !== 'OPEN' && t.pnl !== null)
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    let cumPnl = 0;
    return closed.map(t => {
      cumPnl += t.pnl || 0;
      return {
        date: format(new Date(t.entryDate), 'MMM dd'),
        pnl: t.pnl || 0,
        cumPnl: parseFloat(cumPnl.toFixed(2)),
        symbol: t.symbol,
      };
    });
  }, [trades]);

  const dailyData = useMemo(() => {
    const closed = trades.filter(t => t.status !== 'OPEN' && t.pnl !== null);
    const byDate: Record<string, number> = {};
    closed.forEach(t => {
      const key = t.entryDate;
      byDate[key] = (byDate[key] || 0) + (t.pnl || 0);
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, pnl]) => ({
        date: format(new Date(date), 'MMM dd'),
        pnl: parseFloat(pnl.toFixed(2)),
      }));
  }, [trades]);

  const pieData = useMemo(() => {
    const closed = trades.filter(t => t.status !== 'OPEN');
    const wins = closed.filter(t => t.status === 'WIN').length;
    const losses = closed.filter(t => t.status === 'LOSS').length;
    const be = closed.filter(t => t.status === 'BREAKEVEN').length;
    return [
      { name: 'Wins', value: wins, color: '#34d399' },
      { name: 'Losses', value: losses, color: '#f87171' },
      { name: 'B/E', value: be, color: '#fbbf24' },
    ].filter(d => d.value > 0);
  }, [trades]);

  if (trades.filter(t => t.status !== 'OPEN').length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>Complete some trades to see your performance charts.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-400 text-xs mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className={`text-sm font-bold ${p.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {p.name}: {p.value >= 0 ? '+' : ''}${p.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Cumulative P&L */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">📈 Cumulative P&L</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={cumulativeData}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickFormatter={v => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumPnl"
              name="Cumulative P&L"
              stroke="#3b82f6"
              fill="url(#pnlGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily P&L */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">📊 Daily P&L</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#334155' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                {dailyData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.pnl >= 0 ? '#34d399' : '#f87171'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win/Loss Pie */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">🎯 Win / Loss Ratio</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [`${value} trades`, name]}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-400">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
