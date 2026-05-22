import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Cpu, Layers, TrendingUp, Compass, Workflow, Terminal,
  Sparkles, Coins, Users, ChevronRight, HardDrive, Copy, Eye, EyeOff,
  Activity, ArrowRight, CheckCircle2, AlertTriangle, Info, Globe, Lock,
  CreditCard, BarChart2, Tag, Link, UserPlus, Star, Zap, Crown, X,
  RefreshCw, TrendingDown, DollarSign, Percent, ExternalLink, Gift,
  Clock, ShieldCheck, ChevronDown, BarChart, PieChart, ArrowUpRight
} from 'lucide-react';

// ─── PRICING TIERS ───────────────────────────────────────────────────────────
const TIERS = {
  apprentice: {
    id: 'apprentice', name: 'Apprentice', icon: Star,
    price: 49, color: '#94a3b8', badgeColor: 'slate',
    bots: ['gali'],
    features: [
      'Galileo Grid bot access',
      'Basic chart with price feed',
      'Manual order placement',
      'Email support',
    ],
    limits: { maxBots: 1, maxVolume: 100_000, copyTrade: false },
  },
  master: {
    id: 'master', name: 'Master', icon: Zap,
    price: 149, color: '#D4AF37', badgeColor: 'amber',
    bots: ['gali', 'socr', 'mikh'],
    features: [
      'Everything in Apprentice',
      'Socratic Delta Neutral + Michelangelo Momentum',
      'Copy-trade marketplace access',
      'Fibonacci / Golden Spiral overlays',
      'Priority support',
    ],
    limits: { maxBots: 3, maxVolume: 1_000_000, copyTrade: true },
  },
  sovereign: {
    id: 'sovereign', name: 'Sovereign', icon: Crown,
    price: 499, color: '#c084fc', badgeColor: 'purple',
    bots: ['gali', 'socr', 'mikh', 'leo', 'mach'],
    features: [
      'Everything in Master',
      'Da Vinci Arbitrage + Machiavelli Liquidity (HFT)',
      'White-label platform access',
      'Custom fee configuration',
      'Dedicated VPS daemon slot',
      'Dedicated account manager',
    ],
    limits: { maxBots: 5, maxVolume: Infinity, copyTrade: true },
  },
};

// ─── BOT DATA ────────────────────────────────────────────────────────────────
const INITIAL_BOTS = [
  { id: 'leo',  name: 'Da Vinci Arbitrage',     icon: Cpu,       tier: 'sovereign',
    type: 'Harmonic Cross-Venue Arbitrage',      efficiency: '98.4%', active: true,
    pnl: 4320.50, trades: 142, risk: 'Low',      speed: '4ms',
    sharpe: '3.12', drawdown: '2.4%', winRate: '88.5%',
    description: 'Exploits high-frequency price discrepancies between Exness spot feeds and Bybit contract orderbooks.' },
  { id: 'socr', name: 'Socratic Delta Neutral',  icon: Shield,    tier: 'master',
    type: 'Philosophical Delta Neutral Hedge',   efficiency: '95.1%', active: true,
    pnl: 2890.10, trades: 84,  risk: 'Medium',  speed: '12ms',
    sharpe: '2.84', drawdown: '4.1%', winRate: '79.2%',
    description: 'Dynamic hedge module combining spot purchases with short-side derivative contracts to harvest funding yields.' },
  { id: 'gali', name: 'Galileo Grid',            icon: Compass,   tier: 'apprentice',
    type: 'Celestial Grid & Fibonacci Recursion',efficiency: '91.8%', active: false,
    pnl: -140.20, trades: 210, risk: 'High',    speed: '8ms',
    sharpe: '1.95', drawdown: '12.8%', winRate: '68.4%',
    description: 'Deploys geometric buy/sell levels anchored on high-beta Fibonacci Retracements.' },
  { id: 'mikh', name: 'Michelangelo Momentum',   icon: TrendingUp, tier: 'master',
    type: 'Fresco Trend & Volume Tracer',        efficiency: '96.2%', active: true,
    pnl: 5810.00, trades: 95,  risk: 'Medium',  speed: '10ms',
    sharpe: '2.45', drawdown: '6.5%', winRate: '74.8%',
    description: 'Tracks exponential moving averages overlaid with volume breakout signatures on major assets.' },
  { id: 'mach', name: 'Machiavelli Liquidity',   icon: Layers,    tier: 'sovereign',
    type: 'Fortress Market Making',             efficiency: '99.1%', active: true,
    pnl: 9450.30, trades: 1024, risk: 'Low',    speed: '2ms',
    sharpe: '4.21', drawdown: '1.1%', winRate: '94.1%',
    description: 'Asymmetric market-making model engineered to capture rapid spreads during elevated volatility phases.' },
];

// ─── GUILD / SUBSCRIPTION DATA ───────────────────────────────────────────────
const INITIAL_GUILD = [
  { id: 'u-1', alias: 'Lorenzo_de_Medici', platform: 'Bybit V5 Enclave',   balance: 45000,  botCopied: 'Da Vinci Arbitrage',    totalVolume: 1250000, commissionPaid: 1250, active: true,  tier: 'sovereign', joinedDaysAgo: 45, referredBy: null,     referralCode: 'LDM-45' },
  { id: 'u-2', alias: 'Sovereign_Alpha',   platform: 'Exness MT5 Gateway', balance: 18500,  botCopied: 'Machiavelli Liquidity', totalVolume:  480000, commissionPaid:  480, active: true,  tier: 'master',    joinedDaysAgo: 28, referredBy: 'LDM-45', referralCode: 'SA-28'  },
  { id: 'u-3', alias: 'Pico_Mirandola',    platform: 'Blofin Sandbox',     balance:  8900,  botCopied: 'Galileo Grid',          totalVolume:  110000, commissionPaid:  110, active: false, tier: 'apprentice',joinedDaysAgo: 12, referredBy: 'LDM-45', referralCode: 'PM-12'  },
  { id: 'u-4', alias: 'Alberti_Quant',    platform: 'Bybit V5 Enclave',   balance: 102400, botCopied: 'Michelangelo Momentum', totalVolume: 3450000, commissionPaid: 3450, active: true,  tier: 'sovereign', joinedDaysAgo: 61, referredBy: null,     referralCode: 'AQ-61'  },
];

const ASSET_PRICES = {
  RENA: { base: 284.15, color: '#D4AF37', fullName: 'Renaissance Utility' },
  ETH:  { base: 3412.50, color: '#627EEA', fullName: 'Ethereum Network' },
  BTC:  { base: 64850.00, color: '#F7931A', fullName: 'Bitcoin Standard' },
  SOL:  { base: 142.80,  color: '#14F195', fullName: 'Solana High Speed' },
};

const TABS = [
  { id: 'sfumato',  label: 'Sfumato Matrix',   icon: Activity },
  { id: 'revenue',  label: 'Revenue Hub',       icon: CreditCard },
  { id: 'pricing',  label: 'Pricing',           icon: Tag },
  { id: 'integration', label: 'Broker Nexus',  icon: Lock },
  { id: 'vps',      label: 'Sovereign VPS',    icon: HardDrive },
  { id: 'command',  label: 'Command Desk',     icon: Terminal },
  { id: 'floor',    label: 'Guild Floor',      icon: Users },
  { id: 'oracle',   label: 'AI Oracle',        icon: Sparkles },
];

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function Badge({ children, color = 'amber' }) {
  const c = {
    amber:   'border-amber-500/40 text-amber-300 bg-amber-950/30',
    emerald: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30',
    rose:    'border-rose-500/40 text-rose-300 bg-rose-950/30',
    slate:   'border-slate-500/40 text-slate-300 bg-slate-900/50',
    blue:    'border-blue-500/40 text-blue-300 bg-blue-950/30',
    purple:  'border-purple-500/40 text-purple-300 bg-purple-950/30',
  };
  return <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-mono ${c[color] || c.amber}`}>{children}</span>;
}

function Card({ children, className = '', gold = false }) {
  return (
    <div className={`rounded-xl border bg-black/30 backdrop-blur-sm p-4 ${gold ? 'border-[#D4AF37]/25' : 'border-slate-800/60'} ${className}`}>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub, color = 'text-white', delta }) {
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
      {sub && !delta && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sub}</p>}
    </div>
  );
}

function RiskBadge({ risk }) {
  return <Badge color={{ Low: 'emerald', Medium: 'amber', High: 'rose' }[risk] || 'slate'}>{risk} risk</Badge>;
}

function TierBadge({ tier }) {
  const t = TIERS[tier];
  if (!t) return null;
  const Icon = t.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-mono border-${t.color}/40`}
      style={{ borderColor: `${t.color}40`, color: t.color, background: `${t.color}18` }}>
      <Icon className="w-2.5 h-2.5" />{t.name}
    </span>
  );
}

