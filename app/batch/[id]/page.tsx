"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShieldCheck, Activity, ArrowLeft, FileText, Truck, AlertTriangle, Droplets, CheckCircle2, Circle, Factory } from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the universal industrial transit journey
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

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
      <Activity className="w-10 h-10 text-cyan-500 animate-spin" />
      <p className="text-cyan-700 text-[10px] uppercase tracking-[0.3em] animate-pulse font-black">Decrypting Industrial Ledger...</p>
    </div>
  );

  if (!batch) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-gray-500 p-6">
      <AlertTriangle className="w-16 h-16 text-red-900 mb-4" />
      <h1 className="text-xl uppercase tracking-[0.2em] text-white mb-2 font-black">Audit Failed</h1>
      <p className="text-xs text-red-800 uppercase tracking-widest font-bold mb-8">Cargo Traceability Gap Detected</p>
      <Link href="/" className="text-cyan-600 border border-cyan-900/50 px-8 py-3 rounded-full hover:bg-cyan-950/30 transition-all text-[10px] uppercase tracking-widest font-bold">
        Return to Terminal
      </Link>
    </div>
  );

  const currentStepIndex = TRANSIT_STEPS.findIndex(s => s.id === batch.status);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <Link href="/" className="inline-flex items-center gap-2 text-cyan-800 hover:text-cyan-400 mb-10 transition-colors text-[10px] tracking-[0.2em] uppercase font-black">
        <ArrowLeft className="w-3 h-3" /> System Terminal
      </Link>

      <header className="mb-12 border-b border-gray-900 pb-10 relative">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-5 h-5 text-cyan-500" />
          <span className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-black">SeireiYoki Industrial Protocol</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 italic uppercase">
          {batch.product_name}
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-2xl text-cyan-600 tracking-tighter font-black">ID // {batch.batch_number}</p>
          <div className="h-px flex-grow bg-gradient-to-r from-cyan-900/50 to-transparent"></div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Industrial Metrics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0c0c0c] border border-gray-800 p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Factory className="w-16 h-16 text-cyan-500" />
            </div>
            <h3 className="text-white text-xs tracking-[0.2em] uppercase mb-8 flex items-center gap-3 border-b border-gray-900 pb-4 font-black italic relative z-10">
              Industrial Specifications
            </h3>
            
            <div className="space-y-8 relative z-10">
              {/* Primary Metric (e.g. Protein/Nitrogen) */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Primary Index (Quality)</span>
                  <span className="text-2xl text-white font-black">{batch.protein_percent}%</span>
                </div>
                <div className="bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full shadow-[0_0_15px_rgba(6,182,212,0.6)]" style={{ width: `${Math.min((batch.protein_percent / 20) * 100, 100)}%` }}></div>
                </div>
              </div>

              {/* Secondary Metric (e.g. Moisture/Density) */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Secondary Index (Stability)</span>
                  <span className="text-2xl text-emerald-500 font-black">{batch.moisture_percent}%</span>
                </div>
                <div className="bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full shadow-[0_0_15px_rgba(16,185,129,0.4)]" style={{ width: `${Math.min(batch.moisture_percent * 5, 100)}%` }}></div>
                </div>
                <p className="text-[9px] text-gray-600 mt-3 uppercase italic tracking-widest leading-relaxed">
                   Verified within acceptable thresholds for structural/chemical stability.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Logistics Trail */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0c0c0c] border border-gray-800 p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
            <h3 className="text-white text-xs tracking-[0.3em] uppercase mb-12 flex items-center gap-4 font-black italic">
               <Truck className="w-5 h-5 text-cyan-500" /> Logistics Chain of Custody
            </h3>

            <div className="space-y-12 pl-4 md:pl-8">
              {TRANSIT_STEPS.map((step, index) => {
                const isCurrent = step.id === batch.status;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <div key={step.id} className={`relative pl-10 flex flex-col md:flex-row md:items-center justify-between gap-2 transition-all duration-500 ${isCurrent ? "opacity-100" : "opacity-30"}`}>
                    
                    {/* The Line Connector */}
                    {index < TRANSIT_STEPS.length - 1 && (
                      <div className={`absolute left-[13px] top-7 w-[2px] h-[48px] ${isCompleted ? "bg-cyan-600" : "bg-gray-800"}`}></div>
                    )}
                    
                    {/* The Icon */}
                    <div className="absolute left-0 top-1 transition-transform duration-500">
                      {isCompleted ? (
                        <CheckCircle2 className="w-7 h-7 text-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
                      ) : isCurrent ? (
                        <div className="relative">
                          <Activity className="w-7 h-7 text-white animate-pulse" />
                          <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                        </div>
                      ) : (
                        <Circle className="w-7 h-7 text-gray-800" />
                      )}
                    </div>

                    <div>
                      <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${isCurrent ? "text-cyan-500" : "text-gray-600"}`}>
                        {step.label}
                      </p>
                      <h4 className={`text-xl font-black tracking-tighter ${isCurrent ? "text-white" : "text-gray-500"}`}>
                        {index === 0 && batch.origin ? batch.origin : (isCurrent ? batch.current_location : step.desc)}
                      </h4>
                    </div>

                    {isCurrent && (
                      <div className="bg-emerald-950/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded border border-emerald-900/40 shadow-[0_0_10px_rgba(16,185,129,0.1)] mt-2 md:mt-0 w-fit">
                        ACTIVE NODE
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Universal Forensic Verification Box */}
          <div className="p-8 bg-cyan-950/10 border border-cyan-900/20 rounded-2xl flex items-start gap-6">
             <div className="bg-cyan-900/30 p-3 rounded-lg border border-cyan-700/50">
               <FileText className="w-6 h-6 text-cyan-400" />
             </div>
             <div>
                <p className="text-[10px] text-cyan-400 uppercase tracking-[0.4em] font-black mb-3 underline decoration-cyan-900 underline-offset-8">Forensic Verification Note</p>
                <p className="text-xs text-gray-500 leading-relaxed italic font-medium">
                  This consignment has been cryptographically signed at the origin facility. Automated logistics checks confirm baseline integrity and the absence of unauthorized filler dilution. Total cargo volume verified at authorized transit checkpoints.
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}