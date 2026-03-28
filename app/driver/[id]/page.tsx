"use client";

import { useState, useEffect, use, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Truck, Navigation, StopCircle, Radio, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function DriverTerminal({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.id.toUpperCase();
  
  const [isTracking, setIsTracking] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [lastPing, setLastPing] = useState<string | null>(null);
  const [isDelivered, setIsDelivered] = useState(false);

  // Memoized update function to prevent stale closures in production
  const updateLedgerLocation = useCallback(async (lat: number, lng: number, statusOverride?: string) => {
    try {
      const { error: upsertError } = await supabase
        .from("batches")
        .update({
          latitude: lat,
          longitude: lng,
          current_location: statusOverride === "Audit Verified" ? "Destination Reached" : "In Transit - Live GPS",
          status: statusOverride || "In Transit - Sealed",
          last_updated: new Date().toISOString(),
        })
        .eq("batch_number", batchId);

      if (upsertError) throw upsertError;
      setLastPing(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error("Ledger Sync Failure:", err);
      setError("Sync Error: Terminal lost connection to ledger.");
    }
  }, [batchId]);

  useEffect(() => {
    let watchId: number;

    if (isTracking) {
      setError(""); // Clear previous errors on start
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCoords({ lat: latitude, lng: longitude });
            updateLedgerLocation(latitude, longitude);
          },
          (err) => {
            if (err.code === 1) setError("PERMISSION DENIED: Enable GPS in settings.");
            else setError("GPS SIGNAL LOST: Seeking satellite...");
          },
          { 
            enableHighAccuracy: true, 
            maximumAge: 0,
            timeout: 5000 
          }
        );
      } else {
        setError("DEVICE INCOMPATIBLE: No GPS hardware detected.");
      }
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking, updateLedgerLocation]);

  const toggleTracking = async () => {
    if (isTracking) {
      // Transitioning from Transit to Handover
      if (coords) {
        await updateLedgerLocation(coords.lat, coords.lng, "Audit Verified");
        setIsDelivered(true);
      }
      setIsTracking(false);
    } else {
      setIsDelivered(false);
      setIsTracking(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 flex flex-col items-center justify-center selection:bg-cyan-900">
      <div className="w-full max-w-md bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden text-center">
        
        {/* Production Signal Header */}
        {isTracking && (
          <div className="absolute top-0 left-0 w-full h-1 overflow-hidden bg-cyan-950/20">
            <div className="h-full bg-cyan-500 animate-[sideways_2s_linear_infinite] w-1/3 shadow-[0_0_15px_rgba(6,182,212,1)]"></div>
          </div>
        )}

        <header className="mb-10">
          <div className="inline-flex p-5 bg-cyan-950/10 rounded-3xl mb-6 border border-cyan-900/20">
            {isDelivered ? (
              <CheckCircle className="w-10 h-10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" />
            ) : (
              <Truck className={`w-10 h-10 ${isTracking ? "text-cyan-400 animate-pulse" : "text-gray-800"}`} />
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
            {isDelivered ? "Handover Complete" : "Logistics Node"}
          </h1>
          <p className="text-[10px] text-gray-600 tracking-[0.4em] uppercase mt-3">Auth ID: {batchId}</p>
        </header>

        <div className="space-y-5 mb-10 text-left">
          <div className="bg-black/40 border border-gray-900 p-5 rounded-2xl flex items-center justify-between">
             <span className="text-[9px] text-gray-600 uppercase tracking-widest font-black">Link Status</span>
             <div className="flex items-center gap-2">
                <Radio className={`w-3 h-3 ${isTracking ? "text-cyan-500 animate-pulse" : "text-gray-900"}`} />
                <span className={`text-[10px] font-black uppercase ${isTracking ? "text-cyan-400" : "text-gray-800"}`}>
                  {isTracking ? "Live Broadcast" : isDelivered ? "Mission Terminated" : "Offline"}
                </span>
             </div>
          </div>

          {coords && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 border border-gray-900 p-4 rounded-xl">
                <p className="text-[7px] text-gray-700 uppercase mb-1 font-bold">Latitude</p>
                <p className="text-sm text-white font-black italic">{coords.lat.toFixed(5)}</p>
              </div>
              <div className="bg-black/40 border border-gray-900 p-4 rounded-xl">
                <p className="text-[7px] text-gray-700 uppercase mb-1 font-bold">Longitude</p>
                <p className="text-sm text-white font-black italic">{coords.lng.toFixed(5)}</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-950/10 border border-red-900/30 rounded-2xl flex items-center gap-3 text-red-500 text-[9px] uppercase font-black tracking-tight leading-tight">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={toggleTracking}
          className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-4 shadow-xl border ${
            isTracking 
            ? "bg-red-950/10 text-red-500 border-red-900/30 hover:bg-red-500 hover:text-white" 
            : "bg-cyan-500 text-black border-cyan-400 hover:bg-white"
          }`}
        >
          {isTracking ? <StopCircle className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
          {isTracking ? "Terminate Transit" : "Commence Transit"}
        </button>

        {lastPing && (
          <div className="mt-8 pt-6 border-t border-gray-900/50">
            <p className="text-[8px] text-gray-700 uppercase tracking-widest font-black italic">
              Latest Ledger Synchronization: {lastPing}
            </p>
          </div>
        )}
      </div>

      <footer className="mt-12 opacity-20 flex flex-col items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-gray-600" />
        <p className="text-[7px] uppercase tracking-[0.5em] font-black text-center">SeireiYoki Secure Node // {batchId}</p>
      </footer>

      <style jsx global>{`
        @keyframes sideways {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(310%); }
        }
      `}</style>
    </div>
  );
}