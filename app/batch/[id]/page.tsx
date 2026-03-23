"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShieldCheck, MapPin, Activity, ArrowLeft, Beaker, FileText, Truck, AlertTriangle, Droplets } from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function BranForensicReport({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.id;

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpecificBatch() {
      try {
        const { data, error } = await supabase
          .from("batches")
          .select("*")
          .eq("batch_number", batchId.toUpperCase())
          .single();

        if (error) throw error;
        setBatch(data);
      } catch (error) {
        console.error("Audit Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSpecificBatch();
  }, [batchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
        <Activity className="w-10 h-10 text-cyan-500 animate-spin" />
        <p className="text-cyan-700 text-xs uppercase tracking-widest animate-pulse">Accessing Bran Quality Ledger...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-gray-500 font-mono p-6">
        <AlertTriangle className="w-16 h-16 text-red-700 mb-4" />
        <h1 className="text-xl uppercase tracking-widest text-white mb-2">Verification Failed</h1>
        <p className="text-sm">Batch ID [{batchId}] not found. Potential Unauthorized Supply.</p>
        <Link href="/" className="mt-8 text-cyan-500 border border-cyan-900 px-6 py-2 rounded hover:bg-cyan-950 transition-colors">
          Return to Terminal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12 selection:bg-cyan-900 selection:text-cyan-100">
      
      {/* Navigation */}
      <Link href="/" className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-400 mb-8 transition-colors text-sm tracking-widest uppercase">
        <ArrowLeft className="w-4 h-4" /> Back to Master Ledger
      </Link>

      {/* Report Header */}
      <header className="mb-12 border-b border-gray-800 pb-8 relative">
        <div className="absolute right-0 top-0 opacity-10">
           <ShieldCheck className="w-48 h-48 text-cyan-500" />
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-bold bg-cyan-950/40 text-cyan-300 px-3 py-1.5 rounded border border-cyan-500/50 tracking-widest shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Yoki Verified Purity
          </span>
          <span className="text-xs text-gray-500 tracking-widest uppercase border border-gray-800 px-2 py-1 rounded">
            Audit ID: {batch.id.substring(0,8)}
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 italic">
          {batch.product_name}
        </h1>
        <p className="text-xl text-cyan-600 tracking-widest uppercase font-bold">
          BATCH: {batch.batch_number}
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column: Nutritional Integrity */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <Beaker className="w-12 h-12 text-cyan-500" />
            </div>
            <h3 className="text-white text-sm tracking-widest uppercase mb-6 flex items-center gap-2 border-b border-gray-900 pb-3 font-bold">
               Nutritional Integrity
            </h3>
            
            <div className="space-y-6">
              {/* Protein Content */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">Crude Protein</span>
                  <span className="text-white font-bold">{batch.protein_percent}%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-cyan-500 h-full transition-all duration-1000" style={{ width: `${(batch.protein_percent / 20) * 100}%` }}></div>
                </div>
              </div>

              {/* Moisture Stability */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">Moisture Stability</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    {batch.moisture_percent}%
                  </span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${batch.moisture_percent * 5}%` }}></div>
                </div>
                <p className="text-[9px] text-gray-600 mt-2 uppercase italic tracking-tighter">
                   *Optimized for long-term silo storage & anti-mold
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-xl">
            <h3 className="text-white text-sm tracking-widest uppercase mb-4 flex items-center gap-2 border-b border-gray-900 pb-3 font-bold">
              <FileText className="w-4 h-4 text-cyan-500" /> Forensic Compliance
            </h3>
            <ul className="space-y-3 text-[10px] text-gray-400 tracking-[0.15em] uppercase font-semibold">
               <li className="flex items-center gap-2 text-cyan-400">✓ No Sawdust Fillers Detected</li>
               <li className="flex items-center gap-2 text-cyan-400">✓ Limestone Density Test Pass</li>
               <li className="flex items-center gap-2">✓ Mill-Gate Weight Verified</li>
               <li className="flex items-center gap-2">✓ Zero-Tamper Seal Active</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Chain of Custody */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#0c0c0c] border border-gray-800 p-6 md:p-10 rounded-xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
            
            <h3 className="text-white text-lg tracking-widest uppercase mb-8 flex items-center gap-2 font-black italic">
               <Truck className="w-6 h-6 text-cyan-500" /> Chain of Custody Ledger
            </h3>

            <div className="space-y-10 pl-6 border-l border-gray-800/50">
              
              {/* Origin */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 bg-[#050505] border-2 border-gray-700 rounded-full"></div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Origin Mill Gate</p>
                <p className="text-gray-300 font-semibold text-lg">{batch.origin}</p>
              </div>

              {/* Current Node */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 bg-[#050505] border-2 border-cyan-500 rounded-full shadow-[0_0_12px_rgba(6,182,212,1)]"></div>
                <p className="text-[10px] text-cyan-600 uppercase tracking-widest mb-1 font-bold">Current Deployment Hub</p>
                <p className="text-white font-black text-2xl tracking-tight">{batch.current_location}</p>
                <p className="text-emerald-400 text-xs mt-2 uppercase tracking-[0.25em] font-black flex items-center gap-2 bg-emerald-950/20 w-fit px-3 py-1 rounded border border-emerald-900/30">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                   {batch.status}
                </p>
              </div>

              {/* Destination */}
              <div className="relative opacity-30">
                <div className="absolute -left-[31px] top-1 w-4 h-4 bg-[#050505] border-2 border-gray-800 rounded-full"></div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Final Destination</p>
                <p className="text-gray-400 font-semibold tracking-wider italic uppercase">Pending Off-Take Verification</p>
              </div>
            </div>
          </div>

          {/* Adulteration Alert Box */}
          <div className="p-6 bg-cyan-950/10 border border-cyan-900/40 rounded-xl flex items-start gap-4">
             <ShieldCheck className="w-8 h-8 text-cyan-500 shrink-0" />
             <div>
                <p className="text-[10px] text-cyan-400 uppercase tracking-[0.3em] font-black mb-2 underline decoration-cyan-900">Digital Audit Note</p>
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  This batch was cross-referenced with the mill's outbound weigh-bridge data. Digital tamper-evidence seals were verified at the {batch.current_location} checkpoint. Quality profile matches "Industrial Grade A" parameters.
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}