"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Factory, Box, Activity } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/batch/${searchQuery.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 selection:bg-cyan-900 selection:text-white relative overflow-hidden">
      
      {/* Background Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-cyan-950/20 border border-cyan-900/50 rounded-2xl mb-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <ShieldCheck className="w-12 h-12 text-cyan-500" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase">
            Industrial Logistics <br />
            <span className="text-cyan-500 italic">& Integrity Ledger</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-400 uppercase tracking-[0.3em] font-bold">
            SeireiYoki Forensic Audit Protocol v2.6
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-cyan-600 group-focus-within:text-cyan-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-16 pr-6 py-6 bg-[#0a0a0a] border-2 border-gray-800 rounded-2xl text-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase tracking-widest font-bold shadow-2xl"
            placeholder="ENTER BATCH ID (e.g., AG-7002)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
          <button
            type="submit"
            className="absolute right-3 top-3 bottom-3 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-8 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center gap-2"
          >
            <Activity className="w-4 h-4" /> Audit
          </button>
        </form>

        <div className="mt-12 grid grid-cols-3 gap-4 border-t border-gray-900 pt-8">
          <div className="text-center space-y-2">
            <Factory className="w-5 h-5 text-gray-600 mx-auto" />
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Source Verified</p>
          </div>
          <div className="text-center space-y-2">
            <ShieldCheck className="w-5 h-5 text-gray-600 mx-auto" />
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Zero-Tamper</p>
          </div>
          <div className="text-center space-y-2">
            <Box className="w-5 h-5 text-gray-600 mx-auto" />
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Off-Take Secured</p>
          </div>
        </div>

      </div>
    </div>
  );
}