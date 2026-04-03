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
  const batchId = resolvedParams.id.trim();
  
  const [trucks, setTrucks] = useState<any[]>([]);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [batchData, setBatchData] = useState<any>(null);
  const [managerEmail, setManagerEmail] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setManagerEmail(user.email);

      // Load this manager's trucks including name/model
      const { data: fleet } = await supabase
        .from("fleet_trucks")
        .select("*")
        .eq("owner_email", user?.email);

      // Load batch status with Case-Insensitive matching
      const { data: b } = await supabase
        .from("batches")
        .select("*")
        .ilike("batch_number", batchId)
        .maybeSingle();
      
      if (fleet) setTrucks(fleet);
      if (b) {
        setBatchData(b);
        setCurrentStatus(b.status);
        setSelectedPlate(b.truck_plate || "");
      }
    }
    init();
  }, [batchId]);

  const handleAction = async (newStatus: string) => {
    if (!selectedPlate && newStatus === "In Transit - Sealed") {
        return alert("Please assign a vehicle plate before dispatch.");
    }
    
    setLoading(true);
    console.log(`[TERMINAL] Initiating ${newStatus} for ${batchId}`);

    try {
        const truckData = trucks.find(t => t.plate_number === selectedPlate);

        // 1. UPDATE DATABASE
        const { data: updatedBatch, error } = await supabase
          .from("batches")
          .update({ 
            status: newStatus,
            truck_plate: selectedPlate,
            tracker_device_id: truckData?.tracker_device_id || null,
            last_updated: new Date().toISOString()
          })
          .ilike("batch_number", batchId)
          .select() 
          .single();

        if (error) throw new Error(error.message);

        setCurrentStatus(newStatus);
        setBatchData(updatedBatch);

        // 2. TRIGGER DUAL-NOTIFICATION (Buyer + Manager CC)
        const recipientEmail = updatedBatch.buyer_email || updatedBatch.email;

        if (recipientEmail) {
            const response = await fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: recipientEmail,
                managerEmail: managerEmail, // Sent to API for CC
                batchId: batchId,
                type: newStatus === "In Transit - Sealed" ? "DISPATCH" : "COMPLETED",
                productName: updatedBatch.product_name,
                truckPlate: selectedPlate
              })
            });

            const result = await response.json();
            if (result.success) {
                alert(`STATION UPDATE: Ledger updated. Documentation sent to ${recipientEmail} and your office.`);
            }
        }

    } catch (err: any) {
        console.error("Terminal Crash:", err);
        alert("Action Failed: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 flex flex-col items-center justify-center">
      <Link href="/fleet" className="absolute top-10 left-10 text-[9px] uppercase font-black text-gray-600 flex items-center gap-2 hover:text-cyan-500 transition-all">
        <ArrowLeft className="w-3 h-3" /> Partner Dashboard
      </Link>

      <div className="w-full max-w-md bg-[#080808] border border-gray-900 rounded-[3rem] p-10 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-900 to-transparent"></div>
        
        <header className="mb-10">
          <ShieldCheck className="w-12 h-12 text-cyan-900 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Mission Dispatch</h2>
          <p className="text-[9px] text-gray-600 tracking-[0.4em] uppercase mt-2">Node: {batchId}</p>
        </header>

        <div className="space-y-6 text-left mb-10">
          <div>
            <label className="text-[8px] text-gray-600 uppercase font-black tracking-widest ml-2 block mb-2">Assign Fleet Vehicle</label>
            <div className="relative">
                <select 
                disabled={currentStatus === "Audit Verified" || loading || !batchData}
                value={selectedPlate}
                onChange={(e) => setSelectedPlate(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-2xl py-5 px-6 text-xs text-white font-black outline-none focus:border-cyan-500 appearance-none shadow-inner cursor-pointer"
                >
                <option value="">SELECT REGISTERED TRUCK...</option>
                {trucks.map(t => (
                    <option key={t.id} value={t.plate_number}>
                        {t.truck_name || 'Heavy Asset'} - {t.plate_number} ({t.model || 'Standard'})
                    </option>
                ))}
                </select>
                <Truck className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => handleAction("In Transit - Sealed")}
            disabled={loading || currentStatus !== "Quality Certified" || !batchData}
            className="w-full py-6 bg-cyan-600 text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white transition-all disabled:opacity-20 shadow-lg shadow-cyan-900/10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Authorize Dispatch
          </button>

          <button
            onClick={() => handleAction("Audit Verified")}
            disabled={loading || currentStatus !== "In Transit - Sealed" || !batchData}
            className="w-full py-6 bg-transparent border border-gray-800 text-gray-500 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:border-emerald-500 hover:text-emerald-500 transition-all disabled:opacity-10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Confirm Delivery
          </button>
        </div>

        {currentStatus === "Audit Verified" && (
          <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.3em] animate-pulse">
            Terminal Locked: Handover Complete
          </p>
        )}
      </div>
    </div>
  );
}