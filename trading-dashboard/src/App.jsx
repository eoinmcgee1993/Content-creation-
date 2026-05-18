import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Cpu, Layers, TrendingUp, Compass, Zap, Terminal, Play, Square, RefreshCw,
  Sparkles, DollarSign, ArrowUpDown, Workflow, Wallet, ShoppingBag, Search, ArrowUpRight,
  Lock, Globe, Coins, Users, Percent, ChevronRight, Database, Sliders, Settings, Flame,
  Award, BookOpen, Info, CheckCircle2, AlertTriangle, HelpCircle, HardDrive, Copy, Eye,
  EyeOff, Activity, ArrowRight
} from 'lucide-react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const INITIAL_BOTS = [
  {
    id: 'leo', name: 'Da Vinci Arbitrage', icon: Cpu,
    type: 'Harmonic Cross-Venue Arbitrage', efficiency: '98.4%', active: true,
    pnl: 4320.50, trades: 142, risk: 'Low', speed: '4ms',
    sharpe: '3.12', drawdown: '2.4%', winRate: '88.5%',
    description: 'Exploits high-frequency price discrepancies between Exness spot feeds and Bybit contract orderbooks.'
  },
  {
    id: 'socr', name: 'Socratic Delta Neutral', icon: Shield,
    type: 'Philosophical Delta Neutral Hedge', efficiency: '95.1%', active: true,
    pnl: 2890.10, trades: 84, risk: 'Medium', speed: '12ms',
    sharpe: '2.84', drawdown: '4.1%', winRate: '79.2%',
    description: 'Dynamic hedge module combining spot purchases with short-side derivative contracts to harvest funding yields.'
  },
  {
    id: 'gali', name: 'Galileo Grid', icon: Compass,
    type: 'Celestial Grid & Fibonacci Recursion', efficiency: '91.8%', active: false,
    pnl: -140.20, trades: 210, risk: 'High', speed: '8ms',
    sharpe: '1.95', drawdown: '12.8%', winRate: '68.4%',
    description: 'Deploys geometric buy/sell levels anchored on high-beta Fibonacci Retracements.'
  },
  {
    id: 'mikh', name: 'Michelangelo Momentum', icon: TrendingUp,
    type: 'Fresco Trend & Volume Tracer', efficiency: '96.2%', active: true,
    pnl: 5810.00, trades: 95, risk: 'Medium', speed: '10ms',
    sharpe: '2.45', drawdown: '6.5%', winRate: '74.8%',
    description: 'Tracks exponential moving averages overlaid with volume breakout signatures on major assets.'
  },
  {
    id: 'mach', name: 'Machiavelli Liquidity', icon: Layers,
    type: 'Fortress Market Making', efficiency: '99.1%', active: true,
    pnl: 9450.30, trades: 1024, risk: 'Low', speed: '2ms',
    sharpe: '4.21', drawdown: '1.1%', winRate: '94.1%',
    description: 'Asymmetric market-making model engineered to capture rapid spreads during elevated volatility phases.'
  },
];

const INITIAL_GUILD_USERS = [
  { id: 'u-1', alias: 'Lorenzo_de_Medici', platform: 'Bybit V5 Enclave', balance: 45000, botCopied: 'Da Vinci Arbitrage', totalVolume: 1250000, commissionPaid: 1250, active: true },
  { id: 'u-2', alias: 'Sovereign_Alpha', platform: 'Exness MT5 Gateway', balance: 18500, botCopied: 'Machiavelli Liquidity', totalVolume: 480000, commissionPaid: 480, active: true },
  { id: 'u-3', alias: 'Pico_Mirandola', platform: 'Blofin Isolated Sandbox', balance: 8900, botCopied: 'Galileo Grid', totalVolume: 110000, commissionPaid: 110, active: false },
  { id: 'u-4', alias: 'Alberti_Quant', platform: 'Bybit V5 Enclave', balance: 102400, botCopied: 'Michelangelo Momentum', totalVolume: 3450000, commissionPaid: 3450, active: true },
];

const ASSET_PRICES = {
  RENA: { base: 284.15, color: '#D4AF37', fullName: 'Renaissance Utility' },
  ETH:  { base: 3412.50, color: '#627EEA', fullName: 'Ethereum Network' },
  BTC:  { base: 64850.00, color: '#F7931A', fullName: 'Bitcoin Standard' },
  SOL:  { base: 142.80, color: '#14F195', fullName: 'Solana High Speed' },
};

