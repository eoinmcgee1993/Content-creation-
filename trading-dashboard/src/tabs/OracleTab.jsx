import { Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';

const PROMPT_SUGGESTIONS = [
  'Optimise monetisation fees',
  'Analyse churn risk',
  'Top affiliate performance',
  'Best tier upsell strategy',
];

export default function OracleTab({ aiLog, aiThink, aiPrompt, setAiPrompt, handleOracle, aiRef }) {
  return (
    <div className="space-y-5">
      <Card gold className="flex flex-col" style={{ height: 520 }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-sm font-semibold text-slate-100">Virtuoso Neural Oracle v6.1</span>
          <Badge color="amber">Revenue AI</Badge>
        </div>

        <div ref={aiRef} className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
          {aiLog.map((msg, i) => (
            <div key={i} className={`rounded-xl p-3 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-slate-800/60 text-slate-200 ml-8'
                : msg.role === 'system'
                  ? 'bg-slate-900/60 text-slate-500 border border-slate-800 text-[10px] font-mono'
                  : 'bg-amber-950/20 border border-[#D4AF37]/20 text-slate-200 mr-8'}`}>
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
              <span className="text-slate-400 text-xs">Analysing monetization parameters</span>
              <span className="inline-flex gap-1 ml-2">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleOracle} className="flex gap-2">
          <input
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="Ask about revenue, churn, affiliates, tier strategy…"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-xs font-mono text-slate-200 outline-none focus:border-[#D4AF37]/50"
          />
          <button type="submit" disabled={aiThink}
            className="px-4 py-2 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] bg-amber-950/20 hover:bg-amber-950/40 transition-all disabled:opacity-40">
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PROMPT_SUGGESTIONS.map(prompt => (
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
