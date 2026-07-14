import React, { useState, useEffect, useRef } from 'react';
import { Workflow, Coins, CreditCard, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

import {
  TIERS, INITIAL_BOTS, INITIAL_GUILD, ASSET_PRICES, TABS, STATIC_IP,
  TICK_INTERVAL_MS, MAX_LOT_RANDOM, MIN_LOT_SIZE, PROFIT_FACTOR,
  WIN_RATE_THRESHOLD, LOSS_RATIO, MAX_DAEMON_LOG, MAX_TX_LOG, ORACLE_REPLY_DELAY_MS,
} from './constants';

import CheckoutModal from './components/CheckoutModal';
import SfumatoTab    from './tabs/SfumatoTab';
import RevenueTab    from './tabs/RevenueTab';
import PricingTab    from './tabs/PricingTab';
import IntegrationTab from './tabs/IntegrationTab';
import VpsTab        from './tabs/VpsTab';
import CommandTab    from './tabs/CommandTab';
import GuildTab      from './tabs/GuildTab';
import OracleTab     from './tabs/OracleTab';

export default function App() {
  const [activeTab, setActiveTab]       = useState('sfumato');
  const [bots, setBots]                 = useState(INITIAL_BOTS);
  const [transactions, setTx]           = useState([]);
  const [guildUsers, setGuild]          = useState(INITIAL_GUILD);
  const [systemActive, setSys]          = useState(true);
  const [myTier, setMyTier]             = useState('master');
  const [checkoutTier, setCheckoutTier] = useState(null);

  // Chart
  const [chartAsset, setChartAsset]     = useState('RENA');
  const [showGoldSpiral, setGoldSpiral] = useState(true);
  const [showFibo, setFibo]             = useState(true);
  const [selectedBotId, setSelBot]      = useState('leo');
  const [chartTf, setChartTf]           = useState('1H');

  // Revenue
  const [perfFeePct, setPerfFee]        = useState(20);
  const [markupPct, setMarkup]          = useState(0.15);
  const [licenseFee, setLicense]        = useState(149);
  const [treasury, setTreasury]         = useState(5290);
  const [revenueHistory]                = useState(() =>
    Array.from({ length: 6 }, (_, i) => ({
      month:   ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i],
      mrr:     [2100, 2900, 3450, 4200, 4900, 5290][i],
      members: [2, 2, 3, 3, 4, 4][i],
    }))
  );
  const [affiliates, setAffiliates]     = useState([
    { code: 'RENA-ALPHA', uses: 12, earned: 588, paid: 420, pending: 168, rate: 20 },
    { code: 'MEDICI-X',   uses: 7,  earned: 343, paid: 343, pending: 0,   rate: 20 },
    { code: 'QUANT-99',   uses: 3,  earned: 147, paid: 0,   pending: 147, rate: 20 },
  ]);
  const [newAffCode, setNewAffCode]     = useState('');
  const [billingHistory, setBillingHistory] = useState([
    { id: 'inv-001', date: '2026-04-01', user: 'Lorenzo_de_Medici', tier: 'sovereign',  amount: 499, status: 'paid'    },
    { id: 'inv-002', date: '2026-04-01', user: 'Alberti_Quant',     tier: 'sovereign',  amount: 499, status: 'paid'    },
    { id: 'inv-003', date: '2026-04-01', user: 'Sovereign_Alpha',   tier: 'master',     amount: 149, status: 'paid'    },
    { id: 'inv-004', date: '2026-04-01', user: 'Pico_Mirandola',    tier: 'apprentice', amount: 49,  status: 'overdue' },
    { id: 'inv-005', date: '2026-05-01', user: 'Lorenzo_de_Medici', tier: 'sovereign',  amount: 499, status: 'paid'    },
    { id: 'inv-006', date: '2026-05-01', user: 'Alberti_Quant',     tier: 'sovereign',  amount: 499, status: 'paid'    },
    { id: 'inv-007', date: '2026-05-01', user: 'Sovereign_Alpha',   tier: 'master',     amount: 149, status: 'paid'    },
    { id: 'inv-008', date: '2026-05-01', user: 'Pico_Mirandola',    tier: 'apprentice', amount: 49,  status: 'failed'  },
  ]);

  // Broker
  const [broker, setBroker]             = useState('Bybit');
  const [connected, setConnected]       = useState(false);
  const [apiKey, setApiKey]             = useState('');
  const [apiSecret, setApiSecret]       = useState('');
  const [mtLogin, setMtLogin]           = useState('');
  const [mtPass, setMtPass]             = useState('');
  const [showSec, setShowSec]           = useState(false);

  // Enclave
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

  // Manual trade
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

  // ── Helpers ────────────────────────────────────────────────────────────────
  const notify = (message, type = 'info') => {
    setNotif({ message, type });
    setTimeout(() => setNotif(null), 5000);
  };

  const canAccessBot = (botId) => TIERS[myTier]?.bots.includes(botId);

  // ── Seed transactions ──────────────────────────────────────────────────────
  useEffect(() => {
    setTx([
      { id: 'i1', time: '14:24:01', bot: 'Da Vinci Arbitrage',    pair: 'RENA/USDT', type: 'BUY',  amount: '12.50', price: '284.15',   fee: '3.55', status: 'FILLED' },
      { id: 'i2', time: '14:24:05', bot: 'Machiavelli Liquidity', pair: 'BTC/USDT',  type: 'SELL', amount: '0.15',  price: '64820.00', fee: '9.72', status: 'FILLED' },
      { id: 'i3', time: '14:24:12', bot: 'Sovereign Desk',        pair: 'ETH/USD',   type: 'BUY',  amount: '2.50',  price: '3412.50',  fee: '8.53', status: 'FILLED' },
    ]);
  }, []);

  // ── Live simulation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!systemActive || vpsStatus !== 'RUNNING') return;
    const iv = setInterval(() => {
      const active = guildUsers.filter(u => u.active);
      if (!active.length) return;
      const user     = active[Math.floor(Math.random() * active.length)];
      const assetKey = Object.keys(ASSET_PRICES)[Math.floor(Math.random() * 4)];
      const asset    = ASSET_PRICES[assetKey];
      const lot      = +(Math.random() * MAX_LOT_RANDOM + MIN_LOT_SIZE).toFixed(2);
      const px       = asset.base * (1 + (Math.random() - 0.5) * 0.002);
      const vol      = lot * px;
      const mkCut    = +(vol * (markupPct / 100)).toFixed(2);
      const profit   = vol * PROFIT_FACTOR * (Math.random() > WIN_RATE_THRESHOLD ? 1 : -LOSS_RATIO);
      const pfCut    = profit > 0 ? +(profit * (perfFeePct / 100)).toFixed(2) : 0;
      const rev      = +(mkCut + pfCut).toFixed(2);
      const ts       = new Date().toTimeString().split(' ')[0];

      setTreasury(p => +(p + rev).toFixed(2));
      setTx(p => [{
        id: `g${Date.now()}`, time: ts, bot: user.alias, pair: `${assetKey}/USDT`,
        type: Math.random() > 0.5 ? 'BUY' : 'SELL', amount: lot.toFixed(2),
        price: px.toFixed(2), fee: rev.toFixed(2), status: 'FILLED', guild: true,
      }, ...p.slice(0, MAX_TX_LOG)]);
      setDaemon(p => [
        `[${ts}] DEPLOY [${user.botCopied.split(' ')[0]}] | ${user.platform} | Vol: $${Math.round(vol)} | Rev: +$${rev}`,
        ...p.slice(0, MAX_DAEMON_LOG),
      ]);
      setVpsCpu(Math.floor(10 + Math.random() * 20));
      setVpsPing(Math.floor(3 + Math.random() * 3));
      setVpsRam(+(1.1 + Math.random() * 0.4).toFixed(2));
      setGuild(p => p.map(u => u.id !== user.id ? u : {
        ...u,
        totalVolume:    u.totalVolume + Math.round(vol),
        commissionPaid: +(u.commissionPaid + rev).toFixed(2),
      }));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [systemActive, vpsStatus, guildUsers, markupPct, perfFeePct]);

  useEffect(() => {
    if (aiRef.current) aiRef.current.scrollTop = aiRef.current.scrollHeight;
  }, [aiLog]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleKeyGen = () => {
    setPubKey('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD...EnclaveSovereign24');
    setKeyGen(true);
    notify('Asymmetric keypair generated inside secure enclave.', 'success');
  };

  const handleBrokerConnect = (e) => {
    e.preventDefault();
    if (!keyGen)                                { notify('Generate Enclave Key first.', 'warning'); return; }
    if (!rwOnly || !noWithdraw)                 { notify('Enable security constraints first.', 'warning'); return; }
    if (broker === 'Exness' && (!mtLogin || !mtPass)) { notify('MT5 credentials required.', 'warning'); return; }
    if (broker !== 'Exness' && (!apiKey || !apiSecret)) { notify(`${broker} API Key & Secret required.`, 'warning'); return; }
    setConnected(true);
    notify(`${broker} connected — daemon live.`, 'success');
  };

  const handleTrade = (e) => {
    e.preventDefault();
    const size = parseFloat(tradeAmt);
    if (isNaN(size) || size <= 0)                           { notify('Enter a valid lot size.', 'warning'); return; }
    if (!canAccessBot('leo') && !canAccessBot('mach'))      { notify('Upgrade your plan to execute trades on premium bots.', 'warning'); return; }
    const px     = ASSET_PRICES[tradeAsset].base;
    const markup = +(size * px * (markupPct / 100)).toFixed(2);
    setTreasury(p => +(p + markup).toFixed(2));
    const ts = new Date().toTimeString().split(' ')[0];
    setTx(p => [{
      id: `m${Date.now()}`, time: ts,
      bot: `Sovereign Desk (${broker}${connected ? ' CLOUD' : ' SIM'})`,
      pair: `${tradeAsset}/USDT`, type: tradeSide, amount: size.toFixed(2),
      price: px.toFixed(2), fee: markup.toFixed(2), status: 'FILLED', manual: true,
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
      const matchers = [
        {
          test: ['monetis', 'monetiz', 'fee', 'revenue'],
          reply: () => {
            setPerfFee(25);
            setMarkup(0.20);
            notify('Revenue model optimised.', 'success');
            return 'Revenue stack optimised: performance share → 25%, spread markup → 0.20%. MRR projection increased by +28.5%. Recommend running an affiliate campaign targeting quant communities.';
          },
        },
        {
          test: ['affiliate', 'referral'],
          reply: () => 'Your top affiliate code "RENA-ALPHA" has 12 activations generating $588 in earned commission. Consider increasing the affiliate rate to 25% to accelerate viral growth.',
        },
        {
          test: ['tier', 'plan', 'upgrad', 'pric'],
          reply: () => {
            const currentMrr      = guildUsers.reduce((a, u) => a + TIERS[u.tier].price, 0);
            const masterUpgradeArr = guildUsers.filter(u => u.tier === 'master').length * (499 - 149);
            return `Current MRR from subscriptions: $${currentMrr.toLocaleString()}. Upgrading all Master members to Sovereign would add $${masterUpgradeArr.toLocaleString()} ARR. Consider an annual plan discount at 2 months free.`;
          },
        },
        {
          test: ['churn', 'retention'],
          reply: () => 'Churn risk detected on Pico_Mirandola (inactive, Apprentice tier, last invoice failed). Recommend offering a free week extension and nudging toward Master. Historical churn rate: 8.3% monthly.',
        },
        {
          test: ['bot', 'strateg'],
          reply: () => {
            const active   = bots.filter(b => b.active);
            const avgSharpe = (active.reduce((a, b) => a + parseFloat(b.sharpe), 0) / active.length).toFixed(2);
            return `${active.length} bots live. Combined Sharpe: ${avgSharpe}. Machiavelli Liquidity (Sovereign-only) is your highest-performing retention driver.`;
          },
        },
      ];

      const match = matchers.find(m => m.test.some(k => lp.includes(k)));
      const reply = match
        ? match.reply()
        : `Platform metrics look strong. ${guildUsers.filter(u => u.active).length} active guild members with combined AUM of $${guildUsers.reduce((a, u) => a + u.balance, 0).toLocaleString()}. Treasury accruing $${treasury.toLocaleString()} in real-time revenue.`;

      setAiLog(p => [...p, { role: 'assistant', text: reply }]);
      setAiThink(false);
    }, ORACLE_REPLY_DELAY_MS);
  };

  const withdrawTreasury = () => {
    if (treasury <= 0) { notify('No accrued balance.', 'warning'); return; }
    notify(`Disbursing $${treasury.toLocaleString()} USDT to Web3 Settlement Vault.`, 'success');
    setTreasury(0);
  };

  const toggleBot = (id) => {
    if (!canAccessBot(id)) { notify('This bot requires a higher plan. Click Upgrade to access it.', 'warning'); return; }
    const bot = bots.find(b => b.id === id);
    setBots(p => p.map(b => b.id === id ? { ...b, active: !b.active } : b));
    notify(`${bot.name} → ${bot.active ? 'STANDBY' : 'LIVE'}`, 'info');
  };

  const upgradeMember = (userId, newTier) => {
    const user = guildUsers.find(u => u.id === userId);
    const rev  = TIERS[newTier].price - TIERS[user.tier].price;
    setGuild(p => p.map(u => u.id !== userId ? u : { ...u, tier: newTier }));
    setTreasury(p => +(p + rev).toFixed(2));
    notify(`${user.alias} upgraded to ${TIERS[newTier].name}. +$${rev} MRR.`, 'success');
    setBillingHistory(p => [{
      id: `inv-${Date.now()}`, date: new Date().toISOString().slice(0, 10),
      user: user.alias, tier: newTier, amount: TIERS[newTier].price, status: 'paid',
    }, ...p]);
  };

  const generateAffiliate = () => {
    if (!newAffCode.trim()) { notify('Enter an affiliate code name.', 'warning'); return; }
    setAffiliates(p => [...p, { code: newAffCode.toUpperCase(), uses: 0, earned: 0, paid: 0, pending: 0, rate: 20 }]);
    setNewAffCode('');
    notify(`Affiliate code "${newAffCode.toUpperCase()}" created.`, 'success');
  };

  // ── Derived metrics ────────────────────────────────────────────────────────
  const mrr       = guildUsers.reduce((a, u) => a + TIERS[u.tier].price, 0);
  const arr       = mrr * 12;
  const churnRate = 8.3;
  const ltv       = Math.round((mrr / guildUsers.length) / (churnRate / 100));
  const activeBots = bots.filter(b => b.active).length;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-x-hidden bg-[#0D0E12]">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-[600px] h-[600px] bg-yellow-600/5 rounded-full blur-[150px] pointer-events-none" />

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

      {notif && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-mono shadow-xl max-w-sm ${
          notif.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300'
          : notif.type === 'warning' ? 'bg-amber-950/95 border-amber-500/40 text-amber-300'
          : 'bg-slate-900/95 border-slate-700 text-slate-200'}`}>
          {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
          {notif.type === 'info'    && <Info          className="w-4 h-4 shrink-0" />}
          <span>{notif.message}</span>
        </div>
      )}

      <header className="border-b border-[#c5a880]/20 bg-black/40 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#D4AF37]/30 bg-gradient-to-br from-amber-950/40 to-slate-900">
              <Workflow className="w-5 h-5 text-[#D4AF37] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg md:text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA7C11]">RENAISSANCE</span>
                <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-mono border-amber-500/40 text-amber-300 bg-amber-950/30">Sovereign Engine</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">NON-CUSTODIAL SECURE TRADING & COPY-MARKETPLACE</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-mono">
            <button onClick={() => setActiveTab('pricing')}
              className="bg-slate-900/60 border border-[#c5a880]/15 px-3 py-1.5 rounded flex items-center gap-2 hover:border-[#D4AF37]/30 transition-all">
              {React.createElement(TIERS[myTier].icon, { className: 'w-3.5 h-3.5', style: { color: TIERS[myTier].color } })}
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">MY PLAN</p>
                <p className="font-bold" style={{ color: TIERS[myTier].color }}>{TIERS[myTier].name}</p>
              </div>
            </button>
            <div className="bg-[#181510] border border-[#D4AF37]/30 px-3 py-1.5 rounded flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#D4AF37]" />
              <div>
                <p className="text-[9px] text-[#D4AF37] uppercase tracking-wider">MRR</p>
                <p className="text-emerald-400 font-bold">${mrr.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-[#c5a880]/15 px-3 py-1.5 rounded flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#D4AF37]" />
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">TREASURY</p>
                <p className="text-emerald-400 font-bold">${treasury.toLocaleString()}</p>
              </div>
            </div>
            <button onClick={() => setSys(s => !s)}
              className={`px-3 py-1.5 rounded border text-[10px] font-bold font-mono transition-all ${systemActive ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' : 'border-rose-500/40 text-rose-400 bg-rose-950/20'}`}>
              {systemActive ? '⏹ HALT ALL' : '▶ ACTIVATE'}
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-slate-800/60 bg-black/20 sticky top-[73px] z-30 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1 py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all ${activeTab === id ? 'bg-amber-950/30 border border-[#D4AF37]/30 text-[#D4AF37]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab === 'sfumato' && (
          <SfumatoTab
            bots={bots} selectedBotId={selectedBotId} setSelBot={setSelBot}
            canAccessBot={canAccessBot} toggleBot={toggleBot} setCheckoutTier={setCheckoutTier} myTier={myTier}
            chartAsset={chartAsset} setChartAsset={setChartAsset}
            showGoldSpiral={showGoldSpiral} setGoldSpiral={setGoldSpiral}
            showFibo={showFibo} setFibo={setFibo}
            chartTf={chartTf} setChartTf={setChartTf}
            transactions={transactions}
          />
        )}
        {activeTab === 'revenue' && (
          <RevenueTab
            treasury={treasury} withdrawTreasury={withdrawTreasury}
            mrr={mrr} arr={arr} churnRate={churnRate} ltv={ltv}
            revenueHistory={revenueHistory} guildUsers={guildUsers}
            perfFeePct={perfFeePct} setPerfFee={setPerfFee}
            markupPct={markupPct} setMarkup={setMarkup}
            licenseFee={licenseFee} setLicense={setLicense}
            affiliates={affiliates} setAffiliates={setAffiliates}
            newAffCode={newAffCode} setNewAffCode={setNewAffCode}
            generateAffiliate={generateAffiliate}
            billingHistory={billingHistory} setBillingHistory={setBillingHistory}
            upgradeMember={upgradeMember} notify={notify}
          />
        )}
        {activeTab === 'pricing'     && <PricingTab myTier={myTier} setCheckoutTier={setCheckoutTier} />}
        {activeTab === 'integration' && (
          <IntegrationTab
            keyGen={keyGen} handleKeyGen={handleKeyGen} pubKey={pubKey} staticIP={STATIC_IP}
            rwOnly={rwOnly} setRwOnly={setRwOnly} noWithdraw={noWithdraw} setNoWithdraw={setNoWithdraw}
            broker={broker} setBroker={setBroker} connected={connected}
            apiKey={apiKey} setApiKey={setApiKey} apiSecret={apiSecret} setApiSecret={setApiSecret}
            mtLogin={mtLogin} setMtLogin={setMtLogin} mtPass={mtPass} setMtPass={setMtPass}
            showSec={showSec} setShowSec={setShowSec} handleBrokerConnect={handleBrokerConnect}
          />
        )}
        {activeTab === 'vps' && (
          <VpsTab
            vpsStatus={vpsStatus} setVpsStatus={setVpsStatus}
            vpsPing={vpsPing} vpsCpu={vpsCpu} vpsRam={vpsRam} daemon={daemon}
            bots={bots} canAccessBot={canAccessBot} toggleBot={toggleBot} setCheckoutTier={setCheckoutTier}
          />
        )}
        {activeTab === 'command' && (
          <CommandTab
            tradeAsset={tradeAsset} setTrAsset={setTrAsset}
            tradeSide={tradeSide} setSide={setSide}
            orderType={orderType} setOT={setOT}
            tradeAmt={tradeAmt} setTrAmt={setTrAmt}
            markupPct={markupPct} broker={broker} connected={connected}
            handleTrade={handleTrade} transactions={transactions}
          />
        )}
        {activeTab === 'floor'  && <GuildTab guildUsers={guildUsers} mrr={mrr} />}
        {activeTab === 'oracle' && (
          <OracleTab
            aiLog={aiLog} aiThink={aiThink}
            aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
            handleOracle={handleOracle} aiRef={aiRef}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/50 py-3 px-6 text-center">
        <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">
          Renaissance Sovereign Engine · {activeBots}/{bots.length} bots active · {guildUsers.filter(u => u.active).length} guild members · MRR ${mrr} · Non-Custodial
        </p>
      </footer>
    </div>
  );
}
