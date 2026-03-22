"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShieldCheck, MapPin, Activity, ArrowLeft, Beaker, FileText, Truck } from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ForensicReport({ params }: { params: Promise<{ id: string }> }) {
  // UNWRAP THE PARAMS SECURELY FOR NEXT.JS 16+
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
        <p className="text-cyan-700 text-xs uppercase tracking-widest animate-pulse">Retrieving Forensic Dossier...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-gray-500 font-mono p-6">
        <ShieldCheck className="w-16 h-16 text-red-900 mb-4" />
        <h1 className="text-xl uppercase tracking-widest text-white mb-2">Audit Failed</h1>
        <p className="text-sm">Batch ID [{batchId}] not found in the Yoki Ledger.</p>
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
            Verified Authentic
          </span>
          <span className="text-xs text-gray-500 tracking-widest uppercase border border-gray-800 px-2 py-1 rounded">
            Report ID: {batch.id.substring(0,8)}
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
          {batch.product_name}
        </h1>
        <p className="text-xl text-cyan-600 tracking-widest uppercase">
          BATCH NUMBER: {batch.batch_number}
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column: Specs */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-xl">
            <h3 className="text-white text-sm tracking-widest uppercase mb-4 flex items-center gap-2 border-b border-gray-900 pb-3">
              <Beaker className="w-4 h-4 text-cyan-500" /> Chemical Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs uppercase tracking-widest">Protein Level</span>
                <span className="text-white font-bold">{batch.protein_percent || 'N/A'}%</span>
              </div>
              <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-cyan-500 h-full w-[80%]"></div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-500 text-xs uppercase tracking-widest">Moisture Limit</span>
                <span className="text-emerald-400 font-bold">{batch.moisture_percent || 'N/A'}%</span>
              </div>
               <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-emerald-500 h-full w-[30%]"></div>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-xl">
            <h3 className="text-white text-sm tracking-widest uppercase mb-4 flex items-center gap-2 border-b border-gray-900 pb-3">
              <FileText className="w-4 h-4 text-cyan-500" /> Certifications
            </h3>
            <ul className="space-y-3 text-xs text-gray-400 tracking-wider">
               <li className="flex items-center gap-2">✓ ISO 9001:2015 Approved</li>
               <li className="flex items-center gap-2">✓ EU Export Standard Cleared</li>
               <li className="flex items-center gap-2">✓ Yoki Zero-Tamper Sealed</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Chain of Custody Timeline */}
        <div className="md:col-span-2 bg-[#0c0c0c] border border-gray-800 p-6 md:p-10 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-600/30"></div>
          
          <h3 className="text-white text-lg tracking-widest uppercase mb-8 flex items-center gap-2">
             <Truck className="w-5 h-5 text-cyan-500" /> Chain of Custody Ledger
          </h3>

          <div className="space-y-8 pl-4 border-l border-gray-800">
            
            {/* Timeline Node 1 */}
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-3 h-3 bg-[#0c0c0c] border-2 border-gray-600 rounded-full"></div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Origin Node</p>
              <p className="text-gray-300 font-semibold">{batch.origin}</p>
            </div>

            {/* Timeline Node 2 */}
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-3 h-3 bg-[#0c0c0c] border-2 border-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
              <p className="text-[10px] text-cyan-600 uppercase tracking-widest mb-1">Current Node</p>
              <p className="text-white font-bold text-lg">{batch.current_location}</p>
              <p className="text-emerald-400 text-xs mt-1 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 {batch.status}
              </p>
            </div>

            {/* Timeline Node 3 (Pending) */}
            <div className="relative opacity-30">
              <div className="absolute -left-[21px] top-1 w-3 h-3 bg-[#0c0c0c] border-2 border-gray-600 rounded-full"></div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Destination Node</p>
              <p className="text-gray-400 font-semibold">Awaiting Final Off-Take Signature</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}