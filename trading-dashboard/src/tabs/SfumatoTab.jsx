import React from 'react';
import { Crown, Lock } from 'lucide-react';
import { TIERS, ASSET_PRICES } from '../constants';
import Badge from '../components/Badge';
import Card from '../components/Card';
import StatBox from '../components/StatBox';
import RiskBadge from '../components/RiskBadge';
import TierBadge from '../components/TierBadge';
import MiniChart from '../components/MiniChart';

export default function SfumatoTab({
  bots, selectedBotId, setSelBot, canAccessBot, toggleBot, setCheckoutTier, myTier,
  chartAsset, setChartAsset, showGoldSpiral, setGoldSpiral, showFibo, setFibo,
  chartTf, setChartTf, transactions,
}) {
  const selBot = bots.find(b => b.id === selectedBotId) || bots[0];

  return (
    <div className="space-y-5">
      {/* Bot grid */}
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
              <p className={`text-xs font-mono font-bold mt-1 ${bot.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {bot.pnl >= 0 ? '+' : ''} ${bot.pnl.toLocaleString()}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tier upsell banner */}
      {myTier !== 'sovereign' && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/15 p-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300 font-mono">
              {myTier === 'apprentice'
                ? '2 bots locked. Master plan unlocks 3 bots.'
                : '2 HFT bots locked. Sovereign plan unlocks all 5.'}
            </span>
          </div>
          <button onClick={() => setCheckoutTier(myTier === 'apprentice' ? 'master' : 'sovereign')}
            className="px-3 py-1.5 rounded text-[11px] font-mono font-bold border border-purple-500/40 text-purple-300 bg-purple-950/30 hover:bg-purple-950/50 transition-all">
            Upgrade Now →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Chart */}
        <Card className="xl:col-span-2" gold>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex gap-1">
              {Object.keys(ASSET_PRICES).map(a => (
                <button key={a} onClick={() => setChartAsset(a)}
                  className={`text-[10px] px-2 py-1 rounded font-mono border transition-all ${chartAsset === a ? 'border-[#D4AF37]/60 text-[#D4AF37] bg-amber-950/30' : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                  {a}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1">
                {['15M', '1H', '4H', '1D'].map(tf => (
                  <button key={tf} onClick={() => setChartTf(tf)}
                    className={`text-[10px] px-2 py-1 rounded font-mono border transition-all ${chartTf === tf ? 'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/30' : 'border-slate-800 text-slate-500'}`}>
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
            <span className="text-2xl font-mono font-bold text-white">${ASSET_PRICES[chartAsset].base.toLocaleString()}</span>
            <Badge color="emerald">+2.14%</Badge>
            <span className="text-xs text-slate-500 font-mono">{ASSET_PRICES[chartAsset].fullName}</span>
          </div>
          <MiniChart assetCode={chartAsset} showGolden={showGoldSpiral} showFibo={showFibo} />
        </Card>

        {/* Bot detail panel */}
        <Card gold className="space-y-3">
          <div className="flex items-center gap-2">
            {React.createElement(selBot.icon, { className: 'w-5 h-5 text-[#D4AF37]' })}
            <span className="font-semibold text-sm text-slate-100 flex-1">{selBot.name}</span>
            <TierBadge tier={selBot.tier} />
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">{selBot.description}</p>
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="PnL"      value={`${selBot.pnl >= 0 ? '+' : ''}$${selBot.pnl.toLocaleString()}`} color={selBot.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
            <StatBox label="Win Rate" value={selBot.winRate}  color="text-amber-400" />
            <StatBox label="Sharpe"   value={selBot.sharpe}   color="text-blue-400" />
            <StatBox label="Drawdown" value={selBot.drawdown} color="text-orange-400" />
            <StatBox label="Trades"   value={selBot.trades} />
            <StatBox label="Speed"    value={selBot.speed}    color="text-purple-400" />
          </div>
          <div className="flex flex-wrap gap-2">
            <RiskBadge risk={selBot.risk} />
            <Badge color="slate">{selBot.efficiency} eff.</Badge>
          </div>
          {canAccessBot(selBot.id) ? (
            <button onClick={() => toggleBot(selBot.id)}
              className={`w-full py-2 rounded-lg text-xs font-mono font-bold border transition-all ${selBot.active ? 'border-rose-500/40 text-rose-400 bg-rose-950/20' : 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'}`}>
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

      {/* Live feed */}
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
