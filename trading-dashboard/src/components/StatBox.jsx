import { ArrowUpRight, TrendingDown } from 'lucide-react';

export default function StatBox({ label, value, sub, color = 'text-white', delta }) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
      {delta !== undefined && (
        <p className={`text-[10px] font-mono mt-0.5 flex items-center gap-1 ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {delta >= 0 ? '+' : ''}{delta}% MoM
        </p>
      )}
      {sub && delta === undefined && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sub}</p>}
    </div>
  );
}
