"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  ShieldCheck, Activity, ArrowLeft, 
  Truck, CheckCircle2, 
  Circle, Share2, Lock, Globe, Clock, MapPin, List, Radio, ToggleRight, UserCircle
} from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Dynamic import for the map to prevent SSR issues
const LiveMap = dynamic(() => import("@/components/LiveMap"), { 
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [milestoneStatus, setMilestoneStatus] = useState<{[key: string]: boolean}>({ 
    milestone1: false, 
    milestone2: false, 
    milestone3: false 
  });

  useEffect(() => {
    Promise.resolve(params).then((res) => setUnwrappedParams(res));
  }, [params]);

  useEffect(() => {
    if (!unwrappedParams?.id) return;
    const batchId = unwrappedParams.id.toUpperCase().trim();

    async function fetchInitialData() {
      const { data: batchData } = await supabase
        .from("batches")
        .select("*")
        .ilike("batch_number", `%${batchId}%`)
        .maybeSingle();
      
      if (batchData) {
        setBatch(batchData);
        // Initialize milestone status based on batch data or defaults
        setMilestoneStatus({
          milestone1: batchData.milestone1_verified ?? false,
          milestone2: batchData.milestone2_verified ?? false,
          milestone3: batchData.milestone3_verified ?? false,
        });
      }

      const { data: historyData } = await supabase
        .from("location_logs")
        .select("*")
        .ilike("batch_number", `%${batchId}%`)
        .order("created_at", { ascending: true });
      
      if (historyData) setHistory(historyData);
      setLoading(false);
    }

    fetchInitialData();

    // Check admin status
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === "admin@seirei.com.ng");
    }
    checkAdmin();

    // Real-time Subscriptions
    const channel = supabase
      .channel(`live-${batchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "batches", filter: `batch_number=eq.${batchId}` }, 
        (payload) => {
          setBatch(payload.new);
          setMilestoneStatus({
            milestone1: payload.new.milestone1_verified ?? false,
            milestone2: payload.new.milestone2_verified ?? false,
            milestone3: payload.new.milestone3_verified ?? false,
          });
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "location_logs", filter: `batch_number=eq.${batchId}` }, 
        (payload) => {
          setHistory(prev => [...prev, payload.new]);
          setBatch((prev: any) => ({ ...prev, lat: payload.new.lat, lng: payload.new.lng }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [unwrappedParams]);

  // Milestone Automation Logic
  useEffect(() => {
    if (batch) {
      const newMilestoneStatus = { ...milestoneStatus };
      // const lastUpdated = new Date(batch.last_updated);

      // Milestone 1 (Dispatch)
      if (["In Transit - Sealed", "Audit Verified"].includes(batch.status)) {
        newMilestoneStatus.milestone1 = true;
      }

      // Milestone 2 & 3 (Delivery & Final Audit)
      if (batch.status === "Audit Verified") {
        newMilestoneStatus.milestone2 = true;
        newMilestoneStatus.milestone3 = true;
      }
      setMilestoneStatus(newMilestoneStatus);
    }
  }, [batch?.status, batch?.last_updated]);

  // Manual Override Toggle
  const handleManualToggle = async (milestone: string) => {
    if (!isAdmin || !batch) return;

    const newStatus = !milestoneStatus[milestone];
    setMilestoneStatus(prev => ({ ...prev, [milestone]: newStatus }));

    // Update Supabase (assuming a `milestoneX_verified` column exists)
    // This part would need to be adapted if the column names are different
    await supabase
      .from("batches")
      .update({ [`${milestone}_verified`]: newStatus, [`${milestone}_verified_at`]: newStatus ? new Date().toISOString() : null })
      .eq("batch_number", batch.batch_number);
  };

  // Geocoding Logic
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

  const milestones = [
    { label: "Dispatch", key: "milestone1", autoVerified: ["In Transit - Sealed", "Audit Verified"].includes(batch.status) },
    { label: "Delivery", key: "milestone2", autoVerified: batch.status === "Audit Verified" },
    { label: "Final Audit", key: "milestone3", autoVerified: batch.status === "Audit Verified" },
  ];

  const currentActiveMilestoneIndex = milestones.findIndex(m => !milestoneStatus[m.key]);

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: 'numeric', 
      second: 'numeric', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      timeZone: 'Africa/Lagos' // WAT (West Africa Time)
    });
  };

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
              <button onClick={() => setShowHistory(false)} className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${!showHistory ? "bg-cyan-500 text-black border-cyan-400" : "border-gray-900"}`}>Current Location</button>
              <button onClick={() => setShowHistory(true)} className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${showHistory ? "bg-cyan-500 text-black border-cyan-400" : "border-gray-900"}`}>History ({history.length})</button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 space-y-12">
            <h3 className="text-[10px] text-gray-500 uppercase font-black border-b border-gray-900 pb-4">Forensic Supply Chain Trail</h3>
            
            <div className="space-y-10">
              {milestones.map((milestone, idx) => (
                <div key={idx} className={`relative pl-12 ${milestoneStatus[milestone.key] ? "opacity-100" : "opacity-50"}`}>
                  <div className="absolute left-0 top-0">
                    {milestoneStatus[milestone.key] ? (
                      <CheckCircle2 className="text-emerald-500 w-6 h-6" />
                    ) : (
                      <Circle className={`text-gray-600 w-6 h-6 ${idx === currentActiveMilestoneIndex && !milestoneStatus[milestone.key] ? "animate-pulse text-cyan-500" : ""}`} />
                    )}
                  </div>
                  <p className="text-[8px] uppercase font-black text-gray-600">{milestone.label}</p>
                  <h4 className="text-xl font-black italic text-white uppercase">
                    {milestone.key === "milestone1" ? batch.origin : 
                     milestone.key === "milestone2" ? batch.current_location : 
                     milestone.key === "milestone3" ? "Audit Verified" : "Pending"}
                  </h4>
                  <p className="text-[7px] text-gray-500 italic">Verification Date: {formatTimestamp(batch[`${milestone.key}_verified_at`] || (milestoneStatus[milestone.key] ? batch.last_updated : null))}</p>
                  {isAdmin && (
                    <div className="flex items-center gap-2 mt-2 text-gray-500">
                      <ToggleRight 
                        className={`w-4 h-4 cursor-pointer ${milestoneStatus[milestone.key] ? "text-emerald-500" : "text-gray-600"}`}
                        onClick={() => handleManualToggle(milestone.key)}
                      />
                      <span className="text-[7px] uppercase">Manual Override</span>
                    </div>
                  )}
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
