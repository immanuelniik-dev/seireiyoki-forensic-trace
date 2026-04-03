"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Truck, Package, ChevronRight, ShieldCheck, Activity, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function FleetDashboard() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      // BUILD-SAFE CHECK: If no user (happens during Vercel build), exit early
      if (!user || !user.email) {
        setLoading(false);
        return;
      }

      const email = user.email.trim();
      setUserEmail(email);

      // Load trucks owned by this manager
      const { data: fleet } = await supabase
        .from("fleet_trucks")
        .select("*")
        .eq("owner_email", email);

      // Load batches assigned to this manager
      const { data: b } = await supabase
        .from("batches")
        .select("*")
        .eq("fleet_manager_email", email)
        .order("created_at", { ascending: false });

      if (fleet) setTrucks(fleet);
      if (b) setBatches(b);
      setLoading(false);
    }
    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12 border-b border-gray-900 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-cyan-500" />
            <h1 className="text-xl font-black text-white uppercase italic tracking-tighter">Partner Terminal</h1>
          </div>
          <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black">Logged in as: {userEmail}</p>
        </div>
        <button onClick={handleLogout} className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:border-red-900 transition-all text-gray-600 hover:text-red-500">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Consignments */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-[10px] text-cyan-600 font-black uppercase tracking-[0.4em] mb-4">Pending Assignments</h3>
          {batches.length === 0 ? (
            <div className="bg-[#080808] border border-gray-900 rounded-[2rem] p-12 text-center">
              <Package className="w-12 h-12 text-gray-900 mx-auto mb-4" />
              <p className="text-[10px] text-gray-600 uppercase font-black">No active manifests found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {batches.map((batch) => (
                <Link key={batch.id} href={`/fleet/${batch.batch_number}`}>
                  <div className="bg-[#080808] border border-gray-900 p-6 rounded-[2rem] hover:border-cyan-500/50 transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-gray-800">
                        <Package className="w-5 h-5 text-gray-600 group-hover:text-cyan-500 transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{batch.product_name}</h4>
                        <p className="text-[9px] text-gray-600 uppercase mt-1">ID: {batch.batch_number} • From: {batch.origin}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${batch.status === 'In Transit - Sealed' ? 'border-cyan-900 text-cyan-500 bg-cyan-950/10' : 'border-gray-800 text-gray-600'}`}>
                        {batch.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Fleet Summary */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-4">Verified Assets</h3>
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-8">
            <div className="flex items-center gap-4 mb-8">
              <Truck className="w-8 h-8 text-cyan-900" />
              <p className="text-[10px] text-white font-black uppercase tracking-widest">{trucks.length} Registered Trucks</p>
            </div>
            <div className="space-y-4">
              {trucks.map((truck) => (
                <div key={truck.id} className="flex items-center justify-between border-b border-gray-900 pb-4">
                  <span className="text-xs font-black text-gray-400">{truck.plate_number}</span>
                  <span className="text-[8px] text-gray-600 uppercase font-black">{truck.tracker_provider}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}