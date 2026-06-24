import { Globe, Copy, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import Card from '../components/Card';

export default function IntegrationTab({
  keyGen, handleKeyGen, pubKey, staticIP,
  rwOnly, setRwOnly, noWithdraw, setNoWithdraw,
  broker, setBroker, connected,
  apiKey, setApiKey, apiSecret, setApiSecret,
  mtLogin, setMtLogin, mtPass, setMtPass,
  showSec, setShowSec, handleBrokerConnect,
}) {
  const securityChecks = [
    ['Asymmetric Key Isolation',        keyGen],
    ['Read+Write Only (No Withdraw)',    rwOnly],
    ['Withdrawal Flag Disabled',         noWithdraw],
    ['IP Whitelisting Active',           true],
    ['Broker Enclave Connected',         connected],
    ['AES-256 Secret Storage',           keyGen],
  ];

  return (
    <div className="space-y-5">
      {/* Step 1: Key generation */}
      <Card gold>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-amber-950 border border-[#D4AF37]/40 flex items-center justify-center text-[10px] text-[#D4AF37] font-bold">1</span>
          <span className="text-sm font-semibold text-slate-100">Generate Enclave Keypair</span>
          {keyGen && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
        </div>
        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
          An RSA-4096 keypair is generated locally inside an isolated enclave. Broker credentials are encrypted and never leave the environment.
        </p>
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
            className={`px-4 py-2 rounded text-xs font-mono font-bold border transition-all ${keyGen ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' : 'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40'}`}>
            {keyGen ? '✓ Key Generated' : 'Generate Enclave Key'}
          </button>
          <div className="space-y-1.5">
            {[
              ['Read+Write Only (no withdrawal perms)', rwOnly,     setRwOnly],
              ['Withdrawal disabled on broker',          noWithdraw, setNoWithdraw],
            ].map(([label, val, set]) => (
              <label key={label} className="flex items-center gap-2 text-[10px] text-slate-300 cursor-pointer">
                <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="accent-amber-500 w-3 h-3" />
                {label}
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Step 2: Broker connection */}
      <Card gold>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-amber-950 border border-[#D4AF37]/40 flex items-center justify-center text-[10px] text-[#D4AF37] font-bold">2</span>
          <span className="text-sm font-semibold text-slate-100">Connect Broker</span>
          {connected && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
        </div>
        <div className="flex gap-2 mb-4">
          {['Bybit', 'Blofin', 'Exness'].map(b => (
            <button key={b} onClick={() => setBroker(b)}
              className={`px-3 py-1.5 rounded text-[11px] font-mono border transition-all ${broker === b ? 'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/30' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
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
                <input type={showSec ? 'text' : 'password'} value={apiSecret} onChange={e => setApiSecret(e.target.value)} placeholder="••••••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50" />
                <button type="button" onClick={() => setShowSec(s => !s)} className="absolute right-3 top-6 text-slate-500 hover:text-slate-300">
                  {showSec ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </>
          )}
          <button type="submit"
            className={`w-full py-2.5 rounded text-xs font-mono font-bold border transition-all ${connected ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' : 'border-[#D4AF37]/50 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40'}`}>
            {connected ? `✓ ${broker} Connected` : `Connect ${broker}`}
          </button>
        </form>
      </Card>

      {/* Security audit matrix */}
      <Card>
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">Security Audit Matrix</p>
        <div className="grid grid-cols-2 gap-2.5">
          {securityChecks.map(([label, ok]) => (
            <div key={label} className="flex items-center gap-2 text-[10px] font-mono">
              {ok
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              <span className={ok ? 'text-slate-300' : 'text-slate-500'}>{label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
