import { Terminal } from 'lucide-react';
import Card from '../components/Card';
import StatBox from '../components/StatBox';
import Badge from '../components/Badge';
import RiskBadge from '../components/RiskBadge';
import TierBadge from '../components/TierBadge';

const STATUS_COLOR = { RUNNING: 'text-emerald-400', PAUSED: 'text-amber-400', OFFLINE: 'text-rose-400' };

export default function VpsTab({
  vpsStatus, setVpsStatus, vpsPing, vpsCpu, vpsRam, daemon,
  bots, canAccessBot, toggleBot, setCheckoutTier,
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card gold className="col-span-2 lg:col-span-1">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono mb-1">Server Status</p>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${vpsStatus === 'RUNNING' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className={`text-xl font-bold font-mono ${STATUS_COLOR[vpsStatus]}`}>{vpsStatus}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">EU-WEST-1 — London</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setVpsStatus('RUNNING')} className="flex-1 py-1 text-[10px] font-mono border border-emerald-500/40 text-emerald-400 rounded hover:bg-emerald-950/20 transition-all">▶ Run</button>
            <button onClick={() => setVpsStatus('PAUSED')}  className="flex-1 py-1 text-[10px] font-mono border border-amber-500/40  text-amber-400  rounded hover:bg-amber-950/20  transition-all">⏸ Pause</button>
          </div>
        </Card>
        <StatBox label="Ping Latency"    value={`${vpsPing}ms`}  color="text-emerald-400" sub="CEX router avg" />
        <StatBox label="CPU Utilisation" value={`${vpsCpu}%`}    color={vpsCpu > 60 ? 'text-rose-400' : 'text-blue-400'} sub="4-core daemon" />
        <StatBox label="RAM Usage"       value={`${vpsRam} GB`}  color="text-purple-400" sub="of 4 GB allocated" />
      </div>

      {/* Daemon log */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" />Daemon Heartbeat Log
          </span>
          <span className={`w-2 h-2 rounded-full ${vpsStatus === 'RUNNING' ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
        </div>
        <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] max-h-60 overflow-y-auto space-y-1 border border-slate-800">
          {daemon.length === 0
            ? <p className="text-slate-600">Awaiting daemon events…</p>
            : daemon.map((line, i) => <p key={i} className={i === 0 ? 'text-emerald-400' : 'text-slate-500'}>{line}</p>)}
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
                <Icon className={`w-4 h-4 shrink-0 ${bot.active && canAccessBot(bot.id) ? 'text-[#D4AF37]' : 'text-slate-600'}`} />
                <span className="text-xs text-slate-200 flex-1 min-w-[120px]">{bot.name}</span>
                <TierBadge tier={bot.tier} />
                <RiskBadge risk={bot.risk} />
                <Badge color="slate">{bot.speed}</Badge>
                <button
                  onClick={() => canAccessBot(bot.id) ? toggleBot(bot.id) : setCheckoutTier(bot.tier)}
                  className={`text-[10px] px-2.5 py-1 rounded border font-mono transition-all ${
                    canAccessBot(bot.id) && bot.active
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                      : canAccessBot(bot.id)
                        ? 'border-slate-700 text-slate-500'
                        : 'border-purple-500/30 text-purple-400'}`}>
                  {canAccessBot(bot.id) ? (bot.active ? 'LIVE' : 'IDLE') : 'LOCKED'}
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
