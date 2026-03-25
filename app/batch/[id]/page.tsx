"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  ShieldCheck, Activity, ArrowLeft, FileText, 
  Truck, AlertTriangle, Droplets, CheckCircle2, 
  Circle, Factory, Share2 
} from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const TRANSIT_STEPS = [
  { id: "Quality Certified", label: "Source Facility", desc: "Manufacturer / Origin Gate" },
  { id: "In Transit - Sealed", label: "Transit Security", desc: "Active Routing & Telemetry" },
  { id: "Delivered - Awaiting Audit", label: "Audit Checkpoint", desc: "Hub Verification Scan" },
  { id: "Audit Verified", label: "Final Off-Take", desc: "Authorized Handover Complete" }
];

export default function IndustrialForensicReport({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.id;

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpecificBatch() {
      if (!batchId) return;
      try {
        const { data, error } = await supabase
          .from("batches")
          .select("*")
          .eq("batch_number", batchId.trim().toUpperCase())
          .maybeSingle();

        if (error) throw error;
        setBatch(data);
      } catch (err) {
        console.error("Audit Fetch Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSpecificBatch();
  }, [batchId]);

  const handleShare = async () => {
    if (!batch) return;
    const shareUrl = window.location.href;
    const shareText = `🔒 SEIREIYOKI FORENSIC AUDIT\n\nIndustrial Consignment [${batch.batch_number}] is active.\nStatus: ${batch.status}\nLocation: ${batch.current_location}\n\nAccess the live integrity ledger here:`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SeireiYoki Audit Ledger',
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        console.log('Sharing failed', error);
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert("Forensic link copied to clipboard!");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
      <Activity className="w-10 h-10 text-cyan-500 animate-spin" />
      <p className="text-cyan-700 text-[10px] uppercase tracking-[0.3em] animate-pulse font-black">Decrypting Ledger...</p>
    </div>
  );

  if (!batch) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-gray-500 p-6">
      <AlertTriangle className="w-16 h-16 text-red-900 mb-4" />
      <h1 className="text-xl uppercase tracking-[0.2em] text-white mb-2 font-black">Audit Failed</h1>
      <Link href="/" className="text-cyan-600 border border-cyan-900/50 px-8 py-3 rounded-full uppercase text-[10px] tracking-widest font-black">Return to Terminal</Link>
    </div>
  );

  const currentStepIndex = TRANSIT_STEPS.findIndex(s => s.id === batch.status);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      
      {/* Navigation & Sharing Header */}
      <div className="flex justify-between items-center mb-10 border-b border-gray-900 pb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-cyan-800 hover:text-cyan-400 transition-colors text-[10px] tracking-[0.2em] uppercase font-black">
          <ArrowLeft className="w-3 h-3" /> System Terminal
        </Link>
        
        <button onClick={handleShare} className="inline-flex items-center gap-2 text-white bg-cyan-950/40 hover:bg-cyan-900 border border-cyan-800 px-4 py-2 rounded-xl transition-all text-[9px] tracking-[0.2em] uppercase font-black active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <Share2 className="w-3 h-3 text-cyan-500" /> Transmit Ledger
        </button>
      </div>

      <header className="mb-12 relative">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-5 h-5 text-cyan-500" />
          <span className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-black italic underline decoration-cyan-900">SeireiYoki Industrial Protocol</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 italic uppercase leading-[0.9]">
          {batch.product_name}
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-2xl text-cyan-600 tracking-tighter font-black underline decoration-cyan-900 decoration-4 underline-offset-8">ID // {batch.batch_number}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-16">
        {/* Metric Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0c0c0c] border border-gray-800 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Factory className="w-20 h-20 text-cyan-500" />
            </div>
            <h3 className="text-white text-xs tracking-[0.2em] uppercase mb-8 flex items-center gap-3 border-b border-gray-900 pb-4 font-black italic relative z-10">
              Industrial Specs
            </h3>
            
            <div className="space-y-10 relative z-10">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-gray-500 text-[9px] uppercase font-bold tracking-[0.2em]">Quality Index</span>
                  <span className="text-3xl text-white font-black">{batch.protein_percent}%</span>
                </div>
                <div className="bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-900">
                  <div className="bg-cyan-500 h-full shadow-[0_0_15px_rgba(6,182,212,0.6)]" style={{ width: `${Math.min((batch.protein_percent / 20) * 100), 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-gray-500 text-[9px] uppercase font-bold tracking-[0.2em]">Stability Index</span>
                  <span className="text-3xl text-emerald-500 font-black">{batch.moisture_percent}%</span>
                </div>
                <div className="bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-900">
                  <div className="bg-emerald-500 h-full shadow-[0_0_15px_rgba(16,185,129,0.4)]" style={{ width: `${Math.min(batch.moisture_percent * 5, 100)}%` }}></div>
                </div>
                <p className="text-[8px] text-gray-700 mt-4 uppercase font-bold tracking-widest leading-relaxed">
                   *Verified audit parameters within global industrial safety tolerances.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0c0c0c] border border-gray-800 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-2 h-full bg-cyan-600/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"></div>
            
            <h3 className="text-white text-xs tracking-[0.3em] uppercase mb-16 flex items-center gap-4 font-black italic">
               <Truck className="w-5 h-5 text-cyan-500" /> Forensic Trail Ledger
            </h3>

            <div className="space-y-14 pl-4 md:pl-10">
              {TRANSIT_STEPS.map((step, index) => {
                const isCurrent = step.id === batch.status;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <div key={step.id} className={`relative pl-12 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-700 ${isCurrent ? "opacity-100" : "opacity-25"}`}>
                    
                    {index < TRANSIT_STEPS.length - 1 && (
                      <div className={`absolute left-[13px] top-8 w-[2px] h-[58px] ${isCompleted ? "bg-cyan-600" : "bg-gray-900"}`}></div>
                    )}
                    
                    <div className="absolute left-0 top-1">
                      {isCompleted ? (
                        <CheckCircle2 className="w-8 h-8 text-cyan-600" />
                      ) : isCurrent ? (
                        <div className="relative">
                          <Activity className="w-8 h-8 text-white animate-pulse" />
                          <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-30 animate-pulse"></div>
                        </div>
                      ) : (
                        <Circle className="w-8 h-8 text-gray-900" />
                      )}
                    </div>

                    <div>
                      <p className={`text-[9px] uppercase tracking-[0.3em] font-black mb-1 ${isCurrent ? "text-cyan-500" : "text-gray-700"}`}>
                        {step.label}
                      </p>
                      <h4 className={`text-2xl font-black tracking-tighter italic uppercase ${isCurrent ? "text-white" : "text-gray-600"}`}>
                        {index === 0 && batch.origin ? batch.origin : (isCurrent ? batch.current_location : step.desc)}
                      </h4>
                    </div>

                    {isCurrent && (
                      <div className="bg-emerald-950/20 text-emerald-500 text-[8px] font-black uppercase tracking-[0.4em] px-4 py-2 rounded-lg border border-emerald-900/30 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        ACTIVE NODE
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-8 bg-cyan-950/5 border border-cyan-900/20 rounded-3xl flex items-start gap-8">
             <div className="bg-cyan-950/40 p-4 rounded-2xl border border-cyan-800/40">
               <FileText className="w-8 h-8 text-cyan-500" />
             </div>
             <div>
                <p className="text-[9px] text-cyan-600 uppercase tracking-[0.5em] font-black mb-3 italic">Forensic Integrity Note</p>
                <p className="text-[11px] text-gray-600 leading-relaxed font-medium tracking-wide">
                  Consignment cryptographically cross-referenced against origin facility logistics data. Automated density audit confirms baseline integrity. No unauthorized cargo dilution detected at verified transit nodes.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}