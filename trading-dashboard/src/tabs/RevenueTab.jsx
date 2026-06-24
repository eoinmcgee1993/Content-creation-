import { useState } from 'react';
import { BarChart2, CreditCard, Gift, Clock, Copy, CheckCircle2 } from 'lucide-react';
import { TIERS } from '../constants';
import Badge from '../components/Badge';
import Card from '../components/Card';
import StatBox from '../components/StatBox';
import TierBadge from '../components/TierBadge';

const SUB_TABS = [
  { id: 'overview',   label: 'Overview',        icon: BarChart2  },
  { id: 'subs',       label: 'Subscriptions',   icon: CreditCard },
  { id: 'affiliates', label: 'Affiliates',       icon: Gift       },
  { id: 'billing',    label: 'Billing History',  icon: Clock      },
];

export default function RevenueTab({
  treasury, withdrawTreasury, mrr, arr, churnRate, ltv, revenueHistory,
  guildUsers, perfFeePct, setPerfFee, markupPct, setMarkup, licenseFee, setLicense,
  affiliates, setAffiliates, newAffCode, setNewAffCode, generateAffiliate,
  billingHistory, setBillingHistory, upgradeMember, notify,
}) {
  const [sub, setSub] = useState('overview');

  return (
    <div className="space-y-4">
      {/* Sub-nav */}
      <div className="flex gap-1 border-b border-slate-800/60 pb-2">
        {SUB_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSub(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all ${sub === id ? 'bg-amber-950/30 border border-[#D4AF37]/30 text-[#D4AF37]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}`}>
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {sub === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card gold>
              <p className="text-[9px] text-[#D4AF37] uppercase tracking-widest font-mono mb-1">Medici Treasury</p>
              <p className="text-2xl font-bold font-mono text-emerald-400">${treasury.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Accrued USDT revenue</p>
              <button onClick={withdrawTreasury}
                className="mt-3 w-full py-1.5 rounded border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono hover:bg-amber-950/30 transition-all">
                Disburse to Vault →
              </button>
            </Card>
            <StatBox label="Monthly Recurring Revenue" value={`$${mrr.toLocaleString()}`} color="text-[#D4AF37]" delta={12.4} />
            <StatBox label="Annual Run Rate"            value={`$${arr.toLocaleString()}`} color="text-purple-400" delta={12.4} />
            <StatBox label="Avg. LTV"                   value={`$${ltv.toLocaleString()}`} color="text-blue-400" sub={`${churnRate}% monthly churn`} />
          </div>

          {/* MRR bar chart */}
          <Card gold>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">MRR Growth (6 months)</p>
            <div className="flex items-end gap-3 h-32 px-2">
              {revenueHistory.map((m, i) => {
                const maxMrr = Math.max(...revenueHistory.map(r => r.mrr));
                const h      = Math.round((m.mrr / maxMrr) * 112);
                const isLast = i === revenueHistory.length - 1;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-500">${(m.mrr / 1000).toFixed(1)}k</span>
                    <div className="w-full rounded-t-md transition-all" style={{ height: h, background: isLast ? '#D4AF37' : '#D4AF3740' }} />
                    <span className="text-[9px] font-mono text-slate-500">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Revenue breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label: 'Subscription MRR',  value: `$${mrr}`,                           pct: '45%', color: '#D4AF37' },
              { label: 'Markup Revenue',    value: `$${Math.round(treasury * 0.38)}`,   pct: '38%', color: '#627EEA' },
              { label: 'Performance Share', value: `$${Math.round(treasury * 0.17)}`,   pct: '17%', color: '#14F195' },
            ].map(({ label, value, pct, color }) => (
              <div key={label} className="bg-slate-900/50 rounded-lg p-4 border border-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{label}</p>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}>{pct}</span>
                </div>
                <p className="text-xl font-bold font-mono text-white">{value}</p>
                <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: pct, background: color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Fee sliders */}
          <Card>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">Revenue Model Configuration</p>
            <div className="space-y-5">
              {[
                { label: 'Performance Profit Share', val: `${perfFeePct}%`,           min: 5,    max: 50,  step: 1,    value: perfFeePct,  set: setPerfFee, hint: 'Applied to positive PnL realised by copy-trade users.' },
                { label: 'Execution Spread Markup',  val: `${markupPct.toFixed(2)}%`, min: 0.01, max: 1,   step: 0.01, value: markupPct,   set: setMarkup,  hint: 'Applied to every executed lot from guild members.' },
                { label: 'License Subscription',     val: `$${licenseFee}/mo`,        min: 49,   max: 999, step: 10,   value: licenseFee,  set: setLicense, hint: 'Flat monthly fee for standard guild access.' },
              ].map(({ label, val, min, max, step, value, set, hint }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-300 font-mono">{label}</span>
                    <span className="text-xs text-[#D4AF37] font-mono font-bold">{val}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={value}
                    onChange={e => set(parseFloat(e.target.value))} className="w-full accent-amber-500" />
                  <p className="text-[10px] text-slate-500 mt-1">{hint}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Subscriptions */}
      {sub === 'subs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {Object.values(TIERS).map(t => {
              const count = guildUsers.filter(u => u.tier === t.id).length;
              const Icon  = t.icon;
              return (
                <Card key={t.id} className="text-center" style={{ borderColor: `${t.color}30` }}>
                  <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: t.color }} />
                  <p className="text-xs font-semibold text-slate-100">{t.name}</p>
                  <p className="text-2xl font-bold font-mono mt-1" style={{ color: t.color }}>{count}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{count} × ${t.price} = ${count * t.price}/mo</p>
                </Card>
              );
            })}
          </div>
          <Card gold>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-4">Member Subscriptions</p>
            <div className="space-y-3">
              {guildUsers.map(user => {
                const t = TIERS[user.tier];
                return (
                  <div key={user.id} className="rounded-xl border p-4 border-slate-800/50 bg-slate-900/20">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${user.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                      <span className="text-sm font-semibold text-slate-100">{user.alias}</span>
                      <TierBadge tier={user.tier} />
                      <span className="text-[10px] text-slate-500 font-mono ml-auto">${t.price}/mo</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {[['Platform', user.platform], ['Referral Code', user.referralCode], ['Referred By', user.referredBy || '—']].map(([l, v]) => (
                        <div key={l}>
                          <p className="text-[9px] text-slate-500 uppercase font-mono">{l}</p>
                          <p className="text-xs font-mono text-slate-300 truncate">{v}</p>
                        </div>
                      ))}
                    </div>
                    {user.tier !== 'sovereign' && (
                      <div className="flex gap-2 mt-3">
                        {user.tier === 'apprentice' && (
                          <button onClick={() => upgradeMember(user.id, 'master')}
                            className="px-3 py-1 text-[10px] font-mono rounded border border-amber-500/40 text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 transition-all">
                            ↑ Upgrade to Master (+${149 - 49}/mo)
                          </button>
                        )}
                        <button onClick={() => upgradeMember(user.id, 'sovereign')}
                          className="px-3 py-1 text-[10px] font-mono rounded border border-purple-500/40 text-purple-300 bg-purple-950/20 hover:bg-purple-950/40 transition-all">
                          ↑ Upgrade to Sovereign (+${TIERS.sovereign.price - t.price}/mo)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Affiliates */}
      {sub === 'affiliates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatBox label="Total Affiliate Signups" value={affiliates.reduce((a, x) => a + x.uses, 0)}  color="text-[#D4AF37]" />
            <StatBox label="Total Earned"            value={`$${affiliates.reduce((a, x) => a + x.earned, 0)}`}   color="text-emerald-400" />
            <StatBox label="Pending Payout"          value={`$${affiliates.reduce((a, x) => a + x.pending, 0)}`}  color="text-amber-400" />
          </div>
          <Card gold>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-4">Active Affiliate Codes</p>
            <div className="space-y-3">
              {affiliates.map(aff => (
                <div key={aff.code} className="flex items-center gap-4 bg-slate-900/50 rounded-lg px-4 py-3 border border-slate-800/50 flex-wrap">
                  <div className="font-mono font-bold text-sm text-[#D4AF37]">{aff.code}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>{aff.uses} uses</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-emerald-400">${aff.earned} earned</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-400">${aff.pending} pending</span>
                    </div>
                  </div>
                  <Badge color="amber">{aff.rate}% commission</Badge>
                  <button
                    onClick={() => navigator.clipboard?.writeText(`https://renaissance.trade/ref/${aff.code}`)}
                    className="text-[10px] font-mono px-2.5 py-1 rounded border border-slate-700 text-slate-400 hover:border-slate-500 flex items-center gap-1 transition-all">
                    <Copy className="w-3 h-3" /> Copy Link
                  </button>
                  {aff.pending > 0 && (
                    <button
                      onClick={() => {
                        setAffiliates(p => p.map(a => a.code === aff.code ? { ...a, paid: a.paid + a.pending, pending: 0 } : a));
                        notify(`$${aff.pending} paid to ${aff.code}.`, 'success');
                      }}
                      className="text-[10px] font-mono px-2.5 py-1 rounded border border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 transition-all">
                      Pay ${aff.pending}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <input value={newAffCode} onChange={e => setNewAffCode(e.target.value)}
                placeholder="PARTNER-CODE"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50 uppercase" />
              <button onClick={generateAffiliate}
                className="px-4 py-2 rounded text-xs font-mono border border-[#D4AF37]/40 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40 transition-all">
                + Create Code
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Billing history */}
      {sub === 'billing' && (
        <Card>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">Invoice Ledger</p>
          <div className="space-y-1">
            {billingHistory.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 text-[10px] font-mono py-2 px-3 rounded bg-slate-900/40 border border-slate-800/30 flex-wrap">
                <span className="text-slate-500 w-24 shrink-0">{inv.date}</span>
                <span className="text-slate-200 flex-1 min-w-[120px]">{inv.user}</span>
                <TierBadge tier={inv.tier} />
                <span className="text-white font-bold">${inv.amount}</span>
                <span className={`px-2 py-0.5 rounded border text-[9px] font-mono uppercase ${
                  inv.status === 'paid'
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                    : inv.status === 'overdue'
                      ? 'border-amber-500/40 text-amber-400 bg-amber-950/20'
                      : 'border-rose-500/40 text-rose-400 bg-rose-950/20'}`}>
                  {inv.status}
                </span>
                {(inv.status === 'overdue' || inv.status === 'failed') && (
                  <button
                    onClick={() => {
                      setBillingHistory(p => p.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i));
                      notify(`Invoice ${inv.id} retried — payment successful.`, 'success');
                    }}
                    className="px-2 py-0.5 rounded border border-blue-500/40 text-blue-400 text-[9px] font-mono hover:bg-blue-950/20 transition-all">
                    Retry
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
