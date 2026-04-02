"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Truck, Navigation, CheckCircle2, FileText, ChevronRight, Activity } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function FleetPortal() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFleetData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("batches")
        .select("*")
        .eq("fleet_manager_email", user.email) // Filters for their specific company
        .order("last_updated", { ascending: false });

      if (data) setBatches(data);
      setLoading(false);
    }
    loadFleetData();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono text-cyan-500 animate-pulse">ACCESSING FLEET ARCHIVES...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <header className="max-w-5xl mx-auto mb-10 flex justify-between items-end border-b border-gray-900 pb-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Fleet Operations</h1>
          <p className="text-[9px] text-cyan-600 font-black uppercase tracking-[0.4em] mt-2">SeireiYoki Verified Partner Portal</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[8px] text-gray-600 uppercase font-black">Managed Nodes</p>
          <p className="text-xl font-black text-white">{batches.length}</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto space-y-4">
        {batches.map((batch) => (
          <div key={batch.batch_number} className="bg-[#080808] border border-gray-900 rounded-[2rem] p-6 hover:border-cyan-900/50 transition-all group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl border ${batch.status === 'Audit Verified' ? 'bg-emerald-950/10 border-emerald-900/20 text-emerald-500' : 'bg-cyan-950/10 border-cyan-900/20 text-cyan-500'}`}>
                  {batch.status === 'Audit Verified' ? <CheckCircle2 className="w-5 h-5" /> : <Activity className="w-5 h-5 animate-spin" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">{batch.product_name}</h3>
                  <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">
                    ID: {batch.batch_number} • {batch.truck_plate || "UNASSIGNED"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link 
                  href={`/fleet/${batch.batch_number}`}
                  className="bg-cyan-500 text-black px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all"
                >
                  Manage Dispatch
                </Link>
                <Link 
                  href={`/batch/${batch.batch_number}`}
                  className="bg-gray-900 text-gray-400 p-2 rounded-lg hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}