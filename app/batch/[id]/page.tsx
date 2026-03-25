"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  ShieldCheck, Activity, ArrowLeft, FileText, 
  Truck, AlertTriangle, Droplets, CheckCircle2, 
  Circle, Factory, Share2, Lock, Globe 
} from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const TRANSIT_STEPS = [
  { id: "Quality Certified", label: "Origin Authenticated", desc: "Source Facility Validated" },
  { id: "In Transit - Sealed", label: "Transit Security", desc: "Active Telemetry Active" },
  { id: "Delivered - Awaiting Audit", label: "Hub Verification", desc: "Arrival Scan Pending" },
  { id: "Audit Verified", label: "Handover Secured", desc: "Chain of Custody Complete" }
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
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchSpecificBatch();
  }, [batchId]);

  const handleShare = async () => {
    if (!batch) return;
    const shareUrl = window.location.href;
    const shareText = `🔒 SEIREIYOKI AUTHENTICATION\n\nConsignment [${batch.batch_number}] has been verified.\nStatus: ${batch.status}\n\nAccess the Integrity Ledger:`;
    if (navigator.share) {
      try { await navigator.share({ title: 'SeireiYoki Authentication', text: shareText, url: shareUrl }); } 
      catch (error) { console.log(error); }
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert("Verification link copied.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Activity className="w-10 h-10 text-cyan-500 animate-spin" /></div>;

  if (!batch) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-16 h-16 text-red-900 mb-6" />
      <h1 className="text-xl uppercase tracking-widest text-white mb-8 font-black">Authentication Failed</h1>
      <Link href="/" className="text-cyan-600 border border-cyan-900/50 px-10 py-4 rounded-full uppercase text-[10px] font-black">Terminal Home</Link>
    </div>
  );

  const currentStepIndex = TRANSIT_STEPS.findIndex(s => s.id === batch.status);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <div className="flex justify-between items-center mb-16 border-b border-gray-900/60 pb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-cyan-900 hover:text-cyan-500 transition-all text-[10px] tracking-widest uppercase font-black">
          <ArrowLeft className="w-3 h-3" /> System Terminal
        </Link>
        <button onClick={handleShare} className="bg-cyan-950/20 text-cyan-400 border border-cyan-800/40 px-6 py-3 rounded-2xl transition-all text-[9px] tracking-widest uppercase font-black hover:bg-cyan-600 hover:text-black">
          <Share2 className="w-3 h-3 mr-2 inline" /> Share Authentication
        </button>
      </div>

      <header className="mb-20">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-4 h-4 text-cyan-500" />
          <span className="text-[10px] text-gray-600 uppercase tracking-[0.6em] font-black">SeireiYoki Integrity Protocol</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-6 italic uppercase leading-none">
          {batch.product_name}
        </h1>
        <p className="text-3xl text-cyan-600 tracking-tighter font-black">ID // {batch.batch_number}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Specs Column */}
        <div className="lg:col-span-1">
          <div className="bg-[#080808] border border-gray-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5"><Globe className="w-20 h-20 text-cyan-500" /></div>
             <h3 className="text-white text-xs tracking-[0.4em] uppercase mb-12 border-b border-gray-900 pb-5 font-black italic">Quality Validation</h3>
             <div className="space-y-12">
                <div>
                  <div className="flex justify-between items-end mb-3"><span className="text-gray-600 text-[9px] uppercase font-black tracking-widest">Integrity Index</span><span className="text-4xl text-white font-black">{batch.protein_percent}%</span></div>
                  <div className="bg-gray-950 h-2.5 rounded-full overflow-hidden border border-gray-900"><div className="bg-cyan-500 h-full shadow-[0_0_20px_rgba(6,182,212,0.6)]" style={{ width: `${Math.min((batch.protein_percent / 20) * 100), 100}%` }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-3"><span className="text-gray-600 text-[9px] uppercase font-black tracking-widest">Stability Index</span><span className="text-4xl text-emerald-500 font-black">{batch.moisture_percent}%</span></div>
                  <div className="bg-gray-950 h-2.5 rounded-full overflow-hidden border border-gray-900"><div className="bg-emerald-500 h-full shadow-[0_0_20px_rgba(16,185,129,0.4)]" style={{ width: `${Math.min(batch.moisture_percent * 5, 100)}%` }}></div></div>
                </div>
             </div>
          </div>
        </div>

        {/* Trail Column */}
        <div className="lg:col-span-2">
          <div className="bg-[#080808] border border-gray-900 p-10 md:p-14 rounded-[3rem] shadow-2xl relative">
            <h3 className="text-white text-xs tracking-[0.4em] uppercase mb-16 flex items-center gap-4 font-black italic">
               <Truck className="w-6 h-6 text-cyan-500" /> Supply Chain Authentication Trail
            </h3>
            <div className="space-y-16 pl-4">
              {TRANSIT_STEPS.map((step, index) => {
                const isCurrent = step.id === batch.status;
                const isCompleted = index < currentStepIndex;
                return (
                  <div key={step.id} className={`relative pl-14 transition-all duration-1000 ${isCurrent ? "opacity-100 scale-100" : "opacity-20 scale-95"}`}>
                    {index < TRANSIT_STEPS.length - 1 && <div className={`absolute left-[13px] top-10 w-[2px] h-[64px] ${isCompleted ? "bg-cyan-600" : "bg-gray-900"}`}></div>}
                    <div className="absolute left-0 top-1">{isCompleted ? <CheckCircle2 className="w-8 h-8 text-cyan-600" /> : isCurrent ? <div className="relative"><Activity className="w-8 h-8 text-white animate-pulse" /><div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-40 animate-pulse"></div></div> : <Circle className="w-8 h-8 text-gray-900" />}</div>
                    <p className={`text-[10px] uppercase tracking-[0.4em] font-black mb-2 ${isCurrent ? "text-cyan-500" : "text-gray-700"}`}>{step.label}</p>
                    <h4 className={`text-3xl font-black italic uppercase tracking-tighter ${isCurrent ? "text-white" : "text-gray-600"}`}>{index === 0 && batch.origin ? batch.origin : (isCurrent ? batch.current_location : step.desc)}</h4>
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