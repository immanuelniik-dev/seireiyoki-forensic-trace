"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, MapPin, Activity, UserCircle, Phone, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import for Leaflet (Required for Next.js)
const DynamicBuyerTraceMap = dynamic(
  () => import("@/components/Map/BuyerTraceMap"),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-900 animate-pulse flex items-center justify-center text-gray-700 text-[10px] uppercase font-black tracking-widest">Initializing Forensic Map...</div>
  }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function BuyerTrackPage({ params }: { params: { id: string } }) {
  // Use React.use() or a standard variable for params in client components
  const unwrappedId = params.id; 
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string>("Initializing Satellite Link...");
  const [driverInfo, setDriverInfo] = useState<{ name: string; phone: string; plate: string } | null>(null);

  useEffect(() => {
    async function fetchBatchData() {
      // 1. Fetch Batch with Joined Truck Data
      const { data: batchData, error } = await supabase
        .from("batches")
        .select(`
          *,
          fleet_trucks!inner (
            driver_name, 
            driver_phone, 
            plate_number
          )
        `)
        // Check both ID and Batch Number for flexibility
        .or(`id.eq.${unwrappedId},batch_number.ilike.%${unwrappedId}%`)
        .maybeSingle();

      if (error) {
        console.error("Forensic Retrieval Error:", error);
      } else if (batchData) {
        setBatch(batchData);
        if (batchData.fleet_trucks) {
          setDriverInfo({
            name: batchData.fleet_trucks.driver_name,
            phone: batchData.fleet_trucks.driver_phone,
            plate: batchData.fleet_trucks.plate_number,
          });
        }
      }
      setLoading(false);
    }

    fetchBatchData();

    // 2. Realtime Updates for Status and Coordinates
    const channel = supabase
      .channel(`public:batches:id=eq.${unwrappedId}`)
      .on(
        "postgres_changes",
        { 
          event: "UPDATE", 
          schema: "public", 
          table: "batches", 
          filter: `id=eq.${unwrappedId}` 
        },
        (payload) => {
          setBatch((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unwrappedId]);

  // 3. Reverse Geocoding (Convert Lat/Lng to Street Name)
  useEffect(() => {
    const lat = batch?.latitude || batch?.last_lat;
    const lng = batch?.longitude || batch?.last_lng;

    if (lat && lng) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`)
        .then(res => res.json())
        .then(data => setAddress(data.display_name || "Transit Zone Active"))
        .catch(() => setAddress("Satellite Signal Verified (Lagos Corridor)"));
    }
  }, [batch?.latitude, batch?.longitude, batch?.last_lat, batch?.last_lng]);

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      <p className="text-[10px] font-black text-cyan-900 uppercase tracking-[0.5em]">Synchronizing Ledger</p>
    </div>
  );

  if (!batch) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
      <p className="text-[10px] font-black tracking-[0.5em] text-red-600">FORENSIC RECORD NOT FOUND</p>
      <Link href="/" className="px-6 py-3 border border-gray-900 rounded-2xl text-[9px] uppercase font-black hover:bg-white hover:text-black transition-all">Return to Terminal</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-4 md:p-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b border-gray-900/50 pb-6">
        <Link href="/" className="text-[10px] tracking-widest uppercase font-black flex items-center gap-2 text-gray-600 hover:text-cyan-500 transition-all">
          <ArrowLeft className="w-3 h-3" /> System Logout
        </Link>
        <div className="flex items-center gap-3 bg-cyan-950/10 border border-cyan-900/20 px-4 py-2 rounded-xl">
          <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></div>
          <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">Encrypted Trace Active</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Map & Primary Stats */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
            <div className="h-[500px] w-full">
              {/* Ensure we pass the Internal UUID to the map for the Blue Line trace */}
              <DynamicBuyerTraceMap batchId={batch.id} />
            </div>
            <div className="p-6 bg-[#0a0a0a] border-t border-gray-900 flex items-center gap-4">
              <MapPin className="w-5 h-5 text-cyan-500" />
              <p className="text-[10px] font-bold text-gray-400 uppercase italic leading-tight">{address}</p>
            </div>
          </div>

          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-8 text-[9px] font-black text-white uppercase tracking-widest shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-900/50 pb-4">
              <p className="text-gray-500 italic">Consignment ID</p>
              <p className="text-cyan-500">{batch.batch_number}</p>
            </div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-900/50 pb-4">
              <p className="text-gray-500 italic">Product Classification</p>
              <p>{batch.product_name}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-500 italic">Integrity Status</p>
              <p className="text-emerald-500">{batch.status}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Driver & Route Info */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 space-y-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <ShieldCheck className="w-20 h-20 text-cyan-500" />
            </div>
            <h3 className="text-[10px] text-gray-500 uppercase font-black border-b border-gray-900 pb-4 tracking-[0.3em]">Chain of Custody</h3>
            {driverInfo ? (
              <div className="space-y-8">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-black border border-gray-800 rounded-2xl text-cyan-500"><UserCircle className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-black text-white uppercase italic tracking-tighter">{driverInfo.name}</p>
                    <p className="text-[8px] text-gray-600 uppercase font-bold mt-1">Authorized Driver</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-black border border-gray-800 rounded-2xl text-cyan-500"><Phone className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-black text-white uppercase italic tracking-tighter">{driverInfo.phone}</p>
                    <p className="text-[8px] text-gray-600 uppercase font-bold mt-1">Satellite Comm Link</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-black border border-gray-800 rounded-2xl text-cyan-500"><CreditCard className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-black text-white uppercase italic tracking-tighter">{driverInfo.plate}</p>
                    <p className="text-[8px] text-gray-600 uppercase font-bold mt-1">Verified Vehicle Plate</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[9px] text-gray-700 italic uppercase">Driver information encrypted or unavailable.</p>
            )}
          </div>
          
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 space-y-8 shadow-xl">
            <h3 className="text-[10px] text-gray-500 uppercase font-black border-b border-gray-900 pb-4 tracking-[0.3em]">Forensic Route</h3>
            <div className="space-y-6 text-[9px] font-black uppercase tracking-widest">
              <div className="flex items-center justify-between">
                <p className="text-gray-600 italic">Origin Node</p>
                <p className="text-white italic">{batch.origin}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-gray-600 italic">Terminal Destination</p>
                <p className="text-white italic">{batch.destination}</p>
              </div>
              <div className="flex items-center justify-between border-t border-gray-900 pt-6">
                <p className="text-gray-600 italic">ETA Timestamp</p>
                <p className="text-cyan-500 italic">{batch.estimated_delivery ? new Date(batch.estimated_delivery).toLocaleDateString() : "PENDING"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for simple icons
function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
  );
}