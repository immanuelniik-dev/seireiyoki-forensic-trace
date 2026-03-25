"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Factory, Box, Activity, Download } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 1. Capture the PWA Install Prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 2. Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBtn(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

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
        
        {/* PWA Manual Install Button (Only shows when ready) */}
        {showInstallBtn && (
          <div className="flex justify-center mb-8">
            <button 
              onClick={handleInstallClick}
              className="bg-emerald-950/20 text-emerald-400 border border-emerald-500/30 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-emerald-500 hover:text-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-bounce"
            >
              <Download className="w-3 h-3" /> Install Operational Terminal
            </button>
          </div>
        )}

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-cyan-950/20 border border-cyan-900/50 rounded-2xl mb-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <ShieldCheck className="w-12 h-12 text-cyan-500" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase leading-[0.9]">
            Industrial Logistics <br />
            <span className="text-cyan-500 italic">& Integrity Ledger</span>
          </h1>
          <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-[0.4em] font-black">
            SeireiYoki Forensic Audit Protocol v2.6
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-cyan-700 group-focus-within:text-cyan-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-16 pr-6 py-6 bg-[#0a0a0a] border-2 border-gray-900 rounded-2xl text-xl text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase tracking-[0.2em] font-black shadow-2xl"
            placeholder="ENTER BATCH ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
          <button
            type="submit"
            className="absolute right-3 top-3 bottom-3 bg-cyan-950 hover:bg-cyan-500 hover:text-black text-cyan-400 border border-cyan-800 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center gap-2 shadow-lg"
          >
            <Activity className="w-4 h-4" /> Audit
          </button>
        </form>

        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-gray-900/50 pt-10">
          <div className="text-center space-y-3">
            <Factory className="w-6 h-6 text-gray-700 mx-auto" />
            <p className="text-[8px] text-gray-600 uppercase tracking-widest font-black leading-tight">Source <br/> Authenticated</p>
          </div>
          <div className="text-center space-y-3">
            <ShieldCheck className="w-6 h-6 text-gray-700 mx-auto" />
            <p className="text-[8px] text-gray-600 uppercase tracking-widest font-black leading-tight">Forensic <br/> Verification</p>
          </div>
          <div className="text-center space-y-3">
            <Box className="w-6 h-6 text-gray-700 mx-auto" />
            <p className="text-[8px] text-gray-600 uppercase tracking-widest font-black leading-tight">Custody <br/> Secured</p>
          </div>
        </div>

      </div>
    </div>
  );
}