import { ASSET_PRICES, GOLD, CHART_W, CHART_H, CHART_PTS } from '../constants';

export default function MiniChart({ assetCode, showGolden, showFibo }) {
  const asset = ASSET_PRICES[assetCode];

  const ys = Array.from({ length: CHART_PTS }, (_, i) => {
    const wave  = Math.sin(i * 0.75) * 32;
    const noise = Math.sin(i * 1.4) * 12 + Math.cos(i * 2.1) * 8;
    return Math.max(20, Math.min(CHART_H - 20, CHART_H / 2 - wave - noise + asset.base * 0.00012));
  });

  const coords = ys.map((y, i) => ({ x: 20 + i * ((CHART_W - 40) / (CHART_PTS - 1)), y }));
  const line   = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area   = `${line} L ${coords[CHART_PTS - 1].x} ${CHART_H} L ${coords[0].x} ${CHART_H} Z`;
  const fiboLevels = [0.236, 0.382, 0.5, 0.618, 0.786].map(r => ({
    y: 20 + r * (CHART_H - 40),
    label: `${(r * 100).toFixed(1)}%`,
  }));

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" style={{ height: CHART_H }}>
      <defs>
        <linearGradient id={`g-${assetCode}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={asset.color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={asset.color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map(r => (
        <line key={r} x1="0" y1={CHART_H * r} x2={CHART_W} y2={CHART_H * r}
          stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
      ))}

      {showFibo && fiboLevels.map(({ y, label }) => (
        <g key={label}>
          <line x1="0" y1={y} x2={CHART_W} y2={y}
            stroke={GOLD} strokeWidth="0.6" strokeOpacity="0.4" strokeDasharray="6 3" />
          <text x={CHART_W - 4} y={y - 3} fontSize="7" fill={GOLD} opacity="0.55" textAnchor="end">
            {label}
          </text>
        </g>
      ))}

      <path d={area} fill={`url(#g-${assetCode})`} />
      <path d={line} fill="none" stroke={asset.color} strokeWidth="2" strokeLinejoin="round" />
      {coords.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={asset.color} opacity="0.7" />
      ))}

      {showGolden && (
        <ellipse cx={CHART_W * 0.618} cy={CHART_H * 0.5} rx={CHART_W * 0.2} ry={CHART_H * 0.35}
          fill="none" stroke={GOLD} strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="8 4" />
      )}
    </svg>
  );
}
