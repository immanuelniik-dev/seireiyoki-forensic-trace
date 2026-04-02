"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Truck, Plus, Trash2, ShieldCheck, Globe, Key, User } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function TruckManagement() {
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    owner_email: "",
    plate_number: "",
    tracker_device_id: "",
    tracker_provider: "GTrac",
    api_token: ""
  });

  const providers = ["GTrac", "Concept Nova", "AutoTracker Nigeria", "Zasol", "Global GPS", "Other"];

  useEffect(() => {
    fetchTrucks();
  }, []);

  async function fetchTrucks() {
    const { data } = await supabase.from("fleet_trucks").select("*").order("created_at", { ascending: false });
    if (data) setTrucks(data);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("fleet_trucks").insert([formData]);
    
    if (!error) {
      setFormData({ owner_email: "", plate_number: "", tracker_device_id: "", tracker_provider: "GTrac", api_token: "" });
      fetchTrucks();
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  const deleteTruck = async (id: number) => {
    if (!confirm("Are you sure you want to remove this vehicle from the forensic ledger?")) return;
    await supabase.from("fleet_trucks").delete().eq("id", id);
    fetchTrucks();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <header className="max-w-6xl mx-auto mb-10 border-b border-gray-900 pb-8">
        <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
          <Truck className="text-cyan-500 w-6 h-6" /> Fleet <span className="text-cyan-500 font-light">Onboarding</span>
        </h1>
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
          <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mb-6">Active Fleet Inventory</h3>
          {trucks.map((truck) => (
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
                  <p className="text-[8px] text-gray-700 uppercase font-black">Provider</p>
                  <p className="text-[10px] text-cyan-700 font-black uppercase">{truck.tracker_provider}</p>
                </div>
                <button onClick={() => deleteTruck(truck.id)} className="text-gray-800 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}