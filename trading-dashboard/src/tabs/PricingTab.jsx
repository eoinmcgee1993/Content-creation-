import { CheckCircle2 } from 'lucide-react';
import { TIERS } from '../constants';
import Card from '../components/Card';

export default function PricingTab({ myTier, setCheckoutTier }) {
  const tierKeys = Object.keys(TIERS);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white font-serif">Choose Your Guild Tier</h2>
        <p className="text-sm text-slate-400 mt-1 font-mono">Scale from apprentice to sovereign. Unlock more bots as you grow.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.values(TIERS).map(t => {
          const Icon      = t.icon;
          const isCurr    = myTier === t.id;
          const isPopular = t.id === 'master';
          return (
            <div key={t.id}
              className={`rounded-2xl border p-6 relative transition-all ${isCurr ? 'scale-[1.02]' : ''}`}
              style={{ borderColor: isCurr ? t.color : `${t.color}30`, background: `${t.color}05` }}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-widest"
                  style={{ background: t.color, color: '#000' }}>
                  Most Popular
                </div>
              )}
              {isCurr && (
                <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-widest bg-emerald-500 text-black">
                  Current Plan
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <Icon className="w-6 h-6" style={{ color: t.color }} />
                <span className="text-lg font-bold text-white">{t.name}</span>
              </div>

              <div className="mb-5">
                <span className="text-4xl font-bold font-mono text-white">${t.price}</span>
                <span className="text-slate-400 font-mono text-sm"> / month</span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">Billed monthly · Cancel any time</p>
              </div>

              <ul className="space-y-2.5 mb-6">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: t.color }} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="text-[10px] text-slate-500 font-mono mb-4">
                <p>Bot access: {t.limits.maxBots} bot{t.limits.maxBots > 1 ? 's' : ''}</p>
                <p>Max monthly volume: {t.limits.maxVolume === Infinity ? 'Unlimited' : `$${t.limits.maxVolume.toLocaleString()}`}</p>
                <p>Copy-trade: {t.limits.copyTrade ? '✓ Included' : '✗ Not included'}</p>
              </div>

              {isCurr ? (
                <div className="w-full py-2.5 rounded-lg text-xs font-mono font-bold text-center border border-emerald-500/40 text-emerald-400 bg-emerald-950/20">
                  ✓ Active Plan
                </div>
              ) : (
                <button onClick={() => setCheckoutTier(t.id)}
                  className="w-full py-2.5 rounded-lg text-xs font-mono font-bold border transition-all"
                  style={{ borderColor: `${t.color}60`, color: t.color, background: `${t.color}12` }}>
                  {tierKeys.indexOf(t.id) > tierKeys.indexOf(myTier) ? 'Upgrade' : 'Switch'} to {t.name} →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Annual discount banner */}
      <Card className="text-center py-6">
        <p className="text-sm font-semibold text-white mb-1">Save 2 months with Annual Billing</p>
        <p className="text-xs text-slate-400 font-mono mb-4">Pay yearly and get 2 months free on any plan.</p>
        <div className="flex justify-center gap-6">
          {Object.values(TIERS).map(t => (
            <div key={t.id} className="text-center">
              <p className="text-[10px] text-slate-500 font-mono">{t.name}</p>
              <p className="text-lg font-bold font-mono" style={{ color: t.color }}>${t.price * 10}/yr</p>
              <p className="text-[9px] text-emerald-400 font-mono">Save ${t.price * 2}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
