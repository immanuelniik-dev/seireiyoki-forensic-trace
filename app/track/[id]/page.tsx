"use client";

import React, { useEffect, useState, use as reactUse } from "react";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, MapPin, Activity, UserCircle, Phone, CreditCard, Loader2, ShieldCheck, Box } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic Import for the Map to prevent SSR errors
const DynamicBuyerTraceMap = dynamic(
  () => import("@/components/Map/BuyerTraceMap"),
  { 
    ssr: false, 
    loading: () => <div className="h-[400px] w-full bg-gray-900 animate-pulse rounded-[3rem] flex items-center justify-center text-[10px] font-black text-gray-700 uppercase">Synchronizing Satellite Link...</div> 
  }
);

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function BuyerTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = reactUse(params);
  // Decode the ID to handle any special characters in the URL
  const unwrappedId = decodeURIComponent(resolvedParams.id).trim(); 

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string>("Locating Asset...");
  const [driverInfo, setDriverInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchBatchData() {
      if (!unwrappedId) return;
      setLoading(true);

      try {
        console.log("🔍 Forensic Search Initialized for:", unwrappedId);

        // 1. Check if the input is a valid UUID format to prevent 400 Bad Request Errors
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(unwrappedId);

        let query = supabase.from("batches").select("*");

        if (isUUID) {
          // If it is a UUID, search the internal system ID column
          query = query.eq("id", unwrappedId);
        } else {
          // If it is TEXT (like OB-5522), only search the batch_number column
          query = query.eq("batch_number", unwrappedId.toUpperCase());
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error("❌ Database Error:", error.message);
        } else if (data) {
          console.log("✅ Match Found in Ledger:", data.batch_number);
          setBatch(data);

          // 2. Secondary Lookup for Driver/Truck info based on the truck plate
          const plate = data.truck_plate || data.plate_number;
          if (plate) {
            const { data: truckData } = await supabase
              .from("fleet_trucks")
              .select("*")
              .eq("plate_number", plate)
              .maybeSingle();

            if (truckData) {
              setDriverInfo(truckData);
            }
          }
        } else {
          console.warn("⚠️ No match found for identifier:", unwrappedId);
        }
      } catch (err) {
        console.error("❌ Critical Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBatchData();

    // 3. Setup Realtime Listener using constant dependencies
    const channelId = `live-track-${unwrappedId.replace(/[^a-zA-Z0-9]/g, '')}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "batches" },
        (payload) => {
          const updated = payload.new as any;
          // Only update state if this change belongs to the record we are viewing
          if (updated.id === unwrappedId || updated.batch_number === unwrappedId.toUpperCase()) {
            setBatch(updated);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [unwrappedId]); // dependency array is constant. Fixed "Rules of Hooks"

  // 4. Reverse Geocoding Effect (Constant Dependency Array)
  useEffect(() => {
    const lat = batch?.latitude || batch?.last_lat;
    const lng = batch?.longitude || batch?.last_lng;
    if (lat && lng) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`)
        .then(res => res.json())
        .then(data => setAddress(data.display_name || "Transit Zone Active"))
        .catch(() => setAddress("Satellite Signal Verified"));
    }
  }, [batch?.latitude, batch?.longitude]);

  // Loading Screen
  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
      <p className="text-[10px] font-black text-cyan-900 uppercase tracking-[0.5em] font-mono">Synchronizing Ledger</p>
    </div>
  );

  // Record Not Found Screen
  if (!batch) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center font-mono relative overflow-hidden">
       {/* Diagnostic Background Pattern */}
       <div className="absolute inset-0 opacity-5 bg-[url('/scan-lines.png')]"></div>
       <div className="absolute top-0 right-0 p-8 text-[8px] text-red-950 uppercase font-black tracking-widest leading-loose text-right">Error: Node Not Found<br/>Status: Forensic Match Failed<br/>Timestamp: {new Date().toISOString()}</div>
       
      <div className="border border-red-900/30 p-12 rounded-[3.5rem] bg-red-950/5 max-w-lg shadow-[0_0_60px_rgba(153,27,27,0.1)] relative z-10">
        <Activity className="w-12 h-12 text-red-900 mx-auto mb-6 animate-pulse" />
        <p className="text-[10px] font-black tracking-[0.5em] text-red-600 mb-4 uppercase italic">Forensic Record Missing</p>
        <p className="text-xl font-black text-gray-500 mb-6 italic tracking-tighter">IDENTIFIER: {unwrappedId}</p>
        <p className="text-[9px] text-gray-700 uppercase font-bold tracking-widest leading-loose">
          The requested consignment node is not appearing in the active public ledger. 
          Verify the ID or contact logistics support if the error persists.
        </p>
      </div>
      <Link href="/" className="mt-12 text-[10px] font-black uppercase text-gray-600 hover:text-white transition-all tracking-[0.3em] border-b border-gray-900 pb-2 relative z-10">← Return to Terminal</Link>
    </div>
  );

  // Full Forensic Tracking UI
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12 relative overflow-hidden">
       {/* Substrate Background Layer */}
       <div className="absolute inset-0 opacity-5 bg-[url('/scan-lines.png')] z-0"></div>
       <div className="absolute top-0 right-0 p-12 text-[7px] text-gray-950 uppercase font-black tracking-[0.3em] text-right z-0">System Node: Yoki-Terminal-4<br/>Auth Level: Public Public Access<br/>Port: 3000 Secured</div>

      <header className="max-w-7xl mx-auto flex justify-between items-end mb-12 border-b border-gray-900/50 pb-10 relative z-10">
        <div>
           <p className="text-[11px] text-cyan-500 font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2italic"><Activity className="w-4 h-4 animate-pulse text-cyan-500" /> Active System Trace</p>
           <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Consignment: {batch.batch_number}</h1>
        </div>
        <Link href="/" className="text-[10px] font-black uppercase text-gray-700 hover:text-red-500 transition-all border border-gray-900 px-6 py-3 rounded-2xl bg-black">End Session</Link>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        {/* Left Column: Map and Status */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#080808] border border-gray-900 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
             {/* Map Component */}
            <div className="h-[550px] w-full">
              <DynamicBuyerTraceMap batchId={batch.id} />
            </div>
            {/* Realtime Address Overlay */}
            <div className="p-6 bg-[#0a0a0a] border-t border-gray-900 flex items-center gap-4">
               <MapPin className="w-5 h-5 text-cyan-500 animate-pulse" />
               <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight italic">{address}</p>
            </div>
          </div>

          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 text-[10px] font-black text-white uppercase tracking-widest shadow-xl flex justify-between items-center group">
             <div className="flex items-center gap-4">
                <Box className="w-6 h-6 text-cyan-500" />
                <p className="text-xl font-black italic tracking-tighter text-white">{batch.product_name || "Unknown Commodity"}</p>
             </div>
             <p className="text-[11px] text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl group-hover:scale-105 transition-transform">{batch.status}</p>
          </div>
        </div>

        {/* Right Column: chain of Custody and Route */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 space-y-10 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck className="w-24 h-24 text-cyan-500" /></div>
             <h3 className="text-[10px] text-gray-500 uppercase font-black mb-8 border-b border-gray-900 pb-4 tracking-[0.3em]">Chain of Custody</h3>
             
             {driverInfo ? (
              <div className="space-y-10">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-black border border-gray-800 rounded-2xl text-cyan-500 shadow-inner"><UserCircle className="w-7 h-7" /></div>
                  <div>
                    <p className="text-lg font-black text-white uppercase italic tracking-tighter">{driverInfo.assigned_driver_name || driverInfo.driver_name}</p>
                    <p className="text-[8px] text-gray-600 uppercase font-bold mt-1 tracking-widest">Authorized Personnel</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-black border border-gray-800 rounded-2xl text-cyan-500 shadow-inner"><Phone className="w-7 h-7" /></div>
                  <div>
                    <p className="text-lg font-black text-white uppercase italic tracking-tighter">{driverInfo.assigned_driver_phone || driverInfo.driver_phone}</p>
                    <p className="text-[8px] text-gray-600 uppercase font-bold mt-1 tracking-widest">Satellite Comm Link</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 pt-10 border-t border-gray-900/50">
                  <div className="p-4 bg-black border border-gray-800 rounded-2xl text-cyan-500 shadow-inner"><CreditCard className="w-7 h-7" /></div>
                  <div>
                    <p className="text-lg font-black text-white uppercase italic tracking-tighter">{driverInfo.plate_number}</p>
                    <p className="text-[8px] text-gray-600 uppercase font-bold mt-1 tracking-widest">Transport Vessel ID</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-10 text-center border-y border-gray-900/50">
                 <Loader2 className="w-6 h-6 animate-spin text-gray-800 mx-auto" />
                 <p className="text-[9px] text-gray-700 italic uppercase">Driver assignment in transit.</p>
              </div>
            )}
          </div>
          
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 shadow-xl">
            <h3 className="text-[10px] text-gray-500 uppercase font-black mb-8 border-b border-gray-900 pb-4 tracking-[0.3em]">Route</h3>
            <div className="space-y-6 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center justify-between">
                <p className="text-gray-600 italic">Origin Node</p>
                <p className="text-white italic">{batch.origin || "Processing..."}</p>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-gray-900/50">
                <p className="text-gray-600 italic">Destination</p>
                <p className="text-white italic">{batch.destination || "Awaiting Route"}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}