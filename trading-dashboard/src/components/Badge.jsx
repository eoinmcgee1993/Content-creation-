const COLOR_CLASSES = {
  amber:   'border-amber-500/40 text-amber-300 bg-amber-950/30',
  emerald: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30',
  rose:    'border-rose-500/40 text-rose-300 bg-rose-950/30',
  slate:   'border-slate-500/40 text-slate-300 bg-slate-900/50',
  blue:    'border-blue-500/40 text-blue-300 bg-blue-950/30',
  purple:  'border-purple-500/40 text-purple-300 bg-purple-950/30',
};

export default function Badge({ children, color = 'amber' }) {
  return (
    <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-mono ${COLOR_CLASSES[color] || COLOR_CLASSES.amber}`}>
      {children}
    </span>
  );
}
