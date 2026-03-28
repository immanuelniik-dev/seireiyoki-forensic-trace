"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  ShieldCheck, Activity, ArrowLeft, 
  Truck, AlertTriangle, CheckCircle2, 
  Circle, Share2, Lock, Globe, Navigation, Clock, MapPin, Factory
} from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { 
  ssr: false,
  loading: () => <div className="h-[550px] w-full bg-[#080808] rounded-[2.5rem] animate-pulse border border-gray-900" />
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function IndustrialForensicReport({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.id;
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string>("Locating Asset...");

  useEffect(() => {
    async function fetchBatch() {
      if (!batchId) return;
      const { data } = await supabase
        .from("batches")
        .select("*")
        .eq("batch_number", batchId.trim().toUpperCase())
        .maybeSingle();
      setBatch(data);
      setLoading(false);
    }
    fetchBatch();

    const channel = supabase
      .channel(`realtime-${batchId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'batches',
        filter: `batch_number=eq.${batchId.trim().toUpperCase()}` 
      }, (payload) => setBatch(payload.new))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [batchId]);

  useEffect(() => {
    async function getAddress() {
      if (batch?.latitude && batch?.longitude) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${batch.latitude}&lon=${batch.longitude}&zoom=18`
          );
          const data = await res.json();
          setAddress(data.display_name || "Coordinate Sync Active");
        } catch (err) {
          setAddress("Coordinate Sync Active");
        }
      }
    }
    getAddress();
  }, [batch?.latitude, batch?.longitude]);

  const handleShare = async () => {
    if (!batch) return;
    const shareUrl = window.location.href;
    const shareText = `🔒 SEIREIYOKI AUTHENTICATION\nID: ${batch.batch_number}\nStatus: ${batch.status}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'SeireiYoki', text: shareText, url: shareUrl }); } 
      catch (e) { console.log(e); }
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono"><Activity className="w-10 h-10 text-cyan-500 animate-spin" /></div>;
  if (!batch) return <div className="text-white text-center p-20 uppercase font-black font-mono">Node Not Found</div>;

  const currentStep = batch.status === "Audit Verified" ? 2 : batch.status === "In Transit - Sealed" ? 1 : 0;
  const updateTime = new Date(batch.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const STEPS = [
    { label: "Origin Authenticated", location: batch.origin },
    { label: "Active Transit", location: batch.current_location },
    { label: "Final Handover", location: currentStep === 2 ? batch.current_location : "Pending Arrival" }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12 selection:bg-cyan-900">
      
      {/* Top Nav */}
      <div className="flex justify-between items-center mb-10 border-b border-gray-900/40 pb-6">
        <Link href="/" className="text-[10px] tracking-widest uppercase font-black flex items-center gap-2 text-gray-600 hover:text-cyan-500 transition-all">
          <ArrowLeft className="w-3 h-3" /> System Terminal
        </Link>
        <button onClick={handleShare} className="bg-cyan-950/20 text-cyan-400 border border-cyan-800/40 px-5 py-2 rounded-xl text-[9px] tracking-widest uppercase font-black hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-2 shadow-lg">
            <Share2 className="w-3 h-3" /> Share Protocol
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: UNIFIED TELEMETRY BLOCK */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            
            {/* MAP VIEWPORT */}
            <div className="relative h-[480px] w-full border-b border-gray-900">
                {/* Floating Title Overlay */}
                <div className="absolute top-6 left-8 z-[1000] pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-md border border-gray-800 p-5 rounded-3xl shadow-2xl">
                        <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{batch.product_name}</h1>
                        <p className="text-[9px] text-cyan-500 font-black mt-2 tracking-widest uppercase">NODE // {batch.batch_number}</p>
                    </div>
                </div>
                
                <LiveMap lat={batch.latitude || 6.45} lng={batch.longitude || 3.60} label={batch.batch_number} />
            </div>

            {/* INTEGRATED LAST SEEN (REMOVED RED SCRIBBLE SPACE) */}
            <div className="bg-[#0a0a0a] p-6 flex items-center gap-5">
                <div className="bg-cyan-500/10 p-3 rounded-2xl border border-cyan-900/20">
                    <MapPin className="w-5 h-5 text-cyan-500" />
                </div>
                <div className="flex-1">
                    <p className="text-[8px] text-cyan-600 font-black uppercase tracking-[0.3em] mb-1">Current Geo-Position Address</p>
                    <p className="text-[10px] md:text-xs text-gray-300 font-bold leading-relaxed uppercase italic tracking-tight">
                        {address}
                    </p>
                </div>
            </div>
          </div>
        </div>

        {/* RIGHT: AUTHENTICATION TRAIL */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 shadow-2xl flex-1 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><ShieldCheck className="w-64 h-64 text-cyan-500" /></div>
            
            <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black mb-12 border-b border-gray-900 pb-6 flex items-center gap-3">
                <Globe className="w-4 h-4 text-cyan-900" /> Supply Chain Trail
            </h3>

            <div className="space-y-12 relative flex-1">
              {STEPS.map((step, index) => {
                const isActive = index <= currentStep;
                const isLive = index === currentStep;

                return (
                  <div key={index} className={`relative pl-12 transition-all duration-700 ${isActive ? "opacity-100" : "opacity-20"}`}>
                    {index < STEPS.length - 1 && (
                      <div className={`absolute left-[13px] top-10 w-[1px] h-[60px] ${index < currentStep ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]" : "bg-gray-900"}`}></div>
                    )}
                    
                    <div className="absolute left-0 top-1">
                      {index < currentStep ? (
                        <CheckCircle2 className="w-7 h-7 text-cyan-500" />
                      ) : isLive ? (
                        <div className="relative">
                          <Circle className="w-7 h-7 text-white animate-pulse" />
                        </div>
                      ) : (
                        <Circle className="w-7 h-7 text-gray-800" />
                      )}
                    </div>

                    <div className="space-y-2">
                        <p className={`text-[9px] uppercase tracking-[0.3em] font-black ${isLive ? "text-cyan-500" : "text-gray-600"}`}>
                            {step.label} {isLive && "— ACTIVE"}
                        </p>
                        <h4 className={`text-2xl font-black italic uppercase tracking-tighter ${isLive ? "text-white" : "text-gray-700"}`}>
                            {step.location || "SYNCING..."}
                        </h4>
                        
                        {isActive && (
                            <div className="flex items-center gap-4 pt-1">
                                <div className="flex items-center gap-1.5 text-[8px] text-gray-500 font-black uppercase">
                                    <Clock className="w-3 h-3 text-cyan-900" /> {index === currentStep ? updateTime : "LOGGED"}
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-900/50 text-center">
                <button onClick={() => window.print()} className="w-full bg-[#050505] border border-gray-800 py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white transition-all flex items-center justify-center gap-3">
                    <Lock className="w-3 h-3 text-cyan-900" /> Download Secure Ledger
                </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}