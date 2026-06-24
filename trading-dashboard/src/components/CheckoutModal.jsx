import { useState } from 'react';
import { X, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { TIERS } from '../constants';

export default function CheckoutModal({ tier, onClose, onSuccess }) {
  const t = TIERS[tier];
  const Icon = t.icon;
  const [step, setStep] = useState(1);
  const [billing, setBilling] = useState({ name: '', card: '', exp: '', cvc: '', email: '' });
  const [processing, setProcessing] = useState(false);

  const handlePay = (e) => {
    e.preventDefault();
    if (!billing.name || !billing.card || !billing.exp || !billing.cvc || !billing.email) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep(3);
      setTimeout(onSuccess, 1800);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f1117] border border-[#D4AF37]/25 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" style={{ color: t.color }} />
            <span className="font-semibold text-slate-100">Subscribe to {t.name}</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 1 && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border p-4 space-y-1" style={{ borderColor: `${t.color}30`, background: `${t.color}08` }}>
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-bold text-white">{t.name} Plan</span>
                <span className="text-2xl font-bold font-mono" style={{ color: t.color }}>
                  ${t.price}<span className="text-sm text-slate-500">/mo</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Billed monthly · Cancel any time</p>
            </div>
            <ul className="space-y-2">
              {t.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2 text-[10px] font-mono text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              Payments secured via Stripe. We never store your card data.
            </div>
            <button onClick={() => setStep(2)}
              className="w-full py-3 rounded-lg text-sm font-mono font-bold border border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40 transition-all">
              Continue to Payment →
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handlePay} className="p-5 space-y-3">
            <p className="text-xs font-mono text-slate-400 mb-1">Billing Details</p>
            {[
              { key: 'email', label: 'Email address',    placeholder: 'you@example.com',         type: 'email' },
              { key: 'name',  label: 'Cardholder name',  placeholder: 'Sovereign Trader',         type: 'text'  },
              { key: 'card',  label: 'Card number',      placeholder: '4242 4242 4242 4242',      type: 'text'  },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-[10px] text-slate-400 font-mono mb-1 block">{label}</label>
                <input type={type} placeholder={placeholder} value={billing[key]}
                  onChange={e => setBilling(b => ({ ...b, [key]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'exp', label: 'Expiry', placeholder: 'MM / YY' },
                { key: 'cvc', label: 'CVC',    placeholder: '•••'     },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-[10px] text-slate-400 font-mono mb-1 block">{label}</label>
                  <input type="text" placeholder={placeholder} value={billing[key]}
                    onChange={e => setBilling(b => ({ ...b, [key]: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" />
                </div>
              ))}
            </div>
            <button type="submit" disabled={processing}
              className="w-full py-3 rounded-lg text-sm font-mono font-bold border border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {processing
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</>
                : `Pay $${t.price}/mo`}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-white">Subscription Active!</p>
            <p className="text-xs text-slate-400 font-mono">
              You're now on the <span style={{ color: t.color }}>{t.name}</span> plan. Bot access is unlocking…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
