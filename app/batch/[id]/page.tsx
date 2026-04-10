"use client";

import React, { useEffect, useState, use as reactUse } from "react";
import { createClient } from "@supabase/supabase-js";
import { shareTrace } from "@/lib/shareTrace";
import { 
  RefreshCcw, ShieldCheck, Package, MapPin, 
  CheckCircle2, ArrowLeft, Activity, UserCircle, 
  Phone, Building2, Calendar
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const DynamicBuyerTraceMap = dynamic(
  () => import("@/components/Map/BuyerTraceMap"),
  { 
    ssr: false, 
    loading: () => <div className="h-full w-full bg-[#0a0a0a] animate-pulse flex items-center justify-center text-[10px] font-black text-gray-800 uppercase tracking-[0.3em]">Syncing Satellite Link...</div> 
  }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = reactUse(params);
  const unwrappedId = decodeURIComponent(resolvedParams.id).trim().toUpperCase();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string>("Locating Asset...");
  const [driverInfo, setDriverInfo] = useState<any>(null);

  // FIXED: The Forensic Match Logic for Chain of Custody
  const fetchDriverDetails = async (plate: string) => {
    if (!plate) return;
    
    // Clean the plate string to ensure a perfect database match
    const cleanPlate = plate.trim().toUpperCase();

    const { data: truckData, error } = await supabase
      .from("fleet_trucks")
      .select("assigned_driver_name, assigned_driver_phone, plate_number, driver_name, driver_phone")
      .ilike("plate_number", cleanPlate)
      .maybeSingle();
    
    if (error) {
      console.error("❌ CUSTODY ERROR:", error.message);
    } else if (truckData) {
      // Prioritize \'assigned_driver\' fields, fallback to standard \'driver\' fields
      setDriverInfo({
        name: truckData.assigned_driver_name || truckData.driver_name,
        phone: truckData.assigned_driver_phone || truckData.driver_phone,
        plate: truckData.plate_number
      });
    }
  };

  useEffect(() => {
    if (!unwrappedId) return;

    const initForensics = async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(unwrappedId);
      let query = supabase.from("batches").select("*");
      isUUID ? query = query.eq("id", unwrappedId) : query = query.eq("batch_number", unwrappedId);

      const { data: batchData, error: batchError } = await query.maybeSingle();
      
      if (batchError) {
        console.error("❌ BATCH FETCH ERROR:", batchError.message);
      } else if (batchData) {
        setBatch(batchData);
        // Execute the match using the plate from the batch record
        fetchDriverDetails(batchData.truck_plate || batchData.plate_number);
      }
      setLoading(false);
    };

    initForensics();

    // Realtime Pulse: Keep milestones and driver links in sync
    const channelName = `forensic-sync-${unwrappedId.replace(/[^a-zA-Z0-9]/g, "")}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "batches" },
        (payload) => {
          if (payload.new.batch_number === unwrappedId) {
            setBatch(payload.new);
            // If the truck was changed, re-fetch driver details instantly
            fetchDriverDetails(payload.new.truck_plate || payload.new.plate_number);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [unwrappedId]);

  // Reverse Geocoding for the Map Label
  useEffect(() => {
    const lat = batch?.latitude || batch?.last_lat;
    const lng = batch?.longitude || batch?.last_lng;
    if (lat && lng) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`)
        .then(res => res.json())
        .then(data => setAddress(data.display_name || "Active Transit Zone"));
    }
  }, [batch?.latitude, batch?.longitude]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <RefreshCcw className="animate-spin text-cyan-500 w-10 h-10" />
    </div>
  );

  if (!batch) return (
    <div className="min-h-screen bg-black text-red-900 flex items-center justify-center uppercase font-black tracking-widest text-[10px]">
      Node_Not_Found
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/scan-lines.png')] pointer-events-none"></div>

      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-gray-900 pb-10 relative z-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
             <Activity className="w-6 h-6 text-cyan-500 animate-pulse" /> Batch <span className="text-cyan-500">Forensics</span>
          </h1>
          <div className="flex items-center gap-4 mt-3">
            <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest border border-gray-900 px-3 py-1 rounded-md">Terminal-ID: {batch.batch_number}</p>
            <div className="flex items-center gap-2 text-cyan-400/80 bg-cyan-400/5 px-3 py-1 rounded-md border border-cyan-900/30">
               <Building2 className="w-3 h-3" />
               <p className="text-[9px] font-black uppercase tracking-widest">{batch.partner_name || "Yoki Technology Limited"}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => shareTrace(unwrappedId, window.location.href)}
            className="px-6 py-3 border border-gray-800 rounded-2xl text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all flex items-center gap-2 bg-black"
          >
            Share Trace
          </button>
          <Link href="/">
            <button className="px-6 py-3 border border-gray-800 rounded-2xl text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all flex items-center gap-2 bg-black">
              <ArrowLeft className="w-3 h-3" /> Back to Terminal
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#080808] border border-gray-900 rounded-[3.5rem] overflow-hidden shadow-2xl relative h-[550px]">
            <div className="absolute inset-0 z-0">
               <DynamicBuyerTraceMap batchId={batch.id} />
            </div>
            <div className="absolute bottom-8 left-8 right-8 p-5 bg-black/90 backdrop-blur-xl border border-gray-900 rounded-[2rem] flex items-center gap-4 z-50">
               <div className="p-2 bg-cyan-500/10 rounded-lg"><MapPin className="w-4 h-4 text-cyan-500 animate-bounce" /></div>
               <div>
                  <p className="text-[7px] text-gray-600 uppercase font-black mb-0.5">Verified Geocode</p>
                  <p className="text-[9px] uppercase font-bold text-gray-400 tracking-tight italic truncate">{address}</p>
               </div>
            </div>
          </div>

          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 flex justify-between items-center shadow-xl">
             <div className="flex items-center gap-6">
                <div className="p-4 bg-black border border-gray-800 rounded-2xl text-cyan-500 shadow-inner"><Package className="w-6 h-6" /></div>
                <div>
                   <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">Asset Status</p>
                   <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{batch.product_name}</h2>
                </div>
             </div>
             <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.05)]">
               <ShieldCheck className="w-4 h-4 text-emerald-500" />
               <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">{batch.status}</p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 shadow-xl border-t-cyan-900/20 relative overflow-hidden">
              <h3 className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-8 border-b border-gray-900 pb-4 italic">Verification Chain</h3>
              <div className="space-y-8">
                {[  
                  { label: "Quality Audit", key: "qa_verified_at" },
                  { label: "Logistics Sealed", key: "logistics_sealed_at" },
                  { label: "Terminal Handover", key: "terminal_handover_at" }
                ].map((m: any, i: number) => (
                  <div key={i} className="group relative">
                    <div className={`flex items-center justify-between p-5 bg-black/40 rounded-2xl border \
                      ${batch[m.key] ? "border-emerald-900/30" : "border-gray-900/30"}`}>
                      <span className={`text-[10px] font-black uppercase \
                        ${batch[m.key] ? "text-emerald-500/70" : "text-gray-500/70"} italic`}>
                        {m.label}
                      </span>
                      {batch[m.key] ? (
                        <div className="flex items-center gap-2 text-emerald-500 text-[8px] font-black uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                           Verified <CheckCircle2 className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-700 text-[8px] font-black uppercase bg-gray-900/10 px-3 py-1 rounded-full border border-gray-800/40">
                           Pending <RefreshCcw className="w-3 h-3 animate-spin" />
                        </div>
                      )}
                    </div>
                    {batch[m.key] && (
                      <div className="mt-3 flex items-center gap-2 px-2 text-[8px] font-black text-gray-600 uppercase italic">
                        <Calendar className="w-2.5 h-2.5" /> 
                        {new Date(batch[m.key]).toLocaleDateString("en-GB")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
          </div>

          {/* CHAIN OF CUSTODY */}
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 shadow-xl">
             <h3 className="text-[10px] text-gray-500 uppercase font-black border-b border-gray-900 pb-4 tracking-widest mb-6 italic">Chain of Custody</h3>
             
             {driverInfo ? (
              <div className="space-y-6">
                <div className="flex items-center gap-5 p-5 bg-black/40 rounded-2xl border border-gray-900/50 hover:border-cyan-900/30 transition-all">
                   <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500"><UserCircle className="w-6 h-6" /></div>
                   <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-tighter">{driverInfo.name}</p>
                      <p className="text-[7px] text-gray-600 uppercase font-black mt-1">Authorized Driver</p>
                   </div>
                </div>
                <div className="flex items-center gap-5 p-5 bg-black/40 rounded-2xl border border-gray-900/50 hover:border-cyan-900/30 transition-all">
                   <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500"><Phone className="w-6 h-6" /></div>
                   <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-tighter">{driverInfo.phone}</p>
                      <p className="text-[7px] text-gray-600 uppercase font-black mt-1">Satellite Line</p>
                   </div>
                </div>
                <div className="flex items-center gap-5 p-5 bg-black/40 rounded-2xl border border-gray-900/50">
                   <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500"><Activity className="w-6 h-6" /></div>
                   <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-tighter">{driverInfo.plate}</p>
                      <p className="text-[7px] text-gray-600 uppercase font-black mt-1">Vessel Registry</p>
                   </div>
                </div>
              </div>
             ) : (
               <div className="text-center py-6">
                  <RefreshCcw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-800" />
                  <p className="text-[8px] text-gray-800 italic uppercase tracking-widest">Awaiting Custody Data</p>
               </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
