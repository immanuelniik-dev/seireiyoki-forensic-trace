"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Factory, Box, Activity, Download, Globe, Lock } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBtn(false);
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
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
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10">
        
        {/* PWA Manual Install Button */}
        {showInstallBtn && (
          <div className="flex justify-center mb-10">
            <button 
              onClick={handleInstallClick}
              className="bg-cyan-950/20 text-cyan-400 border border-cyan-500/30 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] animate-pulse"
            >
              <Download className="w-3 h-3" /> Install Security Terminal
            </button>
          </div>
        )}

        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center p-5 bg-cyan-950/10 border border-cyan-900/30 rounded-3xl mb-8 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
            <ShieldCheck className="w-14 h-14 text-cyan-500" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-5 uppercase leading-[0.85]">
            Industrial Logistics <br />
            <span className="text-cyan-500 italic">& Integrity Ledger</span>
          </h1>
          <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.5em] font-black">
            SeireiYoki Supply Chain Authentication
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-cyan-800 group-focus-within:text-cyan-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-16 pr-6 py-7 bg-[#080808] border-2 border-gray-900 rounded-3xl text-xl text-white placeholder-gray-800 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-all uppercase tracking-[0.25em] font-black shadow-2xl"
            placeholder="ENTER BATCH ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
          <button
            type="submit"
            className="absolute right-4 top-4 bottom-4 bg-cyan-950 hover:bg-cyan-500 hover:text-black text-cyan-400 border border-cyan-800 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 flex items-center gap-3 shadow-lg"
          >
            <ShieldCheck className="w-4 h-4" /> Verify
          </button>
        </form>

        <div className="mt-20 grid grid-cols-3 gap-10 border-t border-gray-900/60 pt-12">
          <div className="text-center space-y-4">
            <Globe className="w-6 h-6 text-gray-700 mx-auto" />
            <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black leading-tight">Global <br/> Standards</p>
          </div>
          <div className="text-center space-y-4">
            <Lock className="w-6 h-6 text-gray-700 mx-auto" />
            <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black leading-tight">Secure <br/> Transit</p>
          </div>
          <div className="text-center space-y-4">
            <Activity className="w-6 h-6 text-gray-700 mx-auto" />
            <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black leading-tight">Integrity <br/> Validated</p>
          </div>
        </div>

      </div>
    </div>
  );
}