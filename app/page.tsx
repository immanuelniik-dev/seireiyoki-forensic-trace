"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Search, ShieldCheck, MapPin, Box, Activity } from "lucide-react";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ForensicDashboard() {
  const [batches, setBatches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    const { data, error } = await supabase
      .from("batches")
      .select("*")
      .order("last_updated", { ascending: false });

    if (error) console.error("Error fetching data:", error);
    else setBatches(data || []);
    setLoading(false);
  }

  const filteredBatches = batches.filter((batch) =>
    batch.batch_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-mono selection:bg-cyan-900 selection:text-cyan-100 p-6 md:p-12">
      {/* Header */}
      <header className="mb-12 border-b border-cyan-900/50 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-cyan-400 w-8 h-8" />
            YOKI TECHNOLOGY <span className="text-cyan-400 font-light">LTD</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest">
            Digital Forensic Supply Chain Audit
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs bg-cyan-950/30 text-cyan-400 px-3 py-1.5 rounded border border-cyan-900/50">
          <Activity className="w-4 h-4 animate-pulse" />
          SYSTEM ACTIVE
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative max-w-2xl mb-12">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-cyan-500" />
        </div>
        <input
          type="text"
          className="block w-full bg-[#111] border border-gray-800 rounded-lg py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
          placeholder="Enter Batch ID to Verify Integrity..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Data Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-cyan-500">
          <Activity className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredBatches.map((batch) => (
            <div
              key={batch.id}
              className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-cyan-800/50 transition-colors relative overflow-hidden"
            >
              {/* Neon accent line */}
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 ml-4">
                
                {/* Product Info */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold bg-gray-800 text-gray-300 px-2 py-1 rounded tracking-widest">
                      ID: {batch.batch_number}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-cyan-400 font-semibold uppercase tracking-wider bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900/30">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Box className="w-5 h-5 text-gray-500" />
                    {batch.product_name}
                  </h2>
                </div>

                {/* Logistics Info */}
                <div className="flex flex-col gap-2 md:w-1/3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Origin:</span>
                    <span className="text-gray-200">{batch.origin}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {batch.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Location:</span>
                    <span className="text-white">{batch.current_location}</span>
                  </div>
                </div>

                {/* Analytics */}
                <div className="grid grid-cols-2 gap-4 md:border-l md:border-gray-800 md:pl-6 text-sm">
                  <div className="bg-black/50 p-3 rounded border border-gray-900 text-center">
                    <span className="block text-gray-500 text-xs uppercase mb-1">Protein</span>
                    <span className="text-white font-bold">{batch.protein_percent}%</span>
                  </div>
                  <div className="bg-black/50 p-3 rounded border border-gray-900 text-center">
                    <span className="block text-gray-500 text-xs uppercase mb-1">Moisture</span>
                    <span className="text-white font-bold">{batch.moisture_percent}%</span>
                  </div>
                </div>

              </div>
            </div>
          ))}
          
          {filteredBatches.length === 0 && (
            <div className="text-center py-20 text-gray-600 border border-dashed border-gray-800 rounded-xl">
              No batch records found matching your query.
            </div>
          )}
        </div>
      )}
    </div>
  );
}