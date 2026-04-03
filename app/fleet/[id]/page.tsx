"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { Truck, Play, CheckCircle, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function DispatchTerminal({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.id.toUpperCase();
  
  const [trucks, setTrucks] = useState<any[]>([]);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      // Load this manager's trucks
      const { data: fleet } = await supabase
        .from("fleet_trucks")
        .select("*")
        .eq("owner_email", user?.email);

      // Load current batch status
      const { data: b } = await supabase
        .from("batches")
        .select("status, truck_plate")
        .eq("batch_number", batchId)
        .single();
      
      if (fleet) setTrucks(fleet);
      if (b) {
        setCurrentStatus(b.status);
        setSelectedPlate(b.truck_plate || "");
      }
    }
    init();
  }, [batchId]);

  const handleAction = async (newStatus: string) => {
    // Validation
    if (!selectedPlate && newStatus === "In Transit - Sealed") {
        return alert("Please assign a vehicle plate first.");
    }
    
    setLoading(true);
    console.log(`[DEBUG] Initiating ${newStatus} for Node: ${batchId}`);

    try {
        const truckData = trucks.find(t => t.plate_number === selectedPlate);

        // 1. UPDATE DATABASE & FETCH RECIPIENT DATA
        const { data: batchData, error } = await supabase
          .from("batches")
          .update({ 
            status: newStatus,
            truck_plate: selectedPlate,
            tracker_device_id: truckData?.tracker_device_id,
            last_updated: new Date().toISOString()
          })
          .eq("batch_number", batchId)
          .select() // Get the updated record back
          .single();

        if (error) {
            console.error("[ERROR] Supabase Update:", error.message);
            alert("Database update failed. Check console.");
            setLoading(false);
            return;
        }

        console.log("[DEBUG] Database Update Success:", batchData);
        setCurrentStatus(newStatus);

        // 2. TRIGGER NOTIFICATION API
        // Check for both buyer_email and generic email columns
        const recipientEmail = batchData.buyer_email || batchData.email;

        if (!recipientEmail) {
            console.warn("[WARN] No recipient email found in batch record.");
            alert("Status updated, but no email was sent (Recipient missing).");
        } else {
            console.log("[DEBUG] Triggering API for:", recipientEmail);

            const response = await fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: recipientEmail,
                batchId: batchId,
                type: newStatus === "In Transit - Sealed" ? "DISPATCH" : "COMPLETED",
                productName: batchData.product_name,
                truckPlate: selectedPlate
              })
            });

            const result = await response.json();
            if (result.success) {
                console.log("[DEBUG] Email API Success:", result);
            } else {
                console.error("[ERROR] Email API Failed:", result.error);
            }
        }

    } catch (err) {
        console.error("[CRITICAL] handleAction Crash:", err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 flex flex-col items-center justify-center">
      <Link href="/fleet" className="absolute top-10 left-10 text-[9px] uppercase font-black text-gray-600 flex items-center gap-2 hover:text-cyan-500 transition-all">
        <ArrowLeft className="w-3 h-3" /> Dashboard
      </Link>

      <div className="w-full max-w-md bg-[#080808] border border-gray-900 rounded-[3rem] p-10 shadow-2xl text-center relative overflow-hidden">
        <header className="mb-10">
          <ShieldCheck className="w-12 h-12 text-cyan-900 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Mission Dispatch</h2>
          <p className="text-[9px] text-gray-600 tracking-[0.4em] uppercase mt-2">Node: {batchId}</p>
        </header>

        <div className="space-y-6 text-left mb-10">
          <div>
            <label className="text-[8px] text-gray-600 uppercase font-black tracking-widest ml-2 block mb-2">Assign Fleet Vehicle</label>
            <select 
              disabled={currentStatus === "Audit Verified" || loading}
              value={selectedPlate}
              onChange={(e) => setSelectedPlate(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-2xl py-5 px-6 text-xs text-white font-black outline-none focus:border-cyan-500 appearance-none shadow-inner"
            >
              <option value="">SELECT PLATE NUMBER...</option>
              {trucks.map(t => (
                <option key={t.id} value={t.plate_number}>{t.plate_number} ({t.tracker_provider})</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleAction("In Transit - Sealed")}
            disabled={loading || currentStatus !== "Quality Certified"}
            className="w-full py-6 bg-cyan-500 text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white transition-all disabled:opacity-20 shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start Dispatch
          </button>

          <button
            onClick={() => handleAction("Audit Verified")}
            disabled={loading || currentStatus !== "In Transit - Sealed"}
            className="w-full py-6 bg-transparent border border-red-900/40 text-red-600 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all disabled:opacity-20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Confirm Delivery
          </button>
        </div>

        {currentStatus === "Audit Verified" && (
          <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest animate-pulse">
            Terminal Locked: Handover Complete
          </p>
        )}
      </div>
    </div>
  );
}