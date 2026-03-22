"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Search, ShieldCheck, MapPin, Box, Activity, Fingerprint, Globe } from "lucide-react";
import Link from "next/link";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ForensicDashboard() {
  const [batches, setBatches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    try {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .order("last_updated", { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error("Forensic Audit Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredBatches = batches.filter((batch) =>
    batch.batch_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono selection:bg-cyan-900 selection:text-cyan-100 p-6 md:p-12">
      
      {/* Top Navigation / Header */}
      <header className="mb-12 border-b border-cyan-900/40 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter flex items-center gap-3">
            <Fingerprint className="text-cyan-500 w-8 h-8 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            YOKI TECHNOLOGY <span className="text-cyan-500 font-light">LTD</span>
          </h1>
          <p className="text-xs text-cyan-700 mt-2 uppercase tracking-[0.3em] font-semibold">
            Digital Forensic Audit Protocol
          </p>
        </div>
        
        <div className="flex items-center gap-3 text-xs bg-[#0a0f14] text-cyan-400 px-4 py-2 rounded-md border border-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>SECURE NETWORK ENCRYPTED</span>
        </div>
      </header>

      {/* Action Bar: Search */}
      <div className="relative max-w-3xl mb-12 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-cyan-600 group-focus-within:text-cyan-400 transition-colors" />
        </div>
        <input
          type="text"
          className="block w-full bg-[#0a0a0a] border border-gray-800 rounded-lg py-5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] uppercase tracking-wider text-sm"
          placeholder="ENTER BATCH ID TO VERIFY INTEGRITY..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
           <span className="text-[10px] text-gray-600 tracking-widest border border-gray-700 px-2 py-1 rounded">CTRL+K</span>
        </div>
      </div>

      {/* Main Data Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Activity className="w-10 h-10 text-cyan-500 animate-spin" />
          <p className="text-cyan-700 text-xs uppercase tracking-widest animate-pulse">Syncing with Ledger...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredBatches.map((batch) => (
            <Link
              href={`/batch/${batch.batch_number}`}
              key={batch.id}
              className="block bg-[#0c0c0c] border border-gray-800/80 rounded-xl p-6 hover:border-cyan-800/60 transition-all duration-300 relative overflow-hidden group cursor-pointer"
            >
              {/* Neon accent glow line on hover */}
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,1)] opacity-70 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex flex-col md:flex-row justify-between gap-8 ml-4">
                
                {/* Section 1: Identity & Badge */}
                <div className="md:w-1/3 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-sm font-bold bg-black text-gray-300 px-3 py-1.5 rounded-md border border-gray-800 tracking-widest">
                      {batch.batch_number}
                    </span>
                    {/* Glowing Verification Badge */}
                    <span className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold uppercase tracking-wider bg-cyan-950/40 px-3 py-1.5 rounded-md border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-2">
                    <Box className="w-5 h-5 text-cyan-700" />
                    {batch.product_name}
                  </h2>
                </div>

                {/* Section 2: Logistics Route */}
                <div className="md:w-1/3 flex flex-col justify-center gap-3 border-l-2 border-gray-900 pl-6">
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Origin Point</p>
                      <p className="text-sm text-gray-300 font-semibold">{batch.origin}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-cyan-600 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Current Node</p>
                      <p className="text-sm text-white font-semibold">{batch.current_location}</p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Status & Metrics */}
                <div className="md:w-1/3 flex flex-col justify-center border-l-2 border-gray-900 pl-6">
                   <div className="mb-4">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Transit Status</p>
                      <p className="text-emerald-400 text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {batch.status}
                      </p>
                   </div>
                   
                   {/* Optional: Add extra technical data here if your Supabase has protein/moisture columns */}
                   {(batch.protein_percent || batch.moisture_percent) && (
                     <div className="flex gap-4">
                        {batch.protein_percent && (
                          <div>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest">Protein</p>
                             <p className="text-cyan-400 font-bold">{batch.protein_percent}%</p>
                          </div>
                        )}
                        {batch.moisture_percent && (
                           <div>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest">Moisture</p>
                             <p className="text-cyan-400 font-bold">{batch.moisture_percent}%</p>
                          </div>
                        )}
                     </div>
                   )}
                </div>

              </div>
            </Link>
          ))}
          
          {filteredBatches.length === 0 && (
            <div className="text-center py-24 text-gray-600 border border-dashed border-gray-800 rounded-xl bg-[#080808]">
              <Search className="w-8 h-8 mx-auto mb-3 text-gray-700" />
              <p className="uppercase tracking-widest text-sm">NO RECORDS MATCH THE SEARCH CRITERIA</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}