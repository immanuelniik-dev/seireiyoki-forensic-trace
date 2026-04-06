"use client";

import { useEffect, useState, use } from "react"; // Added 'use'
import { createClient } from "@supabase/supabase-js";
import { RefreshCcw, ShieldCheck, Package, MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// 1. Define the Batch Interface so TypeScript knows the columns exist
interface BatchRecord {
  id: string;
  batch_number: string;
  product_name: string;
  status: string;
  milestone1_verified?: boolean;
  milestone2_verified?: boolean;
  milestone3_verified?: boolean;
  [key: string]: any; 
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BatchDetailsPage({ params }: PageProps) {
  // 2. Unwrap params for Next.js 16 compatibility
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [milestoneStatus, setMilestoneStatus] = useState({
    milestone1: false,
    milestone2: false,
    milestone3: false,
  });

  useEffect(() => {
    async function getBatch() {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        const b = data as BatchRecord;
        setBatch(b);
        setMilestoneStatus({
          milestone1: b.milestone1_verified ?? false,
          milestone2: b.milestone2_verified ?? false,
          milestone3: b.milestone3_verified ?? false,
        });
      }
      setLoading(false);
    }
    getBatch();

    // 3. Type-safe Realtime Listener
    const channel = supabase
      .channel(`batch-updates-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "batches", filter: `id=eq.${id}` },
        (payload) => {
          // Cast the new payload to our interface
          const updatedRecord = payload.new as BatchRecord;
          setBatch(updatedRecord);
          setMilestoneStatus({
            milestone1: updatedRecord.milestone1_verified ?? false,
            milestone2: updatedRecord.milestone2_verified ?? false,
            milestone3: updatedRecord.milestone3_verified ?? false,
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><RefreshCcw className="animate-spin text-cyan-500" /></div>;

  if (!batch) return <div className="min-h-screen bg-black text-white flex items-center justify-center uppercase font-black tracking-widest text-[10px]">Record Not Found</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <header className="max-w-4xl mx-auto mb-12 flex justify-between items-center border-b border-gray-900 pb-8">
        <div>
          <h1 className="text-xl font-black text-white uppercase italic tracking-tighter">Batch <span className="text-cyan-500">Forensics</span></h1>
          <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">UUID: {batch.id}</p>
        </div>
        <Link href="/admin">
          <button className="px-6 py-2 border border-gray-900 rounded-xl text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all">
            Terminal
          </button>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#080808] border border-gray-900 rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-950/20 border border-cyan-900/30 rounded-xl text-cyan-500">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 uppercase font-black">Consignment</p>
              <h2 className="text-white font-black uppercase italic">{batch.product_name}</h2>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-900">
             <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-600 uppercase font-bold">Ledger ID</span>
                <span className="text-[10px] text-white font-mono">{batch.batch_number}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-600 uppercase font-bold">Current Status</span>
                <span className="text-[10px] text-cyan-500 font-black uppercase">{batch.status}</span>
             </div>
          </div>
        </div>

        <div className="bg-[#080808] border border-gray-900 rounded-[2rem] p-8 space-y-6">
          <h3 className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-4">Milestone Verification</h3>
          <div className="space-y-4">
            {[
              { id: 1, label: "Quality Audit", status: milestoneStatus.milestone1 },
              { id: 2, label: "Logistics Sealed", status: milestoneStatus.milestone2 },
              { id: 3, label: "Terminal Handover", status: milestoneStatus.milestone3 }
            ].map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-black rounded-2xl border border-gray-900">
                <span className="text-[10px] font-black uppercase text-gray-400">{m.label}</span>
                {m.status ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-800" />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}