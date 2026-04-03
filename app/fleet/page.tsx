"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Truck, Package, ChevronRight, ShieldCheck, Activity, LogOut, History, Info } from "lucide-react";
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
  const [companyName, setCompanyName] = useState("");
  const [selectedTruckLogs, setSelectedTruckLogs] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) { setLoading(false); return; }

      const email = user.email.trim();
      setUserEmail(email);

      // Load trucks & Company Info
      const { data: fleet } = await supabase
        .from("fleet_trucks")
        .select("*")
        .eq("owner_email", email);

      // Load all batches
      const { data: b } = await supabase
        .from("batches")
        .select("*")
        .eq("fleet_manager_email", email)
        .order("created_at", { ascending: false });

      if (fleet && fleet.length > 0) {
        setTrucks(fleet);
        setCompanyName(fleet[0].company_name || "Authorized Logistics Partner");
      }
      if (b) setBatches(b);
      setLoading(false);
    }
    init();
  }, []);

  const fetchTruckHistory = async (plate: string) => {
    setViewingHistory(plate);
    const { data } = await supabase
      .from("batches")
      .select("batch_number, product_name, status, last_updated")
      .eq("truck_plate", plate)
      .eq("status", "Audit Verified") // Only show completed deliveries
      .order("last_updated", { ascending: false });
    
    setSelectedTruckLogs(data || []);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Activity className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <header className="max-w-6xl mx-auto flex justify-between items-end mb-12 border-b border-gray-900 pb-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">{companyName}</h1>
          <p className="text-[10px] text-cyan-500 uppercase tracking-[0.3em] font-bold">Logged in as: {userEmail}</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-red-500 transition-all">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Active Dispatches */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Live Operations
          </h3>
          {batches.filter(b => b.status !== "Audit Verified").map((batch) => (
            <Link key={batch.id} href={`/fleet/${batch.batch_number}`}>
              <div className="bg-[#080808] border border-gray-900 p-6 rounded-[2rem] hover:border-cyan-500 transition-all group flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-black border border-gray-800 rounded-xl group-hover:text-cyan-500"><Package className="w-5 h-5" /></div>
                    <div>
                        <h4 className="text-white font-black uppercase italic">{batch.product_name}</h4>
                        <p className="text-[9px] text-gray-600 uppercase">Node: {batch.batch_number} • {batch.status}</p>
                    </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-white" />
              </div>
            </Link>
          ))}
        </div>

        {/* Right: Fleet Assets & Logs */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <Truck className="w-3 h-3" /> Fleet Registry
          </h3>
          
          <div className="space-y-4">
            {trucks.map((truck) => (
              <div key={truck.id} className="bg-[#080808] border border-gray-900 rounded-[2rem] overflow-hidden">
                <div 
                  onClick={() => fetchTruckHistory(truck.plate_number)}
                  className="p-6 cursor-pointer hover:bg-white/5 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-950/10 border border-cyan-900/30 rounded-xl text-cyan-500"><Truck className="w-5 h-5" /></div>
                    <div>
                      <h4 className="text-white font-black uppercase leading-tight">{truck.truck_name || "Heavy Duty Asset"}</h4>
                      <p className="text-[10px] text-gray-500 font-bold">{truck.plate_number} • {truck.model || 'Standard'}</p>
                    </div>
                  </div>
                  <History className={`w-4 h-4 ${viewingHistory === truck.plate_number ? 'text-cyan-500' : 'text-gray-800'}`} />
                </div>

                {/* Expanded Log History */}
                {viewingHistory === truck.plate_number && (
                  <div className="bg-black/50 border-t border-gray-900 p-6 space-y-4">
                    <p className="text-[8px] text-cyan-800 font-black uppercase tracking-widest mb-2">Delivery Ledger History</p>
                    {selectedTruckLogs.length === 0 ? (
                      <p className="text-[9px] text-gray-700 italic">No completed missions recorded for this asset.</p>
                    ) : (
                      selectedTruckLogs.map(log => (
                        <div key={log.batch_number} className="flex justify-between items-center border-b border-gray-900 pb-3">
                          <div>
                            <p className="text-[10px] text-gray-300 font-bold uppercase">{log.product_name}</p>
                            <p className="text-[8px] text-gray-600">ID: {log.batch_number}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] text-emerald-500 font-black uppercase tracking-tighter">Verified</p>
                            <p className="text-[7px] text-gray-700">{new Date(log.last_updated).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}