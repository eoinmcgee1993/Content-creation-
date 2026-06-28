import React from "react";

const STEPS = [
  {
    num: "01",
    title: "Request Access",
    desc: "Submit your operator profile through our secure intake pipeline. No civilian credentials accepted.",
  },
  {
    num: "02",
    title: "License Provisioning",
    desc: "Upon authorization, a hardware-keyed license token is issued to your operational node.",
  },
  {
    num: "03",
    title: "Environment Bootstrap",
    desc: "Deploy the container stack into your isolated environment. Air-gapped or hybrid configurations supported.",
  },
  {
    num: "04",
    title: "Continuous Strike Loop",
    desc: "Automated perimeter scans run at defined intervals. Threats are isolated and suppressed without human delay.",
  },
];

export default function HowItWorksPage() {
  return (
    <section className="min-h-screen pt-24 pb-20 px-6 bg-[#0B0C0E]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16 border-l-4 border-[#FF6B00] pl-6">
          <span className="font-mono text-xs text-[#98A2B3] block">
            // OPERATIONAL WALKTHROUGH
          </span>
          <h1 className="text-4xl font-black uppercase text-white tracking-tight">
            HOW IT WORKS
          </h1>
        </div>

        <div className="space-y-px">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="flex gap-8 bg-[#13161A] border border-[#232830] p-8 hover:border-[#FF6B00]/30 transition-colors group"
            >
              <div className="font-mono text-4xl font-black text-[#232830] group-hover:text-[#FF6B00]/20 transition-colors w-16 shrink-0 pt-1">
                {step.num}
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-white mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="font-mono text-xs text-[#98A2B3] leading-relaxed max-w-xl">
                  {step.desc}
                </p>
              </div>
              <div className="ml-auto font-mono text-[10px] text-[#475467] self-start shrink-0">
                PHASE_{String(i + 1).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/#deploy"
            className="inline-block bg-[#FF6B00] text-black font-mono font-bold tracking-wider text-xs uppercase px-10 py-4 hover:bg-white transition-colors"
          >
            PROCEED TO ACQUISITION
          </a>
        </div>
      </div>
    </section>
  );
}
