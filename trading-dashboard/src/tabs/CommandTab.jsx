import { ASSET_PRICES } from '../constants';
import Card from '../components/Card';

export default function CommandTab({
  tradeAsset, setTrAsset, tradeSide, setSide, orderType, setOT,
  tradeAmt, setTrAmt, markupPct, broker, connected, handleTrade, transactions,
}) {
  const lotValue = (parseFloat(tradeAmt) || 0) * ASSET_PRICES[tradeAsset].base;
  const markup   = (lotValue * markupPct / 100).toFixed(2);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Order form */}
        <Card gold>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">Manual Order Placement</p>
          <form onSubmit={handleTrade} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 font-mono mb-1 block">Asset</label>
              <div className="flex gap-2">
                {Object.keys(ASSET_PRICES).map(a => (
                  <button key={a} type="button" onClick={() => setTrAsset(a)}
                    className={`flex-1 py-2 rounded border text-xs font-mono transition-all ${tradeAsset === a ? 'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/30' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono mb-1 block">Direction</label>
              <div className="flex gap-2">
                {['BUY', 'SELL'].map(s => (
                  <button key={s} type="button" onClick={() => setSide(s)}
                    className={`flex-1 py-2.5 rounded border text-xs font-mono font-bold transition-all ${tradeSide === s
                      ? s === 'BUY'
                        ? 'border-emerald-500/60 text-emerald-400 bg-emerald-950/30'
                        : 'border-rose-500/60 text-rose-400 bg-rose-950/30'
                      : 'border-slate-700 text-slate-500'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono mb-1 block">Order Type</label>
              <div className="flex gap-2">
                {['MARKET', 'LIMIT', 'STOP'].map(t => (
                  <button key={t} type="button" onClick={() => setOT(t)}
                    className={`flex-1 py-1.5 rounded border text-[10px] font-mono transition-all ${orderType === t ? 'border-[#D4AF37]/40 text-[#D4AF37] bg-amber-950/20' : 'border-slate-700 text-slate-500'}`}>
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
                <span>Price</span>
                <span className="text-white">${ASSET_PRICES[tradeAsset].base.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Markup ({markupPct.toFixed(2)}%)</span>
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

        {/* Execution history */}
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
                  <span>{tx.amount}@${tx.price}</span>
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