const TABS = [
  { id: 'sfumato',      label: 'Sfumato Matrix',  icon: Activity },
  { id: 'monetization', label: 'Medici Treasury', icon: Coins },
  { id: 'integration',  label: 'Broker Nexus',    icon: Lock },
  { id: 'vps',          label: 'Sovereign VPS',   icon: HardDrive },
  { id: 'command',      label: 'Command Desk',    icon: Terminal },
  { id: 'floor',        label: 'Guild Floor',     icon: Users },
  { id: 'oracle',       label: 'AI Oracle',       icon: Sparkles },
];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Badge({ children, color = 'amber' }) {
  const colors = {
    amber:   'border-amber-500/40 text-amber-300 bg-amber-950/30',
    emerald: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30',
    rose:    'border-rose-500/40 text-rose-300 bg-rose-950/30',
    slate:   'border-slate-500/40 text-slate-300 bg-slate-900/50',
    blue:    'border-blue-500/40 text-blue-300 bg-blue-950/30',
    purple:  'border-purple-500/40 text-purple-300 bg-purple-950/30',
  };
  return (
    <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-mono ${colors[color] || colors.amber}`}>
      {children}
    </span>
  );
}

function Card({ children, className = '', gold = false }) {
  return (
    <div className={`rounded-xl border bg-black/30 backdrop-blur-sm p-4 ${gold ? 'border-[#D4AF37]/25' : 'border-slate-800/60'} ${className}`}>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sub}</p>}
    </div>
  );
}

function RiskBadge({ risk }) {
  const map = { Low: 'emerald', Medium: 'amber', High: 'rose' };
  return <Badge color={map[risk] || 'slate'}>{risk} risk</Badge>;
}

// ─── CHART ────────────────────────────────────────────────────────────────────
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
  const area   = `${line} L ${coords[pts - 1].x} ${H} L ${coords[0].x} ${H} Z`;

  const fiboLevels = [0.236, 0.382, 0.5, 0.618, 0.786].map(r => ({
    y: 20 + r * (H - 40), label: `${(r * 100).toFixed(1)}%`,
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id={`g-${assetCode}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={asset.color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={asset.color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(r => (
        <line key={r} x1="0" y1={H * r} x2={W} y2={H * r} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {showFibo && fiboLevels.map(({ y, label }) => (
        <g key={label}>
          <line x1="0" y1={y} x2={W} y2={y} stroke="#D4AF37" strokeWidth="0.6" strokeOpacity="0.4" strokeDasharray="6 3" />
          <text x={W - 4} y={y - 3} fontSize="7" fill="#D4AF37" opacity="0.55" textAnchor="end">{label}</text>
        </g>
      ))}
      <path d={area} fill={`url(#g-${assetCode})`} />
      <path d={line}  fill="none" stroke={asset.color} strokeWidth="2" strokeLinejoin="round" />
      {coords.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={asset.color} opacity="0.7" />)}
      {showGolden && (
        <ellipse cx={W * 0.618} cy={H * 0.5} rx={W * 0.2} ry={H * 0.35}
          fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="8 4" />
      )}
    </svg>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab]   = useState('sfumato');
  const [bots, setBots]             = useState(INITIAL_BOTS);
  const [transactions, setTx]       = useState([]);
  const [guildUsers, setGuild]      = useState(INITIAL_GUILD_USERS);
  const [systemActive, setSys]      = useState(true);

  // Chart
  const [chartAsset, setChartAsset]         = useState('RENA');
  const [showGoldSpiral, setGoldSpiral]     = useState(true);
  const [showFibo, setFibo]                 = useState(true);
  const [selectedBotId, setSelBot]          = useState('leo');
  const [chartTf, setChartTf]              = useState('1H');

  // Monetization
  const [perfFeePct, setPerfFee]    = useState(20);
  const [markupPct, setMarkup]      = useState(0.15);
  const [licenseFee, setLicense]    = useState(149);
  const [treasury, setTreasury]     = useState(5290);

  // Broker
  const [broker, setBroker]         = useState('Bybit');
  const [connected, setConnected]   = useState(false);
  const [apiKey, setApiKey]         = useState('');
  const [apiSecret, setApiSecret]   = useState('');
  const [mtLogin, setMtLogin]       = useState('');
  const [mtPass, setMtPass]         = useState('');
  const [showSec, setShowSec]       = useState(false);

  // Security
  const staticIP                    = '18.134.205.14';
  const [keyGen, setKeyGen]         = useState(false);
  const [pubKey, setPubKey]         = useState('');
  const [rwOnly, setRwOnly]         = useState(true);
  const [noWithdraw, setNoWithdraw] = useState(true);

  // VPS
  const [vpsStatus, setVpsStatus]   = useState('RUNNING');
  const [vpsPing, setVpsPing]       = useState(4);
  const [vpsCpu, setVpsCpu]         = useState(14);
  const [vpsRam, setVpsRam]         = useState(1.2);
  const [daemon, setDaemon]         = useState([]);

  // Command
  const [tradeSide, setSide]        = useState('BUY');
  const [tradeAsset, setTrAsset]    = useState('RENA');
  const [orderType, setOT]          = useState('MARKET');
  const [tradeAmt, setTrAmt]        = useState('1');

  // Oracle
  const [aiPrompt, setAiPrompt]     = useState('');
  const [aiLog, setAiLog]           = useState([
    { role: 'system',    text: 'Virtuoso Neural Oracle v6.1 — Non-Custodial Multi-Broker Enclaves active.' },
    { role: 'assistant', text: 'Salutations, Sovereign Strategist. All security barriers are active. How shall we structure your automated monetization algorithms today?' },
  ]);
  const [aiThink, setAiThink]       = useState(false);
  const [notif, setNotif]           = useState(null);
  const aiRef                       = useRef(null);

  const notify = (message, type = 'info') => {
    setNotif({ message, type });
    setTimeout(() => setNotif(null), 5000);
  };

  // Seed transactions
  useEffect(() => {
    setTx([
      { id: 'i1', time: '14:24:01', bot: 'Da Vinci Arbitrage', pair: 'RENA/USDT', type: 'BUY', amount: '12.50', price: '284.15', fee: '3.55', status: 'FILLED' },
      { id: 'i2', time: '14:24:05', bot: 'Machiavelli Liquidity', pair: 'BTC/USDT', type: 'SELL', amount: '0.15', price: '64820.00', fee: '9.72', status: 'FILLED' },
      { id: 'i3', time: '14:24:12', bot: 'Sovereign Desk (Exness)', pair: 'ETH/USD', type: 'BUY', amount: '2.50', price: '3412.50', fee: '8.53', status: 'FILLED' },
    ]);
  }, []);

  // Live loop
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
      setTx(p => [{
        id: `g${Date.now()}`, time: ts, bot: `${user.alias} (${user.platform})`,
        pair: `${assetKey}/USDT`, type: Math.random() > 0.5 ? 'BUY' : 'SELL',
        amount: lot.toFixed(2), price: px.toFixed(2), fee: rev.toFixed(2),
        status: 'FILLED', guild: true,
      }, ...p.slice(0, 17)]);
      setDaemon(p => [
        `[${ts}] DEPLOY [${user.botCopied.split(' ')[0]}] | ${user.platform} | Vol: $${Math.round(vol)} | Rev: +$${rev}`,
        ...p.slice(0, 14),
      ]);
      setVpsCpu(Math.floor(10 + Math.random() * 20));
      setVpsPing(Math.floor(3 + Math.random() * 3));
      setVpsRam(+(1.1 + Math.random() * 0.4).toFixed(2));
      setGuild(p => p.map(u => u.id !== user.id ? u : {
        ...u,
        totalVolume: u.totalVolume + Math.round(vol),
        commissionPaid: +(u.commissionPaid + rev).toFixed(2),
      }));
    }, 3800);
    return () => clearInterval(iv);
  }, [systemActive, vpsStatus, guildUsers, markupPct, perfFeePct]);

  useEffect(() => {
    if (aiRef.current) aiRef.current.scrollTop = aiRef.current.scrollHeight;
  }, [aiLog]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleKeyGen = () => {
    setPubKey('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD...EnclaveSovereign24');
    setKeyGen(true);
    notify('Asymmetric keypair generated inside secure enclave.', 'success');
  };

  const handleBrokerConnect = (e) => {
    e.preventDefault();
    if (!keyGen)      { notify('Generate Enclave Key first (Step 1).', 'warning'); return; }
    if (!rwOnly || !noWithdraw) { notify('Enable security constraints first.', 'warning'); return; }
    if (broker === 'Exness' && (!mtLogin || !mtPass)) { notify('MT5 credentials required.', 'warning'); return; }
    if (broker !== 'Exness' && (!apiKey || !apiSecret)) { notify(`${broker} API Key & Secret required.`, 'warning'); return; }
    setConnected(true);
    notify(`${broker} connected — daemon live.`, 'success');
  };

  const handleTrade = (e) => {
    e.preventDefault();
    const size = parseFloat(tradeAmt);
    if (isNaN(size) || size <= 0) { notify('Enter a valid lot size.', 'warning'); return; }
    const px     = ASSET_PRICES[tradeAsset].base;
    const markup = +(size * px * (markupPct / 100)).toFixed(2);
    setTreasury(p => +(p + markup).toFixed(2));
    const ts = new Date().toTimeString().split(' ')[0];
    setTx(p => [{
      id: `m${Date.now()}`, time: ts,
      bot: `Sovereign Desk (${broker}${connected ? ' CLOUD' : ' SIM'})`,
      pair: `${tradeAsset}/USDT`, type: tradeSide,
      amount: size.toFixed(2), price: px.toFixed(2),
      fee: markup.toFixed(2), status: 'FILLED', manual: true,
    }, ...p]);
    notify(`${tradeSide} ${size} ${tradeAsset} — markup +$${markup} collected.`, 'success');
  };

  const handleOracle = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    const prompt = aiPrompt;
    setAiLog(p => [...p, { role: 'user', text: prompt }]);
    setAiPrompt('');
    setAiThink(true);
    setTimeout(() => {
      const lp = prompt.toLowerCase();
      let reply;
      if (lp.includes('fee') || lp.includes('monetis') || lp.includes('monetiz') || lp.includes('charge')) {
        setPerfFee(25); setMarkup(0.20);
        reply = 'Medici Treasury realigned: performance fee → 25%, spread markup → 0.20%. Projected yield +28.5%.';
        notify('Monetization model optimised.', 'success');
      } else if (lp.includes('securit') || lp.includes('enclave') || lp.includes('key')) {
        reply = `Your ${broker} credentials are wrapped with asymmetric key isolation inside the sandboxed daemon. No raw secrets persist in browser memory.`;
      } else if (lp.includes('bot') || lp.includes('strateg') || lp.includes('algori')) {
        const active = bots.filter(b => b.active);
        const avgSharpe = (active.reduce((a, b) => a + parseFloat(b.sharpe), 0) / active.length).toFixed(2);
        reply = `${active.length} bots live: ${active.map(b => b.name).join(', ')}. Combined Sharpe ratio: ${avgSharpe}.`;
      } else {
        reply = `Analysis complete. Renaissance nodes monitoring ${chartAsset} on ${broker}. Guild members replicating live signals with custom revenue share.`;
      }
      setAiLog(p => [...p, { role: 'assistant', text: reply }]);
      setAiThink(false);
    }, 1500);
  };

  const withdrawTreasury = () => {
    if (treasury <= 0) { notify('No accrued balance.', 'warning'); return; }
    notify(`Disbursing $${treasury.toLocaleString()} USDT to Web3 Settlement Vault.`, 'success');
    setTreasury(0);
  };

  const toggleBot = (id) => {
    const bot = bots.find(b => b.id === id);
    setBots(p => p.map(b => b.id === id ? { ...b, active: !b.active } : b));
    notify(`${bot.name} → ${bot.active ? 'STANDBY' : 'LIVE'}`, 'info');
  };

  // ── Sub-views ─────────────────────────────────────────────────────────────
  const selBot = bots.find(b => b.id === selectedBotId) || bots[0];

  // Sfumato (main dashboard) ─────────────────────────────────────────────────
  function SfumatoTab() {
    return (
      <div className="space-y-5">
        {/* Bot selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {bots.map(bot => {
            const Icon = bot.icon;
            const sel  = bot.id === selectedBotId;
            return (
              <button key={bot.id} onClick={() => setSelBot(bot.id)}
                className={`text-left rounded-xl border p-3 transition-all ${sel
                  ? 'border-[#D4AF37]/50 bg-amber-950/20'
                  : 'border-slate-800/50 bg-black/20 hover:border-slate-700'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${bot.active ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
                  <span className={`w-1.5 h-1.5 rounded-full ${bot.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                </div>
                <p className="text-xs font-semibold text-slate-200 leading-tight">{bot.name}</p>
                <p className={`text-xs font-mono font-bold mt-1 ${bot.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {bot.pnl >= 0 ? '+' : ''}${bot.pnl.toLocaleString()}
                </p>
              </button>
            );
          })}
        </div>

        {/* Chart + selected bot */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2" gold>
            {/* Chart controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex gap-1">
                {Object.keys(ASSET_PRICES).map(a => (
                  <button key={a} onClick={() => setChartAsset(a)}
                    className={`text-[10px] px-2 py-1 rounded font-mono border transition-all ${chartAsset === a
                      ? 'border-[#D4AF37]/60 text-[#D4AF37] bg-amber-950/30'
                      : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                    {a}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex gap-1">
                  {['15M','1H','4H','1D'].map(tf => (
                    <button key={tf} onClick={() => setChartTf(tf)}
                      className={`text-[10px] px-2 py-1 rounded font-mono border transition-all ${chartTf === tf
                        ? 'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/30'
                        : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                      {tf}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showGoldSpiral} onChange={e => setGoldSpiral(e.target.checked)} className="accent-amber-500 w-3 h-3" />
                  <span className="text-[10px] text-amber-400 font-mono">φ Spiral</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showFibo} onChange={e => setFibo(e.target.checked)} className="accent-amber-500 w-3 h-3" />
                  <span className="text-[10px] text-amber-400 font-mono">Fibo</span>
                </label>
              </div>
            </div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-2xl font-mono font-bold text-white">
                ${ASSET_PRICES[chartAsset].base.toLocaleString()}
              </span>
              <Badge color="emerald">+2.14%</Badge>
              <span className="text-xs text-slate-500 font-mono">{ASSET_PRICES[chartAsset].fullName}</span>
            </div>
            <MiniChart assetCode={chartAsset} showGolden={showGoldSpiral} showFibo={showFibo} />
          </Card>

          {/* Bot stats */}
          <Card gold className="space-y-3">
            <div className="flex items-center gap-2">
              {React.createElement(selBot.icon, { className: 'w-5 h-5 text-[#D4AF37]' })}
              <span className="font-semibold text-sm text-slate-100 flex-1">{selBot.name}</span>
              <span className={`w-2 h-2 rounded-full ${selBot.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">{selBot.description}</p>
            <div className="grid grid-cols-2 gap-2">
              <StatBox label="PnL" value={`${selBot.pnl >= 0 ? '+' : ''}$${selBot.pnl.toLocaleString()}`}
                color={selBot.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
              <StatBox label="Win Rate"  value={selBot.winRate}  color="text-amber-400" />
              <StatBox label="Sharpe"    value={selBot.sharpe}   color="text-blue-400" />
              <StatBox label="Drawdown"  value={selBot.drawdown} color="text-orange-400" />
              <StatBox label="Trades"    value={selBot.trades} />
              <StatBox label="Speed"     value={selBot.speed}    color="text-purple-400" />
            </div>
            <div className="flex flex-wrap gap-2">
              <RiskBadge risk={selBot.risk} />
              <Badge color="slate">{selBot.efficiency} eff.</Badge>
            </div>
            <button onClick={() => toggleBot(selBot.id)}
              className={`w-full py-2 rounded-lg text-xs font-mono font-bold border transition-all ${selBot.active
                ? 'border-rose-500/40 text-rose-400 bg-rose-950/20 hover:bg-rose-950/40'
                : 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40'}`}>
              {selBot.active ? '⏹ PAUSE BOT' : '▶ ACTIVATE BOT'}
            </button>
          </Card>
        </div>

        {/* Transaction log */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Live Transaction Feed</span>
            <Badge color="emerald">{transactions.length} events</Badge>
          </div>
          <div className="space-y-px max-h-52 overflow-y-auto">
            {transactions.map(tx => (
              <div key={tx.id} className={`flex items-center gap-2 text-[10px] font-mono py-1.5 px-2 rounded ${tx.guild ? 'bg-amber-950/10' : tx.manual ? 'bg-blue-950/10' : 'bg-slate-900/20'}`}>
                <span className="text-slate-500 w-16 shrink-0">{tx.time}</span>
                <span className={`w-8 font-bold ${tx.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{tx.type}</span>
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

  // Monetization ─────────────────────────────────────────────────────────────
  function MonetizationTab() {
    const totalComm = guildUsers.reduce((a, u) => a + u.commissionPaid, 0);
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card gold className="col-span-2 lg:col-span-1">
            <p className="text-[9px] text-[#D4AF37] uppercase tracking-widest font-mono mb-1">Medici Treasury</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">${treasury.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Accrued USDT revenue</p>
            <button onClick={withdrawTreasury}
              className="mt-3 w-full py-1.5 rounded border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono hover:bg-amber-950/30 transition-all">
              Disburse to Vault →
            </button>
          </Card>
          <StatBox label="Total Guild Commission" value={`$${totalComm.toLocaleString()}`} color="text-amber-400" />
          <StatBox label="Active Members" value={`${guildUsers.filter(u=>u.active).length}/${guildUsers.length}`} color="text-blue-400" />
          <StatBox label="License Fee" value={`$${licenseFee}/mo`} color="text-purple-400" />
        </div>

        <Card gold>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">Revenue Model Configuration</p>
          <div className="space-y-6">
            {[
              {
                label: 'Performance Profit Share', val: `${perfFeePct}%`,
                min: 5, max: 50, step: 1, value: perfFeePct, set: setPerfFee,
                hint: 'Applied to positive PnL realised by copy-trade users.',
              },
              {
                label: 'Execution Spread Markup', val: `${markupPct.toFixed(2)}%`,
                min: 0.01, max: 1, step: 0.01, value: markupPct, set: setMarkup,
                hint: 'Applied to every executed lot from guild members.',
              },
              {
                label: 'License Subscription Fee', val: `$${licenseFee}/mo`,
                min: 49, max: 999, step: 10, value: licenseFee, set: setLicense,
                hint: 'Flat monthly fee per platform subscriber.',
              },
            ].map(({ label, val, min, max, step, value, set, hint }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-300 font-mono">{label}</span>
                  <span className="text-xs text-[#D4AF37] font-mono font-bold">{val}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={value}
                  onChange={e => set(parseFloat(e.target.value))}
                  className="w-full accent-amber-500" />
                <p className="text-[10px] text-slate-500 mt-1">{hint}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">Monthly Revenue Projection</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'License Revenue',       value: `$${(licenseFee * guildUsers.length).toLocaleString()}` },
              { label: 'Markup @ $5M volume',   value: `$${(5_000_000 * markupPct / 100).toLocaleString()}` },
              { label: 'Perf. Share @ 4% avg',  value: `$${Math.round(5_000_000 * 0.04 * perfFeePct / 100).toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 text-center">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono mb-1">{label}</p>
                <p className="text-lg font-bold font-mono text-emerald-400">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Integration ─────────────────────────────────────────────────────────────
  function IntegrationTab() {
    return (
      <div className="space-y-5">
        {/* Step 1: enclave key */}
        <Card gold>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-amber-950 border border-[#D4AF37]/40 flex items-center justify-center text-[10px] text-[#D4AF37] font-bold">1</span>
            <span className="text-sm font-semibold text-slate-100">Generate Enclave Keypair</span>
            {keyGen && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            An RSA-4096 keypair is generated locally inside an isolated enclave. Broker credentials are encrypted with the private key which never leaves the environment.
          </p>
          {/* static IP */}
          <div className="flex items-center gap-2 text-[10px] font-mono bg-slate-900/60 border border-slate-800 rounded px-3 py-2 mb-3">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Whitelisted Static IP:</span>
            <span className="text-emerald-400 font-bold">{staticIP}</span>
            <button onClick={() => navigator.clipboard?.writeText(staticIP)} className="ml-auto text-slate-500 hover:text-slate-300">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          {keyGen && (
            <div className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-800/40 rounded p-2 mb-3 break-all">
              {pubKey}
            </div>
          )}
          <div className="flex flex-wrap gap-4 items-start">
            <button onClick={handleKeyGen}
              className={`px-4 py-2 rounded text-xs font-mono font-bold border transition-all ${keyGen
                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                : 'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40'}`}>
              {keyGen ? '✓ Key Generated' : 'Generate Enclave Key'}
            </button>
            <div className="space-y-1.5">
              {[
                { label: 'Read+Write Only (no withdrawal API perms)', val: rwOnly, set: setRwOnly },
                { label: 'Withdrawal disabled on broker side', val: noWithdraw, set: setNoWithdraw },
              ].map(({ label, val, set }) => (
                <label key={label} className="flex items-center gap-2 text-[10px] text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="accent-amber-500 w-3 h-3" />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </Card>

        {/* Step 2: broker credentials */}
        <Card gold>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-amber-950 border border-[#D4AF37]/40 flex items-center justify-center text-[10px] text-[#D4AF37] font-bold">2</span>
            <span className="text-sm font-semibold text-slate-100">Connect Broker</span>
            {connected && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
          </div>
          <div className="flex gap-2 mb-4">
            {['Bybit','Blofin','Exness'].map(b => (
              <button key={b} onClick={() => setBroker(b)}
                className={`px-3 py-1.5 rounded text-[11px] font-mono border transition-all ${broker === b
                  ? 'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/30'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                {b}
              </button>
            ))}
          </div>
          <form onSubmit={handleBrokerConnect} className="space-y-3">
            {broker === 'Exness' ? (
              <>
                <div>
                  <label className="text-[10px] text-slate-400 font-mono mb-1 block">MT5 Login</label>
                  <input value={mtLogin} onChange={e => setMtLogin(e.target.value)} placeholder="12345678"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" />
                </div>
                <div className="relative">
                  <label className="text-[10px] text-slate-400 font-mono mb-1 block">MT5 Password</label>
                  <input type={showSec ? 'text' : 'password'} value={mtPass} onChange={e => setMtPass(e.target.value)} placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" />
                  <button type="button" onClick={() => setShowSec(s => !s)} className="absolute right-3 top-6 text-slate-500 hover:text-slate-300">
                    {showSec ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-[10px] text-slate-400 font-mono mb-1 block">{broker} API Key</label>
                  <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" />
                </div>
                <div className="relative">
                  <label className="text-[10px] text-slate-400 font-mono mb-1 block">API Secret</label>
                  <input type={showSec ? 'text' : 'password'} value={apiSecret} onChange={e => setApiSecret(e.target.value)} placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" />
                  <button type="button" onClick={() => setShowSec(s => !s)} className="absolute right-3 top-6 text-slate-500 hover:text-slate-300">
                    {showSec ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </>
            )}
            <button type="submit"
              className={`w-full py-2.5 rounded text-xs font-mono font-bold border transition-all ${connected
                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                : 'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40'}`}>
              {connected ? `✓ ${broker} Connected` : `Connect ${broker}`}
            </button>
          </form>
        </Card>

        {/* Security matrix */}
        <Card>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">Security Audit Matrix</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ['Asymmetric Key Isolation',    keyGen],
              ['Read+Write Only (No Withdraw)', rwOnly],
              ['Withdrawal Flag Disabled',     noWithdraw],
              ['IP Whitelisting Active',       true],
              ['Broker Enclave Connected',     connected],
              ['AES-256 Secret Storage',       keyGen],
            ].map(([label, ok]) => (
              <div key={label} className="flex items-center gap-2 text-[10px] font-mono">
                {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <span className={ok ? 'text-slate-300' : 'text-slate-500'}>{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // VPS ─────────────────────────────────────────────────────────────────────
  function VpsTab() {
    const sc = { RUNNING: 'text-emerald-400', PAUSED: 'text-amber-400', OFFLINE: 'text-rose-400' };
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card gold className="col-span-2 lg:col-span-1">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono mb-1">Server Status</p>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${vpsStatus === 'RUNNING' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className={`text-xl font-bold font-mono ${sc[vpsStatus]}`}>{vpsStatus}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">EU-WEST-1 — London</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setVpsStatus('RUNNING')}
                className="flex-1 py-1 text-[10px] font-mono border border-emerald-500/40 text-emerald-400 rounded hover:bg-emerald-950/20 transition-all">▶ Run</button>
              <button onClick={() => setVpsStatus('PAUSED')}
                className="flex-1 py-1 text-[10px] font-mono border border-amber-500/40 text-amber-400 rounded hover:bg-amber-950/20 transition-all">⏸ Pause</button>
            </div>
          </Card>
          <StatBox label="Ping Latency"    value={`${vpsPing}ms`} color="text-emerald-400" sub="CEX router avg" />
          <StatBox label="CPU Utilisation" value={`${vpsCpu}%`}   color={vpsCpu > 60 ? 'text-rose-400' : 'text-blue-400'} sub="4-core daemon" />
          <StatBox label="RAM Usage"       value={`${vpsRam} GB`} color="text-purple-400" sub="of 4 GB allocated" />
        </div>

        {/* Daemon log */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" /> Daemon Heartbeat Log
            </span>
            <span className={`w-2 h-2 rounded-full ${vpsStatus === 'RUNNING' ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
          </div>
          <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] max-h-60 overflow-y-auto space-y-1 border border-slate-800">
            {daemon.length === 0
              ? <p className="text-slate-600">Awaiting daemon events — simulation warming up…</p>
              : daemon.map((line, i) => (
                <p key={i} className={i === 0 ? 'text-emerald-400' : 'text-slate-500'}>{line}</p>
              ))}
          </div>
        </Card>

        {/* Bot fleet */}
        <Card>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">Bot Fleet Status</p>
          <div className="space-y-2">
            {bots.map(bot => {
              const Icon = bot.icon;
              return (
                <div key={bot.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-900/40 border border-slate-800/50 flex-wrap">
                  <Icon className={`w-4 h-4 shrink-0 ${bot.active ? 'text-[#D4AF37]' : 'text-slate-600'}`} />
                  <span className="text-xs text-slate-200 flex-1 min-w-[120px]">{bot.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:block">{bot.type}</span>
                  <RiskBadge risk={bot.risk} />
                  <Badge color="slate">{bot.speed}</Badge>
                  <button onClick={() => toggleBot(bot.id)}
                    className={`text-[10px] px-2.5 py-1 rounded border font-mono transition-all ${bot.active
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                      : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                    {bot.active ? 'LIVE' : 'IDLE'}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // Command Desk ─────────────────────────────────────────────────────────────
  function CommandTab() {
    const lotValue = (parseFloat(tradeAmt) || 0) * ASSET_PRICES[tradeAsset].base;
    const markup   = (lotValue * markupPct / 100).toFixed(2);
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card gold>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">Manual Order Placement</p>
            <form onSubmit={handleTrade} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-mono mb-1 block">Asset</label>
                <div className="flex gap-2">
                  {Object.keys(ASSET_PRICES).map(a => (
                    <button key={a} type="button" onClick={() => setTrAsset(a)}
                      className={`flex-1 py-2 rounded border text-xs font-mono transition-all ${tradeAsset === a
                        ? 'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/30'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono mb-1 block">Direction</label>
                <div className="flex gap-2">
                  {['BUY','SELL'].map(s => (
                    <button key={s} type="button" onClick={() => setSide(s)}
                      className={`flex-1 py-2.5 rounded border text-xs font-mono font-bold transition-all ${tradeSide === s
                        ? s === 'BUY'
                          ? 'border-emerald-500/60 text-emerald-400 bg-emerald-950/30'
                          : 'border-rose-500/60 text-rose-400 bg-rose-950/30'
                        : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono mb-1 block">Order Type</label>
                <div className="flex gap-2">
                  {['MARKET','LIMIT','STOP'].map(t => (
                    <button key={t} type="button" onClick={() => setOT(t)}
                      className={`flex-1 py-1.5 rounded border text-[10px] font-mono transition-all ${orderType === t
                        ? 'border-[#D4AF37]/40 text-[#D4AF37] bg-amber-950/20'
                        : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono mb-1 block">
                  Lot Size — ~${lotValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDT
                </label>
                <input value={tradeAmt} onChange={e => setTrAmt(e.target.value)}
                  type="number" min="0.01" step="0.01" placeholder="1.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" />
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 text-[10px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Execution price</span>
                  <span className="text-white">${ASSET_PRICES[tradeAsset].base.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Spread markup ({markupPct.toFixed(2)}%)</span>
                  <span className="text-[#D4AF37]">+${markup}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Broker</span>
                  <span>{broker} {connected ? '(LIVE)' : '(SIM)'}</span>
                </div>
              </div>
              <button type="submit"
                className={`w-full py-3 rounded-lg text-sm font-mono font-bold border transition-all ${tradeSide === 'BUY'
                  ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40'
                  : 'border-rose-500/50 text-rose-400 bg-rose-950/20 hover:bg-rose-950/40'}`}>
                Execute {tradeSide} {tradeAmt || '—'} {tradeAsset}
              </button>
            </form>
          </Card>

          <Card>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">Recent Executions</p>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
              {transactions.slice(0, 15).map(tx => (
                <div key={tx.id} className={`rounded-lg px-3 py-2 text-[10px] font-mono border ${tx.type === 'BUY' ? 'border-emerald-800/30 bg-emerald-950/10' : 'border-rose-800/30 bg-rose-950/10'}`}>
                  <div className="flex justify-between">
                    <span className={tx.type === 'BUY' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{tx.type}</span>
                    <span className="text-slate-500">{tx.time}</span>
                  </div>
                  <div className="flex justify-between mt-0.5 text-slate-400">
                    <span>{tx.pair}</span>
                    <span>{tx.amount} @ ${tx.price}</span>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-slate-500 truncate">{tx.bot}</span>
                    <span className="text-[#D4AF37]">+${tx.fee}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Guild Floor ──────────────────────────────────────────────────────────────
  function GuildTab() {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Total Members" value={guildUsers.length} color="text-blue-400" />
          <StatBox label="Active Now" value={guildUsers.filter(u=>u.active).length} color="text-emerald-400" />
          <StatBox label="Total AUM" value={`$${guildUsers.reduce((a,u)=>a+u.balance,0).toLocaleString()}`} color="text-[#D4AF37]" />
          <StatBox label="Total Commission" value={`$${guildUsers.reduce((a,u)=>a+u.commissionPaid,0).toLocaleString()}`} color="text-amber-400" />
        </div>
        <Card gold>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-4">Guild Member Registry</p>
          <div className="space-y-3">
            {guildUsers.map(user => (
              <div key={user.id} className={`rounded-xl border p-4 ${user.active ? 'border-[#D4AF37]/20 bg-amber-950/10' : 'border-slate-800/50 bg-slate-900/20'}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${user.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-sm font-semibold text-slate-100">{user.alias}</span>
                  <Badge color={user.active ? 'emerald' : 'slate'}>{user.active ? 'ACTIVE' : 'OFFLINE'}</Badge>
                  <span className="text-[10px] text-slate-500 font-mono ml-auto">{user.platform}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {[
                    ['Balance', `$${user.balance.toLocaleString()}`, 'text-white'],
                    ['Copying',  user.botCopied,                    'text-[#D4AF37]'],
                    ['Volume',  `$${user.totalVolume.toLocaleString()}`, 'text-slate-200'],
                    ['Commission', `$${user.commissionPaid.toLocaleString()}`, 'text-emerald-400'],
                  ].map(([lbl, val, col]) => (
                    <div key={lbl}>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">{lbl}</p>
                      <p className={`text-sm font-mono font-bold ${col}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // AI Oracle ────────────────────────────────────────────────────────────────
  function OracleTab() {
    return (
      <div className="space-y-5">
        <Card gold className="flex flex-col" style={{ height: 520 }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-semibold text-slate-100">Virtuoso Neural Oracle v6.1</span>
            <Badge color="amber">AI Core</Badge>
          </div>
          <div ref={aiRef} className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
            {aiLog.map((msg, i) => (
              <div key={i} className={`rounded-xl p-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-slate-800/60 text-slate-200 ml-8'
                  : msg.role === 'system'
                    ? 'bg-slate-900/60 text-slate-500 border border-slate-800 text-[10px] font-mono'
                    : 'bg-amber-950/20 border border-[#D4AF37]/20 text-slate-200 mr-8'
              }`}>
                {msg.role !== 'system' && (
                  <span className={`text-[9px] font-mono font-bold block mb-1 ${msg.role === 'user' ? 'text-slate-400' : 'text-[#D4AF37]'}`}>
                    {msg.role === 'user' ? 'YOU →' : 'ORACLE →'}
                  </span>
                )}
                {msg.text}
              </div>
            ))}
            {aiThink && (
              <div className="bg-amber-950/10 border border-[#D4AF37]/20 rounded-xl p-3 mr-8">
                <span className="text-[9px] font-mono font-bold text-[#D4AF37] block mb-1">ORACLE →</span>
                <span className="text-slate-400 text-xs">Analysing sovereign parameters</span>
                <span className="inline-flex gap-1 ml-2">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            )}
          </div>
          <form onSubmit={handleOracle} className="flex gap-2">
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              placeholder="Ask about strategy, fees, security, bots…"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" />
            <button type="submit" disabled={aiThink}
              className="px-4 py-2 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40 transition-all disabled:opacity-40">
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            'Optimise monetisation fees',
            'Analyse bot security posture',
            'Show active strategy stats',
            'Explain copy-trade revenue model',
          ].map(prompt => (
            <button key={prompt} onClick={() => setAiPrompt(prompt)}
              className="text-left p-3 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-[#D4AF37]/30 hover:bg-amber-950/10 transition-all">
              <p className="text-[11px] text-slate-300 leading-relaxed">{prompt}</p>
              <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37] mt-1" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  const totalPnl  = bots.reduce((a, b) => a + b.pnl, 0);
  const activeBots = bots.filter(b => b.active).length;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-x-hidden bg-[#0D0E12]">
      {/* ambient glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-[600px] h-[600px] bg-yellow-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Notification toast */}
      {notif && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-mono shadow-xl transition-all max-w-sm ${
          notif.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300'
          : notif.type === 'warning' ? 'bg-amber-950/95 border-amber-500/40 text-amber-300'
          : 'bg-slate-900/95 border-slate-700 text-slate-200'}`}>
          {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
          {notif.type === 'info'    && <Info className="w-4 h-4 shrink-0" />}
          <span className="text-sm">{notif.message}</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="border-b border-[#c5a880]/20 bg-black/40 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#D4AF37]/30 bg-gradient-to-br from-amber-950/40 to-slate-900">
              <Workflow className="w-5 h-5 text-[#D4AF37] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg md:text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA7C11]">
                  RENAISSANCE
                </span>
                <Badge color="amber">Sovereign Engine</Badge>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">NON-CUSTODIAL SECURE TRADING & COPY-MARKETPLACE</p>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-mono">
            <div className="bg-slate-900/60 border border-[#c5a880]/15 px-3 py-1.5 rounded flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${vpsStatus === 'RUNNING' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">VPS DAEMON</p>
                <p className={`font-bold ${vpsStatus === 'RUNNING' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {vpsStatus} <span className="text-slate-500 font-normal">({vpsPing}ms)</span>
                </p>
              </div>
            </div>
            <div className="bg-[#181510] border border-[#D4AF37]/30 px-3 py-1.5 rounded flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#D4AF37]" />
              <div>
                <p className="text-[9px] text-[#D4AF37] uppercase tracking-wider">MEDICI REVENUE</p>
                <p className="text-emerald-400 font-bold">${treasury.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-[#c5a880]/15 px-3 py-1.5 rounded flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">FLEET PnL</p>
                <p className={`font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}
                </p>
              </div>
            </div>
            <button onClick={() => setSys(s => !s)}
              className={`px-3 py-1.5 rounded border text-[10px] font-bold font-mono transition-all ${systemActive
                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40'
                : 'border-rose-500/40 text-rose-400 bg-rose-950/20 hover:bg-rose-950/40'}`}>
              {systemActive ? '⏹ HALT ALL' : '▶ ACTIVATE'}
            </button>
          </div>
        </div>
      </header>

      {/* ── NAV ── */}
      <nav className="border-b border-slate-800/60 bg-black/20 sticky top-[73px] z-30 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1 py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all ${activeTab === id
                ? 'bg-amber-950/30 border border-[#D4AF37]/30 text-[#D4AF37]'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab === 'sfumato'      && <SfumatoTab />}
        {activeTab === 'monetization' && <MonetizationTab />}
        {activeTab === 'integration'  && <IntegrationTab />}
        {activeTab === 'vps'          && <VpsTab />}
        {activeTab === 'command'      && <CommandTab />}
        {activeTab === 'floor'        && <GuildTab />}
        {activeTab === 'oracle'       && <OracleTab />}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/50 py-3 px-6 text-center">
        <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">
          Renaissance Sovereign Engine · Non-Custodial · {activeBots}/{bots.length} bots active · {guildUsers.filter(u=>u.active).length} guild members online
        </p>
      </footer>
    </div>
  );
}
