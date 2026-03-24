"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShieldCheck, MapPin, Activity, ArrowLeft, Beaker, FileText, Truck, AlertTriangle, Droplets, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the standard forensic journey
const TRANSIT_STEPS = [
  { id: "Quality Certified", label: "Source Facility", desc: "Mill Gate Verification" },
  { id: "In Transit - Sealed", label: "Transit Security", desc: "Sealing & GPS Activation" },
  { id: "Delivered - Awaiting Audit", label: "Audit Checkpoint", desc: "Forensic Density Scan" },
  { id: "Audit Verified", label: "Final Off-Take", desc: "Handover Complete" }
];

export default function BranForensicReport({ params }: { params: Promise<{ id: string }> }) {
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
      <p className="text-cyan-700 text-[10px] uppercase tracking-[0.3em] animate-pulse font-black">Decrypting Ledger...</p>
    </div>
  );

  if (!batch) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-gray-500 p-6">
      <AlertTriangle className="w-16 h-16 text-red-900 mb-4" />
      <h1 className="text-xl uppercase tracking-widest text-white mb-2 font-black">Audit Failed</h1>
      <Link href="/" className="mt-8 text-cyan-600 border border-cyan-900 px-6 py-2 rounded-full uppercase text-[10px] tracking-widest">Return to Terminal</Link>
    </div>
  );

  // Helper to determine step index
  const currentStepIndex = TRANSIT_STEPS.findIndex(s => s.id === batch.status);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <Link href="/" className="inline-flex items-center gap-2 text-cyan-800 hover:text-cyan-400 mb-10 transition-colors text-[10px] tracking-[0.2em] uppercase font-black">
        <ArrowLeft className="w-3 h-3" /> System Terminal
      </Link>

      <header className="mb-12 border-b border-gray-900 pb-10 relative">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-5 h-5 text-cyan-500" />
          <span className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-black">SeireiYoki Forensic Protocol</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 italic uppercase">{batch.product_name}</h1>
        <p className="text-2xl text-cyan-600 tracking-tighter font-black">BATCH // {batch.batch_number}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Quality Metrics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0c0c0c] border border-gray-800 p-8 rounded-2xl">
            <h3 className="text-white text-xs tracking-[0.2em] uppercase mb-8 flex items-center gap-3 border-b border-gray-900 pb-4 font-black italic">Nutritional Specs</h3>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Protein</span>
                  <span className="text-white font-black">{batch.protein_percent}%</span>
                </div>
                <div className="bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full shadow-[0_0_15px_rgba(6,182,212,0.6)]" style={{ width: `${(batch.protein_percent / 20) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Moisture</span>
                  <span className="text-emerald-500 font-black">{batch.moisture_percent}%</span>
                </div>
                <div className="bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full shadow-[0_0_15px_rgba(16,185,129,0.4)]" style={{ width: `${batch.moisture_percent * 5}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Audit Trail */}
        <div className="lg:col-span-2">
          <div className="bg-[#0c0c0c] border border-gray-800 p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
            <h3 className="text-white text-xs tracking-[0.3em] uppercase mb-12 flex items-center gap-4 font-black italic">
               <Truck className="w-5 h-5 text-cyan-500" /> Forensic Chain of Custody
            </h3>

            <div className="space-y-12">
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
                        {isCurrent ? batch.current_location : step.desc}
                      </h4>
                    </div>

                    {isCurrent && (
                      <div className="bg-emerald-950/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded border border-emerald-900/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        ACTIVE NODE
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}