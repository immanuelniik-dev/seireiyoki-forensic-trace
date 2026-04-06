"use client";

import { useState, useEffect, use, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Truck, Play, CheckCircle, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setManagerEmail(user.email);
        setIsAdmin(user.email === "admin@seirei.com.ng");
      }

      // Load this manager\"s trucks including name/model
      const { data: fleet } = await supabase
        .from("fleet_trucks")
        .select("*")
        .ilike("owner_email", user?.email || "");

      // Load batch status with Case-Insensitive matching
      const { data: b } = await supabase
        .from("batches")
        .select("*")
        .ilike("batch_number", `%${batchId}%`)
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
          .ilike("batch_number", `%${batchId}%`)
          .select() 
          .single();

        if (error) throw new Error(error.message);

        setCurrentStatus(newStatus);
        setBatchData(updatedBatch);

        // 2. TRIGGER DUAL-NOTIFICATION (Buyer + Manager CC)
        const recipientEmail = updatedBatch.buyer_email || updatedBatch.email;

        if (recipientEmail) {
            const response = await fetch("/api/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
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

  const generatePdfReport = async () => {
    const startDate = startDateRef.current?.value;
    const endDate = endDateRef.current?.value;

    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    const { data: deliveries, error } = await supabase
      .from("batches")
      .select("batch_number, product_name, driver_name, start_time, delivery_time, tracking_milestones")
      .ilike("fleet_manager_email", managerEmail)
      .gte("start_time", startDate)
      .lte("delivery_time", endDate);

    if (error) {
      console.error("Error fetching deliveries:", error);
      alert("Error fetching deliveries: " + error.message);
      return;
    }

    const doc = new jsPDF();
    
    (doc as any).autoTable({
      head: [["Batch ID", "Product Name", "Driver", "Start Time", "Delivery Time", "Tracking Milestones"]],
      body: deliveries?.map((delivery: any) => [
        delivery.batch_number,
        delivery.product_name,
        delivery.driver_name || "N/A",
        new Date(delivery.start_time).toLocaleString(),
        delivery.delivery_time ? new Date(delivery.delivery_time).toLocaleString() : "N/A",
        JSON.parse(delivery.tracking_milestones || "[]").map((m: any) => `${m.status} at ${new Date(m.timestamp).toLocaleString()}`).join("\n")
      ]),
      startY: 20,
      headStyles: { fillColor: [52, 58, 64] },
      styles: { fontSize: 8, cellPadding: 3, textColor: [240, 240, 240] },
      bodyStyles: { fillColor: [24, 26, 27] },
      alternateRowStyles: { fillColor: [33, 37, 41] },
      theme: 'grid',
      didDrawPage: function (data: any) {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Page ${data.pageNumber} of ${doc.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save("delivery_report.pdf");
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

        {isAdmin && batchData && ( // Admin override section
            <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl mb-6">
                <p className="text-[8px] text-red-400 uppercase font-black tracking-widest mb-3">Admin Override Controls</p>
                <button 
                    onClick={() => handleAction("Audit Verified")}
                    disabled={loading || currentStatus === "Audit Verified"}
                    className="w-full py-3 bg-red-800/30 border border-red-700/50 text-red-400 text-[10px] uppercase font-bold rounded-lg hover:bg-red-700/50 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                >
                    <CheckCircle className="w-3 h-3" /> Force Confirm Delivery
                </button>
            </div>
        )}

        <div className="space-y-6 text-left mb-10">
          <div>
            <label className="text-[8px] text-gray-600 uppercase font-black tracking-widest ml-2 block mb-2">Assign Fleet Vehicle</label>
            <div className="relative">
                <select 
                disabled={currentStatus === "Audit Verified" || loading || !batchData || (!isAdmin && managerEmail !== batchData?.fleet_manager_email)}
                value={selectedPlate}
                onChange={(e) => setSelectedPlate(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-2xl py-5 px-6 text-xs text-white font-black outline-none focus:border-cyan-500 appearance-none shadow-inner cursor-pointer"
                >
                <option value="">SELECT REGISTERED TRUCK...</option>
                {trucks.map(t => (
                    <option key={t.id} value={t.plate_number}>
                        {t.truck_name || "Heavy Asset"} - {t.plate_number} ({t.model || "Standard"})
                    </option>
                ))}
                </select>
                <Truck className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => handleAction("In Transit - Sealed")}
            disabled={loading || currentStatus !== "Quality Certified" || !batchData || (!isAdmin && managerEmail !== batchData?.fleet_manager_email)}
            className="w-full py-6 bg-cyan-600 text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white transition-all disabled:opacity-20 shadow-lg shadow-cyan-900/10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Authorize Dispatch
          </button>

          <button
            onClick={() => handleAction("Audit Verified")}
            disabled={loading || currentStatus !== "In Transit - Sealed" || !batchData || (!isAdmin && managerEmail !== batchData?.fleet_manager_email)}
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

        {/* PDF Delivery Report Section */}
        <div className="mt-10 pt-10 border-t border-gray-900">
          <h3 className="text-sm font-black text-white uppercase mb-4">Download Delivery Report</h3>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <label htmlFor="startDate" className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Start Date:</label>
              <input type="date" id="startDate" ref={startDateRef} className="bg-black border border-gray-800 rounded-lg p-2 text-xs text-white" />
            </div>
            <div className="flex items-center space-x-4">
              <label htmlFor="endDate" className="text-[9px] text-gray-600 uppercase font-black tracking-widest">End Date:</label>
              <input type="date" id="endDate" ref={endDateRef} className="bg-black border border-gray-800 rounded-lg p-2 text-xs text-white" />
            </div>
            <button
              onClick={generatePdfReport}
              className="w-full py-4 bg-cyan-600 text-black rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white transition-all disabled:opacity-20 shadow-lg shadow-cyan-900/10"
            >
              Generate PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
