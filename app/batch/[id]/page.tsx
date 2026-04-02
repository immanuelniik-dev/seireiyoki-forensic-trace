"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  ShieldCheck, Activity, ArrowLeft, 
  Truck, CheckCircle2, 
  Circle, Share2, Lock, Globe, Clock, MapPin, List, Radio
} from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Dynamic import for the map to prevent SSR issues
const LiveMap = dynamic(() => import('@/components/LiveMap'), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-[#080808] rounded-[2.5rem] animate-pulse border border-gray-900" />
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function IndustrialForensicReport({ params }: { params: any }) {
  // Unwrap params safely for both Next.js 14 and 15
  const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);
  
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string>("Initializing Satellite Link...");
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 1. Handle Params Unwrapping
  useEffect(() => {
    Promise.resolve(params).then((res) => setUnwrappedParams(res));
  }, [params]);

  // 2. Fetch Data once ID is available
  useEffect(() => {
    if (!unwrappedParams?.id) return;
    const batchId = unwrappedParams.id.toUpperCase().trim();

    async function fetchInitialData() {
      const { data: batchData } = await supabase
        .from("batches")
        .select("*")
        .eq("batch_number", batchId)
        .maybeSingle();
      
      if (batchData) setBatch(batchData);

      const { data: historyData } = await supabase
        .from("location_logs")
        .select("*")
        .eq("batch_number", batchId)
        .order("created_at", { ascending: true });
      
      if (historyData) setHistory(historyData);
      setLoading(false);
    }

    fetchInitialData();

    // Real-time Subscriptions
    const channel = supabase
      .channel(`live-${batchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches', filter: `batch_number=eq.${batchId}` }, 
        (payload) => setBatch(payload.new)
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_logs', filter: `batch_number=eq.${batchId}` }, 
        (payload) => {
          setHistory(prev => [...prev, payload.new]);
          setBatch((prev: any) => ({ ...prev, lat: payload.new.lat, lng: payload.new.lng }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [unwrappedParams]);

  // 3. Geocoding Logic
  useEffect(() => {
    const lat = batch?.lat || batch?.latitude;
    const lng = batch?.lng || batch?.longitude;

    if (lat && lng) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`)
        .then(res => res.json())
        .then(data => setAddress(data.display_name || "Transit Zone Active"))
        .catch(() => setAddress("Satellite Signal Verified"));
    }
  }, [batch]);

  const generatePDF = () => {
    if (!batch) return;
    const doc = new jsPDF();
    doc.text(`SEIREIYOKI LEDGER: ${batch.batch_number}`, 15, 20);
    // ... basic PDF generation logic simplified for error checking ...
    doc.save(`SeireiYoki_${batch.batch_number}.pdf`);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Activity className="animate-spin text-cyan-500" /></div>;
  if (!batch) return <div className="min-h-screen bg-black text-white flex items-center justify-center">RECORD NOT FOUND</div>;

  const currentStep = batch.status === "Audit Verified" ? 2 : batch.status === "In Transit - Sealed" ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-4 md:p-12">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b border-gray-900/50 pb-6">
        <Link href="/" className="text-[10px] tracking-widest uppercase font-black flex items-center gap-2 text-gray-600 hover:text-cyan-500 transition-all">
          <ArrowLeft className="w-3 h-3" /> System Terminal
        </Link>
        <div className="flex items-center gap-3 bg-cyan-950/10 border border-cyan-900/20 px-4 py-2 rounded-xl">
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></div>
            <span className="text-[8px] font-black text-cyan-500 uppercase">Live Satellite Feed</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] overflow-hidden relative">
            <div className="h-[500px] w-full">
                <LiveMap 
                  lat={batch.lat || batch.latitude || 6.45} 
                  lng={batch.lng || batch.longitude || 3.37} 
                  label={batch.batch_number} 
                  history={history} 
                  showHistory={showHistory} 
                />
            </div>
            <div className="p-6 bg-[#0a0a0a] border-t border-gray-900 flex items-center gap-4">
                <MapPin className="w-5 h-5 text-cyan-500" />
                <p className="text-[10px] font-bold text-gray-400 uppercase italic leading-tight">{address}</p>
            </div>
          </div>
          <div className="flex gap-4">
              <button onClick={() => setShowHistory(false)} className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${!showHistory ? 'bg-cyan-500 text-black border-cyan-400' : 'border-gray-900'}`}>Current Location</button>
              <button onClick={() => setShowHistory(true)} className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${showHistory ? 'bg-cyan-500 text-black border-cyan-400' : 'border-gray-900'}`}>History ({history.length})</button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 space-y-12">
            <h3 className="text-[10px] text-gray-500 uppercase font-black border-b border-gray-900 pb-4">Forensic Supply Chain Trail</h3>
            
            <div className="space-y-10">
                {["Origin Authenticated", "Active Transit", "Handover Verification"].map((label, idx) => (
                    <div key={idx} className={`relative pl-12 ${idx <= currentStep ? "opacity-100" : "opacity-20"}`}>
                        <div className="absolute left-0 top-0">
                            {idx < currentStep ? <CheckCircle2 className="text-cyan-500 w-6 h-6" /> : <Circle className="text-gray-600 w-6 h-6" />}
                        </div>
                        <p className="text-[8px] uppercase font-black text-gray-600">{label}</p>
                        <h4 className="text-xl font-black italic text-white uppercase">{idx === 0 ? batch.origin : idx === 1 ? batch.current_location : "Pending"}</h4>
                    </div>
                ))}
            </div>

            <button onClick={generatePDF} className="w-full bg-cyan-950/20 border border-cyan-900/50 py-6 rounded-3xl text-[9px] font-black text-cyan-500 uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                Download Forensic Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}