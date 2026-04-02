"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Truck, LogOut, Activity, ChevronRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function FleetPortal() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadFleetData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login"); // Redirect if not logged in
        return;
      }

      setUserEmail(user.email ?? null);

      // IMPORTANT: The RLS we set up earlier ensures this query 
      // ONLY returns batches where fleet_manager_email === user.email
      const { data } = await supabase
        .from("batches")
        .select("*")
        .eq("fleet_manager_email", user.email) 
        .order("last_updated", { ascending: false });

      if (data) setBatches(data);
      setLoading(false);
    }
    loadFleetData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Activity className="w-8 h-8 text-cyan-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <header className="max-w-5xl mx-auto mb-10 flex justify-between items-start border-b border-gray-900 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <ShieldCheck className="w-4 h-4 text-cyan-500" />
             <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Authorized Fleet Access</span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Mission Control</h1>
          <p className="text-[9px] text-cyan-600 font-black uppercase tracking-[0.4em] mt-1">{userEmail}</p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="bg-red-950/20 text-red-500 border border-red-900/30 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-black transition-all flex items-center gap-2"
        >
          <LogOut className="w-3 h-3" /> Terminate
        </button>
      </header>

      <div className="max-w-5xl mx-auto space-y-4">
        {batches.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-900 rounded-[2rem]">
            <Truck className="w-12 h-12 text-gray-800 mx-auto mb-4" />
            <p className="text-[10px] text-gray-600 uppercase font-black">No active dispatches assigned to this node.</p>
          </div>
        ) : (
          batches.map((batch) => (
            <div key={batch.batch_number} className="bg-[#080808] border border-gray-900 rounded-[2rem] p-6 hover:border-cyan-900/50 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                   <div className={`p-4 rounded-2xl border ${batch.status === 'Audit Verified' ? 'bg-emerald-950/10 border-emerald-900/20 text-emerald-500' : 'bg-cyan-950/10 border-cyan-900/20 text-cyan-500'}`}>
                    {batch.status === 'Audit Verified' ? <CheckCircle2 className="w-5 h-5" /> : <Activity className="w-5 h-5 animate-spin" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{batch.product_name}</h3>
                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">
                      ID: {batch.batch_number} • {batch.truck_plate || "Awaiting Selection"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link 
                    href={`/fleet/${batch.batch_number}`}
                    className="bg-cyan-500 text-black px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-cyan-500/10"
                  >
                    Control Terminal
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}