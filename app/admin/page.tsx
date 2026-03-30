"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  ShieldCheck, Globe, RefreshCcw, 
  LogOut, Lock, ExternalLink, Truck, Search, RotateCcw, AlertTriangle
} from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function AuthenticationControl() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [message, setMessage] = useState("");
  const [exists, setExists] = useState(false);
  
  const [formData, setFormData] = useState({
    batch_number: "",
    product_name: "",
    origin: "", 
    current_location: "Processing Facility",
    status: "Quality Certified"
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
      else setIsAuth(true);
    };
    checkSession();
  }, [router]);

  const checkExistingBatch = useCallback(async (id: string) => {
    if (id.length < 3) return;
    
    const { data } = await supabase
      .from("batches")
      .select("*")
      .eq("batch_number", id.toUpperCase().trim())
      .maybeSingle();

    if (data) {
      setFormData({
        batch_number: data.batch_number,
        product_name: data.product_name || "",
        origin: data.origin || "",
        current_location: data.current_location || "",
        status: data.status || "Quality Certified"
      });
      setExists(true);
      setMessage(data.status === "Audit Verified" ? "NODE EXPIRED: Verification Complete." : "MATCH FOUND: Active Record.");
    } else {
      setExists(false);
      setMessage("");
    }
  }, []);

  const handleReset = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("batches")
      .update({ status: "In Transit - Sealed", current_location: "Transit Authorization Reset" })
      .eq("batch_number", formData.batch_number);
    
    if (!error) {
      setFormData(prev => ({ ...prev, status: "In Transit - Sealed" }));
      setMessage("SUCCESS: Terminal Authorization Restored.");
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "batch_number") checkExistingBatch(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanID = formData.batch_number.toUpperCase().trim();
      const { error } = await supabase
        .from("batches")
        .upsert({ ...formData, batch_number: cleanID, last_updated: new Date().toISOString() }, { onConflict: 'batch_number' });
      if (error) throw error;
      setMessage(`SUCCESS: ${cleanID} updated.`);
      setExists(true);
    } catch (err: any) { setMessage(`ERROR: ${err.message}`); }
    finally { setLoading(false); }
  };

  if (!isAuth) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <header className="mb-10 border-b border-gray-900/60 pb-8 flex justify-between items-center">
        <h1 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
          <Lock className="text-cyan-500 w-5 h-5" /> Authentication <span className="text-cyan-500 font-light">Control</span>
        </h1>
        <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="text-[10px] text-red-900 font-black uppercase tracking-widest">Logout</button>
      </header>

      <div className="max-w-4xl bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 relative shadow-2xl mx-auto overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]"></div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative">
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Consignment ID</label>
              <input required type="text" name="batch_number" value={formData.batch_number} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white uppercase font-black text-xl tracking-tighter focus:border-cyan-600 outline-none transition-all" />
              <Search className={`absolute right-6 top-[55px] w-5 h-5 ${exists ? "text-cyan-500" : "text-gray-900"}`} />
            </div>

            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Classification</label>
              <input required type="text" name="product_name" value={formData.product_name} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white font-bold" />
            </div>

            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">System Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-cyan-500 font-black appearance-none">
                <option value="Quality Certified">01: Origin</option>
                <option value="In Transit - Sealed">02: Transit</option>
                <option value="Audit Verified">03: Handover (EXPIRES LINK)</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Current Location</label>
              <input required type="text" name="current_location" value={formData.current_location} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white" />
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <div className={`text-[9px] font-black tracking-widest uppercase px-4 py-2 rounded-lg border ${formData.status === "Audit Verified" ? "text-red-500 bg-red-950/10 border-red-900/30" : "text-cyan-500 bg-cyan-950/10 border-cyan-900/30"}`}>
                {message || "Terminal Ready"}
              </div>

              {/* ACTION BUTTONS FOR EXPIRED NODES */}
              {formData.status === "Audit Verified" && (
                <button type="button" onClick={handleReset} className="flex items-center gap-2 text-[9px] text-orange-500 hover:text-orange-400 font-black uppercase tracking-widest transition-all">
                  <RotateCcw className="w-3 h-3" /> Reactivate Driver Terminal
                </button>
              )}

              {exists && formData.status !== "Audit Verified" && (
                <Link href={`/driver/${formData.batch_number}`} target="_blank" className="flex items-center gap-2 text-[9px] text-cyan-400 hover:text-white font-black uppercase tracking-widest">
                  <ExternalLink className="w-3 h-3" /> Live Driver Terminal Active
                </Link>
              )}
            </div>

            <button disabled={loading} type="submit" className="w-full md:w-auto bg-cyan-950 hover:bg-cyan-600 text-white px-10 py-5 rounded-2xl uppercase tracking-[0.4em] text-[10px] font-black transition-all active:scale-95 shadow-xl">
              {loading ? "SYNCING..." : exists ? "UPDATE LEDGER" : "CREATE LEDGER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}