import {
  Star, Zap, Crown,
  Cpu, Shield, Compass, TrendingUp, Layers,
  Activity, CreditCard, Tag, Lock, HardDrive, Terminal, Users, Sparkles,
} from 'lucide-react';

export const GOLD = '#D4AF37';
export const STATIC_IP = '18.134.205.14';

// Simulation tuning
export const TICK_INTERVAL_MS     = 3800;
export const MAX_LOT_RANDOM       = 3;
export const MIN_LOT_SIZE         = 0.05;
export const PROFIT_FACTOR        = 0.04;
export const WIN_RATE_THRESHOLD   = 0.45;
export const LOSS_RATIO           = 0.15;
export const MAX_DAEMON_LOG       = 14;
export const MAX_TX_LOG           = 17;
export const ORACLE_REPLY_DELAY_MS = 1500;

// Chart geometry
export const CHART_W   = 560;
export const CHART_H   = 170;
export const CHART_PTS = 14;

export const TIERS = {
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

export const INITIAL_BOTS = [
  { id: 'leo',  name: 'Da Vinci Arbitrage',    icon: Cpu,       tier: 'sovereign',
    type: 'Harmonic Cross-Venue Arbitrage',     efficiency: '98.4%', active: true,
    pnl: 4320.50, trades: 142, risk: 'Low',     speed: '4ms',
    sharpe: '3.12', drawdown: '2.4%',  winRate: '88.5%',
    description: 'Exploits high-frequency price discrepancies between Exness spot feeds and Bybit contract orderbooks.' },
  { id: 'socr', name: 'Socratic Delta Neutral', icon: Shield,    tier: 'master',
    type: 'Philosophical Delta Neutral Hedge',  efficiency: '95.1%', active: true,
    pnl: 2890.10, trades: 84,  risk: 'Medium', speed: '12ms',
    sharpe: '2.84', drawdown: '4.1%',  winRate: '79.2%',
    description: 'Dynamic hedge module combining spot purchases with short-side derivative contracts to harvest funding yields.' },
  { id: 'gali', name: 'Galileo Grid',           icon: Compass,   tier: 'apprentice',
    type: 'Celestial Grid & Fibonacci Recursion', efficiency: '91.8%', active: false,
    pnl: -140.20, trades: 210, risk: 'High',   speed: '8ms',
    sharpe: '1.95', drawdown: '12.8%', winRate: '68.4%',
    description: 'Deploys geometric buy/sell levels anchored on high-beta Fibonacci Retracements.' },
  { id: 'mikh', name: 'Michelangelo Momentum',  icon: TrendingUp, tier: 'master',
    type: 'Fresco Trend & Volume Tracer',       efficiency: '96.2%', active: true,
    pnl: 5810.00, trades: 95,  risk: 'Medium', speed: '10ms',
    sharpe: '2.45', drawdown: '6.5%',  winRate: '74.8%',
    description: 'Tracks exponential moving averages overlaid with volume breakout signatures on major assets.' },
  { id: 'mach', name: 'Machiavelli Liquidity',  icon: Layers,    tier: 'sovereign',
    type: 'Fortress Market Making',            efficiency: '99.1%', active: true,
    pnl: 9450.30, trades: 1024, risk: 'Low',   speed: '2ms',
    sharpe: '4.21', drawdown: '1.1%',  winRate: '94.1%',
    description: 'Asymmetric market-making model engineered to capture rapid spreads during elevated volatility phases.' },
];

export const INITIAL_GUILD = [
  { id: 'u-1', alias: 'Lorenzo_de_Medici', platform: 'Bybit V5 Enclave',   balance: 45000,  botCopied: 'Da Vinci Arbitrage',    totalVolume: 1250000, commissionPaid: 1250, active: true,  tier: 'sovereign',  joinedDaysAgo: 45, referredBy: null,     referralCode: 'LDM-45' },
  { id: 'u-2', alias: 'Sovereign_Alpha',   platform: 'Exness MT5 Gateway', balance: 18500,  botCopied: 'Machiavelli Liquidity', totalVolume:  480000, commissionPaid:  480, active: true,  tier: 'master',     joinedDaysAgo: 28, referredBy: 'LDM-45', referralCode: 'SA-28'  },
  { id: 'u-3', alias: 'Pico_Mirandola',    platform: 'Blofin Sandbox',     balance:  8900,  botCopied: 'Galileo Grid',          totalVolume:  110000, commissionPaid:  110, active: false, tier: 'apprentice', joinedDaysAgo: 12, referredBy: 'LDM-45', referralCode: 'PM-12'  },
  { id: 'u-4', alias: 'Alberti_Quant',     platform: 'Bybit V5 Enclave',   balance: 102400, botCopied: 'Michelangelo Momentum', totalVolume: 3450000, commissionPaid: 3450, active: true,  tier: 'sovereign',  joinedDaysAgo: 61, referredBy: null,     referralCode: 'AQ-61'  },
];

export const ASSET_PRICES = {
  RENA: { base: 284.15,   color: '#D4AF37', fullName: 'Renaissance Utility' },
  ETH:  { base: 3412.50,  color: '#627EEA', fullName: 'Ethereum Network' },
  BTC:  { base: 64850.00, color: '#F7931A', fullName: 'Bitcoin Standard' },
  SOL:  { base: 142.80,   color: '#14F195', fullName: 'Solana High Speed' },
};

export const TABS = [
  { id: 'sfumato',     label: 'Sfumato Matrix', icon: Activity  },
  { id: 'revenue',     label: 'Revenue Hub',    icon: CreditCard },
  { id: 'pricing',     label: 'Pricing',        icon: Tag        },
  { id: 'integration', label: 'Broker Nexus',   icon: Lock       },
  { id: 'vps',         label: 'Sovereign VPS',  icon: HardDrive  },
  { id: 'command',     label: 'Command Desk',   icon: Terminal   },
  { id: 'floor',       label: 'Guild Floor',    icon: Users      },
  { id: 'oracle',      label: 'AI Oracle',      icon: Sparkles   },
];