// ─── CHART ───────────────────────────────────────────────────────────────────
function MiniChart({ assetCode, showGolden, showFibo }) {
  const asset = ASSET_PRICES[assetCode];
  const W = 560, H = 170, pts = 14;
  const ys = Array.from({ length: pts }, (_, i) => {
    const golden = Math.sin(i * 0.75) * 32;
    const noise  = Math.sin(i * 1.4) * 12 + Math.cos(i * 2.1) * 8;
    return Math.max(20, Math.min(H - 20, H / 2 - golden - noise + asset.base * 0.00012));
  });
  const coords = ys.map((y, i) => ({ x: 20 + i * ((W - 40) / (pts - 1)), y }));
  const line   = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area   = `${line} L ${coords[pts-1].x} ${H} L ${coords[0].x} ${H} Z`;
  const fiboLevels = [0.236, 0.382, 0.5, 0.618, 0.786].map(r => ({ y: 20 + r*(H-40), label: `${(r*100).toFixed(1)}%` }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id={`g-${assetCode}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={asset.color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={asset.color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(r => <line key={r} x1="0" y1={H*r} x2={W} y2={H*r} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />)}
      {showFibo && fiboLevels.map(({ y, label }) => (
        <g key={label}>
          <line x1="0" y1={y} x2={W} y2={y} stroke="#D4AF37" strokeWidth="0.6" strokeOpacity="0.4" strokeDasharray="6 3" />
          <text x={W-4} y={y-3} fontSize="7" fill="#D4AF37" opacity="0.55" textAnchor="end">{label}</text>
        </g>
      ))}
      <path d={area} fill={`url(#g-${assetCode})`} />
      <path d={line} fill="none" stroke={asset.color} strokeWidth="2" strokeLinejoin="round" />
      {coords.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={asset.color} opacity="0.7" />)}
      {showGolden && <ellipse cx={W*0.618} cy={H*0.5} rx={W*0.2} ry={H*0.35} fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="8 4" />}
    </svg>
  );
}

// ─── CHECKOUT MODAL ──────────────────────────────────────────────────────────
function CheckoutModal({ tier, onClose, onSuccess }) {
  const t = TIERS[tier];
  const Icon = t.icon;
  const [step, setStep] = useState(1); // 1=plan, 2=billing, 3=success
  const [billing, setBilling] = useState({ name: '', card: '', exp: '', cvc: '', email: '' });
  const [processing, setProcessing] = useState(false);

  const handlePay = (e) => {
    e.preventDefault();
    if (!billing.name || !billing.card || !billing.exp || !billing.cvc || !billing.email) return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setStep(3); setTimeout(onSuccess, 1800); }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f1117] border border-[#D4AF37]/25 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" style={{ color: t.color }} />
            <span className="font-semibold text-slate-100">Subscribe to {t.name}</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
        </div>

        {step === 1 && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border p-4 space-y-1" style={{ borderColor: `${t.color}30`, background: `${t.color}08` }}>
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-bold text-white">{t.name} Plan</span>
                <span className="text-2xl font-bold font-mono" style={{ color: t.color }}>${t.price}<span className="text-sm text-slate-500">/mo</span></span>
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
              { key: 'email', label: 'Email address', placeholder: 'you@example.com', type: 'email' },
              { key: 'name',  label: 'Cardholder name', placeholder: 'Sovereign Trader', type: 'text' },
              { key: 'card',  label: 'Card number', placeholder: '4242 4242 4242 4242', type: 'text' },
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
                { key: 'cvc', label: 'CVC', placeholder: '•••' },
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
              {processing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</> : `Pay $${t.price}/mo`}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-white">Subscription Active!</p>
            <p className="text-xs text-slate-400 font-mono">You're now on the <span style={{ color: t.color }}>{t.name}</span> plan. Bot access is unlocking…</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab]       = useState('sfumato');
  const [bots, setBots]                 = useState(INITIAL_BOTS);
  const [transactions, setTx]           = useState([]);
  const [guildUsers, setGuild]          = useState(INITIAL_GUILD);
  const [systemActive, setSys]          = useState(true);

  // User's own subscription tier (platform demo)
  const [myTier, setMyTier]             = useState('master');
  const [checkoutTier, setCheckoutTier] = useState(null); // null = closed

  // Chart
  const [chartAsset, setChartAsset]     = useState('RENA');
  const [showGoldSpiral, setGoldSpiral] = useState(true);
  const [showFibo, setFibo]             = useState(true);
  const [selectedBotId, setSelBot]      = useState('leo');
  const [chartTf, setChartTf]          = useState('1H');

  // Revenue / monetization
  const [perfFeePct, setPerfFee]        = useState(20);
  const [markupPct, setMarkup]          = useState(0.15);
  const [licenseFee, setLicense]        = useState(149);
  const [treasury, setTreasury]         = useState(5290);
  const [revenueHistory]                = useState(() =>
    Array.from({ length: 6 }, (_, i) => ({
      month: ['Nov','Dec','Jan','Feb','Mar','Apr'][i],
      mrr: [2100, 2900, 3450, 4200, 4900, 5290][i],
      members: [2, 2, 3, 3, 4, 4][i],
    }))
  );
  const [affiliates, setAffiliates]     = useState([
    { code: 'RENA-ALPHA', uses: 12, earned: 588, paid: 420, pending: 168, rate: 20 },
    { code: 'MEDICI-X',   uses: 7,  earned: 343, paid: 343, pending: 0,  rate: 20 },
    { code: 'QUANT-99',   uses: 3,  earned: 147, paid: 0,   pending: 147, rate: 20 },
  ]);
  const [newAffCode, setNewAffCode]     = useState('');
  const [billingHistory, setBillingHistory] = useState([
    { id: 'inv-001', date: '2026-04-01', user: 'Lorenzo_de_Medici', tier: 'sovereign', amount: 499, status: 'paid' },
    { id: 'inv-002', date: '2026-04-01', user: 'Alberti_Quant',    tier: 'sovereign', amount: 499, status: 'paid' },
    { id: 'inv-003', date: '2026-04-01', user: 'Sovereign_Alpha',  tier: 'master',    amount: 149, status: 'paid' },
    { id: 'inv-004', date: '2026-04-01', user: 'Pico_Mirandola',   tier: 'apprentice',amount: 49,  status: 'overdue' },
    { id: 'inv-005', date: '2026-05-01', user: 'Lorenzo_de_Medici', tier: 'sovereign', amount: 499, status: 'paid' },
    { id: 'inv-006', date: '2026-05-01', user: 'Alberti_Quant',    tier: 'sovereign', amount: 499, status: 'paid' },
    { id: 'inv-007', date: '2026-05-01', user: 'Sovereign_Alpha',  tier: 'master',    amount: 149, status: 'paid' },
    { id: 'inv-008', date: '2026-05-01', user: 'Pico_Mirandola',   tier: 'apprentice',amount: 49,  status: 'failed' },
  ]);

  // Broker
  const [broker, setBroker]             = useState('Bybit');
  const [connected, setConnected]       = useState(false);
  const [apiKey, setApiKey]             = useState('');
  const [apiSecret, setApiSecret]       = useState('');
  const [mtLogin, setMtLogin]           = useState('');
  const [mtPass, setMtPass]             = useState('');
  const [showSec, setShowSec]           = useState(false);

  // Security
  const staticIP                        = '18.134.205.14';
  const [keyGen, setKeyGen]             = useState(false);
  const [pubKey, setPubKey]             = useState('');
  const [rwOnly, setRwOnly]             = useState(true);
  const [noWithdraw, setNoWithdraw]     = useState(true);

  // VPS
  const [vpsStatus, setVpsStatus]       = useState('RUNNING');
  const [vpsPing, setVpsPing]           = useState(4);
  const [vpsCpu, setVpsCpu]             = useState(14);
  const [vpsRam, setVpsRam]             = useState(1.2);
  const [daemon, setDaemon]             = useState([]);

  // Command
  const [tradeSide, setSide]            = useState('BUY');
  const [tradeAsset, setTrAsset]        = useState('RENA');
  const [orderType, setOT]              = useState('MARKET');
  const [tradeAmt, setTrAmt]            = useState('1');

  // Oracle
  const [aiPrompt, setAiPrompt]         = useState('');
  const [aiLog, setAiLog]               = useState([
    { role: 'system',    text: 'Virtuoso Neural Oracle v6.1 — Non-Custodial Multi-Broker Enclaves active.' },
    { role: 'assistant', text: 'Salutations, Sovereign Strategist. All security barriers are active. How shall we monetize and scale your platform today?' },
  ]);
  const [aiThink, setAiThink]           = useState(false);
  const [notif, setNotif]               = useState(null);
  const aiRef                           = useRef(null);

  const notify = (message, type = 'info') => {
    setNotif({ message, type });
    setTimeout(() => setNotif(null), 5000);
  };

  // ── Access control ────────────────────────────────────────────────────────
  const canAccessBot = (botId) => TIERS[myTier]?.bots.includes(botId);

  // ── Seed transactions ─────────────────────────────────────────────────────
  useEffect(() => {
    setTx([
      { id:'i1', time:'14:24:01', bot:'Da Vinci Arbitrage',    pair:'RENA/USDT', type:'BUY',  amount:'12.50', price:'284.15',   fee:'3.55', status:'FILLED' },
      { id:'i2', time:'14:24:05', bot:'Machiavelli Liquidity', pair:'BTC/USDT',  type:'SELL', amount:'0.15',  price:'64820.00', fee:'9.72', status:'FILLED' },
      { id:'i3', time:'14:24:12', bot:'Sovereign Desk',        pair:'ETH/USD',   type:'BUY',  amount:'2.50',  price:'3412.50',  fee:'8.53', status:'FILLED' },
    ]);
  }, []);

  // ── Live simulation loop ──────────────────────────────────────────────────
  useEffect(() => {
    if (!systemActive || vpsStatus !== 'RUNNING') return;
    const iv = setInterval(() => {
      const active = guildUsers.filter(u => u.active);
      if (!active.length) return;
      const user     = active[Math.floor(Math.random() * active.length)];
      const assetKey = Object.keys(ASSET_PRICES)[Math.floor(Math.random() * 4)];
      const asset    = ASSET_PRICES[assetKey];
      const lot      = +(Math.random() * 3 + 0.05).toFixed(2);
      const px       = asset.base * (1 + (Math.random() - 0.5) * 0.002);
      const vol      = lot * px;
      const mkCut    = +(vol * (markupPct / 100)).toFixed(2);
      const profit   = vol * 0.04 * (Math.random() > 0.45 ? 1 : -0.15);
      const pfCut    = profit > 0 ? +(profit * (perfFeePct / 100)).toFixed(2) : 0;
      const rev      = +(mkCut + pfCut).toFixed(2);
      const ts       = new Date().toTimeString().split(' ')[0];
      setTreasury(p => +(p + rev).toFixed(2));
      setTx(p => [{ id:`g${Date.now()}`, time:ts, bot:`${user.alias}`, pair:`${assetKey}/USDT`,
        type:Math.random()>0.5?'BUY':'SELL', amount:lot.toFixed(2), price:px.toFixed(2),
        fee:rev.toFixed(2), status:'FILLED', guild:true }, ...p.slice(0,17)]);
      setDaemon(p => [`[${ts}] DEPLOY [${user.botCopied.split(' ')[0]}] | ${user.platform} | Vol: $${Math.round(vol)} | Rev: +$${rev}`, ...p.slice(0,14)]);
      setVpsCpu(Math.floor(10 + Math.random() * 20));
      setVpsPing(Math.floor(3 + Math.random() * 3));
      setVpsRam(+(1.1 + Math.random() * 0.4).toFixed(2));
      setGuild(p => p.map(u => u.id !== user.id ? u : { ...u, totalVolume: u.totalVolume + Math.round(vol), commissionPaid: +(u.commissionPaid + rev).toFixed(2) }));
    }, 3800);
    return () => clearInterval(iv);
  }, [systemActive, vpsStatus, guildUsers, markupPct, perfFeePct]);

  useEffect(() => { if (aiRef.current) aiRef.current.scrollTop = aiRef.current.scrollHeight; }, [aiLog]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleKeyGen = () => { setPubKey('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD...EnclaveSovereign24'); setKeyGen(true); notify('Asymmetric keypair generated inside secure enclave.', 'success'); };
  const handleBrokerConnect = (e) => {
    e.preventDefault();
    if (!keyGen) { notify('Generate Enclave Key first.', 'warning'); return; }
    if (!rwOnly || !noWithdraw) { notify('Enable security constraints first.', 'warning'); return; }
    if (broker==='Exness' && (!mtLogin||!mtPass)) { notify('MT5 credentials required.', 'warning'); return; }
    if (broker!=='Exness' && (!apiKey||!apiSecret)) { notify(`${broker} API Key & Secret required.`, 'warning'); return; }
    setConnected(true); notify(`${broker} connected — daemon live.`, 'success');
  };
  const handleTrade = (e) => {
    e.preventDefault();
    const size = parseFloat(tradeAmt);
    if (isNaN(size)||size<=0) { notify('Enter a valid lot size.', 'warning'); return; }
    if (!canAccessBot('leo') && !canAccessBot('mach')) { notify('Upgrade your plan to execute trades on premium bots.', 'warning'); return; }
    const px = ASSET_PRICES[tradeAsset].base;
    const markup = +(size * px * (markupPct / 100)).toFixed(2);
    setTreasury(p => +(p + markup).toFixed(2));
    const ts = new Date().toTimeString().split(' ')[0];
    setTx(p => [{ id:`m${Date.now()}`, time:ts, bot:`Sovereign Desk (${broker}${connected?' CLOUD':' SIM'})`,
      pair:`${tradeAsset}/USDT`, type:tradeSide, amount:size.toFixed(2), price:px.toFixed(2),
      fee:markup.toFixed(2), status:'FILLED', manual:true }, ...p]);
    notify(`${tradeSide} ${size} ${tradeAsset} — markup +$${markup} collected.`, 'success');
  };
  const handleOracle = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    const prompt = aiPrompt;
    setAiLog(p => [...p, { role:'user', text:prompt }]);
    setAiPrompt(''); setAiThink(true);
    setTimeout(() => {
      const lp = prompt.toLowerCase();
      let reply;
      if (lp.includes('monetis')||lp.includes('monetiz')||lp.includes('fee')||lp.includes('revenue')) {
        setPerfFee(25); setMarkup(0.20);
        reply = 'Revenue stack optimised: performance share → 25%, spread markup → 0.20%. MRR projection increased by +28.5%. Recommend running an affiliate campaign targeting quant communities.';
        notify('Revenue model optimised.', 'success');
      } else if (lp.includes('affiliate')||lp.includes('referral')) {
        reply = `Your top affiliate code "RENA-ALPHA" has 12 activations generating $588 in earned commission. Consider increasing the affiliate rate to 25% to accelerate viral growth.`;
      } else if (lp.includes('tier')||lp.includes('plan')||lp.includes('upgrad')||lp.includes('pric')) {
        const mrr = guildUsers.reduce((a,u) => a + TIERS[u.tier].price, 0);
        reply = `Current MRR from subscriptions: $${mrr.toLocaleString()}. Upgrading all Master members to Sovereign would add $${(guildUsers.filter(u=>u.tier==='master').length * (499-149)).toLocaleString()} ARR. Consider an annual plan discount at 2 months free.`;
      } else if (lp.includes('churn')||lp.includes('retention')) {
        reply = 'Churn risk detected on Pico_Mirandola (inactive, Apprentice tier, last invoice failed). Recommend offering a free week extension and nudging toward Master. Historical churn rate: 8.3% monthly.';
      } else if (lp.includes('bot')||lp.includes('strateg')) {
        const active = bots.filter(b => b.active);
        reply = `${active.length} bots live. Combined Sharpe: ${(active.reduce((a,b)=>a+parseFloat(b.sharpe),0)/active.length).toFixed(2)}. Machiavelli Liquidity (Sovereign-only) is your highest-performing retention driver.`;
      } else {
        reply = `Platform metrics look strong. ${guildUsers.filter(u=>u.active).length} active guild members with combined AUM of $${guildUsers.reduce((a,u)=>a+u.balance,0).toLocaleString()}. Treasury accruing $${treasury.toLocaleString()} in real-time revenue.`;
      }
      setAiLog(p => [...p, { role:'assistant', text:reply }]);
      setAiThink(false);
    }, 1500);
  };
  const withdrawTreasury = () => {
    if (treasury<=0) { notify('No accrued balance.', 'warning'); return; }
    notify(`Disbursing $${treasury.toLocaleString()} USDT to Web3 Settlement Vault.`, 'success');
    setTreasury(0);
  };
  const toggleBot = (id) => {
    if (!canAccessBot(id)) { notify(`This bot requires a higher plan. Click Upgrade to access it.`, 'warning'); return; }
    const bot = bots.find(b => b.id === id);
    setBots(p => p.map(b => b.id===id ? { ...b, active:!b.active } : b));
    notify(`${bot.name} → ${bot.active ? 'STANDBY' : 'LIVE'}`, 'info');
  };
  const upgradeMember = (userId, newTier) => {
    setGuild(p => p.map(u => u.id!==userId ? u : { ...u, tier:newTier }));
    const user = guildUsers.find(u => u.id===userId);
    const rev = TIERS[newTier].price - TIERS[user.tier].price;
    setTreasury(p => +(p + rev).toFixed(2));
    notify(`${user.alias} upgraded to ${TIERS[newTier].name}. +$${rev} MRR.`, 'success');
    setBillingHistory(p => [{
      id: `inv-${Date.now()}`, date: new Date().toISOString().slice(0,10),
      user: user.alias, tier: newTier, amount: TIERS[newTier].price, status: 'paid'
    }, ...p]);
  };
  const generateAffiliate = () => {
    if (!newAffCode.trim()) { notify('Enter an affiliate code name.', 'warning'); return; }
    setAffiliates(p => [...p, { code: newAffCode.toUpperCase(), uses: 0, earned: 0, paid: 0, pending: 0, rate: 20 }]);
    setNewAffCode('');
    notify(`Affiliate code "${newAffCode.toUpperCase()}" created.`, 'success');
  };

  // ── Derived metrics ───────────────────────────────────────────────────────
  const mrr       = guildUsers.reduce((a, u) => a + TIERS[u.tier].price, 0);
  const arr       = mrr * 12;
  const churnRate = 8.3;
  const ltv       = Math.round((mrr / guildUsers.length) / (churnRate / 100));
  const selBot    = bots.find(b => b.id === selectedBotId) || bots[0];

  // ── Sub-views ─────────────────────────────────────────────────────────────

  // SFUMATO ─────────────────────────────────────────────────────────────────
  function SfumatoTab() {
    return (
      <div className="space-y-5">
        {/* Bot grid with tier gating */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {bots.map(bot => {
            const Icon    = bot.icon;
            const sel     = bot.id === selectedBotId;
            const locked  = !canAccessBot(bot.id);
            const tierDef = TIERS[bot.tier];
            return (
              <button key={bot.id}
                onClick={() => locked ? setCheckoutTier(tierDef.id) : setSelBot(bot.id)}
                className={`text-left rounded-xl border p-3 transition-all relative ${sel
                  ? 'border-[#D4AF37]/50 bg-amber-950/20'
                  : locked
                    ? 'border-slate-800/40 bg-slate-900/20 opacity-60 hover:opacity-80'
                    : 'border-slate-800/50 bg-black/20 hover:border-slate-700'}`}>
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                    <div className="text-center">
                      <Lock className="w-4 h-4 mx-auto mb-1" style={{ color: tierDef.color }} />
                      <p className="text-[9px] font-mono" style={{ color: tierDef.color }}>{tierDef.name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${bot.active && !locked ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
                  <span className={`w-1.5 h-1.5 rounded-full ${bot.active && !locked ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                </div>
                <p className="text-xs font-semibold text-slate-200 leading-tight">{bot.name}</p>
                <p className={`text-xs font-mono font-bold mt-1 ${bot.pnl>=0?'text-emerald-400':'text-rose-400'}`}>
                  {bot.pnl>=0?'+':''} ${bot.pnl.toLocaleString()}
                </p>
              </button>
            );
          })}
        </div>

        {/* Tier upsell banner if locked bots exist */}
        {myTier !== 'sovereign' && (
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/15 p-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-300 font-mono">
                {myTier==='apprentice' ? '2 bots locked. Master plan unlocks 3 bots.' : '2 HFT bots locked. Sovereign plan unlocks all 5.'}
              </span>
            </div>
            <button onClick={() => setCheckoutTier(myTier==='apprentice' ? 'master' : 'sovereign')}
              className="px-3 py-1.5 rounded text-[11px] font-mono font-bold border border-purple-500/40 text-purple-300 bg-purple-950/30 hover:bg-purple-950/50 transition-all">
              Upgrade Now →
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2" gold>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex gap-1">
                {Object.keys(ASSET_PRICES).map(a => (
                  <button key={a} onClick={() => setChartAsset(a)}
                    className={`text-[10px] px-2 py-1 rounded font-mono border transition-all ${chartAsset===a?'border-[#D4AF37]/60 text-[#D4AF37] bg-amber-950/30':'border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                    {a}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex gap-1">
                  {['15M','1H','4H','1D'].map(tf => (
                    <button key={tf} onClick={() => setChartTf(tf)}
                      className={`text-[10px] px-2 py-1 rounded font-mono border transition-all ${chartTf===tf?'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/30':'border-slate-800 text-slate-500'}`}>
                      {tf}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showGoldSpiral} onChange={e=>setGoldSpiral(e.target.checked)} className="accent-amber-500 w-3 h-3" />
                  <span className="text-[10px] text-amber-400 font-mono">φ Spiral</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showFibo} onChange={e=>setFibo(e.target.checked)} className="accent-amber-500 w-3 h-3" />
                  <span className="text-[10px] text-amber-400 font-mono">Fibo</span>
                </label>
              </div>
            </div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-2xl font-mono font-bold text-white">${ASSET_PRICES[chartAsset].base.toLocaleString()}</span>
              <Badge color="emerald">+2.14%</Badge>
              <span className="text-xs text-slate-500 font-mono">{ASSET_PRICES[chartAsset].fullName}</span>
            </div>
            <MiniChart assetCode={chartAsset} showGolden={showGoldSpiral} showFibo={showFibo} />
          </Card>
          <Card gold className="space-y-3">
            <div className="flex items-center gap-2">
              {React.createElement(selBot.icon, { className:'w-5 h-5 text-[#D4AF37]' })}
              <span className="font-semibold text-sm text-slate-100 flex-1">{selBot.name}</span>
              <TierBadge tier={selBot.tier} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">{selBot.description}</p>
            <div className="grid grid-cols-2 gap-2">
              <StatBox label="PnL" value={`${selBot.pnl>=0?'+':''}$${selBot.pnl.toLocaleString()}`} color={selBot.pnl>=0?'text-emerald-400':'text-rose-400'} />
              <StatBox label="Win Rate"  value={selBot.winRate}  color="text-amber-400" />
              <StatBox label="Sharpe"    value={selBot.sharpe}   color="text-blue-400" />
              <StatBox label="Drawdown"  value={selBot.drawdown} color="text-orange-400" />
              <StatBox label="Trades"    value={selBot.trades} />
              <StatBox label="Speed"     value={selBot.speed}    color="text-purple-400" />
            </div>
            <div className="flex flex-wrap gap-2"><RiskBadge risk={selBot.risk} /><Badge color="slate">{selBot.efficiency} eff.</Badge></div>
            {canAccessBot(selBot.id) ? (
              <button onClick={() => toggleBot(selBot.id)}
                className={`w-full py-2 rounded-lg text-xs font-mono font-bold border transition-all ${selBot.active?'border-rose-500/40 text-rose-400 bg-rose-950/20':'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'}`}>
                {selBot.active ? '⏹ PAUSE BOT' : '▶ ACTIVATE BOT'}
              </button>
            ) : (
              <button onClick={() => setCheckoutTier(selBot.tier)}
                className="w-full py-2 rounded-lg text-xs font-mono font-bold border border-purple-500/40 text-purple-300 bg-purple-950/20 hover:bg-purple-950/40 transition-all flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5" /> Unlock with {TIERS[selBot.tier].name}
              </button>
            )}
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Live Transaction Feed</span>
            <Badge color="emerald">{transactions.length} events</Badge>
          </div>
          <div className="space-y-px max-h-52 overflow-y-auto">
            {transactions.map(tx => (
              <div key={tx.id} className={`flex items-center gap-2 text-[10px] font-mono py-1.5 px-2 rounded ${tx.guild?'bg-amber-950/10':tx.manual?'bg-blue-950/10':'bg-slate-900/20'}`}>
                <span className="text-slate-500 w-16 shrink-0">{tx.time}</span>
                <span className={`w-8 font-bold ${tx.type==='BUY'?'text-emerald-400':'text-rose-400'}`}>{tx.type}</span>
                <span className="text-slate-300 flex-1 truncate min-w-0">{tx.bot}</span>
                <span className="text-slate-400 shrink-0">{tx.pair}</span>
                <span className="text-white shrink-0">{tx.amount}@${tx.price}</span>
                <span className="text-[#D4AF37] font-bold shrink-0">+${tx.fee}</span>
                <Badge color="emerald">{tx.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // REVENUE HUB ─────────────────────────────────────────────────────────────
  function RevenueTab() {
    const [sub, setSub] = useState('overview');
    const subTabs = [
      { id:'overview',    label:'Overview',       icon:BarChart2 },
      { id:'subs',        label:'Subscriptions',  icon:CreditCard },
      { id:'affiliates',  label:'Affiliates',     icon:Gift },
      { id:'billing',     label:'Billing History',icon:Clock },
    ];

    return (
      <div className="space-y-4">
        {/* Sub-nav */}
        <div className="flex gap-1 border-b border-slate-800/60 pb-2">
          {subTabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSub(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all ${sub===id?'bg-amber-950/30 border border-[#D4AF37]/30 text-[#D4AF37]':'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}`}>
              <Icon className="w-3 h-3" />{label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {sub==='overview' && (
          <div className="space-y-5">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card gold>
                <p className="text-[9px] text-[#D4AF37] uppercase tracking-widest font-mono mb-1">Medici Treasury</p>
                <p className="text-2xl font-bold font-mono text-emerald-400">${treasury.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">Accrued USDT revenue</p>
                <button onClick={withdrawTreasury} className="mt-3 w-full py-1.5 rounded border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono hover:bg-amber-950/30 transition-all">
                  Disburse to Vault →
                </button>
              </Card>
              <StatBox label="Monthly Recurring Revenue" value={`$${mrr.toLocaleString()}`} color="text-[#D4AF37]" delta={12.4} />
              <StatBox label="Annual Run Rate" value={`$${arr.toLocaleString()}`} color="text-purple-400" delta={12.4} />
              <StatBox label="Avg. LTV" value={`$${ltv.toLocaleString()}`} color="text-blue-400" sub={`${churnRate}% monthly churn`} />
            </div>

            {/* MRR bar chart (SVG) */}
            <Card gold>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">MRR Growth (6 months)</p>
              <div className="flex items-end gap-3 h-32 px-2">
                {revenueHistory.map((m, i) => {
                  const maxMrr = Math.max(...revenueHistory.map(r => r.mrr));
                  const h = Math.round((m.mrr / maxMrr) * 112);
                  const isLast = i === revenueHistory.length - 1;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-mono text-slate-500">${(m.mrr/1000).toFixed(1)}k</span>
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
                { label:'Subscription MRR',  value:`$${mrr}`,   pct:'45%', color:'#D4AF37' },
                { label:'Markup Revenue',    value:`$${Math.round(treasury * 0.38)}`, pct:'38%', color:'#627EEA' },
                { label:'Performance Share', value:`$${Math.round(treasury * 0.17)}`, pct:'17%', color:'#14F195' },
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

            {/* Fee configuration */}
            <Card>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">Revenue Model Configuration</p>
              <div className="space-y-5">
                {[
                  { label:'Performance Profit Share', val:`${perfFeePct}%`, min:5, max:50, step:1, value:perfFeePct, set:setPerfFee, hint:'Applied to positive PnL realised by copy-trade users.' },
                  { label:'Execution Spread Markup',  val:`${markupPct.toFixed(2)}%`, min:0.01, max:1, step:0.01, value:markupPct, set:setMarkup, hint:'Applied to every executed lot from guild members.' },
                  { label:'License Subscription',     val:`$${licenseFee}/mo`, min:49, max:999, step:10, value:licenseFee, set:setLicense, hint:'Flat monthly fee for standard guild access.' },
                ].map(({ label, val, min, max, step, value, set, hint }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-300 font-mono">{label}</span>
                      <span className="text-xs text-[#D4AF37] font-mono font-bold">{val}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>set(parseFloat(e.target.value))} className="w-full accent-amber-500" />
                    <p className="text-[10px] text-slate-500 mt-1">{hint}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Subscriptions */}
        {sub==='subs' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {Object.values(TIERS).map(t => {
                const count = guildUsers.filter(u => u.tier === t.id).length;
                const Icon = t.icon;
                return (
                  <Card key={t.id} className="text-center" style={{ borderColor: `${t.color}30` }}>
                    <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: t.color }} />
                    <p className="text-xs font-semibold text-slate-100">{t.name}</p>
                    <p className="text-2xl font-bold font-mono mt-1" style={{ color: t.color }}>{count}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{count} × ${t.price} = ${count*t.price}/mo</p>
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
                        <span className={`w-2 h-2 rounded-full shrink-0 ${user.active?'bg-emerald-400 animate-pulse':'bg-slate-600'}`} />
                        <span className="text-sm font-semibold text-slate-100">{user.alias}</span>
                        <TierBadge tier={user.tier} />
                        <span className="text-[10px] text-slate-500 font-mono ml-auto">${t.price}/mo</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        {[['Platform', user.platform], ['Referral Code', user.referralCode], ['Referred By', user.referredBy || '—']].map(([l,v])=>(
                          <div key={l}><p className="text-[9px] text-slate-500 uppercase font-mono">{l}</p><p className="text-xs font-mono text-slate-300 truncate">{v}</p></div>
                        ))}
                      </div>
                      {/* Upgrade / Downgrade */}
                      {user.tier !== 'sovereign' && (
                        <div className="flex gap-2 mt-3">
                          {user.tier === 'apprentice' && (
                            <button onClick={() => upgradeMember(user.id, 'master')}
                              className="px-3 py-1 text-[10px] font-mono rounded border border-amber-500/40 text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 transition-all">
                              ↑ Upgrade to Master (+${149-49}/mo)
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
        {sub==='affiliates' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <StatBox label="Total Affiliate Signups" value={affiliates.reduce((a,x)=>a+x.uses,0)} color="text-[#D4AF37]" />
              <StatBox label="Total Earned" value={`$${affiliates.reduce((a,x)=>a+x.earned,0)}`} color="text-emerald-400" />
              <StatBox label="Pending Payout" value={`$${affiliates.reduce((a,x)=>a+x.pending,0)}`} color="text-amber-400" />
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
                    <button onClick={() => navigator.clipboard?.writeText(`https://renaissance.trade/ref/${aff.code}`)}
                      className="text-[10px] font-mono px-2.5 py-1 rounded border border-slate-700 text-slate-400 hover:border-slate-500 flex items-center gap-1 transition-all">
                      <Copy className="w-3 h-3" /> Copy Link
                    </button>
                    {aff.pending > 0 && (
                      <button onClick={() => { setAffiliates(p=>p.map(a=>a.code===aff.code?{...a,paid:a.paid+a.pending,pending:0}:a)); notify(`$${aff.pending} paid to ${aff.code}.`,'success'); }}
                        className="text-[10px] font-mono px-2.5 py-1 rounded border border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 transition-all">
                        Pay ${aff.pending}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {/* Create new */}
              <div className="flex gap-2 mt-4">
                <input value={newAffCode} onChange={e=>setNewAffCode(e.target.value)}
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
        {sub==='billing' && (
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
                    inv.status==='paid'    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                    : inv.status==='overdue'? 'border-amber-500/40 text-amber-400 bg-amber-950/20'
                    : 'border-rose-500/40 text-rose-400 bg-rose-950/20'}`}>
                    {inv.status}
                  </span>
                  {(inv.status==='overdue'||inv.status==='failed') && (
                    <button onClick={() => {
                      setBillingHistory(p => p.map(i=>i.id===inv.id?{...i,status:'paid'}:i));
                      notify(`Invoice ${inv.id} retried — payment successful.`, 'success');
                    }} className="px-2 py-0.5 rounded border border-blue-500/40 text-blue-400 text-[9px] font-mono hover:bg-blue-950/20 transition-all">Retry</button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // PRICING ─────────────────────────────────────────────────────────────────
  function PricingTab() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white font-serif">Choose Your Guild Tier</h2>
          <p className="text-sm text-slate-400 mt-1 font-mono">Scale from apprentice to sovereign. Unlock more bots as you grow.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.values(TIERS).map(t => {
            const Icon    = t.icon;
            const isCurr  = myTier === t.id;
            const isPopular = t.id === 'master';
            return (
              <div key={t.id} className={`rounded-2xl border p-6 relative transition-all ${isCurr ? 'scale-[1.02]' : ''}`}
                style={{ borderColor: isCurr ? t.color : `${t.color}30`, background: `${t.color}05` }}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-widest"
                    style={{ background: t.color, color: '#000' }}>Most Popular</div>
                )}
                {isCurr && (
                  <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-widest bg-emerald-500 text-black">Current Plan</div>
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
                  <p>Bot access: {t.limits.maxBots} bot{t.limits.maxBots>1?'s':''}</p>
                  <p>Max monthly volume: {t.limits.maxVolume===Infinity ? 'Unlimited' : `$${t.limits.maxVolume.toLocaleString()}`}</p>
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
                    {Object.keys(TIERS).indexOf(t.id) > Object.keys(TIERS).indexOf(myTier) ? 'Upgrade' : 'Switch'} to {t.name} →
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
                <p className="text-[9px] text-emerald-400 font-mono">Save ${t.price*2}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // INTEGRATION ─────────────────────────────────────────────────────────────
  function IntegrationTab() {
    return (
      <div className="space-y-5">
        <Card gold>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-amber-950 border border-[#D4AF37]/40 flex items-center justify-center text-[10px] text-[#D4AF37] font-bold">1</span>
            <span className="text-sm font-semibold text-slate-100">Generate Enclave Keypair</span>
            {keyGen && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">An RSA-4096 keypair is generated locally inside an isolated enclave. Broker credentials are encrypted and never leave the environment.</p>
          <div className="flex items-center gap-2 text-[10px] font-mono bg-slate-900/60 border border-slate-800 rounded px-3 py-2 mb-3">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Whitelisted Static IP:</span>
            <span className="text-emerald-400 font-bold">{staticIP}</span>
            <button onClick={() => navigator.clipboard?.writeText(staticIP)} className="ml-auto text-slate-500 hover:text-slate-300"><Copy className="w-3.5 h-3.5" /></button>
          </div>
          {keyGen && <div className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-800/40 rounded p-2 mb-3 break-all">{pubKey}</div>}
          <div className="flex flex-wrap gap-4 items-start">
            <button onClick={handleKeyGen}
              className={`px-4 py-2 rounded text-xs font-mono font-bold border transition-all ${keyGen?'border-emerald-500/40 text-emerald-400 bg-emerald-950/20':'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40'}`}>
              {keyGen ? '✓ Key Generated' : 'Generate Enclave Key'}
            </button>
            <div className="space-y-1.5">
              {[['Read+Write Only (no withdrawal perms)', rwOnly, setRwOnly],['Withdrawal disabled on broker', noWithdraw, setNoWithdraw]].map(([label,val,set])=>(
                <label key={label} className="flex items-center gap-2 text-[10px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={val} onChange={e=>set(e.target.checked)} className="accent-amber-500 w-3 h-3" />{label}
                </label>
              ))}
            </div>
          </div>
        </Card>
        <Card gold>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-amber-950 border border-[#D4AF37]/40 flex items-center justify-center text-[10px] text-[#D4AF37] font-bold">2</span>
            <span className="text-sm font-semibold text-slate-100">Connect Broker</span>
            {connected && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
          </div>
          <div className="flex gap-2 mb-4">
            {['Bybit','Blofin','Exness'].map(b=>(
              <button key={b} onClick={()=>setBroker(b)}
                className={`px-3 py-1.5 rounded text-[11px] font-mono border transition-all ${broker===b?'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/30':'border-slate-700 text-slate-400 hover:border-slate-600'}`}>{b}</button>
            ))}
          </div>
          <form onSubmit={handleBrokerConnect} className="space-y-3">
            {broker==='Exness' ? (<>
              <div><label className="text-[10px] text-slate-400 font-mono mb-1 block">MT5 Login</label>
                <input value={mtLogin} onChange={e=>setMtLogin(e.target.value)} placeholder="12345678" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" /></div>
              <div className="relative"><label className="text-[10px] text-slate-400 font-mono mb-1 block">MT5 Password</label>
                <input type={showSec?'text':'password'} value={mtPass} onChange={e=>setMtPass(e.target.value)} placeholder="••••••••" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" />
                <button type="button" onClick={()=>setShowSec(s=>!s)} className="absolute right-3 top-6 text-slate-500 hover:text-slate-300">{showSec?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button></div>
            </>) : (<>
              <div><label className="text-[10px] text-slate-400 font-mono mb-1 block">{broker} API Key</label>
                <input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" /></div>
              <div className="relative"><label className="text-[10px] text-slate-400 font-mono mb-1 block">API Secret</label>
                <input type={showSec?'text':'password'} value={apiSecret} onChange={e=>setApiSecret(e.target.value)} placeholder="••••••••••••••••" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" />
                <button type="button" onClick={()=>setShowSec(s=>!s)} className="absolute right-3 top-6 text-slate-500 hover:text-slate-300">{showSec?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button></div>
            </>)}
            <button type="submit" className={`w-full py-2.5 rounded text-xs font-mono font-bold border transition-all ${connected?'border-emerald-500/40 text-emerald-400 bg-emerald-950/20':'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40'}`}>
              {connected?`✓ ${broker} Connected`:`Connect ${broker}`}
            </button>
          </form>
        </Card>
        <Card>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">Security Audit Matrix</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[['Asymmetric Key Isolation',keyGen],['Read+Write Only (No Withdraw)',rwOnly],['Withdrawal Flag Disabled',noWithdraw],['IP Whitelisting Active',true],['Broker Enclave Connected',connected],['AES-256 Secret Storage',keyGen]].map(([label,ok])=>(
              <div key={label} className="flex items-center gap-2 text-[10px] font-mono">
                {ok?<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>:<AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0"/>}
                <span className={ok?'text-slate-300':'text-slate-500'}>{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // VPS ─────────────────────────────────────────────────────────────────────
  function VpsTab() {
    const sc = { RUNNING:'text-emerald-400', PAUSED:'text-amber-400', OFFLINE:'text-rose-400' };
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card gold className="col-span-2 lg:col-span-1">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono mb-1">Server Status</p>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${vpsStatus==='RUNNING'?'bg-emerald-400 animate-ping':'bg-amber-400'}`}/>
              <span className={`text-xl font-bold font-mono ${sc[vpsStatus]}`}>{vpsStatus}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">EU-WEST-1 — London</p>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>setVpsStatus('RUNNING')} className="flex-1 py-1 text-[10px] font-mono border border-emerald-500/40 text-emerald-400 rounded hover:bg-emerald-950/20 transition-all">▶ Run</button>
              <button onClick={()=>setVpsStatus('PAUSED')} className="flex-1 py-1 text-[10px] font-mono border border-amber-500/40 text-amber-400 rounded hover:bg-amber-950/20 transition-all">⏸ Pause</button>
            </div>
          </Card>
          <StatBox label="Ping Latency"    value={`${vpsPing}ms`} color="text-emerald-400" sub="CEX router avg" />
          <StatBox label="CPU Utilisation" value={`${vpsCpu}%`}   color={vpsCpu>60?'text-rose-400':'text-blue-400'} sub="4-core daemon" />
          <StatBox label="RAM Usage"       value={`${vpsRam} GB`} color="text-purple-400" sub="of 4 GB allocated" />
        </div>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2"><Terminal className="w-3.5 h-3.5"/>Daemon Heartbeat Log</span>
            <span className={`w-2 h-2 rounded-full ${vpsStatus==='RUNNING'?'bg-emerald-400 animate-ping':'bg-slate-600'}`}/>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] max-h-60 overflow-y-auto space-y-1 border border-slate-800">
            {daemon.length===0?<p className="text-slate-600">Awaiting daemon events…</p>
              :daemon.map((line,i)=><p key={i} className={i===0?'text-emerald-400':'text-slate-500'}>{line}</p>)}
          </div>
        </Card>
        <Card>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">Bot Fleet Status</p>
          <div className="space-y-2">
            {bots.map(bot=>{
              const Icon=bot.icon;
              return (
                <div key={bot.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-900/40 border border-slate-800/50 flex-wrap">
                  <Icon className={`w-4 h-4 shrink-0 ${bot.active&&canAccessBot(bot.id)?'text-[#D4AF37]':'text-slate-600'}`}/>
                  <span className="text-xs text-slate-200 flex-1 min-w-[120px]">{bot.name}</span>
                  <TierBadge tier={bot.tier} />
                  <RiskBadge risk={bot.risk} />
                  <Badge color="slate">{bot.speed}</Badge>
                  <button onClick={()=>canAccessBot(bot.id)?toggleBot(bot.id):setCheckoutTier(bot.tier)}
                    className={`text-[10px] px-2.5 py-1 rounded border font-mono transition-all ${canAccessBot(bot.id)&&bot.active?'border-emerald-500/40 text-emerald-400 bg-emerald-950/20':canAccessBot(bot.id)?'border-slate-700 text-slate-500':'border-purple-500/30 text-purple-400'}`}>
                    {canAccessBot(bot.id)?(bot.active?'LIVE':'IDLE'):'LOCKED'}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // COMMAND DESK ─────────────────────────────────────────────────────────────
  function CommandTab() {
    const lotValue = (parseFloat(tradeAmt)||0) * ASSET_PRICES[tradeAsset].base;
    const markup   = (lotValue * markupPct / 100).toFixed(2);
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card gold>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">Manual Order Placement</p>
            <form onSubmit={handleTrade} className="space-y-4">
              <div><label className="text-[10px] text-slate-400 font-mono mb-1 block">Asset</label>
                <div className="flex gap-2">
                  {Object.keys(ASSET_PRICES).map(a=>(
                    <button key={a} type="button" onClick={()=>setTrAsset(a)}
                      className={`flex-1 py-2 rounded border text-xs font-mono transition-all ${tradeAsset===a?'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/30':'border-slate-700 text-slate-400 hover:border-slate-600'}`}>{a}</button>
                  ))}
                </div>
              </div>
              <div><label className="text-[10px] text-slate-400 font-mono mb-1 block">Direction</label>
                <div className="flex gap-2">
                  {['BUY','SELL'].map(s=>(
                    <button key={s} type="button" onClick={()=>setSide(s)}
                      className={`flex-1 py-2.5 rounded border text-xs font-mono font-bold transition-all ${tradeSide===s?(s==='BUY'?'border-emerald-500/60 text-emerald-400 bg-emerald-950/30':'border-rose-500/60 text-rose-400 bg-rose-950/30'):'border-slate-700 text-slate-500'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div><label className="text-[10px] text-slate-400 font-mono mb-1 block">Order Type</label>
                <div className="flex gap-2">
                  {['MARKET','LIMIT','STOP'].map(t=>(
                    <button key={t} type="button" onClick={()=>setOT(t)}
                      className={`flex-1 py-1.5 rounded border text-[10px] font-mono transition-all ${orderType===t?'border-[#D4AF37]/40 text-[#D4AF37] bg-amber-950/20':'border-slate-700 text-slate-500'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div><label className="text-[10px] text-slate-400 font-mono mb-1 block">Lot Size — ~${lotValue.toLocaleString(undefined,{maximumFractionDigits:0})} USDT</label>
                <input value={tradeAmt} onChange={e=>setTrAmt(e.target.value)} type="number" min="0.01" step="0.01" placeholder="1.00" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50"/>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 text-[10px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400"><span>Price</span><span className="text-white">${ASSET_PRICES[tradeAsset].base.toLocaleString()}</span></div>
                <div className="flex justify-between text-slate-400"><span>Markup ({markupPct.toFixed(2)}%)</span><span className="text-[#D4AF37]">+${markup}</span></div>
                <div className="flex justify-between text-slate-400"><span>Broker</span><span>{broker} {connected?'(LIVE)':'(SIM)'}</span></div>
              </div>
              <button type="submit" className={`w-full py-3 rounded-lg text-sm font-mono font-bold border transition-all ${tradeSide==='BUY'?'border-emerald-500/50 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40':'border-rose-500/50 text-rose-400 bg-rose-950/20 hover:bg-rose-950/40'}`}>
                Execute {tradeSide} {tradeAmt||'—'} {tradeAsset}
              </button>
            </form>
          </Card>
          <Card>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">Recent Executions</p>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
              {transactions.slice(0,15).map(tx=>(
                <div key={tx.id} className={`rounded-lg px-3 py-2 text-[10px] font-mono border ${tx.type==='BUY'?'border-emerald-800/30 bg-emerald-950/10':'border-rose-800/30 bg-rose-950/10'}`}>
                  <div className="flex justify-between">
                    <span className={tx.type==='BUY'?'text-emerald-400 font-bold':'text-rose-400 font-bold'}>{tx.type}</span>
                    <span className="text-slate-500">{tx.time}</span>
                  </div>
                  <div className="flex justify-between mt-0.5 text-slate-400"><span>{tx.pair}</span><span>{tx.amount}@${tx.price}</span></div>
                  <div className="flex justify-between mt-0.5"><span className="text-slate-500 truncate">{tx.bot}</span><span className="text-[#D4AF37]">+${tx.fee}</span></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // GUILD FLOOR ──────────────────────────────────────────────────────────────
  function GuildTab() {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Total Members" value={guildUsers.length} color="text-blue-400" />
          <StatBox label="Active Now"    value={guildUsers.filter(u=>u.active).length} color="text-emerald-400" />
          <StatBox label="Total AUM"     value={`$${guildUsers.reduce((a,u)=>a+u.balance,0).toLocaleString()}`} color="text-[#D4AF37]" />
          <StatBox label="MRR"           value={`$${mrr}`} color="text-amber-400" delta={12.4} />
        </div>
        <Card gold>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-4">Guild Member Registry</p>
          <div className="space-y-3">
            {guildUsers.map(user=>(
              <div key={user.id} className={`rounded-xl border p-4 ${user.active?'border-[#D4AF37]/20 bg-amber-950/10':'border-slate-800/50 bg-slate-900/20'}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${user.active?'bg-emerald-400 animate-pulse':'bg-slate-600'}`}/>
                  <span className="text-sm font-semibold text-slate-100">{user.alias}</span>
                  <TierBadge tier={user.tier} />
                  <Badge color={user.active?'emerald':'slate'}>{user.active?'ACTIVE':'OFFLINE'}</Badge>
                  <span className="text-[10px] text-slate-500 font-mono ml-auto">{user.platform}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {[['Balance',`$${user.balance.toLocaleString()}`,'text-white'],['Copying',user.botCopied,'text-[#D4AF37]'],['Volume',`$${user.totalVolume.toLocaleString()}`,'text-slate-200'],['Commission',`$${user.commissionPaid.toLocaleString()}`,'text-emerald-400']].map(([l,v,c])=>(
                    <div key={l}><p className="text-[9px] text-slate-500 uppercase font-mono">{l}</p><p className={`text-sm font-mono font-bold ${c}`}>{v}</p></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ORACLE ──────────────────────────────────────────────────────────────────
  function OracleTab() {
    return (
      <div className="space-y-5">
        <Card gold className="flex flex-col" style={{ height:520 }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#D4AF37]"/>
            <span className="text-sm font-semibold text-slate-100">Virtuoso Neural Oracle v6.1</span>
            <Badge color="amber">Revenue AI</Badge>
          </div>
          <div ref={aiRef} className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
            {aiLog.map((msg,i)=>(
              <div key={i} className={`rounded-xl p-3 text-xs leading-relaxed ${msg.role==='user'?'bg-slate-800/60 text-slate-200 ml-8':msg.role==='system'?'bg-slate-900/60 text-slate-500 border border-slate-800 text-[10px] font-mono':'bg-amber-950/20 border border-[#D4AF37]/20 text-slate-200 mr-8'}`}>
                {msg.role!=='system'&&<span className={`text-[9px] font-mono font-bold block mb-1 ${msg.role==='user'?'text-slate-400':'text-[#D4AF37]'}`}>{msg.role==='user'?'YOU →':'ORACLE →'}</span>}
                {msg.text}
              </div>
            ))}
            {aiThink&&<div className="bg-amber-950/10 border border-[#D4AF37]/20 rounded-xl p-3 mr-8"><span className="text-[9px] font-mono font-bold text-[#D4AF37] block mb-1">ORACLE →</span><span className="text-slate-400 text-xs">Analysing monetization parameters</span><span className="inline-flex gap-1 ml-2">{[0,1,2].map(i=><span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</span></div>}
          </div>
          <form onSubmit={handleOracle} className="flex gap-2">
            <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="Ask about revenue, churn, affiliates, tier strategy…" className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50"/>
            <button type="submit" disabled={aiThink} className="px-4 py-2 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40 transition-all disabled:opacity-40"><ArrowRight className="w-4 h-4"/></button>
          </form>
        </Card>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {['Optimise monetisation fees','Analyse churn risk','Top affiliate performance','Best tier upsell strategy'].map(prompt=>(
            <button key={prompt} onClick={()=>setAiPrompt(prompt)} className="text-left p-3 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-[#D4AF37]/30 hover:bg-amber-950/10 transition-all">
              <p className="text-[11px] text-slate-300 leading-relaxed">{prompt}</p>
              <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37] mt-1"/>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  const totalPnl   = bots.reduce((a,b)=>a+b.pnl,0);
  const activeBots = bots.filter(b=>b.active).length;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-x-hidden bg-[#0D0E12]">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"/>
      <div className="fixed bottom-10 right-10 w-[600px] h-[600px] bg-yellow-600/5 rounded-full blur-[150px] pointer-events-none"/>

      {/* Checkout modal */}
      {checkoutTier && (
        <CheckoutModal
          tier={checkoutTier}
          onClose={() => setCheckoutTier(null)}
          onSuccess={() => {
            setMyTier(checkoutTier);
            notify(`Upgraded to ${TIERS[checkoutTier].name} — new bots unlocked!`, 'success');
            setCheckoutTier(null);
          }}
        />
      )}

      {/* Notification */}
      {notif && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-mono shadow-xl max-w-sm ${notif.type==='success'?'bg-emerald-950/95 border-emerald-500/40 text-emerald-300':notif.type==='warning'?'bg-amber-950/95 border-amber-500/40 text-amber-300':'bg-slate-900/95 border-slate-700 text-slate-200'}`}>
          {notif.type==='success'&&<CheckCircle2 className="w-4 h-4 shrink-0"/>}
          {notif.type==='warning'&&<AlertTriangle className="w-4 h-4 shrink-0"/>}
          {notif.type==='info'&&<Info className="w-4 h-4 shrink-0"/>}
          <span>{notif.message}</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="border-b border-[#c5a880]/20 bg-black/40 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#D4AF37]/30 bg-gradient-to-br from-amber-950/40 to-slate-900">
              <Workflow className="w-5 h-5 text-[#D4AF37] animate-pulse"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg md:text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA7C11]">RENAISSANCE</span>
                <Badge color="amber">Sovereign Engine</Badge>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">NON-CUSTODIAL SECURE TRADING & COPY-MARKETPLACE</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-mono">
            {/* My plan */}
            <button onClick={() => setActiveTab('pricing')}
              className="bg-slate-900/60 border border-[#c5a880]/15 px-3 py-1.5 rounded flex items-center gap-2 hover:border-[#D4AF37]/30 transition-all">
              {React.createElement(TIERS[myTier].icon, { className:'w-3.5 h-3.5', style:{ color:TIERS[myTier].color } })}
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">MY PLAN</p>
                <p className="font-bold" style={{ color:TIERS[myTier].color }}>{TIERS[myTier].name}</p>
              </div>
            </button>
            {/* MRR */}
            <div className="bg-[#181510] border border-[#D4AF37]/30 px-3 py-1.5 rounded flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#D4AF37]"/>
              <div>
                <p className="text-[9px] text-[#D4AF37] uppercase tracking-wider">MRR</p>
                <p className="text-emerald-400 font-bold">${mrr.toLocaleString()}</p>
              </div>
            </div>
            {/* Treasury */}
            <div className="bg-slate-900/60 border border-[#c5a880]/15 px-3 py-1.5 rounded flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#D4AF37]"/>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">TREASURY</p>
                <p className="text-emerald-400 font-bold">${treasury.toLocaleString()}</p>
              </div>
            </div>
            <button onClick={()=>setSys(s=>!s)}
              className={`px-3 py-1.5 rounded border text-[10px] font-bold font-mono transition-all ${systemActive?'border-emerald-500/40 text-emerald-400 bg-emerald-950/20':'border-rose-500/40 text-rose-400 bg-rose-950/20'}`}>
              {systemActive?'⏹ HALT ALL':'▶ ACTIVATE'}
            </button>
          </div>
        </div>
      </header>

      {/* ── NAV ── */}
      <nav className="border-b border-slate-800/60 bg-black/20 sticky top-[73px] z-30 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1 py-2">
          {TABS.map(({ id, label, icon:Icon }) => (
            <button key={id} onClick={()=>setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all ${activeTab===id?'bg-amber-950/30 border border-[#D4AF37]/30 text-[#D4AF37]':'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}`}>
              <Icon className="w-3.5 h-3.5"/>{label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab==='sfumato'     && <SfumatoTab/>}
        {activeTab==='revenue'     && <RevenueTab/>}
        {activeTab==='pricing'     && <PricingTab/>}
        {activeTab==='integration' && <IntegrationTab/>}
        {activeTab==='vps'         && <VpsTab/>}
        {activeTab==='command'     && <CommandTab/>}
        {activeTab==='floor'       && <GuildTab/>}
        {activeTab==='oracle'      && <OracleTab/>}
      </main>

      <footer className="border-t border-slate-800/50 py-3 px-6 text-center">
        <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">
          Renaissance Sovereign Engine · {activeBots}/{bots.length} bots active · {guildUsers.filter(u=>u.active).length} guild members · MRR ${mrr} · Non-Custodial
        </p>
      </footer>
    </div>
  );
}
