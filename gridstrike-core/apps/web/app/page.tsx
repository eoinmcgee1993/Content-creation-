"use client";

import React, { useState } from "react";

const PLAYBOOK = [
  {
    id: "GS-01",
    title: "Perimeter Mapping",
    phase: "RECON",
    desc: "Passive terminal scans identify infrastructure layouts cleanly without triggering intrusion logs.",
  },
  {
    id: "GS-02",
    title: "Vector Isolation",
    phase: "CONTAIN",
    desc: "Corrals threat actors instantly into dead-end execution loops at the hardware layer.",
  },
  {
    id: "GS-03",
    title: "Countermeasure Execution",
    phase: "STRIKE",
    desc: "Deploys targeted, off-grid defenses to actively suppress active vector channels.",
  },
  {
    id: "GS-04",
    title: "Absolute Opacity",
    phase: "SECURE",
    desc: "Establishes continuous loop processing for complete defensive network security.",
  },
];

function OperatorHero() {
  return (
    <section className="relative min-h-[90vh] w-full flex items-center pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-[#13161A] border border-[#232830] px-3 py-1.5 rounded-sm">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
            <span className="font-mono text-xs tracking-widest text-[#FF6B00] uppercase">
              SYSTEM_STATE: ASYMMETRIC_ENGAGED
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-[0.9] text-white">
            GRIDSTRIKE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#98A2B3] to-[#475467]">
              OPERATIONS.
            </span>
          </h1>

          <p className="font-mono text-xs md:text-sm text-[#98A2B3] max-w-xl leading-relaxed">
            [DEPLOYMENT PROTOCOL] Autonomous network boundary fortification.
            Replicating legacy software defenses into isolated, hardware-level
            container stacks. Zero footprints. Total infrastructure sovereignty.
          </p>

          <div className="pt-4">
            <a
              href="#deploy"
              className="inline-block bg-[#FF6B00] text-black font-mono font-bold tracking-wider text-xs uppercase px-8 py-4 hover:bg-white transition-colors"
            >
              INITIALIZE PLATFORM DEPLOYMENT
            </a>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="w-full aspect-[4/5] bg-gradient-to-b from-[#13161A] to-[#0B0C0E] border border-[#232830] relative overflow-hidden flex items-center justify-center">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#FF6B00]/40 animate-scan" />
            <div className="text-center p-6 space-y-2">
              <div className="w-12 h-12 border border-dashed border-[#FF6B00]/40 rounded-full flex items-center justify-center mx-auto mb-2 animate-spin">
                <span className="text-[#FF6B00] text-xs font-mono">✦</span>
              </div>
              <p className="font-mono text-xs text-[#475467] uppercase tracking-widest">
                [ FIELD_OPERATOR_FEED ]
              </p>
              <p className="font-mono text-[10px] text-[#232830]">
                SRC: TACTICAL_SUIT_ALPHA_CHANNEL_V2
              </p>
            </div>
            <div className="absolute bottom-3 left-4 font-mono text-[9px] text-[#475467]">
              SYS_LOC // 18.7883° N | 98.9853° E
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PipelineGrid() {
  return (
    <section className="py-20 px-6 border-t border-[#1C1F24] bg-[#0E1013]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-12 border-l-4 border-[#FF6B00] pl-6">
          <span className="font-mono text-xs text-[#98A2B3] block">
            // PLAYBOOK AUTOMATION
          </span>
          <h2 className="text-3xl font-black uppercase text-white tracking-tight">
            CORE PIPELINE
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLAYBOOK.map((step) => (
            <div
              key={step.id}
              className="bg-[#13161A] border border-[#232830] p-6 flex flex-col justify-between hover:border-[#FF6B00]/40 transition-all group"
            >
              <span className="font-mono text-[10px] text-[#475467] block text-right">
                NODE // {step.phase}
              </span>
              <div className="font-mono text-2xl font-black text-[#232830] group-hover:text-[#FF6B00]/10 my-4 transition-colors">
                {step.id}
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase text-white mb-2">
                  {step.title}
                </h3>
                <p className="font-mono text-xs text-[#98A2B3] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActionStrip() {
  const [loading, setLoading] = useState(false);

  const triggerDeploymentPurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Pipeline error: Check server logs.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <section
      id="deploy"
      className="py-24 px-6 border-t border-[#1C1F24] bg-[#0B0C0E] flex items-center justify-center relative"
    >
      <div className="max-w-3xl w-full bg-[#13161A] border-2 border-[#232830] p-8 md:p-12 text-center space-y-6 relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#FF6B00] text-black font-mono text-[10px] font-black px-4 py-1 tracking-widest uppercase">
          COMMERCIAL_DIRECTIVE
        </div>

        <h2 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tight">
          ACQUIRE LICENSE
        </h2>

        <p className="font-mono text-xs text-[#98A2B3] max-w-lg mx-auto leading-relaxed">
          Unlock full operational access to the GRIDSTRIKE software node
          console. Instant multi-region deployment. Fixed annual utility routing
          fees.
        </p>

        <div className="pt-4">
          <button
            onClick={triggerDeploymentPurchase}
            disabled={loading}
            className="w-full md:w-auto bg-[#FF6B00] text-black font-mono font-bold tracking-widest text-xs uppercase px-12 py-5 transition-transform active:scale-95 disabled:opacity-50 hover:bg-white"
          >
            {loading
              ? "INITIALIZING SECURE GATEWAY..."
              : "AUTHORIZE NODE DEPLOYMENT — $2,400/YR"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function GridStrikeProductionPage() {
  return (
    <>
      <OperatorHero />
      <PipelineGrid />
      <ActionStrip />
    </>
  );
}
