import { TIERS } from '../constants';

export default function TierBadge({ tier }) {
  const t = TIERS[tier];
  if (!t) return null;
  const Icon = t.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-mono"
      style={{ borderColor: `${t.color}40`, color: t.color, background: `${t.color}18` }}
    >
      <Icon className="w-2.5 h-2.5" />{t.name}
    </span>
  );
}
