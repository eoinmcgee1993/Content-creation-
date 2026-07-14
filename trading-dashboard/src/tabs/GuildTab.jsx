import Card from '../components/Card';
import StatBox from '../components/StatBox';
import Badge from '../components/Badge';
import TierBadge from '../components/TierBadge';

export default function GuildTab({ guildUsers, mrr }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Total Members" value={guildUsers.length}                                                              color="text-blue-400" />
        <StatBox label="Active Now"    value={guildUsers.filter(u => u.active).length}                                        color="text-emerald-400" />
        <StatBox label="Total AUM"     value={`$${guildUsers.reduce((a, u) => a + u.balance, 0).toLocaleString()}`}           color="text-[#D4AF37]" />
        <StatBox label="MRR"           value={`$${mrr}`}                                                                      color="text-amber-400" delta={12.4} />
      </div>

      <Card gold>
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-4">Guild Member Registry</p>
        <div className="space-y-3">
          {guildUsers.map(user => (
            <div key={user.id} className={`rounded-xl border p-4 ${user.active ? 'border-[#D4AF37]/20 bg-amber-950/10' : 'border-slate-800/50 bg-slate-900/20'}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`w-2 h-2 rounded-full shrink-0 ${user.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-sm font-semibold text-slate-100">{user.alias}</span>
                <TierBadge tier={user.tier} />
                <Badge color={user.active ? 'emerald' : 'slate'}>{user.active ? 'ACTIVE' : 'OFFLINE'}</Badge>
                <span className="text-[10px] text-slate-500 font-mono ml-auto">{user.platform}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                {[
                  ['Balance',    `$${user.balance.toLocaleString()}`,      'text-white'],
                  ['Copying',    user.botCopied,                            'text-[#D4AF37]'],
                  ['Volume',     `$${user.totalVolume.toLocaleString()}`,   'text-slate-200'],
                  ['Commission', `$${user.commissionPaid.toLocaleString()}`, 'text-emerald-400'],
                ].map(([l, v, c]) => (
                  <div key={l}>
                    <p className="text-[9px] text-slate-500 uppercase font-mono">{l}</p>
                    <p className={`text-sm font-mono font-bold ${c}`}>{v}</p>
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
