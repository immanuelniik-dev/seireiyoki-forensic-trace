"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShieldAlert, Plus, Save, Server, Trash2 } from "lucide-react";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminControlRoom() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    batch_number: "",
    product_name: "",
    origin: "",
    current_location: "",
    status: "Cleared Customs",
    protein_percent: "",
    moisture_percent: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Syncing to Ledger...");

    try {
      const { error } = await supabase.from("batches").insert([
        {
          batch_number: formData.batch_number.toUpperCase(),
          product_name: formData.product_name,
          origin: formData.origin,
          current_location: formData.current_location,
          status: formData.status,
          protein_percent: formData.protein_percent ? parseFloat(formData.protein_percent) : null,
          moisture_percent: formData.moisture_percent ? parseFloat(formData.moisture_percent) : null,
        }
      ]);

      if (error) throw error;
      
      setMessage("SUCCESS: Batch encoded to Forensic Ledger.");
      // Reset form
      setFormData({
        batch_number: "", product_name: "", origin: "", current_location: "", status: "Cleared Customs", protein_percent: "", moisture_percent: ""
      });
    } catch (error: any) {
      setMessage(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 5000); // Clear message after 5s
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono selection:bg-red-900 selection:text-red-100 p-6 md:p-12">
      
      <header className="mb-10 border-b border-red-900/40 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter flex items-center gap-3">
            <ShieldAlert className="text-red-500 w-8 h-8 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            COMMAND <span className="text-red-500 font-light">CENTER</span>
          </h1>
          <p className="text-xs text-red-700 mt-2 uppercase tracking-[0.3em] font-semibold">
            Authorized Personnel Only
          </p>
        </div>
      </header>

      <div className="max-w-3xl bg-[#0c0c0c] border border-gray-800 rounded-xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 shadow-[0_0_20px_rgba(239,68,68,1)]"></div>
        
        <h2 className="text-xl text-white mb-6 flex items-center gap-2">
          <Server className="w-5 h-5 text-gray-500" />
          ENCODE NEW BATCH
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Batch ID */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Batch ID</label>
              <input required type="text" name="batch_number" value={formData.batch_number} onChange={handleChange} placeholder="e.g. DE-9902" className="w-full bg-[#050505] border border-gray-800 rounded py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors uppercase" />
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Product Name</label>
              <input required type="text" name="product_name" value={formData.product_name} onChange={handleChange} placeholder="e.g. Toxin Binder Plus" className="w-full bg-[#050505] border border-gray-800 rounded py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors" />
            </div>

            {/* Origin */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Origin Port</label>
              <input required type="text" name="origin" value={formData.origin} onChange={handleChange} placeholder="e.g. Hamburg, Germany" className="w-full bg-[#050505] border border-gray-800 rounded py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors" />
            </div>

            {/* Current Location */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Current Location</label>
              <input required type="text" name="current_location" value={formData.current_location} onChange={handleChange} placeholder="e.g. Apapa Terminal" className="w-full bg-[#050505] border border-gray-800 rounded py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors" />
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Transit Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors appearance-none">
                <option value="Cleared Customs">Cleared Customs</option>
                <option value="In Transit to Mill">In Transit to Mill</option>
                <option value="Arrived at Facility">Arrived at Facility</option>
                <option value="Audit Flag - Quarantined">Audit Flag - Quarantined</option>
              </select>
            </div>

            {/* Nutritional Spec (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Protein %</label>
                <input type="number" step="0.1" name="protein_percent" value={formData.protein_percent} onChange={handleChange} placeholder="14.5" className="w-full bg-[#050505] border border-gray-800 rounded py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Moisture %</label>
                <input type="number" step="0.1" name="moisture_percent" value={formData.moisture_percent} onChange={handleChange} placeholder="11.2" className="w-full bg-[#050505] border border-gray-800 rounded py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors" />
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-gray-900 flex items-center justify-between">
            <span className={`text-sm tracking-widest uppercase ${message.includes('ERROR') ? 'text-red-500' : 'text-emerald-500'}`}>
              {message}
            </span>
            <button disabled={loading} type="submit" className="bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 px-8 py-3 rounded uppercase tracking-widest text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50">
              {loading ? <Save className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? "Encoding..." : "Inject to Ledger"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}