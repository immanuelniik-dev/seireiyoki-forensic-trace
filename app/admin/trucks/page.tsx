"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Truck, Plus, Trash2, ShieldCheck, Globe, Key, User, Activity, UserPlus, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function TruckManagement() {
  const router = useRouter();
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [partners, setPartners] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    owner_email: "",
    plate_number: "",
    tracker_device_id: "",
    tracker_provider: "GTrac",
    api_token: ""
  });

  const providers = ["GTrac", "Concept Nova", "AutoTracker Nigeria", "Zasol", "Global GPS", "Other"];

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "admin@seirei.com.ng") {
        router.push("/login");
      } else {
        setIsAuth(true);
        fetchPartners();
      }
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    if (isAuth) fetchTrucks(selectedPartner);
  }, [isAuth, selectedPartner]);

  const fetchPartners = async () => {
    const { data, error } = await supabase
      .from("fleet_trucks")
      .select("owner_email");
    if (data) {
      const uniquePartners = Array.from(new Set(data.map(p => p.owner_email)));
      setPartners(uniquePartners);
    }
    if (error) console.error("Error fetching partners:", error.message);
  };

  async function fetchTrucks(partnerEmail: string | null) {
    setLoading(true);
    let query = supabase.from("fleet_trucks").select("*, payment_due_date").order("created_at", { ascending: false });
    if (partnerEmail) {
      query = query.ilike("owner_email", partnerEmail);
    }
    const { data, error } = await query;
    if (data) setTrucks(data);
    if (error) console.error("Error fetching trucks:", error.message);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("fleet_trucks").insert([formData]);
    
    if (!error) {
      setFormData({ owner_email: "", plate_number: "", tracker_device_id: "", tracker_provider: "GTrac", api_token: "" });
      fetchTrucks(selectedPartner);
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  const deleteTruck = async (id: number) => {
    if (!confirm("Are you sure you want to remove this vehicle from the forensic ledger?")) return;
    await supabase.from("fleet_trucks").delete().eq("id", id);
    fetchTrucks(selectedPartner);
  };

  if (!isAuth) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <header className="max-w-6xl mx-auto mb-10 border-b border-gray-900 pb-8 flex justify-between items-center">
        <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
          <Truck className="text-cyan-500 w-6 h-6" /> Fleet <span className="text-cyan-500 font-light">Onboarding</span>
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-cyan-500 transition-all">
              <ShieldCheck className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/admin/partners/onboard">
            <button className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-cyan-500 transition-all">
              <UserPlus className="w-4 h-4" />
            </button>
          </Link>
          <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-red-500 transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* ADD TRUCK FORM */}
        <div className="lg:col-span-1 bg-[#080808] border border-gray-900 rounded-[2.5rem] p-8 shadow-2xl h-fit">
          <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mb-6 flex items-center gap-2">
            <Plus className="w-3 h-3" /> Register New Asset
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[8px] text-gray-600 uppercase font-black mb-2 block">Fleet Manager Email</label>
              <input required type="email" value={formData.owner_email} onChange={e => setFormData({...formData, owner_email: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl py-4 px-5 text-xs text-white" placeholder="manager@fleet.com" />
            </div>
            <div>
              <label className="text-[8px] text-gray-600 uppercase font-black mb-2 block">Plate Number</label>
              <input required type="text" value={formData.plate_number} onChange={e => setFormData({...formData, plate_number: e.target.value.toUpperCase()})} className="w-full bg-black border border-gray-800 rounded-xl py-4 px-5 text-xs text-white uppercase" placeholder="LAG-123-XY" />
            </div>
            <div>
              <label className="text-[8px] text-gray-600 uppercase font-black mb-2 block">Tracker Provider</label>
              <select value={formData.tracker_provider} onChange={e => setFormData({...formData, tracker_provider: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl py-4 px-5 text-xs text-white appearance-none">
                {providers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-gray-600 uppercase font-black mb-2 block">Device ID (IMEI)</label>
              <input required type="text" value={formData.tracker_device_id} onChange={e => setFormData({...formData, tracker_device_id: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl py-4 px-5 text-xs text-white" placeholder="8624510..." />
            </div>
            <div>
              <label className="text-[8px] text-gray-600 uppercase font-black mb-2 block">Secret API Token</label>
              <input required type="password" value={formData.api_token} onChange={e => setFormData({...formData, api_token: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl py-4 px-5 text-xs text-cyan-500" placeholder="••••••••" />
            </div>
            <button disabled={loading} className="w-full bg-cyan-600 text-black py-4 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-white transition-all">
              {loading ? "Syncing..." : "Add to Garage"}
            </button>
          </form>
        </div>

        {/* TRUCK LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black">Active Fleet Inventory</h3>
            <select 
              value={selectedPartner || ""}
              onChange={(e) => setSelectedPartner(e.target.value || null)}
              className="bg-black border border-gray-800 rounded-xl py-2 px-3 text-xs text-white appearance-none"
            >
              <option value="">All Partners</option>
              {partners.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Activity className="animate-spin text-cyan-500 w-6 h-6" />
            </div>
          ) : trucks.length === 0 ? (
            <p className="text-[9px] text-gray-700 italic">No trucks registered for the selected partner.</p>
          ) : (
            trucks.map((truck) => (
              <div key={truck.id} className="bg-[#080808] border border-gray-900 rounded-3xl p-6 flex items-center justify-between group hover:border-gray-700 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800">
                    <Truck className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase">{truck.plate_number}</h4>
                    <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">
                      Owner: {truck.owner_email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                  <div className="hidden md:block text-right">
                    <p className="text-[8px] text-gray-700 uppercase font-black">Device ID</p>
                    <p className="text-[10px] text-cyan-700 font-black uppercase">{truck.tracker_device_id}</p>
                  </div>
                  <div className="hidden md:block text-right">
                    <p className="text-[8px] text-gray-700 uppercase font-black">API Token</p>
                    <p className="text-[10px] text-cyan-700 font-black uppercase">{truck.api_token ? "********" : "N/A"}</p>
                  </div>
                  <div className="hidden md:block text-right">
                    <p className="text-[8px] text-gray-700 uppercase font-black">Provider</p>
                    <p className="text-[10px] text-cyan-700 font-black uppercase">{truck.tracker_provider}</p>
                  </div>
                  <button onClick={() => deleteTruck(truck.id)} className="text-gray-800 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
