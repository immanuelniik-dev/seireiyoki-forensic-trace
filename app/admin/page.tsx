"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
// FIXED: Added AlertTriangle to the imports
import { ShieldAlert, Plus, Save, Server, Wheat, Droplets, Activity, CheckCircle, RefreshCcw, AlertTriangle } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminControlRoom() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const [formData, setFormData] = useState({
    batch_number: "",
    product_name: "Industrial Wheat Bran",
    origin: "", 
    current_location: "Mill Gate",
    status: "Quality Certified",
    protein_percent: "14.5",
    moisture_percent: "12.5"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Syncing to Forensic Ledger...");

    try {
      const cleanBatchNumber = formData.batch_number.toUpperCase().trim();

      const { error } = await supabase
        .from("batches")
        .upsert(
          {
            batch_number: cleanBatchNumber,
            product_name: formData.product_name,
            origin: formData.origin,
            current_location: formData.current_location,
            status: formData.status,
            protein_percent: formData.protein_percent ? parseFloat(formData.protein_percent) : null,
            moisture_percent: formData.moisture_percent ? parseFloat(formData.moisture_percent) : null,
            last_updated: new Date().toISOString(),
          },
          { onConflict: 'batch_number' } 
        );

      if (error) {
        // Detailed error logging
        console.error("Supabase Error Details:", error);
        throw new Error(error.message || "Database connection failed");
      }
      
      setMessage(`SUCCESS: ${cleanBatchNumber} synchronized.`);
    } catch (error: any) {
      console.error("Database Sync Error:", error);
      setMessage(`ERROR: ${error.message || "Check your Supabase column names"}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12 selection:bg-red-900 selection:text-white">
      
      <header className="mb-10 border-b border-red-900/40 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter flex items-center gap-3 uppercase">
            <ShieldAlert className="text-red-500 w-8 h-8 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            ADMIN <span className="text-red-500 font-light italic">COMMAND</span>
          </h1>
          <p className="text-[10px] text-red-700 mt-2 uppercase tracking-[0.4em] font-black">
            SeireiYoki Audit Protocol v2.6
          </p>
        </div>
      </header>

      <div className="max-w-4xl bg-[#0c0c0c] border border-gray-800 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-900 to-red-600"></div>
        
        <h2 className="text-lg text-white mb-8 flex items-center gap-3 font-bold tracking-widest uppercase italic">
          <Wheat className="w-5 h-5 text-red-600" />
          Update Bran Allocation
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2 font-bold">Existing or New Batch ID</label>
              <input required type="text" name="batch_number" value={formData.batch_number} onChange={handleChange} placeholder="e.g. BR-0033" className="w-full bg-[#050505] border border-gray-800 rounded-lg py-4 px-4 text-white focus:border-red-500 transition-all uppercase font-black text-xl tracking-tighter" />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2 font-bold">Forensic Transit Node</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-lg py-4 px-4 text-cyan-500 focus:border-cyan-500 transition-all appearance-none cursor-pointer font-black tracking-widest">
                <option value="Quality Certified">01: Source Facility (Mill)</option>
                <option value="In Transit - Sealed">02: Transit Security (Road)</option>
                <option value="Delivered - Awaiting Audit">03: Audit Checkpoint (Hub)</option>
                <option value="Audit Verified">04: Final Off-Take (Farm)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2 font-bold">Physical Hub Name</label>
              <input required type="text" name="current_location" value={formData.current_location} onChange={handleChange} placeholder="e.g. Apapa Gate" className="w-full bg-[#050505] border border-gray-800 rounded-lg py-4 px-4 text-white" />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2 font-bold">Milling Partner</label>
              <input required type="text" name="origin" value={formData.origin} onChange={handleChange} placeholder="e.g. Honeywell" className="w-full bg-[#050505] border border-gray-800 rounded-lg py-4 px-4 text-white" />
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-6 p-6 bg-[#080808] border border-gray-900 rounded-xl">
              <div>
                <label className="text-[10px] text-cyan-600 uppercase tracking-widest block mb-2 flex items-center gap-2 font-black">
                  <Activity className="w-3 h-3" /> Crude Protein %
                </label>
                <input step="0.1" type="number" name="protein_percent" value={formData.protein_percent} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-lg py-3 px-4 text-white font-black" />
              </div>
              <div>
                <label className="text-[10px] text-emerald-600 uppercase tracking-widest block mb-2 flex items-center gap-2 font-black">
                  <Droplets className="w-3 h-3" /> Moisture %
                </label>
                <input step="0.1" type="number" name="moisture_percent" value={formData.moisture_percent} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-lg py-3 px-4 text-white font-black" />
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className={`text-[10px] font-black tracking-[0.2em] uppercase px-4 py-2 rounded flex items-center gap-2 ${message.includes('ERROR') ? 'text-red-500 bg-red-950/20' : 'text-emerald-500'}`}>
              {message && (message.includes('ERROR') ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />)}
              {message || "Terminal Ready"}
            </div>
            <button disabled={loading} type="submit" className="w-full md:w-auto bg-red-950 hover:bg-red-800 text-red-200 border border-red-700 px-12 py-5 rounded-xl uppercase tracking-[0.3em] text-sm font-black flex items-center justify-center gap-4 transition-all active:scale-95 shadow-[0_10px_30px_rgba(153,27,27,0.3)]">
              {loading ? <Save className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {loading ? "SYNCING..." : "CONFIRM AUDIT UPDATE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}